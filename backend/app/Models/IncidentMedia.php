<?php

namespace App\Models;

use App\Enums\IncidentMediaKind;
use Database\Factories\IncidentMediaFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'kind',
    'path',
    'mime_type',
    'size_bytes',
])]
class IncidentMedia extends Model
{
    /** @use HasFactory<IncidentMediaFactory> */
    use HasFactory, HasUuids;

    /**
     * @return BelongsTo<Incident, $this>
     */
    public function incident(): BelongsTo
    {
        return $this->belongsTo(Incident::class);
    }

    protected function casts(): array
    {
        return [
            'kind' => IncidentMediaKind::class,
            'size_bytes' => 'integer',
        ];
    }
}
