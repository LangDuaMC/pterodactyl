<?php

namespace Pterodactyl\Models;

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;

/**
 * @property int $id
 * @property string $uuid
 * @property string $name
 * @property string|null $description
 * @property int|null $memory
 * @property int|null $disk
 * @property int|null $cpu
 * @property int|null $servers
 * @property int|null $databases
 * @property int|null $allocations
 * @property int|null $backups
 */
class Tenant extends Model
{
    /** @use HasFactory<\Database\Factories\TenantFactory> */
    use HasFactory;

    public const ROLE_OWNER = 'owner';
    public const ROLE_ADMIN = 'admin';
    public const ROLE_MEMBER = 'member';

    public const PERMISSION_SERVERS_READ = 'servers.read';
    public const PERMISSION_SERVERS_MANAGE = 'servers.manage';
    public const PERMISSION_MEMBERS_MANAGE = 'members.manage';

    public const ROLE_PERMISSIONS = [
        self::ROLE_OWNER => [
            self::PERMISSION_SERVERS_READ,
            self::PERMISSION_SERVERS_MANAGE,
            self::PERMISSION_MEMBERS_MANAGE,
        ],
        self::ROLE_ADMIN => [
            self::PERMISSION_SERVERS_READ,
            self::PERMISSION_SERVERS_MANAGE,
        ],
        self::ROLE_MEMBER => [
            self::PERMISSION_SERVERS_READ,
        ],
    ];

    protected $table = 'tenants';

    protected $guarded = ['id', self::CREATED_AT, self::UPDATED_AT];

    protected $casts = [
        'memory' => 'integer',
        'disk' => 'integer',
        'cpu' => 'integer',
        'servers' => 'integer',
        'databases' => 'integer',
        'allocations' => 'integer',
        'backups' => 'integer',
    ];

    public static array $validationRules = [
        'uuid' => 'required|string|size:36|unique:tenants,uuid',
        'name' => 'required|string|min:1|max:191',
        'description' => 'nullable|string',
        'memory' => 'nullable|integer|min:0',
        'disk' => 'nullable|integer|min:0',
        'cpu' => 'nullable|integer|min:0',
        'servers' => 'nullable|integer|min:0',
        'databases' => 'nullable|integer|min:0',
        'allocations' => 'nullable|integer|min:0',
        'backups' => 'nullable|integer|min:0',
    ];

    /**
     * @return \Illuminate\Database\Eloquent\Relations\HasMany<\Pterodactyl\Models\Server, $this>
     */
    public function servers(): HasMany
    {
        if (!self::supportsServerAssignments()) {
            return $this->hasMany(Server::class, 'id', 'id')->whereRaw('1 = 0');
        }

        return $this->hasMany(Server::class);
    }

    /**
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany<\Pterodactyl\Models\User, $this>
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class)->withPivot('role')->withTimestamps();
    }

    public static function roleHasPermission(?string $role, string $permission): bool
    {
        if (empty($role)) {
            return false;
        }

        return in_array($permission, self::ROLE_PERMISSIONS[$role] ?? [], true);
    }

    public static function supportsServerAssignments(): bool
    {
        return Schema::hasColumn('servers', 'tenant_id');
    }
}
