<?php

namespace Database\Factories;

use App\Enums\KLevel;
use App\Models\MedicalProfile;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<MedicalProfile>
 */
class MedicalProfileFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'k_level' => fake()->optional()->randomElement(KLevel::cases()),
        ];
    }
}
