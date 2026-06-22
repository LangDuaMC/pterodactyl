<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('servers', function (Blueprint $table) {
            $table->dropForeign(['allocation_id']);
            $table->dropUnique(['allocation_id']);

            $table->unsignedInteger('allocation_id')->nullable()->change();

            $table->foreign('allocation_id')->references('id')->on('allocations')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('servers', function (Blueprint $table) {
            $table->dropForeign(['allocation_id']);

            $table->unsignedInteger('allocation_id')->nullable(false)->change();

            $table->foreign('allocation_id')->references('id')->on('allocations');
            $table->unique(['allocation_id']);
        });
    }
};
