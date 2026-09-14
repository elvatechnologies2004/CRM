import { LegalLayout } from "@/components/marketing/legal-layout";

export default function CookiesPage() {
  return (
    <LegalLayout title="Cookie Policy" updated="September 14, 2026 — Draft">
      <p>
        This policy explains how FinloNexa uses cookies and similar technologies. We aim to use the
        minimum necessary.
      </p>
      <h2 className="font-semibold text-ink">Essential cookies</h2>
      <ul className="list-inside list-disc space-y-2">
        <li><strong>Authentication:</strong> keep you signed in across sessions.</li>
        <li><strong>Security:</strong> protect your session and prevent abuse.</li>
        <li><strong>Preferences:</strong> remember your theme and language.</li>
      </ul>
      <h2 className="font-semibold text-ink">Analytics</h2>
      <p>
        We use lightweight, privacy-conscious analytics (product events) to understand feature usage
        in aggregate. We do not use third-party advertising cookies and do not sell browsing data.
      </p>
      <h2 className="font-semibold text-ink">Managing cookies</h2>
      <p>
        You can control cookies through your browser settings. Blocking essential cookies may break
        sign-in and other core functionality.
      </p>
      <p>
        Questions? Contact us at <a href="mailto:privacy@finlonexa.com" className="text-primary hover:underline">privacy@finlonexa.com</a>.
      </p>
    </LegalLayout>
  );
}