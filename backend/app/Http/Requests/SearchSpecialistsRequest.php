<?php

namespace App\Http\Requests;

use App\Models\User;
use App\Support\SpecialistCode;
use Closure;

class SearchSpecialistsRequest extends PatientRequest
{
    private const MIN_LENGTH = 3;

    private const MAX_WORDS = 5;

    /**
     * The global TrimStrings middleware has already trimmed the query.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'q' => [
                'bail',
                'required',
                'string',
                'min:'.self::MIN_LENGTH,
                'max:100',
                function (string $attribute, string $value, Closure $fail): void {
                    // Combining marks pass min:3 but fold away, which would leave no constraint.
                    if (mb_strlen(trim(User::searchNameFrom($value))) < self::MIN_LENGTH) {
                        $fail('The :attribute field must be at least '.self::MIN_LENGTH.' characters.');
                    }

                    if (count($this->words($value)) > self::MAX_WORDS) {
                        $fail('The :attribute field must not contain more than '.self::MAX_WORDS.' words.');
                    }
                },
            ],
        ];
    }

    /**
     * The query folded the same way as stored search names, split into words.
     *
     * @return list<string>
     */
    public function searchWords(): array
    {
        return $this->words(User::searchNameFrom($this->string('q')->toString()));
    }

    /**
     * The whole query read as a Specialist Code, or null when it cannot be one.
     */
    public function specialistCode(): ?string
    {
        $code = SpecialistCode::normalize($this->string('q')->toString());

        return SpecialistCode::isWellFormed($code) ? $code : null;
    }

    /**
     * @return list<string>
     */
    private function words(string $value): array
    {
        return preg_split('/\s+/u', $value, -1, PREG_SPLIT_NO_EMPTY) ?: [];
    }
}
