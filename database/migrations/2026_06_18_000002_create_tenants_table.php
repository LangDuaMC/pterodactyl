<?php

use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateTenantsTable extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('tenants')) {
            Schema::create('tenants', function (Blueprint $table) {
                $table->increments('id');
                $table->char('uuid', 36)->unique();
                $table->string('name');
                $table->text('description')->nullable();
                $table->integer('memory')->unsigned()->nullable();
                $table->integer('disk')->unsigned()->nullable();
                $table->integer('cpu')->unsigned()->nullable();
                $table->integer('servers')->unsigned()->nullable();
                $table->integer('databases')->unsigned()->nullable();
                $table->integer('allocations')->unsigned()->nullable();
                $table->integer('backups')->unsigned()->nullable();
                $table->timestamps();
            });

            return;
        }

        Schema::table('tenants', function (Blueprint $table) {
            if (!Schema::hasColumn('tenants', 'uuid')) {
                $table->char('uuid', 36)->nullable()->after('id');
            }

            if (!Schema::hasColumn('tenants', 'description')) {
                $table->text('description')->nullable()->after('name');
            }

            foreach (['memory', 'disk', 'cpu', 'servers', 'databases', 'allocations', 'backups'] as $column) {
                if (!Schema::hasColumn('tenants', $column)) {
                    $table->integer($column)->unsigned()->nullable();
                }
            }
        });

        DB::table('tenants')->whereNull('uuid')->orWhere('uuid', '')->update(['uuid' => (string) Str::uuid()]);
    }

    public function down(): void
    {
        Schema::dropIfExists('tenants');
    }
}
