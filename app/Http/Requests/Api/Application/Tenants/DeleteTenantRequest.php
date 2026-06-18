<?php

namespace Pterodactyl\Http\Requests\Api\Application\Tenants;

use Pterodactyl\Services\Acl\Api\AdminAcl;
use Pterodactyl\Http\Requests\Api\Application\ApplicationApiRequest;

class DeleteTenantRequest extends ApplicationApiRequest
{
    protected ?string $resource = AdminAcl::RESOURCE_TENANTS;

    protected int $permission = AdminAcl::WRITE;
}
