<?php

namespace App\Enums;

enum ComponentType: string
{
    case SOCKET = 'socket';
    case KNEE = 'knee';
    case FOOT = 'foot';
    case LINER = 'liner';
    case ADAPTER = 'adapter';
    case OTHER = 'other';
}
