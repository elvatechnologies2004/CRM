import { LegalLayout } from "@/components/marketing/legal-layout";

const PROHIBITED = [
  "Spam or unsolicited bulk messaging through our email/sequence features",
  "Phishing, fraud, or impersonation of others",
  "Uploading illegal content, including child sexual abuse material",
  "Malware, ransomware, or other harmful code",
  "Attempting to access other tenants' data or bypass security controls",
  "Scraping the service beyond reasonable API usage",
  "Violating applicable export laws or sanctions",
  "Causing undue load that threatens service availability",
];

export default function AcceptableUsePage() {
  return (
    <LegalLayout title="Acceptable Use Policy" updated="September 14, 2026 — Draft">
      <p>
        This policy states what you may not do while using FinloNexa. Breach may result in suspension
        or termination of your account.
      </p>
      <h2 className="font-semibold text-ink">Prohibited activities</h2>
      <ul className="list-inside list-disc space-y-2">
        {PROHIBITED.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <h2 className="font-semibold text-ink">Reporting abuse</h2>
      <p>
        If you believe someone is violating this policy, report it to{" "}
        <a href="mailto:abuse@finlonexa.com" className="text-primary hover:underline">abuse@finlonexa.com</a>.
      </p>
    </LegalLayout>
  );
}