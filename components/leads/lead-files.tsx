"use client";

import { useRef } from "react";
import {
  Download,
  FileArchive,
  FileBadge,
  FileImage,
  FileSpreadsheet,
  FileText,
  Folder,
  Trash2,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LeadFile } from "@/lib/types";

const typeConfig: Record<LeadFile["type"], { label: string; icon: typeof FileText; tint: string }> = {
  pdf: { label: "PDF", icon: FileBadge, tint: "bg-danger/10 text-[#b91c1c]" },
  xlsx: { label: "Spreadsheet", icon: FileSpreadsheet, tint: "bg-success/10 text-[#15803d]" },
  docx: { label: "Document", icon: FileText, tint: "bg-brand-blue/10 text-brand-blue" },
  image: { label: "Image", icon: FileImage, tint: "bg-brand-purple/10 text-brand-purple" },
  other: { label: "File", icon: FileArchive, tint: "bg-muted text-muted-foreground" },
};

function detectType(name: string): LeadFile["type"] {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "pdf";
  if (["xlsx", "xls", "csv"].includes(ext ?? "")) return "xlsx";
  if (["docx", "doc", "txt", "md"].includes(ext ?? "")) return "docx";
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext ?? "")) return "image";
  return "other";
}

function formatSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

interface LeadFilesProps {
  files: LeadFile[];
  onAdd: (file: LeadFile) => void;
  onDelete: (id: string) => void;
}

function LeadFiles({ files, onAdd, onDelete }: LeadFilesProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (raw: FileList | null) => {
    if (!raw) return;
    const file = raw[0];
    const now = new Date().toISOString();
    onAdd({
      id: `f_${Date.now().toString(36)}`,
      name: file.name,
      type: detectType(file.name),
      size: formatSize(file.size),
      uploadedAt: now,
    });
    if (inputRef.current) inputRef.current.value = "";
  };

  const downloadFile = (file: LeadFile) => {
    const payload = [
      `File: ${file.name}`,
      `Type: ${typeConfig[file.type].label}`,
      `Size: ${file.size}`,
      `Uploaded: ${formatDate(file.uploadedAt)}`,
      "",
      "Downloaded from Relvo CRM.",
    ].join("\n");
    const blob = new Blob([payload], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = file.name;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Folder className="h-4 w-4 text-muted-foreground" aria-hidden />
          Files
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
            {files.length}
          </span>
        </CardTitle>
        <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
          <Upload className="h-3.5 w-3.5" aria-hidden />
          Upload
        </Button>
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          onChange={(event) => handleFiles(event.target.files)}
          aria-label="Upload file"
        />
      </CardHeader>
      <CardContent>
        {files.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-10 text-center">
            <Folder className="h-4 w-4 text-muted-foreground/60" aria-hidden />
            <p className="text-xs text-muted-foreground">
              No files yet. Upload quotes, contracts or reference materials.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {files.map((file) => {
              const config = typeConfig[file.type];
              const Icon = config.icon;
              return (
                <li
                  key={file.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${config.tint}`}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-ink">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {config.label} · {file.size} · {formatDate(file.uploadedAt)}
                    </p>
                  </div>
                  <span className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => downloadFile(file)}
                      aria-label={`Download ${file.name}`}
                      className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-ink"
                    >
                      <Download className="h-4 w-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(file.id)}
                      aria-label={`Delete ${file.name}`}
                      className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-danger"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </span>
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
    year: "numeric",
  }).format(date);
}

export { LeadFiles };