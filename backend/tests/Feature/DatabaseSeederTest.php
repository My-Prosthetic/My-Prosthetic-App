<?php

namespace Tests\Feature;

use Database\Seeders\DatabaseSeeder;
use Database\Seeders\IncidentSeeder;
use Database\Seeders\MedicalProfileSeeder;
use Database\Seeders\ProsthesisSeeder;
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
        $this->assertDatabaseCount('incidents', 0);
        $this->assertDatabaseCount('wallet_entries', 0);
    }

    public static function demoSeeders(): iterable
    {
        yield 'database seeder' => [DatabaseSeeder::class];
        yield 'prosthesis seeder' => [ProsthesisSeeder::class];
        yield 'incident seeder' => [IncidentSeeder::class];
        yield 'wallet entry seeder' => [WalletEntrySeeder::class];
        yield 'medical profile seeder' => [MedicalProfileSeeder::class];
    }
}
