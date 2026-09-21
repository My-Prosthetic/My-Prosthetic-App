<?php

namespace Database\Factories;

use App\Enums\ComponentType;
use App\Models\Component;
use App\Models\Prosthesis;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Component> */
class ComponentFactory extends Factory
{
    protected $model = Component::class;

    public function definition(): array
    {
        return [
            'prosthesis_id' => Prosthesis::factory(),
            'type' => fake()->randomElement(ComponentType::cases()),
            'name' => fake()->optional()->words(2, true),
            'manufacturer' => fake()->optional()->company(),
            'model' => fake()->optional()->bothify('Model-###'),
            'serial_number' => fake()->optional()->bothify('SN-########'),
            'is_test_socket' => fake()->optional()->boolean(),
            'installed_at' => fake()->dateTimeBetween('-2 years', 'now'),
            'replacement_at' => fake()->optional()->dateTimeBetween('+1 month', '+5 years'),
            'warranty_until' => fake()->optional()->dateTimeBetween('+1 month', '+5 years'),
        ];
    }
}
