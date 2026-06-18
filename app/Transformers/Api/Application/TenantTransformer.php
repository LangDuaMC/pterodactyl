<?php

namespace Pterodactyl\Transformers\Api\Application;

use Pterodactyl\Models\Tenant;

class TenantTransformer extends BaseTransformer
{
    public function getResourceName(): string
    {
        return 'tenant';
    }

    public function transform(Tenant $tenant): array
    {
        return [
            'id' => $tenant->id,
            'uuid' => $tenant->uuid,
            'name' => $tenant->name,
            'description' => $tenant->description,
            'memory' => $tenant->memory,
            'disk' => $tenant->disk,
            'cpu' => $tenant->cpu,
            'servers' => $tenant->servers,
            'databases' => $tenant->databases,
            'allocations' => $tenant->allocations,
            'backups' => $tenant->backups,
            $tenant->getUpdatedAtColumn() => $this->formatTimestamp($tenant->updated_at),
            $tenant->getCreatedAtColumn() => $this->formatTimestamp($tenant->created_at),
        ];
    }
}
