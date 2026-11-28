<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Http\Controllers\PasswordResetOtpController;
use App\Mail\PasswordResetOtpMail;
use App\Models\PasswordResetOtp;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Routing\Middleware\ThrottleRequests;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Group;
use RuntimeException;
use Symfony\Component\Process\Process;
use Tests\TestCase;

use function Illuminate\Support\defer;

class PasswordResetOtpTest extends TestCase
{
    use RefreshDatabase;

    private function issueCode(User $user): string
    {
        $this->postJson('/api/password-reset/request', ['email' => $user->email])
            ->assertAccepted()->assertJsonStructure(['expires_at', 'resend_after']);

        $code = '';
        Mail::assertSent(PasswordResetOtpMail::class, function (PasswordResetOtpMail $mail) use (&$code, $user): bool {
            if (! $mail->hasTo($user->email)) {
                return false;
            }
            $code = $mail->code;

            return true;
        });

        return $code;
    }

    public function test_nonexistent_email_does_not_disclose_account_or_send_mail(): void
    {
        Mail::fake();
        $this->postJson('/api/password-reset/request', ['email' => 'missing@example.test'])
            ->assertAccepted()->assertJsonStructure(['expires_at', 'resend_after']);
        Mail::assertNothingSent();
    }

    public function test_hash_storage_and_single_use_password_change_revoke_sessions(): void
    {
        Mail::fake();
        $user = User::factory()->create();
        $token = $user->createToken('phone')->plainTextToken;
        $rememberToken = $user->getRememberToken();
        $otherUser = User::factory()->create();
        $otherUser->createToken('other phone');
        foreach ([$user, $otherUser] as $sessionUser) {
            DB::table('sessions')->insert([
                'id' => 'session-'.$sessionUser->id, 'user_id' => $sessionUser->id,
                'payload' => '', 'last_activity' => time(),
            ]);
        }
        DB::table('password_reset_tokens')->insert(['email' => $user->email, 'token' => 'legacy']);
        $code = $this->issueCode($user);
        $this->assertMatchesRegularExpression('/^\d{6}$/', $code);
        $record = PasswordResetOtp::query()->where('user_id', $user->id)->firstOrFail();
        $this->assertNotSame($code, $record->code_hash);
        $this->assertSame(64, strlen($record->code_hash));

        $payload = ['email' => $user->email, 'code' => $code];
        $this->postJson('/api/password-reset/verify', $payload)->assertNoContent();
        $this->assertNull($record->fresh()->consumed_at);
        $this->postJson('/api/password-reset/confirm', [
            ...$payload,
            'password' => 'NewPassword123!',
            'password_confirmation' => 'NewPassword123!',
        ])->assertNoContent();

        $this->assertTrue(Hash::check('NewPassword123!', $user->fresh()->getAuthPassword()));
        $this->assertNotNull($record->fresh()->consumed_at);
        $this->assertSame(0, $user->tokens()->count());
        $this->assertSame(1, $otherUser->tokens()->count());
        $this->assertNotSame($rememberToken, $user->fresh()->getRememberToken());
        $this->assertDatabaseMissing('sessions', ['user_id' => $user->id]);
        $this->assertDatabaseHas('sessions', ['user_id' => $otherUser->id]);
        $this->assertDatabaseMissing('password_reset_tokens', ['email' => $user->email]);
        $this->forgetAuthenticatedUser();
        $this->withToken($token)->getJson('/api/profile')->assertUnauthorized();
        $this->postJson('/api/password-reset/verify', $payload)
            ->assertUnprocessable()->assertJsonValidationErrors('code');
        $this->postJson('/api/password-reset/confirm', [
            ...$payload,
            'password' => 'AnotherPassword123!',
            'password_confirmation' => 'AnotherPassword123!',
        ])->assertUnprocessable()->assertJsonValidationErrors('code');
    }

    public function test_expiry_is_fifteen_minutes(): void
    {
        $this->freezeSecond();
        Mail::fake();
        $user = User::factory()->create();
        $code = $this->issueCode($user);
        $record = PasswordResetOtp::query()->firstOrFail();
        $this->assertTrue($record->expires_at->equalTo(now()->addMinutes(15)));
        $this->travel(899)->seconds();
        $this->postJson('/api/password-reset/verify', ['email' => $user->email, 'code' => $code])
            ->assertNoContent();
        $this->travel(1)->seconds();
        $this->postJson('/api/password-reset/verify', ['email' => $user->email, 'code' => $code])
            ->assertUnprocessable()->assertJsonValidationErrors('code');
        $this->postJson('/api/password-reset/confirm', $this->resetPayload($user, $code))
            ->assertUnprocessable()->assertJsonValidationErrors('code');
    }

