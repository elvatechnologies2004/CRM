"use client";

import { useRouter } from "next/navigation";
import { LayoutDashboard, LogOut, ShieldCheck } from "lucide-react";

import { platformRoleLabels } from "@/components/admin/admin-nav";
import { InitialsAvatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/env";
import { useCurrentUser } from "@/lib/current-user";

export function AdminProfileMenu({
  role,
  className,
}: {
  role: string;
  className?: string;
}) {
  const router = useRouter();
  const currentUser = useCurrentUser();
  const name = currentUser?.name ?? "Platform Admin";
  const email = currentUser?.email ?? "";

  async function handleSignOut() {
    try {
      if (isSupabaseConfigured()) {
        const supabase = createSupabaseBrowserClient();
        await supabase.auth.signOut();
      }
    } finally {
      router.push("/login");
      router.refresh();
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={`flex items-center gap-2 rounded-full p-1 outline-none focus-visible:ring-2 focus-visible:ring-ring/50 ${className ?? ""}`}
          aria-label="Open platform admin menu"
        >
          <InitialsAvatar name={name} className="h-8 w-8" />
          <span className="hidden text-left md:flex md:flex-col">
            <span className="text-[13px] font-medium leading-tight text-ink">
              {name}
            </span>
            <span className="text-[11px] leading-tight text-muted-foreground">
              {platformRoleLabels[role] ?? role}
            </span>
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold">{name}</span>
          <span className="text-xs font-normal text-muted-foreground">
            {email}
          </span>
          <span className="mt-1 inline-flex w-fit items-center gap-1 rounded-full bg-brand-purple/10 px-2 py-0.5 text-[11px] font-medium text-[#6d28d9]">
            <ShieldCheck className="h-3 w-3" aria-hidden />
            {platformRoleLabels[role] ?? role}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              router.push("/dashboard");
            }}
          >
            <LayoutDashboard className="text-muted-foreground" aria-hidden />
            <span>Back to CRM</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault();
            void handleSignOut();
          }}
          className="gap-2 text-destructive focus:text-destructive focus:bg-destructive/10"
        >
          <LogOut className="text-destructive" aria-hidden />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}