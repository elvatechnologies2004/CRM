export function LeadNotes({
  notes,
  author,
  onAdd,
  onUpdate,
  onTogglePin,
  onDelete,
}: {
  notes: Array<{ id: string; body: string; author: string; createdAt: string; pinned?: boolean }>;
  author?: string;
  onAdd?: (body: string) => void;
  onUpdate?: (id: string, body: string) => void;
  onTogglePin?: (id: string) => void;
  onDelete?: (id: string) => void;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
      {notes.length === 0 ? <p className="text-sm text-muted-foreground">No notes yet.</p> : notes.map((note) => (
        <div key={note.id} className="rounded-lg border border-border p-3">
          <div className="mb-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>{note.author}</span>
            <span>{new Date(note.createdAt).toLocaleString()}</span>
          </div>
          <p className="text-sm text-ink">{note.body}</p>
        </div>
      ))}
      {onAdd && (
        <button type="button" onClick={() => onAdd(author ?? "")} className="text-xs text-primary">
          Add note
        </button>
      )}
    </div>
  );
}
