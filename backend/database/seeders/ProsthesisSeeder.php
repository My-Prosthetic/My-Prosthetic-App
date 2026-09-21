<?php

namespace Database\Seeders;

use App\Enums\ComponentType;
use App\Enums\UserRole;
use App\Models\Component;
use App\Models\Prosthesis;
use App\Models\User;
use Illuminate\Database\Seeder;

class ProsthesisSeeder extends Seeder
{
    public function run(): void
    {
        $patient = User::query()->firstOrCreate(
            ['email' => 'prosthesis.patient@example.com'],
            [
                'name' => 'Prosthesis Patient',
                'password' => 'password',
                'role' => UserRole::PATIENT,
                'email_verified_at' => now(),
            ],
        );

        $prosthesis = Prosthesis::query()->updateOrCreate(
            [
                'user_id' => $patient->id,
                'name' => 'Demo lower-limb prosthesis',
            ],
            [
                'side' => 'left',
                'limb_type' => 'lower',
                'amputation_level' => 'transtibial',
                'replacement_at' => '2030-01-15 00:00:00',
            ],
        );

        foreach ([
            [
                'name' => 'Demo final socket',
                'type' => ComponentType::SOCKET,
                'manufacturer' => 'Demo Prosthetics',
                'model' => 'Socket 2000',
                'serial_number' => 'DEMO-SOCKET-001',
                'is_test_socket' => false,
                'installed_at' => '2026-09-01 00:00:00',
                'replacement_at' => '2030-01-15 00:00:00',
                'warranty_until' => '2028-09-01 00:00:00',
            ],
            [
                'name' => 'Demo liner',
                'type' => ComponentType::LINER,
                'manufacturer' => 'Demo Prosthetics',
                'model' => 'Liner 1000',
                'serial_number' => 'DEMO-LINER-001',
                'is_test_socket' => null,
                'installed_at' => '2026-09-01 00:00:00',
                'replacement_at' => '2027-09-01 00:00:00',
                'warranty_until' => '2027-09-01 00:00:00',
            ],
            [
                'name' => 'Demo prosthetic foot',
                'type' => ComponentType::FOOT,
                'manufacturer' => 'Demo Prosthetics',
                'model' => 'Foot 3000',
                'serial_number' => 'DEMO-FOOT-001',
                'is_test_socket' => null,
                'installed_at' => '2026-09-01 00:00:00',
                'replacement_at' => '2030-01-15 00:00:00',
                'warranty_until' => '2028-09-01 00:00:00',
            ],
        ] as $component) {
            Component::query()->updateOrCreate(
                [
                    'prosthesis_id' => $prosthesis->id,
                    'name' => $component['name'],
                ],
                $component,
            );
        }
    }
}
