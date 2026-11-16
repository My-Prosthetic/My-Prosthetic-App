<?php

namespace App\Enums;

use App\Enums\Concerns\HasValues;

enum SpecialistNoteType: string
{
    use HasValues;

    case TECHNICAL_NOTE = 'technical_note';
    case RECOMMENDATION = 'recommendation';
}
