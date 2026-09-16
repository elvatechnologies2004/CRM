import Link from "next/link";

import { BarChart3, ListChecks, Zap } from "lucide-react";

import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = { title: "Sign in" };

const FEATURES = [
  {
    icon: ListChecks,
    title: "Organize Your Pipeline",
    description: "Stage every deal visually so nothing slips through the cracks.",
  },
  {
    icon: BarChart3,
    title: "Track Performance",
    description: "Follow revenue, conversion, and team activity in real time.",
  },
  {
    icon: Zap,
    title: "Automate Growth",
    description: "Remove busywork with clean automation from lead to close.",
  },
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
      title="Welcome back"
      description="Sign in to your FinloNexa workspace"
      asideAction={
        <Link
          href="/signup"
          className="inline-flex items-center gap-1.5 rounded-full border border-white/55 bg-white/10 px-5 py-2.5 text-sm font-medium text-ink backdrop-blur-xl transition-colors hover:bg-white/20"
        >
          New here? Create Account
        </Link>
      }
      branding={
        <div className="flex flex-col">
          {/* Logo — top-left, outside the card */}
          <div className="mb-12 flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
              F
            </div>
            <div className="text-xl font-semibold tracking-tight text-ink">FinloNexa CRM</div>
          </div>

          {/* Headline — Midnight + Nexa Blue */}
          <h1 className="max-w-2xl text-[clamp(3rem,5vw,4.5rem)] font-bold leading-[1.02] tracking-[-0.02em]">
            <span className="block text-ink">Relationships</span>
            <span className="block text-primary">Drive Revenue.</span>
          </h1>

          <p className="mt-6 max-w-md text-lg leading-relaxed text-muted-foreground">
            A modern CRM to manage leads, close deals and grow your business — all in one place.
          </p>

          {/* Feature list — translucent circles + soft glass */}
          <ul className="mt-10 space-y-5">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <li key={title} className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/40 bg-white/15 text-primary backdrop-blur-xl">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <div className="font-semibold text-ink">{title}</div>
                  <div className="mt-0.5 text-sm text-muted-foreground">{description}</div>
                </div>
              </li>
            ))}
          </ul>

          {/* Bottom hairline + tagline */}
          <div className="mt-12 border-t border-white/40 pt-6">
            <p className="text-sm font-medium tracking-wide text-ink">
              A Smarter CRM for a Brighter Tomorrow
            </p>
          </div>
        </div>
      }
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Create one
          </Link>
          {" · "}
          <Link href="/forgot-password" className="font-medium text-primary hover:underline">
            Forgot password?
          </Link>
        </>
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