    public function test_five_failed_attempts_lock_the_current_code(): void
    {
        Mail::fake();
        $user = User::factory()->create();
        $code = $this->issueCode($user);
        $wrong = $code === '000000' ? '111111' : '000000';
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/password-reset/verify', ['email' => $user->email, 'code' => $wrong])
                ->assertUnprocessable()->assertJsonValidationErrors('code');
        }
        $this->assertSame(5, PasswordResetOtp::query()->where('user_id', $user->id)->firstOrFail()->attempts);
        $this->postJson('/api/password-reset/verify', ['email' => $user->email, 'code' => $code])
            ->assertUnprocessable()->assertJsonValidationErrors('code');
    }

    public function test_request_rate_limit_and_replacement_of_old_code(): void
    {
        Mail::fake();
        $user = User::factory()->create();
        $firstCode = $this->issueCode($user);
        $this->postJson('/api/password-reset/request', ['email' => $user->email])->assertStatus(429);
        $this->travel(61)->seconds();
        $this->postJson('/api/password-reset/request', ['email' => $user->email])->assertAccepted();
        $this->postJson('/api/password-reset/verify', ['email' => $user->email, 'code' => $firstCode])
            ->assertUnprocessable()->assertJsonValidationErrors('code');
    }

    public static function invalidPasswords(): iterable
    {
        yield 'weak' => ['weak'];
        yield 'too short' => ['Short123!'];
        yield 'no uppercase' => ['newpassword123!'];
        yield 'no lowercase' => ['NEWPASSWORD123!'];
        yield 'no number' => ['NewPasswordOnly!'];
        yield 'no symbol' => ['NewPassword1234'];
        yield 'whitespace is not a symbol' => ['New Password123'];
    }

    #[DataProvider('invalidPasswords')]
    public function test_password_policy_is_reused_for_reset(string $password): void
    {
        Mail::fake();
        $user = User::factory()->create();
        $code = $this->issueCode($user);
        $this->postJson('/api/password-reset/confirm', [
            'email' => $user->email,
            'code' => $code,
            'password' => $password,
            'password_confirmation' => $password,
        ])->assertUnprocessable()->assertJsonValidationErrors('password');
        $this->assertTrue(Hash::check('password', $user->fresh()->getAuthPassword()));
    }

    private function resetPayload(User $user, string $code): array
    {
        return [
            'email' => $user->email, 'code' => $code,
            'password' => 'NewPassword123!', 'password_confirmation' => 'NewPassword123!',
        ];
    }

    public function test_existing_and_missing_accounts_have_identical_responses(): void
    {
        $this->freezeTime();
        Mail::fake();
        $user = User::factory()->create();
        $existing = $this->postJson('/api/password-reset/request', ['email' => $user->email])->assertAccepted();
        $missing = $this->postJson('/api/password-reset/request', ['email' => 'missing@example.test'])->assertAccepted();
        $this->assertSame($existing->json(), $missing->json());
        $this->assertSame(now()->addMinutes(15)->toIso8601String(), $existing->json('expires_at'));
        $this->assertSame(now()->addMinute()->toIso8601String(), $existing->json('resend_after'));
        foreach ([$user->email, 'missing@example.test'] as $email) {
            $this->postJson('/api/password-reset/verify', ['email' => $email, 'code' => '123456'])
                ->assertUnprocessable()->assertJsonValidationErrors('code');
        }
    }

    public function test_cooldown_retry_after_is_identical_for_existing_and_missing_accounts(): void
    {
        config(['app.debug' => false]);
        $this->freezeSecond();
        Mail::fake();
        $user = User::factory()->create();
        foreach ([$user->email, 'missing@example.test'] as $email) {
            $this->postJson('/api/password-reset/request', ['email' => $email])->assertAccepted();
        }
        $this->travel(17)->seconds();
        $existing = $this->postJson('/api/password-reset/request', ['email' => strtoupper($user->email)])
            ->assertStatus(429)->assertHeader('Retry-After', '43');
        $missing = $this->postJson('/api/password-reset/request', ['email' => ' MISSING@EXAMPLE.TEST '])
            ->assertStatus(429)->assertHeader('Retry-After', '43');
        $this->assertSame($existing->json(), $missing->json());
        Mail::assertSentCount(1);
    }

    public function test_database_cooldown_returns_retry_after_after_a_cache_reset(): void
    {
        $this->freezeSecond();
        Mail::fake();
        $user = User::factory()->create();
        $code = $this->issueCode($user);
        $this->travel(17)->seconds();
        Cache::flush();
        $existing = $this->postJson('/api/password-reset/request', ['email' => $user->email])
            ->assertStatus(429)->assertHeader('Retry-After', '43');
        $missing = $this->postJson('/api/password-reset/request', ['email' => 'missing@example.test'])->assertAccepted();
        $missing->assertHeaderMissing('Retry-After');
        Mail::assertSentCount(1);
        $this->postJson('/api/password-reset/verify', ['email' => $user->email, 'code' => $code])->assertNoContent();
    }

    public function test_reset_requires_matching_password_confirmation_without_consuming_the_code(): void
    {
        Mail::fake();
        $user = User::factory()->create();
        $code = $this->issueCode($user);
        $payload = $this->resetPayload($user, $code);
        unset($payload['password_confirmation']);
        $this->postJson('/api/password-reset/confirm', $payload)
            ->assertUnprocessable()->assertJsonValidationErrors('password');
        $this->postJson('/api/password-reset/confirm', [...$payload, 'password_confirmation' => 'mismatch'])
            ->assertUnprocessable()->assertJsonValidationErrors('password');
        $this->assertNull(PasswordResetOtp::query()->firstOrFail()->consumed_at);
        $this->postJson('/api/password-reset/confirm', $this->resetPayload($user, $code))->assertNoContent();
    }

    public static function roles(): iterable
    {
        foreach (UserRole::cases() as $role) {
            yield $role->value => [$role];
        }
    }

    #[DataProvider('roles')]
    public function test_reset_is_available_for_every_account_role(UserRole $role): void
    {
        Mail::fake();
        $user = User::factory()->create(['role' => $role]);
        $code = $this->issueCode($user);
        $this->postJson('/api/password-reset/confirm', $this->resetPayload($user, $code))->assertNoContent();
        $this->assertSame($role, $user->fresh()->role);
    }

    public function test_leading_zero_code_and_normalized_email(): void
    {
        Mail::fake();
        $user = User::factory()->create(['email' => 'patient@example.test']);
        $this->issueCode($user);
        $code = '000123';
        PasswordResetOtp::query()->update([
            'code_hash' => hash_hmac('sha256', $user->email.'|'.$code, (string) config('app.key')),
        ]);
        $this->postJson('/api/password-reset/verify', ['email' => ' PATIENT@EXAMPLE.TEST ', 'code' => $code])
            ->assertNoContent();
        $this->postJson('/api/password-reset/verify', ['email' => $user->email, 'code' => '123'])
            ->assertUnprocessable()->assertJsonValidationErrors('code');
    }

    public function test_confirm_and_verify_share_the_failed_attempt_budget(): void
    {
        Mail::fake();
        $user = User::factory()->create();
        $code = $this->issueCode($user);
        $wrong = $code === '000000' ? '111111' : '000000';
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/password-reset/confirm', $this->resetPayload($user, $wrong))
                ->assertUnprocessable()->assertJsonValidationErrors('code');
        }
        $this->postJson('/api/password-reset/verify', ['email' => $user->email, 'code' => $code])
            ->assertUnprocessable()->assertJsonValidationErrors('code');
        $this->postJson('/api/password-reset/confirm', $this->resetPayload($user, $code))
            ->assertUnprocessable()->assertJsonValidationErrors('code');
        $this->assertSame(5, PasswordResetOtp::query()->firstOrFail()->attempts);
    }

    public function test_resend_resets_attempts_and_new_code_can_be_used(): void
    {
        Mail::fake();
        $user = User::factory()->create();
        $first = $this->issueCode($user);
        PasswordResetOtp::query()->update(['attempts' => 5]);
        $this->travel(61)->seconds();
        Mail::fake();
        $second = $this->issueCode($user);
        $this->assertNotSame($first, $second);
        $this->assertSame(0, PasswordResetOtp::query()->firstOrFail()->attempts);
        $this->postJson('/api/password-reset/verify', ['email' => $user->email, 'code' => $first])
            ->assertUnprocessable()->assertJsonValidationErrors('code');
        $this->postJson('/api/password-reset/confirm', $this->resetPayload($user, $second))->assertNoContent();
        $this->assertDatabaseCount('password_reset_otps', 1);
    }

    public function test_hourly_request_limit_also_applies_to_missing_accounts(): void
    {
        Mail::fake();
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/password-reset/request', ['email' => 'missing@example.test'])->assertAccepted();
            $this->travel(61)->seconds();
        }
        $this->postJson('/api/password-reset/request', ['email' => ' MISSING@EXAMPLE.TEST '])
            ->assertStatus(429)->assertHeader('Retry-After');
    }

    public function test_request_ip_limit_cannot_be_bypassed_with_different_addresses(): void
    {
        Mail::fake();
        for ($i = 0; $i < 12; $i++) {
            $this->postJson('/api/password-reset/request', ['email' => "missing{$i}@example.test"])->assertAccepted();
        }
        $this->postJson('/api/password-reset/request', ['email' => 'other@example.test'])->assertStatus(429);
    }

    public function test_verify_and_confirm_share_the_endpoint_rate_limit(): void
    {
        for ($i = 0; $i < 10; $i++) {
            $this->postJson('/api/password-reset/verify', ['email' => 'missing@example.test', 'code' => '000000'])
                ->assertUnprocessable();
        }
        $user = User::factory()->make(['email' => 'missing@example.test']);
        $this->postJson('/api/password-reset/confirm', $this->resetPayload($user, '000000'))->assertStatus(429);
    }

    public function test_mail_failure_invalidates_the_unsent_code_without_disclosing_the_account(): void
    {
        $user = User::factory()->create();
        $level = DB::transactionLevel();
        $mailLevel = null;
        Mail::shouldReceive('to')->once()->with($user->email)->andReturnSelf();
        Mail::shouldReceive('send')->once()->andReturnUsing(function () use (&$mailLevel): void {
            $mailLevel = DB::transactionLevel();
            throw new RuntimeException('SMTP unavailable');
        });
        $this->postJson('/api/password-reset/request', ['email' => $user->email])->assertAccepted();
        $this->assertSame($level, $mailLevel, 'SMTP must run outside the OTP transaction.');
        $this->assertNotNull(PasswordResetOtp::query()->firstOrFail()->consumed_at);
        $this->assertTrue(Hash::check('password', $user->fresh()->getAuthPassword()));
    }

    public function test_mail_transport_is_deferred_until_after_the_generic_response(): void
    {
        Mail::fake();
        $user = User::factory()->create();
        $request = Request::create('/api/password-reset/request', 'POST', ['email' => $user->email]);
        $response = app(PasswordResetOtpController::class)->requestCode($request);
        $this->assertSame(202, $response->getStatusCode());
        Mail::assertNothingSent();
        defer()->invoke();
        Mail::assertSentCount(1);
        defer()->invoke();
        Mail::assertSentCount(1);
    }

    public function test_failed_mail_does_not_invalidate_a_newer_code(): void
    {
        $user = User::factory()->create();
        $newHash = str_repeat('a', 64);
        Mail::shouldReceive('to')->once()->andReturnSelf();
        Mail::shouldReceive('send')->once()->andReturnUsing(function () use ($newHash): void {
            PasswordResetOtp::query()->update(['code_hash' => $newHash]);
            throw new RuntimeException('Old SMTP request failed');
        });
        $this->postJson('/api/password-reset/request', ['email' => $user->email])->assertAccepted();
        $record = PasswordResetOtp::query()->firstOrFail();
        $this->assertSame($newHash, $record->code_hash);
        $this->assertNull($record->consumed_at);
    }

    public function test_same_password_is_rejected_without_consuming_the_code(): void
    {
        Mail::fake();
        $user = User::factory()->create(['password' => 'NewPassword123!']);
        $code = $this->issueCode($user);
        $this->postJson('/api/password-reset/confirm', $this->resetPayload($user, $code))
            ->assertUnprocessable()->assertJsonValidationErrors('password');
        $this->assertNull(PasswordResetOtp::query()->firstOrFail()->consumed_at);
    }

    public function test_database_failure_rolls_back_password_tokens_and_code_consumption(): void
    {
        Mail::fake();
        $user = User::factory()->create();
        $user->createToken('phone');
        $code = $this->issueCode($user);
        DB::listen(function ($query): void {
            if (str_starts_with($query->sql, 'delete from "sessions"')) {
                throw new RuntimeException('Session storage failure');
            }
        });
        $this->postJson('/api/password-reset/confirm', $this->resetPayload($user, $code))->assertStatus(500);
        $this->assertTrue(Hash::check('password', $user->fresh()->getAuthPassword()));
        $this->assertSame(1, $user->tokens()->count());
        $this->assertNull(PasswordResetOtp::query()->firstOrFail()->consumed_at);
    }

    public function test_database_cooldown_also_serializes_requests_without_throttle_middleware(): void
    {
        $this->withoutMiddleware(ThrottleRequests::class);
        Mail::fake();
        $user = User::factory()->create();
        $code = $this->issueCode($user);
        $this->postJson('/api/password-reset/request', ['email' => $user->email])
            ->assertStatus(429)
            ->assertHeader('Retry-After');
        Mail::assertSentCount(1);
        $this->postJson('/api/password-reset/verify', ['email' => $user->email, 'code' => $code])->assertNoContent();
    }

    #[Group('concurrency')]
    public function test_only_one_of_two_concurrent_postgres_resets_succeeds(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            $this->markTestSkipped('Requires PostgreSQL row locks and independent processes.');
        }
        $transactionId = DB::selectOne('SELECT txid_current() AS id')->id;
        $connectionName = 'otp_concurrency';
        config(['database.connections.'.$connectionName => array_merge(DB::connection()->getConfig(), ['name' => $connectionName])]);
        $connection = DB::connection($connectionName);
        $user = null;
        $processes = [];
        try {
            // Commit only this fixture through a connection outside RefreshDatabase.
            $user = User::factory()->connection($connectionName)->create();
            $code = '000123';
            PasswordResetOtp::on($connectionName)->create([
                'user_id' => $user->id,
                'code_hash' => hash_hmac('sha256', $user->email.'|'.$code, (string) config('app.key')),
                'expires_at' => now()->addMinutes(15),
                'sent_at' => now(),
            ]);
            $connection->beginTransaction();
            User::on($connectionName)->whereKey($user->id)->lockForUpdate()->firstOrFail();
            $script = <<<'PHP'
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Http\Kernel::class);
$kernel->bootstrap();
\Illuminate\Support\Facades\DB::connection()->beforeExecuting(function (string $sql): void {
    if (str_starts_with($sql, 'select * from "users"') && str_ends_with($sql, 'for update')) {
        fwrite(STDOUT, "ready\n");
        fflush(STDOUT);
    }
});
$request = \Illuminate\Http\Request::create('/api/password-reset/confirm', 'POST', [], [], [],
    ['CONTENT_TYPE' => 'application/json', 'HTTP_ACCEPT' => 'application/json'], $argv[1]);
