<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class AddDaemonSftpAliasToNodesTable extends Migration
{
    public function up(): void
    {
        Schema::table('nodes', function (Blueprint $table) {
            $table->string('daemon_sftp_alias')->nullable()->after('daemonSFTP');
        });
    }

    public function down(): void
    {
        Schema::table('nodes', function (Blueprint $table) {
            $table->dropColumn('daemon_sftp_alias');
        });
    }
}
