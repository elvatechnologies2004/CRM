"use client";

import { Button } from "@/components/ui/button";
import { LifeBuoy, Bug, Lightbulb } from "lucide-react";

interface ContactSupportCardProps {
  onContactSupport: () => void;
  onReportProblem: () => void;
  onRequestFeature: () => void;
}

export function ContactSupportCard({
  onContactSupport,
  onReportProblem,
  onRequestFeature,
}: ContactSupportCardProps) {
  return (
    <div className="bg-card rounded-xl border-border p-6">
      <div className="flex items-center gap-2 mb-2">
        <LifeBuoy className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Contact Support
        </h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Can&apos;t find the answer you&apos;re looking for? Our support team is ready to help.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button onClick={onContactSupport}>
          <LifeBuoy className="h-4 w-4 mr-2" />
          Contact Support
        </Button>
        <Button variant="outline" onClick={onReportProblem}>
          <Bug className="h-4 w-4 mr-2" />
          Report a Problem
        </Button>
        <Button variant="outline" onClick={onRequestFeature}>
          <Lightbulb className="h-4 w-4 mr-2" />
          Request a Feature
        </Button>
      </div>
    </div>
  );
}