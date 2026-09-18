export function LeadMeetings({
  meetings,
  onAdd,
  onDelete,
}: {
  meetings: Array<{ id: string; title: string; date: string; time: string; duration: string; kind: "upcoming" | "past"; join?: string }>;
  onAdd?: (meeting: { id: string; title: string; date: string; time: string; duration: string; kind: "upcoming" | "past"; join?: string }) => void;
  onDelete?: (id: string) => void;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
      {meetings.length === 0 ? <p className="text-sm text-muted-foreground">No meetings scheduled.</p> : meetings.map((meeting) => (
        <div key={meeting.id} className="rounded-lg border border-border p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium text-ink">{meeting.title}</p>
            <span className="text-xs text-muted-foreground">{meeting.kind ?? "upcoming"}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{new Date(meeting.date).toLocaleDateString()} · {meeting.time} · {meeting.duration}</p>
          {onDelete && <button type="button" onClick={() => onDelete(meeting.id)} className="mt-2 text-xs text-danger">Remove</button>}
        </div>
      ))}
      {onAdd && <button type="button" onClick={() => onAdd({ id: `m-${Date.now()}`, title: "Follow-up", date: new Date().toISOString(), time: "09:00", duration: "30m", kind: "upcoming" })} className="text-xs text-primary">Add meeting</button>}
    </div>
  );
}
