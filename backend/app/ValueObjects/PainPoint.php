<?php

namespace App\ValueObjects;

use App\Enums\SocketView;
use Illuminate\Contracts\Support\Arrayable;
use InvalidArgumentException;
use JsonSerializable;

/**
 * A spot the patient marked on one view of the Socket Diagram, as fractions
 * of the diagram's width and height.
 *
 * @implements Arrayable<string, float|string>
 */
final readonly class PainPoint implements Arrayable, JsonSerializable
{
    public function __construct(
        public float $x,
        public float $y,
        public SocketView $view,
    ) {
        if (! ($x >= 0.0 && $x <= 1.0) || ! ($y >= 0.0 && $y <= 1.0)) {
            throw new InvalidArgumentException('Pain point coordinates must be between 0 and 1.');
        }
    }

    /**
     * @param  array<array-key, mixed>  $data
     */
    public static function fromArray(array $data): self
    {
        $x = $data['x'] ?? null;
        $y = $data['y'] ?? null;

        if (! (is_int($x) || is_float($x)) || ! (is_int($y) || is_float($y))) {
            throw new InvalidArgumentException('Pain point coordinates must be numbers.');
        }

        $view = $data['view'] ?? null;
        $socketView = (is_string($view) ? SocketView::tryFrom($view) : null)
            ?? throw new InvalidArgumentException('Pain point view must be a known socket view.');

        return new self($x, $y, $socketView);
    }

    /**
     * @return array{x: float, y: float, view: string}
     */
    public function toArray(): array
    {
        return [
            'x' => $this->x,
            'y' => $this->y,
            'view' => $this->view->value,
        ];
    }

    /**
     * @return array{x: float, y: float, view: string}
     */
    public function jsonSerialize(): array
    {
        return $this->toArray();
    }
}
