import Link from "next/link";

import { BarChart3, ListChecks, Zap } from "lucide-react";

import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = { title: "Sign in" };

const FEATURES = [
  { icon: ListChecks, title: "Organize", subtitle: "Your Pipeline" },
  { icon: BarChart3, title: "Track", subtitle: "Performance" },
  { icon: Zap, title: "Automate", subtitle: "Growth" },
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const next = params.next ?? "/dashboard";
  const hasError = params.error === "auth";

  return (
    <AuthShell
      variant="split"
      title="Welcome Back"
      description="Sign in to your FinloNexa CRM account"
      asideAction={
        <div className="flex items-center gap-3">
          <span className="hidden text-sm font-medium text-white sm:inline">
            New here?
          </span>
          <Link
            href="/signup"
            className="inline-flex items-center rounded-full border border-white/60 bg-white/10 px-[18px] py-2.5 text-sm font-medium text-white backdrop-blur-md transition-colors hover:bg-white/20"
          >
            Create Account
          </Link>
        </div>
      }
      branding={
        <div className="flex flex-col">
          {/* Brand — FinloNexa / CRM, top-left, outside any card */}
          <div className="mb-16 flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
              F
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-lg font-bold tracking-tight text-[#0B183D]">
                FinloNexa
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#64748B]">
                CRM
              </span>
            </div>
          </div>

          {/* Headline — no box behind it. Localized gradient (in the shell) keeps it readable. */}
          <h1 className="max-w-2xl text-[clamp(3.5rem,4.9vw,4rem)] font-bold leading-[1.02] tracking-[-0.02em]">
            <span className="block text-[#0B183D]">Relationships</span>
            <span className="block text-[#7C8CFF]">Drive Revenue.</span>
          </h1>

          <p className="mt-6 max-w-[520px] text-[17px] leading-[1.55] text-[#33415F]">
            A modern CRM to manage leads, close deals and grow your business — all in one place.
          </p>

          {/* Compact 3-column feature row — icons only, no long descriptions */}
          <div className="mt-10 grid w-[min(540px,100%)] grid-cols-3 gap-x-8 gap-y-5">
            {FEATURES.map(({ icon: Icon, title, subtitle }) => (
              <div key={title} className="flex flex-col gap-2.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[rgba(124,140,255,0.22)] bg-[rgba(187,200,255,0.30)]">
                  <Icon className="h-5 w-5 text-[#7C8CFF]" aria-hidden />
                </div>
                <div className="text-[15px] font-semibold leading-snug text-[#0B183D]">
                  {title}
                  <br />
                  {subtitle}
                </div>
              </div>
            ))}
          </div>
        </div>
      }
      footer={
        <p className="text-sm text-[#475569]">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-semibold text-[#6577F3] hover:underline">
            Create Account
          </Link>
        </p>
      }
    >
      {hasError ? (
        <p className="rounded-lg bg-destructive/5 px-3.5 py-2.5 text-sm text-destructive">
          Something went wrong during authentication. Please try again.
        </p>
      ) : null}
      <LoginForm next={next} />
    </AuthShell>
  );
}
