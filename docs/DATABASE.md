# Database schema (Postgres + Drizzle)

better-auth owns: `user`, `session`, `account`, `verification`. We do not touch them.
Our tables:

## plans

| column | type | notes |
|---|---|---|
| id | uuid pk | default gen_random_uuid() |
| name | text | e.g. "Friends" |
| price_cents | int | |
| currency | text | default 'eur' |
| max_players | int | |
| mem_mb | int | container limit, 256 |
| cpu_millicores | int | container limit, 500 = half core |
| stripe_price_id | text | |
| active | bool | default true |

## nodes

| column | type | notes |
|---|---|---|
| id | uuid pk | |
| name | text | |
| api_url | text | internal, e.g. http://agent:3000 |
| api_token | text | shared secret for agent auth |
| max_servers | int | capacity cap |
| status | enum | active / draining / offline |
| last_seen_at | timestamptz | agent heartbeat |
| created_at | timestamptz | |

## servers

| column | type | notes |
|---|---|---|
| id | uuid pk | |
| user_id | fk -> user.id | |
| node_id | fk -> nodes.id | |
| plan_id | fk -> plans.id | |
| name | text | display name |
| subdomain | text unique | `[a-z0-9-]`, reserved list checked in code |
| type | enum | survival / creative / hardcore / flat |
| image | text | default 'ghcr.io/pumpkin-mc/pumpkin:master' |
| container_id | text null | set by agent |
| volume_name | text | `world-<id>` |
| status | enum | provisioning / stopped / starting / running / stopping / error / suspended |
| settings | jsonb | `{ difficulty, pvp, max_players, gamemode, motd, allowlist: string[] }` |
| stripe_subscription_id | text null | |
| last_activity_at | timestamptz | for auto-sleep |
| deletion_scheduled_at | timestamptz null | 7-day grace |
| created_at | timestamptz | |
| updated_at | timestamptz | |

Indexes: servers(user_id), servers(node_id), servers(status).

## stripe_events (webhook idempotency)

| column | type |
|---|---|
| id | text pk (stripe event id) |
| type | text |
| processed_at | timestamptz |

## audit_log

| column | type |
|---|---|
| id | uuid pk |
| user_id | fk -> user.id null |
| server_id | fk -> servers.id null |
| action | text |
| meta | jsonb |
| created_at | timestamptz |

## Default settings per type

| type | difficulty | gamemode | pvp |
|---|---|---|---|
| survival | normal | survival | on |
| creative | peaceful | creative | off |
| hardcore | hard | survival | on |
| flat | peaceful | creative | off |
