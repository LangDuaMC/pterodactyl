@extends('layouts.admin')

@section('title')
    Tenants &rarr; Create
@endsection

@section('content-header')
    <h1>Create Tenant<small>Add a new tenant resource pool to the system.</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">Admin</a></li>
        <li><a href="{{ route('admin.tenants') }}">Tenants</a></li>
        <li class="active">Create</li>
    </ol>
@endsection

@section('content')
<div class="row">
    <div class="col-md-12">
        <div class="box box-primary">
            <div class="box-header with-border">
                <h3 class="box-title">Tenant Details</h3>
            </div>
            <form action="{{ route('admin.tenants.store') }}" method="POST">
                <div class="box-body">
                    <div class="row">
                        <div class="col-md-6">
                            <div class="form-group">
                                <label for="pName" class="form-label">Tenant Name</label>
                                <input type="text" id="pName" name="name" class="form-control" placeholder="My Tenant" />
                                <p class="text-muted small">A unique name to identify this tenant resource pool.</p>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="form-group">
                                <label for="pDescription" class="form-label">Description</label>
                                <textarea id="pDescription" name="description" class="form-control" rows="1" placeholder="Optional description..."></textarea>
                                <p class="text-muted small">A brief description of this tenant's purpose.</p>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-12">
                            <h4>Resource Quotas</h4>
                            <p class="text-muted">Leave blank for unlimited. Set to 0 to disable the resource entirely for this tenant.</p>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-3">
                            <div class="form-group">
                                <label for="pMemory" class="form-label">Memory (MiB)</label>
                                <input type="number" id="pMemory" name="memory" class="form-control" placeholder="Unlimited" />
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="form-group">
                                <label for="pDisk" class="form-label">Disk (MiB)</label>
                                <input type="number" id="pDisk" name="disk" class="form-control" placeholder="Unlimited" />
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="form-group">
                                <label for="pCpu" class="form-label">CPU (%)</label>
                                <input type="number" id="pCpu" name="cpu" class="form-control" placeholder="Unlimited" />
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="form-group">
                                <label for="pServers" class="form-label">Server Count</label>
                                <input type="number" id="pServers" name="servers" class="form-control" placeholder="Unlimited" />
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-3">
                            <div class="form-group">
                                <label for="pDatabases" class="form-label">Databases</label>
                                <input type="number" id="pDatabases" name="databases" class="form-control" placeholder="Unlimited" />
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="form-group">
                                <label for="pAllocations" class="form-label">Allocations</label>
                                <input type="number" id="pAllocations" name="allocations" class="form-control" placeholder="Unlimited" />
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="form-group">
                                <label for="pBackups" class="form-label">Backups</label>
                                <input type="number" id="pBackups" name="backups" class="form-control" placeholder="Unlimited" />
                            </div>
                        </div>
                    </div>
                </div>
                <div class="box-footer">
                    {!! csrf_field() !!}
                    <button type="submit" class="btn btn-sm btn-primary pull-right">Create</button>
                </div>
            </form>
        </div>
    </div>
</div>
@endsection
