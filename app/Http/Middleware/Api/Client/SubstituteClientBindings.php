<?php

namespace Pterodactyl\Http\Middleware\Api\Client;

use Pterodactyl\Models\Server;
use Illuminate\Routing\Middleware\SubstituteBindings;

class SubstituteClientBindings extends SubstituteBindings
{
    /**
     * @param \Illuminate\Http\Request $request
     */
    public function handle($request, \Closure $next): mixed
    {
        // Override default behavior of the model binding to use a specific table
        // column rather than the default 'id'.
        $this->router->bind('server', function ($value) {
            // Numeric ID — passthrough to default binding (admin routes).
            if (is_numeric($value)) {
                return Server::query()->where('id', (int) $value)->firstOrFail();
            }

            return Server::query()
                ->when(
                    str_starts_with($value, 'serv_'),
                    fn ($builder) => $builder->whereIdentifier($value),
                    fn ($builder) => $builder->where(strlen($value) === 8 ? 'uuidShort' : 'uuid', $value)
                )
                ->firstOrFail();
        });

        $this->router->bind('user', function ($value, $route) {
            $server = $route->parameter('server');
            if (!$server) {
                return \Pterodactyl\Models\User::query()->where('uuid', $value)->firstOrFail();
            }

            /** @var \Pterodactyl\Models\Subuser $match */
            $match = $server
                ->subusers()
                ->whereRelation('user', 'uuid', '=', $value)
                ->firstOrFail();

            return $match->user;
        });

        return parent::handle($request, $next);
    }
}
