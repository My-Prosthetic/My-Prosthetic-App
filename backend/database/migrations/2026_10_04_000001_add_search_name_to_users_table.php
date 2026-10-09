<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        // Transliteration can lengthen a name, so the column is not limited to 255 characters.
        Schema::table('users', function (Blueprint $table): void {
            $table->text('search_name')->nullable();
        });

        DB::table('users')->select(['id', 'name'])->chunkById(500, function ($users): void {
            foreach ($users as $user) {
                DB::table('users')
                    ->where('id', $user->id)
                    ->update(['search_name' => Str::lower(Str::transliterate($user->name))]);
            }
        });

        Schema::table('users', function (Blueprint $table): void {
            $table->text('search_name')->nullable(false)->change();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn('search_name');
        });
    }
};
