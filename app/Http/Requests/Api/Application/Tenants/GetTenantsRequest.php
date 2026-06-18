<?php

namespace Pterodactyl\Http\Requests\Api\Application\Tenants;

use Pterodactyl\Services\Acl\Api\AdminAcl;
use Pterodactyl\Http\Requests\Api\Application\ApplicationApiRequest;

class GetTenantsRequest extends ApplicationApiRequest
{
    protected ?string $resource = AdminAcl::RESOURCE_TENANTS;

    protected int $permission = AdminAcl::READ;
}
