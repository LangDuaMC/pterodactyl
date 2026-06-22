<?php

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class AddTagsToEggsTable extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('eggs', 'tags')) {
            return;
        }

        Schema::table('eggs', function (Blueprint $table) {
            $table->json('tags')->nullable()->after('description');
        });

        DB::table('eggs')
            ->join('nests', 'nests.id', '=', 'eggs.nest_id')
            ->update(['eggs.tags' => DB::raw('JSON_ARRAY(nests.name)')]);
    }

    public function down(): void
    {
        Schema::table('eggs', function (Blueprint $table) {
            $table->dropColumn('tags');
        });
    }
}
