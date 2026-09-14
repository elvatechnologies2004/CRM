"use client";

import * as React from "react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { DealRecord } from "@/lib/types";
import { emptyDealForm, type DealFormData } from "@/lib/deal-form";
import { leadOwners, leadSourceOptions } from "@/lib/mock-leads";

function AddDealDialog({
  open,
  onOpenChange,
  owners,
  initial,
  mode,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  owners: string[];
  initial?: DealRecord;
  mode: "create" | "edit";
  onSubmit: (data: DealFormData) => void;
  onViewExisting: (deal: DealRecord) => void;
}) {
  const [formData, setFormData] = useState<DealFormData>(() => {
    if (initial) {
      return {
        name: initial.name,
        companyId: initial.companyId ?? "",
        companyName: initial.companyName ?? "",
        primaryContactId: initial.primaryContactId ?? "",
        primaryContactName: initial.primaryContactName ?? "",
        pipelineId: initial.pipelineId,
        pipelineName: initial.pipelineName ?? "Main Sales Pipeline",
        stageId: initial.stageId,
        stageName: initial.stageName ?? "New",
        value: String(initial.value ?? ""),
        currency: initial.currency ?? "PKR",
        probability: String(initial.probability ?? ""),
        expectedCloseDate: initial.expectedCloseDate ?? new Date().toISOString(),
        ownerId: initial.ownerId ?? leadOwners[0].id,
        ownerName: initial.ownerName ?? leadOwners[0].name,
        source: leadSourceOptions[0],
        description: initial.description ?? "",
        tags: "",
        products: initial.products ?? [],
      };
    }
    return { ...emptyDealForm };
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={() => onOpenChange(false)}>
      <DialogHeader className="pb-2">
        <DialogTitle>{mode === "create" ? "Create Deal" : "Edit Deal"}</DialogTitle>
      </DialogHeader>
      <DialogContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Deal Name</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div>
            <Label>Company</Label>
            <Input
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              placeholder="Select or type company"
            />
          </div>
          <div>
            <Label>Stage</Label>
            <Select
              value={formData.stageId}
              onValueChange={(value) =>
                setFormData({ ...formData, stageId: value ?? "new" })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select stage" />
              </SelectTrigger>
              <SelectContent>
                {["New", "Qualified", "Proposal", "Negotiation", "Won", "Lost"].map(
                  (stage) => (
                    <SelectItem key={stage} value={stage.toLowerCase()}>
                      {stage}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Value</Label>
            <Input
              type="number"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              placeholder="0"
            />
          </div>
          <div>
            <Label>Probability</Label>
            <Input
              type="number"
              value={formData.probability}
              onChange={(e) => setFormData({ ...formData, probability: e.target.value })}
              min="0"
              max="100"
              placeholder="0-100"
            />
          </div>
          <div>
            <Label>Expected Close Date</Label>
            <Input
              type="date"
              value={formData.expectedCloseDate}
              onChange={(e) => setFormData({ ...formData, expectedCloseDate: e.target.value })}
            />
          </div>
          <div>
            <Label>Owner</Label>
            <Select
              value={formData.ownerId}
              onValueChange={(value) => setFormData({ ...formData, ownerId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select owner" />
              </SelectTrigger>
              <SelectContent>
                {owners.map((owner) => (
                  <SelectItem key={owner} value={owner}>
                    {owner}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Deal description"
            />
          </div>
        </form>
      </DialogContent>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button type="submit" disabled={!formData.name.trim()}>
          {mode === "create" ? "Create" : "Update"}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

export { AddDealDialog };