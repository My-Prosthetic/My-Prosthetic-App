<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\User;

class UserPolicy
{
    /**
     * Whether the actor may see this patient's records at all; record policies decide
     * which ones. A grant that selects nothing still lets the relationship be seen.
     */
    public function viewRecords(User $actor, User $patient): bool
    {
        if ($patient->role !== UserRole::PATIENT) {
            return false;
        }

        return $actor->is($patient)
            || ($actor->role === UserRole::PROSTHETIST && $actor->receivedShareFrom($patient) !== null);
    }
}
