<?php

namespace Pterodactyl\Http\Requests\Api\Application\Tenants;

use Pterodactyl\Models\Tenant;
use Pterodactyl\Services\Acl\Api\AdminAcl;
use Pterodactyl\Http\Requests\Api\Application\ApplicationApiRequest;

class UpdateTenantRequest extends ApplicationApiRequest
{
    protected ?string $resource = AdminAcl::RESOURCE_TENANTS;

    protected int $permission = AdminAcl::WRITE;

    public function rules(): array
    {
        $rules = Tenant::getRulesForUpdate($this->route()->parameter('tenant'));

        return collect($rules)->only([
            'name',
            'description',
            'memory',
            'disk',
            'cpu',
            'servers',
            'databases',
            'allocations',
            'backups',
        ])->toArray();
    }

    public function attributes(): array
    {
        return [
            'name' => 'Tenant Name',
            'description' => 'Tenant Description',
            'memory' => 'Memory Quota',
            'disk' => 'Disk Quota',
            'cpu' => 'CPU Quota',
            'servers' => 'Server Count Quota',
            'databases' => 'Database Quota',
            'allocations' => 'Allocation Quota',
            'backups' => 'Backup Quota',
        ];
    }
}
