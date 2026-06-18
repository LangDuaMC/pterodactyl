<?php

namespace Pterodactyl\Services\Tenants;

use Ramsey\Uuid\Uuid;
use Pterodactyl\Models\Tenant;
use Illuminate\Database\DatabaseManager;

class TenantCreationService
{
    public function __construct(
        protected DatabaseManager $database,
    ) {
    }

    public function handle(array $data): Tenant
    {
        return $this->database->transaction(function () use ($data) {
            return Tenant::query()->create([
                'uuid' => Uuid::uuid4()->toString(),
                'name' => $data['name'],
                'description' => $data['description'] ?? null,
                'memory' => $data['memory'] ?? null,
                'disk' => $data['disk'] ?? null,
                'cpu' => $data['cpu'] ?? null,
                'servers' => $data['servers'] ?? null,
                'databases' => $data['databases'] ?? null,
                'allocations' => $data['allocations'] ?? null,
                'backups' => $data['backups'] ?? null,
            ]);
        });
    }
}
