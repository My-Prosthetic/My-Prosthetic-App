<?php

namespace App\Http\Requests;

use App\Enums\FundingSource;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreWalletEntryRequest extends FormRequest
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
            'goal_id' => ['required', 'uuid', Rule::exists('goals', 'id')],
            'source' => ['required', 'string', Rule::enum(FundingSource::class)],
            'amount' => ['required', 'integer', 'min:1'],
            'date' => ['required', 'date'],
            'note' => ['nullable', 'string', 'max:10000'],
        ];
    }
}
