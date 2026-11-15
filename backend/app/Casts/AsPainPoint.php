<?php

namespace App\Casts;

use App\ValueObjects\PainPoint;
use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

/**
 * Stores a pain point as JSON encrypted with the application key and reads it back as a value object.
 *
 * @implements CastsAttributes<PainPoint|null, PainPoint|array<string, mixed>|null>
 */
final class AsPainPoint implements CastsAttributes
{
    /**
     * Cast the given value.
     *
     * @param  array<string, mixed>  $attributes
     */
    public function get(Model $model, string $key, mixed $value, array $attributes): ?PainPoint
    {
        if ($value === null) {
            return null;
        }

        return PainPoint::fromArray(json_decode(Crypt::decryptString($value), true, flags: JSON_THROW_ON_ERROR));
    }

    /**
     * Prepare the given value for storage.
     *
     * @param  array<string, mixed>  $attributes
     */
    public function set(Model $model, string $key, mixed $value, array $attributes): ?string
    {
        if ($value === null) {
            return null;
        }

        $painPoint = $value instanceof PainPoint ? $value : PainPoint::fromArray($value);

        return Crypt::encryptString(json_encode($painPoint, JSON_THROW_ON_ERROR));
    }
}
