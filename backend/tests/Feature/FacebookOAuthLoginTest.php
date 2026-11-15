<?php

namespace Tests\Feature;

use App\Models\ExternalIdentity;
use App\Models\User;
use App\Services\Auth\FacebookTokenVerifier;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class FacebookOAuthLoginTest extends TestCase
{
    use RefreshDatabase;

    public function test_invalid_facebook_access_token_is_rejected(): void
    {
        Http::fake([
            'graph.facebook.com/debug_token' => Http::response([
                'data' => [
                    'is_valid' => false,
                ],
            ], 200),
        ]);

        $response = $this->postJson('/api/oauth/login', [
            'provider' => 'facebook',
            'access_token' => 'invalid-token',
            'device_name' => 'test-device',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['access_token']);
    }

    public function test_facebook_login_rejects_existing_email(): void
    {
        $user = User::factory()->create([
            'email' => 'existing@example.com',
        ]);

        $this->mock(FacebookTokenVerifier::class, function ($mock) {
            $mock->shouldReceive('verify')
                ->once()
                ->with('valid-facebook-token')
                ->andReturn([
                    'provider_user_id' => 'facebook-user-123',
                    'email' => 'existing@example.com',
                    'name' => 'Facebook User',
                ]);
        });

        $response = $this->postJson('/api/oauth/login', [
            'provider' => 'facebook',
            'access_token' => 'valid-facebook-token',
            'device_name' => 'test-device',
        ]);

        $response->assertStatus(409);

        $this->assertDatabaseCount('users', 1);
        $this->assertDatabaseCount('external_identities', 0);
    }

    // new Facebook user get a database accout, an external identity record and a Sanctum token in the response
    public function test_facebook_login_creates_new_user_and_returns_token(): void
    {
        $this->mock(FacebookTokenVerifier::class, function ($mock) {
            $mock->shouldReceive('verify')
                ->once()
                ->with('valid-facebook-token')
                ->andReturn([
                    'provider_user_id' => 'facebook-user-123',
                    'email' => 'new-facebook@example.com',
                    'name' => 'Facebook User',
                ]);
        });

        $response = $this->postJson('/api/oauth/login', [
            'provider' => 'facebook',
            'access_token' => 'valid-facebook-token',
            'device_name' => 'test-device',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('token_type', 'Bearer')
            ->assertJsonStructure(['token']);

        $this->assertDatabaseHas('users', [
            'email' => 'new-facebook@example.com',
            'name' => 'Facebook User',
        ]);

        $this->assertDatabaseHas('external_identities', [
            'provider' => 'facebook',
            'provider_user_id' => 'facebook-user-123',
        ]);

        $this->assertDatabaseCount('personal_access_tokens', 1);
    }

    public function test_existing_facebook_user_can_log_in_again(): void
    {
        $user = User::factory()->create([
            'email' => 'facebook@example.com',
        ]);

        ExternalIdentity::create([
            'user_id' => $user->id,
            'provider' => 'facebook',
            'provider_user_id' => 'facebook-user-123',
            'last_login_at' => now(),
        ]);

        $this->mock(FacebookTokenVerifier::class, function ($mock) {
            $mock->shouldReceive('verify')
                ->once()
                ->with('valid-facebook-token')
                ->andReturn([
                    'provider_user_id' => 'facebook-user-123',
                    'email' => 'facebook@example.com',
                    'name' => 'Facebook User',
                ]);
        });

        $response = $this->postJson('/api/oauth/login', [
            'provider' => 'facebook',
            'access_token' => 'valid-facebook-token',
            'device_name' => 'test-device',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('token_type', 'Bearer')
            ->assertJsonStructure(['token']);

        $this->assertDatabaseCount('users', 1);
        $this->assertDatabaseCount('external_identities', 1);
        $this->assertDatabaseCount('personal_access_tokens', 1);
    }
}
