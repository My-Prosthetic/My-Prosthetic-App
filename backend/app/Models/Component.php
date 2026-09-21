<?php

namespace App\Models;

use App\Enums\ComponentType;
use Database\Factories\ComponentFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable([
    'prosthesis_id',
    'type',
    'name',
    'manufacturer',
    'model',
    'serial_number',
    'is_test_socket',
    'installed_at',
    'replacement_at',
    'warranty_until',
])]
class Component extends Model
{
    /** @use HasFactory<ComponentFactory> */
    use HasFactory, HasUuids, SoftDeletes;

    public $incrementing = false;

    protected $keyType = 'string';

    public function prosthesis(): BelongsTo
    {
        return $this->belongsTo(Prosthesis::class);
    }

    protected function casts(): array
    {
        return [
            'type' => ComponentType::class,
            'is_test_socket' => 'boolean',
            'installed_at' => 'datetime',
            'replacement_at' => 'datetime',
            'warranty_until' => 'datetime',
        ];
    }
}
