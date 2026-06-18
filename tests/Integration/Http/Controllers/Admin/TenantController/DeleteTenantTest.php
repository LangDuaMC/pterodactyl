<?php

namespace Pterodactyl\Tests\Integration\Http\Controllers\Admin\TenantController;

use Pterodactyl\Models\User;
use Pterodactyl\Models\Tenant;
use Pterodactyl\Tests\Integration\Http\HttpTestCase;

class DeleteTenantTest extends HttpTestCase
{
    public function testNonAdminCannotDeleteTenant(): void
    {
        $tenant = Tenant::factory()->create();

        $this->actingAs(User::factory()->create())
            ->delete(route('admin.tenants.delete', ['tenant' => $tenant]))
            ->assertForbidden();
    }

    public function testTenantIsDeleted(): void
    {
        $tenant = Tenant::factory()->create();

        $this->actingAs(User::factory()->admin()->create())
            ->delete(route('admin.tenants.delete', ['tenant' => $tenant]))
            ->assertRedirectToRoute('admin.tenants');

        $this->assertModelMissing($tenant);
    }
}
