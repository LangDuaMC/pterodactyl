<?php

namespace Pterodactyl\Services\Tenants;

use Pterodactyl\Models\Tenant;
use Pterodactyl\Exceptions\DisplayException;

class TenantDeletionService
{
    public function handle(Tenant|int $tenant): ?bool
    {
        $tenant = $tenant instanceof Tenant ? $tenant : Tenant::query()->findOrFail($tenant);

        if (Tenant::supportsServerAssignments() && $tenant->servers()->count() > 0) {
            throw new DisplayException('Cannot delete a tenant with active servers. Remove or reassign the servers first.');
        }

        $tenant->users()->detach();

        return $tenant->delete();
    }
}
