<?php

namespace Database\Seeders;

use Ramsey\Uuid\Uuid;
use Pterodactyl\Models\Tenant;
use Illuminate\Database\Seeder;

class TenantSeeder extends Seeder
{
    public function run(): void
    {
        Tenant::query()->create([
            'uuid' => Uuid::uuid4()->toString(),
            'name' => 'Default Tenant',
            'description' => 'The default system tenant for resource management.',
            'memory' => null,
            'disk' => null,
            'cpu' => null,
            'servers' => null,
            'databases' => null,
            'allocations' => null,
            'backups' => null,
        ]);
    }
}
