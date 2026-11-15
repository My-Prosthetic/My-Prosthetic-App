<?php

namespace App\Models;

use App\Enums\LimbType;
use App\Enums\ProsthesisSide;
use App\Enums\UserRole;
use Database\Factories\ProsthesisFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable([
    'user_id',
    'name',
    'side',
    'limb_type',
    'amputation_level',
    'replacement_at',
])]
class Prosthesis extends Model
{
    /** @use HasFactory<ProsthesisFactory> */
    use HasFactory, HasUuids, SoftDeletes;

    public $incrementing = false;

    protected $keyType = 'string';

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return HasMany<Component, $this>
     */
    public function components(): HasMany
    {
        return $this->hasMany(Component::class);
    }

    /**
     * @return HasMany<Incident, $this>
     */
    public function incidents(): HasMany
    {
        return $this->hasMany(Incident::class);
    }

    /**
     * Narrow the query to the patient's prostheses the actor may see: all of them for
     * the patient, the ones the current grant selects for a prosthetist, and none for
     * anyone else. Deleted prostheses stay hidden even while they are still selected.
     *
     * @param  Builder<self>  $query
     */
    #[Scope]
    protected function visibleTo(Builder $query, User $actor, User $patient): void
    {
        $query->whereBelongsTo($patient, 'user');

        if ($actor->is($patient)) {
            return;
        }

        $grant = $actor->role === UserRole::PROSTHETIST ? $actor->receivedShareFrom($patient) : null;

        $query->whereKey($grant === null ? [] : $grant->permissions->prostheses);
    }

    /**
     * @return array{
     *     side: 'App\\Enums\\ProsthesisSide',
     *     limb_type: 'App\\Enums\\LimbType',
     *     replacement_at: 'datetime',
     * }
     */
    protected function casts(): array
    {
        return [
            'side' => ProsthesisSide::class,
            'limb_type' => LimbType::class,
            'replacement_at' => 'datetime',
        ];
    }
}
