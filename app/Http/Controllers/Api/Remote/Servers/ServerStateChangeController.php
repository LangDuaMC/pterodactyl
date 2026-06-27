<?php

namespace Pterodactyl\Http\Controllers\Api\Remote\Servers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Pterodactyl\Models\Node;
use Pterodactyl\Models\Server;
use Pterodactyl\Facades\Activity;
use Webmozart\Assert\Assert;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Repositories\Eloquent\ServerRepository;
use Pterodactyl\Exceptions\Http\HttpForbiddenException;

class ServerStateChangeController extends Controller
{
    public function __construct(
        private ServerRepository $repository,
    ) {
    }

    public function store(Request $request, string $uuid): JsonResponse
    {
        Assert::isInstanceOf($node = $request->attributes->get('node'), Node::class);

        $server = $this->repository->getByUuid($uuid);

        if ($node->id !== $server->node_id) {
            throw new HttpForbiddenException('Requesting node does not have permission to access this server.');
        }

        $data = $request->input('data', []);

        $server->update(['status' => null]);

        return new JsonResponse([], JsonResponse::HTTP_NO_CONTENT);
    }
}
