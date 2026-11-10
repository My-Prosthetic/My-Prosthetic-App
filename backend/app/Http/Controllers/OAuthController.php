<?php

namespace App\Http\Controllers;

use App\Http\Requests\OAuthLoginRequest;
use Illuminate\Http\JsonResponse;

class OAuthController extends Controller
{
    public function login(OAuthLoginRequest $request): JsonResponse
    {
        $validated = $request->validated();

        return response()->json([
            'message' => 'OAuth authentication is not implemented yet.',
        ], 501);
    }
}
