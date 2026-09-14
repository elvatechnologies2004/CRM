-- ============================================================
-- Step 52 — Automation Engine (conditions & actions)
-- ============================================================

-- ---------------------------- automation_conditions ---------------------------
-- (Continued from previous migration - same table, additional constraints/indexes)
-- Types already defined in lib/types.ts:
--   AutomationConditionField: Lead Score, Owner, Source, Deal Value, Stage, Country, Tags, Company, Product, Days Inactive
--   AutomationCondition operator: > | < | = | != | contains | not contains

-- ---------------------------- automation_actions ---------------------------
-- (Continued from previous migration - same table, additional constraints/indexes)
-- Action types from lib/types.ts:
--   Assign Owner, Change Status, Create Task, Send Email, Send WhatsApp, Add Tag, Remove Tag,
--   Move Deal Stage, Add to Sequence, Create Notification, Update Field

-- Action config schemas (stored as JSON, validated at runtime):
-- create_task: { title, description, priority, owner_id, due_offset_minutes }
-- assign_owner: { user_id_or_placeholder }
-- change_status: { target_status }
-- move_deal_stage: { pipeline_id, stage_id }
-- add_tag: { tag_name }
-- remove_tag: { tag_name }
-- create_notification: { title, message, related_type, related_id, priority }
-- create_activity: { activity_type, title, description, related_type, related_id }
-- update_field: { field_name, value }

-- Indexes already created in previous migration:
--   automation_actions_automation_id_idx
--   automation_actions_type_idx

-- ============================================================
-- Idempotency: ensure we don't re-create tables if already present
-- (Supabase migrations are typically run sequentially, so this is defensive.)
-- ============================================================