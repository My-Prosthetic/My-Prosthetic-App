<?php

namespace Tests\Unit;

use App\Support\SpecialistCode;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class SpecialistCodeTest extends TestCase
{
    public function test_generated_codes_are_eight_unambiguous_crockford_characters(): void
    {
        for ($attempt = 0; $attempt < 200; $attempt++) {
            $this->assertMatchesRegularExpression(
                '/^[0-9ABCDEFGHJKMNPQRSTVWXYZ]{8}$/',
                SpecialistCode::generate(fn (string $code): bool => false),
            );
        }
    }

    public function test_generation_draws_again_while_the_code_is_taken(): void
    {
        $candidates = [];

        $code = SpecialistCode::generate(function (string $candidate) use (&$candidates): bool {
            $candidates[] = $candidate;

            return count($candidates) < 3;
        });

        $this->assertCount(3, $candidates);
        $this->assertSame($candidates[2], $code);
    }

    #[DataProvider('typedCodes')]
    public function test_normalization_forgives_case_separators_and_look_alikes(string $typed, string $expected): void
    {
        $this->assertSame($expected, SpecialistCode::normalize($typed));
    }

    public static function typedCodes(): iterable
    {
        yield 'already canonical' => ['7K3Q9XMB', '7K3Q9XMB'];
        yield 'lowercase' => ['7k3q9xmb', '7K3Q9XMB'];
        yield 'hyphenated' => ['7K3Q-9XMB', '7K3Q9XMB'];
        yield 'spaced' => [' 7K3Q 9XMB ', '7K3Q9XMB'];
        yield 'letter O for zero' => ['O0oA-BCDE', '000ABCDE'];
        yield 'letters I and L for one' => ['IiLl-ABCD', '1111ABCD'];
    }

    #[DataProvider('wellFormedness')]
    public function test_recognizes_well_formed_codes(string $code, bool $wellFormed): void
    {
        $this->assertSame($wellFormed, SpecialistCode::isWellFormed($code));
    }

    public static function wellFormedness(): iterable
    {
        yield 'canonical code' => ['7K3Q9XMB', true];
        yield 'too short' => ['7K3Q9XM', false];
        yield 'too long' => ['7K3Q9XMBA', false];
        yield 'letter U is not in the alphabet' => ['7K3Q9XMU', false];
        yield 'not normalized' => ['7k3q-9xmb', false];
        yield 'a name' => ['kowalski', false];
    }
}
