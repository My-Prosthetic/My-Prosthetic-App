<?php

namespace Tests\Feature;

use App\Enums\FundingSource;
use App\Models\User;
use App\Models\WalletEntry;
use Database\Seeders\DatabaseSeeder;
use Database\Seeders\WalletEntrySeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Tests\TestCase;

class WalletEntryTest extends TestCase
{
    use RefreshDatabase;

    public function test_patient_can_create_a_wallet_entry_through_the_mobile_api(): void
    {
        $patient = User::factory()->create();
        $assignedAt = Carbon::parse('2026-09-01 12:00:00');
        $token = $patient->createToken('wallet-entry-test')->plainTextToken;

        $response = $this->withToken($token)->postJson('/api/wallet-entries', [
            'source' => FundingSource::GRANT->value,
            'amount' => 125000,
            'date' => $assignedAt->toISOString(),
            'note' => 'Decision for the new prosthesis.',
        ]);

        $response
            ->assertCreated()
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'source',
                    'amount',
                    'date',
                    'note',
                    'created_at',
                    'updated_at',
                ],
            ])
            ->assertJsonPath('data.source', FundingSource::GRANT->value)
            ->assertJsonPath('data.amount', 125000)
            ->assertJsonPath('data.note', 'Decision for the new prosthesis.');

        $this->assertDatabaseHas('wallet_entries', [
            'user_id' => $patient->id,
            'source' => FundingSource::GRANT->value,
            'amount' => 125000,
            'assigned_at' => $assignedAt->format('Y-m-d H:i:s'),
            'note' => 'Decision for the new prosthesis.',
        ]);
    }

    public function test_patient_can_list_only_their_wallet_entries_through_the_mobile_api(): void
    {
        $patient = User::factory()->create();
        $otherPatient = User::factory()->create();
        $entry = WalletEntry::factory()->for($patient, 'patient')->create();
        WalletEntry::factory()->for($otherPatient, 'patient')->create();
        $token = $patient->createToken('wallet-entry-list-test')->plainTextToken;

        $this->withToken($token)
            ->getJson('/api/wallet-entries')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $entry->id);
    }

    public function test_wallet_entry_api_requires_valid_mobile_fields(): void
    {
        $patient = User::factory()->create();
        $token = $patient->createToken('wallet-entry-validation-test')->plainTextToken;

        $this->withToken($token)
            ->postJson('/api/wallet-entries', [
                'source' => 'unsupported',
                'amount' => 0,
                'date' => 'not-a-date',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['source', 'amount', 'date']);
    }

    public function test_wallet_entry_api_requires_authentication(): void
    {
        $this->getJson('/api/wallet-entries')->assertUnauthorized();
        $this->postJson('/api/wallet-entries')->assertUnauthorized();
    }

    public function test_non_patient_users_cannot_access_wallet_entries(): void
    {
        $specialist = User::factory()->prosthetist()->create();
        $token = $specialist->createToken('wallet-entry-specialist-test')->plainTextToken;

        $this->withToken($token)
            ->getJson('/api/wallet-entries')
            ->assertForbidden();

        $this->withToken($token)
            ->postJson('/api/wallet-entries', [
                'source' => FundingSource::GRANT->value,
                'amount' => 125000,
                'date' => '2026-09-01T12:00:00Z',
            ])
            ->assertForbidden();
    }

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

        $this->assertInstanceOf(FundingSource::class, $entry->source);
        $this->assertContains($entry->source->value, FundingSource::values());
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
        $this->seed(WalletEntrySeeder::class);

        $this->assertDatabaseCount('wallet_entries', 3);
        $this->assertDatabaseHas('users', [
            'email' => 'wallet.patient@example.com',
            'role' => 'patient',
        ]);
    }

    public function test_database_seeder_can_be_run_repeatedly(): void
    {
        $this->seed(DatabaseSeeder::class);
        $this->seed(DatabaseSeeder::class);

        $this->assertDatabaseCount('users', 2);
        $this->assertDatabaseCount('wallet_entries', 3);
    }
}
