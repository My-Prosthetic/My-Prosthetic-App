<?php

namespace Database\Seeders;

use App\Enums\SocketView;
use App\Models\User;
use App\ValueObjects\PainPoint;
use Illuminate\Database\Seeder;

class IncidentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->call(ProsthesisSeeder::class);

        $patient = User::query()->where('email', 'prosthesis.patient@example.com')->firstOrFail();
        $prosthesis = $patient->prostheses()->where('name', 'Demo lower-limb prosthesis')->firstOrFail();

        if ($prosthesis->incidents()->exists()) {
            return;
        }

        $socket = $prosthesis->components()->where('name', 'Demo final socket')->firstOrFail();
        $foot = $prosthesis->components()->where('name', 'Demo prosthetic foot')->firstOrFail();

        $socketPain = $prosthesis->incidents()->make([
            'type' => 'pain',
            'activity' => 'walking',
            'intensity' => 6,
            'description' => 'Pressure on the inner side of the socket after a long walk.',
            'pain_point' => new PainPoint(0.35, 0.7, SocketView::SIDE),
            'occurred_at' => '2026-10-05 18:20:00',
        ]);
        $socketPain->component()->associate($socket);
        $socketPain->save();

        $prosthesis->incidents()->create([
            'type' => 'phantom_pain',
            'activity' => 'sitting',
            'intensity' => 4,
            'description' => 'Burning sensation in the missing foot in the evening.',
            'occurred_at' => '2026-10-12 21:00:00',
        ]);

        $footFailure = $prosthesis->incidents()->make([
            'type' => 'mechanical_failure',
            'activity' => 'walking',
            'description' => 'The heel stopped absorbing impact and the foot clicks on every step.',
            'occurred_at' => '2026-10-20 09:15:00',
        ]);
        $footFailure->component()->associate($foot);
        $footFailure->save();
    }
}
