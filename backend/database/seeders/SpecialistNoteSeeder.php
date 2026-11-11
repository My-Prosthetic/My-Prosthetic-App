<?php

namespace Database\Seeders;

use App\Enums\SpecialistNoteType;
use App\Enums\UserRole;
use App\Models\SpecialistNote;
use App\Models\User;
use App\ValueObjects\SharePermissions;
use Database\Seeders\Concerns\SeedsDemoData;
use Illuminate\Database\Seeder;

class SpecialistNoteSeeder extends Seeder
{
    use SeedsDemoData;

    public function run(): void
    {
        if (! $this->isDemoEnvironment()) {
            return;
        }

        $patient = User::query()->firstOrCreate(
            ['email' => 'prosthesis.patient@example.com'],
            [
                'name' => 'Prosthesis Patient',
                'password' => 'password',
                'role' => UserRole::PATIENT,
                'email_verified_at' => now(),
            ],
        );

        $prosthetist = User::query()->firstOrCreate(
            ['email' => 'demo.prosthetist@example.com'],
            [
                'name' => 'Demo Prosthetist',
                'password' => 'password',
                'role' => UserRole::PROSTHETIST,
                'email_verified_at' => now(),
            ],
        );

        if ($prosthetist->receivedShareFrom($patient) === null) {
            $patient->sharedSpecialists()->attach($prosthetist, [
                'permissions' => new SharePermissions(medicalHistory: true),
            ]);
        }

        if ($prosthetist->authoredNotes()->whereBelongsTo($patient, 'patient')->exists()) {
            return;
        }

        $this->addNote($patient, $prosthetist, SpecialistNoteType::TECHNICAL_NOTE, 'Fitted a new test socket and set the foot alignment.', daysAgo: 21);
        $this->addNote($patient, $prosthetist, SpecialistNoteType::RECOMMENDATION, 'Wear the test socket for two hours a day and note any pressure points.', daysAgo: 20);
        $this->addNote($patient, $prosthetist, SpecialistNoteType::TECHNICAL_NOTE, 'Shortened the pylon by 5 mm; the gait is more even now.', daysAgo: 7);
        $this->addNote($patient, $prosthetist, SpecialistNoteType::RECOMMENDATION, 'Measure the stump every morning this week.', daysAgo: 6)
            ->correct('Measure the stump every morning and evening this week.');
    }

    private function addNote(User $patient, User $author, SpecialistNoteType $type, string $content, int $daysAgo): SpecialistNote
    {
        $note = $patient->specialistNotes()->make(['type' => $type, 'content' => $content]);
        $note->author()->associate($author);
        $note->created_at = now()->subDays($daysAgo);
        $note->save();

        return $note;
    }
}
