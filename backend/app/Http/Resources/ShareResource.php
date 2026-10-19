<?php

namespace App\Http\Resources;

use App\Models\UserShare;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * An Access Grant as the patient sees it. The share's own UUID is not part of
 * the API; a grant is addressed by its specialist.
 *
 * @mixin UserShare
 */
class ShareResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'specialist' => SpecialistResource::make($this->specialist),
            'permissions' => $this->permissions,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
