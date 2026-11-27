<?php

namespace App\Http\Controllers;

use App\Mail\PasswordResetOtpMail;
use App\Models\PasswordResetOtp;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use Throwable;

use function Illuminate\Support\defer;

class PasswordResetOtpController extends Controller
{
    private const EXPIRATION_MINUTES = 15;

    private const MAX_ATTEMPTS = 5;

    public function requestCode(Request $request): JsonResponse
    {
        $data = $request->validate(['email' => ['required', 'string', 'email', 'max:255']]);
        $email = strtolower(trim($data['email']));
        $now = now();

        $delivery = null;
        try {
            $delivery = DB::transaction(function () use ($email, $now): ?array {
                $user = User::query()
                    ->where('email', $email)
                    ->lockForUpdate()
                    ->first();

                if (! $user) {
                    return null;
                }

                $record = PasswordResetOtp::query()->firstOrNew(['user_id' => $user->getKey()]);
                if ($record->exists && $record->sent_at->copy()->addMinute()->isFuture()) {
                    return null;
                }
                do {
                    $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
                    $codeHash = $this->hashCode($email, $code);
                } while ($record->exists && hash_equals($record->code_hash, $codeHash));
                $record->fill([
                    'code_hash' => $codeHash,
                    'attempts' => 0,
                    'expires_at' => $now->copy()->addMinutes(self::EXPIRATION_MINUTES),
                    'sent_at' => $now,
                    'consumed_at' => null,
                ]);
                $record->save();

                return ['user_id' => $user->getKey(), 'email' => $user->email, 'code' => $code, 'code_hash' => $codeHash];
            });
            if ($delivery !== null) {
                defer(function () use ($delivery): void {
                    try {
                        Mail::to($delivery['email'])->send(new PasswordResetOtpMail($delivery['code']));
                    } catch (Throwable $error) {
                        report($error);
                        try {
                            PasswordResetOtp::query()
                                ->where('user_id', $delivery['user_id'])
                                ->where('code_hash', $delivery['code_hash'])
                                ->update(['consumed_at' => now()]);
                        } catch (Throwable $cleanupError) {
                            report($cleanupError);
                        }
                    }
                });
            }
        } catch (Throwable $error) {
            report($error);
        }

        return response()->json([
            'message' => 'If the account exists, a verification code has been sent.',
            'expires_at' => $now->copy()->addMinutes(self::EXPIRATION_MINUTES)->toIso8601String(),
            'resend_after' => $now->copy()->addMinute()->toIso8601String(),
        ], Response::HTTP_ACCEPTED);
    }

    public function verifyCode(Request $request): Response
    {
        $data = $this->validateCode($request);

        $isValid = DB::transaction(fn (): bool => $this->checkCode($data['email'], $data['code']) !== null);
        if (! $isValid) {
            $this->invalidCode();
        }

        return response()->noContent();
    }

    public function resetPassword(Request $request): Response
    {
        $data = $request->validate([
            'email' => ['required', 'string', 'email', 'max:255'],
            'code' => ['required', 'string', 'regex:/^[0-9]{6}$/'],
            'password' => [
                'required', 'string', 'confirmed',
                Password::defaults()->min(12)->mixedCase()->numbers(),
                'regex:/[\p{P}\p{S}]/u',
            ],
        ]);
        $email = strtolower(trim($data['email']));

        $outcome = DB::transaction(function () use ($email, $data): string {
            $record = $this->checkCode($email, $data['code']);
            if ($record === null) {
                return 'invalid';
            }
            $user = User::query()->findOrFail($record->user_id);

            if (Hash::check($data['password'], (string) $user->getAuthPassword())) {
                return 'same_password';
            }

            $user->password = $data['password'];
            $user->setRememberToken(Str::random(60));
            $user->save();
            $user->tokens()->delete();
            DB::table('sessions')->where('user_id', $user->getKey())->delete();
            DB::table('password_reset_tokens')->where('email', $email)->delete();
            $record->consumed_at = now();
            $record->save();

            return 'updated';
        });

        if ($outcome === 'invalid') {
            $this->invalidCode();
        }
        if ($outcome === 'same_password') {
            throw ValidationException::withMessages([
                'password' => ['The new password must differ from the previous password.'],
            ]);
        }

        return response()->noContent();
    }

    /** @return array{email:string, code:string} */
    private function validateCode(Request $request): array
    {
        $data = $request->validate([
            'email' => ['required', 'string', 'email', 'max:255'],
            'code' => ['required', 'string', 'regex:/^[0-9]{6}$/'],
        ]);
        $data['email'] = strtolower(trim($data['email']));

        return $data;
    }

    private function checkCode(string $email, string $code): ?PasswordResetOtp
    {
        $user = User::query()
            ->where('email', $email)
            ->lockForUpdate()
            ->first();
        $record = $user
            ? PasswordResetOtp::query()->where('user_id', $user->getKey())->lockForUpdate()->first()
            : null;

        if (! $record || $record->consumed_at !== null || now()->greaterThanOrEqualTo($record->expires_at)) {
            return null;
        }
        if ($record->attempts >= self::MAX_ATTEMPTS) {
            return null;
        }
        if (! hash_equals($record->code_hash, $this->hashCode($email, $code))) {
            $record->attempts++;
            $record->save();

            return null;
        }

        return $record;
    }

    private function hashCode(string $email, string $code): string
    {
        return hash_hmac('sha256', $email.'|'.$code, (string) config('app.key'));
    }

    private function invalidCode(): never
    {
        throw ValidationException::withMessages([
            'code' => ['Invalid, expired or already used verification code.'],
        ]);
    }
}
