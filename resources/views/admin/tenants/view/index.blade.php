@extends('layouts.admin')

@section('title')
    Tenants &rarr; View &rarr; {{ $tenant->name }}
@endsection

@section('content-header')
    <h1>{{ $tenant->name }}<small>{{ $tenant->description ?? 'No description' }}</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">Admin</a></li>
        <li><a href="{{ route('admin.tenants') }}">Tenants</a></li>
        <li class="active">{{ $tenant->name }}</li>
    </ol>
@endsection

@section('content')
<div class="row">
    <div class="col-sm-6">
        <div class="box box-primary">
            <div class="box-header with-border">
                <h3 class="box-title">Tenant Details</h3>
            </div>
            <form action="{{ route('admin.tenants.update', $tenant->id) }}" method="POST">
                <div class="box-body">
                    <div class="form-group">
                        <label for="pName" class="form-label">Tenant Name</label>
                        <input type="text" id="pName" name="name" class="form-control" value="{{ $tenant->name }}" />
                    </div>
                    <div class="form-group">
                        <label for="pDescription" class="form-label">Description</label>
                        <textarea id="pDescription" name="description" class="form-control" rows="2">{{ $tenant->description }}</textarea>
                    </div>
                    <div class="form-group">
                        <label class="form-label">UUID</label>
                        <input type="text" class="form-control" value="{{ $tenant->uuid }}" disabled />
                        <p class="text-muted small">System-generated unique identifier.</p>
                    </div>
                </div>
                <div class="box-footer">
                    {!! csrf_field() !!}
                    {!! method_field('PATCH') !!}
                    <button type="submit" class="btn btn-sm btn-primary pull-right">Save</button>
                    <button type="button" class="btn btn-sm btn-danger pull-left muted muted-hover" data-toggle="modal" data-target="#deleteTenantModal"><i class="fa fa-trash-o"></i></button>
                </div>
            </form>
        </div>
    </div>
    <div class="col-sm-6">
        <div class="box">
            <div class="box-header with-border">
                <h3 class="box-title">Resource Quotas</h3>
            </div>
            <form action="{{ route('admin.tenants.update', $tenant->id) }}" method="POST">
                <div class="box-body">
                    <div class="row">
                        <div class="col-md-4">
                            <div class="form-group">
                                <label for="pMemory" class="form-label">Memory (MiB)</label>
                                <input type="number" id="pMemory" name="memory" class="form-control" value="{{ $tenant->memory }}" placeholder="Unlimited" />
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="form-group">
                                <label for="pDisk" class="form-label">Disk (MiB)</label>
                                <input type="number" id="pDisk" name="disk" class="form-control" value="{{ $tenant->disk }}" placeholder="Unlimited" />
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="form-group">
                                <label for="pCpu" class="form-label">CPU (%)</label>
                                <input type="number" id="pCpu" name="cpu" class="form-control" value="{{ $tenant->cpu }}" placeholder="Unlimited" />
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-3">
                            <div class="form-group">
                                <label for="pServers" class="form-label">Servers</label>
                                <input type="number" id="pServers" name="servers" class="form-control" value="{{ $tenant->servers }}" placeholder="Unlimited" />
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="form-group">
                                <label for="pDatabases" class="form-label">Databases</label>
                                <input type="number" id="pDatabases" name="databases" class="form-control" value="{{ $tenant->databases }}" placeholder="Unlimited" />
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="form-group">
                                <label for="pAllocations" class="form-label">Allocations</label>
                                <input type="number" id="pAllocations" name="allocations" class="form-control" value="{{ $tenant->allocations }}" placeholder="Unlimited" />
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="form-group">
                                <label for="pBackups" class="form-label">Backups</label>
                                <input type="number" id="pBackups" name="backups" class="form-control" value="{{ $tenant->backups }}" placeholder="Unlimited" />
                            </div>
                        </div>
                    </div>
                </div>
                <div class="box-footer">
                    {!! csrf_field() !!}
                    {!! method_field('PATCH') !!}
                    <button type="submit" class="btn btn-sm btn-primary pull-right">Save</button>
                </div>
            </form>
        </div>
    </div>
</div>
<div class="row">
    <div class="col-xs-12">
        <div class="box">
            <div class="box-header with-border">
                <h3 class="box-title">Servers</h3>
            </div>
            <div class="box-body table-responsive no-padding">
                <table class="table table-hover">
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Owner</th>
                        <th>Node</th>
                        <th>Memory</th>
                        <th>Disk</th>
                    </tr>
                    @foreach($servers as $server)
                        <tr>
                            <td><code>{{ $server->id }}</code></td>
                            <td><a href="{{ route('admin.servers.view', $server->id) }}">{{ $server->name }}</a></td>
                            <td>{{ $server->owner->username ?? '—' }}</td>
                            <td>{{ $server->node->name ?? '—' }}</td>
                            <td>{{ $server->memory }} MiB</td>
                            <td>{{ $server->disk }} MiB</td>
                        </tr>
                    @endforeach
                </table>
            </div>
            @if($servers->hasPages())
                <div class="box-footer with-border">
                    <div class="col-md-12 text-center">{!! $servers->links() !!}</div>
                </div>
            @endif
        </div>
    </div>
