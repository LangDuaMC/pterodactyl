<?php

namespace Pterodactyl\Http\Controllers\Api\Application\Tenants;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Pterodactyl\Models\Tenant;
use Spatie\QueryBuilder\QueryBuilder;
use Pterodactyl\Services\Tenants\TenantUpdateService;
use Pterodactyl\Services\Tenants\TenantCreationService;
use Pterodactyl\Services\Tenants\TenantDeletionService;
use Pterodactyl\Transformers\Api\Application\TenantTransformer;
use Pterodactyl\Http\Controllers\Api\Application\ApplicationApiController;
use Pterodactyl\Http\Requests\Api\Application\Tenants\GetTenantRequest;
use Pterodactyl\Http\Requests\Api\Application\Tenants\GetTenantsRequest;
use Pterodactyl\Http\Requests\Api\Application\Tenants\StoreTenantRequest;
use Pterodactyl\Http\Requests\Api\Application\Tenants\UpdateTenantRequest;
use Pterodactyl\Http\Requests\Api\Application\Tenants\DeleteTenantRequest;

class TenantController extends ApplicationApiController
{
    public function __construct(
        private TenantCreationService $creationService,
        private TenantDeletionService $deletionService,
        private TenantUpdateService $updateService,
    ) {
        parent::__construct();
    }

    public function index(GetTenantsRequest $request): array
    {
        $tenants = QueryBuilder::for(Tenant::query())
            ->allowedFilters(['uuid', 'name'])
            ->allowedSorts(['id', 'name'])
            ->paginate($request->query('per_page') ?? 50);

        return $this->fractal->collection($tenants)
            ->transformWith($this->getTransformer(TenantTransformer::class))
            ->toArray();
    }

    public function view(GetTenantRequest $request, Tenant $tenant): array
    {
        return $this->fractal->item($tenant)
            ->transformWith($this->getTransformer(TenantTransformer::class))
            ->toArray();
    }

    public function store(StoreTenantRequest $request): JsonResponse
    {
        $tenant = $this->creationService->handle($request->validated());

        return $this->fractal->item($tenant)
            ->transformWith($this->getTransformer(TenantTransformer::class))
            ->addMeta([
                'resource' => route('api.application.tenants.view', [
                    'tenant' => $tenant->id,
                ]),
            ])
            ->respond(201);
    }

    public function update(UpdateTenantRequest $request, Tenant $tenant): array
    {
        $tenant = $this->updateService->handle($tenant, $request->validated());

        return $this->fractal->item($tenant)
            ->transformWith($this->getTransformer(TenantTransformer::class))
            ->toArray();
    }

    public function delete(DeleteTenantRequest $request, Tenant $tenant): Response
    {
        $this->deletionService->handle($tenant);

        return response('', 204);
    }
}
