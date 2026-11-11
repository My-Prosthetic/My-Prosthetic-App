<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\User;

class SpecialistNotePolicy
{
    public function create(User $actor, User $patient): bool
    {
        return $actor->role === UserRole::PROSTHETIST
            && $actor->receivedShareFrom($patient) !== null;
    }
}
