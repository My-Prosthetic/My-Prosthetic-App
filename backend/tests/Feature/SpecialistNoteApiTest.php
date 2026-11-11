<?php

namespace Tests\Feature;

use App\Models\SpecialistNote;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Illuminate\Testing\TestResponse;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\Support\EnforcedCsrfToken;
use Tests\TestCase;

class SpecialistNoteApiTest extends TestCase
{
    use RefreshDatabase;

    private const SPA_ORIGIN = 'http://localhost:5173';

    public function test_a_granted_prosthetist_adds_a_technical_note_and_a_recommendation(): void
    {
        $this->travelTo(Carbon::parse('2026-11-11 10:00:00'));
        $patient = User::factory()->create();
        $prosthetist = User::factory()->prosthetist()->create(['name' => 'Anna Kowalska']);
        $this->grant($patient, $prosthetist, ['medical_history' => true]);

        $technicalNote = $this->asWebUser($prosthetist)
            ->postJson($this->notesOf($patient), [
                'type' => 'technical_note',
                'content' => 'Shortened the pylon by 5 mm.',
            ])
            ->assertCreated();
        $recommendation = $this->asWebUser($prosthetist)
            ->postJson($this->notesOf($patient), [
                'type' => 'recommendation',
                'content' => 'Measure the stump every morning.',
            ])
            ->assertCreated();

        $this->assertTrue(Str::isUuid($technicalNote->json('data.id')));
        $technicalNote->assertExactJson(['data' => [
            'id' => $technicalNote->json('data.id'),
            'type' => 'technical_note',
            'content' => 'Shortened the pylon by 5 mm.',
            'author' => ['id' => $prosthetist->id, 'name' => 'Anna Kowalska'],
            'created_at' => '2026-11-11T10:00:00.000000Z',
            'updated_at' => '2026-11-11T10:00:00.000000Z',
            'edited_at' => null,
        ]]);
        $recommendation
            ->assertJsonPath('data.type', 'recommendation')
            ->assertJsonPath('data.content', 'Measure the stump every morning.');

        $this->assertDatabaseCount('specialist_notes', 2);
        $this->assertDatabaseHas('specialist_notes', [
            'id' => $technicalNote->json('data.id'),
            'patient_id' => $patient->id,
            'author_id' => $prosthetist->id,
            'type' => 'technical_note',
        ]);
        $this->assertDatabaseHas('specialist_notes', [
            'id' => $recommendation->json('data.id'),
            'patient_id' => $patient->id,
            'author_id' => $prosthetist->id,
            'type' => 'recommendation',
        ]);
    }

    public function test_a_grant_that_selects_nothing_still_lets_the_prosthetist_add_notes(): void
    {
        $patient = User::factory()->create();
        $prosthetist = User::factory()->prosthetist()->create();
        $this->grant($patient, $prosthetist, []);

        $this->asWebUser($prosthetist)
            ->postJson($this->notesOf($patient), $this->validNote())
            ->assertCreated();
    }

    public function test_the_author_and_patient_come_from_the_session_and_the_url(): void
    {
        $patient = User::factory()->create();
        $prosthetist = User::factory()->prosthetist()->create();
        $this->grant($patient, $prosthetist, []);

        $note = $this->asWebUser($prosthetist)
            ->postJson($this->notesOf($patient), [
                ...$this->validNote(),
                'patient_id' => User::factory()->create()->id,
                'author_id' => User::factory()->prosthetist()->create()->id,
            ])
            ->assertCreated()
            ->assertJsonPath('data.author.id', $prosthetist->id);

        $this->assertDatabaseHas('specialist_notes', [
            'id' => $note->json('data.id'),
            'patient_id' => $patient->id,
            'author_id' => $prosthetist->id,
        ]);
    }

