"use client";

import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CrmProject } from "@/lib/types";

interface ProjectsPageClientProps {
  initialProjects: CrmProject[];
}

function ProjectsPageClient({ initialProjects }: ProjectsPageClientProps) {
  const projects = useMemo(() => initialProjects, [initialProjects]);

  const statusTone: Record<CrmProject["status"], "info" | "warning" | "success" | "danger"> = {
    Active: "info",
    "On Hold": "warning",
    Completed: "success",
    Cancelled: "danger",
    "Not Started": "info",
    "In Progress": "warning",
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Projects</h1>
        <Button size="sm" variant="ghost">
          + New Project
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {projects.map((project) => {
          const Tone = statusTone[project.status];
          return (
            <div
              key={project.id}
              className="rounded-xl border border-border bg-card p-4 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]"
            >
              <div className="flex flex-col gap-2">
                <p className="font-medium text-ink truncate">{project.name}</p>
                <Badge variant={Tone}>{project.status}</Badge>
                <p className="text-sm text-muted-foreground">
                  {project.customerName}
                  {project.dealName ? ` · ${project.dealName}` : ""}
                </p>
                <p className="text-right text-xl font-semibold tabular-nums text-ink">${project.budget.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">
                  Progress: {project.progress}% · Started {new Date(project.startDate).toLocaleDateString("en-US", { timeZone: "UTC" })}
                </p>
              </div>
            </div>
          );
        })}
        {projects.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No projects found.
          </p>
        )}
      </div>
    </div>
  );
}

export { ProjectsPageClient };