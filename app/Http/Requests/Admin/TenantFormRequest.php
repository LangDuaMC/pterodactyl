<?php

namespace Pterodactyl\Http\Requests\Admin;

use Pterodactyl\Models\Tenant;

class TenantFormRequest extends AdminFormRequest
{
    public function rules(): array
    {
        if ($this->method() === 'PATCH') {
            return Tenant::getRulesForUpdate($this->route()->parameter('tenant'));
        }

        return collect(Tenant::getRules())->except('uuid')->toArray();
    }

    public function attributes(): array
    {
        return [
            'name' => 'Tenant Name',
            'description' => 'Description',
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
