<?php

namespace Tests\Feature;

use Tests\TestCase;

class GoogleOAuthLoginTest extends TestCase
{
    public function test_invalid_google_id_token_is_rejected(): void
    {
        $response = $this->postJson('/api/oauth/login', [
            'provider' => 'google',
            'id_token' => 'invalid-test-token',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['id_token']);
    }
}