"use client";

import { useRouter } from "next/navigation";
import { ChevronDown, CircleHelp, LogOut, Settings, UserRound } from "lucide-react";

import { InitialsAvatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/env";
import { useCurrentUser } from "@/lib/current-user";

function ProfileMenu() {
  const router = useRouter();
  const currentUser = useCurrentUser();
  const name = currentUser?.name ?? "Guest";
  const role = currentUser?.role ?? "Member";
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
          className="flex items-center gap-2 rounded-full p-1 outline-none focus-visible:ring-2 focus-visible:ring-ring/50 md:gap-2.5 md:pr-2"
          aria-label="Open profile menu"
        >
           <InitialsAvatar name={name} className="h-8 w-8" />
          <span className="hidden text-left md:flex md:flex-col">
            <span className="text-[13px] font-medium leading-tight text-ink">
              {name}
            </span>
            <span className="text-[11px] leading-tight text-muted-foreground">
              {role}
            </span>
          </span>
          <ChevronDown className="hidden h-3.5 w-3.5 text-muted-foreground md:block" aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold">{name}</span>
          <span className="text-xs font-normal text-muted-foreground">
            {email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              router.push("/profile");
            }}
          >
            <UserRound className="text-muted-foreground" aria-hidden />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              router.push("/settings");
            }}
          >
            <Settings className="text-muted-foreground" aria-hidden />
            <span>Settings</span>
            <DropdownMenuShortcut>⌘,</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              router.push("/help");
            }}
          >
            <CircleHelp className="text-muted-foreground" aria-hidden />
            <span>Help &amp; Support</span>
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
          <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { ProfileMenu };