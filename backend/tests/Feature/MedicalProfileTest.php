<?php

namespace Tests\Feature;

use App\Enums\KLevel;
use App\Models\Condition;
use App\Models\MedicalProfile;
use App\Models\Medication;
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

    public function test_medical_profile_has_conditions(): void
    {
        $profile = MedicalProfile::factory()->create();

        $condition = $profile->conditions()->create(['name' => 'Latex allergy']);

        $this->assertTrue(Str::isUuid($condition->id));
        $this->assertTrue($condition->medicalProfile->is($profile));
        $this->assertTrue($profile->conditions->contains($condition));
    }

    public function test_condition_name_is_encrypted_at_rest(): void
    {
        $condition = Condition::factory()->create(['name' => 'Latex allergy']);

        $storedName = DB::table('conditions')->where('id', $condition->id)->value('name');

        $this->assertNotSame('Latex allergy', $storedName);
        $this->assertStringNotContainsString('Latex', $storedName);
        $this->assertSame('Latex allergy', $condition->refresh()->name);
    }

    public function test_condition_cannot_be_moved_to_another_profile_by_mass_assignment(): void
    {
        $otherProfile = MedicalProfile::factory()->create();

        $condition = new Condition([
            'medical_profile_id' => $otherProfile->id,
            'name' => 'Hypertension',
        ]);

        $this->assertNull($condition->medical_profile_id);
        $this->assertSame('Hypertension', $condition->name);
    }

    public function test_deleted_condition_leaves_the_profile_but_stays_in_the_database(): void
    {
        $condition = Condition::factory()->create();

        $condition->delete();

        $this->assertSame(0, $condition->medicalProfile->conditions()->count());
        $this->assertSoftDeleted($condition);
    }

    public function test_deleting_the_patient_deletes_their_conditions_including_deleted_ones(): void
    {
        $profile = MedicalProfile::factory()->create();
        $activeCondition = Condition::factory()->for($profile)->create();
        $deletedCondition = Condition::factory()->for($profile)->create();
        $deletedCondition->delete();

        $profile->patient->delete();

        $this->assertModelMissing($activeCondition);
        $this->assertModelMissing($deletedCondition);
    }

    public function test_condition_profile_column_is_indexed(): void
    {
        $this->assertContains(['medical_profile_id'], array_column(Schema::getIndexes('conditions'), 'columns'));
    }

    public function test_medical_profile_has_medications(): void
    {
        $profile = MedicalProfile::factory()->create();

        $medication = $profile->medications()->create([
            'name' => 'Gabapentin 300 mg',
            'usage' => 'Phantom pain',
        ]);

        $this->assertTrue(Str::isUuid($medication->id));
        $this->assertTrue($medication->medicalProfile->is($profile));
        $this->assertTrue($profile->medications->contains($medication));
    }

    public function test_medication_name_and_usage_are_encrypted_at_rest(): void
    {
        $medication = Medication::factory()->create([
            'name' => 'Gabapentin 300 mg',
            'usage' => 'Phantom pain',
        ]);

        $stored = DB::table('medications')->where('id', $medication->id)->first();

        $this->assertStringNotContainsString('Gabapentin', $stored->name);
        $this->assertStringNotContainsString('Phantom', $stored->usage);

        $medication->refresh();

        $this->assertSame('Gabapentin 300 mg', $medication->name);
        $this->assertSame('Phantom pain', $medication->usage);
    }

    public function test_medication_cannot_be_moved_to_another_profile_by_mass_assignment(): void
    {
        $otherProfile = MedicalProfile::factory()->create();

        $medication = new Medication([
            'medical_profile_id' => $otherProfile->id,
            'name' => 'Ramipril 5 mg',
            'usage' => 'Hypertension',
        ]);

        $this->assertNull($medication->medical_profile_id);
        $this->assertSame('Ramipril 5 mg', $medication->name);
        $this->assertSame('Hypertension', $medication->usage);
    }

    public function test_deleted_medication_leaves_the_profile_but_stays_in_the_database(): void
    {
        $medication = Medication::factory()->create();

        $medication->delete();

        $this->assertSame(0, $medication->medicalProfile->medications()->count());
        $this->assertSoftDeleted($medication);
    }

    public function test_deleting_the_patient_deletes_their_medications_including_deleted_ones(): void
    {
        $profile = MedicalProfile::factory()->create();
        $activeMedication = Medication::factory()->for($profile)->create();
        $deletedMedication = Medication::factory()->for($profile)->create();
        $deletedMedication->delete();

        $profile->patient->delete();

        $this->assertModelMissing($activeMedication);
        $this->assertModelMissing($deletedMedication);
    }

    public function test_medication_profile_column_is_indexed(): void
    {
        $this->assertContains(['medical_profile_id'], array_column(Schema::getIndexes('medications'), 'columns'));
    }
}
