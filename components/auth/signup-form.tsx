"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Building2, CheckCircle2, Loader2, Lock, Mail, User, UserRound } from "lucide-react";

import { Alert, AlertDescription } from "@/components/crm/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/env";
import { supabaseEnv } from "@/lib/env";

export function SignUpForm() {
  const router = useRouter();
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [company, setCompany] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [checkEmail, setCheckEmail] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isSupabaseConfigured()) {
      setError("Supabase is not configured. Add credentials to .env.local to enable signup.");
      return;
    }

    setLoading(true);
    try {
      const appUrl = (supabaseEnv.url ? "" : process.env.NEXT_PUBLIC_APP_URL) ||
        process.env.NEXT_PUBLIC_APP_URL ||
        window.location.origin;
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            company,
            full_name: `${firstName} ${lastName}`.trim(),
          },
          emailRedirectTo: `${appUrl}/auth/callback?next=/dashboard`,
        },
      });

      if (error) {
        setError(error.message);
        return;
      }

      if (data.session) {
        // Email confirmation is disabled — session exists immediately. Run the
        // workspace bootstrap in the background instead of blocking navigation.
        void fetch("/api/auth/onboard", { method: "POST", cache: "no-store" }).catch(() => {});
        router.replace("/dashboard");
      } else {
        setCheckEmail(true);
      }
    } finally {
      setLoading(false);
    }
  }

  if (checkEmail) {
    return (
      <div className="space-y-4">
        <Alert tone="success">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <AlertDescription>
              Almost there! Check <strong>{email}</strong> to confirm your account. After
              confirming, your workspace will be created automatically.
            </AlertDescription>
          </div>
        </Alert>
        <Button type="button" variant="outline" className="w-full" onClick={() => setCheckEmail(false)}>
          Back
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error ? (
        <Alert tone="error">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="signup-first-name" className="text-[13px] font-semibold text-[#182d4e]">
            First name
          </Label>
          <div className="relative">
            <User
              className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#b0bcd4]"
              aria-hidden
            />
            <Input
              id="signup-first-name"
              required
              placeholder="Ayesha"
              className="h-[47px] w-full rounded-[9px] border-[1.5px] border-[#d5dff0] bg-white/92 pl-11 pr-4 text-[13.5px] text-[#0c1f3d] placeholder:text-[#aab6d0] focus-visible:border-[#4a72e0] focus-visible:ring-[3px] focus-visible:ring-[rgba(74,114,224,0.12)]"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="signup-last-name" className="text-[13px] font-semibold text-[#182d4e]">
            Last name
          </Label>
          <div className="relative">
            <UserRound
              className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#b0bcd4]"
              aria-hidden
            />
            <Input
              id="signup-last-name"
              required
              placeholder="Siddiqui"
              className="h-[47px] w-full rounded-[9px] border-[1.5px] border-[#d5dff0] bg-white/92 pl-11 pr-4 text-[13.5px] text-[#0c1f3d] placeholder:text-[#aab6d0] focus-visible:border-[#4a72e0] focus-visible:ring-[3px] focus-visible:ring-[rgba(74,114,224,0.12)]"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-company" className="text-[13px] font-semibold text-[#182d4e]">
          Company / workspace
        </Label>
        <div className="relative">
          <Building2
            className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#b0bcd4]"
            aria-hidden
          />
          <Input
            id="signup-company"
            placeholder="Acme Inc."
            className="h-[47px] w-full rounded-[9px] border-[1.5px] border-[#d5dff0] bg-white/92 pl-11 pr-4 text-[13.5px] text-[#0c1f3d] placeholder:text-[#aab6d0] focus-visible:border-[#4a72e0] focus-visible:ring-[3px] focus-visible:ring-[rgba(74,114,224,0.12)]"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-email" className="text-[13px] font-semibold text-[#182d4e]">
          Work email
        </Label>
        <div className="relative">
          <Mail
            className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#b0bcd4]"
            aria-hidden
          />
          <Input
            id="signup-email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@company.com"
            className="h-[47px] w-full rounded-[9px] border-[1.5px] border-[#d5dff0] bg-white/92 pl-11 pr-4 text-[13.5px] text-[#0c1f3d] placeholder:text-[#aab6d0] focus-visible:border-[#4a72e0] focus-visible:ring-[3px] focus-visible:ring-[rgba(74,114,224,0.12)]"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-password" className="text-[13px] font-semibold text-[#182d4e]">
          Password
        </Label>
        <div className="relative">
          <Lock
            className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#b0bcd4]"
            aria-hidden
          />
          <Input
            id="signup-password"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            placeholder="At least 6 characters"
            className="h-[47px] w-full rounded-[9px] border-[1.5px] border-[#d5dff0] bg-white/92 pl-11 pr-4 text-[13.5px] text-[#0c1f3d] placeholder:text-[#aab6d0] focus-visible:border-[#4a72e0] focus-visible:ring-[3px] focus-visible:ring-[rgba(74,114,224,0.12)]"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      </div>

      <Button
        type="submit"
        className="h-[48px] w-full rounded-[9px] bg-[#4a72e0] text-[15px] font-bold text-white shadow-[0_10px_24px_rgba(74,114,224,0.35)] transition-colors hover:bg-[#3d61cc] disabled:opacity-60"
        disabled={loading}
      >
        {loading ? <Loader2 className="h-[18px] w-[18px] animate-spin" /> : null}
        {loading ? "Creating account…" : "Create account"}
      </Button>

      {/* Divider */}
      <div className="relative flex items-center gap-4 py-2">
        <div className="h-px flex-1 bg-[#d5dff0]" />
        <span className="text-[12px] text-white">or continue with</span>
        <div className="h-px flex-1 bg-[#d5dff0]" />
      </div>

      {/* Google sign-in */}
      <Button
        type="button"
        onClick={async () => {
          setError(null);
          if (!isSupabaseConfigured()) {
            setError("Supabase is not configured. Add credentials to .env.local to enable signup.");
            return;
          }
          setLoading(true);
          try {
            const supabase = createSupabaseBrowserClient();
            const { error } = await supabase.auth.signInWithOAuth({
              provider: "google",
              options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/dashboard")}` },
            });
            if (error) setError(error.message);
          } finally {
            setLoading(false);
          }
        }}
        className="h-[48px] w-full rounded-[9px] border border-[#d5dff0] bg-white/92 text-[15px] font-bold text-[#0c1f3d] shadow-sm transition-colors hover:bg-white disabled:opacity-60"
        disabled={loading}
      >
        <svg className="mr-2 h-[18px] w-[18px]" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
        Sign up with Google
      </Button>
    </form>
  );
}