import "server-only";

import { getActiveOrgId } from "@/lib/crm/base";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { startWorkflowRun } from "@/lib/workflows/engine";
import type { WorkflowEvent } from "./types";

/**
 * Fire-and-forget event fan-out to every active workflow with a matching
 * trigger. Never throws — background automation must not break the
 * triggering request.
 */
export async function dispatchWorkflowEvent(event: WorkflowEvent["type"], payload?: Record<string, unknown>, note?: string): Promise<void> {
  try {
    const supabase = await createSupabaseServerClient();
    const organizationId = await getActiveOrgId(supabase);
    if (!organizationId) return;

    const subjectType =
      (payload?.subject_type as string | undefined) ??
      (payload?.subjectType as string | undefined) ??
      null;
    const subjectId =
      (payload?.subject_id as string | undefined) ??
      (payload?.subjectId as string | undefined) ??
      null;

    const { data: workflows } = await supabase
      .from("workflows")
      .select("id, name, definition, allow_loops, trigger_type")
      .eq("organization_id", organizationId)
      .eq("status", "active")
      .eq("trigger_type", event);

    for (const w of (workflows ?? []) as any[]) {
      await startWorkflowRun(w, {
        type: event,
        subjectType,
        subjectId,
        payload: { ...payload, _note: note, _event: event },
        organizationId,
      });
    }
  } catch {
    // background automation must never break the caller
  }
}