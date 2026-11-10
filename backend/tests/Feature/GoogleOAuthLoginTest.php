<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\Auth\GoogleTokenVerifier;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GoogleOAuthLoginTest extends TestCase
{
    use RefreshDatabase;

    public function test_invalid_google_id_token_is_rejected(): void
    {
        $response = $this->postJson('/api/oauth/login', [
            'provider' => 'google',
            'id_token' => 'invalid-test-token',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['id_token']);
    }

    public function test_google_login_rejects_an_existing_email_account(): void
    {
        User::factory()->create([
            'email' => 'existing@example.com',
        ]);

        $this->mock(GoogleTokenVerifier::class)
            ->shouldReceive('verify')
            ->once()
            ->with('fake-google-token')
            ->andReturn([
                'provider_user_id' => 'google-test-123',
                'email' => 'existing@example.com',
                'name' => 'Test User',
            ]);

        $response = $this->postJson('/api/oauth/login', [
            'provider' => 'google',
            'id_token' => 'fake-google-token',
        ]);

        $response->assertStatus(409);

        $this->assertDatabaseMissing('external_identities', [
            'provider' => 'google',
            'provider_user_id' => 'google-test-123',
        ]);
    }

    public function test_google_login_creates_a_new_user_and_returns_a_token(): void
    {
        $this->mock(GoogleTokenVerifier::class)
            ->shouldReceive('verify')
            ->once()
            ->with('fake-google-token')
            ->andReturn([
                'provider_user_id' => 'google-new-123',
                'email' => 'new-google-user@example.com',
                'name' => 'New Google User',
            ]);

        $response = $this->postJson('/api/oauth/login', [
            'provider' => 'google',
            'id_token' => 'fake-google-token',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('token_type', 'Bearer')
            ->assertJsonStructure(['token']);

        $this->assertDatabaseHas('users', [
            'email' => 'new-google-user@example.com',
        ]);

        $this->assertDatabaseHas('external_identities', [
            'provider' => 'google',
            'provider_user_id' => 'google-new-123',
        ]);
    }

    public function test_google_login_reuses_existing_account(): void
    {
        $user = User::factory()->create();

        $user->externalIdentities()->create([
            'provider' => 'google',
            'provider_user_id' => 'google-existing-123',
        ]);

        $this->mock(GoogleTokenVerifier::class)
            ->shouldReceive('verify')
            ->once()
            ->with('fake-google-token')
            ->andReturn([
                'provider_user_id' => 'google-existing-123',
                'email' => $user->email,
                'name' => $user->name,
            ]);

        $response = $this->postJson('/api/oauth/login', [
            'provider' => 'google',
            'id_token' => 'fake-google-token',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('token_type', 'Bearer')
            ->assertJsonStructure(['token']);

        $this->assertDatabaseCount('users', 1);
        $this->assertDatabaseCount('external_identities', 1);
    }
}
