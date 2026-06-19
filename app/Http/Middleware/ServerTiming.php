<?php

namespace Pterodactyl\Http\Middleware;

use Closure;
use Illuminate\Support\Facades\DB;

class ServerTiming
{
    public function handle($request, Closure $next)
    {
        $handleStart = microtime(true);

        $dbTotal = 0;
        $dbCount = 0;

        DB::listen(function ($query) use (&$dbTotal, &$dbCount) {
            $dbTotal += $query->time;
            $dbCount++;
        });

        $response = $next($request);

        $appTime = (microtime(true) - $handleStart) * 1000;
        $laravelStart = defined('LARAVEL_START') ? LARAVEL_START : ($_SERVER['LARAVEL_START'] ?? $_SERVER['REQUEST_TIME_FLOAT']);
        $totalTime = (microtime(true) - $laravelStart) * 1000;
        $bootstrapTime = $totalTime - $appTime;

        $timing = [];
        $timing[] = sprintf('total;dur=%.2f', $totalTime);
        $timing[] = sprintf('bootstrap;dur=%.2f', $bootstrapTime);
        $timing[] = sprintf('app;dur=%.2f', $appTime);
        $timing[] = sprintf('db;dur=%.2f;desc="%d queries"', $dbTotal, $dbCount);

        $response->headers->set('Server-Timing', implode(', ', $timing));

        return $response;
    }
}
