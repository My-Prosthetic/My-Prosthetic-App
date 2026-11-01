<?php

namespace App\Models;

use App\Casts\AsEncryptedInteger;
use App\Casts\AsPainPoint;
use Database\Factories\IncidentFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable([
    'type',
    'activity',
    'intensity',
    'description',
    'pain_point',
    'occurred_at',
])]
class Incident extends Model
{
    /** @use HasFactory<IncidentFactory> */
    use HasFactory, HasUuids, SoftDeletes;

    protected static function booted(): void
    {
        static::addGlobalScope('active_prosthesis', static function (Builder $builder): void {
            $builder->whereHas('prosthesis');
        });
    }

    /**
     * @return BelongsTo<Prosthesis, $this>
     */
    public function prosthesis(): BelongsTo
    {
        return $this->belongsTo(Prosthesis::class);
    }

    /**
     * @return BelongsTo<Component, $this>
     */
    public function component(): BelongsTo
    {
        return $this->belongsTo(Component::class);
    }

    protected function casts(): array
    {
        return [
            'type' => 'encrypted',
            'activity' => 'encrypted',
            'intensity' => AsEncryptedInteger::class,
            'description' => 'encrypted',
            'pain_point' => AsPainPoint::class,
            'occurred_at' => 'datetime',
        ];
    }
}
