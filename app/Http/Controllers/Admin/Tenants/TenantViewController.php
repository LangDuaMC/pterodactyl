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
        if (Tenant::supportsServerAssignments()) {
            $tenant->loadCount('servers');
        } else {
            $tenant->servers_count = 0;
        }
        $tenant->load(['users' => function ($query) {
            $query->orderBy('username');
        }]);

        $servers = Tenant::supportsServerAssignments()
            ? Server::query()->where('tenant_id', $tenant->id)->paginate(25)
            : Server::query()->whereRaw('1 = 0')->paginate(25);

        return view('admin.tenants.view.index', [
            'tenant' => $tenant,
            'servers' => $servers,
        ]);
    }
}
