<?php

namespace App\Enums;

enum FundingSource: string
{
    case FAMILY = 'family';
    case FUNDRAISER = 'fundraiser';
    case GRANT = 'grant';
    case SAVINGS = 'savings';
    case OTHER = 'other';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_map(
            static fn (self $source): string => $source->value,
            self::cases(),
        );
    }
}
