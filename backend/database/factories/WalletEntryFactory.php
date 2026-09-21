<?php

namespace Database\Factories;

use App\Enums\FundingSource;
use App\Models\User;
use App\Models\WalletEntry;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<WalletEntry>
 */
class WalletEntryFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var class-string<WalletEntry>
     */
    protected $model = WalletEntry::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'goal_id' => fake()->uuid(),
            'source' => fake()->randomElement(FundingSource::values()),
            'amount' => fake()->numberBetween(1, 10_000_000),
            'assigned_at' => fake()->dateTimeBetween('-1 year', 'now'),
            'note' => fake()->optional()->sentence(),
        ];
    }
}
