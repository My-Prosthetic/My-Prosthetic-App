<?php

namespace App\Services\Auth;

use Google\Client;
use Illuminate\Validation\ValidationException;
use UnexpectedValueException;

class GoogleTokenVerifier
{
    public function verify(string $idToken): array
    {
        $client = new Client([
            'client_id' => config('services.google.client_id'),
        ]);
        
        try {
            $payload = $client->verifyIdToken($idToken);
        } catch (UnexpectedValueException $e) {
            throw ValidationException::withMessages([
                'id_token' => ['Invalid Google ID token.'],
            ]);
        }

        if (
            ! is_array($payload)
            || ! in_array($payload['iss'] ?? null, [
                'accounts.google.com',
                'https://accounts.google.com',
            ], true)
            || ($payload['email_verified'] ?? false) !== true
            || empty($payload['sub'])
            || empty($payload['email'])
        ) {
            throw ValidationException::withMessages([
                'id_token' => ['Invalid Google ID token.'],
            ]);
        }

        return [
            'provider_user_id' => $payload['sub'],
            'email' => $payload['email'],
            'name' => $payload['name'] ?? $payload['email'],
        ];
    }
}