import { MarketingHeader, MarketingFooter } from "@/components/marketing/site-shell";
import { BetaSignupForm } from "@/components/marketing/beta-signup-form";

export const metadata = { title: "Join the Beta" };

export default function BetaPage() {
  return (
    <div className="min-h-svh bg-background">
      <MarketingHeader />
      <main>
        <section className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
          <h1 className="text-3xl font-bold tracking-tight text-ink">Join the beta</h1>
          <p className="mt-3 text-muted-foreground">
            Early access to new features before general release. You&apos;ll get a welcome email
            when your request is approved.
          </p>
          <div className="mt-8">
            <BetaSignupForm />
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}