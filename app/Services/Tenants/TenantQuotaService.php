<?php

namespace Pterodactyl\Services\Tenants;

use Illuminate\Support\Arr;
use Pterodactyl\Models\Tenant;
use Pterodactyl\Models\Server;
use Pterodactyl\Exceptions\DisplayException;

class TenantQuotaService
{
    /**
     * @throws \Pterodactyl\Exceptions\DisplayException
     */
    public function assertWithinQuota(?int $tenantId, array $data, ?Server $excluding = null): void
    {
        if (is_null($tenantId) || !Tenant::supportsServerAssignments()) {
            return;
        }

        /** @var Tenant $tenant */
        $tenant = Tenant::query()->whereKey($tenantId)->lockForUpdate()->firstOrFail();

        $query = $tenant->servers();
        if ($excluding instanceof Server) {
            $query->whereKeyNot($excluding->id);
        }

        $current = [
            'servers' => $query->count(),
            'memory' => (int) (clone $query)->sum('memory'),
            'disk' => (int) (clone $query)->sum('disk'),
            'cpu' => (int) (clone $query)->sum('cpu'),
            'databases' => (int) (clone $query)->sum('database_limit'),
            'allocations' => (int) (clone $query)->sum('allocation_limit'),
            'backups' => (int) (clone $query)->sum('backup_limit'),
        ];

        $requested = [
            'servers' => 1,
            'memory' => $this->resourceValue('memory', Arr::get($data, 'memory'), true),
            'disk' => $this->resourceValue('disk', Arr::get($data, 'disk'), true),
            'cpu' => $this->resourceValue('cpu', Arr::get($data, 'cpu'), true),
            'databases' => $this->resourceValue('databases', Arr::get($data, 'database_limit'), false),
            'allocations' => $this->resourceValue('allocations', Arr::get($data, 'allocation_limit'), false),
            'backups' => $this->resourceValue('backups', Arr::get($data, 'backup_limit'), false),
        ];

        foreach ($requested as $resource => $value) {
            $limit = $tenant->getAttribute($resource);
            if (is_null($limit)) {
                continue;
            }

            if (is_null($value)) {
                throw new DisplayException("The tenant has a finite {$resource} quota, but this server requests unlimited {$resource}.");
            }

            if (($current[$resource] + $value) > $limit) {
                throw new DisplayException("This server would exceed the tenant {$resource} quota.");
            }
        }
    }

    private function resourceValue(string $resource, mixed $value, bool $zeroIsUnlimited): ?int
    {
        if (is_null($value) || ($zeroIsUnlimited && (int) $value === 0)) {
            return null;
        }

        return (int) $value;
    }
}