    #[DataProvider('refusedWrites')]
    public function test_every_refusal_looks_the_same_and_saves_nothing(string $caller, string $card): void
    {
        $prosthetist = User::factory()->prosthetist()->create();
        $patient = User::factory()->create();
        $formerPatient = User::factory()->create();
        $administrator = User::factory()->admin()->create();
        $this->grant($patient, $prosthetist, ['medical_history' => true]);
        $this->grant($formerPatient, $prosthetist, ['medical_history' => true]);
        $this->asPatient($formerPatient)->deleteJson("/api/shares/{$prosthetist->id}")->assertNoContent();

        $cards = [
            'unknown' => (string) Str::uuid(),
            'stranger' => User::factory()->create()->id,
            'revoked' => $formerPatient->id,
            'prosthetist' => $prosthetist->id,
            'patient' => $patient->id,
        ];
        $url = "/api/patients/{$cards[$card]}/notes";
        $client = fn () => match ($caller) {
            'prosthetist' => $this->asWebUser($prosthetist),
            'patient' => $this->asPatient($patient),
            'administrator' => $this->asWebUser($administrator),
        };

        $this->assertRefused($client()->postJson($url, $this->validNote()));
        $this->assertRefused($client()->postJson($url, []));
        $this->assertDatabaseCount('specialist_notes', 0);
    }

    public static function refusedWrites(): iterable
    {
        yield 'a patient who does not exist' => ['prosthetist', 'unknown'];
        yield 'a patient who has not shared with them' => ['prosthetist', 'stranger'];
        yield 'a patient who revoked their grant' => ['prosthetist', 'revoked'];
        yield 'a prosthetist account used as the patient' => ['prosthetist', 'prosthetist'];
        yield 'the patient on their own card' => ['patient', 'patient'];
        yield 'an administrator' => ['administrator', 'patient'];
    }

    public function test_the_policy_refuses_a_prosthetist_without_a_grant_on_its_own(): void
    {
        $patient = User::factory()->create();
        $prosthetist = User::factory()->prosthetist()->create();

        $this->assertFalse($prosthetist->can('create', [SpecialistNote::class, $patient]));

        $this->grant($patient, $prosthetist, []);

        $this->assertTrue($prosthetist->can('create', [SpecialistNote::class, $patient]));
    }

