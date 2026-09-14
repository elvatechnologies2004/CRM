import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { SignUpForm } from "@/components/auth/signup-form";
import { isEmailDeliveryConfigured } from "@/lib/email/provider";

export const metadata = { title: "Create account" };

export default async function SignUpPage() {
  const emailConfigured = isEmailDeliveryConfigured();
  return (
    <AuthShell
      title="Create your workspace"
      description="Start managing leads, deals, and revenue in one place."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
          {!emailConfigured && (
            <span className="mt-3 block text-xs text-muted-foreground">
              Email verification and transactional mail are disabled until a provider is configured.
            </span>
          )}
        </>
      }
    >
      <SignUpForm />
    </AuthShell>
  );
}