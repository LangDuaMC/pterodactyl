<?php

namespace Pterodactyl\Tests\Integration\Services\Servers;

use Pterodactyl\Models\Server;
use Pterodactyl\Services\Servers\EnvironmentService;
use Pterodactyl\Tests\Integration\IntegrationTestCase;
use Pterodactyl\Services\Servers\ServerConfigurationStructureService;

class ServerConfigurationStructureServiceTest extends IntegrationTestCase
{
    public function testAllocationPortTakesPrecedenceOverEggDefaultPort()
    {
        $server = $this->createServerWithEggDefaultPort(25565);

        $configuration = $this->getService()->handle($server);
        $legacyConfiguration = $this->getService()->handle($server, [], true);
        $environment = $this->app->make(EnvironmentService::class)->handle($server);

        $this->assertSame($server->allocation->ip, $configuration['allocations']['default']['ip']);
        $this->assertSame($server->allocation->port, $configuration['allocations']['default']['port']);
        $this->assertSame($server->allocation->ip, $legacyConfiguration['build']['default']['ip']);
        $this->assertSame($server->allocation->port, $legacyConfiguration['build']['default']['port']);
        $this->assertArrayNotHasKey('SERVER_PORT', $environment);
    }

    public function testEggDefaultPortIsUsedWhenServerHasNoMainAllocation()
    {
        $server = $this->createServerWithEggDefaultPort(25565);
        $server->forceFill(['allocation_id' => null])->saveOrFail();
        $server = $server->fresh(['allocation', 'allocations', 'egg', 'mounts', 'variables']);

        $configuration = $this->getService()->handle($server);
        $legacyConfiguration = $this->getService()->handle($server, [], true);
        $environment = $this->app->make(EnvironmentService::class)->handle($server);

        $this->assertSame($server->shortUuid . '.lo', $configuration['allocations']['default']['ip']);
        $this->assertSame(25565, $configuration['allocations']['default']['port']);
        $this->assertSame($server->shortUuid . '.lo', $legacyConfiguration['build']['default']['ip']);
        $this->assertSame(25565, $legacyConfiguration['build']['default']['port']);
        $this->assertSame(25565, $environment['SERVER_PORT']);
    }

    private function createServerWithEggDefaultPort(int $port): Server
    {
        $server = $this->createServerModel();
        $egg = $this->cloneEggAndVariables($server->egg);
        $egg->forceFill(['default_port' => $port])->saveOrFail();

        $server->forceFill(['egg_id' => $egg->id])->saveOrFail();

        return $server->fresh(['allocation', 'allocations', 'egg', 'mounts', 'variables']);
    }

    private function getService(): ServerConfigurationStructureService
    {
        return $this->app->make(ServerConfigurationStructureService::class);
    }
}
