<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Http\Requests\OAuthLoginRequest;
use App\Http\Resources\UserResource;
use App\Models\ExternalIdentity;
use App\Models\User;
use App\Services\Auth\FacebookTokenVerifier;
use App\Services\Auth\GoogleTokenVerifier;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class OAuthController extends Controller
{
    public function login(
        OAuthLoginRequest $request,
        GoogleTokenVerifier $googleVerifier,
        FacebookTokenVerifier $facebookVerifier
    ): JsonResponse {
        $data = $request->validated();
        $provider = $data['provider'];

        $identity = match ($provider) {
            'google' => $googleVerifier->verify($data['id_token']),
            'facebook' => $facebookVerifier->verify($data['access_token']),
        };

        $externalIdentity = ExternalIdentity::query()
            ->where('provider', $provider)
            ->where('provider_user_id', $identity['provider_user_id'])
            ->first();

        if ($externalIdentity) {
            $user = $externalIdentity->user;

            $token = $user->createToken(
                $data['device_name'] ?? 'mobile'
            )->plainTextToken;

            return UserResource::make($user)
                ->additional([
                    'token' => $token,
                    'token_type' => 'Bearer',
                ])
                ->response()
                ->setStatusCode(Response::HTTP_OK);
        }

        // Do not automatically link an existing email account.
        $existingUser = User::query()
            ->where('email', $identity['email'])
            ->first();

        if ($existingUser) {
            return response()->json([
                'message' => 'An account with this email already exists. Please sign in using your existing method.',
            ], 409);
        }

        // Create the user and Google/Facebook identity atomically.
        $user = DB::transaction(function () use ($identity, $provider) {
            $user = User::create([
                'name' => $identity['name'],
                'email' => $identity['email'],
                'password' => null,
                'role' => UserRole::PATIENT,
            ]);

            ExternalIdentity::create([
                'user_id' => $user->id,
                'provider' => $provider,
                'provider_user_id' => $identity['provider_user_id'],
                'last_login_at' => now(),
            ]);

            return $user;
        });

        $token = $user->createToken(
            $data['device_name'] ?? 'mobile'
        )->plainTextToken;

        return UserResource::make($user)
            ->additional([
                'token' => $token,
                'token_type' => 'Bearer',
            ])
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }
}
