<?php

namespace Database\Seeders;

use App\Enums\FundingSource;
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
                'source' => FundingSource::FAMILY->value,
                'amount' => 150000,
                'assigned_at' => Carbon::parse('2026-01-15 09:00:00'),
                'note' => 'Family contribution.',
            ],
            [
                'source' => FundingSource::GRANT->value,
                'amount' => 250000,
                'assigned_at' => Carbon::parse('2026-02-20 09:00:00'),
                'note' => 'Grant decision.',
            ],
            [
                'source' => FundingSource::SAVINGS->value,
                'amount' => 50000,
                'assigned_at' => Carbon::parse('2026-03-10 09:00:00'),
                'note' => null,
            ],
        ];

        foreach ($entries as $entry) {
            $patient->walletEntries()->updateOrCreate(
                [
                    'source' => $entry['source'],
                    'assigned_at' => $entry['assigned_at'],
                ],
                [
                    'amount' => $entry['amount'],
                    'note' => $entry['note'],
                ],
            );
        }
    }
}
