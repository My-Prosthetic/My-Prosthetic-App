<?php

namespace App\Models;

use Database\Factories\ConditionFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable([
    'name',
])]
class Condition extends Model
{
    /** @use HasFactory<ConditionFactory> */
    use HasFactory, HasUuids, SoftDeletes;

    protected function casts(): array
    {
        return [
            'name' => 'encrypted',
        ];
    }

    /**
     * @return BelongsTo<MedicalProfile, $this>
     */
    public function medicalProfile(): BelongsTo
    {
        return $this->belongsTo(MedicalProfile::class);
    }
}
