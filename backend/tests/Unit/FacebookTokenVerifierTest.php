<?php

namespace Tests\Unit;

use App\Services\Auth\FacebookTokenVerifier;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

// test fb API integration
class FacebookTokenVerifierTest extends TestCase
{
    // everything valid test
    public function test_valid_facebook_token_returns_user_identity(): void
    {
        config()->set('services.facebook.client_id', 'test-app-id');
        config()->set('services.facebook.client_secret', 'test-app-secret');

        Http::fake([
            'graph.facebook.com/debug_token*' => Http::response([
                'data' => [
                    'is_valid' => true,
                    'app_id' => 'test-app-id',
                    'user_id' => 'facebook-user-123',
                ],
            ], 200),

            'graph.facebook.com/me*' => Http::response([
                'id' => 'facebook-user-123',
                'name' => 'Facebook User',
                'email' => 'facebook@example.com',
            ], 200),
        ]);

        $identity = app(FacebookTokenVerifier::class)
            ->verify('valid-facebook-token');

        $this->assertSame([
            'provider_user_id' => 'facebook-user-123',
            'email' => 'facebook@example.com',
            'name' => 'Facebook User',
        ], $identity);

        Http::assertSentCount(2);
    }

    // valid token, user has account but for different app
    public function test_token_from_another_facebook_app_is_rejected(): void
    {
        config()->set('services.facebook.client_id', 'our-app-id');
        config()->set('services.facebook.client_secret', 'test-app-secret');

        Http::fake([
            'graph.facebook.com/debug_token*' => Http::response([
                'data' => [
                    'is_valid' => true,
                    'app_id' => 'another-app-id',
                    'user_id' => 'facebook-user-123',
                ],
            ], 200),
        ]);

        try {
            app(FacebookTokenVerifier::class)->verify('foreign-app-token');

            $this->fail('Expected a validation exception.');
        } catch (ValidationException $e) {
            $this->assertArrayHasKey('access_token', $e->errors());
        }

        Http::assertSentCount(1);
    }

    // different FB user with valid token
    public function test_mismatched_facebook_user_id_is_rejected(): void
    {
        config()->set('services.facebook.client_id', 'test-app-id');
        config()->set('services.facebook.client_secret', 'test-app-secret');

        Http::fake([
            'graph.facebook.com/debug_token*' => Http::response([
                'data' => [
                    'is_valid' => true,
                    'app_id' => 'test-app-id',
                    'user_id' => 'facebook-user-123',
                ],
            ], 200),

            'graph.facebook.com/me*' => Http::response([
                'id' => 'different-facebook-user',
                'name' => 'Facebook User',
                'email' => 'facebook@example.com',
            ], 200),
        ]);

        try {
            app(FacebookTokenVerifier::class)->verify('valid-facebook-token');

            $this->fail('Expected a validation exception.');
        } catch (ValidationException $e) {
            $this->assertArrayHasKey('access_token', $e->errors());
        }

        Http::assertSentCount(2);
    }

    // acc can be created via phone - in controller we check via email if user does not already have account tied to his email
    public function test_facebook_profile_without_email_is_rejected(): void
    {
        config()->set('services.facebook.client_id', 'test-app-id');
        config()->set('services.facebook.client_secret', 'test-app-secret');

        Http::fake([
            'graph.facebook.com/debug_token*' => Http::response([
                'data' => [
                    'is_valid' => true,
                    'app_id' => 'test-app-id',
                    'user_id' => 'facebook-user-123',
                ],
            ], 200),

            'graph.facebook.com/me*' => Http::response([
                'id' => 'facebook-user-123',
                'name' => 'Facebook User',
                // Facebook did not provide an email.
            ], 200),
        ]);

        $this->expectException(ValidationException::class);

        app(FacebookTokenVerifier::class)->verify('valid-facebook-token');
    }
}
