import * as React from "react";

import Image from "next/image";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AuthShellProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  /**
   * Premium split layout (branding column + right login card) used ONLY by the
   * login page. Defaults to the centered card so signup stays byte-identical.
   */
  variant?: "center" | "split";
  /** Left-hand premium branding column — only rendered when variant="split". */
  branding?: React.ReactNode;
  /** Top-right action (e.g. "New here? Create Account") — only in split mode. */
  asideAction?: React.ReactNode;
}

/**
 * Shared auth frame. The scenic background (Image + ink scrim) is the FROZEN,
 * correct implementation — do not replace, brighten, or overlay it.
 * "center" keeps the original centered auth card for signup; "split" renders
 * the premium two-column login layout with the exact same background.
 */
export function AuthShell({
  title,
  description,
  children,
  footer,
  className,
  variant = "center",
  branding,
  asideAction,
}: AuthShellProps) {
  // Centered layout — original markup, unchanged (used by signup).
  if (variant === "center" || !branding) {
    return (
      <div className="relative flex min-h-svh w-full flex-col items-center justify-center overflow-hidden bg-ink px-4 py-10">
        {/* FROZEN: shared auth backdrop (login + signup) from public/auth-backdrop.png */}
        <Image
          src="/auth-backdrop.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="select-none object-cover"
          aria-hidden
        />
        {/* FROZEN: soft ink scrim so the card stays readable over any part of the image */}
        <div
          className="absolute inset-0"
          style={{ background: "rgba(2, 10, 35, 0.35)" }}
          aria-hidden
        />

        <div className={cn("relative z-10 w-full max-w-md", className)}>
          <div className="mb-8 flex items-center justify-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
              F
            </div>
            <div className="text-xl font-semibold tracking-tight text-ink">FinloNexa CRM</div>
          </div>

          <Card className="rounded-2xl border-border shadow-sm">
            <CardHeader className="space-y-1.5 pb-6">
              <CardTitle className="text-2xl font-semibold tracking-tight text-ink">
                {title}
              </CardTitle>
              {description ? (
                <CardDescription className="text-sm text-muted-foreground">
                  {description}
                </CardDescription>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-4">{children}</CardContent>
          </Card>

          {footer ? (
            <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>
          ) : null}
        </div>
      </div>
    );
  }

  // Premium split layout — login only. Background stays identical to center mode.
  return (
    <div className="relative flex min-h-svh w-full flex-col items-center justify-between overflow-hidden bg-ink px-6 py-6 sm:px-8 lg:px-12">
      {/* FROZEN: scenic auth backdrop (login + signup) from public/auth-backdrop.png — do not replace, recolor, darken or blur. */}
      <Image
        src="/auth-backdrop.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="select-none object-cover"
        aria-hidden
      />
      {/* SOLVED LOCALLY: readability is handled by a soft light gradient behind ONLY the
          branding text (left column) — not by darkening the backdrop. */}

      {/* Top-right — "New here?" + glass Create Account (separate) */}
      {asideAction ? (
        <div className="relative z-10 flex w-full justify-end">
          {asideAction}
        </div>
      ) : null}

      {/* Grid — premium branding column (desktop/tablet) + centered glass card.
          Column heights are stretched so the left hero centerlines with the card. */}
      <div className="relative z-10 grid w-full flex-1 grid-cols-1 items-stretch gap-10 lg:grid-cols-[1.02fr_1fr]">
        {/*
          LEFT — premium branding column.
          On mobile the full column is hidden; the logo + card stay centered instead.
          Height is anchored inside so logo pins top, hero stays center, tagline pins bottom.
        */}
        <div className="relative hidden h-full flex-col lg:flex">
          {/* NON-CARD readability gradient — opaque rectangle REMOVED. This is a plain
              90deg white wipe that fades to transparent (no radius, border, shadow or blur),
              covers only the text column, and lets the scenic image show through. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0"
            style={{
              width: "52%",
              background:
                "linear-gradient(90deg, rgba(244,247,253,0.55) 0%, rgba(244,247,253,0.28) 55%, rgba(244,247,253,0) 100%)",
            }}
          />
          <div className="relative">{branding}</div>
        </div>

        {/* RIGHT — premium glass login card */}
        <div
          className={cn(
            "mx-auto flex w-full flex-col justify-center",
            className
          )}
          style={{ maxWidth: "min(520px, 100%)" }}
        >
          {/* Mobile logo — keeps the brand visible when the branding column is hidden */}
          <div className="mb-6 flex items-center justify-center gap-2.5 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              F
            </div>
            <div className="text-lg font-semibold tracking-tight text-ink">FinloNexa CRM</div>
          </div>

          <Card className="rounded-[1.75rem] border-[rgba(255,255,255,0.65)] bg-[rgba(244,247,253,0.88)] shadow-[0_24px_70px_-24px_rgba(124,140,255,0.45),0_8px_28px_-14px_rgba(2,10,35,0.18),inset_0_1px_0_0_rgba(255,255,255,0.8)] backdrop-blur-[22px]">
            <CardHeader className="space-y-1.5 px-9 pb-6 pt-9">
              <CardTitle className="text-2xl font-semibold tracking-tight text-ink">
                {title}
              </CardTitle>
              {description ? (
                <CardDescription className="text-sm text-[#475569]">{description}</CardDescription>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-4 px-9 pb-7">{children}</CardContent>
            {/* Auth links INSIDE the card — never floating below it */}
            {footer ? (
              <div className="px-9 pb-9 pt-3 text-center text-sm text-[#475569]">{footer}</div>
            ) : null}
          </Card>
        </div>
      </div>
    </div>
  );
} 