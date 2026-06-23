<?php

namespace Pterodactyl\Http\Controllers\Api\Client;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\Permission;
use Pterodactyl\Models\Tenant;
use Pterodactyl\Models\User;
use Spatie\QueryBuilder\QueryBuilder;
use Spatie\QueryBuilder\AllowedFilter;
use Pterodactyl\Models\Filters\MultiFieldServerFilter;
use Pterodactyl\Transformers\Api\Client\ServerTransformer;
use Pterodactyl\Http\Requests\Api\Client\GetServersRequest;

class ClientController extends ClientApiController
{
    /**
     * ClientController constructor.
     */
    public function __construct()
    {
        parent::__construct();
    }

    /**
     * Return all the servers available to the client making the API
     * request, including servers the user has access to as a subuser.
     */
    public function index(GetServersRequest $request): array
    {
        $transformer = $this->getTransformer(ServerTransformer::class);
        $builder = $this->buildServerQuery($request, $transformer);

        $servers = $builder->paginate(min($request->query('per_page', 50), 100))->appends($request->query());
        $tenantFilters = $this->tenantFiltersForScope($request, $this->resolveScope($request));
        $response = $this->fractal->transformWith($transformer)->collection($servers)->toArray();

        $response['meta']['tenant_filters'] = $tenantFilters;

        return $response;
    }

    /**
     * Returns all the subuser permissions available on the system.
     */
    public function permissions(): array
    {
        return [
            'object' => 'system_permissions',
            'attributes' => [
                'permissions' => Permission::permissions(),
            ],
        ];
    }

    private function buildServerQuery(GetServersRequest $request, ServerTransformer $transformer): QueryBuilder
    {
        $user = $request->user();
        $type = (string) $request->input('type', '');

        if (in_array($type, ['admin', 'admin-all', 'owner'], true)) {
            $query = $this->legacyTypeQuery($user, $type);
        } else {
            $query = $this->scopedServerQuery($user, $this->resolveScope($request));
        }

        $builder = QueryBuilder::for(
            $query->with(array_merge(
                $this->getIncludesForTransformer($transformer),
                [
                    'node:id,name,maintenance_mode,daemon_sftp_alias,fqdn,daemonSFTP',
                    'tenant',
                    'allocations',
                    'variables',
                ],
            ))
        )->allowedFilters([
            'uuid',
            'name',
            'description',
            'external_id',
            AllowedFilter::custom('*', new MultiFieldServerFilter()),
        ]);

        return $builder;
    }

    private function legacyTypeQuery(User $user, string $type): Builder
    {
        return match ($type) {
            'admin' => $user->root_admin
                ? Server::query()->whereNotIn('servers.id', $user->accessibleServers()->pluck('id')->all())
                : Server::query()->whereRaw('1 = 2'),
            'admin-all' => $user->root_admin ? Server::query() : Server::query()->whereRaw('1 = 2'),
            'owner' => Server::query()->where('servers.owner_id', $user->id),
            default => Server::query()->whereRaw('1 = 2'),
        };
    }

    private function scopedServerQuery(User $user, string $scope): Builder
    {
        if (str_starts_with($scope, 'tenant:')) {
            $tenantId = (int) substr($scope, 7);

            if ($tenantId > 0) {
                return Server::query()->where('servers.tenant_id', $tenantId);
            }
        }

        return match ($scope) {
            'all' => $user->root_admin ? Server::query() : Server::query()->whereRaw('1 = 2'),
            'owned' => Server::query()->where('servers.owner_id', $user->id),
            default => $user->accessibleServers(),
        };
    }

    private function resolveScope(Request $request): string
    {
        $scope = (string) $request->input('scope', '');

        if ($scope !== '') {
            if (in_array($scope, ['accessible', 'owned', 'all'], true) || str_starts_with($scope, 'tenant:')) {
                return $scope;
            }

            return 'accessible';
        }

        $type = (string) $request->input('type', '');

        if ($type === 'admin-all') {
            return 'all';
        }

        if ($type === 'owner') {
            return 'owned';
        }

        if ($type === 'admin') {
            return 'accessible';
        }

        return $request->user()->root_admin ? 'all' : 'accessible';
    }

    private function tenantFiltersForScope(GetServersRequest $request, string $scope): array
    {
        if ($request->user()->root_admin) {
            return Tenant::query()
                ->orderBy('name')
                ->get(['id', 'name'])
                ->map(fn (Tenant $tenant) => [
                    'value' => sprintf('tenant:%d', $tenant->id),
                    'label' => $tenant->name,
                ])
                ->all();
        }

        $query = $this->scopedServerQuery($request->user(), $scope)
            ->whereNotNull('servers.tenant_id')
            ->with('tenant')
            ->select(['servers.id', 'servers.tenant_id'])
            ->distinct();

        return $query->get()
            ->pluck('tenant')
            ->filter()
            ->unique('id')
            ->sortBy('name')
            ->values()
            ->map(fn ($tenant) => [
                'value' => sprintf('tenant:%d', $tenant->id),
                'label' => $tenant->name,
            ])
            ->all();
    }
}
