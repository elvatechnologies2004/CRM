import * as React from "react";

import { cn } from "@/lib/utils";

export interface DataColumn<T> {
  header: string;
  className?: string;
  cell: (row: T) => React.ReactNode;
}

export function DataTable<T>({
  columns,
  rows,
  empty,
}: {
  columns: DataColumn<T>[];
  rows: T[];
  empty?: React.ReactNode;
}) {
  if (rows.length === 0 && empty) {
    return <>{empty}</>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
      <table className="w-full min-w-[640px] border-collapse text-left text-[13px]">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            {columns.map((column) => (
              <th
                key={column.header}
                scope="col"
                className={cn(
                  "whitespace-nowrap px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground",
                  column.className,
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row, index) => (
            <tr
              key={(row as { id?: string }).id ?? index}
              className="transition-colors hover:bg-accent/40"
            >
              {columns.map((column) => (
                <td
                  key={column.header}
                  className={cn(
                    "whitespace-nowrap px-4 py-3 align-middle",
                    column.className,
                  )}
                >
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}