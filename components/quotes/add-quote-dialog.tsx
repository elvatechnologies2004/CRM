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
import type { QuoteRecord, QuoteStatus } from "@/lib/types";

interface AddQuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (quote: QuoteRecord) => void;
  nextNumber: string;
}

function AddQuoteDialog({
  open,
  onOpenChange,
  onSubmit,
  nextNumber,
}: AddQuoteDialogProps) {
  const [customerName, setCustomerName] = useState("");
  const [dealName, setDealName] = useState("");
  const [total, setTotal] = useState("");
  const [status, setStatus] = useState<QuoteStatus>("Draft");
  const [issueDate, setIssueDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [expiryDate, setExpiryDate] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedTotal = Math.max(0, Number(total) || 0);
    onSubmit({
      id: crypto.randomUUID(),
      number: nextNumber,
      customerName: customerName.trim(),
      dealName: dealName.trim() || undefined,
      issueDate: issueDate || new Date().toISOString(),
      expiryDate: expiryDate || issueDate || new Date().toISOString(),
      currency: "USD",
      lineItems: [],
      subtotal: parsedTotal,
      discount: 0,
      tax: 0,
      total: parsedTotal,
      status,
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
      timeline: [
        {
          id: crypto.randomUUID(),
          event: "Quote created",
          at: new Date().toISOString(),
        },
      ],
    });
    setCustomerName("");
    setDealName("");
    setTotal("");
    setStatus("Draft");
    setNotes("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={() => onOpenChange(false)}>
      <DialogHeader className="pb-2">
        <DialogTitle>New Quote</DialogTitle>
      </DialogHeader>
      <DialogContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Quote Number</Label>
            <Input value={nextNumber} disabled />
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
      </DialogContent>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button type="submit" disabled={!customerName.trim()}>
          Create Quote
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

export { AddQuoteDialog };