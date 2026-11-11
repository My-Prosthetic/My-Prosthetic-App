<?php

namespace App\Models;

use App\Enums\SpecialistNoteType;
use Database\Factories\SpecialistNoteFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
}
