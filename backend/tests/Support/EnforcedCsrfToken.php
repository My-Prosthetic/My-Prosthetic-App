<?php

namespace Tests\Support;

use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;

/**
 * CSRF middleware that validates tokens even though the app is running tests.
 */
class EnforcedCsrfToken extends ValidateCsrfToken
{
    protected function runningUnitTests(): bool
    {
        return false;
    }
}
