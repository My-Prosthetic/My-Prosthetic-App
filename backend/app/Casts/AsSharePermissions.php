<?php

namespace App\Casts;

use App\ValueObjects\SharePermissions;
use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;

/**
 * Stores share permissions as canonical JSON and reads them back as a value object.
 *
 * @implements CastsAttributes<SharePermissions|null, SharePermissions|array<string, mixed>|null>
 */
final class AsSharePermissions implements CastsAttributes
{
    public function get(Model $model, string $key, mixed $value, array $attributes): ?SharePermissions
    {
        if ($value === null) {
            return null;
        }

        return SharePermissions::fromArray(json_decode($value, true, flags: JSON_THROW_ON_ERROR));
    }

    public function set(Model $model, string $key, mixed $value, array $attributes): ?string
    {
        if ($value === null) {
            return null;
        }

        $permissions = $value instanceof SharePermissions ? $value : SharePermissions::fromArray($value);

        return json_encode($permissions, JSON_THROW_ON_ERROR);
    }
}
