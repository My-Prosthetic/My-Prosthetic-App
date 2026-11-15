<?php

namespace App\Models;

use Database\Factories\MeasurementLevelFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'level',
    'distance_cm',
    'circumference_cm',
])]
class MeasurementLevel extends Model
{
    /** @use HasFactory<MeasurementLevelFactory> */
    use HasFactory, HasUuids;

    /**
     * @return BelongsTo<Measurement, $this>
     */
    public function measurement(): BelongsTo
    {
        return $this->belongsTo(Measurement::class);
    }

    protected function casts(): array
    {
        return [
            'level' => 'integer',
            'distance_cm' => 'integer',
            'circumference_cm' => 'float',
        ];
    }
}
