import Link from "next/link";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MarketingHeader, MarketingFooter } from "@/components/marketing/site-shell";
import { fetchPlans, type Plan } from "@/lib/billing/plans";

export const revalidate = 300;

const PLAN_HIGHLIGHTS: Record<string, string[]> = {
  free: ["Core CRM", "1 seat", "50 contacts", "10 deals"],
  starter: ["Everything in Free", "3 seats", "500 contacts", "200 deals", "Automations", "Email sequences"],
  pro: ["Everything in Starter", "10 seats", "5,000 contacts", "2,000 deals", "AI assistant & agents", "Reports & forecast", "API access"],
  business: ["Everything in Pro", "Unlimited seats", "Unlimited contacts & deals", "SSO", "Advanced audit", "Custom limits"],
};

function planButtonLabel(plan: Plan): string {
  if (plan.code === "free") return "Start Free";
  if (plan.code === "business") return "Contact Sales";
  return "Start Trial";
}

export default async function PricingPage() {
  const plans = await fetchPlans();

  return (
    <div className="min-h-svh bg-background">
      <MarketingHeader />
      <main>
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-14 text-center sm:px-6">
          <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">Pricing</h1>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Start free and upgrade when you grow. All paid plans start with a 14-day Pro trial.
          </p>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {plans.map((plan: Plan) => {
              const isPopular = plan.code === "pro";
              return (
                <div
                  key={plan.id}
                  className={
                    "flex flex-col rounded-xl border bg-card p-6 " +
                    (isPopular ? "border-primary/60 shadow-lg" : "border-border")
                  }
                >
                  {isPopular ? (
                    <span className="mb-2 inline-flex w-fit rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                      Most popular
                    </span>
                  ) : null}
                  <h2 className="text-lg font-semibold text-ink">{plan.name}</h2>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                  <p className="mt-4 text-3xl font-bold tracking-tight text-ink">
                    {plan.monthlyPriceCents > 0 ? (
                      <>
                        Rs {(plan.monthlyPriceCents / 100).toFixed(0)}
                        <span className="text-sm font-normal text-muted-foreground">/mo</span>
                      </>
                    ) : plan.code === "business" ? (
                      "Custom"
                    ) : (
                      "Rs 0"
                    )}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {plan.code === "business"
                      ? "Talk to our team"
                      : plan.monthlyPriceCents > 0
                        ? `Rs ${(plan.yearlyPriceCents / 100).toFixed(0)}/yr when billed yearly`
                        : "Free forever"}
                  </p>
                  <ul className="mt-6 flex-1 space-y-2.5">
                    {PLAN_HIGHLIGHTS[plan.code]?.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-foreground">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Button asChild variant={isPopular ? "default" : "outline"} className="mt-6" size="sm">
                    <Link href={plan.code === "business" ? "/contact" : "/signup"}>
                      {planButtonLabel(plan)}
                    </Link>
                  </Button>
                </div>
              );
            })}
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}