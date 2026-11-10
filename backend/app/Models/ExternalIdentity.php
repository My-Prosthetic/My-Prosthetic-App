<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExternalIdentity extends Model
{
    protected $fillable = [
        'user_id',
        'provider',
        'provider_user_id',
    ];

    // user belongs to User table
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
