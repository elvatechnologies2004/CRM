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
      {/* FROZEN: soft ink scrim so foreground stays readable over any part of the image */}
      <div
        className="absolute inset-0"
        style={{ background: "rgba(2, 10, 35, 0.35)" }}
        aria-hidden
      />

      {/* Top-right Create Account (outside the card, glass outline) */}
      {asideAction ? (
        <div className="relative z-10 flex w-full max-w-[1600px] justify-end">
          {asideAction}
        </div>
      ) : null}

      {/* Two-column composition */}
      <div className="relative z-10 grid w-full max-w-[1600px] flex-1 grid-cols-1 items-center gap-10 py-4 lg:grid-cols-[1.05fr_1fr]">
        {/* LEFT — premium branding */}
        <div className="flex flex-col justify-center">{branding}</div>

        {/* RIGHT — premium glass login card */}
        <div
          className={cn(
            "mx-auto flex w-full flex-col justify-center",
            className
          )}
          style={{ maxWidth: "min(560px, 100%)" }}
        >
          <Card className="rounded-[1.875rem] border-white/55 bg-white/80 shadow-[0_24px_60px_-20px_rgba(124,140,255,0.4),inset_0_1px_0_0_rgba(255,255,255,0.72)] backdrop-blur-xl">
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
    </div>
  );
}