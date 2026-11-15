<?php

namespace Database\Factories;

use App\Models\Measurement;
use App\Models\MeasurementLevel;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<MeasurementLevel>
 */
class MeasurementLevelFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'measurement_id' => Measurement::factory(),
            'level' => 1,
            'distance_cm' => 15,
            'circumference_cm' => fake()->randomFloat(2, 25, 50),
        ];
    }
}
