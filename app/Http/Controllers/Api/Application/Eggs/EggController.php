<?php

namespace Pterodactyl\Http\Controllers\Api\Application\Eggs;

use Pterodactyl\Models\Egg;
use Spatie\QueryBuilder\QueryBuilder;
use Spatie\QueryBuilder\AllowedFilter;
use Pterodactyl\Transformers\Api\Application\EggTransformer;
use Pterodactyl\Http\Requests\Api\Application\Nests\Eggs\GetEggRequest;
use Pterodactyl\Http\Requests\Api\Application\Nests\Eggs\GetEggsRequest;
use Pterodactyl\Http\Controllers\Api\Application\ApplicationApiController;

class EggController extends ApplicationApiController
{
    public function index(GetEggsRequest $request): array
    {
        $eggs = QueryBuilder::for(Egg::query())
            ->allowedFilters([
                'uuid',
                'name',
                AllowedFilter::callback('tag', function ($query, $value) {
                    $query->whereJsonContains('tags', $value);
                }),
            ])
            ->allowedSorts(['id', 'name'])
            ->paginate($request->query('per_page') ?? 50);

        return $this->fractal->collection($eggs)
            ->transformWith($this->getTransformer(EggTransformer::class))
            ->toArray();
    }

    public function view(GetEggRequest $request, Egg $egg): array
    {
        return $this->fractal->item($egg)
            ->transformWith($this->getTransformer(EggTransformer::class))
            ->toArray();
    }
}
