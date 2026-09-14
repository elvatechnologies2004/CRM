"use client";

import { useEffect, useState } from "react";
import { CircleHelp, Menu, Moon, PanelLeftClose, PanelLeftOpen, Sun } from "lucide-react";

import { CommandSearch } from "@/components/layout/command-search";
import { CreateMenu } from "@/components/layout/create-menu";
import { NotificationsMenu } from "@/components/layout/notifications-menu";
import { ProfileMenu } from "@/components/layout/profile-menu";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface TopNavbarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onOpenMobile: () => void;
}

function TopNavbar({
  collapsed,
  onToggleCollapse,
  onOpenMobile,
}: TopNavbarProps) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored = localStorage.getItem("theme") as "light" | "dark" | null;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = stored || (prefersDark ? "dark" : "light");
    setTheme(initialTheme);
    document.documentElement.classList.toggle("dark", initialTheme === "dark");
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b border-border bg-card/90 px-4 backdrop-blur-sm sm:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onOpenMobile}
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" aria-hidden />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="hidden lg:inline-flex"
        onClick={onToggleCollapse}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <PanelLeftOpen className="h-[18px] w-[18px]" aria-hidden />
        ) : (
          <PanelLeftClose className="h-[18px] w-[18px]" aria-hidden />
        )}
      </Button>

      <span className="hidden h-6 w-px bg-border md:block" aria-hidden />

      <div className="flex min-w-0 flex-1 items-center">
        <CommandSearch />
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
        <CreateMenu />

        <Separator
          orientation="vertical"
          className="mx-1 hidden h-6 sm:block"
        />

        <NotificationsMenu />

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
          className="lg:inline-flex hidden"
        >
          {theme === "light" ? (
            <Moon className="h-5 w-5" aria-hidden />
          ) : (
            <Sun className="h-5 w-5" aria-hidden />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          aria-label="Help and support"
          onClick={() => undefined}
        >
          <CircleHelp className="h-[18px] w-[18px]" aria-hidden />
        </Button>

        <Separator
          orientation="vertical"
          className="mx-1 hidden h-6 sm:block"
        />

        <ProfileMenu />
      </div>
    </header>
  );
}

export { TopNavbar };