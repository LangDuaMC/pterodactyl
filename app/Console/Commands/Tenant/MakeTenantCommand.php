<?php

namespace Pterodactyl\Console\Commands\Tenant;

use Ramsey\Uuid\Uuid;
use Pterodactyl\Models\User;
use Pterodactyl\Models\Tenant;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class MakeTenantCommand extends Command
{
    protected $signature = 'p:tenant:make
                            {--name= : Tenant display name.}
                            {--description= : Optional tenant description.}
                            {--owner= : Optional owner user ID or email.}
                            {--memory= : Memory quota in MiB. Empty means unlimited.}
                            {--disk= : Disk quota in MiB. Empty means unlimited.}
                            {--cpu= : CPU quota percentage. Empty means unlimited.}
                            {--servers= : Server count quota. Empty means unlimited.}
                            {--databases= : Database quota. Empty means unlimited.}
                            {--allocations= : Allocation quota. Empty means unlimited.}
                            {--backups= : Backup quota. Empty means unlimited.}';

    protected $description = 'Creates a tenant resource pool.';

    public function handle(): int
    {
        $name = $this->option('name') ?? $this->ask('Tenant name');
        $owner = $this->option('owner');

        $tenant = DB::transaction(function () use ($name, $owner) {
            /** @var Tenant $tenant */
            $tenant = Tenant::query()->create([
                'uuid' => Uuid::uuid4()->toString(),
                'name' => $name,
                'description' => $this->option('description'),
                'memory' => $this->nullableIntegerOption('memory'),
                'disk' => $this->nullableIntegerOption('disk'),
                'cpu' => $this->nullableIntegerOption('cpu'),
                'servers' => $this->nullableIntegerOption('servers'),
                'databases' => $this->nullableIntegerOption('databases'),
                'allocations' => $this->nullableIntegerOption('allocations'),
                'backups' => $this->nullableIntegerOption('backups'),
            ]);

            if (!empty($owner)) {
                $user = User::query()->when(
                    is_numeric($owner),
                    fn ($query) => $query->where('id', $owner),
                    fn ($query) => $query->where('email', $owner)
                )->firstOrFail();

                $tenant->users()->attach($user->id, ['role' => Tenant::ROLE_OWNER]);
            }

            return $tenant;
        });

        $this->info("Created tenant {$tenant->name} with ID {$tenant->id}.");

        return self::SUCCESS;
    }

    private function nullableIntegerOption(string $key): ?int
    {
        $value = $this->option($key);

        return $value === null || $value === '' ? null : (int) $value;
    }
}
