<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class AccountSettingsController extends Controller
{
    public function changePassword(Request $request): Response
    {
        $patient = $this->patient($request);

        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => [
                'required',
                'string',
                'confirmed',
                'different:current_password',
                Password::min(12)->mixedCase()->numbers(),
                'regex:/[\p{P}\p{S}]/u',
            ],
        ]);

        DB::transaction(function () use ($patient, $validated): void {
            $lockedPatient = User::query()->lockForUpdate()->findOrFail($patient->getKey());

            if (! Hash::check($validated['current_password'], (string) $lockedPatient->getAuthPassword())) {
                throw ValidationException::withMessages([
                    'current_password' => ['The current password is incorrect.'],
                ]);
            }

            $lockedPatient->password = $validated['password'];
            $lockedPatient->save();

            $lockedPatient->tokens()
                ->where('id', '!=', $patient->currentAccessToken()->getKey())
                ->delete();
        });

        return response()->noContent();
    }

    public function destroy(Request $request): Response
    {
        $patient = $this->patient($request);

        $validated = $request->validate([
            'current_password' => ['required', 'string'],
        ]);

        DB::transaction(function () use ($patient, $validated): void {
            $lockedPatient = User::query()->lockForUpdate()->findOrFail($patient->getKey());

            if (! Hash::check($validated['current_password'], (string) $lockedPatient->getAuthPassword())) {
                throw ValidationException::withMessages([
                    'current_password' => ['The current password is incorrect.'],
                ]);
            }

            $patientId = $lockedPatient->getKey();

            DB::table('components')->whereIn('prosthesis_id',
                DB::table('prostheses')->select('id')->where('user_id', $patientId)
            )->delete();
            DB::table('prostheses')->where('user_id', $patientId)->delete();

            $goalIds = DB::table('wallet_entries')->where('user_id', $patientId)
                ->pluck('goal_id')->unique()->values();
            DB::table('wallet_entries')->where('user_id', $patientId)->delete();
            if ($goalIds->isNotEmpty()) {
                DB::table('goals')->whereIn('id', $goalIds)
                    ->whereNotIn('id', DB::table('wallet_entries')->select('goal_id'))
                    ->delete();
            }

            DB::table('user_shares')
                ->where('patient_id', $patientId)
                ->orWhere('specialist_id', $patientId)
                ->delete();
            DB::table('sessions')->where('user_id', $patientId)->delete();
            DB::table('password_reset_tokens')->where('email', $lockedPatient->email)->delete();
            $lockedPatient->tokens()->delete();
            $lockedPatient->delete();
        });

        return response()->noContent();
    }

    private function patient(Request $request): User
    {
        $user = $request->user();
        abort_unless($user instanceof User, Response::HTTP_UNAUTHORIZED);
        abort_unless($user->role === UserRole::PATIENT, Response::HTTP_FORBIDDEN);

        return $user;
    }
}
