# TODO - build phases

Status: [ ] todo, [~] in progress, [x] done

## Phase 1 - Scaffold

- [x] Docs (README, ARCHITECTURE, DECISIONS, FLOWS, DATABASE, TODO, COOLIFY)
- [x] SvelteKit + Tailwind 4 scaffold in `panel/`
- [x] Drizzle + Postgres schema (see DATABASE.md)
- [x] better-auth setup
- [x] Base UI components (Button, Card, Badge, Input, Toggle, Dialog)
- [x] Landing, login, register, dashboard, create wizard, server detail tabs

## Phase 2 - Agent

- [x] Rust axum skeleton in `agent/`
- [x] Docker lifecycle: create/start/stop/delete/status (bollard)
- [x] Reconcile loop
- [x] pumpkin.toml + whitelist.json generator from settings jsonb
- [x] Routing via container labels (mc-router discovery)

## Phase 3 - Deploy

- [x] docker-compose.yml (panel, agent, postgres, router)
- [x] Dockerfile panel (adapter-node), Dockerfile agent (multi-stage)
- [x] Panel production build verified in Docker
- [x] E2E verified locally: wizard create -> agent -> container -> mc-router route ->
      real Minecraft status ping returns our MOTD/max-players; power stop/start;
      settings apply; delete; orphan cleanup; reconcile fail-safe
- [ ] Coolify deploy + docs/COOLIFY.md verified on real server
- [ ] Wildcard DNS check

## Phase 4 - Panel UI

- [ ] Landing + pricing (F1)
- [ ] Auth pages (F2)
- [ ] Dashboard + server cards (F3, F5)
- [ ] Create wizard (F4, Stripe part mocked until Phase 5)
- [ ] Server detail tabs (F6)

## Phase 5 - Stripe

- [x] Checkout session on create (dev mode bypass without keys)
- [x] Webhook: activate on checkout.session.completed (idempotent via stripe_events)
- [x] Suspend on customer.subscription.deleted + 7-day grace sweep in agent
- [x] Reactivate via new checkout (Billing tab)
- [x] Customer portal (Billing tab)
- [ ] Tested with real Stripe CLI webhooks (needs `stripe login`, see README)

## Phase 6 - World download

- [x] Agent: zip volume endpoint (tar from container -> zip stream)
- [x] Panel: download button (F6 World tab)
- [x] Route protection audit: requireUser + ownership filter on every action,
      cross-user and anonymous tested (404 / redirect)

## Phase 7 - Hardening

- [ ] Auto-sleep (F10)
- [ ] Admin page (F12)
- [ ] Load test with bot clients on real hardware; set final plan limits
- [ ] Reserved subdomain list finalized
- [ ] Backups job (world volumes -> S3)
