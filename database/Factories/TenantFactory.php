<?php

namespace Database\Factories;

use Ramsey\Uuid\Uuid;
use Pterodactyl\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;

class TenantFactory extends Factory
{
    protected $model = Tenant::class;

    public function definition(): array
    {
        return [
            'uuid' => Uuid::uuid4()->toString(),
            'name' => $this->faker->company,
            'description' => null,
            'memory' => null,
            'disk' => null,
            'cpu' => null,
            'servers' => null,
            'databases' => null,
            'allocations' => null,
            'backups' => null,
        ];
    }
}
