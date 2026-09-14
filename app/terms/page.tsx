import { LegalLayout } from "@/components/marketing/legal-layout";
import Link from "next/link";

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Service" updated="September 14, 2026 — Draft">
      <p>
        By using Relvo CRM you agree to these terms. Please read them carefully. These are a draft
        and subject to legal review.
      </p>
      <h2 className="font-semibold text-ink">1. The service</h2>
      <p>
        Relvo provides CRM, automation, and AI-assisted features. You are responsible for the data
        you import and the way your organization uses the service.
      </p>
      <h2 className="font-semibold text-ink">2. Your account</h2>
      <p>
        You must keep your login credentials secure. You are responsible for all activity under your
        account. Notify us immediately of any suspected breach.
      </p>
      <h2 className="font-semibold text-ink">3. Acceptable use</h2>
      <p>
        You agree not to misuse the service — see our{" "}
        <Link href="/acceptable-use" className="text-primary hover:underline">Acceptable Use Policy</Link>.
      </p>
      <h2 className="font-semibold text-ink">4. Billing</h2>
      <p>
        Paid plans are billed in advance. Trial periods are offered at our discretion. Payments are
        processed by our payment provider; we do not store your card details. Refunds follow our
        refund policy, which is described in this document and our billing pages.
      </p>
      <h2 className="font-semibold text-ink">5. Trial &amp; cancellation</h2>
      <p>
        You can cancel anytime from <em>Settings → Billing</em>. On cancellation you retain access
        until the end of the paid period.
      </p>
      <h2 className="font-semibold text-ink">6. Termination</h2>
      <p>
        We may suspend or terminate access for violations of these terms or misuse, with
        notification where practical.
      </p>
      <h2 className="font-semibold text-ink">7. Limitation of liability</h2>
      <p>
        The service is provided &ldquo;as is&rdquo;. To the maximum extent permitted by law, we are
        not liable for indirect or consequential damages arising from your use of the service.
      </p>
      <h2 className="font-semibold text-ink">8. Changes</h2>
      <p>
        We may update these terms. Material changes will be announced on the{" "}
        <Link href="/updates" className="text-primary hover:underline">Updates page</Link> or in-app.
      </p>
      <p>Questions? Contact us at <a href="mailto:legal@relvo.app" className="text-primary hover:underline">legal@relvo.app</a>.</p>
    </LegalLayout>
  );
}