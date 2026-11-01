<?php

namespace Database\Factories;

use App\Enums\ComponentType;
use App\Enums\SocketView;
use App\Models\Component;
use App\Models\Incident;
use App\Models\Prosthesis;
use App\ValueObjects\PainPoint;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Incident>
 */
class IncidentFactory extends Factory
{
    private const INCIDENTS = [
        ['type' => 'pain', 'description' => 'Sharp pain at the distal end of the stump when putting weight on the prosthesis.'],
        ['type' => 'abrasion', 'description' => 'Red, chafed skin on the inner side of the stump after a long walk.'],
        ['type' => 'poor_fit', 'description' => 'The socket feels loose and the stump slides down by the end of the day.'],
        ['type' => 'phantom_pain', 'description' => 'Burning sensation in the missing foot, worse in the evening.'],
        ['type' => 'mechanical_failure', 'description' => 'The foot makes a clicking noise and the heel no longer absorbs impact.'],
    ];

    /**
     * Incident types that can be located on the socket diagram.
     */
    private const SOCKET_TYPES = ['pain', 'abrasion', 'poor_fit'];

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $incident = fake()->randomElement(self::INCIDENTS);

        return [
            'prosthesis_id' => Prosthesis::factory(),
            'type' => $incident['type'],
            'activity' => fake()->optional()->randomElement(['walking', 'running', 'sitting', 'standing', 'sport']),
            'intensity' => $incident['type'] === 'mechanical_failure' ? null : fake()->numberBetween(1, 10),
            'description' => $incident['description'],
            'occurred_at' => fake()->dateTimeBetween('-6 months', 'now'),
        ];
    }

    /**
     * Tie the incident to a socket of its prosthesis, with a pain point on the socket diagram.
     */
    public function onSocket(): static
    {
        $incident = fake()->randomElement(array_filter(
            self::INCIDENTS,
            fn (array $incident): bool => in_array($incident['type'], self::SOCKET_TYPES, true),
        ));

        return $this->state([
            'type' => $incident['type'],
            'intensity' => fake()->numberBetween(1, 10),
            'description' => $incident['description'],
            'component_id' => fn (array $attributes) => Component::factory()->create([
                'prosthesis_id' => $attributes['prosthesis_id'],
                'type' => ComponentType::SOCKET,
            ]),
            'pain_point' => fn () => new PainPoint(
                fake()->randomFloat(2, 0, 1),
                fake()->randomFloat(2, 0, 1),
                fake()->randomElement(SocketView::cases()),
            ),
        ]);
    }
}
