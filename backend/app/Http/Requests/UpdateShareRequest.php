<?php

namespace App\Http\Requests;

use App\ValueObjects\SharePermissions;
use Closure;
use Illuminate\Support\Str;

/**
 * Validates a Permission Scope fully, so malformed input is a 422 and never
 * reaches the SharePermissions value object.
 */
class UpdateShareRequest extends PatientRequest
{
    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'permissions' => ['present', 'array:medical_history,prostheses,incidents'],
            'permissions.medical_history' => ['sometimes', 'boolean:strict'],
            'permissions.prostheses' => ['sometimes', 'bail', 'list', $this->ownedProstheses(...)],
            'permissions.prostheses.*' => ['uuid'],
            'permissions.incidents' => ['sometimes', 'bail', 'list', 'max:0'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'permissions.incidents.max' => 'Incident sharing is not supported yet.',
        ];
    }

    public function permissions(): SharePermissions
    {
        /** @var array<string, mixed> $permissions */
        $permissions = $this->validated('permissions');

        return SharePermissions::fromArray($permissions);
    }

    /**
     * Every selected prosthesis must exist, belong to the patient and not be deleted.
     * Malformed ids are reported by the per-item rule.
     *
     * @param  list<mixed>  $value
     */
    private function ownedProstheses(string $attribute, array $value, Closure $fail): void
    {
        $ids = collect($value)
            ->filter(fn (mixed $id): bool => is_string($id) && Str::isUuid($id))
            ->map(fn (string $id): string => Str::lower($id))
            ->unique();

        $owned = $this->patient()->prostheses()->whereIn('id', $ids)->count();

        if ($owned !== $ids->count()) {
            $fail('The selected prostheses must be existing prostheses you own.');
        }
    }
}
