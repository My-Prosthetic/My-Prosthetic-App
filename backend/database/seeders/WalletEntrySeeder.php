<?php

namespace Database\Seeders;

use App\Enums\FundingSource;
use App\Models\Goal;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class WalletEntrySeeder extends Seeder
{
    /**
     * Seed wallet entries for a sample patient.
     */
    public function run(): void
    {
        $patient = User::query()->firstWhere('email', 'wallet.patient@example.com');

        if ($patient === null) {
            $patient = User::factory()->create([
                'name' => 'Wallet Test Patient',
                'email' => 'wallet.patient@example.com',
            ]);
        }

        $entries = [
            [
                'goal_id' => '11111111-1111-4111-8111-111111111111',
                'source' => FundingSource::FAMILY->value,
                'amount' => 150000,
                'assigned_at' => Carbon::parse('2026-01-15 09:00:00'),
                'note' => 'Family contribution.',
            ],
            [
                'goal_id' => '22222222-2222-4222-8222-222222222222',
                'source' => FundingSource::GRANT->value,
                'amount' => 250000,
                'assigned_at' => Carbon::parse('2026-02-20 09:00:00'),
                'note' => 'Grant decision.',
            ],
            [
                'goal_id' => '33333333-3333-4333-8333-333333333333',
                'source' => FundingSource::SAVINGS->value,
                'amount' => 50000,
                'assigned_at' => Carbon::parse('2026-03-10 09:00:00'),
                'note' => null,
            ],
        ];

        foreach ($entries as $entry) {
            Goal::query()->firstOrCreate([
                'id' => $entry['goal_id'],
            ]);

            $patient->walletEntries()->updateOrCreate(
                [
                    'source' => $entry['source'],
                    'assigned_at' => $entry['assigned_at'],
                ],
                [
                    'goal_id' => $entry['goal_id'],
                    'amount' => $entry['amount'],
                    'note' => $entry['note'],
                ],
            );
        }
    }
}
