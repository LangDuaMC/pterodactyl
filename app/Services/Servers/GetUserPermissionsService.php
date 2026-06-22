<?php

namespace Pterodactyl\Services\Servers;

use Pterodactyl\Models\User;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\Permission;
use Pterodactyl\Models\Tenant;

class GetUserPermissionsService
{
    /**
     * Returns the server specific permissions that a user has. This checks
     * if they are an admin or a subuser for the server. If no permissions are
     * found, an empty array is returned.
     */
    public function handle(Server $server, User $user): array
    {
        if ($user->root_admin || $user->id === $server->owner_id) {
            $permissions = ['*'];

            if ($user->root_admin) {
                $permissions[] = 'admin.websocket.errors';
                $permissions[] = 'admin.websocket.install';
                $permissions[] = 'admin.websocket.transfer';
            }

            return $permissions;
        }

        if ($user->hasTenantPermission($server->tenant_id, Tenant::PERMISSION_SERVERS_MANAGE)) {
            return ['*'];
        }

        if ($user->hasTenantPermission($server->tenant_id, Tenant::PERMISSION_SERVERS_READ)) {
            return [
                Permission::ACTION_WEBSOCKET_CONNECT,
                Permission::ACTION_ACTIVITY_READ,
                Permission::ACTION_ALLOCATION_READ,
                Permission::ACTION_BACKUP_READ,
                Permission::ACTION_DATABASE_READ,
                Permission::ACTION_FILE_READ,
                Permission::ACTION_FILE_READ_CONTENT,
                Permission::ACTION_SCHEDULE_READ,
                Permission::ACTION_STARTUP_READ,
            ];
        }

        /** @var \Pterodactyl\Models\Subuser|null $subuserPermissions */
        $subuserPermissions = $server->subusers()->where('user_id', $user->id)->first();

        return $subuserPermissions ? $subuserPermissions->permissions : [];
    }
}
