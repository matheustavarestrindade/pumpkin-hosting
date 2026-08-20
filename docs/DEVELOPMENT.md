# Development guide (read this first)

How to work on this repo without breaking things.

## Hard rules

1. **All builds run inside Docker.** No local toolchains (no cargo, no npm build).
   - Agent check: `docker run --rm -v hostingmc-cargo-registry:/usr/local/cargo/registry -v hostingmc-cargo-git:/usr/local/cargo/git -v "$PWD/agent":/work -w /work rust:1-slim cargo check`
   - Panel typecheck (local npm is fine for this): `cd panel && npm run check`
   - Real build: `docker compose build panel agent`
2. **Never commit `.env`.** It holds the Stripe test keys. `.env.example` has placeholders.
3. **Docs are the source of truth.** Update TODO.md when finishing work, DECISIONS.md
   when choosing a technology, FLOWS.md when adding a user-facing flow.

## Local stack

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d
```

Services: postgres (internal), panel (:3000), agent (127.0.0.1:3001), router (:25565).
The local override only publishes ports; Coolify deploys only docker-compose.yml.

Seed once after a fresh DB: `docker compose exec panel node scripts/seed.mjs`.

## Conventions

- Panel: SvelteKit 5 **runes mode** (`$state`, `$derived`, `$effect`). No legacy syntax.
- UI: shadcn-svelte components from `$lib/components/ui/<name>/`. Theme tokens in
  `app.css` (zinc dark, green primary). Never add gradients.
- Custom components live in `$lib/components/server/` or `app-sidebar.svelte`.
- Forms: SvelteKit form actions with `use:enhance`. JSON endpoints for client-side
  checks (e.g. `/api/subdomain`, `/api/mc-player`).
- AuthZ: every load/action/endpoint calls `requireUser(locals)`; every
  server-scoped query filters by `user_id` via `getOwnedServer` (404, not 403).
- Agent: axum handlers in routes.rs, Docker in docker.rs, DB in db.rs,
  reconcile loop in reconcile.rs. Errors log via tracing.

### Internationalization (i18n)

- Paraglide JS (`@inlang/paraglide-js`). Catalog: `panel/messages/en.json`.
- NEVER hardcode user-facing strings. Use `import * as m from '$lib/paraglide/messages'`
  and call `m.some_key()` (works in .svelte and server files; locale resolved by
  the middleware in hooks.server.ts).
- After editing en.json, `paraglide-js compile` runs automatically on
  `npm run check` / `npm run build` (pre-scripts).
- Add a locale later: add to `locales` in project.inlang/settings.json and create
  messages/<locale>.json with the same keys.

## Gotchas learned the hard way

1. **Postgres enums + sqlx**: cast to text in queries (`status::text as status`),
   or decoding to String fails silently.
2. **Agent empty responses**: endpoints returning `StatusCode::OK` have no body.
   The panel client must tolerate empty bodies (never bare `res.json()`).
3. **Pumpkin whitelist path**: `/pumpkin/data/whitelist.json`, NOT the volume root.
   Upload tar must include the `data/` dir entry (container may not have booted yet).
4. **bollard does not pull images**: agent calls `ensure_image` before create.
5. **SvelteKit CSRF**: form-action POSTs via curl need `Origin: http://localhost:3000`
   and a content-type of `application/x-www-form-urlencoded` (even empty: 415 otherwise).
6. **Layout guards do not protect form actions.** Guard every action explicitly.
7. **better-auth 1.7**: account table needs an `issuer` column.
8. **compose recreate drops the local override**: always pass both `-f` flags.

## Testing flows

- MC protocol ping (status request) through the router:
  `node <mc_ping.mjs>` script sends a handshake for a hostname to 127.0.0.1:25565
  and prints the status JSON. Verifies routing + Pumpkin config (MOTD, max players).
- Webhook test without a browser: sign a synthetic event with the webhook secret
  (HMAC-SHA256 of `t.payload`, header `t=...,v1=...`) and POST to
  `/api/stripe/webhook`. Verified activate + suspend + idempotency this way.
- Stripe real flow: card 4242 4242 4242 4242 in the hosted checkout.

## Agent API (internal, bearer token)

| endpoint | method | job |
|---|---|---|
| /health | GET | liveness |
| /api/servers | POST | create volume+container+labels, pull image, start |
| /api/servers/:id/start /stop | POST | power; start recreates if container missing |
| /api/servers/:id | DELETE | remove container (volume stays) |
| /api/servers/:id/settings | PUT | rewrite pumpkin.toml + whitelist, restart if running |
| /api/servers/:id/status | GET | running/stopped/missing |
| /api/servers/:id/world.zip | GET | /pumpkin as zip (works stopped) |

Reconcile loop (60s): orphan containers removed, missing running containers
recreated from volumes, grace-expired servers deleted (container+volume+row).
Fail-safe: aborts entirely if the DB query fails.
