<?php

namespace Database\Factories;

use App\Enums\LimbType;
use App\Enums\ProsthesisSide;
use App\Models\Measurement;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Measurement>
 */
class MeasurementFactory extends Factory
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
            'side' => fake()->randomElement(ProsthesisSide::cases()),
            'limb_type' => fake()->randomElement(LimbType::cases()),
            'measured_at' => fake()->dateTimeBetween('-6 months', 'now'),
        ];
    }
}
