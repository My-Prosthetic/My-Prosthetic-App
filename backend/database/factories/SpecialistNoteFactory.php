<?php

namespace Database\Factories;

use App\Enums\SpecialistNoteType;
use App\Models\SpecialistNote;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SpecialistNote>
 */
class SpecialistNoteFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'patient_id' => User::factory(),
            'author_id' => User::factory()->prosthetist(),
            'type' => fake()->randomElement(SpecialistNoteType::cases()),
            'content' => fake()->randomElement([
                'Shortened the pylon by 5 mm and realigned the foot.',
                'Replaced the liner; the skin under the socket edge was red.',
                'Please measure the stump every morning and evening this week.',
                'Skip the extra sock tomorrow morning and call if the socket feels loose.',
            ]),
        ];
    }

    /**
     * Indicate that the note is a Technical Note for specialists.
     */
    public function technicalNote(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => SpecialistNoteType::TECHNICAL_NOTE,
        ]);
    }

    /**
     * Indicate that the note is a Recommendation the patient also sees.
     */
    public function recommendation(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => SpecialistNoteType::RECOMMENDATION,
        ]);
    }
}
