# Decisions (ADR log)

Newest first. One entry per decision. Never delete entries; mark superseded.

## D13 - Pumpkin whitelist lives at data/whitelist.json

- Status: accepted
- Found by inspection: Pumpkin creates `data/whitelist.json` (with ops.json,
  banned-*.json). Uploading to the volume root is ignored.
- The agent uploads a tar containing `data/` (dir entry) + `data/whitelist.json`.
- UUIDs are resolved via the Mojang API by the agent at write time.

## D12 - Stripe: R$10/month BRL, dev-mode bypass

- Status: accepted
- One plan "Friends" backed by the Stripe product "Teste" (R$10/month, test mode).
- If STRIPE_SECRET_KEY / STRIPE_PRICE_ID are missing, the panel runs in dev mode:
  servers activate instantly with no checkout. Lets us develop without Stripe.
- Invalid stored customer ids self-heal (verify with retrieve, recreate by email).
- Cancel flow: subscription.deleted -> suspended + deletion_scheduled_at = +7 days;
  the agent reconcile sweep deletes container + volume + row after the grace period.

## D11 - shadcn-svelte as the UI system

- Status: accepted
- Custom one-off components did not look professional enough.
- shadcn-svelte (bits-ui) with the dark zinc theme, green as primary, no gradients.
- Dashboard shell = sidebar (collapsible) + breadcrumb header.
- Custom components (ServerCard, TypeSelectCard, FriendsEditor, StatusDot) stay
  custom but built on shadcn primitives and tokens.
- Friends list UX: chip editor with Mojang validation and mc-heads.net avatars,
  not a raw textarea.

## D10 - mc-router instead of Infrared (supersedes D2)

- Status: accepted
- Context: code check showed Infrared v2 loads proxy configs once at startup.
  Adding a server would need a restart, dropping every connected player.
- mc-router discovers routes live from Docker events (`-in-docker`): game containers
  carry a `mc-router.host` label and are routable the moment they start. No config
  files, no restarts, no dropped connections.
- Bonus: built-in idle auto-sleep (`-auto-scale-up/-down`) and connect webhooks,
  both used for F10 in a later phase.
- Routing is stateless: orphan routes disappear with their container.

## D1 - Pumpkin as the game server

- Status: accepted
- Context: we need many small servers per machine.
- Benchmark (official docs, MC 1.21.1, 10 players): Pumpkin 27 MB RAM / ~1.5% CPU,
  Vanilla jar 2.2 GB / 24% CPU. ~80x less RAM.
- Risk: Pumpkin is pre-1.0. Mob AI, villagers, some redstone still WIP.
- Mitigation: image name is stored per server (`servers.image`). We can swap to the
  official jar or Paper per server with no rework.
- Decision: default image Pumpkin, design stays image-agnostic.

## D2 - Infrared for domain routing

- Status: superseded by D10
- Context: we need users to connect to `name.domain.com` with the default Minecraft port 25565.
- Minecraft TCP has no TLS/SNI. Traefik cannot route it by hostname.
  Infrared parses the MC handshake hostname and routes by it.
- DNS: one wildcard A record `*.domain.com` -> server IP.

## D3 - One container per server (not one big container)

- Status: accepted
- Containers are processes with isolation, not VMs. RAM is the same in both designs
  (N x ~27 MB). The kernel even shares image pages between containers.
- Per-container gives: cgroup limits, isolation between customers, per-world volumes,
  `docker stats` metrics, and crash of one server does not affect others.
- Decision: one container per server, one named volume per world.

## D4 - Rust agent owns the Docker socket

- Status: accepted
- The panel never touches Docker. The agent is the only component with the socket.
- Agent API is internal-only, protected by a shared bearer token.
- Chosen over SvelteKit-direct (dockerode) so we can later run agents on many machines.

## D5 - Postgres, not SQLite

- Status: accepted
- User choice. Also correct: multi-service stack, better-auth + Drizzle support it natively.

## D6 - better-auth for auth

- Status: accepted
- User choice. Email + password at launch, OAuth (Discord/Google) can be added later.

## D7 - One plan at launch

- Status: accepted
- One "Friends" plan, EUR 3/month, ~10 players. `plans` table supports more later
  without migration.

## D8 - Reconcile loop instead of trusting Coolify

- Status: accepted
- Coolify does not manage game containers. The agent reconciles Docker state with
  the DB every 60s: orphans are removed, missing containers are recreated from volumes.
- Coolify risk: its scheduled Docker cleanup can prune stopped containers.
  Mitigation: configure cleanup to dangling images only; worlds live in named
  volumes which prune never removes; reconcile recreates containers anyway.

## D9 - Docs-first repo

- Status: accepted
- README + docs/ (ARCHITECTURE, DECISIONS, FLOWS, DATABASE, TODO, COOLIFY) are the
  source of truth for AI sessions and humans. TODO.md and DECISIONS.md are updated
  as work lands.
