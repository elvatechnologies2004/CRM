export function LeadTasks({
  tasks,
  onToggle,
  onDelete,
  onAdd,
}: {
  tasks: Array<{ id: string; title: string; due: string; priority: string; status: string; owner: string }>;
  onToggle?: (id: string) => void;
  onDelete?: (id: string) => void;
  onAdd?: () => void;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
      {tasks.length === 0 ? <p className="text-sm text-muted-foreground">No tasks yet.</p> : tasks.map((task) => (
        <div key={task.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 text-sm">
          <div>
            <p className="font-medium text-ink">{task.title}</p>
            <p className="text-xs text-muted-foreground">Due {new Date(task.due).toLocaleDateString()} · {task.owner}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{task.status}</span>
            {onToggle && <button type="button" onClick={() => onToggle(task.id)} className="text-xs text-primary">Toggle</button>}
            {onDelete && <button type="button" onClick={() => onDelete(task.id)} className="text-xs text-danger">Delete</button>}
          </div>
        </div>
      ))}
      {onAdd && <button type="button" onClick={onAdd} className="text-xs text-primary">Add task</button>}
    </div>
  );
}
