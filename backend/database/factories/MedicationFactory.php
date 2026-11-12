<?php

namespace Database\Factories;

use App\Models\MedicalProfile;
use App\Models\Medication;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Medication>
 */
class MedicationFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $medication = fake()->randomElement([
            ['name' => 'Ibuprofen 400 mg', 'usage' => 'Phantom pain'],
            ['name' => 'Metformin 500 mg', 'usage' => 'Type 2 diabetes'],
            ['name' => 'Ramipril 5 mg', 'usage' => 'Hypertension'],
            ['name' => 'Gabapentin 300 mg', 'usage' => 'Neuropathic pain'],
            ['name' => 'Cetirizine 10 mg', 'usage' => 'Allergy'],
            ['name' => 'Acetylsalicylic acid 75 mg', 'usage' => 'Blood clot prevention'],
        ]);

        return [
            'medical_profile_id' => MedicalProfile::factory(),
            'name' => $medication['name'],
            'usage' => $medication['usage'],
        ];
    }
}
