<?php

namespace Pterodactyl\Services\Tenants;

use Pterodactyl\Models\Tenant;

class TenantUpdateService
{
    public function handle(Tenant|int $tenant, array $data): Tenant
    {
        $tenant = $tenant instanceof Tenant ? $tenant : Tenant::query()->findOrFail($tenant);

        $tenant->update([
            'name' => $data['name'] ?? $tenant->name,
            'description' => array_key_exists('description', $data) ? $data['description'] : $tenant->description,
            'memory' => array_key_exists('memory', $data) ? $data['memory'] : $tenant->memory,
            'disk' => array_key_exists('disk', $data) ? $data['disk'] : $tenant->disk,
            'cpu' => array_key_exists('cpu', $data) ? $data['cpu'] : $tenant->cpu,
            'servers' => array_key_exists('servers', $data) ? $data['servers'] : $tenant->servers,
            'databases' => array_key_exists('databases', $data) ? $data['databases'] : $tenant->databases,
            'allocations' => array_key_exists('allocations', $data) ? $data['allocations'] : $tenant->allocations,
            'backups' => array_key_exists('backups', $data) ? $data['backups'] : $tenant->backups,
        ]);

        return $tenant->refresh();
    }
}
