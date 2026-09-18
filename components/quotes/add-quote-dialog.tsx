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
import { quoteStatuses } from "@/lib/mock-quotes";
import type { QuoteStatus } from "@/lib/types";

export interface QuoteFormInit {
  customerName?: string;
  dealName?: string;
  total?: string;
  status?: QuoteStatus;
  issueDate?: string;
  expiryDate?: string;
  notes?: string;
}

interface AddQuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    customerName: string;
    dealName?: string;
    total: number;
    status: QuoteStatus;
    issueDate: string;
    expiryDate?: string;
    notes?: string;
  }) => void;
  nextNumber?: string;
  busy?: boolean;
  initial?: QuoteFormInit | null;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function AddQuoteDialog({
  open,
  onOpenChange,
  onSubmit,
  nextNumber,
  busy = false,
  initial = null,
}: AddQuoteDialogProps) {
  const [customerName, setCustomerName] = useState("");
  const [dealName, setDealName] = useState("");
  const [total, setTotal] = useState("");
  const [status, setStatus] = useState<QuoteStatus>("Draft");
  const [issueDate, setIssueDate] = useState(() => todayIso());
  const [expiryDate, setExpiryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [prevOpen, setPrevOpen] = useState(open);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setCustomerName(initial?.customerName ?? "");
      setDealName(initial?.dealName ?? "");
      setTotal(initial?.total ?? "");
      setStatus(initial?.status ?? "Draft");
      setIssueDate(initial?.issueDate ?? todayIso());
      setExpiryDate(initial?.expiryDate ?? "");
      setNotes(initial?.notes ?? "");
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedTotal = Math.max(0, Number(total) || 0);
    onSubmit({
      customerName: customerName.trim(),
      dealName: dealName.trim() || undefined,
      total: parsedTotal,
      status,
      issueDate: issueDate || todayIso(),
      expiryDate: expiryDate || undefined,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(next) => onOpenChange(next)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle>New Quote</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Quote Number</Label>
            <Input value={nextNumber || "Auto-assigned"} disabled />
          </div>
          <div>
            <Label>Customer Name</Label>
            <Input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Company or contact name"
              required
            />
          </div>
          <div>
            <Label>Deal</Label>
            <Input
              value={dealName}
              onChange={(e) => setDealName(e.target.value)}
              placeholder="Related deal (optional)"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Total Amount</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={total}
                onChange={(e) => setTotal(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(value) =>
                  setStatus((value as QuoteStatus) ?? "Draft")
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {quoteStatuses.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Issue Date</Label>
              <Input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
              />
            </div>
            <div>
              <Label>Expiry Date</Label>
              <Input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Terms or notes (optional)"
            />
          </div>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => {
              const parsedTotal = Math.max(0, Number(total) || 0);
              if (!customerName.trim()) return;
              onSubmit({
                customerName: customerName.trim(),
                dealName: dealName.trim() || undefined,
                total: parsedTotal,
                status,
                issueDate: issueDate || todayIso(),
                expiryDate: expiryDate || undefined,
                notes: notes.trim() || undefined,
              });
            }}
            disabled={!customerName.trim() || busy}
          >
            Create Quote
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { AddQuoteDialog };
