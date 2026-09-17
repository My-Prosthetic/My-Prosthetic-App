<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Testing\TestResponse;
use stdClass;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_patient_can_register_and_receive_a_personal_access_token(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Jane Patient',
            'email' => 'jane.patient@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'device_name' => 'Jane phone',
        ]);

        $response
            ->assertCreated()
            ->assertJsonStructure([
                'data' => ['id', 'name', 'email', 'role', 'email_verified_at'],
                'token',
                'token_type',
            ])
            ->assertJsonPath('data.email', 'jane.patient@example.com')
            ->assertJsonPath('data.role', 'patient')
            ->assertJsonPath('token_type', 'Bearer')
            ->assertJsonMissingPath('data.password');

        $this->assertDatabaseHas('users', [
            'email' => 'jane.patient@example.com',
            'role' => 'patient',
        ]);

        $user = User::query()->where('email', 'jane.patient@example.com')->firstOrFail();

        $this->assertTrue(Hash::check('Password123!', $user->password));
        $this->assertDatabaseHas('personal_access_tokens', [
            'tokenable_id' => $user->id,
            'name' => 'Jane phone',
        ]);
    }

    public function test_public_registration_cannot_assign_an_elevated_role(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Impersonated Specialist',
            'email' => 'impersonated@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'role' => 'prosthetist',
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonStructure(['message', 'errors']);

        $this->assertDatabaseMissing('users', [
            'email' => 'impersonated@example.com',
        ]);
    }

    public function test_registration_rejects_duplicate_email_with_a_standard_validation_error(): void
    {
        User::factory()->create(['email' => 'existing@example.com']);

        $response = $this->postJson('/api/register', [
            'name' => 'Another Patient',
            'email' => 'EXISTING@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonStructure(['message', 'errors'])
            ->assertJsonStructure(['errors' => ['email']]);
    }

    public function test_patient_can_login_from_mobile_and_receive_a_bearer_token(): void
    {
        $user = User::factory()->create([
            'email' => 'patient@example.com',
            'password' => 'Password123!',
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'PATIENT@example.com',
            'password' => 'Password123!',
            'device_name' => 'Test phone',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.id', $user->id)
            ->assertJsonPath('data.role', 'patient')
            ->assertJsonPath('token_type', 'Bearer')
            ->assertJsonStructure(['token']);

        $this->assertDatabaseHas('personal_access_tokens', [
            'tokenable_id' => $user->id,
            'name' => 'Test phone',
        ]);
    }

    public function test_mobile_login_returns_the_same_unauthorized_error_for_invalid_credentials_and_roles(): void
    {
        $patient = User::factory()->create([
            'email' => 'invalid-password@example.com',
            'password' => 'Password123!',
        ]);
        $prosthetist = User::factory()->prosthetist()->create([
            'email' => 'specialist-mobile@example.com',
            'password' => 'Password123!',
        ]);

        $invalidPassword = $this->postJson('/api/login', [
            'email' => $patient->email,
            'password' => 'WrongPassword123!',
        ]);

        $invalidRole = $this->postJson('/api/login', [
            'email' => $prosthetist->email,
            'password' => 'Password123!',
        ]);

        foreach ([$invalidPassword, $invalidRole] as $response) {
            $response
                ->assertUnauthorized()
                ->assertExactJson([
                    'message' => 'The provided credentials are invalid.',
                    'errors' => [
                        'email' => ['The provided credentials are invalid.'],
                    ],
                ]);
        }

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_profile_requires_authentication(): void
    {
        $this->getJson('/api/profile')
            ->assertUnauthorized()
            ->assertExactJson([
                'message' => 'Unauthenticated.',
                'errors' => new stdClass,
            ]);
    }

    public function test_profile_accepts_a_mobile_bearer_token(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('profile-test')->plainTextToken;

        $this->withToken($token)
            ->getJson('/api/profile')
            ->assertOk()
            ->assertJsonPath('data.id', $user->id)
            ->assertJsonPath('data.role', 'patient')
            ->assertJsonMissingPath('data.password');
    }

    public function test_specialist_can_login_to_the_spa_session_flow_without_receiving_a_token(): void
    {
        $specialist = User::factory()->prosthetist()->create([
            'email' => 'specialist@example.com',
            'password' => 'Password123!',
        ]);

        $csrfResponse = $this->getCsrfCookie();
        $csrfToken = $csrfResponse->getCookie('XSRF-TOKEN')->getValue();

        $loginResponse = $this->withFrontendCookies($csrfResponse, $csrfToken)
            ->postJson('/api/web/login', [
                'email' => $specialist->email,
                'password' => 'Password123!',
            ]);

        $loginResponse
            ->assertOk()
            ->assertJsonPath('data.id', $specialist->id)
            ->assertJsonPath('data.role', 'prosthetist')
            ->assertJsonMissingPath('token')
            ->assertJsonMissingPath('token_type');

        $sessionCookie = $loginResponse->getCookie(config('session.cookie'));

        $this->withHeader('Origin', 'http://localhost:5173')
            ->withCookie(config('session.cookie'), $sessionCookie->getValue())
            ->getJson('/api/profile')
            ->assertOk()
            ->assertJsonPath('data.id', $specialist->id)
            ->assertJsonPath('data.role', 'prosthetist');
    }

    public function test_web_login_rejects_a_patient(): void
    {
        $patient = User::factory()->create([
            'email' => 'patient-web@example.com',
            'password' => 'Password123!',
        ]);

        $this->postJson('/api/web/login', [
            'email' => $patient->email,
            'password' => 'Password123!',
        ])
            ->assertUnauthorized()
            ->assertJsonPath('message', 'The provided credentials are invalid.')
            ->assertJsonStructure(['errors']);
    }

    public function test_stateful_web_login_requires_a_csrf_token(): void
    {
        $specialist = User::factory()->prosthetist()->create([
            'email' => 'csrf-specialist@example.com',
            'password' => 'Password123!',
        ]);

        $this->withHeader('Origin', 'http://localhost:5173')
            ->postJson('/api/web/login', [
                'email' => $specialist->email,
                'password' => 'Password123!',
            ])
            ->assertStatus(419)
            ->assertJsonPath('message', 'CSRF token mismatch.');
    }

    public function test_mobile_logout_revokes_only_the_current_token(): void
    {
        $user = User::factory()->create();
        $currentToken = $user->createToken('current')->plainTextToken;
        $otherToken = $user->createToken('other')->plainTextToken;

        $this->withToken($currentToken)
            ->postJson('/api/logout')
            ->assertNoContent();

        $this->assertDatabaseCount('personal_access_tokens', 1);

        $this->withToken($currentToken)
            ->getJson('/api/profile')
            ->assertUnauthorized();

        $this->withToken($otherToken)
            ->getJson('/api/profile')
            ->assertOk();
    }

    public function test_web_logout_invalidates_the_spa_session(): void
    {
        $specialist = User::factory()->prosthetist()->create([
            'email' => 'logout-specialist@example.com',
            'password' => 'Password123!',
        ]);

        $csrfResponse = $this->getCsrfCookie();
        $csrfToken = $csrfResponse->getCookie('XSRF-TOKEN')->getValue();
        $loginResponse = $this->withFrontendCookies($csrfResponse, $csrfToken)
            ->postJson('/api/web/login', [
                'email' => $specialist->email,
                'password' => 'Password123!',
            ])
            ->assertOk();
        $sessionCookie = $loginResponse->getCookie(config('session.cookie'))->getValue();

        $this->withFrontendCookies($csrfResponse, $csrfToken)
            ->withCookie(config('session.cookie'), $sessionCookie)
            ->postJson('/api/web/logout')
            ->assertNoContent();

        $this->withHeader('Origin', 'http://localhost:5173')
            ->withCookie(config('session.cookie'), $sessionCookie)
            ->getJson('/api/profile')
            ->assertUnauthorized();
    }

    public function test_cors_allows_the_configured_frontend_origin_with_credentials(): void
    {
        $response = $this->withHeaders([
            'Origin' => 'http://localhost:5173',
            'Access-Control-Request-Method' => 'POST',
            'Access-Control-Request-Headers' => 'Content-Type, X-XSRF-TOKEN',
        ])->options('/api/web/login');

        $response
            ->assertNoContent()
            ->assertHeader('Access-Control-Allow-Origin', 'http://localhost:5173')
            ->assertHeader('Access-Control-Allow-Credentials', 'true');
    }

    private function getCsrfCookie(): TestResponse
    {
        $response = $this->withHeader('Origin', 'http://localhost:5173')
            ->get('/sanctum/csrf-cookie')
            ->assertNoContent();

        $response->assertCookie('XSRF-TOKEN');

        return $response;
    }

    private function withFrontendCookies(TestResponse $csrfResponse, string $csrfToken): static
    {
        $test = $this->withHeaders([
            'Origin' => 'http://localhost:5173',
            'X-XSRF-TOKEN' => urldecode($csrfToken),
        ])
            ->withCookie('XSRF-TOKEN', $csrfToken);

        $sessionCookie = $csrfResponse->getCookie(config('session.cookie'));

        if ($sessionCookie !== null) {
            $test->withCookie(config('session.cookie'), $sessionCookie->getValue());
        }

        return $test;
    }
}
