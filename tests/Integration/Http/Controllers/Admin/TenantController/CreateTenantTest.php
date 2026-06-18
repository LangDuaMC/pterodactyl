<?php

namespace Pterodactyl\Tests\Integration\Http\Controllers\Admin\TenantController;

use Pterodactyl\Models\User;
use Pterodactyl\Models\Tenant;
use Pterodactyl\Tests\Integration\Http\HttpTestCase;

class CreateTenantTest extends HttpTestCase
{
    public function testNonAdminCannotAccessEndpoint(): void
    {
        $this->actingAs(User::factory()->create())
            ->get(route('admin.tenants.new'))
            ->assertForbidden();
    }

    public function testCreatePageIsDisplayed(): void
    {
        $this->actingAs(User::factory()->admin()->create())
            ->get(route('admin.tenants.new'))
            ->assertOk()
            ->assertSee('Create Tenant');
    }

    public function testTenantIsCreated(): void
    {
        $this->actingAs(User::factory()->admin()->create())
            ->post(route('admin.tenants.store'), [
                'name' => 'My Tenant',
                'description' => 'A description',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('tenants', [
            'name' => 'My Tenant',
            'description' => 'A description',
        ]);
    }

    public function testTenantWithQuotasIsCreated(): void
    {
        $this->actingAs(User::factory()->admin()->create())
            ->post(route('admin.tenants.store'), [
                'name' => 'Quota Tenant',
                'memory' => '2048',
                'disk' => '102400',
                'cpu' => '100',
                'servers' => '10',
                'databases' => '5',
                'allocations' => '20',
                'backups' => '3',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('tenants', [
            'name' => 'Quota Tenant',
            'memory' => 2048,
            'disk' => 102400,
            'cpu' => 100,
            'servers' => 10,
            'databases' => 5,
            'allocations' => 20,
            'backups' => 3,
        ]);
    }
}
