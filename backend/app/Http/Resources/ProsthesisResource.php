<?php

namespace App\Http\Resources;

use App\Models\Prosthesis;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A prosthesis as its owner or a granted prosthetist sees it. The owner is not
 * part of the response because the patient is already in the URL.
 *
 * @mixin Prosthesis
 */
class ProsthesisResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'side' => $this->side->value,
            'limb_type' => $this->limb_type->value,
            'amputation_level' => $this->amputation_level,
            'replacement_at' => $this->replacement_at->toISOString(),
            'components' => ComponentResource::collection($this->whenLoaded('components')),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
