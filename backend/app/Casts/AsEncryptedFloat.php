<?php

namespace App\Casts;

use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;
use InvalidArgumentException;

/**
 * Stores a number encrypted with the application key and reads it back as a float.
 *
 * @implements CastsAttributes<float|null, float|int|string|null>
 */
final class AsEncryptedFloat implements CastsAttributes
{
    /**
     * @param  array<string, mixed>  $attributes
     */
    public function get(Model $model, string $key, mixed $value, array $attributes): ?float
    {
        if ($value === null) {
            return null;
        }

        return (float) Crypt::decryptString($value);
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function set(Model $model, string $key, mixed $value, array $attributes): ?string
    {
        if ($value === null) {
            return null;
        }

        if (! is_numeric($value) || ! is_finite((float) $value)) {
            throw new InvalidArgumentException("The [{$key}] attribute must be a finite number.");
        }

        return Crypt::encryptString((string) (float) $value);
    }
}
