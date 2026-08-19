# Architecture

## Big picture

```
Players --:25565--> mc-router --hostname--> game container (Pumpkin)
                        ^                    ^
                        | Docker events      | Docker socket
Browser --https--> panel (SvelteKit) --> Postgres
                        |
                        v
                     agent (Rust) --> Docker socket
                        |-- creates game containers on mc-net
                        |-- labels them mc-router.host=name.domain.com
                        '-- reconcile loop (orphan cleanup)
```

## Components

### panel (SvelteKit)

- Public landing + pricing.
- Auth via better-auth (its own tables: user, session, account, verification).
- App tables via Drizzle: plans, nodes, servers, stripe_events, audit_log.
- Stripe Checkout for subscriptions, webhook for activation/suspension.
- Never touches Docker directly. All game actions go through the agent API.

### agent (Rust, axum + bollard)

- Only component with access to `/var/run/docker.sock`.
- HTTP API on the internal docker network only. Auth: shared `AGENT_TOKEN` bearer token.
- Endpoints: create/start/stop/delete server, apply settings, status, world zip.
- Creates one named volume per server (`world-<id>`).
- Labels game containers `mc-router.host=<subdomain>.<base domain>`; mc-router discovers them live.
- Reconcile loop every 60s (see below).

### mc-router

- Listens on host port 25565 (only public game port).
- Reads the hostname from the Minecraft handshake, routes to the right container.
- Runs with `-in-docker`: watches Docker events and routes any container labeled
  `mc-router.host=<full domain>` to that container's IP on `mc-net`.
- No config files. Routes appear and disappear with containers. Adding a server
  never touches existing player connections.
- Read-only Docker socket mount.

### Game containers

- Image: `ghcr.io/pumpkin-mc/pumpkin:master` (stored per server in `servers.image`, swappable).
- Limits: `mem 256m`, `cpus 0.5` (from plan).
- Labels: `hostingmc=managed`, `hostingmc.server_id=<uuid>`, `hostingmc.subdomain`,
  `mc-router.host=<subdomain>.<base domain>`.
- Network: `mc-net` (created by compose, ensured by the agent). No host ports.
- Pumpkin reads `/pumpkin/pumpkin.toml`, which the agent generates from `servers.settings`.

## Networks

| network | who | why |
|---|---|---|
| coolify proxy net | panel | Traefik routes https to the panel |
| stack internal | panel, agent, postgres, router | service-to-service by name |
| mc-net | router + game containers | game traffic, fixed name `mc-net` |

## Reconcile loop (orphan protection)

The agent runs this every 60 seconds and once at startup:

1. List containers with label `hostingmc=managed`.
2. Compare with the `servers` table for this node.
3. Container exists but no DB row -> stop + remove (orphan). Its route disappears
   automatically (mc-router discovery).
4. DB says `running` but container missing -> recreate from named volume.
5. DB says `stopped` but container runs -> stop it.

World data lives in named volumes, so container loss never means world loss.

## Scaling

v1 = one node. The `nodes` table and the agent HTTP API already support more:
add a machine, run the agent + mc-router there, insert a row in `nodes`,
the panel picks the least-loaded active node on server creation.
