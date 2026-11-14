<?php

namespace App\Http\Requests;

use App\Enums\SpecialistNoteType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ListSpecialistNotesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'type' => ['sometimes', 'string', Rule::enum(SpecialistNoteType::class)],
        ];
    }
}
