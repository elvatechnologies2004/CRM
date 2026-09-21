-- ============================================================
-- FinloNexa CRM — Phase 3: RSM Proposal Approval Workflow
--
-- Adds the RSM approval lifecycle to the existing `quotes`
-- (proposals) module. The customer-facing `status` field is
-- NOT touched (Draft / Sent / Viewed / Accepted / Rejected /
-- Expired keep their current meaning). The approval lifecycle
-- lives in a separate `approval_status` column:
--
--   not_submitted            → Draft
--   pending_rsm_approval     → Pending RSM Approval
--   approved                 → Approved
--   returned_for_revision    → Returned for Revision
--
-- A proposal may only be sent (status = 'Sent') once it has been
-- approved by an RSM inside the caller's Phase-2 sales scope. That
-- gate is enforced server-side by the application layer (defense in
-- depth) and never trusted from client input.
--
-- Additive + idempotent. No DROP TABLE, no data reset, no
-- destructive change. Phase-1 and Phase-2 migrations are untouched.
-- ============================================================

alter table public.quotes
  add column if not exists approval_status text not null default 'not_submitted'
    check (approval_status in ('not_submitted','pending_rsm_approval','approved','returned_for_revision')),
  add column if not exists submitted_for_approval_at timestamptz,
  add column if not exists submitted_by uuid,
  add column if not exists approved_at timestamptz,
  add column if not exists approved_by uuid,
  add column if not exists rejected_at timestamptz,
  add column if not exists rejected_by uuid,
  add column if not exists rejection_reason text,
  add column if not exists approval_cycle integer not null default 0
    check (approval_cycle >= 0);

-- RSM approval queue lookup: issue + pending + oldest-submission-first.
create index if not exists quotes_approval_queue_idx
  on public.quotes (organization_id, approval_status, submitted_for_approval_at asc)
  where approval_status = 'pending_rsm_approval';

-- Fast scoping/status filters on the approval metadata.
create index if not exists quotes_approval_status_idx
  on public.quotes (approval_status);