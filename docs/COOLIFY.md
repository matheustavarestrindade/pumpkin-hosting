# Deploying on Coolify

## Stack

One Coolify project, deploy type "Docker Compose" from this git repo.

| service | image | public |
|---|---|---|
| panel | built from ./panel | yes, https via Traefik (assign domain panel.domain.com) |
| agent | built from ./agent | no, internal only |
| postgres | postgres:17-alpine | no, internal only |
| router | itzg/mc-router | host port 25565 |

## Required env vars (set in Coolify UI)

- `POSTGRES_PASSWORD` - generated
- `BETTER_AUTH_SECRET` - generated (32+ chars)
- `BETTER_AUTH_URL` - https://panel.domain.com
- `PUBLIC_BASE_DOMAIN` - domain.com (used to build server addresses)
- `AGENT_TOKEN` - shared secret, panel <-> agent
- `NODE_ID` - uuid for this node (must match the seeded nodes row)
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID` - billing

## Coolify specifics

1. **Docker socket**: the compose mounts `/var/run/docker.sock` into `agent` (rw,
   creates game containers) and `router` (ro, discovery only).
   Coolify passes the compose file through as-is ("compose is the single source
   of truth"), so this works.
2. **Port 25565**: exposed via `ports:` in compose on the `router` service.
   This bypasses Traefik on purpose (raw TCP, no SNI in Minecraft).
3. **Docker cleanup**: in the Coolify server settings, make sure scheduled cleanup
   only removes dangling images, not stopped containers. If stopped game containers
   are pruned, the agent reconcile loop recreates them from their named volumes -
   but avoid the churn.
4. **Networks**: the compose defines `mc-net` with a fixed name. The agent puts
   game containers on it; the router discovers them by label.
5. **Panel boot**: the panel entrypoint runs `scripts/migrate.mjs` (SQL files in
   `panel/drizzle/`) before starting. Seed runs once manually:
   `docker compose exec panel node scripts/seed.mjs`.

## DNS

- `A *.domain.com -> server ip` (wildcard, for game subdomains)
- `A panel.domain.com -> server ip` (panel, handled by Traefik with auto-SSL)

## Order of first deploy

1. Push repo.
2. Create Coolify project from repo, set env vars.
3. Deploy. Postgres + agent + router start.
4. Panel runs migrations automatically on boot.
5. Seed the plan + node once: `docker compose exec panel node scripts/seed.mjs`.
6. Create a test server from the panel, verify `test.domain.com` connects.
