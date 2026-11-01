<?php

namespace Tests\Feature;

use App\Models\Component;
use App\Models\Prosthesis;
use App\Models\User;
use App\Models\UserShare;
use App\Models\WalletEntry;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AccountSettingsTest extends TestCase
{
    use RefreshDatabase;

    public function test_endpoints_require_authentication(): void
    {
        $this->putJson('/api/account/password', [])->assertUnauthorized();
        $this->deleteJson('/api/account')->assertUnauthorized();
    }

    public function test_only_patients_can_use_account_settings_endpoints(): void
    {
        $specialist = User::factory()->prosthetist()->create();
        $this->withToken($specialist->createToken('specialist')->plainTextToken);

        $this->putJson('/api/account/password', [
            'current_password' => 'password',
            'password' => 'ChangedPassword123!',
            'password_confirmation' => 'ChangedPassword123!',
        ])->assertForbidden();
        $this->deleteJson('/api/account')->assertForbidden();
        $this->assertDatabaseHas('users', ['id' => $specialist->id]);
    }

    public function test_password_change_validates_current_password_new_password_and_confirmation(): void
    {
        $patient = User::factory()->create();
        $this->withToken($patient->createToken('this-device')->plainTextToken);

        $this->putJson('/api/account/password', [
            'current_password' => 'wrong-password',
            'password' => 'ChangedPassword123!',
            'password_confirmation' => 'ChangedPassword123!',
        ])->assertUnprocessable()->assertJsonValidationErrors('current_password');

        $this->putJson('/api/account/password', [
            'current_password' => 'password',
            'password' => 'ChangedPassword123!',
            'password_confirmation' => 'mismatch',
        ])->assertUnprocessable()->assertJsonValidationErrors('password');

        $this->putJson('/api/account/password', [
            'current_password' => 'password',
            'password' => 'weak',
            'password_confirmation' => 'weak',
        ])->assertUnprocessable()->assertJsonValidationErrors('password');

        $this->putJson('/api/account/password', [
            'current_password' => 'password',
            'password' => 'Password With1',
            'password_confirmation' => 'Password With1',
        ])->assertUnprocessable()->assertJsonValidationErrors('password');

        $this->assertTrue(Hash::check('password', $patient->fresh()->getAuthPassword()));
    }

    public function test_password_change_keeps_current_token_but_revokes_other_devices(): void
    {
        $patient = User::factory()->create();
        $currentToken = $patient->createToken('this-device')->plainTextToken;
        $otherToken = $patient->createToken('other-device')->plainTextToken;

        $this->withToken($currentToken)->putJson('/api/account/password', [
            'current_password' => 'password',
            'password' => 'ChangedPassword123!',
            'password_confirmation' => 'ChangedPassword123!',
        ])->assertNoContent();

        $this->assertTrue(Hash::check('ChangedPassword123!', $patient->fresh()->getAuthPassword()));
        $this->assertDatabaseCount('personal_access_tokens', 1);

        $this->forgetAuthenticatedUser();
        $this->withToken($currentToken)->getJson('/api/profile')->assertOk();
        $this->forgetAuthenticatedUser();
        $this->withToken($otherToken)->getJson('/api/profile')->assertUnauthorized();
    }

    public function test_password_change_rejects_same_password_without_revoking_tokens(): void
    {
        $patient = User::factory()->create(['password' => 'SamePassword123!']);
        $originalHash = $patient->getAuthPassword();
        $this->withToken($patient->createToken('this-device')->plainTextToken);
        $patient->createToken('other-device');

        $this->putJson('/api/account/password', [
            'current_password' => 'SamePassword123!',
            'password' => 'SamePassword123!',
            'password_confirmation' => 'SamePassword123!',
        ])->assertUnprocessable()->assertJsonValidationErrors('password');

        $this->assertSame($originalHash, $patient->fresh()->getAuthPassword());
        $this->assertDatabaseCount('personal_access_tokens', 2);
    }

    public function test_deleting_account_requires_correct_current_password(): void
    {
        $patient = User::factory()->create();
        $prosthesis = Prosthesis::factory()->for($patient)->create();
        $this->withToken($patient->createToken('this-device')->plainTextToken);

        $this->deleteJson('/api/account')->assertUnprocessable()
            ->assertJsonValidationErrors('current_password');
        $this->deleteJson('/api/account', ['current_password' => 'wrong-password'])
            ->assertUnprocessable()->assertJsonValidationErrors('current_password');

        $this->assertDatabaseHas('users', ['id' => $patient->id]);
        $this->assertDatabaseHas('prostheses', ['id' => $prosthesis->id]);
        $this->assertDatabaseHas('personal_access_tokens', ['tokenable_id' => $patient->id]);
    }

    public function test_deleting_account_erases_patient_data_without_erasing_other_users(): void
    {
        $patient = User::factory()->create(['email' => 'delete-me@example.test']);
        $otherPatient = User::factory()->create();
        $specialist = User::factory()->prosthetist()->create();

        $prosthesis = Prosthesis::factory()->for($patient)->create();
        $component = Component::factory()->for($prosthesis)->create();
        $otherProsthesis = Prosthesis::factory()->for($otherPatient)->create();
        $component->delete();
        $prosthesis->delete();

        $wallet = WalletEntry::factory()->create(['user_id' => $patient->id]);
        $orphanedGoalId = $wallet->goal_id;
        $sharedWallet = WalletEntry::factory()->create(['user_id' => $patient->id]);
        $sharedGoalId = $sharedWallet->goal_id;
        $otherWallet = WalletEntry::factory()->create([
            'user_id' => $otherPatient->id,
            'goal_id' => $sharedGoalId,
        ]);

        $share = UserShare::factory()->create([
            'patient_id' => $patient->id,
            'specialist_id' => $specialist->id,
        ]);
        $otherShare = UserShare::factory()->create([
            'patient_id' => $otherPatient->id,
            'specialist_id' => $specialist->id,
        ]);

        DB::table('sessions')->insert([
            'id' => 'deleted-user-session',
            'user_id' => $patient->id,
            'payload' => '',
            'last_activity' => time(),
        ]);
        DB::table('password_reset_tokens')->insert([
            'email' => $patient->email,
            'token' => 'hashed-reset-token',
            'created_at' => now(),
        ]);

        $token = $patient->createToken('current-device')->plainTextToken;
        $patient->createToken('other-device');
        $specialist->createToken('specialist-device');

        $this->withToken($token)->deleteJson('/api/account', [
            'current_password' => 'password',
        ])->assertNoContent();

        $this->assertDatabaseMissing('users', ['id' => $patient->id]);
        $this->assertDatabaseMissing('prostheses', ['id' => $prosthesis->id]);
        $this->assertDatabaseMissing('components', ['id' => $component->id]);
        $this->assertDatabaseMissing('wallet_entries', ['id' => $wallet->id]);
        $this->assertDatabaseMissing('wallet_entries', ['id' => $sharedWallet->id]);
        $this->assertDatabaseMissing('goals', ['id' => $orphanedGoalId]);
        $this->assertDatabaseMissing('user_shares', ['id' => $share->id]);
        $this->assertDatabaseMissing('sessions', ['id' => 'deleted-user-session']);
        $this->assertDatabaseMissing('password_reset_tokens', ['email' => $patient->email]);
        $this->assertDatabaseMissing('personal_access_tokens', ['tokenable_id' => $patient->id]);

        $this->assertDatabaseHas('users', ['id' => $otherPatient->id]);
        $this->assertDatabaseHas('users', ['id' => $specialist->id]);
        $this->assertDatabaseHas('prostheses', ['id' => $otherProsthesis->id]);
        $this->assertDatabaseHas('wallet_entries', ['id' => $otherWallet->id]);
        $this->assertDatabaseHas('goals', ['id' => $sharedGoalId]);
        $this->assertDatabaseHas('user_shares', ['id' => $otherShare->id]);
        $this->assertDatabaseHas('personal_access_tokens', ['tokenable_id' => $specialist->id]);

        $this->forgetAuthenticatedUser();
        $this->getJson('/api/profile')->assertUnauthorized();
    }
}
