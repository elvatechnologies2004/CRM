export function LeadWhatsApp({
  messages,
  onSend,
}: {
  messages: Array<{ id: string; from: "customer" | "agent"; text: string; time: string }>;
  onSend?: (text: string) => void;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
      {messages.length === 0 ? <p className="text-sm text-muted-foreground">No WhatsApp history.</p> : messages.map((message) => (
        <div key={message.id} className={`rounded-lg border p-3 ${message.from === "agent" ? "border-primary/20 bg-primary/5" : "border-border bg-muted/30"}`}>
          <div className="mb-1 flex items-center justify-between gap-2 text-[11px] uppercase tracking-wide text-muted-foreground">
            <span>{message.from === "agent" ? "Agent" : "Customer"}</span>
            <span>{new Date(message.time).toLocaleString()}</span>
          </div>
          <p className="text-sm text-ink">{message.text}</p>
        </div>
      ))}
      {onSend && <button type="button" onClick={() => onSend("Thanks for your time—I'll follow up shortly.")} className="text-xs text-primary">Send WhatsApp</button>}
    </div>
  );
}
