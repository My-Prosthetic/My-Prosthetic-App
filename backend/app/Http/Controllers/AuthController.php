<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Http\Requests\MobileLoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Requests\WebLoginRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\PersonalAccessToken;

class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        $validated = $request->validated();

        /** @var array{user: User, token: string} $authentication */
        $authentication = DB::transaction(function () use ($validated): array {
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => $validated['password'],
                'role' => UserRole::PATIENT,
            ]);

            return [
                'user' => $user,
                'token' => $user->createToken($this->deviceName($validated))->plainTextToken,
            ];
        });

        return $this->tokenResponse(
            $authentication['user'],
            $authentication['token'],
            Response::HTTP_CREATED,
        );
    }

    public function mobileLogin(MobileLoginRequest $request): JsonResponse
    {
        $credentials = [
            'email' => $request->string('email')->toString(),
            'password' => $request->string('password')->toString(),
        ];

        $guard = Auth::guard('web');

        if (! $guard->once($credentials)) {
            return $this->invalidCredentialsResponse();
        }

        $user = $guard->user();

        if (! $user instanceof User || $user->role !== UserRole::PATIENT) {
            return $this->invalidCredentialsResponse();
        }

        $token = $user->createToken($this->deviceName($request->validated()))->plainTextToken;

        return $this->tokenResponse($user, $token);
    }

    public function webLogin(WebLoginRequest $request): UserResource|JsonResponse
    {
        $credentials = [
            'email' => $request->string('email')->toString(),
            'password' => $request->string('password')->toString(),
            'role' => UserRole::PROSTHETIST->value,
        ];

        $guard = Auth::guard('web');

        if (! $guard->attempt($credentials)) {
            return $this->invalidCredentialsResponse();
        }

        $user = $guard->user();

        if (! $user instanceof User) {
            $guard->logout();

            return $this->invalidCredentialsResponse();
        }

        $request->session()->regenerate();

        return UserResource::make($user);
    }

    public function profile(Request $request): UserResource
    {
        return UserResource::make($this->authenticatedUser($request));
    }

    public function mobileLogout(Request $request): Response
    {
        $token = $this->authenticatedUser($request)->currentAccessToken();

        if ($token instanceof PersonalAccessToken) {
            $token->delete();
        }

        return response()->noContent();
    }

    public function webLogout(Request $request): Response
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->noContent();
    }

    private function tokenResponse(User $user, string $token, int $status = Response::HTTP_OK): JsonResponse
    {
        return UserResource::make($user)
            ->additional([
                'token' => $token,
                'token_type' => 'Bearer',
            ])
            ->response()
            ->setStatusCode($status);
    }

    private function invalidCredentialsResponse(): JsonResponse
    {
        return response()->json([
            'message' => 'The provided credentials are invalid.',
            'errors' => [
                'email' => ['The provided credentials are invalid.'],
            ],
        ], Response::HTTP_UNAUTHORIZED);
    }

    /**
     * @param array<string, mixed> $validated
     */
    private function deviceName(array $validated): string
    {
        $deviceName = $validated['device_name'] ?? null;

        return is_string($deviceName) && $deviceName !== '' ? $deviceName : 'mobile';
    }

    private function authenticatedUser(Request $request): User
    {
        $user = $request->user();

        abort_unless($user instanceof User, Response::HTTP_UNAUTHORIZED);

        return $user;
    }
}