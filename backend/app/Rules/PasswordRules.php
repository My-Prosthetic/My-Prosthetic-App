<?php

namespace App\Rules;

use Illuminate\Validation\Rules\Password;

final class PasswordRules
{
    /** @return list<string|Password> */
    public static function new(bool $registration = false): array
    {
        // Registration retains its existing default policy.
        $strength = $registration ? Password::defaults() : Password::min(12)->mixedCase()->numbers();
        $rules = ['required', 'string', 'confirmed', $strength];

        if (! $registration) {
            $rules[] = 'regex:/[\p{P}\p{S}]/u';
        }

        return $rules;
    }
}
