<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class AddTenantIdToServersTable extends Migration
{
    public function up(): void
    {
        Schema::table('servers', function (Blueprint $table) {
            $table->unsignedInteger('tenant_id')->nullable()->after('external_id');
            $table->foreign('tenant_id')->references('id')->on('tenants')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('servers', function (Blueprint $table) {
            $table->dropForeign(['tenant_id']);
            $table->dropColumn('tenant_id');
        });
    }
}
