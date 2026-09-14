import { LegalLayout } from "@/components/marketing/legal-layout";

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" updated="September 14, 2026 — Draft">
      <p>
        Relvo (&ldquo;we&rdquo;, &ldquo;us&rdquo;) respects your privacy. This policy explains what we
        collect, why, and the rights you have over your data.
      </p>
      <h2 className="font-semibold text-ink">What we collect</h2>
      <ul className="list-inside list-disc space-y-2">
        <li><strong>Account data:</strong> name, email, and organization details you provide when signing up.</li>
        <li><strong>CRM data:</strong> the records you create (leads, contacts, companies, deals, tasks, communications). You control this data.</li>
        <li><strong>Usage data:</strong> anonymized product events used to improve the product (e.g., pages visited, features used).</li>
        <li><strong>Support data:</strong> contact-form messages and email correspondence.</li>
      </ul>
      <h2 className="font-semibold text-ink">How we use it</h2>
      <ul className="list-inside list-disc space-y-2">
        <li>Provide and operate the service.</li>
        <li>Deliver transactional emails you requested (trial, billing, notifications).</li>
        <li>Monitor performance, security, and availability.</li>
        <li>Improve the product based on aggregate, non-identifying data.</li>
      </ul>
      <h2 className="font-semibold text-ink">What we do NOT do</h2>
      <ul className="list-inside list-disc space-y-2">
        <li>We do not sell your personal data.</li>
        <li>We do not use your CRM data to train third-party AI models for external benefit.</li>
        <li>We do not send marketing email without your consent.</li>
      </ul>
      <h2 className="font-semibold text-ink">Data retention</h2>
      <p>
        We retain your data while your account is active, and honor reasonable deletion requests.
        Contact us to export or delete your data.
      </p>
      <h2 className="font-semibold text-ink">Your rights</h2>
      <p>
        Depending on your jurisdiction you may have rights to access, correct, export, or delete
        your personal data. Email us at privacy@relvo.app to exercise these rights.
      </p>
      <p>
        Contact us via <a href="mailto:privacy@relvo.app" className="text-primary hover:underline">privacy@relvo.app</a>.
        This policy was drafted for review by legal counsel.
      </p>
    </LegalLayout>
  );
}