"use client";

import * as React from "react";
import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const createOptions: Array<{ label: string; href: string; icon: typeof Plus; shortcut: string }> = [
  { label: "New Dashboard Item", href: "/dashboard", icon: Plus, shortcut: "D" },
];

function CreateMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="h-9 gap-1.5 px-3 sm:px-4" aria-label="Create new">
          <Plus className="h-4 w-4" aria-hidden />
          <span className="hidden sm:inline">Create</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Create new</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {createOptions.map((option) => {
          const Icon = option.icon;
          return (
            <DropdownMenuItem key={option.label} asChild>
              <Link href={option.href} scroll={false}>
                <Icon className="text-muted-foreground" aria-hidden />
                <span>{option.label}</span>
                <DropdownMenuShortcut>{option.shortcut}</DropdownMenuShortcut>
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { CreateMenu };