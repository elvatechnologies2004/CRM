"use client";

import { ArrowRight, CircleHelp, CreditCard, Settings, UserRound } from "lucide-react";
import Link from "next/link";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/lib/current-user";
import { getInitials } from "@/lib/utils";

function ProfilePageClient() {
  const currentUser = useCurrentUser();
  const name = currentUser?.name ?? "Guest";
  const email = currentUser?.email ?? "";
  const role = currentUser?.role ?? "Member";

  const quickLinks = [
    {
      label: "Account settings",
      description: "Manage your organization configuration and preferences.",
      href: "/settings",
      icon: Settings,
    },
    {
      label: "Billing & plan",
      description: "View invoices and manage your subscription plan.",
      href: "/settings/billing",
      icon: CreditCard,
    },
    {
      label: "Help & support",
      description: "Browse the help center or reach out to our team.",
      href: "/help",
      icon: CircleHelp,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Profile</h1>
          <p className="text-sm text-muted-foreground">
            Your account information and quick links.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-indigo-100 text-lg font-semibold text-indigo-700">
                {getInitials(name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold text-ink">{name}</p>
              <p className="truncate text-sm text-muted-foreground">{email}</p>
              <Badge variant="info" className="mt-1.5">
                {role}
              </Badge>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
          <div className="flex items-center gap-2">
            <UserRound className="h-4 w-4 text-muted-foreground" aria-hidden />
            <h2 className="text-sm font-semibold text-ink">Account details</h2>
          </div>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">Name</dt>
              <dd className="truncate text-ink">{name}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">Email</dt>
              <dd className="truncate text-ink">{email}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">Role</dt>
              <dd className="text-ink">{role}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
          <h2 className="text-sm font-semibold text-ink">Quick links</h2>
          <div className="mt-4 space-y-2">
            {quickLinks.map((link) => (
              <Button
                key={link.href}
                asChild
                variant="ghost"
                className="h-auto w-full justify-between gap-3 whitespace-normal py-2.5 text-left"
              >
                <Link href={link.href}>
                  <span className="flex items-center gap-2.5">
                    <link.icon className="h-4 w-4 text-muted-foreground" aria-hidden />
                    <span className="flex flex-col">
                      <span className="text-[13px] font-medium text-ink">{link.label}</span>
                      <span className="text-xs font-normal text-muted-foreground">
                        {link.description}
                      </span>
                    </span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                </Link>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export { ProfilePageClient };