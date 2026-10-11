<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\UserShare;
use App\ValueObjects\SharePermissions;
use DomainException;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use InvalidArgumentException;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class UserShareTest extends TestCase
{
    use RefreshDatabase;

    private const PROSTHESIS_ID = '11111111-1111-4111-8111-111111111111';

    private const INCIDENT_ID = '22222222-2222-4222-8222-222222222222';

    public function test_attaching_a_specialist_creates_a_share_visible_from_both_participants(): void
    {
        $patient = User::factory()->create();
        $prosthetist = User::factory()->prosthetist()->create();
        $permissions = new SharePermissions(
            medicalHistory: true,
            prostheses: [self::PROSTHESIS_ID],
            incidents: [self::INCIDENT_ID],
        );

        $patient->sharedSpecialists()->attach($prosthetist, ['permissions' => $permissions]);

        $share = UserShare::query()->sole();
        $this->assertTrue(Str::isUuid($share->id));
        $this->assertEquals($permissions, $share->permissions);
        $this->assertTrue($share->patient->is($prosthetist->sharedPatients->sole()));
        $this->assertTrue($share->specialist->is($patient->sharedSpecialists->sole()));
        $this->assertSame([$share->id], $patient->grantedShares->modelKeys());
        $this->assertSame([$share->id], $prosthetist->receivedShares->modelKeys());
        $this->assertCount(0, $patient->sharedPatients);
        $this->assertCount(0, $prosthetist->sharedSpecialists);
    }

    public function test_the_share_is_exposed_on_the_related_user_with_cast_permissions(): void
    {
        $share = UserShare::factory()->create([
            'permissions' => new SharePermissions(prostheses: [self::PROSTHESIS_ID]),
        ]);

        $specialist = $share->patient->sharedSpecialists->sole();

        $this->assertInstanceOf(UserShare::class, $specialist->share);
        $this->assertSame($share->id, $specialist->share->id);
        $this->assertTrue($specialist->share->permissions->includesProsthesis(self::PROSTHESIS_ID));
        $this->assertFalse($specialist->share->permissions->medicalHistory);
    }

    public function test_permissions_are_stored_as_canonical_json(): void
    {
        $share = UserShare::factory()->create([
            'permissions' => ['prostheses' => [strtoupper(self::PROSTHESIS_ID), self::PROSTHESIS_ID]],
        ]);

        $stored = DB::table('user_shares')->where('id', $share->id)->value('permissions');

        $this->assertSame([
            'medical_history' => false,
            'prostheses' => [self::PROSTHESIS_ID],
            'incidents' => [],
        ], json_decode($stored, true));
    }

    public function test_an_empty_selection_is_a_valid_share(): void
    {
        $share = UserShare::factory()->create()->refresh();

        $this->assertEquals(SharePermissions::none(), $share->permissions);
    }

    public function test_invalid_permissions_are_rejected_before_reaching_the_database(): void
    {
        $patient = User::factory()->create();
        $prosthetist = User::factory()->prosthetist()->create();

        try {
            $patient->sharedSpecialists()->attach($prosthetist, [
                'permissions' => ['prosthesis' => [self::PROSTHESIS_ID]],
            ]);
            $this->fail('Invalid permissions were accepted.');
        } catch (InvalidArgumentException) {
            $this->assertDatabaseCount('user_shares', 0);
        }
    }

    public function test_replacing_permissions_keeps_the_share_identity(): void
    {
        $share = UserShare::factory()->create([
            'permissions' => new SharePermissions(prostheses: [self::PROSTHESIS_ID]),
        ]);

        $share->patient->sharedSpecialists()->updateExistingPivot($share->specialist_id, [
            'permissions' => new SharePermissions(incidents: [self::INCIDENT_ID]),
        ]);

        $updated = UserShare::query()->sole();
        $this->assertSame($share->id, $updated->id);
        $this->assertSame([], $updated->permissions->prostheses);
        $this->assertSame([self::INCIDENT_ID], $updated->permissions->incidents);
    }

    public function test_participants_are_not_mass_assignable(): void
    {
        $share = UserShare::factory()->create();
        $otherPatient = User::factory()->create();

        $share->update([
            'patient_id' => $otherPatient->id,
            'permissions' => new SharePermissions(medicalHistory: true),
        ]);

        $share->refresh();
        $this->assertNotSame($otherPatient->id, $share->patient_id);
        $this->assertTrue($share->permissions->medicalHistory);
    }

    public function test_detaching_a_specialist_revokes_the_share(): void
    {
        $share = UserShare::factory()->create();
        $patient = $share->patient;

        $patient->sharedSpecialists()->detach($share->specialist_id);

        $this->assertDatabaseMissing('user_shares', ['id' => $share->id]);
        $this->assertCount(0, $patient->sharedSpecialists);
        $this->assertCount(0, $share->specialist->sharedPatients);
    }

    public function test_a_user_cannot_share_data_with_themselves(): void
    {
        $user = User::factory()->create();

        try {
            $user->sharedSpecialists()->attach($user);
            $this->fail('A self-share was accepted.');
        } catch (DomainException) {
            $this->assertDatabaseCount('user_shares', 0);
        }
    }

    public function test_postgresql_rejects_a_self_share_that_bypasses_the_model(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            $this->markTestSkipped('The self-share CHECK constraint exists only on PostgreSQL.');
        }

        $user = User::factory()->create();

        $this->expectException(QueryException::class);

        DB::table('user_shares')->insert([
            'id' => (string) Str::uuid7(),
            'patient_id' => $user->id,
            'specialist_id' => $user->id,
            'permissions' => json_encode(SharePermissions::none()),
        ]);
    }

    #[DataProvider('invalidShares')]
    public function test_database_rejects_missing_participants_permissions_and_duplicate_pairs(array $overrides, ?string $missingAttribute = null, bool $duplicatePair = false): void
    {
        $patient = User::factory()->create();
        $prosthetist = User::factory()->prosthetist()->create();
        $attributes = [
            'patient_id' => $patient->id,
            'specialist_id' => $prosthetist->id,
            'permissions' => SharePermissions::none(),
        ];

        if ($duplicatePair) {
            UserShare::query()->forceCreate($attributes);
        }

        if ($missingAttribute !== null) {
            unset($attributes[$missingAttribute]);
        }

        $this->expectException(QueryException::class);

        UserShare::query()->forceCreate(array_replace($attributes, $overrides));
    }

    public static function invalidShares(): iterable
    {
        yield 'missing patient' => [[], 'patient_id'];
        yield 'missing specialist' => [[], 'specialist_id'];
        yield 'nonexistent patient' => [['patient_id' => '33333333-3333-4333-8333-333333333333']];
        yield 'nonexistent specialist' => [['specialist_id' => '33333333-3333-4333-8333-333333333333']];
        yield 'missing permissions' => [[], 'permissions'];
        yield 'null permissions' => [['permissions' => null]];
        yield 'duplicate pair' => [[], null, true];
    }

    #[DataProvider('deletedParticipants')]
    public function test_permanent_participant_deletion_cascades_only_related_shares(string $participant): void
    {
        $patient = User::factory()->create();
        $otherPatient = User::factory()->create();
        $prosthetist = User::factory()->prosthetist()->create();
        $otherProsthetist = User::factory()->prosthetist()->create();

        $share = UserShare::factory()->for($patient, 'patient')->for($prosthetist, 'specialist')->create();
        $secondRelatedShare = UserShare::factory()
            ->for($participant === 'patient' ? $patient : $otherPatient, 'patient')
            ->for($participant === 'specialist' ? $prosthetist : $otherProsthetist, 'specialist')
            ->create();
        $unrelatedShare = UserShare::factory()->for($otherPatient, 'patient')->for($otherProsthetist, 'specialist')->create();

        ($participant === 'patient' ? $patient : $prosthetist)->delete();

        $this->assertDatabaseMissing('user_shares', ['id' => $share->id]);
        $this->assertDatabaseMissing('user_shares', ['id' => $secondRelatedShare->id]);
        $this->assertSame([$unrelatedShare->id], UserShare::query()->pluck('id')->all());
    }

    public static function deletedParticipants(): iterable
    {
        yield 'patient' => ['patient'];
        yield 'specialist' => ['specialist'];
    }
}
