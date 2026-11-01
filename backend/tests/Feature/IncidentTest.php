<?php

namespace Tests\Feature;

use App\Enums\ComponentType;
use App\Enums\IncidentMediaKind;
use App\Enums\SocketView;
use App\Models\Component;
use App\Models\Incident;
use App\Models\IncidentMedia;
use App\Models\Prosthesis;
use App\Models\User;
use App\ValueObjects\PainPoint;
use Database\Seeders\IncidentSeeder;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use InvalidArgumentException;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;
use ValueError;

class IncidentTest extends TestCase
{
    use RefreshDatabase;

    public function test_prosthesis_has_incidents(): void
    {
        $prosthesis = Prosthesis::factory()->create();

        $incident = $prosthesis->incidents()->create([
            'type' => 'abrasion',
            'occurred_at' => '2026-10-20 08:30:00',
        ]);

        $this->assertTrue(Str::isUuid($incident->id));
        $this->assertTrue($incident->prosthesis->is($prosthesis));
        $this->assertTrue($prosthesis->incidents->contains($incident));
        $this->assertInstanceOf(Carbon::class, $incident->refresh()->occurred_at);
    }

    public function test_incident_can_point_at_a_component(): void
    {
        $prosthesis = Prosthesis::factory()->create();
        $component = Component::factory()->for($prosthesis)->create();
        $incident = Incident::factory()->for($prosthesis)->create();

        $incident->component()->associate($component)->save();

        $this->assertTrue($incident->refresh()->component->is($component));
        $this->assertTrue($component->incidents->contains($incident));
    }

    public function test_patient_reaches_their_incident_log_across_prostheses(): void
    {
        $patient = User::factory()->create();
        $legIncident = Incident::factory()->for(Prosthesis::factory()->for($patient))->create();
        $armIncident = Incident::factory()->for(Prosthesis::factory()->for($patient))->create();
        $otherPatientsIncident = Incident::factory()->create();

        $incidentLog = $patient->incidents;

        $this->assertCount(2, $incidentLog);
        $this->assertTrue($incidentLog->contains($legIncident));
        $this->assertTrue($incidentLog->contains($armIncident));
        $this->assertFalse($incidentLog->contains($otherPatientsIncident));
    }

    public function test_incident_content_is_encrypted_at_rest(): void
    {
        $incident = Incident::factory()->create([
            'type' => 'phantom_pain',
            'activity' => 'sitting',
            'description' => 'Burning sensation in the missing foot.',
        ]);

        $stored = DB::table('incidents')->where('id', $incident->id)->first();

        $this->assertStringNotContainsString('phantom', $stored->type);
        $this->assertStringNotContainsString('sitting', $stored->activity);
        $this->assertStringNotContainsString('Burning', $stored->description);

        $incident->refresh();

        $this->assertSame('phantom_pain', $incident->type);
        $this->assertSame('sitting', $incident->activity);
        $this->assertSame('Burning sensation in the missing foot.', $incident->description);
    }

    public function test_intensity_is_encrypted_at_rest_and_read_as_an_integer(): void
    {
        $incident = Incident::factory()->create(['intensity' => 7]);

        $storedIntensity = DB::table('incidents')->where('id', $incident->id)->value('intensity');

        $this->assertNotSame('7', $storedIntensity);
        $this->assertSame(7, $incident->refresh()->intensity);
    }

    public function test_intensity_may_be_empty(): void
    {
        $incident = Incident::factory()->create(['intensity' => null]);

        $this->assertNull(DB::table('incidents')->where('id', $incident->id)->value('intensity'));
        $this->assertNull($incident->refresh()->intensity);
    }

    public function test_intensity_must_be_a_whole_number(): void
    {
        $this->expectException(InvalidArgumentException::class);

        new Incident(['intensity' => 'severe']);
    }

