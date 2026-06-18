<?php

namespace Pterodactyl\Http\Controllers\Admin;

use Illuminate\View\View;
use Illuminate\Http\Request;
use Pterodactyl\Models\Tenant;
use Illuminate\Http\RedirectResponse;
use Prologue\Alerts\AlertsMessageBag;
use Illuminate\View\Factory as ViewFactory;
use Pterodactyl\Exceptions\DisplayException;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Services\Tenants\TenantUpdateService;
use Pterodactyl\Services\Tenants\TenantCreationService;
use Pterodactyl\Services\Tenants\TenantDeletionService;
use Pterodactyl\Http\Requests\Admin\TenantFormRequest;

class TenantsController extends Controller
{
    public function __construct(
        protected AlertsMessageBag $alert,
        protected TenantCreationService $creationService,
        protected TenantDeletionService $deletionService,
        protected TenantUpdateService $updateService,
        protected ViewFactory $view,
    ) {
    }

    public function create(): View
    {
        return view('admin.tenants.new');
    }

    public function store(TenantFormRequest $request): RedirectResponse
    {
        $tenant = $this->creationService->handle($request->normalize());
        $this->alert->success('Tenant created successfully.')->flash();

        return redirect()->route('admin.tenants.view', $tenant->id);
    }

    public function update(TenantFormRequest $request, Tenant $tenant): RedirectResponse
    {
        $this->updateService->handle($tenant, $request->normalize());
        $this->alert->success('Tenant updated successfully.')->flash();

        return redirect()->route('admin.tenants.view', $tenant->id);
    }

    public function delete(Tenant $tenant): RedirectResponse
    {
        try {
            $this->deletionService->handle($tenant);
            $this->alert->success('Tenant deleted successfully.')->flash();

            return redirect()->route('admin.tenants');
        } catch (DisplayException $ex) {
            $this->alert->danger($ex->getMessage())->flash();
        }

        return redirect()->route('admin.tenants.view', $tenant->id);
    }
}
