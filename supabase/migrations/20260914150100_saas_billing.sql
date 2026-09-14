-- ============================================================
-- Step 95 + Step 96 — SaaS plans, entitlements, billing
-- ------------------------------------------------------------
-- * plans                        — SaaS plan catalog (Free/Starter/Pro/Business)
-- * organization_subscriptions   — source of truth for an org's plan + trial
-- * billing_webhook_events        — idempotent webhook log
-- ============================================================

-- ------------------------------------------------------------------
-- plans
-- ------------------------------------------------------------------
create table public.plans (
  id                  uuid primary key default gen_random_uuid(),
  code                text not null unique,
  name                text not null,
  description         text,
  billing_mode        text not null default 'standard' check (billing_mode in ('free','standard','contact_sales')),
  monthly_price_cents integer not null default 0,
  yearly_price_cents  integer not null default 0,
  sort_order          integer not null default 0,
  is_active           boolean not null default true,
  entitlements        jsonb not null default '{}',
  limits              jsonb not null default '{}',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create trigger plans_set_updated_at before update on public.plans
  for each row execute function public.set_updated_at();

insert into public.plans (code, name, description, billing_mode, monthly_price_cents, yearly_price_cents, sort_order, entitlements, limits) values
  ('free',
   'Free',
   'For individuals getting started',
   'free', 0, 0, 0,
   '{"ai": false, "automations": false, "integrations": false, "apiAccess": false, "sequences": false, "reports": false}'::jsonb,
   '{"seats": 1, "contacts": 50, "deals": 10, "automations": 0, "storageGb": 0.5}'::jsonb),
  ('starter',
   'Starter',
   'For small teams starting to sell',
   'standard', 2900, 29000, 1,
   '{"ai": false, "automations": true, "integrations": true, "apiAccess": false, "sequences": true, "reports": false}'::jsonb,
   '{"seats": 3, "contacts": 500, "deals": 200, "automations": 5, "storageGb": 5}'::jsonb),
  ('pro',
   'Pro',
   'Everything your team needs to grow',
   'standard', 6900, 69000, 2,
   '{"ai": true, "automations": true, "integrations": true, "apiAccess": true, "sequences": true, "reports": true}'::jsonb,
   '{"seats": 10, "contacts": 5000, "deals": 2000, "automations": 50, "storageGb": 50}'::jsonb),
  ('business',
   'Business',
   'For organizations that need scale and control',
   'contact_sales', 0, 0, 3,
   '{"ai": true, "automations": true, "integrations": true, "apiAccess": true, "sequences": true, "reports": true, "sso": true, "audit": true}'::jsonb,
   '{"seats": -1, "contacts": -1, "deals": -1, "automations": -1, "storageGb": -1}'::jsonb);

-- ------------------------------------------------------------------
-- organization_subscriptions
-- The ONLY source of truth for an org's plan and trial state.
-- Updated exclusively by:
--   * Stripe webhooks (service role / verification)
--   * the billing server actions (server-side, validated)
-- Never trusts the browser. No INSERT/UPDATE/DELETE RLS policies
-- for regular members are created: writes go through service-role.
-- ------------------------------------------------------------------
create table public.organization_subscriptions (
  id                        uuid primary key default gen_random_uuid(),
  organization_id           uuid not null unique references public.organizations(id) on delete cascade,
  plan_id                   uuid not null references public.plans(id),
  provider                  text not null default 'stripe',
  provider_customer_id      text,
  provider_subscription_id  text unique,
  status                    text not null default 'trialing'
      check (status in ('trialing','active','past_due','canceled','incomplete','incomplete_expired','unpaid','paused','free')),
  billing_cycle             text not null default 'monthly' check (billing_cycle in ('monthly','yearly')),
  current_period_start      timestamptz,
  current_period_end        timestamptz,
  cancel_at_period_end      boolean not null default false,
  trial_started_at          timestamptz,
  trial_ends_at             timestamptz,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create index organization_subscriptions_org_idx on public.organization_subscriptions (organization_id);
create index organization_subscriptions_provider_idx on public.organization_subscriptions (provider_subscription_id);

create trigger organization_subscriptions_set_updated_at before update on public.organization_subscriptions
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------------
-- billing_webhook_events
-- Idempotency log for provider webhooks. provider_event_id is unique
-- per provider so duplicate deliveries never double-process.
-- Payload is stored redacted/minimal; never full card or raw secrets.
-- ------------------------------------------------------------------
create table public.billing_webhook_events (
  id                  uuid primary key default gen_random_uuid(),
  provider            text not null default 'stripe',
  provider_event_id   text not null,
  event_type          text not null,
  status              text not null default 'received'
      check (status in ('received','processing','processed','failed','ignored')),
  payload             jsonb,
  error_message       text,
  processed_at        timestamptz,
  created_at          timestamptz not null default now(),
  unique (provider, provider_event_id)
);

create index billing_webhook_events_status_idx on public.billing_webhook_events (status, provider, created_at desc);

-- ------------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------------
-- Plans are public catalog data: any authenticated member can read them.
alter table public.plans enable row level security;
create policy plans_select_auth on public.plans
  for select using (auth.role() = 'authenticated');

-- Subscriptions: members can read ONLY their org's row. No write policies.
alter table public.organization_subscriptions enable row level security;
create policy subscriptions_select_member on public.organization_subscriptions
  for select using (public.is_organization_member(organization_id));

-- Webhook log is system-only (no read/write policies for users).
alter table public.billing_webhook_events enable row level security;