<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('components', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('prosthesis_id')->constrained('prostheses')->cascadeOnDelete();
            $table->string('type');
            $table->string('name')->nullable();
            $table->string('manufacturer')->nullable();
            $table->string('model')->nullable();
            $table->string('serial_number')->nullable();
            $table->boolean('is_test_socket')->nullable();
            $table->dateTime('installed_at');
            $table->dateTime('replacement_at')->nullable();
            $table->dateTime('warranty_until')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('components');
    }
};
