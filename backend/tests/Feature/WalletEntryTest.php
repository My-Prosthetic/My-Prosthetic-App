<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\WalletEntry;
use Database\Seeders\WalletEntrySeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Tests\TestCase;

class WalletEntryTest extends TestCase
{
    use RefreshDatabase;

    public function test_wallet_entry_can_be_created_for_a_patient_with_a_uuid(): void
    {
        $patient = User::factory()->create();
        $assignedAt = Carbon::parse('2026-09-01 12:00:00');

        $entry = WalletEntry::create([
            'user_id' => $patient->id,
            'source' => 'grant',
            'amount' => 125000,
            'assigned_at' => $assignedAt,
            'note' => 'Decision for the new prosthesis.',
        ]);

        $this->assertTrue(Str::isUuid($entry->id));
        $this->assertFalse($entry->incrementing);
        $this->assertSame(125000, $entry->amount);
        $this->assertInstanceOf(Carbon::class, $entry->assigned_at);
        $this->assertSame($patient->getKey(), $entry->patient()->firstOrFail()->getKey());
        $this->assertDatabaseHas('wallet_entries', [
            'id' => $entry->id,
            'user_id' => $patient->id,
            'amount' => 125000,
        ]);
    }

    public function test_wallet_entry_ignores_attributes_outside_the_fillable_list(): void
    {
        $patient = User::factory()->create();
        $entry = WalletEntry::create([
            'user_id' => $patient->id,
            'source' => 'savings',
            'amount' => 5000,
            'assigned_at' => Carbon::now(),
            'unexpected' => 'should not be persisted',
        ]);

        $this->assertArrayNotHasKey('unexpected', $entry->getAttributes());
        $this->assertDatabaseMissing('wallet_entries', [
            'unexpected' => 'should not be persisted',
        ]);
    }

    public function test_factory_creates_wallet_entry_with_valid_test_data(): void
    {
        $entry = WalletEntry::factory()->create();

        $this->assertContains($entry->source, [
            'family',
            'fundraiser',
            'grant',
            'savings',
            'other',
        ]);
        $this->assertGreaterThan(0, $entry->amount);
        $this->assertNotNull($entry->patient);
    }

    public function test_deleting_a_patient_deletes_their_wallet_entries(): void
    {
        $patient = User::factory()->create();
        WalletEntry::factory()->count(2)->for($patient, 'patient')->create();

        $this->assertDatabaseCount('wallet_entries', 2);

        $patient->delete();

        $this->assertDatabaseCount('wallet_entries', 0);
    }

    public function test_wallet_entry_seeder_creates_sample_data(): void
    {
        $this->seed(WalletEntrySeeder::class);

        $this->assertDatabaseCount('wallet_entries', 3);
        $this->assertDatabaseHas('users', [
            'email' => 'wallet.patient@example.com',
            'role' => 'patient',
        ]);
    }
}
