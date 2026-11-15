<?php

namespace App\Enums;

use App\Enums\Concerns\HasValues;

enum ProsthesisSide: string
{
    use HasValues;

    case LEFT = 'left';
    case RIGHT = 'right';
}
