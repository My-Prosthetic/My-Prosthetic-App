<?php

namespace App\Http\Resources;

use App\Models\SpecialistNote;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin SpecialistNote
 */
class SpecialistNoteResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type->value,
            'content' => $this->content,
            'author' => $this->author === null ? null : SpecialistResource::make($this->author),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            'edited_at' => $this->edited_at?->toISOString(),
        ];
    }
}
