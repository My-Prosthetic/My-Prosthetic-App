<?php

namespace App\Enums;

enum UserRole: string
{
    case PATIENT = 'patient';
    case PROSTHETIST = 'prosthetist';
    // TODO: Implement functionality for the admin role.
    case ADMIN = 'admin';
}
