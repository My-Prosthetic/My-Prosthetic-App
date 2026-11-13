<?php

namespace App\Http\Requests;

use App\Enums\SpecialistNoteType;
use App\Models\SpecialistNote;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSpecialistNoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'type' => ['required', 'string', Rule::enum(SpecialistNoteType::class)],
            'content' => ['required', 'string', 'max:'.SpecialistNote::MAX_CONTENT_LENGTH],
        ];
    }
}
