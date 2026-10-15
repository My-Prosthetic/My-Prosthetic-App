<?php

namespace Tests\Feature;

use App\Models\Prosthesis;
use App\Models\User;
use App\Models\UserShare;
use App\ValueObjects\SharePermissions;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Testing\TestResponse;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class ShareApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_patient_grants_a_prosthetist_access_to_selected_information(): void
    {
        $patient = User::factory()->create();
        $prosthetist = User::factory()->prosthetist()->create(['name' => 'Jan Kowalski']);
        $prosthesis = Prosthesis::factory()->for($patient)->create();

        $this->as($patient)
            ->postJson('/api/shares', [
                'specialist_id' => $prosthetist->id,
                'permissions' => ['medical_history' => true, 'prostheses' => [$prosthesis->id]],
            ])
            ->assertCreated()
            ->assertJsonPath('data.specialist', ['id' => $prosthetist->id, 'name' => 'Jan Kowalski'])
            ->assertJsonPath('data.permissions', [
                'medical_history' => true,
                'prostheses' => [$prosthesis->id],
                'incidents' => [],
            ])
            ->assertJsonStructure(['data' => ['created_at', 'updated_at']]);

        $this->as($patient)
            ->getJson('/api/shares')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.specialist.id', $prosthetist->id)
            ->assertJsonPath('data.0.permissions.prostheses', [$prosthesis->id]);
    }

    public function test_replacing_the_selection_discards_the_previous_one_and_keeps_the_grant(): void
    {
        $patient = User::factory()->create();
        $prosthetist = User::factory()->prosthetist()->create();
        [$kept, $dropped] = Prosthesis::factory()->for($patient)->count(2)->create()->all();
        $created = $this->grant($patient, $prosthetist, ['medical_history' => true, 'prostheses' => [$kept->id, $dropped->id]]);

        $this->travel(1)->minute();

        $this->as($patient)
            ->putJson("/api/shares/{$prosthetist->id}", ['permissions' => ['prostheses' => [$kept->id]]])
            ->assertOk()
            ->assertJsonPath('data.specialist.id', $prosthetist->id)
            ->assertJsonPath('data.permissions', ['medical_history' => false, 'prostheses' => [$kept->id], 'incidents' => []])
            ->assertJsonPath('data.created_at', $created->json('data.created_at'))
            ->assertJsonPath('data.updated_at', fn (string $updatedAt): bool => $updatedAt > $created->json('data.updated_at'));

        $this->as($patient)
            ->getJson('/api/shares')
            ->assertJsonPath('data.0.permissions', ['medical_history' => false, 'prostheses' => [$kept->id], 'incidents' => []]);
    }

    public function test_narrowing_to_nothing_keeps_the_prosthetist_in_the_list(): void
    {
        $patient = User::factory()->create();
        $prosthetist = User::factory()->prosthetist()->create();
        $this->grant($patient, $prosthetist, ['medical_history' => true]);

        $this->as($patient)
            ->putJson("/api/shares/{$prosthetist->id}", ['permissions' => []])
            ->assertOk()
            ->assertJsonPath('data.permissions', ['medical_history' => false, 'prostheses' => [], 'incidents' => []]);

        $this->as($patient)
            ->getJson('/api/shares')
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.specialist.id', $prosthetist->id);
    }

    public function test_a_grant_with_nothing_selected_can_be_created(): void
    {
        $patient = User::factory()->create();
        $prosthetist = User::factory()->prosthetist()->create();

        $this->grant($patient, $prosthetist, [])
            ->assertCreated()
            ->assertJsonPath('data.permissions', ['medical_history' => false, 'prostheses' => [], 'incidents' => []]);
    }

    public function test_revoking_removes_the_grant_and_access_can_be_granted_again(): void
    {
        $patient = User::factory()->create();
        $prosthetist = User::factory()->prosthetist()->create();
        $this->grant($patient, $prosthetist, ['medical_history' => true]);

        $this->as($patient)
            ->deleteJson("/api/shares/{$prosthetist->id}")
            ->assertNoContent();

        $this->as($patient)->getJson('/api/shares')->assertExactJson(['data' => []]);
        $this->assertDatabaseCount('user_shares', 0);

        $this->grant($patient, $prosthetist, [])->assertCreated();
    }

    public function test_grants_are_listed_by_specialist_name(): void
    {
        $patient = User::factory()->create();
        $zofia = User::factory()->prosthetist()->create(['name' => 'Zofia Zielińska']);
        $adam = User::factory()->prosthetist()->create(['name' => 'Adam Abacki']);
        $this->grant($patient, $zofia, []);
        $this->grant($patient, $adam, []);

        $this->as($patient)
            ->getJson('/api/shares')
            ->assertOk()
            ->assertJsonPath('data.*.specialist.id', [$adam->id, $zofia->id]);
    }

    public function test_replacing_or_revoking_a_missing_grant_is_not_found(): void
    {
        $patient = User::factory()->create();
        $prosthetist = User::factory()->prosthetist()->create();

        $this->as($patient)
            ->putJson("/api/shares/{$prosthetist->id}", ['permissions' => []])
            ->assertNotFound();

        $this->as($patient)
            ->deleteJson("/api/shares/{$prosthetist->id}")
            ->assertNotFound();

        $this->as($patient)
            ->deleteJson('/api/shares/not-a-uuid')
            ->assertNotFound();
    }

    public function test_a_second_grant_for_the_same_prosthetist_is_a_conflict(): void
    {
        $patient = User::factory()->create();
        $prosthetist = User::factory()->prosthetist()->create();
        $this->grant($patient, $prosthetist, ['medical_history' => true]);

        $this->grant($patient, $prosthetist, [])->assertConflict();

        $this->as($patient)
            ->getJson('/api/shares')
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.permissions.medical_history', true);
    }

    public function test_the_specialist_id_is_matched_regardless_of_letter_case(): void
    {
        $patient = User::factory()->create();
        $prosthetist = User::factory()->prosthetist()->create();
        $this->as($patient)
            ->postJson('/api/shares', ['specialist_id' => Str::upper($prosthetist->id), 'permissions' => []])
            ->assertCreated()
            ->assertJsonPath('data.specialist.id', $prosthetist->id);

        $this->as($patient)
            ->deleteJson('/api/shares/'.Str::upper($prosthetist->id))
            ->assertNoContent();
    }

    public function test_a_concurrent_duplicate_grant_is_a_conflict_not_a_server_error(): void
    {
        $patient = User::factory()->create();
        $prosthetist = User::factory()->prosthetist()->create();

        // Another request stores the same grant between the existence check and the insert.
        UserShare::creating(function () use ($patient, $prosthetist): void {
            DB::table('user_shares')->insert([
                'id' => (string) Str::uuid7(),
                'patient_id' => $patient->id,
                'specialist_id' => $prosthetist->id,
                'permissions' => json_encode(SharePermissions::none()),
            ]);
        });

        $this->grant($patient, $prosthetist, ['medical_history' => true])->assertConflict();
        $this->assertDatabaseCount('user_shares', 1);
    }

    public function test_a_patient_cannot_see_or_change_another_patients_grants(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $prosthetist = User::factory()->prosthetist()->create();
        $this->grant($owner, $prosthetist, ['medical_history' => true]);

        $this->as($intruder)->getJson('/api/shares')->assertExactJson(['data' => []]);
        $this->as($intruder)
            ->putJson("/api/shares/{$prosthetist->id}", ['permissions' => []])
            ->assertNotFound();
        $this->as($intruder)->deleteJson("/api/shares/{$prosthetist->id}")->assertNotFound();

        $this->as($owner)
            ->getJson('/api/shares')
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.permissions.medical_history', true);
    }

    #[DataProvider('invalidSpecialists')]
    public function test_unknown_users_and_non_prosthetists_are_rejected_with_the_same_error(callable $specialistId): void
    {
        $patient = User::factory()->create();

        $response = $this->as($patient)
            ->postJson('/api/shares', ['specialist_id' => $specialistId($patient), 'permissions' => []])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['specialist_id']);

        $this->assertSame(['The selected specialist id is invalid.'], $response->json('errors.specialist_id'));
        $this->assertDatabaseCount('user_shares', 0);
    }

    public static function invalidSpecialists(): iterable
    {
        yield 'nonexistent user' => [fn (): string => '33333333-3333-4333-8333-333333333333'];
        yield 'another patient' => [fn (): string => User::factory()->create()->id];
        yield 'an administrator' => [fn (): string => User::factory()->admin()->create()->id];
        yield 'the patient themselves' => [fn (User $patient): string => $patient->id];
    }

    public function test_the_specialist_id_must_be_a_uuid(): void
    {
        $patient = User::factory()->create();

        $this->as($patient)
            ->postJson('/api/shares', ['permissions' => []])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['specialist_id']);

        $this->as($patient)
            ->postJson('/api/shares', ['specialist_id' => 'kowalski', 'permissions' => []])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['specialist_id']);
    }

    #[DataProvider('invalidPermissions')]
    public function test_invalid_permission_scopes_are_rejected_on_create_and_replace(callable $payload, string $errorKey): void
    {
        $patient = User::factory()->create();
        $prosthetist = User::factory()->prosthetist()->create();
        $existing = User::factory()->prosthetist()->create();
        $this->grant($patient, $existing, ['medical_history' => true]);

        $this->as($patient)
            ->postJson('/api/shares', ['specialist_id' => $prosthetist->id, ...$payload($patient)])
            ->assertUnprocessable()
            ->assertJsonValidationErrors([$errorKey]);

        $this->as($patient)
            ->putJson("/api/shares/{$existing->id}", $payload($patient))
            ->assertUnprocessable()
            ->assertJsonValidationErrors([$errorKey]);

        $this->as($patient)
            ->getJson('/api/shares')
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.permissions', ['medical_history' => true, 'prostheses' => [], 'incidents' => []]);
    }

    public static function invalidPermissions(): iterable
    {
        $scope = fn (mixed $permissions): callable => fn (): array => ['permissions' => $permissions];

        yield 'missing permissions' => [fn (): array => [], 'permissions'];
        yield 'null permissions' => [$scope(null), 'permissions'];
        yield 'permissions as a string' => [$scope('medical_history'), 'permissions'];
        yield 'flat list of scopes' => [$scope(['medical_history', 'prosthesis_123']), 'permissions'];
        yield 'unknown key' => [$scope(['documents' => true]), 'permissions'];
        yield 'medical history as a string' => [$scope(['medical_history' => 'yes']), 'permissions.medical_history'];
        yield 'medical history as a number' => [$scope(['medical_history' => 1]), 'permissions.medical_history'];
        yield 'prostheses as an object' => [$scope(['prostheses' => ['a' => '11111111-1111-4111-8111-111111111111']]), 'permissions.prostheses'];
        yield 'prostheses as a string' => [$scope(['prostheses' => '11111111-1111-4111-8111-111111111111']), 'permissions.prostheses'];
        yield 'prosthesis id that is not a uuid' => [$scope(['prostheses' => ['prosthesis_123']]), 'permissions.prostheses.0'];
        yield 'nonexistent prosthesis' => [$scope(['prostheses' => ['11111111-1111-4111-8111-111111111111']]), 'permissions.prostheses'];
        yield 'another patients prosthesis' => [
            fn (): array => ['permissions' => ['prostheses' => [Prosthesis::factory()->create()->id]]],
            'permissions.prostheses',
        ];
        yield 'deleted prosthesis' => [
            function (User $patient): array {
                $prosthesis = Prosthesis::factory()->for($patient)->create();
                $prosthesis->delete();

                return ['permissions' => ['prostheses' => [$prosthesis->id]]];
            },
            'permissions.prostheses',
        ];
        yield 'incidents selected' => [$scope(['incidents' => ['22222222-2222-4222-8222-222222222222']]), 'permissions.incidents'];
        yield 'incidents as a string' => [$scope(['incidents' => 'all']), 'permissions.incidents'];
    }

    public function test_selecting_incidents_explains_they_are_not_supported_yet(): void
    {
        $patient = User::factory()->create();
        $prosthetist = User::factory()->prosthetist()->create();

        $this->grant($patient, $prosthetist, ['incidents' => ['22222222-2222-4222-8222-222222222222']])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['permissions.incidents' => 'Incident sharing is not supported yet.']);
    }

    public function test_prosthesis_ids_are_normalized(): void
    {
        $patient = User::factory()->create();
        $prosthetist = User::factory()->prosthetist()->create();
        $prosthesis = Prosthesis::factory()->for($patient)->create();

        $this->grant($patient, $prosthetist, ['prostheses' => [Str::upper($prosthesis->id), $prosthesis->id], 'incidents' => []])
            ->assertCreated()
            ->assertJsonPath('data.permissions.prostheses', [$prosthesis->id]);
    }

    #[DataProvider('nonPatientRoles')]
    public function test_only_patients_can_manage_grants(string $state): void
    {
        $user = User::factory()->{$state}()->create();
        $prosthetist = User::factory()->prosthetist()->create();

        $this->as($user)->getJson('/api/shares')->assertForbidden();
        $this->as($user)->postJson('/api/shares', ['specialist_id' => $prosthetist->id, 'permissions' => []])->assertForbidden();
        $this->as($user)->postJson('/api/shares', [])->assertForbidden();
        $this->as($user)->putJson("/api/shares/{$prosthetist->id}", ['permissions' => []])->assertForbidden();
        $this->as($user)->deleteJson("/api/shares/{$prosthetist->id}")->assertForbidden();
    }

    public static function nonPatientRoles(): iterable
    {
        yield 'prosthetist' => ['prosthetist'];
        yield 'admin' => ['admin'];
    }

    public function test_grant_management_requires_authentication(): void
    {
        $id = '33333333-3333-4333-8333-333333333333';

        $this->getJson('/api/shares')->assertUnauthorized();
        $this->postJson('/api/shares', [])->assertUnauthorized();
        $this->putJson("/api/shares/{$id}", [])->assertUnauthorized();
        $this->deleteJson("/api/shares/{$id}")->assertUnauthorized();
    }

    /**
     * @param  array<string, mixed>  $permissions
     */
    private function grant(User $patient, User $specialist, array $permissions): TestResponse
    {
        return $this->as($patient)->postJson('/api/shares', [
            'specialist_id' => $specialist->id,
            'permissions' => $permissions,
        ]);
    }

    private function as(User $user): static
    {
        $this->forgetAuthenticatedUser();

        return $this->withToken($user->createToken('share-test')->plainTextToken);
    }
}
