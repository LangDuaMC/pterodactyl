<?php

namespace Pterodactyl\Repositories\Eloquent;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Pterodactyl\Models\Setting;
use Pterodactyl\Contracts\Repository\SettingsRepositoryInterface;

class SettingsRepository extends EloquentRepository implements SettingsRepositoryInterface
{
    private const CACHE_KEY = 'settings:all';

    private static array $cache = [];

    private static array $databaseMiss = [];

    /**
     * Return the model backing this repository.
     */
    public function model(): string
    {
        return Setting::class;
    }

    /**
     * Return all settings, cached across requests for 24 hours.
     */
    public function all(): Collection
    {
        return Cache::remember(self::CACHE_KEY, 86400, function () {
            return parent::all();
        });
    }

    /**
     * Store a new persistent setting in the database.
     *
     * @throws \Pterodactyl\Exceptions\Model\DataValidationException
     */
    public function set(string $key, ?string $value = null)
    {
        $this->clearCache($key);
        $this->withoutFreshModel()->updateOrCreate(['key' => $key], ['value' => $value ?? '']);
        Cache::forget(self::CACHE_KEY);

        self::$cache[$key] = $value;
    }

    /**
     * Retrieve a persistent setting from the database.
     */
    public function get(string $key, mixed $default = null): mixed
    {
        if (array_key_exists($key, self::$cache)) {
            return self::$cache[$key];
        } elseif (array_key_exists($key, self::$databaseMiss)) {
            return value($default);
        }

        $instance = $this->getBuilder()->where('key', $key)->first();
        if (is_null($instance)) {
            self::$databaseMiss[$key] = true;

            return value($default);
        }

        return self::$cache[$key] = $instance->value;
    }

    /**
     * Remove a key from the database cache.
     */
    public function forget(string $key)
    {
        $this->clearCache($key);
        Cache::forget(self::CACHE_KEY);
        $this->deleteWhere(['key' => $key]);
    }

    /**
     * Remove a key from the cache.
     */
    private function clearCache(string $key)
    {
        unset(self::$cache[$key], self::$databaseMiss[$key]);
    }
}
