<?php

namespace App\Enums;

enum KLevel: string
{
    case K0 = 'K0';
    case K1 = 'K1';
    case K2 = 'K2';
    case K3 = 'K3';
    case K4 = 'K4';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_map(
            static fn (self $level): string => $level->value,
            self::cases(),
        );
    }
}
