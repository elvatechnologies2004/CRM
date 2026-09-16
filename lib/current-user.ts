"use client";

import { useEffect, useState } from "react";

import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { User } from "@/lib/types";

/**
 * Client-side hook that resolves the signed-in user from Supabase.
 * Returns `null` until the session is loaded (or when Supabase is not configured).
 */
export function useCurrentUser(): User | null {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!isSupabaseConfigured()) return;
      const supabase = createSupabaseBrowserClient();
      const { data: auth } = await supabase.auth.getUser();
      if (!active || !auth.user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("id, full_name, job_title, email, organization_id")
        .eq("id", auth.user.id)
        .maybeSingle();

      if (!active) return;

      const name =
        ((profile?.full_name as string) || auth.user.email || "").split("@")[0] || "Member";

      setUser({
        id: auth.user.id,
        name,
        role: (profile?.job_title as string) || "Member",
        email: (profile?.email as string) || auth.user.email || "",
        organizationId: (profile?.organization_id as string) || undefined,
      });
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  return user;
}
