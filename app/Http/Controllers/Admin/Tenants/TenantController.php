<?php

namespace Pterodactyl\Http\Controllers\Admin\Tenants;

use Illuminate\View\View;
use Illuminate\Http\Request;
use Pterodactyl\Models\Tenant;
use Spatie\QueryBuilder\QueryBuilder;
use Pterodactyl\Http\Controllers\Controller;

class TenantController extends Controller
{
    public function index(Request $request): View
    {
        $query = Tenant::query()->select('tenants.*');

        if (Tenant::supportsServerAssignments()) {
            $query->withCount('servers');
        } else {
            $query->selectRaw('0 as servers_count');
        }

        $tenants = QueryBuilder::for($query)
            ->allowedFilters('uuid', 'name')
            ->allowedSorts('id', 'name')
            ->paginate(25);

        return view('admin.tenants.index', ['tenants' => $tenants]);
    }
}
