<?php

namespace App\Http\Requests;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Response;

/**
 * A request only patients may make. Authorization runs before validation, so
 * other roles are forbidden whatever they send.
 */
class PatientRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user instanceof User && $user->role === UserRole::PATIENT;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [];
    }

    public function patient(): User
    {
        $user = $this->user();

        abort_unless($user instanceof User, Response::HTTP_UNAUTHORIZED);

        return $user;
    }
}
