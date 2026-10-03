<?php

namespace App\ValueObjects;

use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Support\Str;
use InvalidArgumentException;
use JsonSerializable;

/**
 * The patient data sections a specialist was selected to see in a single share.
 *
 * Selections are independent: choosing a prosthesis does not imply its incidents,
 * and a selection never authorizes access to records the patient does not own.
 *
 * @implements Arrayable<string, bool|list<string>>
 */
final readonly class SharePermissions implements Arrayable, JsonSerializable
{
    private const KEYS = ['medical_history', 'prostheses', 'incidents'];

    /** @var list<string> */
    public array $prostheses;

    /** @var list<string> */
    public array $incidents;

    /**
     * @param  array<array-key, mixed>  $prostheses
     * @param  array<array-key, mixed>  $incidents
     */
    public function __construct(
        public bool $medicalHistory = false,
        array $prostheses = [],
        array $incidents = [],
    ) {
        $this->prostheses = self::normalizeIds($prostheses, 'prostheses');
        $this->incidents = self::normalizeIds($incidents, 'incidents');
    }

    public static function none(): self
    {
        return new self;
    }

    /**
     * @param  array<array-key, mixed>  $data
     */
    public static function fromArray(array $data): self
    {
        $unknownKeys = array_diff(array_keys($data), self::KEYS);

        if ($unknownKeys !== []) {
            throw new InvalidArgumentException(sprintf(
                'Unknown share permission keys: %s.',
                implode(', ', $unknownKeys),
            ));
        }

        $medicalHistory = $data['medical_history'] ?? false;

        if (! is_bool($medicalHistory)) {
            throw new InvalidArgumentException('Share permission [medical_history] must be a boolean.');
        }

        return new self(
            $medicalHistory,
            self::list($data['prostheses'] ?? [], 'prostheses'),
            self::list($data['incidents'] ?? [], 'incidents'),
        );
    }

    public function includesProsthesis(string $prosthesisId): bool
    {
        return in_array(Str::lower($prosthesisId), $this->prostheses, true);
    }

    public function includesIncident(string $incidentId): bool
    {
        return in_array(Str::lower($incidentId), $this->incidents, true);
    }

    /**
     * @return array{medical_history: bool, prostheses: list<string>, incidents: list<string>}
     */
    public function toArray(): array
    {
        return [
            'medical_history' => $this->medicalHistory,
            'prostheses' => $this->prostheses,
            'incidents' => $this->incidents,
        ];
    }

    /**
     * @return array{medical_history: bool, prostheses: list<string>, incidents: list<string>}
     */
    public function jsonSerialize(): array
    {
        return $this->toArray();
    }

    /**
     * @return array<array-key, mixed>
     */
    private static function list(mixed $value, string $key): array
    {
        if (! is_array($value) || ! array_is_list($value)) {
            throw new InvalidArgumentException("Share permission [{$key}] must be a list of UUIDs.");
        }

        return $value;
    }

    /**
     * @param  array<array-key, mixed>  $ids
     * @return list<string>
     */
    private static function normalizeIds(array $ids, string $key): array
    {
        foreach ($ids as $id) {
            if (! is_string($id) || ! Str::isUuid($id)) {
                throw new InvalidArgumentException("Share permission [{$key}] must contain only UUIDs.");
            }
        }

        return array_values(array_unique(array_map(Str::lower(...), $ids)));
    }
}
