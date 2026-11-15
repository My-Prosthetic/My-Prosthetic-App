<?php

namespace Tests\Feature;

use App\Enums\LimbType;
use App\Enums\ProsthesisSide;
use App\Models\Measurement;
use App\Models\MeasurementLevel;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class MeasurementTest extends TestCase
{
    use RefreshDatabase;

    public function test_patient_keeps_their_own_measurements(): void
    {
        $patient = User::factory()->create();

        $measurement = $patient->measurements()->create([
            'side' => ProsthesisSide::LEFT,
            'limb_type' => LimbType::LOWER,
            'measured_at' => '2026-10-20 08:30:00',
        ]);
        $otherPatientsMeasurement = Measurement::factory()->create();

        $this->assertTrue(Str::isUuid($measurement->id));
        $this->assertTrue($measurement->user->is($patient));
        $this->assertTrue($patient->measurements->contains($measurement));
        $this->assertFalse($patient->measurements->contains($otherPatientsMeasurement));
    }

    public function test_limb_is_read_as_enums_and_measured_at_as_a_date(): void
    {
        $measurement = Measurement::factory()->create([
            'side' => 'right',
            'limb_type' => 'upper',
            'measured_at' => '2026-10-20 08:30:00',
        ]);

        $measurement->refresh();

        $this->assertSame(ProsthesisSide::RIGHT, $measurement->side);
        $this->assertSame(LimbType::UPPER, $measurement->limb_type);
        $this->assertInstanceOf(Carbon::class, $measurement->measured_at);
        $this->assertSame('2026-10-20 08:30:00', $measurement->measured_at->toDateTimeString());
    }

    #[DataProvider('unknownLimbs')]
    public function test_database_rejects_an_unknown_limb(string $column, string $value): void
    {
        $measurement = Measurement::factory()->create();

        $this->expectException(QueryException::class);

        DB::table('measurements')->where('id', $measurement->id)->update([$column => $value]);
    }

    public static function unknownLimbs(): iterable
    {
        yield 'unknown side' => ['side', 'center'];
        yield 'unknown limb type' => ['limb_type', 'torso'];
    }

    public function test_id_and_owner_are_not_mass_assignable(): void
    {
        $patient = User::factory()->create();

        $measurement = new Measurement([
            'id' => 'forged',
            'user_id' => $patient->id,
            'side' => ProsthesisSide::LEFT,
        ]);

        $this->assertNull($measurement->id);
        $this->assertNull($measurement->user_id);
        $this->assertSame(ProsthesisSide::LEFT, $measurement->side);
    }

    public function test_levels_belong_to_their_measurement_in_label_order(): void
    {
        $measurement = Measurement::factory()->create();
        $measurement->levels()->createMany([
            ['level' => 3, 'distance_cm' => 15, 'circumference_cm' => 33.5],
            ['level' => 1, 'distance_cm' => 10, 'circumference_cm' => 41.2],
            ['level' => 2, 'distance_cm' => 5, 'circumference_cm' => 38.0],
        ]);

        $levels = $measurement->levels;

        $this->assertSame([1, 2, 3], $levels->pluck('level')->all());
        $this->assertTrue($levels->first()->measurement->is($measurement));
    }

    #[DataProvider('repeatedLevels')]
    public function test_database_rejects_a_repeated_level_or_distance_in_one_measurement(int $level, int $distance): void
    {
        $measurement = Measurement::factory()->withLevels()->create();

        $this->expectException(QueryException::class);

        $measurement->levels()->create([
            'level' => $level,
            'distance_cm' => $distance,
            'circumference_cm' => 40.0,
        ]);
    }

    public static function repeatedLevels(): iterable
    {
        yield 'repeated level' => [1, 20];
        yield 'repeated distance' => [4, 15];
    }

    public function test_different_measurements_may_repeat_levels_and_distances(): void
    {
        Measurement::factory()->count(2)->withLevels()->create();

        $this->assertDatabaseCount('measurement_levels', 6);
    }

    public function test_level_id_and_measurement_are_not_mass_assignable(): void
    {
        $measurement = Measurement::factory()->create();

        $level = new MeasurementLevel([
            'id' => 'forged',
            'measurement_id' => $measurement->id,
            'level' => 2,
        ]);

        $this->assertNull($level->id);
        $this->assertNull($level->measurement_id);
        $this->assertSame(2, $level->level);
    }

    public function test_deleted_measurement_leaves_the_card_but_stays_in_the_database_with_its_levels(): void
    {
        $measurement = Measurement::factory()->withLevels()->create();

        $measurement->delete();

        $this->assertCount(0, $measurement->user->measurements);
        $this->assertSoftDeleted($measurement);
        $this->assertDatabaseCount('measurement_levels', 3);
    }

    public function test_deleting_the_patient_deletes_their_measurements_and_levels_including_deleted_ones(): void
    {
        $patient = User::factory()->create();
        $activeMeasurement = Measurement::factory()->for($patient)->withLevels()->create();
        $deletedMeasurement = Measurement::factory()->for($patient)->withLevels()->create();
        $deletedMeasurement->delete();

        $patient->delete();

        $this->assertModelMissing($activeMeasurement);
        $this->assertModelMissing($deletedMeasurement);
        $this->assertDatabaseCount('measurement_levels', 0);
    }

    public function test_measurements_are_indexed_for_the_history_of_one_limb(): void
    {
        $this->assertContains(
            ['user_id', 'side', 'limb_type', 'measured_at'],
            array_column(Schema::getIndexes('measurements'), 'columns'),
        );
    }
}