    public function test_adding_a_note_requires_authentication(): void
    {
        $patient = User::factory()->create();

        $this->postJson($this->notesOf($patient), $this->validNote())->assertUnauthorized();
        $this->assertDatabaseCount('specialist_notes', 0);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    #[DataProvider('invalidNotes')]
    public function test_invalid_notes_are_rejected(array $payload, string $field): void
    {
        $patient = User::factory()->create();
        $prosthetist = User::factory()->prosthetist()->create();
        $this->grant($patient, $prosthetist, []);

        $this->asWebUser($prosthetist)
            ->postJson($this->notesOf($patient), $payload)
            ->assertUnprocessable()
            ->assertOnlyJsonValidationErrors([$field]);
        $this->assertDatabaseCount('specialist_notes', 0);
    }

    public static function invalidNotes(): iterable
    {
        yield 'missing type' => [['content' => 'Measure the stump every morning.'], 'type'];
        yield 'unknown type' => [['type' => 'diary', 'content' => 'Measure the stump every morning.'], 'type'];
        yield 'missing content' => [['type' => 'recommendation'], 'content'];
        yield 'whitespace-only content' => [['type' => 'recommendation', 'content' => "  \n\t "], 'content'];
        yield 'content over 5000 characters' => [['type' => 'recommendation', 'content' => str_repeat('ż', 5001)], 'content'];
    }

    public function test_content_may_be_exactly_5000_characters_long(): void
    {
        $patient = User::factory()->create();
        $prosthetist = User::factory()->prosthetist()->create();
        $this->grant($patient, $prosthetist, []);
        $content = str_repeat('ż', 5000);

        $this->asWebUser($prosthetist)
            ->postJson($this->notesOf($patient), ['type' => 'technical_note', 'content' => $content])
            ->assertCreated()
            ->assertJsonPath('data.content', $content);
    }

    public function test_line_breaks_and_markup_characters_are_kept_as_written(): void
    {
        $patient = User::factory()->create();
        $prosthetist = User::factory()->prosthetist()->create();
        $this->grant($patient, $prosthetist, []);
        $content = "Socket check:\n- pressure <5 kPa\n- liner \"size 3\" & <b>one</b> sock";

        $this->asWebUser($prosthetist)
            ->postJson($this->notesOf($patient), ['type' => 'technical_note', 'content' => $content])
            ->assertCreated()
            ->assertJsonPath('data.content', $content);
        $this->assertSame($content, SpecialistNote::query()->sole()->content);
    }

    public function test_the_web_panel_must_send_its_csrf_token_to_add_a_note(): void
    {
        config([
            'session.driver' => 'database',
            'sanctum.middleware.validate_csrf_token' => EnforcedCsrfToken::class,
        ]);
        $patient = User::factory()->create();
        $prosthetist = User::factory()->prosthetist()->create();
        $this->grant($patient, $prosthetist, []);
        [$session, $csrfToken] = $this->signInToTheWebPanel($prosthetist);

        $this->inWebSession($session)
            ->postJson($this->notesOf($patient), $this->validNote())
            ->assertStatus(419)
            ->assertJsonPath('message', 'CSRF token mismatch.');
        $this->assertDatabaseCount('specialist_notes', 0);

        $this->inWebSession($session)
            ->withHeader('X-XSRF-TOKEN', $csrfToken)
            ->postJson($this->notesOf($patient), $this->validNote())
            ->assertCreated();
        $this->assertDatabaseCount('specialist_notes', 1);
    }

    private function notesOf(User $patient): string
    {
        return "/api/patients/{$patient->id}/notes";
    }

    private function validNote(): array
    {
        return ['type' => 'recommendation', 'content' => 'Measure the stump every morning.'];
    }

    private function assertRefused(TestResponse $response): void
    {
        $response->assertForbidden()->assertJsonPath('message', 'This action is unauthorized.');
    }

    /**
     * @param  array<string, mixed>  $permissions
     */
    private function grant(User $patient, User $prosthetist, array $permissions): void
    {
        $this->asPatient($patient)
            ->postJson('/api/shares', ['specialist_id' => $prosthetist->id, 'permissions' => $permissions])
            ->assertCreated();
    }

    private function asPatient(User $patient): static
    {
        return $this->asNewClient()
            ->withToken($patient->createToken('specialist-notes-test')->plainTextToken);
    }

    private function asWebUser(User $user): static
    {
        return $this->asNewClient()->actingAs($user);
    }

    /**
     * Logging in rotates the CSRF token, so the new one comes from the login response.
     *
     * @return array{string, string} session cookie, CSRF token
     */
    private function signInToTheWebPanel(User $prosthetist): array
    {
        $csrf = $this->asNewClient()
            ->withHeader('Origin', self::SPA_ORIGIN)
            ->get('/sanctum/csrf-cookie')
            ->assertNoContent();

        $login = $this->inWebSession($csrf->getCookie(config('session.cookie'))->getValue())
            ->withHeader('X-XSRF-TOKEN', $csrf->getCookie('XSRF-TOKEN', decrypt: false)->getValue())
            ->postJson('/api/web/login', ['email' => $prosthetist->email, 'password' => 'password'])
            ->assertOk();

        return [
            $login->getCookie(config('session.cookie'))->getValue(),
            $login->getCookie('XSRF-TOKEN', decrypt: false)->getValue(),
        ];
    }

    private function inWebSession(string $session): static
    {
        return $this->asNewClient()
            ->withHeader('Origin', self::SPA_ORIGIN)
            ->withCredentials()
            ->withCookie(config('session.cookie'), $session);
    }

    /**
     * Without this, a login from an earlier request leaks into the next one.
     */
    private function asNewClient(): static
    {
        $this->forgetAuthenticatedUser();
        $this->flushHeaders();
        $this->app['session.store']->flush();

        return $this;
    }
}
