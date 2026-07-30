<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Throwable;

class HealthController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $databaseHealthy = $this->checkDatabase();

        return response()->json([
            'status' => $databaseHealthy ? 'ok' : 'error',
            'checks' => [
                'database' => $databaseHealthy ? 'ok' : 'unavailable',
            ],
            'timestamp' => now()->toIso8601String(),
        ], $databaseHealthy ? 200 : 503);
    }

    private function checkDatabase(): bool
    {
        try {
            DB::connection()->select('SELECT 1');

            return true;
        } catch (Throwable) {
            return false;
        }
    }
}
