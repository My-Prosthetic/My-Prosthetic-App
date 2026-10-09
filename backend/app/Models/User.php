<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Enums\UserRole;
use App\Support\SpecialistCode;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['name', 'email', 'password', 'role'])]
#[Hidden(['password', 'remember_token'])]
/**
 * @property string $id
 * @property string $name
 * @property string $search_name
 * @property Carbon|null $email_verified_at
 * @property UserRole $role
 * @property string|null $specialist_code
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

    /**
     * Fold a name or query to the lowercase ASCII form compared by specialist search.
     */
    public static function searchNameFrom(string $value): string
    {
        return Str::lower(Str::transliterate($value));
    }

    /**
     * Keep the derived search name in step with the name. A mutator, not a model
     * event, so seeders that mute events still produce searchable users.
     *
     * @return Attribute<string, string>
     */
    protected function name(): Attribute
    {
        return Attribute::set(fn (string $value): array => [
            'name' => $value,
            'search_name' => self::searchNameFrom($value),
        ]);
    }

    /**
     * Give prosthetists a Specialist Code and keep it null for every other role.
     * Like the search name, this is a mutator so it also works with muted events.
     *
     * @return Attribute<UserRole, UserRole|string>
     */
    protected function role(): Attribute
    {
        return Attribute::set(function (UserRole|string $value, array $attributes): array {
            $role = $value instanceof UserRole ? $value : UserRole::from($value);

            return [
                'role' => $role->value,
                'specialist_code' => $role === UserRole::PROSTHETIST
                    ? ($attributes['specialist_code'] ?? self::unusedSpecialistCode())
                    : null,
            ];
        });
    }

    private static function unusedSpecialistCode(): string
    {
        return SpecialistCode::generate(
            fn (string $code): bool => self::query()->where('specialist_code', $code)->exists(),
        );
    }

    /**
     * @return HasMany<Prosthesis, $this>
     */
    public function prostheses(): HasMany
    {
        return $this->hasMany(Prosthesis::class);
    }

    /**
     * Get the shares this patient has granted.
     *
     * @return HasMany<UserShare, $this>
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
