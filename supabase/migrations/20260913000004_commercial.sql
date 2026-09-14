-- ============================================================
-- Step 51 — Commercial & operational tables
-- ============================================================

-- --------------------------- meetings -------------------------
create table public.meetings (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  title             text not null,
  meeting_type      text,
  start_at          timestamptz not null,
  end_at            timestamptz,
  owner_id          uuid,
  location          text,
  meeting_url       text,
  related_type      text,
  related_id        uuid,
  status            text default 'scheduled' check (status in ('scheduled','in_progress','completed','cancelled','no_show','rescheduled')),
  notes             text,
  outcome           text,
  created_by        uuid,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index meetings_organization_id_idx on public.meetings (organization_id);
create index meetings_owner_id_idx on public.meetings (owner_id);
create index meetings_start_at_idx on public.meetings (start_at);

-- ----------------------------- calls --------------------------
create table public.calls (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  contact_id        uuid,
  company_id        uuid,
  deal_id           uuid,
  owner_id          uuid,
  direction         text default 'Outbound' check (direction in ('Inbound','Outbound')),
  outcome           text,
  started_at        timestamptz not null default now(),
  duration_seconds  integer check (duration_seconds >= 0),
  notes             text,
  created_at        timestamptz not null default now()
);

create index calls_organization_id_idx on public.calls (organization_id);
create index calls_owner_id_idx on public.calls (owner_id);
create index calls_started_at_idx on public.calls (started_at desc);

-- --------------------------- products -------------------------
create table public.products (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  name              text not null,
  sku               text,
  type              text default 'Product' check (type in ('Product','Service','Subscription')),
  category          text,
  description       text,
  unit_price        numeric not null default 0 check (unit_price >= 0),
  currency          text default 'USD',
  tax_rate          numeric default 0 check (tax_rate >= 0),
  status            text default 'Active' check (status in ('Active','Inactive')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index products_organization_id_idx on public.products (organization_id);

-- ------------------------ deal_products ------------------------
-- Snapshots: product changes do not alter historical deal value.
create table public.deal_products (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  deal_id           uuid not null references public.deals(id) on delete cascade,
  product_id        uuid references public.products(id) on delete set null,
  name_snapshot     text,
  quantity          numeric not null default 1 check (quantity > 0),
  unit_price        numeric not null default 0 check (unit_price >= 0),
  discount_amount   numeric not null default 0 check (discount_amount >= 0),
  tax_amount        numeric not null default 0 check (tax_amount >= 0),
  subtotal          numeric not null default 0 check (subtotal >= 0),
  created_at        timestamptz not null default now()
);

create index deal_products_organization_id_idx on public.deal_products (organization_id);
create index deal_products_deal_id_idx on public.deal_products (deal_id);

-- ---------------------------- quotes --------------------------
create table public.quotes (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  quote_number      text,
  company_id        uuid,
  contact_id        uuid,
  deal_id           uuid,
  status            text default 'Draft' check (status in ('Draft','Sent','Viewed','Accepted','Rejected','Expired')),
  issue_date        date default current_date,
  expiry_date       date,
  currency          text default 'USD',
  subtotal          numeric not null default 0 check (subtotal >= 0),
  discount_total    numeric not null default 0 check (discount_total >= 0),
  tax_total         numeric not null default 0 check (tax_total >= 0),
  total             numeric not null default 0 check (total >= 0),
  terms             text,
  notes             text,
  created_by        uuid,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index quotes_organization_id_idx on public.quotes (organization_id);
create index quotes_company_id_idx on public.quotes (company_id);
create index quotes_deal_id_idx on public.quotes (deal_id);
create unique index quotes_number_org_idx on public.quotes (organization_id, quote_number) where quote_number is not null;

-- ------------------------- quote_items ------------------------
create table public.quote_items (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  quote_id          uuid not null references public.quotes(id) on delete cascade,
  product_id        uuid references public.products(id) on delete set null,
  description       text,
  quantity          numeric not null default 1 check (quantity > 0),
  unit_price        numeric not null default 0 check (unit_price >= 0),
  discount_amount   numeric not null default 0 check (discount_amount >= 0),
  tax_amount        numeric not null default 0 check (tax_amount >= 0),
  line_total        numeric not null default 0 check (line_total >= 0),
  position          integer not null default 0
);

create index quote_items_organization_id_idx on public.quote_items (organization_id);
create index quote_items_quote_id_idx on public.quote_items (quote_id);

-- --------------------------- invoices -------------------------
create table public.invoices (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  invoice_number    text,
  company_id        uuid,
  contact_id        uuid,
  deal_id           uuid references public.deals(id) on delete set null,
  quote_id          uuid references public.quotes(id) on delete set null,
  status            text default 'Draft' check (status in ('Draft','Sent','Partial','Paid','Overdue','Cancelled')),
  issue_date        date default current_date,
  due_date          date,
  currency          text default 'USD',
  subtotal          numeric not null default 0 check (subtotal >= 0),
  discount_total    numeric not null default 0 check (discount_total >= 0),
  tax_total         numeric not null default 0 check (tax_total >= 0),
  total             numeric not null default 0 check (total >= 0),
  paid_amount       numeric not null default 0 check (paid_amount >= 0),
  balance           numeric not null default 0 check (balance >= 0),
  notes             text,
  created_by        uuid,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index invoices_organization_id_idx on public.invoices (organization_id);
create index invoices_company_id_idx on public.invoices (company_id);
create index invoices_deal_id_idx on public.invoices (deal_id);
create unique index invoices_number_org_idx on public.invoices (organization_id, invoice_number) where invoice_number is not null;

-- ------------------------ invoice_items -----------------------
create table public.invoice_items (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  invoice_id        uuid not null references public.invoices(id) on delete cascade,
  product_id        uuid references public.products(id) on delete set null,
  description       text,
  quantity          numeric not null default 1 check (quantity > 0),
  unit_price        numeric not null default 0 check (unit_price >= 0),
  discount_amount   numeric not null default 0 check (discount_amount >= 0),
  tax_amount        numeric not null default 0 check (tax_amount >= 0),
  line_total        numeric not null default 0 check (line_total >= 0),
  position          integer not null default 0
);

create index invoice_items_organization_id_idx on public.invoice_items (organization_id);
create index invoice_items_invoice_id_idx on public.invoice_items (invoice_id);

-- --------------------------- payments -------------------------
create table public.payments (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  invoice_id        uuid references public.invoices(id) on delete set null,
  amount            numeric not null check (amount >= 0),
  currency          text default 'USD',
  method            text,
  status            text default 'Completed' check (status in ('Completed','Pending','Failed','Refunded')),
  reference         text,
  paid_at           timestamptz not null default now(),
  recorded_by       uuid,
  created_at        timestamptz not null default now()
);

create index payments_organization_id_idx on public.payments (organization_id);
create index payments_invoice_id_idx on public.payments (invoice_id);

-- --------------------------- projects -------------------------
create table public.projects (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  name              text not null,
  company_id        uuid,
  contact_id        uuid,
  source_deal_id    uuid references public.deals(id) on delete set null,
  owner_id          uuid,
  status            text default 'Not Started',
  start_date        date,
  target_date       date,
  budget            numeric check (budget >= 0),
  currency          text default 'USD',
  progress          numeric default 0 check (progress between 0 and 100),
  created_by        uuid,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index projects_organization_id_idx on public.projects (organization_id);
create index projects_company_id_idx on public.projects (company_id);
create index projects_owner_id_idx on public.projects (owner_id);

-- ------------------------ support_tickets ---------------------
create table public.support_tickets (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  ticket_number     text,
  subject           text not null,
  description       text,
  contact_id        uuid,
  company_id        uuid,
  deal_id           uuid,
  project_id        uuid references public.projects(id) on delete set null,
  priority          text default 'Medium',
  status            text default 'New',
  category          text,
  owner_id          uuid,
  created_by        uuid,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  resolved_at       timestamptz,
  closed_at         timestamptz
);

create index support_tickets_organization_id_idx on public.support_tickets (organization_id);
create index support_tickets_company_id_idx on public.support_tickets (company_id);
create index support_tickets_owner_id_idx on public.support_tickets (owner_id);
create unique index support_tickets_number_org_idx on public.support_tickets (organization_id, ticket_number) where ticket_number is not null;

-- ------------------------ subscriptions -----------------------
create table public.subscriptions (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  company_id        uuid,
  contact_id        uuid,
  plan_name         text,
  amount            numeric check (amount >= 0),
  currency          text default 'USD',
  billing_cycle     text default 'Monthly',
  start_date        date,
  renewal_date      date,
  status            text default 'Active',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index subscriptions_organization_id_idx on public.subscriptions (organization_id);
create index subscriptions_company_id_idx on public.subscriptions (company_id);

-- ------------------------ notifications -----------------------
create table public.notifications (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  user_id           uuid not null references auth.users(id) on delete cascade,
  type              text,
  title             text not null,
  message           text,
  related_type      text,
  related_id        uuid,
  is_read           boolean not null default false,
  created_at        timestamptz not null default now()
);

create index notifications_user_idx on public.notifications (organization_id, user_id, is_read);
create index notifications_created_at_idx on public.notifications (created_at desc);

-- ------------------------- attachments ------------------------
create table public.attachments (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  record_type       text,
  record_id         uuid,
  file_name         text not null,
  file_path         text not null,
  mime_type         text,
  size_bytes        bigint check (size_bytes >= 0),
  uploaded_by       uuid,
  created_at        timestamptz not null default now()
);

create index attachments_org_idx on public.attachments (organization_id);
create index attachments_record_idx on public.attachments (record_type, record_id);

-- ---------------------- document_sequences --------------------
-- Used by next_document_number() to generate QUO-/INV-/SUP- numbers
-- without collisions (Step 75).
create table public.document_sequences (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  kind              text not null, -- 'quote' | 'invoice' | 'ticket'
  last_value        integer not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (organization_id, kind)
);

-- ------------------- updated_at triggers -----------------------
create trigger meetings_set_updated_at before update on public.meetings
  for each row execute function public.set_updated_at();
create trigger products_set_updated_at before update on public.products
  for each row execute function public.set_updated_at();
create trigger quotes_set_updated_at before update on public.quotes
  for each row execute function public.set_updated_at();
create trigger invoices_set_updated_at before update on public.invoices
  for each row execute function public.set_updated_at();
create trigger projects_set_updated_at before update on public.projects
  for each row execute function public.set_updated_at();
create trigger support_tickets_set_updated_at before update on public.support_tickets
  for each row execute function public.set_updated_at();
create trigger subscriptions_set_updated_at before update on public.subscriptions
  for each row execute function public.set_updated_at();