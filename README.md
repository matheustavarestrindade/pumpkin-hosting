# hosting-mc

Simple Minecraft hosting for players who do not know server hosting.
One click -> running vanilla server at `yourname.domain.com`.

## Stack

| Part | Tech | Job |
|---|---|---|
| panel | SvelteKit 5 (runes) + Tailwind 4 + shadcn-svelte | user interface |
| db | Postgres 17 + Drizzle | state, billing records |
| auth | better-auth 1.7 | email + password login |
| agent | Rust (axum + bollard) | owns the Docker socket, manages game containers |
| proxy | mc-router | routes `name.domain.com` -> container via Docker label discovery |
| game | Pumpkin (Rust MC server) | the game servers |
| billing | Stripe | R$ 10/month subscription per server (product "Teste" in test mode) |
| deploy | Coolify (docker-compose) | hosting |

## Layout

```
panel/               SvelteKit app (UI, auth, Stripe, talks to agent)
  src/lib/components/ui/        shadcn-svelte components
  src/lib/components/server/    custom: ServerCard, TypeSelectCard, FriendsEditor, StatusDot
  src/lib/components/app-sidebar.svelte   dashboard shell
  src/lib/server/               db (drizzle), agent client, stripe, guard
agent/               Rust service (only component with the Docker socket)
  src/main.rs routes.rs docker.rs db.rs reconcile.rs config.rs auth.rs state.rs
docs/                ARCHITECTURE, DECISIONS, FLOWS, DATABASE, TODO, COOLIFY, DEVELOPMENT
docker-compose.yml            production stack (Coolify)
docker-compose.local.yml      local dev ports (never deployed)
```

## Local dev

Requirements: Docker, Node 20+.

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d
```

Open http://localhost:3000. Migrations run automatically on panel boot.
Seed plan + node once: `docker compose exec panel node scripts/seed.mjs`.

Without Stripe keys the panel runs in dev mode: servers activate immediately
without payment.

## Test Stripe locally

A test product "Teste" (R$10/month) already exists in the Stripe test account.
Put the keys in `.env`, restart the panel, then forward webhooks:

```bash
brew install stripe/stripe-cli/stripe
stripe listen --api-key sk_test_... --forward-to localhost:3000/api/stripe/webhook
# copy the printed whsec_... into STRIPE_WEBHOOK_SECRET, restart panel
```

Creating a server now redirects to a real Stripe test checkout.
Test card: 4242 4242 4242 4242, any future date, any CVC.

## Deploy

See [docs/COOLIFY.md](docs/COOLIFY.md).

## Docs

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - how the parts connect
- [docs/DECISIONS.md](docs/DECISIONS.md) - why we chose each technology (ADR log)
- [docs/FLOWS.md](docs/FLOWS.md) - every user flow (feature source of truth)
- [docs/DATABASE.md](docs/DATABASE.md) - schema reference
- [docs/TODO.md](docs/TODO.md) - build phases and status
- [docs/COOLIFY.md](docs/COOLIFY.md) - deployment guide
- [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) - how to work on this repo (read first)
