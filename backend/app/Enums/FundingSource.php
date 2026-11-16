<?php

namespace App\Enums;

use App\Enums\Concerns\HasValues;

enum FundingSource: string
{
    use HasValues;

    case FAMILY = 'family';
    case FUNDRAISER = 'fundraiser';
    case GRANT = 'grant';
    case SAVINGS = 'savings';
    case OTHER = 'other';
}
