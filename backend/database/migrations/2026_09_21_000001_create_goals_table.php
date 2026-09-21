<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('goals', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->timestamps();
        });

        DB::table('wallet_entries')
            ->select('goal_id')
            ->distinct()
            ->get()
            ->each(function (object $walletEntry): void {
                $now = now();

                DB::table('goals')->insertOrIgnore([
                    'id' => $walletEntry->goal_id,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            });
    }

    public function down(): void
    {
        Schema::dropIfExists('goals');
    }
};
