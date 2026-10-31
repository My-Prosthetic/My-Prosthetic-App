<?php

namespace Tests\Feature;

use App\Enums\KLevel;
use App\Models\MedicalProfile;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Tests\TestCase;
use ValueError;

class MedicalProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_patient_has_a_medical_profile_with_a_uuid(): void
    {
        $patient = User::factory()->create();

        $profile = $patient->medicalProfile()->create(['k_level' => KLevel::K3]);

        $this->assertTrue(Str::isUuid($profile->id));
        $this->assertTrue($profile->patient->is($patient));
        $this->assertTrue($patient->medicalProfile->is($profile));
    }

    public function test_k_level_is_read_as_an_enum_and_may_be_empty(): void
    {
        $withLevel = MedicalProfile::factory()->create(['k_level' => 'K2']);
        $withoutLevel = MedicalProfile::factory()->create(['k_level' => null]);

        $this->assertSame(KLevel::K2, $withLevel->refresh()->k_level);
        $this->assertNull($withoutLevel->refresh()->k_level);
    }

    public function test_model_rejects_an_unknown_k_level(): void
    {
        $this->expectException(ValueError::class);

        new MedicalProfile(['k_level' => 'K9']);
    }

    public function test_database_rejects_an_unknown_k_level(): void
    {
        $patient = User::factory()->create();

        $this->expectException(QueryException::class);

        DB::table('medical_profiles')->insert([
            'id' => (string) Str::uuid(),
            'user_id' => $patient->id,
            'k_level' => 'K9',
        ]);
    }

    public function test_id_and_owner_are_not_mass_assignable(): void
    {
        $otherPatient = User::factory()->create();

        $profile = new MedicalProfile([
            'id' => 'forged',
            'user_id' => $otherPatient->id,
            'k_level' => 'K1',
        ]);

        $this->assertNull($profile->id);
        $this->assertNull($profile->user_id);
        $this->assertSame(KLevel::K1, $profile->k_level);
    }

    public function test_patient_cannot_have_two_medical_profiles(): void
    {
        $patient = User::factory()->create();
        $patient->medicalProfile()->create([]);

        $this->expectException(QueryException::class);

        $patient->medicalProfile()->create([]);
    }

    public function test_deleting_the_patient_deletes_their_medical_profile(): void
    {
        $profile = MedicalProfile::factory()->create();

        $profile->patient->delete();

        $this->assertModelMissing($profile);
    }

    public function test_owner_column_is_indexed(): void
    {
        $this->assertContains(['user_id'], array_column(Schema::getIndexes('medical_profiles'), 'columns'));
    }
}
