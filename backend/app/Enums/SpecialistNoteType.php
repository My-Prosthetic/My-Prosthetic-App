<?php

namespace App\Enums;

enum SpecialistNoteType: string
{
    case TECHNICAL_NOTE = 'technical_note';
    case RECOMMENDATION = 'recommendation';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_map(
            static fn (self $type): string => $type->value,
            self::cases(),
        );
    }
}
