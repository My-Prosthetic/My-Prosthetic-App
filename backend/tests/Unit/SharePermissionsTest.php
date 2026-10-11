<?php

namespace Tests\Unit;

use App\ValueObjects\SharePermissions;
use InvalidArgumentException;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class SharePermissionsTest extends TestCase
{
    private const PROSTHESIS_ID = '11111111-1111-4111-8111-111111111111';

    private const INCIDENT_ID = '22222222-2222-4222-8222-222222222222';

    public function test_none_selects_nothing(): void
    {
        $this->assertSame([
            'medical_history' => false,
            'prostheses' => [],
            'incidents' => [],
        ], SharePermissions::none()->toArray());
    }

    public function test_missing_keys_default_to_an_empty_selection(): void
    {
        $permissions = SharePermissions::fromArray(['prostheses' => [self::PROSTHESIS_ID]]);

        $this->assertFalse($permissions->medicalHistory);
        $this->assertSame([self::PROSTHESIS_ID], $permissions->prostheses);
        $this->assertSame([], $permissions->incidents);
    }

    public function test_ids_are_lowercased_and_deduplicated(): void
    {
        $permissions = new SharePermissions(
            prostheses: [strtoupper(self::PROSTHESIS_ID), self::PROSTHESIS_ID],
        );

        $this->assertSame([self::PROSTHESIS_ID], $permissions->prostheses);
    }

    public function test_selections_are_independent(): void
    {
        $permissions = new SharePermissions(prostheses: [self::PROSTHESIS_ID]);

        $this->assertTrue($permissions->includesProsthesis(strtoupper(self::PROSTHESIS_ID)));
        $this->assertFalse($permissions->includesIncident(self::INCIDENT_ID));
        $this->assertFalse($permissions->medicalHistory);
    }

    public function test_array_round_trip_preserves_the_selection(): void
    {
        $data = [
            'medical_history' => true,
            'prostheses' => [self::PROSTHESIS_ID],
            'incidents' => [self::INCIDENT_ID],
        ];

        $this->assertSame($data, SharePermissions::fromArray($data)->toArray());
        $this->assertSame(json_encode($data), json_encode(SharePermissions::fromArray($data)));
    }

    #[DataProvider('invalidPermissions')]
    public function test_invalid_permissions_are_rejected(array $data): void
    {
        $this->expectException(InvalidArgumentException::class);

        SharePermissions::fromArray($data);
    }

    public static function invalidPermissions(): iterable
    {
        yield 'unknown key' => [['prosthesis' => [self::PROSTHESIS_ID]]];
        yield 'non-boolean medical history' => [['medical_history' => 'yes']];
        yield 'prostheses not a list' => [['prostheses' => ['main' => self::PROSTHESIS_ID]]];
        yield 'prostheses not an array' => [['prostheses' => self::PROSTHESIS_ID]];
        yield 'invalid prosthesis id' => [['prostheses' => ['not-a-uuid']]];
        yield 'non-string incident id' => [['incidents' => [42]]];
    }
}