</div>
<div class="row">
    <div class="col-xs-12">
        <div class="box box-info">
            <div class="box-header with-border">
                <h3 class="box-title">Members</h3>
            </div>
            <div class="box-body table-responsive no-padding">
                <table class="table table-hover">
                    <tr>
                        <th>User</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th class="text-right">Actions</th>
                    </tr>
                    @foreach($tenant->users as $member)
                        <tr>
                            <td>{{ $member->username }}</td>
                            <td>{{ $member->email }}</td>
                            <td>
                                <form action="{{ route('admin.tenants.members.store', $tenant->id) }}" method="POST" class="form-inline">
                                    {!! csrf_field() !!}
                                    <input type="hidden" name="user_id" value="{{ $member->id }}" />
                                    <select name="role" class="form-control input-sm">
                                        @foreach([\Pterodactyl\Models\Tenant::ROLE_OWNER, \Pterodactyl\Models\Tenant::ROLE_ADMIN, \Pterodactyl\Models\Tenant::ROLE_MEMBER] as $role)
                                            <option value="{{ $role }}" {{ $member->pivot->role === $role ? 'selected' : '' }}>{{ ucfirst($role) }}</option>
                                        @endforeach
                                    </select>
                                    <button type="submit" class="btn btn-xs btn-primary">Save</button>
                                </form>
                            </td>
                            <td class="text-right">
                                <form action="{{ route('admin.tenants.members.delete', ['tenant' => $tenant->id, 'user' => $member->id]) }}" method="POST">
                                    {!! csrf_field() !!}
                                    {!! method_field('DELETE') !!}
                                    <button type="submit" class="btn btn-xs btn-danger">Remove</button>
                                </form>
                            </td>
                        </tr>
                    @endforeach
                </table>
            </div>
            <div class="box-footer">
                <form action="{{ route('admin.tenants.members.store', $tenant->id) }}" method="POST" class="form-inline">
                    {!! csrf_field() !!}
                    <div class="form-group">
                        <label class="sr-only" for="pUserId">User</label>
                        <select id="pUserId" name="user_id" class="form-control input-sm" style="min-width:260px;"></select>
                    </div>
                    <div class="form-group">
                        <label class="sr-only" for="memberRole">Role</label>
                        <select id="memberRole" name="role" class="form-control input-sm">
                            <option value="{{ \Pterodactyl\Models\Tenant::ROLE_MEMBER }}">Member</option>
                            <option value="{{ \Pterodactyl\Models\Tenant::ROLE_ADMIN }}">Admin</option>
                            <option value="{{ \Pterodactyl\Models\Tenant::ROLE_OWNER }}">Owner</option>
                        </select>
                    </div>
                    <button type="submit" class="btn btn-sm btn-primary">Add Member</button>
                </form>
            </div>
        </div>
    </div>
</div>
<div class="modal fade" id="deleteTenantModal" tabindex="-1" role="dialog">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <form action="{{ route('admin.tenants.delete', $tenant->id) }}" method="POST">
                <div class="modal-header">
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                    <h4 class="modal-title">Delete Tenant</h4>
                </div>
                <div class="modal-body">
                    <p>Are you sure you want to delete this tenant? This action cannot be undone.</p>
                    @if($tenant->servers_count > 0)
                        <div class="callout callout-danger">
                            <strong>Warning:</strong> This tenant has active servers. You must reassign or remove them first.
                        </div>
                    @endif
                </div>
                <div class="modal-footer">
                    {!! csrf_field() !!}
                    {!! method_field('DELETE') !!}
                    <button type="button" class="btn btn-default btn-sm pull-left" data-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-danger btn-sm" {{ $tenant->servers_count > 0 ? 'disabled' : '' }}>Delete</button>
                </div>
            </form>
        </div>
    </div>
</div>
@section('footer-scripts')
    @parent
    <script>
    function escapeHtml(str) {
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

    $('#pUserId').select2({
        ajax: {
            url: '/admin/users/accounts.json',
            dataType: 'json',
            delay: 250,
            data: function (params) {
                return {
                    filter: { email: params.term },
                    page: params.page,
                };
            },
            processResults: function (data) {
                return { results: data };
            },
            cache: true,
        },
        placeholder: 'Search for a user',
        escapeMarkup: function (markup) { return markup; },
        minimumInputLength: 2,
        templateResult: function (data) {
            if (data.loading) return escapeHtml(data.text);

            return '<div class="user-block"> \
                <img class="img-circle img-bordered-xs" src="https://www.gravatar.com/avatar/' + escapeHtml(data.md5) + '?s=120" alt="User Image"> \
                <span class="username"> \
                    <a href="#">' + escapeHtml(data.name_first) + ' ' + escapeHtml(data.name_last) +'</a> \
                </span> \
                <span class="description"><strong>' + escapeHtml(data.email) + '</strong> - ' + escapeHtml(data.username) + '</span> \
            </div>';
        },
        templateSelection: function (data) {
            if (typeof data.name_first === 'undefined') {
                return data.text || 'Search for a user';
            }

            return '<div> \
                <span> \
                    <img class="img-rounded img-bordered-xs" src="https://www.gravatar.com/avatar/' + escapeHtml(data.md5) + '?s=120" style="height:28px;margin-top:-4px;" alt="User Image"> \
                </span> \
                <span style="padding-left:5px;"> \
                    ' + escapeHtml(data.name_first) + ' ' + escapeHtml(data.name_last) + ' (<strong>' + escapeHtml(data.email) + '</strong>) \
                </span> \
            </div>';
        }
    });
    </script>
@endsection
@endsection
