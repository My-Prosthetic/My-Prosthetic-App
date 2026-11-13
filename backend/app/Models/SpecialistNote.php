<?php

namespace App\Models;

use App\Enums\SpecialistNoteType;
use App\Enums\UserRole;
use Database\Factories\SpecialistNoteFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;

#[Fillable([
    'type',
    'content',
])]
class SpecialistNote extends Model
{
    /** @use HasFactory<SpecialistNoteFactory> */
    use HasFactory, HasUuids;

    public const MAX_CONTENT_LENGTH = 5000;

    /**
     * @return array{
     *     type: 'App\\Enums\\SpecialistNoteType',
     *     content: 'encrypted',
     *     edited_at: 'datetime',
     * }
     */
    protected function casts(): array
    {
        return [
            'type' => SpecialistNoteType::class,
            'content' => 'encrypted',
            'edited_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function patient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'patient_id');
    }

    /**
     * Author is null when their account no longer exists.
     *
     * @return BelongsTo<User, $this>
     */
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    /**
     * @return HasMany<SpecialistNoteRevision, $this>
     */
    public function revisions(): HasMany
    {
        return $this->hasMany(SpecialistNoteRevision::class);
    }

    /**
     * The note is re-read under a lock, so concurrent corrections each keep the text they replaced.
     */
    public function correct(string $content): void
    {
        DB::transaction(function () use ($content): void {
            $current = self::query()->lockForUpdate()->findOrFail($this->id);

            if ($current->content === $content) {
                return;
            }

            $current->revisions()->create(['content' => $current->content]);
            $current->content = $content;
            $current->edited_at = now();
            $current->save();
        });

        $this->refresh();
    }

    /**
     * @param  Builder<self>  $query
     */
    #[Scope]
    protected function visibleTo(Builder $query, User $actor, User $patient): void
    {
        $query->whereBelongsTo($patient, 'patient');

        if ($actor->is($patient)) {
            $query->where('type', SpecialistNoteType::RECOMMENDATION);

            return;
        }

        $grant = $actor->role === UserRole::PROSTHETIST ? $actor->receivedShareFrom($patient) : null;

        if ($grant === null) {
            $query->whereKey([]);

            return;
        }

        if (! $grant->permissions->medicalHistory) {
            $query->whereBelongsTo($actor, 'author');
        }
    }
}
