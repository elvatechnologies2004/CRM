-- ============================================================
-- Step 52 — Automation Engine (run logs)
-- ============================================================

-- ---------------------------- automation_runs ---------------------------
-- Creates the table if not already exists (defensive)
-- Fields documented in spec step 12:
--   id, organization_id, automation_id, trigger_event, trigger_record_type, trigger_record_id
--   status (running|success|partial|failed|skipped), started_at, completed_at, error_message
--   run_id_text generated column for human-readable identification
--   unique constraint on (automation_id, trigger_record_type, trigger_record_id, organization_id)

-- ---------------------------- automation_run_steps ---------------------------
-- Individual step within a run
--   id, run_id, action_type, status (pending|processing|completed|failed|skipped)
--   input_payload, output_payload (jsonb), error_message, created_at

-- Unique constraint ensures duplicate execution protection:
--   one run per (automation, trigger record) combination