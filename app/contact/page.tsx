import { MarketingHeader, MarketingFooter } from "@/components/marketing/site-shell";
import { ContactForm } from "@/components/marketing/contact-form";

export default function ContactPage() {
  return (
    <div className="min-h-svh bg-background">
      <MarketingHeader />
      <main>
        <section className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
          <h1 className="text-3xl font-bold tracking-tight text-ink">Contact us</h1>
          <p className="mt-3 text-muted-foreground">
            Questions about plans, demos, onboarding or support — send us a message.
          </p>
          <div className="mt-8">
            <ContactForm />
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}