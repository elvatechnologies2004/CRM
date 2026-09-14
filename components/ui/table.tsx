import * as React from "react";

interface TableProps<T extends { id: string }> {
  columns: { header: string; alignment?: "left" | "right" | "center"; cell: (row: T) => React.ReactNode }[];
  data: T[];
}

export function Table<T extends { id: string }>({ columns, data }: TableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card p-3 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
      <div className="flex text-xs font-medium text-muted-foreground border-b border-border pb-2 mb-3">
        {columns.map((column) => (
          <div key={column.header} className="flex-1">
            {column.header}
          </div>
        ))}
      </div>
      <div className="flex text-xs font-medium text-muted-foreground divide-y divide-border">
        {data.map((row) => (
          <div key={row.id} className="hover:bg-accent/10">
            {columns.map((column) => {
              const cellValue = column.cell(row);
              return (
                <div key={column.header} className="flex-1">
                  {typeof cellValue === "string" ? (
                    <span>{cellValue}</span>
                  ) : (
                    cellValue
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}