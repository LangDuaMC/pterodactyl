<?php

namespace Pterodactyl\Policies;

use Pterodactyl\Models\User;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\Permission;
use Pterodactyl\Models\Tenant;

class ServerPolicy
{
    /**
     * Checks if the user has the given permission on/for the server.
     */
    protected function checkPermission(User $user, Server $server, string $permission): bool
    {
        $subuser = $server->subusers->where('user_id', $user->id)->first();
        if (!$subuser || empty($permission)) {
            return false;
        }

        return in_array($permission, $subuser->permissions);
    }

    /**
     * Runs before any of the functions are called. Used to determine if user is root admin, if so, ignore permissions.
     */
    public function before(User $user, string $ability, Server $server): bool
    {
        if ($user->root_admin || $server->owner_id === $user->id) {
            return true;
        }

        if ($user->hasTenantPermission($server->tenant_id, $this->tenantPermissionFor($ability))) {
            return true;
        }

        return $this->checkPermission($user, $server, $ability);
    }

    protected function tenantPermissionFor(string $ability): string
    {
        if (in_array($ability, [
            Permission::ACTION_WEBSOCKET_CONNECT,
            Permission::ACTION_ACTIVITY_READ,
            Permission::ACTION_ALLOCATION_READ,
            Permission::ACTION_BACKUP_READ,
            Permission::ACTION_DATABASE_READ,
            Permission::ACTION_FILE_READ,
            Permission::ACTION_FILE_READ_CONTENT,
            Permission::ACTION_SCHEDULE_READ,
            Permission::ACTION_STARTUP_READ,
        ], true)) {
            return Tenant::PERMISSION_SERVERS_READ;
        }

        return str_starts_with($ability, 'user.')
            ? Tenant::PERMISSION_MEMBERS_MANAGE
            : Tenant::PERMISSION_SERVERS_MANAGE;
    }

    /**
     * This is a horrendous hack to avoid Laravel's "smart" behavior that does
     * not call the before() function if there isn't a function matching the
     * policy permission.
     */
    public function __call(string $name, mixed $arguments)
    {
        // do nothing
    }
}
