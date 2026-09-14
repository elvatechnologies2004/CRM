# Billing Safety Checklist — go-live gate

> Step 109 / Phase 7. Do NOT flip billing to live keys until every item
> here is green. Billing is currently safe & fail-closed (no keys configured).

## Fail-closed guarantees (already implemented)
- [x] No `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` → `createCheckoutSession`
      returns a clear error; nothing is charged.
- [x] `/api/webhooks/stripe` returns `503` when the webhook secret is missing.
- [x] Browsers returning from checkout **never** mark a subscription active —
      only provider webhooks / verified API reads do.
- [x] `billing_webhook_events` dedupes by `(provider, provider_event_id)` —
      Stripe retries are safe.
- [x] Payment errors are surfaced to the user (past_due shown, portal link).
- [x] No client code holds prices or plan ids as source of truth — plans load
      from the DB (`plans` table) with a static fallback for dev.
- [x] Client never sees secret/price-id envs.

## Pre-launch (test mode) — required
- [ ] Create Stripe products + prices for starter/pro (monthly + yearly).
- [ ] Set `STRIPE_SECRET_KEY` (`sk_test_…`) and register the webhook
      endpoint with test-mode signing secret.
- [ ] Set price IDs in env (4 values).
- [ ] Run a test checkout with the test card `4242 4242 4242 4242`:
      - Checkout opens and completes.
      - Webhook row lands in `billing_webhook_events`.
      - `organization_subscriptions` reflects `active`.
      - Entitlements upgrade immediately (Pro limits).
      - Receipt email logged (skipped unless email configured).
- [ ] Cancel subscription via Stripe portal → `canceled` status, `cancel_at_period_end`.
- [ ] Re-activate via portal → `active`.
- [ ] Simulate `invoice.payment_failed` → status flips `past_due`, alert queued.
- [ ] Confirm nobody can start two subscriptions per org (unique org_id).

## Post-launch surveillance (first 2 weeks)
- [ ] Monitor `/api/health` every 5 min.
- [ ] Watch `billing_webhook_events` for `failed` rows on the dashboard.
- [ ] Verify each paid invoice creates one receipt email.
- [ ] Refund policy live & linked (coming with legal review).

## Incident notes
- If a webhook fails to apply, the DB row keeps `status=failed`; Stripe
  retries for most subscription events, and `docs/operations.md` documents
  manual reconciliation via the admin dashboard.