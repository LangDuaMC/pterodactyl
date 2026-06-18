<?php

namespace Pterodactyl\Tests\Integration\Services\Tenants;

use Pterodactyl\Models\Tenant;
use Pterodactyl\Tests\Integration\IntegrationTestCase;
use Pterodactyl\Services\Tenants\TenantCreationService;

class TenantCreationServiceTest extends IntegrationTestCase
{
    private TenantCreationService $service;

    public function setUp(): void
    {
        parent::setUp();
        $this->service = $this->app->make(TenantCreationService::class);
    }

    public function testTenantIsCreated(): void
    {
        $tenant = $this->service->handle([
            'name' => 'Test Tenant',
            'description' => 'A test tenant',
        ]);

        $this->assertInstanceOf(Tenant::class, $tenant);
        $this->assertNotEmpty($tenant->uuid);
        $this->assertEquals('Test Tenant', $tenant->name);
        $this->assertEquals('A test tenant', $tenant->description);
        $this->assertDatabaseHas('tenants', ['id' => $tenant->id]);
    }

    public function testTenantIsCreatedWithQuotas(): void
    {
        $tenant = $this->service->handle([
            'name' => 'Quota Tenant',
            'memory' => 4096,
            'disk' => 51200,
            'cpu' => 200,
            'servers' => 5,
            'databases' => 3,
            'allocations' => 10,
            'backups' => 2,
        ]);

        $this->assertEquals(4096, $tenant->memory);
        $this->assertEquals(51200, $tenant->disk);
        $this->assertEquals(200, $tenant->cpu);
        $this->assertEquals(5, $tenant->servers);
        $this->assertEquals(3, $tenant->databases);
        $this->assertEquals(10, $tenant->allocations);
        $this->assertEquals(2, $tenant->backups);
    }
}
