<?php

namespace App\Enums;

enum UserRole: string
{
    case PATIENT = 'patient';
    case PROSTHETIST = 'prosthetist';
    case ADMIN = 'admin';
}
