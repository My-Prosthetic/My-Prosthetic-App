<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\User;

/**
 * The Funding Wallet is private to its patient: no prosthetist is ever allowed,
 * whatever their access grant covers.
 */
class WalletEntryPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->role === UserRole::PATIENT;
    }

    public function create(User $user): bool
    {
        return $user->role === UserRole::PATIENT;
    }
}
