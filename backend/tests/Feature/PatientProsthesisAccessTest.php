<?php

namespace Tests\Feature;

use App\Models\Component;
use App\Models\Prosthesis;
use App\Models\User;
use Closure;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Illuminate\Testing\TestResponse;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class PatientProsthesisAccessTest extends TestCase
{
    use RefreshDatabase;

    private const SPA_ORIGIN = 'http://localhost:5173';

    public function test_the_patient_reads_their_own_prostheses_with_components(): void
    {
        $this->travelTo(Carbon::parse('2026-10-19 12:00:00'));
        $patient = User::factory()->create();
        $daily = Prosthesis::factory()->for($patient)->create([
            'name' => 'Daily leg',
            'side' => 'left',
            'limb_type' => 'lower',
            'amputation_level' => 'transtibial',
            'replacement_at' => '2030-01-15 00:00:00',
        ]);
        $sports = Prosthesis::factory()->for($patient)->create(['name' => 'Sports leg']);
        Prosthesis::factory()->for($patient)->create(['name' => 'Archived leg'])->delete();
        $foot = Component::factory()->for($daily)->create([
            'type' => 'foot',
            'name' => 'Carbon foot',
            'manufacturer' => 'Ottobock',
            'model' => 'Triton',
            'serial_number' => 'SN-0002',
            'is_test_socket' => null,
            'installed_at' => '2026-06-01 00:00:00',
            'replacement_at' => null,
            'warranty_until' => '2028-06-01 00:00:00',
        ]);
        $socket = Component::factory()->for($daily)->create([
            'type' => 'socket',
            'name' => 'Test socket',
            'manufacturer' => null,
            'model' => null,
            'serial_number' => null,
            'is_test_socket' => true,
            'installed_at' => '2026-01-10 00:00:00',
            'replacement_at' => '2026-07-10 00:00:00',
            'warranty_until' => null,
        ]);
        Component::factory()->for($daily)->create()->delete();

        $this->asPatient($patient)
            ->getJson("/api/patients/{$patient->id}/prostheses")
            ->assertOk()
            ->assertJsonPath('data.*.id', [$daily->id, $sports->id])
            ->assertJsonPath('data.0.components.*.id', [$socket->id, $foot->id]);

        $this->asPatient($patient)
            ->getJson("/api/patients/{$patient->id}/prostheses/{$daily->id}")
            ->assertOk()
            ->assertExactJson(['data' => [
                'id' => $daily->id,
                'name' => 'Daily leg',
                'side' => 'left',
                'limb_type' => 'lower',
                'amputation_level' => 'transtibial',
                'replacement_at' => '2030-01-15T00:00:00.000000Z',
                'components' => [
                    [
                        'id' => $socket->id,
                        'type' => 'socket',
                        'name' => 'Test socket',
                        'manufacturer' => null,
                        'model' => null,
                        'serial_number' => null,
                        'is_test_socket' => true,
                        'installed_at' => '2026-01-10T00:00:00.000000Z',
                        'replacement_at' => '2026-07-10T00:00:00.000000Z',
                        'warranty_until' => null,
                    ],
                    [
                        'id' => $foot->id,
                        'type' => 'foot',
                        'name' => 'Carbon foot',
                        'manufacturer' => 'Ottobock',
                        'model' => 'Triton',
                        'serial_number' => 'SN-0002',
                        'is_test_socket' => null,
                        'installed_at' => '2026-06-01T00:00:00.000000Z',
                        'replacement_at' => null,
                        'warranty_until' => '2028-06-01T00:00:00.000000Z',
                    ],
                ],
                'created_at' => '2026-10-19T12:00:00.000000Z',
                'updated_at' => '2026-10-19T12:00:00.000000Z',
            ]]);
    }

    public function test_a_prosthetist_sees_only_the_prostheses_the_patient_selected(): void
    {
        $patient = User::factory()->create();
        $prosthetist = User::factory()->prosthetist()->create();
        $selected = Prosthesis::factory()->for($patient)->create(['name' => 'Selected leg']);
        $unselected = Prosthesis::factory()->for($patient)->create(['name' => 'Another leg']);
        $component = Component::factory()->for($selected)->create();
        Component::factory()->for($selected)->create()->delete();
        $this->grant($patient, $prosthetist, ['medical_history' => true, 'prostheses' => [$selected->id]]);

        $this->asWebUser($prosthetist)
            ->getJson("/api/patients/{$patient->id}/prostheses")
            ->assertOk()
            ->assertJsonPath('data.*.id', [$selected->id])
            ->assertJsonPath('data.0.components.*.id', [$component->id]);

        $this->asWebUser($prosthetist)
            ->getJson("/api/patients/{$patient->id}/prostheses/{$selected->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $selected->id)
            ->assertJsonPath('data.components.*.id', [$component->id]);

        $this->assertRefused(
            $this->asWebUser($prosthetist)->getJson("/api/patients/{$patient->id}/prostheses/{$unselected->id}"),
        );
    }

    public function test_a_grant_that_selects_nothing_shows_an_empty_list(): void
    {
        $patient = User::factory()->create();
        $prosthetist = User::factory()->prosthetist()->create();
        $prosthesis = Prosthesis::factory()->for($patient)->create();
        $this->grant($patient, $prosthetist, []);

        $this->asWebUser($prosthetist)
            ->getJson("/api/patients/{$patient->id}/prostheses")
            ->assertOk()
            ->assertExactJson(['data' => []]);

        $this->assertRefused(
            $this->asWebUser($prosthetist)->getJson("/api/patients/{$patient->id}/prostheses/{$prosthesis->id}"),
        );
    }

    public function test_revoking_a_grant_refuses_the_next_read_in_the_prosthetists_web_session(): void
    {
        config(['session.driver' => 'database']);

        $patient = User::factory()->create();
        $prosthetist = User::factory()->prosthetist()->create();
        $prosthesis = Prosthesis::factory()->for($patient)->create();
        $this->grant($patient, $prosthetist, ['prostheses' => [$prosthesis->id]]);
        $url = "/api/patients/{$patient->id}/prostheses/{$prosthesis->id}";
        $session = $this->signInToTheWebPanel($prosthetist);

        $this->inWebSession($session)->getJson($url)->assertOk();

        $this->asPatient($patient)
            ->deleteJson("/api/shares/{$prosthetist->id}")
            ->assertNoContent();

        $this->assertRefused($this->inWebSession($session)->getJson($url));
        $this->assertRefused($this->inWebSession($session)->getJson("/api/patients/{$patient->id}/prostheses"));
    }

    public function test_narrowing_the_selection_refuses_the_dropped_prosthesis_on_the_next_read(): void
    {
        $patient = User::factory()->create();
        $prosthetist = User::factory()->prosthetist()->create();
        [$kept, $dropped] = Prosthesis::factory()->for($patient)->count(2)->create()->all();
        $this->grant($patient, $prosthetist, ['prostheses' => [$kept->id, $dropped->id]]);

        $this->asWebUser($prosthetist)
            ->getJson("/api/patients/{$patient->id}/prostheses/{$dropped->id}")
            ->assertOk();

        $this->asPatient($patient)
            ->putJson("/api/shares/{$prosthetist->id}", ['permissions' => ['prostheses' => [$kept->id]]])
            ->assertOk();

        $this->assertRefused(
            $this->asWebUser($prosthetist)->getJson("/api/patients/{$patient->id}/prostheses/{$dropped->id}"),
        );
        $this->asWebUser($prosthetist)
            ->getJson("/api/patients/{$patient->id}/prostheses/{$kept->id}")
            ->assertOk();
        $this->asWebUser($prosthetist)
            ->getJson("/api/patients/{$patient->id}/prostheses")
            ->assertJsonPath('data.*.id', [$kept->id]);
    }

    /**
     * @param  Closure(array<string, User|Prosthesis>): string  $url
     */
    #[DataProvider('refusedReads')]
    public function test_every_refusal_looks_the_same(Closure $url): void
    {
        $prosthetist = User::factory()->prosthetist()->create();
        $patient = User::factory()->create();
        $stranger = User::factory()->create();
        $records = [
            'patient' => $patient,
            'unselected' => Prosthesis::factory()->for($patient)->create(),
            'deleted' => Prosthesis::factory()->for($patient)->create(),
            'stranger' => $stranger,
            'strangersProsthesis' => Prosthesis::factory()->for($stranger)->create(),
        ];
        $this->grant($patient, $prosthetist, ['prostheses' => [$records['deleted']->id]]);
        $records['deleted']->delete();

        $this->assertRefused($this->asWebUser($prosthetist)->getJson($url($records)));
    }

    public static function refusedReads(): iterable
    {
        yield 'a patient who does not exist' => [
            fn (array $records): string => '/api/patients/'.Str::uuid().'/prostheses',
        ];
        yield 'a prosthesis that does not exist' => [
            fn (array $records): string => "/api/patients/{$records['patient']->id}/prostheses/".Str::uuid(),
        ];
        yield 'a deleted prosthesis that is still selected' => [
            fn (array $records): string => "/api/patients/{$records['patient']->id}/prostheses/{$records['deleted']->id}",
        ];
        yield 'a prosthesis that is not selected' => [
            fn (array $records): string => "/api/patients/{$records['patient']->id}/prostheses/{$records['unselected']->id}",
        ];
        yield 'a patient who has not shared with them' => [
            fn (array $records): string => "/api/patients/{$records['stranger']->id}/prostheses",
        ];
        yield 'the prosthesis of a patient who has not shared with them' => [
            fn (array $records): string => "/api/patients/{$records['stranger']->id}/prostheses/{$records['strangersProsthesis']->id}",
        ];
    }

    public function test_a_grant_opens_records_only_under_the_patient_who_gave_it(): void
    {
        $prosthetist = User::factory()->prosthetist()->create();
        $anna = User::factory()->create();
        $piotr = User::factory()->create();
        $annasProsthesis = Prosthesis::factory()->for($anna)->create();
        $piotrsProsthesis = Prosthesis::factory()->for($piotr)->create();
        $this->grant($anna, $prosthetist, ['prostheses' => [$annasProsthesis->id]]);
        $this->grant($piotr, $prosthetist, ['prostheses' => [$piotrsProsthesis->id]]);

        $this->asWebUser($prosthetist)
            ->getJson("/api/patients/{$anna->id}/prostheses")
            ->assertJsonPath('data.*.id', [$annasProsthesis->id]);
        $this->asWebUser($prosthetist)
            ->getJson("/api/patients/{$piotr->id}/prostheses/{$piotrsProsthesis->id}")
            ->assertOk();

        $this->assertRefused(
            $this->asWebUser($prosthetist)->getJson("/api/patients/{$anna->id}/prostheses/{$piotrsProsthesis->id}"),
        );
        $this->assertRefused(
            $this->asWebUser($prosthetist)->getJson("/api/patients/{$piotr->id}/prostheses/{$annasProsthesis->id}"),
        );
    }

    public function test_other_patients_and_administrators_are_refused(): void
    {
        $patient = User::factory()->create();
        $prosthesis = Prosthesis::factory()->for($patient)->create();
        $otherPatient = User::factory()->create();
        $administrator = User::factory()->admin()->create();

        foreach (["/api/patients/{$patient->id}/prostheses", "/api/patients/{$patient->id}/prostheses/{$prosthesis->id}"] as $url) {
            $this->assertRefused($this->asPatient($otherPatient)->getJson($url));
            $this->assertRefused($this->asWebUser($administrator)->getJson($url));
        }
    }

    public function test_a_prosthetists_own_account_has_no_patient_records(): void
    {
        $prosthetist = User::factory()->prosthetist()->create();

        $this->assertRefused(
            $this->asWebUser($prosthetist)->getJson("/api/patients/{$prosthetist->id}/prostheses"),
        );
    }

    public function test_a_restored_prosthesis_that_is_still_selected_is_shared_again(): void
    {
        $patient = User::factory()->create();
        $prosthetist = User::factory()->prosthetist()->create();
        $prosthesis = Prosthesis::factory()->for($patient)->create();
        $this->grant($patient, $prosthetist, ['prostheses' => [$prosthesis->id]]);
        $url = "/api/patients/{$patient->id}/prostheses/{$prosthesis->id}";

        $prosthesis->delete();
        $this->assertRefused($this->asWebUser($prosthetist)->getJson($url));

        $prosthesis->restore();
        $this->asWebUser($prosthetist)->getJson($url)->assertOk();
    }

    public function test_reading_patient_records_requires_authentication(): void
    {
        $prosthesis = Prosthesis::factory()->create();

        $this->getJson("/api/patients/{$prosthesis->user_id}/prostheses")->assertUnauthorized();
        $this->getJson("/api/patients/{$prosthesis->user_id}/prostheses/{$prosthesis->id}")->assertUnauthorized();
    }

    public function test_malformed_ids_do_not_match_any_route(): void
    {
        $patient = User::factory()->create();

        $this->asPatient($patient)->getJson('/api/patients/not-a-uuid/prostheses')->assertNotFound();
        $this->asPatient($patient)->getJson("/api/patients/{$patient->id}/prostheses/not-a-uuid")->assertNotFound();
    }

    /**
     * Every refusal carries the same status and message, whatever its cause.
     */
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

    /**
     * Patients use the mobile app's token, as in production.
     */
    private function asPatient(User $patient): static
    {
        return $this->asNewClient()
            ->withToken($patient->createToken('patient-records-test')->plainTextToken);
    }

    /**
     * Prosthetists and administrators use the web panel and never receive tokens.
     */
    private function asWebUser(User $user): static
    {
        return $this->asNewClient()->actingAs($user);
    }

    private function signInToTheWebPanel(User $prosthetist): string
    {
        $cookie = $this->asNewClient()
            ->withHeader('Origin', self::SPA_ORIGIN)
            ->postJson('/api/web/login', ['email' => $prosthetist->email, 'password' => 'password'])
            ->assertOk()
            ->getCookie(config('session.cookie'));

        $this->assertNotNull($cookie);

        return $cookie->getValue();
    }

    /**
     * JSON test requests send cookies only with credentials, as a browser does for
     * the web panel.
     */
    private function inWebSession(string $session): static
    {
        return $this->asNewClient()
            ->withHeader('Origin', self::SPA_ORIGIN)
            ->withCredentials()
            ->withCookie(config('session.cookie'), $session);
    }

    /**
     * Make the next request come from a separate client. The test application keeps
     * guards and one session store across requests, so without this a login earlier
     * in the test would leak into a request that sends no session cookie.
     */
    private function asNewClient(): static
    {
        $this->forgetAuthenticatedUser();
        $this->flushHeaders();
        $this->app['session.store']->flush();

        return $this;
    }
}