$response = $kernel->handle($request);
echo $response->getStatusCode();
$kernel->terminate($request, $response);
PHP;
            $db = $connection->getConfig();
            $env = [
                'APP_ENV' => 'testing', 'APP_KEY' => config('app.key'), 'DB_CONNECTION' => 'pgsql',
                'DB_HOST' => $db['host'], 'DB_PORT' => (string) $db['port'], 'DB_DATABASE' => $db['database'],
                'DB_USERNAME' => $db['username'], 'DB_PASSWORD' => $db['password'] ?? '', 'DB_URL' => '',
                'CACHE_STORE' => 'array', 'SESSION_DRIVER' => 'array', 'MAIL_MAILER' => 'array',
                'PAO_DISABLE' => '1',
            ];
            for ($i = 0; $i < 2; $i++) {
                $process = new Process([PHP_BINARY, '-r', $script, json_encode($this->resetPayload($user, $code), JSON_THROW_ON_ERROR)], base_path(), $env, timeout: 60);
                $process->start();
                $processes[] = $process;
            }
            // Wait for both workers to reach the locking query before the brief delay.
            foreach ($processes as $process) {
                while ($process->isRunning() && ! str_contains($process->getOutput(), "ready\n")) {
                    $process->checkTimeout();
                    usleep(1000);
                }
                $this->assertStringContainsString("ready\n", $process->getOutput(), $process->getErrorOutput());
            }
            usleep(5000);
            $connection->commit();
            $statuses = [];
            foreach ($processes as $process) {
                $this->assertSame(0, $process->wait(), $process->getErrorOutput());
                $statuses[] = (int) substr(trim($process->getOutput()), -3);
            }
            sort($statuses);
            $this->assertSame([204, 422], $statuses);
            $this->assertTrue(Hash::check('NewPassword123!', $user->fresh()->getAuthPassword()));
        } finally {
            foreach ($processes as $process) {
                $process->stop();
            }
            if ($connection->transactionLevel() > 0) {
                $connection->rollBack();
            }
            $user?->delete();
            DB::purge($connectionName);
        }
        $this->assertSame($transactionId, DB::selectOne('SELECT txid_current() AS id')->id);
    }
}
