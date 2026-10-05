<?php

namespace App\Http\Requests;

use App\Enums\UserRole;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class StoreShareRequest extends UpdateShareRequest
{
    /**
     * A missing user and a non-prosthetist fail the same way, so the API does not
     * reveal which accounts exist.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'specialist_id' => [
                'bail',
                'required',
                'uuid',
                Rule::exists('users', 'id')->where('role', UserRole::PROSTHETIST->value),
            ],
            ...parent::rules(),
        ];
    }

    public function specialistId(): string
    {
        return $this->string('specialist_id')->toString();
    }

    /**
     * Stored UUIDs are lowercase; fold the id so the lookup does not depend on the
     * database's string comparison.
     */
    protected function prepareForValidation(): void
    {
        $specialistId = $this->input('specialist_id');

        if (is_string($specialistId)) {
            $this->merge(['specialist_id' => Str::lower($specialistId)]);
        }
    }
}
