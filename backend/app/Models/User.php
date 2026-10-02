<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Enums\UserRole;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['name', 'email', 'password', 'role'])]
#[Hidden(['password', 'remember_token'])]
/**
 * @property string $id
 * @property Carbon|null $email_verified_at
 * @property UserRole $role
 */
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, HasUuids, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array{
     *     email_verified_at: 'datetime',
     *     password: 'hashed',
     *     role: 'App\\Enums\\UserRole',
     * }
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'role' => UserRole::class,
        ];
    }

    public function prostheses(): HasMany
    {
        return $this->hasMany(Prosthesis::class);
    }

    /**
     * Get the patient's wallet entries.
     */
    public function walletEntries(): HasMany
    {
        return $this->hasMany(WalletEntry::class);
    }
}
