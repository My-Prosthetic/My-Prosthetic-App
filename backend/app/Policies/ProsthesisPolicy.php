<?php

namespace App\Policies;

use App\Models\Prosthesis;
use App\Models\User;

class ProsthesisPolicy
{
    /**
     * Asks the same visibility scope the list uses, so a single read can never allow
     * more than the list shows. The grant is looked up from the prosthesis's own
     * owner, so a selected id cannot open another patient's prosthesis.
     */
    public function view(User $actor, Prosthesis $prosthesis): bool
    {
        return Prosthesis::query()
            ->visibleTo($actor, $prosthesis->user)
            ->whereKey($prosthesis->getKey())
            ->exists();
    }
}
