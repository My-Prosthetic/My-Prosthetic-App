<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\User;
use App\Support\SpecialistCode;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class SpecialistCodeTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_prosthetist_sees_their_own_code_on_their_profile(): void
    {
        $prosthetist = User::factory()->prosthetist()->create();

        $code = $this->profile($prosthetist)
            ->assertOk()
            ->json('data.specialist_code');

        $this->assertIsString($code);
        $this->assertTrue(SpecialistCode::isWellFormed($code));
    }

    #[DataProvider('rolesWithoutCode')]
    public function test_other_roles_have_no_code_on_their_profile(UserRole $role): void
    {
        $user = User::factory()->create(['role' => $role]);

        $this->profile($user)
            ->assertOk()
            ->assertJsonPath('data.specialist_code', null);
    }

    public static function rolesWithoutCode(): iterable
    {
        yield 'patient' => [UserRole::PATIENT];
        yield 'admin' => [UserRole::ADMIN];
    }

    public function test_every_prosthetist_gets_a_different_code(): void
    {
        $codes = User::factory()->prosthetist()->count(20)->create()
            ->map(fn (User $prosthetist): ?string => $this->profile($prosthetist)->json('data.specialist_code'));

        $this->assertCount(20, $codes->filter()->unique());
    }

    public function test_prosthetists_created_with_muted_model_events_still_get_a_code(): void
    {
        $prosthetist = User::withoutEvents(fn (): User => User::factory()->prosthetist()->create());

        $this->assertNotNull($this->profile($prosthetist)->json('data.specialist_code'));
    }

    public function test_the_code_is_kept_when_a_prosthetist_is_saved_again(): void
    {
        $prosthetist = User::factory()->prosthetist()->create();
        $code = $this->profile($prosthetist)->json('data.specialist_code');

        $prosthetist->refresh()->update(['name' => 'Renamed Prosthetist', 'role' => 'prosthetist']);

        $this->profile($prosthetist)->assertJsonPath('data.specialist_code', $code);
    }

    public function test_the_code_follows_the_role(): void
    {
        $user = User::factory()->create();

        $user->update(['role' => 'prosthetist']);
        $this->assertNotNull($this->profile($user)->json('data.specialist_code'));

        $user->update(['role' => 'patient']);
        $this->profile($user)->assertJsonPath('data.specialist_code', null);
    }

    private function profile(User $user): TestResponse
    {
        $this->forgetAuthenticatedUser();

        return $this->withToken($user->createToken('profile-test')->plainTextToken)
            ->getJson('/api/profile');
    }
}
