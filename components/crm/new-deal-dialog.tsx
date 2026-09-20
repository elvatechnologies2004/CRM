"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  dealStageLabelList,
  probabilityForStage,
  stageFromLabel,
} from "@/lib/crm-meta";
import type { CrmDeal, DealStageLabel, User } from "@/lib/types";

interface NewDealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  owners: User[];
  onCreated: (deal: CrmDeal) => void;
}

interface DealFormState {
  name: string;
  value: string;
  stage: DealStageLabel;
  ownerName: string;
  expectedClose: string;
}

const emptyDealForm: DealFormState = {
  name: "",
  value: "",
  stage: "New",
  ownerName: "",
  expectedClose: "",
};

function NewDealDialog({ open, onOpenChange, owners, onCreated }: NewDealDialogProps) {
  const [form, setForm] = useState<DealFormState>(emptyDealForm);
  const [errors, setErrors] = useState<Partial<Record<keyof DealFormState, string>>>({});
  const [prevOpen, setPrevOpen] = useState(open);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setForm(emptyDealForm);
      setErrors({});
    }
  }

  const update = (patch: Partial<DealFormState>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const submit = () => {
    const next: Partial<Record<keyof DealFormState, string>> = {};
    if (!form.name.trim()) next.name = "Deal name is required.";
    const value = Number(form.value);
    if (!form.value.trim() || Number.isNaN(value) || value <= 0) {
      next.value = "Enter a positive dollar value.";
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const stage = stageFromLabel(form.stage);
    const owner =
      owners.find((candidate) => candidate.name === form.ownerName) ?? owners[0];
    const deal: CrmDeal = {
      id: `cd_${Date.now().toString(36)}`,
      name: form.name.trim(),
      value,
      stage,
      probability: probabilityForStage(stage),
      expectedClose: new Date(form.expectedClose || Date.now()).toISOString(),
      ownerId: owner?.id ?? "",
      ownerName: owner?.name ?? form.ownerName,
      status: stage === "won" ? "Won" : stage === "lost" ? "Lost" : "Open",
    };
    onCreated(deal);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Deal</DialogTitle>
          <DialogDescription>
            Create a deal linked to this record. It will appear under Deals.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="deal-name" required>Deal name</Label>
            <Input
              id="deal-name"
              value={form.name}
              onChange={(event) => update({ name: event.target.value })}
              placeholder="CRM Implementation"
            />
            {errors.name && <p className="text-xs text-danger">{errors.name}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="deal-value" required>Value (PKR)</Label>
            <Input
              id="deal-value"
              type="number"
              min={0}
              value={form.value}
              onChange={(event) => update({ value: event.target.value })}
              placeholder="24000"
            />
            {errors.value && <p className="text-xs text-danger">{errors.value}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Stage</Label>
            <Select
              value={form.stage}
              onValueChange={(value) => update({ stage: value as DealStageLabel })}
            >
              <SelectTrigger aria-label="Deal stage">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {dealStageLabelList.map((label) => (
                  <SelectItem key={label} value={label}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Owner</Label>
            <Select
              value={form.ownerName}
              onValueChange={(value) => update({ ownerName: value })}
            >
              <SelectTrigger aria-label="Deal owner">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {owners.map((owner) => (
                  <SelectItem key={owner.id} value={owner.name}>
                    {owner.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="deal-close">Expected close</Label>
            <Input
              id="deal-close"
              type="date"
              value={form.expectedClose}
              onChange={(event) => update({ expectedClose: event.target.value })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={submit}>
            Save Deal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { NewDealDialog };