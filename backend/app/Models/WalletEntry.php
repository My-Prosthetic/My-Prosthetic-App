<?php

namespace App\Models;

use App\Enums\FundingSource;
use Database\Factories\WalletEntryFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'goal_id', 'source', 'amount', 'assigned_at', 'note'])]
class WalletEntry extends Model
{
    /** @use HasFactory<WalletEntryFactory> */
    use HasFactory, HasUuids;

    protected $keyType = 'string';

    public $incrementing = false;

    /**
     * Get the patient who owns the wallet entry.
     */
    public function patient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Get the model's attribute casts.
     *
     * @return array{
     *     source: 'App\\Enums\\FundingSource',
     *     amount: 'integer',
     *     assigned_at: 'datetime',
     * }
     */
    protected function casts(): array
    {
        return [
            'source' => FundingSource::class,
            'amount' => 'integer',
            'assigned_at' => 'datetime',
        ];
    }
}
