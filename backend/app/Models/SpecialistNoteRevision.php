<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['content'])]
class SpecialistNoteRevision extends Model
{
    use HasUuids;

    public const UPDATED_AT = null;

    protected function casts(): array
    {
        return [
            'content' => 'encrypted',
        ];
    }

    /**
     * @return BelongsTo<SpecialistNote, $this>
     */
    public function note(): BelongsTo
    {
        return $this->belongsTo(SpecialistNote::class, 'specialist_note_id');
    }
}
