<?php

namespace Database\Seeders\Concerns;

trait SeedsDemoData
{
    /**
     * Demo seeders may only run in the selected environments.
     */
    protected function isDemoEnvironment(): bool
    {
        return app()->environment('local', 'testing');
    }
}
