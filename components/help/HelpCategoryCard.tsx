"use client";

interface HelpCategoryCardProps {
  title: string;
  description: string;
  examples: string[];
  icon?: React.ReactNode;
}

export function HelpCategoryCard({ title, description, examples, icon }: HelpCategoryCardProps) {
  return (
    <div className="bg-card p-4 rounded-xl border-border shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
      {icon && <div className="h-5 w-5 text-brand-sky mb-3">{icon}</div>}
      <h3 className="text-sm font-medium text-ink mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground line-clamp-2">{description}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {examples.map((ex, i) => (
          <span key={i} className="text-[10px] text-muted-foreground rounded bg-muted/20 px-2 py-1">
            {ex}
          </span>
        ))}
      </div>
    </div>
  );
}