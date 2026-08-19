# hosting-mc

Simple Minecraft hosting for players who do not know server hosting.
One click -> running vanilla server at `yourname.domain.com`.

## Stack

| Part | Tech | Job |
|---|---|---|
| panel | SvelteKit 5 (runes) + Tailwind 4 | user interface |
| db | Postgres + Drizzle | state, billing records |
| auth | better-auth | email + password login |
| agent | Rust (axum + bollard) | controls Docker, writes proxy config |
| proxy | mc-router | routes `name.domain.com` -> container (Docker discovery) |
| game | Pumpkin (Rust MC server) | the game servers |
| billing | Stripe | EUR 3/month subscription per server |
| deploy | Coolify (docker-compose) | hosting |

## Layout

```
panel/     SvelteKit app (UI, auth, Stripe, talks to agent)
agent/     Rust service (owns the Docker socket)
docs/      architecture, decisions, flows, database, todo, coolify guide
docker-compose.yml
```

## Local dev

Requirements: Docker, Node 20+.

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d
```

Open http://localhost:3000. Without Stripe keys the panel runs in dev mode:
servers activate immediately without payment.

## Test Stripe locally

```bash
brew install stripe/stripe-cli/stripe
stripe login
stripe products create --name "Friends" --description "Minecraft server for friends"
stripe prices create --product <prod_id> --currency eur --unit-amount 300 --recurring-interval month
```

Put `STRIPE_SECRET_KEY` (test key) and `STRIPE_PRICE_ID` (the `price_...` from above)
in `.env`, restart the panel, then forward webhooks:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
# copy the printed whsec_... into STRIPE_WEBHOOK_SECRET, restart panel again
```

Now creating a server redirects to a real Stripe test checkout. Use card
4242 4242 4242 4242, any future date, any CVC. The webhook activates the server.

## Deploy

See [docs/COOLIFY.md](docs/COOLIFY.md).

## Docs

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - how the parts connect
- [docs/DECISIONS.md](docs/DECISIONS.md) - why we chose each technology
- [docs/FLOWS.md](docs/FLOWS.md) - every user flow (feature source of truth)
- [docs/DATABASE.md](docs/DATABASE.md) - schema reference
- [docs/TODO.md](docs/TODO.md) - build phases and status
- [docs/COOLIFY.md](docs/COOLIFY.md) - deployment guide
