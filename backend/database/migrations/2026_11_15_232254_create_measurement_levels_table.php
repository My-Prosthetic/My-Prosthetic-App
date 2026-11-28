<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('measurement_levels', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('measurement_id')->constrained()->cascadeOnDelete();
            $table->smallInteger('level');
            $table->smallInteger('distance_cm');
            $table->text('circumference_cm');
            $table->timestamps();

            $table->unique(['measurement_id', 'level']);
            $table->unique(['measurement_id', 'distance_cm']);
        });

        if (Schema::getConnection()->getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE measurement_levels ADD CONSTRAINT measurement_levels_level_check CHECK (level BETWEEN 1 AND 5)');
            DB::statement('ALTER TABLE measurement_levels ADD CONSTRAINT measurement_levels_distance_cm_check CHECK (distance_cm > 0)');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('measurement_levels');
    }
};
