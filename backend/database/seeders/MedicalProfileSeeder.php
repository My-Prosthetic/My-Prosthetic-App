<?php

namespace Database\Seeders;

use App\Enums\KLevel;
use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Seeder;

class MedicalProfileSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $patient = User::query()->firstOrCreate(
            ['email' => 'prosthesis.patient@example.com'],
            [
                'name' => 'Prosthesis Patient',
                'password' => 'password',
                'role' => UserRole::PATIENT,
                'email_verified_at' => now(),
            ],
        );

        $profile = $patient->medicalProfile()->updateOrCreate([], ['k_level' => KLevel::K3]);

        if ($profile->conditions()->doesntExist()) {
            $profile->conditions()->createMany([
                ['name' => 'Type 2 diabetes'],
                ['name' => 'Latex allergy'],
            ]);
        }

        if ($profile->medications()->doesntExist()) {
            $profile->medications()->createMany([
                ['name' => 'Metformin 500 mg', 'usage' => 'Type 2 diabetes'],
                ['name' => 'Gabapentin 300 mg', 'usage' => 'Phantom pain'],
            ]);
        }
    }
}
