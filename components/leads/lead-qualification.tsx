"use client";

import { Target } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  AuthorityLevel,
  BudgetLevel,
  LeadQualification as Qualification,
  NeedLevel,
  TimelineLevel,
} from "@/lib/types";

interface LeadQualificationProps {
  qualification: Qualification;
  onChange: (patch: Partial<Omit<Qualification, "score">>) => void;
}

function QualSelect({
  label,
  value,
  options,
  onValueChange,
}: {
  label: string;
  value: string;
  options: string[];
  onValueChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <span className="text-[13px] text-muted-foreground">{label}</span>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="h-8 w-[190px] text-xs" aria-label={label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function LeadQualification({ qualification, onChange }: LeadQualificationProps) {
  const scorePct = Math.max(0, Math.min(100, qualification.score));

  return (
    <Card className="shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Target className="h-4 w-4 text-muted-foreground" aria-hidden />
          Qualification (BANT)
        </CardTitle>
        <span className="text-[13px] font-semibold tabular-nums text-ink">
          {qualification.score}%
        </span>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Qualification score</span>
            <span className="text-muted-foreground">{scorePct >= 80 ? "Strong" : scorePct >= 50 ? "Partial" : "Weak"}</span>
          </div>
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={scorePct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Qualification score"
          >
            <div
              className={cnBar(scorePct)}
              style={{ width: `${scorePct}%` }}
            />
          </div>
        </div>

        <QualSelect
          label="Budget"
          value={qualification.budget}
          options={["Confirmed", "Estimated", "Unclear"]}
          onValueChange={(value) => onChange({ budget: value as BudgetLevel })}
        />
        <QualSelect
          label="Authority"
          value={qualification.authority}
          options={["Likely Decision Maker", "Influencer", "Unknown"]}
          onValueChange={(value) => onChange({ authority: value as AuthorityLevel })}
        />
        <QualSelect
          label="Need"
          value={qualification.need}
          options={["Strong", "Moderate", "Weak"]}
          onValueChange={(value) => onChange({ need: value as NeedLevel })}
        />
        <QualSelect
          label="Timeline"
          value={qualification.timeline}
          options={["< 1 Month", "1–2 Months", "This Quarter", "6+ Months"]}
          onValueChange={(value) => onChange({ timeline: value as TimelineLevel })}
        />
      </CardContent>
    </Card>
  );
}

function cnBar(score: number) {
  const tone =
    score >= 80
      ? "bg-success"
      : score >= 50
        ? "bg-warning"
        : "bg-danger";
  return `h-full rounded-full transition-all ${tone}`;
}

export { LeadQualification };