import { TasksPageClient } from "@/components/activities/tasks-page-client";
import { getActiveOrgId, fetchOwnerIndex } from "@/lib/crm/base";
import { getTasks } from "@/lib/crm/tasks";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { leadOwners } from "@/lib/mock-leads";
import { taskMocks } from "@/lib/mock-tasks";

export default async function TasksPage() {
  const result = await getTasks();
  let initialTasks = result.rows;
  let owners: string[] = leadOwners.map((o) => o.name);

  if (initialTasks.length > 0 && isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const organizationId = await getActiveOrgId(supabase);
    if (organizationId) {
      const index = await fetchOwnerIndex(supabase, organizationId);
      owners = Object.values(index).map(({ name }) => name);
    }
  }

  if (initialTasks.length === 0) initialTasks = taskMocks;

  return (
    <TasksPageClient initialTasks={initialTasks} owners={owners} />
  );
}