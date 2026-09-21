<?php

namespace App\Models;

use Database\Factories\GoalFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['id'])]
class Goal extends Model
{
    /** @use HasFactory<GoalFactory> */
    use HasFactory, HasUuids;

    protected $keyType = 'string';

    public $incrementing = false;

    public function walletEntries(): HasMany
    {
        return $this->hasMany(WalletEntry::class);
    }
}
