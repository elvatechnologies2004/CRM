export function LeadEmails({
  emails,
  authorEmail,
  recipient,
  onSend,
}: {
  emails: Array<{ id: string; subject: string; direction: "in" | "out"; from: string; to: string; date: string; body: string }>;
  authorEmail?: string;
  recipient?: string;
  onSend?: (subject: string, body: string) => void;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
      {emails.length === 0 ? <p className="text-sm text-muted-foreground">No emails yet.</p> : emails.map((email) => (
        <div key={email.id} className="rounded-lg border border-border p-3">
          <div className="mb-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>{email.direction === "in" ? "Incoming" : "Outgoing"}</span>
            <span>{new Date(email.date).toLocaleString()}</span>
          </div>
          <p className="font-medium text-ink">{email.subject}</p>
          <p className="mt-1 text-sm text-muted-foreground">{email.body}</p>
        </div>
      ))}
      {onSend && <button type="button" onClick={() => onSend("Follow-up", `From ${authorEmail ?? "agent"} to ${recipient ?? "contact"}`)} className="text-xs text-primary">Send email</button>}
    </div>
  );
}