    public function test_pain_point_is_encrypted_at_rest_and_read_as_a_value_object(): void
    {
        $incident = Incident::factory()->create([
            'pain_point' => ['x' => 0.42, 'y' => 0.8, 'view' => 'top_inside'],
        ]);

        $storedPainPoint = DB::table('incidents')->where('id', $incident->id)->value('pain_point');

        $this->assertStringNotContainsString('top_inside', $storedPainPoint);

        $painPoint = $incident->refresh()->pain_point;

        $this->assertInstanceOf(PainPoint::class, $painPoint);
        $this->assertSame(0.42, $painPoint->x);
        $this->assertSame(0.8, $painPoint->y);
        $this->assertSame(SocketView::TOP_INSIDE, $painPoint->view);
    }

    public function test_pain_point_may_be_empty(): void
    {
        $incident = Incident::factory()->create(['pain_point' => null]);

        $this->assertNull(DB::table('incidents')->where('id', $incident->id)->value('pain_point'));
        $this->assertNull($incident->refresh()->pain_point);
    }

    /**
     * @param  array<string, mixed>  $painPoint
     */
    #[DataProvider('painPointsOffTheSocketDiagram')]
    public function test_pain_point_must_lie_on_the_socket_diagram(array $painPoint): void
    {
        $this->expectException(InvalidArgumentException::class);

        new Incident(['pain_point' => $painPoint]);
    }

    public static function painPointsOffTheSocketDiagram(): iterable
    {
        yield 'x beyond the right edge' => [['x' => 1.2, 'y' => 0.5, 'view' => 'side']];
        yield 'y above the top edge' => [['x' => 0.5, 'y' => -0.1, 'view' => 'side']];
        yield 'coordinate not a number' => [['x' => '0.5', 'y' => 0.5, 'view' => 'side']];
        yield 'coordinate missing' => [['y' => 0.5, 'view' => 'side']];
        yield 'unknown view' => [['x' => 0.5, 'y' => 0.5, 'view' => 'back']];
        yield 'view missing' => [['x' => 0.5, 'y' => 0.5]];
    }

    public function test_socket_incident_points_at_a_socket_of_its_own_prosthesis(): void
    {
        $prosthesis = Prosthesis::factory()->create();

        $incident = Incident::factory()->for($prosthesis)->onSocket()->create()->refresh();

        $this->assertTrue($incident->component->prosthesis->is($prosthesis));
        $this->assertSame(ComponentType::SOCKET, $incident->component->type);
        $this->assertInstanceOf(PainPoint::class, $incident->pain_point);
        $this->assertContains($incident->type, ['pain', 'abrasion', 'poor_fit']);
    }

    public function test_id_and_owners_are_not_mass_assignable(): void
    {
        $prosthesis = Prosthesis::factory()->create();
        $component = Component::factory()->for($prosthesis)->create();

        $incident = new Incident([
            'id' => 'forged',
            'prosthesis_id' => $prosthesis->id,
            'component_id' => $component->id,
            'type' => 'pain',
        ]);

        $this->assertNull($incident->id);
        $this->assertNull($incident->prosthesis_id);
        $this->assertNull($incident->component_id);
        $this->assertSame('pain', $incident->type);
    }

    public function test_deleted_incident_leaves_the_prosthesis_but_stays_in_the_database(): void
    {
        $incident = Incident::factory()->create();

        $incident->delete();

        $this->assertSame(0, $incident->prosthesis->incidents()->count());
        $this->assertSoftDeleted($incident);
    }

    public function test_deleting_the_patient_deletes_their_incidents_including_deleted_ones(): void
    {
        $prosthesis = Prosthesis::factory()->create();
        $activeIncident = Incident::factory()->for($prosthesis)->create();
        $deletedIncident = Incident::factory()->for($prosthesis)->create();
        $deletedIncident->delete();

        $prosthesis->user->delete();

        $this->assertModelMissing($activeIncident);
        $this->assertModelMissing($deletedIncident);
    }

    public function test_deleting_a_component_keeps_its_incidents(): void
    {
        $prosthesis = Prosthesis::factory()->create();
        $component = Component::factory()->for($prosthesis)->create();
        $incident = Incident::factory()->for($prosthesis)->for($component)->create();

        $component->forceDelete();

        $this->assertModelExists($incident);
        $this->assertNull($incident->refresh()->component_id);
    }

