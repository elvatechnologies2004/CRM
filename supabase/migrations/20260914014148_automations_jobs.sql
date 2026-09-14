-- ============================================================
-- Step 52 — Automation Engine (delayed jobs)
-- ============================================================

-- ---------------------------- automation_jobs ---------------------------
-- Delayed / scheduled job queue for time-based actions
--   e.g., "Wait 2 days then create task" or "Wait until 9 AM tomorrow"
-- Fields per spec step 17:
--   id, organization_id, automation_id, run_id, action_id, execute_at
--   status (pending|processing|completed|failed|cancelled)
--   attempt_count (default 3 max), last_error
--   payload (jsonb) for action-specific data
--   created_at, updated_at

-- Indexes for scheduler:
--   organization_id for multi-tenant filtering
--   execute_at for finding due jobs
--   status for finding pending jobs to process