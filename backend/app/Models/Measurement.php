<?php

namespace App\Models;

use App\Enums\LimbType;
use App\Enums\ProsthesisSide;
use Database\Factories\MeasurementFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable([
    'side',
    'limb_type',
    'measured_at',
])]
class Measurement extends Model
{
    /** @use HasFactory<MeasurementFactory> */
    use HasFactory, HasUuids, SoftDeletes;

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return HasMany<MeasurementLevel, $this>
     */
    public function levels(): HasMany
    {
        return $this->hasMany(MeasurementLevel::class)->orderBy('level');
    }

    protected function casts(): array
    {
        return [
            'side' => ProsthesisSide::class,
            'limb_type' => LimbType::class,
            'measured_at' => 'datetime',
        ];
    }
}
