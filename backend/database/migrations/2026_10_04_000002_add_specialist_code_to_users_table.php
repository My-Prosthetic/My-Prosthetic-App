<?php

use App\Support\SpecialistCode;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->string('specialist_code', 8)->nullable()->unique();
        });

        DB::table('users')
            ->where('role', 'prosthetist')
            ->whereNull('specialist_code')
            ->select('id')
            ->chunkById(500, function ($users): void {
                foreach ($users as $user) {
                    $code = SpecialistCode::generate(
                        fn (string $code): bool => DB::table('users')->where('specialist_code', $code)->exists(),
                    );

                    DB::table('users')->where('id', $user->id)->update(['specialist_code' => $code]);
                }
            });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropUnique(['specialist_code']);
            $table->dropColumn('specialist_code');
        });
    }
};
