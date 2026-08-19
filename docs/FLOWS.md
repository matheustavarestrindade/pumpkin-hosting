# User flows (feature source of truth)

Status: [ ] todo, [~] in progress, [x] done

## Public

- [ ] F1 Landing page: features, pricing (one plan), CTA to signup.
- [ ] F2 Auth: register, login, password reset (better-auth, email + password).

## Onboarding

- [ ] F3 Empty dashboard shows a big "Create your first server" card.

## Server lifecycle

- [ ] F4 Create wizard:
  1. Name input -> live preview `name.domain.com` + availability check
     (`[a-z0-9-]`, reserved words blocked: www, api, panel, mail, app).
  2. Type cards with image: Survival / Creative / Hardcore / Flat.
  3. Plan card -> Stripe Checkout.
  4. Webhook activates -> status provisioning -> running -> address + copy button.
- [ ] F5 Dashboard: grid of server cards (status dot, address, players online, start/stop).
- [ ] F6 Server detail tabs:
  - Overview: status, address, uptime, players.
  - Settings: difficulty, PvP toggle, max players, gamemode, MOTD -> save -> agent applies.
  - Allowlist: on/off toggle, add/remove usernames.
  - World: download button (zip).
  - Billing: plan info, Stripe customer portal (card update, cancel).
  - Danger: delete server (type-the-name confirm).

## Billing edge flows

- [ ] F7 Payment failed -> grace -> `suspended` (card locked, "pay to reactivate") -> paid -> auto-reactivate.
- [ ] F8 Cancel -> server runs until period end -> suspended -> volume kept 7 days -> deleted by daily job.

## Account

- [ ] F9 Settings: change email/password, active sessions.

## Background (no UI)

- [ ] F10 Auto-sleep: empty 10 min -> agent stops server. Wake on join attempt (v2).
- [ ] F11 Reconcile loop (see ARCHITECTURE.md).

## Admin (owner only, minimal)

- [ ] F12 Nodes list (health from heartbeat), all servers list, basic stats.

## Error states (everywhere)

- Subdomain taken/invalid -> inline error.
- Node full -> "try again later" message.
- Server `error` state -> retry button.
