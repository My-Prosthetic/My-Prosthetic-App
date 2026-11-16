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
        Schema::create('incidents', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('prosthesis_id')->index()->constrained('prostheses')->cascadeOnDelete();
            $table->foreignUuid('component_id')->nullable()->index()->constrained('components')->nullOnDelete();
            $table->text('type');
            $table->text('activity')->nullable();
            $table->text('intensity')->nullable();
            $table->text('description')->nullable();
            $table->text('pain_point')->nullable();
            $table->dateTime('occurred_at')->index();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('incidents');
    }
};
