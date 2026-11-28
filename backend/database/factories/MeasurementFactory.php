<?php

namespace Database\Factories;

use App\Enums\LimbType;
use App\Enums\ProsthesisSide;
use App\Models\Measurement;
use App\Models\MeasurementLevel;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\Sequence;

/**
 * @extends Factory<Measurement>
 */
class MeasurementFactory extends Factory
{
    private const DISTANCES = [15, 10, 5, 20, 25];

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

    public function withLevels(int $count = 3): static
    {
        return $this->has(
            MeasurementLevel::factory()
                ->count($count)
                ->sequence(fn (Sequence $sequence): array => [
                    'level' => $sequence->index % $count + 1,
                    'distance_cm' => self::DISTANCES[$sequence->index % $count],
                ]),
            'levels',
        );
    }
}
