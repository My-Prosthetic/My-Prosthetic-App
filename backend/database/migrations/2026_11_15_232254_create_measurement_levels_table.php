<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
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
            $table->unsignedSmallInteger('level');
            $table->unsignedSmallInteger('distance_cm');
            $table->text('circumference_cm');
            $table->timestamps();

            $table->unique(['measurement_id', 'level']);
            $table->unique(['measurement_id', 'distance_cm']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('measurement_levels');
    }
};
