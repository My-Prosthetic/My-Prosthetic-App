<?php

namespace App\Models;

use App\Enums\KLevel;
use Database\Factories\MedicalProfileFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'k_level',
])]
class MedicalProfile extends Model
{
    /** @use HasFactory<MedicalProfileFactory> */
    use HasFactory, HasUuids;

    protected function casts(): array
    {
        return [
            'k_level' => KLevel::class,
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function patient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
