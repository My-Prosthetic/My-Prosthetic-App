<?php

namespace App\Http\Requests;

use App\Models\SpecialistNote;
use Illuminate\Foundation\Http\FormRequest;

class UpdateSpecialistNoteRequest extends FormRequest
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
            'content' => ['required', 'string', 'max:'.SpecialistNote::MAX_CONTENT_LENGTH],
            'type' => ['prohibited'],
        ];
    }
}
