# Operations, Monitoring & Release Guide

> Step 110 / Phase 4. Living internal doc for anyone operating Relvo.

## Health & monitoring

- **Liveness/readiness:** `GET /api/health`
  - Returns `200` with `status: "ok"` when everything critical is healthy.
  - Returns `503` with `status: "degraded"` when a dependency is degraded.
  - Reports per-dependency state for `supabase`, `database`, `stripe`, `email`.
  - Stripe/email can be `skipped` (not configured) without degrading the
    service — the app is designed to run fully without them in dev/preview.
- **Recommended probes:**
  - Uptime Robot / Betterstack / Cronitor hitting `/api/health` every 1–5 min.
  - Alert on `status != ok` for more than 2 consecutive intervals.

## Release process (documented)

1. **Branch + feature** — develop on a branch, keep `main` green.
2. **Checks (local)**
   - `npm run lint`
   - `npm run typecheck` (or `npx tsc --noEmit`)
   - `npm run build` — must print `Compiled successfully`.
   - `npm test` if a test script is configured.
3. **Migrations** — new Supabase migration files must be applied through the
   SQL Editor as a single paste (no local CLI in this project). Apply *before*
   deploying code that depends on the new tables.
4. **Deploy** — push to the hosting provider (Vercel); the production build
   runs `next start`. Never deploy code that references tables/policies that
   have not been migrated.
5. **Post-deploy smoke tests**
   - `/` renders the marketing home.
   - `/login` and `/dashboard` work for a real org.
   - End-to-end: create a lead → create a deal → move stage → dashboard reflects it.
   - `POST /api/health` returns 200.
   - If billing configured: run a real checkout in test mode, confirm the
     webhook `billing_webhook_events` row appears and the subscription row
     updates in `organization_subscriptions`.

## Rollback

- **Code:** re-deploy the previous commit/version.
- **Data:** we avoid destructive migrations. If a new table is unused, drop
  it via SQL Editor. Schema changes go forward-only; data backup before
  migrating is recommended via Supabase dashboard backup.

## Error handling / escalation

- The app fails closed on billing/email when unconfigured — a user gets a
  clear message, never a fake success.
- Webhooks are idempotent (`billing_webhook_events` unique on
  `(provider, provider_event_id)`); retries are safe.
- To a production engineer: check `/api/health`, then Supabase dashboard
  (RLS / policies), then provider dashboards (Stripe/Resend) before
  investigating app logs.

## Secrets

- Never commit `.env.local`.
- `.env.example` documents required/present keys.
- Product events and transactional email logs intentionally exclude body
  content and PII.