<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('wallet_entries', function (Blueprint $table): void {
            $table->foreign('goal_id')
                ->references('id')
                ->on('goals');
        });
    }

    public function down(): void
    {
        Schema::table('wallet_entries', function (Blueprint $table): void {
            $table->dropForeign(['goal_id']);
        });
    }
};
