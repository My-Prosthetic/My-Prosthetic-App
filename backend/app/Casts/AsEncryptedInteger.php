<?php

namespace App\Casts;

use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;
use InvalidArgumentException;

/**
 * Stores an integer encrypted with the application key and reads it back as an integer.
 *
 * @implements CastsAttributes<int|null, int|string|null>
 */
final class AsEncryptedInteger implements CastsAttributes
{
    /**
     * Cast the given value.
     *
     * @param  array<string, mixed>  $attributes
     */
    public function get(Model $model, string $key, mixed $value, array $attributes): ?int
    {
        if ($value === null) {
            return null;
        }

        return (int) Crypt::decryptString($value);
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

        $integer = filter_var($value, FILTER_VALIDATE_INT);

        if ($integer === false) {
            throw new InvalidArgumentException("The [{$key}] attribute must be an integer.");
        }

        return Crypt::encryptString((string) $integer);
    }
}