    public function test_soft_deleting_a_prosthesis_hides_its_incidents_until_restored(): void
    {
        $prosthesis = Prosthesis::factory()->create();
        $incident = Incident::factory()->for($prosthesis)->create();

        $prosthesis->delete();
        $this->assertNull(Incident::find($incident->id));

        $prosthesis->restore();
        $this->assertNotNull(Incident::find($incident->id));
    }

    public function test_incident_foreign_keys_and_occurrence_time_are_indexed(): void
    {
        $indexedColumns = array_column(Schema::getIndexes('incidents'), 'columns');

        $this->assertContains(['prosthesis_id'], $indexedColumns);
        $this->assertContains(['component_id'], $indexedColumns);
        $this->assertContains(['occurred_at'], $indexedColumns);
    }

    public function test_incident_has_media(): void
    {
        $incident = Incident::factory()->create();

        $media = $incident->media()->create([
            'kind' => 'photo',
            'path' => "incidents/{$incident->id}/abrasion.jpg",
            'mime_type' => 'image/jpeg',
            'size_bytes' => 245_760,
        ]);

        $this->assertTrue(Str::isUuid($media->id));
        $this->assertTrue($media->incident->is($incident));
        $this->assertTrue($incident->media->contains($media));
        $this->assertSame(IncidentMediaKind::PHOTO, $media->refresh()->kind);
        $this->assertSame(245_760, $media->size_bytes);
    }

    public function test_model_rejects_an_unknown_media_kind(): void
    {
        $this->expectException(ValueError::class);

        new IncidentMedia(['kind' => 'video']);
    }

    public function test_database_rejects_an_unknown_media_kind(): void
    {
        $incident = Incident::factory()->create();

        $this->expectException(QueryException::class);

        DB::table('incident_media')->insert([
            'id' => (string) Str::uuid(),
            'incident_id' => $incident->id,
            'kind' => 'video',
            'path' => "incidents/{$incident->id}/gait.mp4",
            'mime_type' => 'video/mp4',
            'size_bytes' => 1_048_576,
        ]);
    }

    public function test_media_cannot_be_moved_to_another_incident_by_mass_assignment(): void
    {
        $otherIncident = Incident::factory()->create();

        $media = new IncidentMedia([
            'incident_id' => $otherIncident->id,
            'kind' => 'voice_note',
        ]);

        $this->assertNull($media->incident_id);
        $this->assertSame(IncidentMediaKind::VOICE_NOTE, $media->kind);
    }

    public function test_deleting_the_patient_deletes_incident_media_including_that_of_deleted_incidents(): void
    {
        $prosthesis = Prosthesis::factory()->create();
        $activeMedia = IncidentMedia::factory()->for(Incident::factory()->for($prosthesis))->create();
        $mediaOfDeletedIncident = IncidentMedia::factory()->for(Incident::factory()->for($prosthesis))->create();
        $mediaOfDeletedIncident->incident->delete();

        $prosthesis->user->delete();

        $this->assertModelMissing($activeMedia);
        $this->assertModelMissing($mediaOfDeletedIncident);
    }

    public function test_media_incident_column_is_indexed(): void
    {
        $this->assertContains(['incident_id'], array_column(Schema::getIndexes('incident_media'), 'columns'));
    }

    public function test_incident_seeder_can_run_twice_without_duplicating_demo_incidents(): void
    {
        $this->seed(IncidentSeeder::class);
        $this->seed(IncidentSeeder::class);

        $patient = User::query()->where('email', 'prosthesis.patient@example.com')->sole();
        $incidents = $patient->incidents()->with('component')->get()->keyBy('type');

        $this->assertSame(3, Incident::query()->count());
        $this->assertEqualsCanonicalizing(['pain', 'phantom_pain', 'mechanical_failure'], $incidents->keys()->all());

        $this->assertSame(ComponentType::SOCKET, $incidents['pain']->component->type);
        $this->assertInstanceOf(PainPoint::class, $incidents['pain']->pain_point);

        $this->assertNull($incidents['phantom_pain']->component);
        $this->assertNull($incidents['phantom_pain']->pain_point);

        $this->assertSame(ComponentType::FOOT, $incidents['mechanical_failure']->component->type);
        $this->assertNull($incidents['mechanical_failure']->intensity);
    }
}
