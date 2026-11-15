<?php

namespace App\Services\Auth;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;

class FacebookTokenVerifier
{
    public function verify(string $accessToken): array
    {

        try {
            $appId = config('services.facebook.client_id');
            $appSecret = config('services.facebook.client_secret');

            $response = Http::timeout(10)->get(
                'https://graph.facebook.com/debug_token',
                [
                    'input_token' => $accessToken,
                    'access_token' => "{$appId}|{$appSecret}",
                ]
            );

            if ($response->serverError()) {
                abort(503, 'Facebook authentication is temporarily unavailable.');
            }

            $tokenData = $response->json('data');

            if (
                ! $response->successful()
                || ! is_array($tokenData)
                || ($tokenData['is_valid'] ?? false) !== true
                || (string) ($tokenData['app_id'] ?? '') !== (string) $appId
                || empty($tokenData['user_id'])
            ) {
                throw ValidationException::withMessages([
                    'access_token' => 'Invalid Facebook access token.',
                ]);
            }
            $profileResponse = Http::timeout(10)->get(
                'https://graph.facebook.com/me',
                [
                    'fields' => 'id,name,email',
                    'access_token' => $accessToken,
                ]
            );

            if ($profileResponse->serverError()) {
                abort(503, 'Facebook authentication is temporarily unavailable.');
            }
            $profile = $profileResponse->json();

            if (
                ! $profileResponse->successful()
                || ! is_array($profile)
                || (string) ($profile['id'] ?? '') !== (string) $tokenData['user_id']
                || empty($profile['email'])
            ) {
                throw ValidationException::withMessages([
                    'access_token' => 'Unable to retrieve a verified Facebook account email.',
                ]);
            }

            return [
                'provider_user_id' => (string) $tokenData['user_id'],
                'email' => $profile['email'],
                'name' => $profile['name'] ?? $profile['email'],
            ];
        } catch (ConnectionException $e) {
            abort(503, 'Facebook authentication is temporarily unavailable.');
        }
    }
}
