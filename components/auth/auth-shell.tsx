import * as React from "react";

import Image from "next/image";
import Link from "next/link";

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
   * Premium split layout (scenic backdrop + left branding column + right login card)
   * used ONLY by the login page. Defaults to the centered card so signup stays byte-identical.
   */
  variant?: "center" | "split";
  /** Left-hand branding column — only rendered when variant="split". */
  branding?: React.ReactNode;
  /** Top-right action (e.g. "New here? Create Account") — only in split mode. */
  asideAction?: React.ReactNode;
  /** Backdrop image used by the "center" variant (signup). Defaults to auth-backdrop.png. */
  background?: string;
}

/**
 * Shared auth frame.
 * "center" keeps the original centered auth card + scenic image backdrop for signup.
 * "split" renders the login page: the CSS lake/mountain scenic scene + navy branding
 * column + frosted login card, matching the FinloNexa reference.
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
  background = "/auth-backdrop.png",
}: AuthShellProps) {
  // Centered layout — original markup, unchanged (used by signup).
  if (variant === "center" || !branding) {
    return (
      <div className="relative flex min-h-svh w-full flex-col items-center justify-center overflow-hidden bg-ink px-4 py-10">
        {/* Backdrop image (signup) from public/{background} */}
        <Image
          src={background}
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

  // Split layout — login only, matching the FinloNexa reference.
  return (
    <div className="relative flex min-h-svh w-full flex-col overflow-hidden">
      {/* Sign-in scenic background — signin-bg.png */}
      <Image
        src="/signin-bg.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="select-none object-cover"
        aria-hidden
      />

      {/* Foreground content */}
      <div className="relative z-10 flex min-h-svh flex-col">
        {/* Body — hero left, glass card right (stacks below lg) */}
        <div className="flex flex-1 flex-col items-center justify-center gap-10 px-5 py-10 lg:flex-row lg:justify-normal lg:px-11">
          {branding ? (
            <div className="w-full flex-1 lg:pl-[5%] lg:pr-[60px]">{branding}</div>
          ) : null}

          {/* Right — frosted login card */}
          <div
            className={cn(
              "mx-auto w-full max-w-[452px] shrink-0 lg:-translate-x-[15%]",
              className
            )}
          >
            <div className="group relative overflow-hidden rounded-[24px] border border-white/70 bg-white/60 px-[42px] pb-[26px] pt-[30px] shadow-[0_24px_64px_rgba(0,20,60,0.2),0_4px_16px_rgba(0,0,0,0.07),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-[24px] backdrop-saturate-[1.4]">
              <div className="relative">
                <div className="mb-[22px] text-center">
                  <h2 className="mb-[6px] text-[25px] font-extrabold tracking-[-0.3px] text-[#0c1f3d]">
                    {title}
                  </h2>
                  {description ? (
                    <p className="text-[13.5px] text-[#6879a0]">{description}</p>
                  ) : null}
                </div>
                {children}
                {/* Auth links INSIDE the card — never floating below it */}
                {footer ? (
                  <div className="mt-[18px] text-center text-[13px] text-[#6879a0]">{footer}</div>
                ) : null}
                <p className="mt-[20px] border-t border-[#d5dff0]/60 pt-[16px] text-center text-[11px] font-medium uppercase tracking-[0.18em] text-[#6879a0]">
                  A product by
                  <span className="mt-[6px] flex justify-center">
                    <Image
                      src="/elva-logo.png"
                      alt="ELVA"
                      width={145}
                      height={58}
                      sizes="145px"
                      quality={100}
                      priority
                      className="object-contain"
                    />
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Page footer — tagline left, © + legal links right */}
        <footer className="flex w-full items-center justify-between gap-4 px-5 py-[14px] sm:px-11">
          {/* Bottom-left tagline — hairline + text */}
          <div className="flex items-center gap-3">
            <div aria-hidden className="h-[2px] w-[28px] bg-white/80" />
            <p className="text-[13px] font-normal text-[rgba(255,255,255,0.85)]">
              A Smarter CRM for a Brighter Tomorrow
            </p>
          </div>
          <nav className="flex items-center gap-[22px]">
            <span className="text-[12px] text-white/65">
              © 2026 FinloNexa. All rights reserved.
            </span>
            <Link href="/privacy" className="text-[12px] font-medium text-white/75 transition-colors hover:text-white">Privacy</Link>
            <Link href="/terms" className="text-[12px] font-medium text-white/75 transition-colors hover:text-white">Terms</Link>
            <Link href="/help" className="text-[12px] font-medium text-white/75 transition-colors hover:text-white">Help &amp; Support</Link>
          </nav>
        </footer>
      </div>
    </div>
  );
}