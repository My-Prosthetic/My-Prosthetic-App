<?php

use App\Enums\LimbType;
use App\Enums\ProsthesisSide;
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
        Schema::create('measurements', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->enum('side', ProsthesisSide::values());
            $table->enum('limb_type', LimbType::values());
            $table->dateTime('measured_at');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['user_id', 'side', 'limb_type', 'measured_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('measurements');
    }
};
