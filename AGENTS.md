# Repository Guidelines

## Project Structure & Module Organization

This is a Laravel panel with a React/TypeScript client. PHP application code lives in `app/`, routes in `routes/`, migrations and seeders in `database/`, Blade views in `resources/views/`, and the React client in `resources/scripts/`. Public assets are served from `public/`; generated frontend build output should not be hand-edited. Tests are split between Laravel/PHP tests in `tests/` and frontend Jest specs near the relevant TypeScript files.

## Build, Test, and Development Commands

Install PHP dependencies with `composer install` and frontend dependencies with `yarn install --frozen-lockfile`. Use `php artisan migrate` for database changes after reviewing migrations. Frontend commands are defined in `package.json`: `yarn run build` for development assets, `yarn run build:production` for production assets, `yarn run tsc` for TypeScript checking, `yarn run lint` for ESLint, and `yarn test` for Jest.

Backend verification uses `php artisan test`, `composer cs:check`, and `vendor/bin/phpstan analyse` when dependencies are installed. Use `composer cs:fix` only when intentionally applying style rewrites.

## Coding Style & Naming Conventions

Follow the existing Laravel conventions: PSR-4 classes under `Pterodactyl\\`, request validation in `app/Http/Requests`, service-layer business logic in `app/Services`, and Eloquent models in `app/Models`. TypeScript uses strict mode, path aliases from `tsconfig.json`, 4-space indentation, semicolons, and single quotes. Prefer additive compatibility changes over rewrites so future Pterodactyl security patches remain easy to apply.

## Testing Guidelines

Add focused tests for migrations, authorization, API transformers, and service behavior when changing permissions, tenancy, or node/server data. For frontend changes, add or update Jest specs beside the affected modules. Always run the smallest relevant test first, then broaden to the full checks above when the change touches shared behavior.

## Commit & Pull Request Guidelines

Recent history uses short imperative subjects, often with prefixes such as `Fix:` or `bugfix:` and issue references. Keep commits scoped, describe security-sensitive compatibility risks, and call out migrations or operational steps in the PR body.

## Security & Configuration Tips

Never commit `.env`, secrets, node tokens, generated certificates, or production keys. Treat authentication, authorization, SFTP, websocket, and API-key changes as security-sensitive and preserve existing behavior unless a compatibility-safe migration is explicit.
