import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = { title: "Sign in" };

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
      title="Welcome back"
      description="Sign in to your FinloNexa workspace"
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