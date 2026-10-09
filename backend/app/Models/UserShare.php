<?php

namespace App\Models;

use App\Casts\AsSharePermissions;
use App\ValueObjects\SharePermissions;
use Database\Factories\UserShareFactory;
use DomainException;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\Pivot;
use Illuminate\Support\Str;

/**
 * A patient's current grant of access to their data for one specialist.
 *
 * Participants are set when the grant is created (for example through
 * User::sharedSpecialists()->attach()) and are not mass assignable afterwards.
 *
 * @property string $id
 * @property string $patient_id
 * @property string $specialist_id
 * @property SharePermissions $permissions
 */
#[Fillable(['permissions'])]
class UserShare extends Pivot
{
    /** @use HasFactory<UserShareFactory> */
    use HasFactory, HasUuids;

    /**
     * Pivot models infer a singular table name, so the table is set explicitly.
     */
    protected $table = 'user_shares';

    /**
     * @return BelongsTo<User, $this>
     */
    public function patient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'patient_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function specialist(): BelongsTo
    {
        return $this->belongsTo(User::class, 'specialist_id');
    }

    protected static function booted(): void
    {
        static::saving(function (UserShare $share): void {
            if ($share->isSharedWithSelf()) {
                throw new DomainException('A user cannot share data with themselves.');
            }
        });
    }

    /**
     * Participants may still be missing before the first save; the database rejects that case.
     */
    private function isSharedWithSelf(): bool
    {
        $patientId = $this->getAttribute('patient_id');
        $specialistId = $this->getAttribute('specialist_id');

        return is_string($patientId)
            && is_string($specialistId)
            && Str::lower($patientId) === Str::lower($specialistId);
    }

    protected function casts(): array
    {
        return ['permissions' => AsSharePermissions::class];
    }
}
