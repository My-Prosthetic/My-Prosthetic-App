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
        Schema::create('specialist_note_revisions', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('specialist_note_id')->index()->constrained()->cascadeOnDelete();
            $table->text('content');
            $table->timestamp('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('specialist_note_revisions');
    }
};
