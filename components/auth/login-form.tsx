"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";

import { Alert, AlertDescription } from "@/components/crm/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/env";

export function LoginForm({ next = "/dashboard" }: { next?: string }) {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [remember, setRemember] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isSupabaseConfigured()) {
      setError("Supabase is not configured. Add credentials to .env.local to enable login.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        return;
      }

      // Bootstrap workspace in the background; the signed-in session is already
      // valid and navigation should not block on a second server round-trip.
      void fetch("/api/auth/onboard", { method: "POST", cache: "no-store" }).catch(() => {});
      router.replace(next);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error ? (
        <Alert tone="error">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {/* Email — reference: 1.5px #d5dff0 border, radius 9, icon left, focus #4a72e0 */}
      <div className="space-y-2">
        <Label htmlFor="login-email" className="text-[13px] font-semibold text-[#182d4e]">
          Email Address
        </Label>
        <div className="relative">
          <Mail
            className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#b0bcd4]"
            aria-hidden
          />
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@company.com"
            className="h-[47px] w-full rounded-[9px] border-[1.5px] border-[#d5dff0] bg-[rgba(255,255,255,0.92)] pl-11 pr-4 text-[13.5px] text-[#0c1f3d] placeholder:text-[#aab6d0] focus-visible:border-[#4a72e0] focus-visible:ring-[3px] focus-visible:ring-[rgba(74,114,224,0.12)]"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </div>

      {/* Password — reference: 1.5px #d5dff0 border, radius 9, lock icon, eye toggle */}
      <div className="space-y-2">
        <Label htmlFor="login-password" className="text-[13px] font-semibold text-[#182d4e]">
          Password
        </Label>
        <div className="relative">
          <Lock
            className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#b0bcd4]"
            aria-hidden
          />
          <Input
            id="login-password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            placeholder="Enter your password"
            className="h-[47px] w-full rounded-[9px] border-[1.5px] border-[#d5dff0] bg-[rgba(255,255,255,0.92)] pl-11 pr-11 text-[13.5px] text-[#0c1f3d] placeholder:text-[#aab6d0] focus-visible:border-[#4a72e0] focus-visible:ring-[3px] focus-visible:ring-[rgba(74,114,224,0.12)]"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#aab6d0] transition-colors hover:text-[#0c1f3d]"
            aria-label={showPassword ? "Hide password" : "Show password"}
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-[18px] w-[18px]" aria-hidden />
            ) : (
              <Eye className="h-[18px] w-[18px]" aria-hidden />
            )}
          </button>
        </div>
      </div>

      {/* Remember me + Forgot password — INSIDE the card */}
      <div className="flex items-center justify-between text-sm">
        <label className="flex cursor-pointer select-none items-center gap-2 text-[#182d4e]">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="h-4 w-4 rounded-[5px] border-[#d5dff0] accent-[#4a72e0]"
          />
          <span className="text-[13px]">Remember me</span>
        </label>
        <Link
          href="/forgot-password"
          className="text-[13px] font-semibold text-[#4a72e0] hover:underline"
        >
          Forgot password?
        </Link>
      </div>

      {/* Sign In — reference: solid #4a72e0, radius 9, 15px/700, ArrowRight */}
      <Button
        type="submit"
        className="h-[48px] w-full rounded-[9px] bg-[#4a72e0] text-[15px] font-bold text-white shadow-[0_10px_24px_rgba(74,114,224,0.35)] transition-colors hover:bg-[#3d61cc] disabled:opacity-60"
        disabled={loading}
      >
        {loading ? <Loader2 className="h-[18px] w-[18px] animate-spin" /> : null}
        {loading ? "Signing in..." : "Sign In"}
        {loading ? null : <ArrowRight className="h-[18px] w-[18px]" />}
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
            setError("Supabase is not configured. Add credentials to .env.local to enable login.");
            return;
          }
          setLoading(true);
          try {
            const supabase = createSupabaseBrowserClient();
            const { error } = await supabase.auth.signInWithOAuth({
              provider: "google",
              options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
            });
            if (error) setError(error.message);
          } finally {
            setLoading(false);
          }
        }}
        className="h-[48px] w-full rounded-[9px] border border-white/70 bg-white/40 text-[15px] font-bold text-[#0c1f3d] shadow-[0_8px_20px_rgba(0,20,60,0.12),inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-[20px] backdrop-saturate-[1.4] transition-colors hover:bg-white/60 disabled:opacity-60"
        disabled={loading}
      >
        <svg className="mr-2 h-[18px] w-[18px]" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
        Sign in with Google
      </Button>
    </form>
  );
}
