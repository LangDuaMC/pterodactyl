@extends('layouts.admin')

@section('title')
    Tenants
@endsection

@section('content-header')
    <h1>Tenants<small>Resource pools for grouping and limiting server usage.</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">Admin</a></li>
        <li class="active">Tenants</li>
    </ol>
@endsection

@section('content')
<div class="row">
    <div class="col-xs-12">
        <div class="box box-primary">
            <div class="box-header with-border">
                <h3 class="box-title">Tenant List</h3>
                <div class="box-tools">
                    <a href="{{ route('admin.tenants.new') }}"><button type="button" class="btn btn-sm btn-primary">Create New</button></a>
                </div>
            </div>
            <div class="box-body table-responsive no-padding">
                <table class="table table-hover">
                    <tbody>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Description</th>
                            <th class="text-center">Servers</th>
                            <th class="text-center">Memory</th>
                            <th class="text-center">Disk</th>
                            <th class="text-center">CPU</th>
                        </tr>
                        @foreach ($tenants as $tenant)
                            <tr>
                                <td><code>{{ $tenant->id }}</code></td>
                                <td><a href="{{ route('admin.tenants.view', $tenant->id) }}">{{ $tenant->name }}</a></td>
                                <td>{{ $tenant->description ?? '—' }}</td>
                                <td class="text-center">{{ $tenant->servers_count }}</td>
                                <td class="text-center">{{ $tenant->memory ? $tenant->memory . ' MiB' : '∞' }}</td>
                                <td class="text-center">{{ $tenant->disk ? $tenant->disk . ' MiB' : '∞' }}</td>
                                <td class="text-center">{{ $tenant->cpu ? $tenant->cpu . '%' : '∞' }}</td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
            @if($tenants->hasPages())
                <div class="box-footer with-border">
                    <div class="col-md-12 text-center">{!! $tenants->appends(['query' => Request::input('query')])->render() !!}</div>
                </div>
            @endif
        </div>
    </div>
</div>
@endsection
