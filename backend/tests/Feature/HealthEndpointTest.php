<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\DB;
use RuntimeException;
use Tests\TestCase;

class HealthEndpointTest extends TestCase
{
    public function test_health_returns_200_when_database_is_available(): void
    {
        $this->getJson('/api/health')
            ->assertOk()
            ->assertJsonPath('status', 'ok')
            ->assertJsonPath('checks.database', 'ok');
    }

    public function test_health_returns_503_when_database_is_unavailable(): void
    {
        DB::shouldReceive('connection')
            ->once()
            ->andThrow(new RuntimeException('Connection refused'));

        $this->getJson('/api/health')
            ->assertStatus(503)
            ->assertJsonPath('status', 'error')
            ->assertJsonPath('checks.database', 'unavailable');
    }

    public function test_health_response_contains_timestamp(): void
    {
        $this->getJson('/api/health')
            ->assertJsonStructure(['status', 'checks' => ['database'], 'timestamp']);
    }
}
