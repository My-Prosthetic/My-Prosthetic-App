<?php

namespace App\Models;

use Database\Factories\ProsthesisFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
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

    protected static function booted(): void
    {
        static::deleting(function (self $prosthesis): void {
            if (! $prosthesis->isForceDeleting()) {
                $prosthesis->components()->delete();
            }
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function components(): HasMany
    {
        return $this->hasMany(Component::class);
    }

    protected function casts(): array
    {
        return [
            'replacement_at' => 'datetime',
        ];
    }
}
