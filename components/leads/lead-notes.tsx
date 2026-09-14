"use client";

import { useState } from "react";
import { Check, Pencil, Pin, PinOff, Plus, StickyNote, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { LeadNote } from "@/lib/types";
import { cn } from "@/lib/utils";

interface LeadNotesProps {
  notes: LeadNote[];
  author: string;
  onAdd: (body: string) => void;
  onUpdate: (id: string, body: string) => void;
  onTogglePin: (id: string) => void;
  onDelete: (id: string) => void;
}

function LeadNotes({ notes, author, onAdd, onUpdate, onTogglePin, onDelete }: LeadNotesProps) {
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");

  const sorted = [...notes].sort((a, b) => {
    if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1;
    return +new Date(b.createdAt) - +new Date(a.createdAt);
  });

  const handleAdd = () => {
    if (!draft.trim()) return;
    onAdd(draft.trim());
    setDraft("");
  };

  return (
    <Card className="shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <StickyNote className="h-4 w-4 text-muted-foreground" aria-hidden />
          Notes
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
            {notes.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-xl border border-border bg-muted/30 p-3">
          <Textarea
            rows={2}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Add a note about this lead…"
            aria-label="New note"
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">as {author}</span>
            <Button size="sm" onClick={handleAdd} disabled={!draft.trim()}>
              <Plus className="h-3.5 w-3.5" aria-hidden />
              Add Note
            </Button>
          </div>
        </div>

        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-10 text-center">
            <StickyNote className="h-4 w-4 text-muted-foreground/60" aria-hidden />
            <p className="text-xs text-muted-foreground">
              No notes yet. Capture context about this lead as you go.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {sorted.map((note) => {
              const isEditing = editingId === note.id;
              return (
                <li
                  key={note.id}
                  className={cn(
                    "rounded-xl border p-3",
                    note.pinned ? "border-primary/30 bg-accent/40" : "border-border bg-card"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="font-medium text-ink">{note.author}</span>
                      · {formatDate(note.createdAt)}
                    </p>
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => onTogglePin(note.id)}
                        aria-label={note.pinned ? "Unpin note" : "Pin note"}
                        className={cn(
                          "rounded-md p-1 transition-colors hover:bg-muted",
                          note.pinned ? "text-primary" : "text-muted-foreground"
                        )}
                      >
                        {note.pinned ? (
                          <Pin className="h-3.5 w-3.5" aria-hidden />
                        ) : (
                          <PinOff className="h-3.5 w-3.5" aria-hidden />
                        )}
                      </button>
                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            aria-label="Save note"
                            onClick={() => {
                              onUpdate(note.id, editingText.trim() || note.body);
                              setEditingId(null);
                            }}
                            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-success"
                          >
                            <Check className="h-3.5 w-3.5" aria-hidden />
                          </button>
                          <button
                            type="button"
                            aria-label="Cancel edit"
                            onClick={() => setEditingId(null)}
                            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted"
                          >
                            <X className="h-3.5 w-3.5" aria-hidden />
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          aria-label="Edit note"
                          onClick={() => {
                            setEditingId(note.id);
                            setEditingText(note.body);
                          }}
                          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted"
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden />
                        </button>
                      )}
                      <button
                        type="button"
                        aria-label="Delete note"
                        onClick={() => onDelete(note.id)}
                        className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-danger"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    </div>
                  </div>
                  {isEditing ? (
                    <Textarea
                      rows={3}
                      value={editingText}
                      onChange={(event) => setEditingText(event.target.value)}
                      className="mt-2"
                    />
                  ) : (
                    <p className="mt-1.5 whitespace-pre-wrap text-[13px] leading-relaxed text-ink">
                      {note.body}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export { LeadNotes };