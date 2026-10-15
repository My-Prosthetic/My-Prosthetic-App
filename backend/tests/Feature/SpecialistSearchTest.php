<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class SpecialistSearchTest extends TestCase
{
    use RefreshDatabase;

    public function test_patient_finds_a_prosthetist_by_surname(): void
    {
        $prosthetist = User::factory()->prosthetist()->create(['name' => 'Jan Kowalski']);
        User::factory()->prosthetist()->create(['name' => 'Anna Nowak']);

        $this->search('Kowalski')
            ->assertOk()
            ->assertExactJson(['data' => [['id' => $prosthetist->id, 'name' => 'Jan Kowalski']]]);
    }

    #[DataProvider('matchingQueries')]
    public function test_name_matching_ignores_case_diacritics_and_word_order(string $name, string $query): void
    {
        $prosthetist = User::factory()->prosthetist()->create(['name' => $name]);
        User::factory()->prosthetist()->create(['name' => 'Anna Nowak']);

        $this->search($query)
            ->assertOk()
            ->assertExactJson(['data' => [['id' => $prosthetist->id, 'name' => $name]]]);
    }

    public static function matchingQueries(): iterable
    {
        yield 'lowercase query' => ['Jan Kowalski', 'kowalski'];
        yield 'uppercase query' => ['Jan Kowalski', 'KOWALSKI'];
        yield 'query without diacritics' => ['Adam Pawełka', 'pawelka'];
        yield 'query with diacritics' => ['Adam Pawelka', 'Pawełka'];
        yield 'uppercase query with diacritics' => ['Adam Pawełka', 'PAWEŁKA'];
        yield 'some of several diacritics' => ['Ewa Łąkalski', 'łakalski'];
        yield 'other diacritics of several' => ['Ewa Łąkalski', 'ląkalski'];
        yield 'partial word' => ['Jan Kowalski', 'owals'];
        yield 'words in reverse order' => ['Jan Kowalski', 'kowalski jan'];
        yield 'partial words in any order' => ['Jan Kowalski', 'kowal ja'];
    }

    public function test_every_query_word_narrows_the_results(): void
    {
        $jan = User::factory()->prosthetist()->create(['name' => 'Jan Kowalski']);
        $piotr = User::factory()->prosthetist()->create(['name' => 'Piotr Kowalski']);

        $this->search('kowalski')
            ->assertOk()
            ->assertJsonPath('data.*.id', [$jan->id, $piotr->id]);

        $this->search('kowalski piotr')
            ->assertOk()
            ->assertJsonPath('data.*.id', [$piotr->id]);

        $this->search('kowalski anna')
            ->assertOk()
            ->assertExactJson(['data' => []]);
    }

    public function test_only_prosthetists_are_returned(): void
    {
        $prosthetist = User::factory()->prosthetist()->create(['name' => 'Jan Kowalski']);
        User::factory()->create(['name' => 'Ewa Kowalski']);
        User::factory()->admin()->create(['name' => 'Olga Kowalski']);

        $this->search('kowalski')
            ->assertOk()
            ->assertJsonPath('data.*.id', [$prosthetist->id]);
    }

    public function test_results_are_ordered_by_name_and_limited_to_twenty(): void
    {
        $names = collect(range(1, 25))->map(fn (int $number): string => sprintf('Kowalski %02d', $number));
        foreach ($names->shuffle() as $name) {
            User::factory()->prosthetist()->create(['name' => $name]);
        }

        $this->search('kowalski')
            ->assertOk()
            ->assertJsonPath('data.*.name', $names->take(20)->values()->all());
    }

    public function test_like_wildcards_in_the_query_match_literally(): void
    {
        User::factory()->prosthetist()->create(['name' => 'Jan Kowalski']);
        $literal = User::factory()->prosthetist()->create(['name' => 'Jan Kowal_ski 100%']);

        $this->search('%%%')->assertOk()->assertExactJson(['data' => []]);
        $this->search('___')->assertOk()->assertExactJson(['data' => []]);
        $this->search('l_s')->assertOk()->assertJsonPath('data.*.id', [$literal->id]);
        $this->search('00%')->assertOk()->assertJsonPath('data.*.id', [$literal->id]);

        $bang = User::factory()->prosthetist()->create(['name' => 'Ewa Hop!Hop']);

        $this->search('!!!')->assertOk()->assertExactJson(['data' => []]);
        $this->search('p!h')->assertOk()->assertJsonPath('data.*.id', [$bang->id]);
    }

    #[DataProvider('typedCodes')]
    public function test_patient_finds_a_prosthetist_by_specialist_code(string $query): void
    {
        $prosthetist = User::factory()->prosthetist()->create([
            'name' => 'Jan Kowalski',
            'specialist_code' => '7K3Q0X1B',
        ]);
        User::factory()->prosthetist()->create(['name' => 'Anna Nowak']);

        $this->search($query)
            ->assertOk()
            ->assertExactJson(['data' => [['id' => $prosthetist->id, 'name' => 'Jan Kowalski']]]);
    }

    public static function typedCodes(): iterable
    {
        yield 'exact code' => ['7K3Q0X1B'];
        yield 'lowercase' => ['7k3q0x1b'];
        yield 'hyphenated' => ['7K3Q-0X1B'];
        yield 'spaced' => ['7K3Q 0X1B'];
        yield 'look-alike letters' => ['7k3q-oxlb'];
        yield 'other look-alike letters' => ['7K3QOXIB'];
    }

    public function test_only_a_whole_code_matches(): void
    {
        User::factory()->prosthetist()->create(['name' => 'Jan Kowalski', 'specialist_code' => '7K3Q0X1B']);

        $this->search('7K3Q0X1')->assertOk()->assertExactJson(['data' => []]);
        $this->search('7K3Q')->assertOk()->assertExactJson(['data' => []]);
    }

    #[DataProvider('invalidQueries')]
    public function test_invalid_queries_are_rejected(array $parameters): void
    {
        $patient = User::factory()->create();

        $this->withToken($patient->createToken('search-test')->plainTextToken)
            ->getJson('/api/specialists/search?'.http_build_query($parameters))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['q']);
    }

    public static function invalidQueries(): iterable
    {
        yield 'missing query' => [[]];
        yield 'too short' => [['q' => 'ko']];
        yield 'too short after trimming' => [['q' => '  ko  ']];
        yield 'too long' => [['q' => str_repeat('a', 101)]];
        yield 'too many words' => [['q' => 'one two three four five six']];
        yield 'not a string' => [['q' => ['kowalski']]];
        yield 'only combining marks' => [['q' => "\u{0301}\u{0301}\u{0301}"]];
        yield 'too short once diacritics are folded' => [['q' => "a\u{0301}\u{0301}"]];
    }

    public function test_five_words_are_allowed(): void
    {
        $this->search('jan maria anna ewa kowalski')->assertOk();
    }

    #[DataProvider('nonPatientRoles')]
    public function test_non_patients_cannot_search(string $state): void
    {
        $user = User::factory()->{$state}()->create();

        $this->search('kowalski', $user)->assertForbidden();
        $this->search('', $user)->assertForbidden();
    }

    public static function nonPatientRoles(): iterable
    {
        yield 'prosthetist' => ['prosthetist'];
        yield 'admin' => ['admin'];
    }

    public function test_search_requires_authentication(): void
    {
        $this->getJson('/api/specialists/search?q=kowalski')->assertUnauthorized();
    }

    public function test_search_is_rate_limited_per_user(): void
    {
        $patient = User::factory()->create();

        for ($attempt = 0; $attempt < 30; $attempt++) {
            $this->search('kowalski', $patient)->assertOk();
        }

        $this->search('kowalski', $patient)->assertTooManyRequests();
        $this->search('kowalski')->assertOk();
    }

    public function test_search_name_follows_the_name_when_it_changes(): void
    {
        $prosthetist = User::factory()->prosthetist()->create(['name' => 'Jan Kowalski']);

        $prosthetist->update(['name' => 'Jan Łęcki']);

        $this->search('kowalski')->assertOk()->assertExactJson(['data' => []]);
        $this->search('lecki')->assertOk()->assertJsonPath('data.*.id', [$prosthetist->id]);
    }

    public function test_seeded_users_are_searchable_even_with_model_events_muted(): void
    {
        $prosthetist = User::withoutEvents(
            fn (): User => User::factory()->prosthetist()->create(['name' => 'Zofia Żółkiewska']),
        );

        $this->search('zolkiewska')->assertOk()->assertJsonPath('data.*.id', [$prosthetist->id]);
    }

    private function search(string $query, ?User $as = null): TestResponse
    {
        $user = $as ?? User::factory()->create();
        $this->forgetAuthenticatedUser();

        return $this->withToken($user->createToken('search-test')->plainTextToken)
            ->getJson('/api/specialists/search?'.http_build_query(['q' => $query]));
    }
}
