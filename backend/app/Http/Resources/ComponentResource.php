<?php

namespace App\Http\Resources;

use App\Models\Component;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Component
 */
class ComponentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type->value,
            'name' => $this->name,
            'manufacturer' => $this->manufacturer,
            'model' => $this->model,
            'serial_number' => $this->serial_number,
            'is_test_socket' => $this->is_test_socket,
            'installed_at' => $this->installed_at->toISOString(),
            'replacement_at' => $this->replacement_at?->toISOString(),
            'warranty_until' => $this->warranty_until?->toISOString(),
        ];
    }
}
