# Launch Checklist — Relvo CRM

> Phase 7 deliverable. Run this before any production GA.

## 1. Infrastructure
- [ ] Production Supabase project configured with `NEXT_PUBLIC_SUPABASE_URL`/key.
- [ ] All migrations applied via SQL Editor (including `20260914150200…`).
- [ ] Domain / `NEXT_PUBLIC_APP_URL` set in production env.
- [ ] `/api/health` returns 200 in production.

## 2. Identity & access
- [ ] Email confirmation enabled on Supabase Auth (unless deliberately off).
- [ ] Seat/role limits enforced; RLS policies verified for every table.
- [ ] Test: new signup → workspace → invite member → permission-restricted user cannot read other tenants.

## 3. Billing (enable only after Stripe live keys + prices exist)
- [ ] `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` set; webhook endpoint registered on Stripe dashboard.
- [ ] Price IDs set for starter/pro (monthly + yearly).
- [ ] Webhook for `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.*` enabled.
- [ ] Test in test-mode: checkout → webhook row in `billing_webhook_events` → `organization_subscriptions` updates → entitlement reflects paid plan.
- [ ] Refund / cancellation path works and is documented.

## 4. Email (enable only after a provider key exists)
- [ ] `RESEND_API_KEY` + `RESEND_FROM_EMAIL` set.
- [ ] Welcome email on signup, receipt on `invoice.paid`, payment-failed alert.
- [ ] Verify transactional email log rows land in `transactional_email_logs`.
- [ ] Domain verified for sending (SPF/DKIM) in provider dashboard.

## 5. Content & legal
- [ ] Privacy, Terms, Cookies, Acceptable-Use reviewed by legal (currently editorial drafts).
- [ ] Optimized marketing pages + sitemap/robots live.
- [ ] Beta program page reachable.

## 6. Security & compliance
- [ ] No secrets in client code; only `NEXT_PUBLIC_*` exposed.
- [ ] CSP/headers reviewed (middleware).
- [ ] Audit log works for user-facing record changes (Steps 55/86).
- [ ] Data export/delete flow available to org admins.

## 7. Ops
- [ ] `/api/health` monitor configured (Uptime Robot / Betterstack).
- [ ] `.env.example` matches `.env.local` keys.
- [ ] `docs/operations.md` runbook shared with on-call.

## 8. Post-launch
- [ ] Metrics capture verified (product_events increasing).
- [ ] Feedback pipeline live (`/feedback`).
- [ ] CSV import + paid onboarding available on GA.