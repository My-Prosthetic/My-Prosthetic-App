<?php

namespace Database\Factories;

use App\Enums\IncidentMediaKind;
use App\Models\Incident;
use App\Models\IncidentMedia;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<IncidentMedia>
 */
class IncidentMediaFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $kind = fake()->randomElement(IncidentMediaKind::cases());

        [$mimeType, $extension] = match ($kind) {
            IncidentMediaKind::PHOTO => ['image/jpeg', 'jpg'],
            IncidentMediaKind::VOICE_NOTE => ['audio/mp4', 'm4a'],
        };

        return [
            'incident_id' => Incident::factory(),
            'kind' => $kind,
            'path' => fn (array $attributes) => "incidents/{$attributes['incident_id']}/".Str::uuid().".{$extension}",
            'mime_type' => $mimeType,
            'size_bytes' => fake()->numberBetween(20_000, 5_000_000),
        ];
    }
}
