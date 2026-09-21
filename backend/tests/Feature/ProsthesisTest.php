<?php

namespace Tests\Feature;

use App\Enums\ComponentType;
use App\Models\Component;
use App\Models\Prosthesis;
use App\Models\User;
use Database\Seeders\ProsthesisSeeder;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Tests\TestCase;

class ProsthesisTest extends TestCase
{
    use RefreshDatabase;

    public function test_patient_can_create_a_prosthesis_with_components(): void
    {
        $patient = User::factory()->create();

        $prosthesis = Prosthesis::create([
            'user_id' => $patient->id,
            'name' => 'Daily left leg',
            'side' => 'left',
            'limb_type' => 'lower',
            'amputation_level' => 'transtibial',
            'replacement_at' => Carbon::parse('2030-01-15'),
        ]);

        $component = Component::create([
            'prosthesis_id' => $prosthesis->id,
            'type' => 'socket',
            'name' => 'Final socket',
            'model' => 'Socket 2000',
            'is_test_socket' => false,
            'installed_at' => Carbon::parse('2026-09-01'),
            'replacement_at' => Carbon::parse('2030-01-15'),
            'warranty_until' => Carbon::parse('2028-09-01'),
        ]);

        $this->assertTrue(Str::isUuid($prosthesis->id));
        $this->assertTrue(Str::isUuid($component->id));
        $this->assertTrue($prosthesis->user->is($patient));
        $this->assertTrue($prosthesis->components->contains($component));
        $this->assertTrue($component->prosthesis->is($prosthesis));
    }

    public function test_equipment_attributes_are_cast_and_unexpected_attributes_are_ignored(): void
    {
        $patient = User::factory()->create();

        $prosthesis = Prosthesis::create([
            'user_id' => $patient->id,
            'name' => 'Daily left leg',
            'side' => 'left',
            'limb_type' => 'lower',
            'amputation_level' => 'transtibial',
            'replacement_at' => '2030-01-15 00:00:00',
            'unexpected' => 'ignored',
        ]);

        $component = Component::create([
            'prosthesis_id' => $prosthesis->id,
            'type' => 'socket',
            'is_test_socket' => 1,
            'installed_at' => '2026-09-01 00:00:00',
            'warranty_until' => '2028-09-01 00:00:00',
            'unexpected' => 'ignored',
        ]);

        $this->assertInstanceOf(Carbon::class, $prosthesis->replacement_at);
        $this->assertInstanceOf(Carbon::class, $component->installed_at);
        $this->assertInstanceOf(Carbon::class, $component->warranty_until);
        $this->assertTrue($component->is_test_socket);
        $this->assertArrayNotHasKey('unexpected', $prosthesis->getAttributes());
        $this->assertArrayNotHasKey('unexpected', $component->getAttributes());
    }

    public function test_component_requires_an_installation_date(): void
    {
        $patient = User::factory()->create();
        $prosthesis = Prosthesis::factory()->for($patient, 'user')->create();

        $this->expectException(QueryException::class);

        Component::create([
            'prosthesis_id' => $prosthesis->id,
            'type' => 'socket',
        ]);
    }

    public function test_component_type_is_cast_to_a_defined_category(): void
    {
        $prosthesis = Prosthesis::factory()->create();

        $component = Component::create([
            'prosthesis_id' => $prosthesis->id,
            'type' => 'socket',
            'installed_at' => Carbon::parse('2026-09-01'),
        ]);

        $this->assertSame(ComponentType::SOCKET, $component->type);
    }

    public function test_component_rejects_an_unknown_category(): void
    {
        $prosthesis = Prosthesis::factory()->create();

        $this->expectException(\ValueError::class);

        Component::create([
            'prosthesis_id' => $prosthesis->id,
            'type' => 'unknown',
            'installed_at' => Carbon::parse('2026-09-01'),
        ]);
    }

    public function test_prosthesis_requires_a_replacement_date(): void
    {
        $patient = User::factory()->create();

        $this->expectException(QueryException::class);

        Prosthesis::create([
            'user_id' => $patient->id,
            'name' => 'Daily left leg',
            'side' => 'left',
            'limb_type' => 'lower',
            'amputation_level' => 'transtibial',
        ]);
    }

    public function test_soft_deleting_a_prosthesis_soft_deletes_its_components(): void
    {
        $patient = User::factory()->create();
        $prosthesis = Prosthesis::create([
            'user_id' => $patient->id,
            'name' => 'Daily left leg',
            'side' => 'left',
            'limb_type' => 'lower',
            'amputation_level' => 'transtibial',
            'replacement_at' => Carbon::parse('2030-01-15'),
        ]);
        $component = Component::create([
            'prosthesis_id' => $prosthesis->id,
            'type' => 'socket',
            'installed_at' => Carbon::parse('2026-09-01'),
        ]);

        $prosthesis->delete();

        $this->assertSoftDeleted('prostheses', ['id' => $prosthesis->id]);
        $this->assertSoftDeleted('components', ['id' => $component->id]);
        $this->assertNull(Prosthesis::find($prosthesis->id));
        $this->assertNotNull(Prosthesis::withTrashed()->find($prosthesis->id));
        $this->assertNotNull(Component::withTrashed()->find($component->id));
    }

    public function test_factories_create_a_valid_prosthesis_tree(): void
    {
        $patient = User::factory()->create();

        $prosthesis = Prosthesis::factory()
            ->for($patient, 'user')
            ->has(Component::factory()->count(3), 'components')
            ->create();
        $components = Component::query()
            ->where('prosthesis_id', $prosthesis->id)
            ->get();

        $this->assertCount(3, $components);
        $this->assertTrue($components->every(
            static fn (Component $component): bool => $component->prosthesis->is($prosthesis),
        ));
    }

    public function test_prosthesis_seeder_creates_a_repeatable_sample_tree(): void
    {
        $this->seed(ProsthesisSeeder::class);
        $this->seed(ProsthesisSeeder::class);

        $patient = User::query()
            ->where('email', 'prosthesis.patient@example.com')
            ->firstOrFail();
        $prosthesis = Prosthesis::query()
            ->where('user_id', $patient->id)
            ->firstOrFail();

        $this->assertDatabaseCount('prostheses', 1);
        $this->assertDatabaseCount('components', 3);
        $this->assertCount(3, $prosthesis->components);
    }
}
