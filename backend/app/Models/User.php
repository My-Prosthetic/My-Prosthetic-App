<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Enums\UserRole;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
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
     * Get the shares this patient has granted.
     */
    public function grantedShares(): HasMany
    {
        return $this->hasMany(UserShare::class, 'patient_id');
    }

    /**
     * Get the shares this specialist has received.
     */
    public function receivedShares(): HasMany
    {
        return $this->hasMany(UserShare::class, 'specialist_id');
    }

    /**
     * Get the specialists this patient shares data with; the grant is available as `share`.
     */
    public function sharedSpecialists(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_shares', 'patient_id', 'specialist_id')
            ->using(UserShare::class)
            ->as('share')
            ->withPivot('id', 'permissions')
            ->withTimestamps();
    }

    /**
     * Get the patients sharing data with this specialist; the grant is available as `share`.
     */
    public function sharedPatients(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_shares', 'specialist_id', 'patient_id')
            ->using(UserShare::class)
            ->as('share')
            ->withPivot('id', 'permissions')
            ->withTimestamps();
    }

    /**
     * Get the patient's wallet entries.
     */
    public function walletEntries(): HasMany
    {
        return $this->hasMany(WalletEntry::class);
    }
}
