<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\SpecialistNote;
use App\Models\User;

class SpecialistNotePolicy
{
    public function create(User $actor, User $patient): bool
    {
        return $actor->role === UserRole::PROSTHETIST
            && $actor->receivedShareFrom($patient) !== null;
    }

    public function update(User $actor, SpecialistNote $note): bool
    {
        return $note->author_id === $actor->id
            && $this->create($actor, $note->patient);
    }
}
