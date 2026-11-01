<?php

namespace Tests\Feature;

use App\Models\Component;
use App\Models\Incident;
use App\Models\Prosthesis;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use InvalidArgumentException;
use Tests\TestCase;

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
}
