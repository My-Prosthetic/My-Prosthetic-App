<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_shares', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('patient_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('specialist_id')->index()->constrained('users')->cascadeOnDelete();
            $table->json('permissions');
            $table->timestamps();
            $table->unique(['patient_id', 'specialist_id']);
        });

        // The schema builder has no CHECK support and SQLite cannot add one after
        // creation; there the UserShare model enforces the same rule.
        if (Schema::getConnection()->getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE user_shares ADD CONSTRAINT user_shares_distinct_participants CHECK (patient_id <> specialist_id)');
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('user_shares');
    }
};
