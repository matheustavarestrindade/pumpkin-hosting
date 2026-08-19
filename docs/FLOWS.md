# User flows (feature source of truth)

Status: [ ] todo, [~] in progress, [x] done

## Public

- [x] F1 Landing page: features, pricing (one plan), CTA to signup.
- [x] F2 Auth: register, login (better-auth, email + password). Password reset: todo.

## Onboarding

- [x] F3 Empty dashboard shows a big "Create your first server" card.

## Server lifecycle

- [x] F4 Create wizard:
  1. Name input -> live preview `name.domain.com` + availability check
     (`[a-z0-9-]`, reserved words blocked: www, api, panel, mail, app).
  2. Type cards with image: Survival / Creative / Hardcore / Flat.
  3. Plan card -> Stripe Checkout (dev mode without keys: instant activation).
  4. Webhook activates -> status provisioning -> running -> address + copy button.
- [x] F5 Dashboard: grid of server cards (status dot, address, start/stop). Players online: todo (query).
- [x] F6 Server detail tabs:
  - Overview: status, address, players.
  - Settings: difficulty, PvP toggle, MOTD -> save -> agent applies (restart).
  - Allowlist (Friends tab): on/off toggle, add/remove usernames, UUIDs via Mojang API.
  - World: download button (zip).
  - Billing: plan info, Stripe portal, pay-now/reactivate.
  - Danger: delete server (type-the-name confirm).

## Billing edge flows

- [x] F7 Payment failed -> audit log; Stripe retries; cancel -> `suspended` -> reactivate via Billing tab.
- [x] F8 Cancel -> suspended -> volume kept 7 days -> agent sweep deletes container, volume and row.

## Account

- [ ] F9 Settings: change email/password, active sessions.

## Background (no UI)

- [ ] F10 Auto-sleep: empty 10 min -> agent stops server. Wake on join attempt (v2, mc-router autoscale).
- [x] F11 Reconcile loop (see ARCHITECTURE.md).

## Admin (owner only, minimal)

- [ ] F12 Nodes list (health from heartbeat), all servers list, basic stats.

## Error states (everywhere)

- Subdomain taken/invalid -> inline error.
- Node full -> "try again later" message.
- Server `error` state -> retry button.
