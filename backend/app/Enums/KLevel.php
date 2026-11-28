<?php

namespace App\Enums;

use App\Enums\Concerns\HasValues;

enum KLevel: string
{
    use HasValues;

    case K0 = 'K0';
    case K1 = 'K1';
    case K2 = 'K2';
    case K3 = 'K3';
    case K4 = 'K4';
}
