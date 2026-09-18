export function LeadFiles({
  files,
  onAdd,
  onDelete,
}: {
  files: Array<{ id: string; name: string; type: "pdf" | "xlsx" | "docx" | "image" | "other"; size: string; uploadedAt: string }>;
  onAdd?: (file: { id: string; name: string; type: "pdf" | "xlsx" | "docx" | "image" | "other"; size: string; uploadedAt: string }) => void;
  onDelete?: (id: string) => void;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
      {files.length === 0 ? <p className="text-sm text-muted-foreground">No files uploaded.</p> : files.map((file) => (
        <div key={file.id} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
          <div>
            <p className="font-medium text-ink">{file.name}</p>
            <p className="text-xs text-muted-foreground">{file.type} · {file.size}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{new Date(file.uploadedAt).toLocaleDateString()}</span>
            {onDelete && <button type="button" onClick={() => onDelete(file.id)} className="text-xs text-danger">Remove</button>}
          </div>
        </div>
      ))}
      {onAdd && <button type="button" onClick={() => onAdd({ id: `file-${Date.now()}`, name: "upload.pdf", type: "pdf", size: "0 KB", uploadedAt: new Date().toISOString() })} className="text-xs text-primary">Add file</button>}
    </div>
  );
}
