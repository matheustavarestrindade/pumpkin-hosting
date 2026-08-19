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
docker compose up -d postgres     # db only
cd panel
cp .env.example .env              # fill values
npm install
npm run db:push                   # create tables
npm run dev                       # http://localhost:5173
```

The agent needs Rust (`rustup`) for local dev, or it builds in Docker.

## Deploy

See [docs/COOLIFY.md](docs/COOLIFY.md).

## Docs

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - how the parts connect
- [docs/DECISIONS.md](docs/DECISIONS.md) - why we chose each technology
- [docs/FLOWS.md](docs/FLOWS.md) - every user flow (feature source of truth)
- [docs/DATABASE.md](docs/DATABASE.md) - schema reference
- [docs/TODO.md](docs/TODO.md) - build phases and status
- [docs/COOLIFY.md](docs/COOLIFY.md) - deployment guide
