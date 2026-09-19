<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\WalletEntry;
use Illuminate\Database\Seeder;

class WalletEntrySeeder extends Seeder
{
    /**
     * Seed wallet entries for a sample patient.
     */
    public function run(): void
    {
        $patient = User::factory()->create([
            'name' => 'Wallet Test Patient',
            'email' => 'wallet.patient@example.com',
        ]);

        WalletEntry::factory()
            ->count(3)
            ->for($patient, 'patient')
            ->create();
    }
}
