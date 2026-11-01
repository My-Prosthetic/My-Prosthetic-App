<?php

namespace Database\Factories;

use App\Models\Incident;
use App\Models\Prosthesis;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Incident>
 */
class IncidentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $incident = fake()->randomElement([
            ['type' => 'pain', 'description' => 'Sharp pain at the distal end of the stump when putting weight on the prosthesis.'],
            ['type' => 'abrasion', 'description' => 'Red, chafed skin on the inner side of the stump after a long walk.'],
            ['type' => 'poor_fit', 'description' => 'The socket feels loose and the stump slides down by the end of the day.'],
            ['type' => 'phantom_pain', 'description' => 'Burning sensation in the missing foot, worse in the evening.'],
            ['type' => 'mechanical_failure', 'description' => 'The foot makes a clicking noise and the heel no longer absorbs impact.'],
        ]);

        return [
            'prosthesis_id' => Prosthesis::factory(),
            'type' => $incident['type'],
            'activity' => fake()->optional()->randomElement(['walking', 'running', 'sitting', 'standing', 'sport']),
            'description' => $incident['description'],
            'occurred_at' => fake()->dateTimeBetween('-6 months', 'now'),
        ];
    }
}
