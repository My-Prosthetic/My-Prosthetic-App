<?php

namespace Tests\Feature;

use Database\Seeders\DatabaseSeeder;
use Database\Seeders\MedicalProfileSeeder;
use Database\Seeders\ProsthesisSeeder;
use Database\Seeders\SpecialistNoteSeeder;
use Database\Seeders\WalletEntrySeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class DatabaseSeederTest extends TestCase
{
    use RefreshDatabase;

    #[DataProvider('demoSeeders')]
    public function test_demo_data_is_not_seeded_in_production(string $seeder): void
    {
        $this->app->detectEnvironment(fn (): string => 'production');

        $this->artisan('db:seed', ['--class' => $seeder, '--force' => true])->assertSuccessful();

        $this->assertDatabaseCount('users', 0);
        $this->assertDatabaseCount('medical_profiles', 0);
        $this->assertDatabaseCount('prostheses', 0);
        $this->assertDatabaseCount('wallet_entries', 0);
        $this->assertDatabaseCount('user_shares', 0);
        $this->assertDatabaseCount('specialist_notes', 0);
    }

    public static function demoSeeders(): iterable
    {
        yield 'database seeder' => [DatabaseSeeder::class];
        yield 'prosthesis seeder' => [ProsthesisSeeder::class];
        yield 'wallet entry seeder' => [WalletEntrySeeder::class];
        yield 'medical profile seeder' => [MedicalProfileSeeder::class];
        yield 'specialist note seeder' => [SpecialistNoteSeeder::class];
    }

    public function test_the_specialist_note_seeder_can_run_twice(): void
    {
        $this->seed(SpecialistNoteSeeder::class);
        $this->seed(SpecialistNoteSeeder::class);

        $this->assertDatabaseCount('user_shares', 1);
        $this->assertDatabaseCount('specialist_notes', 4);
        $this->assertDatabaseCount('specialist_note_revisions', 1);
    }
}
