import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

/**
 * Ensures the authenticated user has an organization workspace.
 * Idempotent: if the user already has an active membership it returns
 * without creating anything (create_workspace is transactional and
 * self-guarding too).
 *
 * Uses sign-up metadata (first/last name, company) when available and
 * falls back to sensible defaults.
 */
export async function ensureWorkspace() {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const metadata = (user.user_metadata ?? {}) as {
    first_name?: string;
    last_name?: string;
    company?: string;
  };

  const { data: rpcData, error } = await supabase.rpc("create_workspace", {
    p_org_name: metadata.company || "My Workspace",
    p_first_name: metadata.first_name || user.email?.split("@")[0] || "",
    p_last_name: metadata.last_name || "",
    p_email: user.email ?? "",
  });

  if (error) {
    console.error("[workspace] create_workspace failed", error.message);
    return null;
  }

  return rpcData as string | null;
}