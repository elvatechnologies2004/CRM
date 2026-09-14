# Post-Launch Operations & Feature Pipeline

> Phase 8 / Step 117+120. How new inbound arrives and becomes product.

## Feature-request & feedback pipeline

1. **Capture** — authenticated users submit via `/feedback` (bug / feedback /
   enhancement). Optional beta program at `/beta` (public).
2. **Storage** — rows land in `feedback` (org-scoped, RLS-guarded) and
   `beta_signups` (public form insert only).
3. **Triage** — a member with `admin`/`settings.manage` updates
   `feedback.status` (`open → triaged → done / wontfix`). Deliverables
   surface in the admin analytics flow.
4. **Roadmap** — enhancement requests are batched monthly; the `Updates`
   page (`/updates`) documents shipped changes. Nothing is shipped by
   marking an item "done" without a real release.

## Trial & paid onboarding flow

1. New workspace → `ensureWorkspace()` (org + Admin role + pipeline).
2. `/api/auth/onboard` → `ensureOrgSubscription(orgId)` idempotently starts
   a **14-day Pro trial**.
3. Dashboard shows the trial banner (days remaining) + activation checklist
   (`TrialBanner`, `ActivationCard`) so users hit early milestones.
4. Trial ≤3 days → `maybeSendTrialReminder()` (on billing page visit, 1/24h).
5. Trial ends → status `free`; dashboard nudges upgrade through the banner.
6. `createCheckoutSession` → Stripe Checkout → webhook confirms → entitlement
   upgrade is live, receipt email queued.

## Product analytics (post-launch metrics)

- `product_events` records allow-listed events (`app.opened`, `deal.won`,
  `billing.*`, etc.), org + user scoped, no body/PII.
- Org admins review `/settings/analytics` (14-day bars, top events, record
  counts).
- `/api/track` is the client entry; server side uses `trackEvent()`.

## Billing surveillance

- `/api/health` surfaces `stripe:` + `email:` config state.
- Watch `billing_webhook_events` for `failed` rows.
- `docs/billing-safety-checklist.md` gates going live; `docs/operations.md`
  has the runbook.

## Where the code lives (map)

| Concern | Entry points |
| --- | --- |
| Feedback/beta | `lib/beta/*`, `app/feedback`, `app/beta` |
| Trial & billing | `lib/billing/*`, `components/onboarding/trial-banner.tsx`, `app/settings/billing` |
| Analytics | `lib/analytics/*`, `app/api/track`, `app/settings/analytics` |
| Email | `lib/email/*`, `app/api/auth/onboard` (welcome), billing webhooks |
| CSV import | `lib/import/*`, `app/leads/import` |
| SEO | `app/sitemap.ts`, `app/robots.ts`, `middleware.ts` |
| Monitoring | `app/api/health`, `docs/operations.md` |