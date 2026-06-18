<?php

namespace Pterodactyl\Http\Controllers\Admin\Tenants;

use Illuminate\View\View;
use Illuminate\Http\Request;
use Pterodactyl\Models\Tenant;
use Pterodactyl\Models\Server;
use Pterodactyl\Http\Controllers\Controller;

class TenantViewController extends Controller
{
    public function index(Request $request, Tenant $tenant): View
    {
        $tenant->loadCount('servers');

        return view('admin.tenants.view.index', [
            'tenant' => $tenant,
            'servers' => Server::query()->where('tenant_id', $tenant->id)->paginate(25),
        ]);
    }
}
