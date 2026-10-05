<?php

namespace App\Support;

/**
 * The short identifier a prosthetist hands to patients so they can find exactly them.
 *
 * Codes are 8 characters of Crockford base32 (no I, L, O or U), stored in
 * uppercase. This is the only place that knows the alphabet and length.
 */
final class SpecialistCode
{
    private const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

    private const LENGTH = 8;

    /**
     * Generate a random code, drawing again while $isTaken reports a collision.
     *
     * @param  callable(string): bool  $isTaken
     */
    public static function generate(callable $isTaken): string
    {
        do {
            $code = self::random();
        } while ($isTaken($code));

        return $code;
    }

    /**
     * Fold typed input to canonical form, forgiving case, spaces, hyphens and the
     * look-alikes O (zero) and I/L (one), as Crockford decoding does.
     */
    public static function normalize(string $input): string
    {
        $code = strtoupper((string) preg_replace('/[\s-]+/', '', $input));

        return strtr($code, ['O' => '0', 'I' => '1', 'L' => '1']);
    }

    /**
     * Whether $code is a canonical code; normalize user input first.
     */
    public static function isWellFormed(string $code): bool
    {
        return strlen($code) === self::LENGTH
            && strspn($code, self::ALPHABET) === self::LENGTH;
    }

    private static function random(): string
    {
        $code = '';

        for ($index = 0; $index < self::LENGTH; $index++) {
            $code .= self::ALPHABET[random_int(0, strlen(self::ALPHABET) - 1)];
        }

        return $code;
    }
}
