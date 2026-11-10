<?php

namespace App\Http\Controllers;

use App\Http\Requests\OAuthLoginRequest;
use App\Services\Auth\GoogleTokenVerifier;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class OAuthController extends Controller
{
    public function login(
    OAuthLoginRequest $request,
    GoogleTokenVerifier $googleVerifier
): JsonResponse {
    $data = $request->validated();

    if ($data['provider'] !== 'google') {
        throw ValidationException::withMessages([
            'provider' => ['This OAuth provider is not implemented yet.'],
        ]);
    }

    $identity = $googleVerifier->verify($data['id_token']);

    return response()->json([
        'message' => 'Google identity verified successfully.',
        'identity' => $identity,
    ]);
}
}
