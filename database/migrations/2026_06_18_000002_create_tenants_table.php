<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateTenantsTable extends Migration
{
    public function up(): void
    {
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
    }

    public function down(): void
    {
        Schema::dropIfExists('tenants');
    }
}
