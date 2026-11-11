<?php

namespace Tests\Feature;

use App\Enums\SpecialistNoteType;
use App\Models\SpecialistNote;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Tests\TestCase;

class SpecialistNoteTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_note_belongs_to_its_patient_and_author(): void
    {
        $patient = User::factory()->create();
        $prosthetist = User::factory()->prosthetist()->create();

        $note = SpecialistNote::factory()
            ->for($patient, 'patient')
            ->for($prosthetist, 'author')
            ->recommendation()
            ->create();

        $this->assertTrue(Str::isUuid($note->id));
        $this->assertSame(SpecialistNoteType::RECOMMENDATION, $note->refresh()->type);
        $this->assertTrue($note->patient->is($patient));
        $this->assertTrue($note->author->is($prosthetist));
        $this->assertTrue($patient->specialistNotes->contains($note));
        $this->assertTrue($prosthetist->authoredNotes->contains($note));
    }

    public function test_note_content_is_encrypted_at_rest(): void
    {
        $note = SpecialistNote::factory()->create(['content' => 'Shortened the pylon by 5 mm.']);

        $storedContent = DB::table('specialist_notes')->where('id', $note->id)->value('content');

        $this->assertStringNotContainsString('pylon', $storedContent);
        $this->assertSame('Shortened the pylon by 5 mm.', $note->refresh()->content);
    }

    public function test_id_patient_and_author_are_not_mass_assignable(): void
    {
        $patient = User::factory()->create();
        $prosthetist = User::factory()->prosthetist()->create();

        $note = new SpecialistNote([
            'id' => (string) Str::uuid(),
            'patient_id' => $patient->id,
            'author_id' => $prosthetist->id,
            'type' => SpecialistNoteType::TECHNICAL_NOTE,
            'content' => 'Adjusted the foot alignment.',
        ]);

        $this->assertNull($note->id);
        $this->assertNull($note->patient_id);
        $this->assertNull($note->author_id);
        $this->assertSame(SpecialistNoteType::TECHNICAL_NOTE, $note->type);
        $this->assertSame('Adjusted the foot alignment.', $note->content);
    }

    public function test_deleting_the_patient_deletes_their_notes(): void
    {
        $note = SpecialistNote::factory()->create();

        $note->patient->delete();

        $this->assertModelMissing($note);
    }

    public function test_deleting_the_author_keeps_their_notes_without_an_author(): void
    {
        $note = SpecialistNote::factory()->create();

        $note->author->delete();

        $this->assertModelExists($note);
        $this->assertNull($note->refresh()->author_id);
    }

    public function test_database_rejects_an_unknown_note_type(): void
    {
        $row = $this->validRow();

        $this->expectException(QueryException::class);

        DB::table('specialist_notes')->insert([...$row, 'type' => 'diary']);
    }

    public function test_database_rejects_a_note_without_a_patient(): void
    {
        $row = $this->validRow();

        $this->expectException(QueryException::class);

        DB::table('specialist_notes')->insert([...$row, 'patient_id' => null]);
    }

    public function test_notes_are_indexed_by_patient_and_time_and_by_author(): void
    {
        $indexedColumns = array_column(Schema::getIndexes('specialist_notes'), 'columns');

        $this->assertContains(['patient_id', 'created_at'], $indexedColumns);
        $this->assertContains(['author_id'], $indexedColumns);
    }

    /**
     * A raw row the database accepts, so each test breaks exactly one rule.
     *
     * @return array<string, string>
     */
    private function validRow(): array
    {
        return [
            'id' => (string) Str::uuid(),
            'patient_id' => User::factory()->create()->id,
            'type' => SpecialistNoteType::RECOMMENDATION->value,
            'content' => 'Raw text written past the model.',
        ];
    }
}
