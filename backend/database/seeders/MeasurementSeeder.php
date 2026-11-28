<?php

namespace Database\Seeders;

use App\Enums\LimbType;
use App\Enums\ProsthesisSide;
use App\Models\User;
use Database\Seeders\Concerns\SeedsDemoData;
use Illuminate\Database\Seeder;

class MeasurementSeeder extends Seeder
{
    use SeedsDemoData;

    private const DISTANCES = [15, 10, 5];

    private const MEASUREMENTS = [
        '2026-09-07 08:00:00' => [42.0, 38.5, 33.0],
        '2026-09-28 08:00:00' => [41.4, 38.0, 32.6],
        '2026-10-19 07:45:00' => [40.9, 37.6, 32.2],
        '2026-10-19 20:30:00' => [41.8, 38.4, 32.9],
        '2026-11-02 08:10:00' => [40.3, 37.1, 31.8],
        '2026-11-09 08:00:00' => [40.0, 36.8, 31.5],
    ];

    public function run(): void
    {
        if (! $this->isDemoEnvironment()) {
            return;
        }

        $this->call(ProsthesisSeeder::class);

        $patient = User::query()->where('email', 'prosthesis.patient@example.com')->firstOrFail();

        if ($patient->measurements()->withTrashed()->exists()) {
            return;
        }

        foreach (self::MEASUREMENTS as $measuredAt => $circumferences) {
            $measurement = $patient->measurements()->create([
                'side' => ProsthesisSide::LEFT,
                'limb_type' => LimbType::LOWER,
                'measured_at' => $measuredAt,
            ]);

            foreach ($circumferences as $index => $circumference) {
                $measurement->levels()->create([
                    'level' => $index + 1,
                    'distance_cm' => self::DISTANCES[$index],
                    'circumference_cm' => $circumference,
                ]);
            }
        }
    }
}
