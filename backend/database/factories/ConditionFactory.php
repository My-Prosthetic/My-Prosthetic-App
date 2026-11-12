<?php

namespace Database\Factories;

use App\Models\Condition;
use App\Models\MedicalProfile;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Condition>
 */
class ConditionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'medical_profile_id' => MedicalProfile::factory(),
            'name' => fake()->randomElement([
                'Type 2 diabetes',
                'Hypertension',
                'Latex allergy',
                'Peripheral artery disease',
                'Phantom limb pain',
                'Penicillin allergy',
            ]),
        ];

    }
}
