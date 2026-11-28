<?php

namespace App\Enums;

use App\Enums\Concerns\HasValues;

enum LimbType: string
{
    use HasValues;

    case UPPER = 'upper';
    case LOWER = 'lower';
}
