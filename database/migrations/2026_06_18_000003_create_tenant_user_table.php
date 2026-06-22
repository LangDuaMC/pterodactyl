<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateTenantUserTable extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('tenant_user')) {
            Schema::create('tenant_user', function (Blueprint $table) {
                $table->increments('id');
                $table->unsignedInteger('tenant_id');
                $table->unsignedInteger('user_id');
                $table->string('role')->default('member');
                $table->timestamps();

                $table->unique(['tenant_id', 'user_id']);
                $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
                $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            });

            return;
        }

        Schema::table('tenant_user', function (Blueprint $table) {
            if (!Schema::hasColumn('tenant_user', 'tenant_id')) {
                $table->unsignedInteger('tenant_id');
            }

            if (!Schema::hasColumn('tenant_user', 'user_id')) {
                $table->unsignedInteger('user_id');
            }

            if (!Schema::hasColumn('tenant_user', 'role')) {
                $table->string('role')->default('member');
            }

            if (!Schema::hasColumn('tenant_user', 'created_at')) {
                $table->timestamps();
            }
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenant_user');
    }
}
