import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function BillingCancelPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-warning/10">
        <span className="text-2xl text-[#b45309]" aria-hidden>
          ✕
        </span>
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-ink">Checkout cancelled</h1>
      <p className="text-sm text-muted-foreground">
        No charges were made. You can pick a plan whenever you&apos;re ready.
      </p>
      <Button asChild>
        <Link href="/settings/billing">Back to Billing</Link>
      </Button>
    </div>
  );
}