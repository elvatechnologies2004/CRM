import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const NAV_LINKS = [
  { label: "Features", href: "/features" },
  { label: "AI CRM", href: "/ai-crm" },
  { label: "Pricing", href: "/pricing" },
  { label: "Integrations", href: "/integrations" },
  { label: "Security", href: "/security" },
  { label: "Beta", href: "/beta" },
];

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight text-ink">
          Relvo<span className="text-primary"> CRM</span>
        </Link>
        <nav className="hidden items-center gap-6 md:flex" aria-label="Main">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/signup">
              Start Free
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

export function MarketingFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border bg-card py-12">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 sm:grid-cols-4 sm:px-6">
        <div className="col-span-2 sm:col-span-1">
          <p className="text-lg font-semibold tracking-tight text-ink">
            Relvo<span className="text-primary"> CRM</span>
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            The CRM that knows what needs to happen next.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-ink">Product</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link className="hover:text-ink" href="/features">Features</Link></li>
            <li><Link className="hover:text-ink" href="/ai-crm">AI CRM</Link></li>
            <li><Link className="hover:text-ink" href="/pricing">Pricing</Link></li>
            <li><Link className="hover:text-ink" href="/integrations">Integrations</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-ink">Company</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link className="hover:text-ink" href="/about">About</Link></li>
            <li><Link className="hover:text-ink" href="/contact">Contact</Link></li>
            <li><Link className="hover:text-ink" href="/security">Security</Link></li>
            <li><Link className="hover:text-ink" href="/beta">Beta program</Link></li>
            <li><Link className="hover:text-ink" href="/updates">Updates</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-ink">Legal</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link className="hover:text-ink" href="/privacy">Privacy</Link></li>
            <li><Link className="hover:text-ink" href="/terms">Terms</Link></li>
            <li><Link className="hover:text-ink" href="/cookies">Cookies</Link></li>
            <li><Link className="hover:text-ink" href="/acceptable-use">Acceptable Use</Link></li>
          </ul>
        </div>
      </div>
      <div className="mx-auto mt-10 max-w-6xl border-t border-border px-4 pt-6 text-xs text-muted-foreground sm:px-6">
        © {year} Relvo. All rights reserved.
      </div>
    </footer>
  );
}