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
        $tenants = QueryBuilder::for(
            Tenant::query()->withCount('servers')
        )
            ->allowedFilters(['uuid', 'name'])
            ->allowedSorts(['id', 'name'])
            ->paginate(25);

        return view('admin.tenants.index', ['tenants' => $tenants]);
    }
}
