<?php

namespace Pterodactyl\Tests\Integration\Http\Controllers\Admin\TenantController;

use Pterodactyl\Models\User;
use Pterodactyl\Models\Tenant;
use Pterodactyl\Tests\Integration\Http\HttpTestCase;

class ManageTenantMembersTest extends HttpTestCase
{
    public function testNonAdminCannotManageTenantMembers(): void
    {
        $tenant = Tenant::factory()->create();
        $user = User::factory()->create();

        $this->actingAs(User::factory()->create())
            ->post(route('admin.tenants.members.store', ['tenant' => $tenant]), [
                'email' => $user->email,
                'role' => Tenant::ROLE_ADMIN,
            ])
            ->assertForbidden();
    }

    public function testTenantMemberIsAttached(): void
    {
        $tenant = Tenant::factory()->create();
        $user = User::factory()->create();

        $this->actingAs(User::factory()->admin()->create())
            ->post(route('admin.tenants.members.store', ['tenant' => $tenant]), [
                'email' => $user->email,
                'role' => Tenant::ROLE_ADMIN,
            ])
            ->assertRedirectToRoute('admin.tenants.view', $tenant->id);

        $this->assertDatabaseHas('tenant_user', [
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
            'role' => Tenant::ROLE_ADMIN,
        ]);
    }

    public function testTenantMemberRoleIsUpdated(): void
    {
        $tenant = Tenant::factory()->create();
        $user = User::factory()->create();

        $tenant->users()->attach($user->id, ['role' => Tenant::ROLE_MEMBER]);

        $this->actingAs(User::factory()->admin()->create())
            ->post(route('admin.tenants.members.store', ['tenant' => $tenant]), [
                'user_id' => $user->id,
                'role' => Tenant::ROLE_OWNER,
            ])
            ->assertRedirectToRoute('admin.tenants.view', $tenant->id);

        $this->assertDatabaseHas('tenant_user', [
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
            'role' => Tenant::ROLE_OWNER,
        ]);
    }

    public function testTenantMemberCanBeRemoved(): void
    {
        $tenant = Tenant::factory()->create();
        $user = User::factory()->create();

        $tenant->users()->attach($user->id, ['role' => Tenant::ROLE_MEMBER]);

        $this->actingAs(User::factory()->admin()->create())
            ->delete(route('admin.tenants.members.delete', ['tenant' => $tenant, 'user' => $user]))
            ->assertRedirectToRoute('admin.tenants.view', $tenant->id);

        $this->assertDatabaseMissing('tenant_user', [
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
        ]);
    }
}
