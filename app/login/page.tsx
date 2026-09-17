import Link from "next/link";

import { BarChart3, List, Zap } from "lucide-react";

import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = { title: "Sign in" };

const FEATURES = [
  { icon: List, title: "Organize", subtitle: "Your Pipeline" },
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
      branding={
        <div className="flex flex-col">
          {/* Headline — dark navy + blue accent, matches reference hero */}
          <h1 className="text-[clamp(42px,5.5vw,66px)] font-extrabold leading-[1.05] tracking-[-1.5px] text-[#081957]">
            Relationships
          </h1>
          <h1 className="mb-[22px] text-[clamp(42px,5.5vw,66px)] font-extrabold leading-[1.05] tracking-[-1.5px] text-[#5F7EF9]">
            Drive Revenue.
          </h1>

          <p className="mb-[42px] max-w-[380px] text-[17px] leading-[1.65] text-[#182d4e]">
            A modern CRM to manage leads, close deals and grow your business — all in one place.
          </p>

          {/* Feature cards — horizontal 3-column row, liquid-glass rectangles, auto width */}
          <div className="flex flex-col gap-[26px] md:flex-row md:gap-[18px]">
            {FEATURES.map(({ icon: Icon, title, subtitle }) => (
              <div key={title} className="flex items-center gap-[14px] rounded-[18px] border border-white/70 bg-white/40 px-[18px] py-[14px] shadow-[0_16px_40px_rgba(0,20,60,0.15),inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-[24px] backdrop-saturate-[1.4]">
                <div className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full border border-white/60 bg-white/50 backdrop-blur-[10px]">
                  <Icon strokeWidth={1.8} className="h-5 w-5 text-[#4a72e0]" aria-hidden />
                </div>
                <div className="flex flex-col whitespace-nowrap">
                  <span className="text-[15px] font-extrabold leading-tight text-[#081957]">
                    {title}
                  </span>
                  <span className="text-[12px] text-[#081957]">{subtitle}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      }
      footer={
        <p className="text-[13px] text-[#6879a0]">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-semibold text-[#4a72e0] hover:underline">
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