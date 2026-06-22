<?php

namespace Pterodactyl\Http\Controllers\Admin\Tenants;

use Pterodactyl\Models\User;
use Pterodactyl\Models\Tenant;
use Illuminate\Http\RedirectResponse;
use Prologue\Alerts\AlertsMessageBag;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Http\Requests\Admin\TenantMemberFormRequest;

class TenantMemberController extends Controller
{
    public function __construct(private AlertsMessageBag $alert)
    {
    }

    public function store(TenantMemberFormRequest $request, Tenant $tenant): RedirectResponse
    {
        $user = $this->resolveUser($request);

        $tenant->users()->syncWithoutDetaching([
            $user->id => ['role' => $request->input('role')],
        ]);

        $this->alert->success('Tenant member updated successfully.')->flash();

        return redirect()->route('admin.tenants.view', $tenant->id);
    }

    public function delete(Tenant $tenant, User $user): RedirectResponse
    {
        $tenant->users()->detach($user->id);

        $this->alert->success('Tenant member removed successfully.')->flash();

        return redirect()->route('admin.tenants.view', $tenant->id);
    }

    protected function resolveUser(TenantMemberFormRequest $request): User
    {
        if ($request->filled('user_id')) {
            return User::query()->findOrFail($request->integer('user_id'));
        }

        return User::query()->where('email', $request->string('email'))->firstOrFail();
    }
}
