<?php

namespace Database\Factories;

use App\Models\Prosthesis;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Prosthesis> */
class ProsthesisFactory extends Factory
{
    protected $model = Prosthesis::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'name' => fake()->words(2, true),
            'side' => fake()->randomElement(['left', 'right']),
            'limb_type' => fake()->randomElement(['upper', 'lower']),
            'amputation_level' => fake()->randomElement([
                'transradial',
                'transhumeral',
                'transtibial',
                'transfemoral',
            ]),
            'replacement_at' => fake()->dateTimeBetween('+1 month', '+5 years'),
        ];
    }
}
