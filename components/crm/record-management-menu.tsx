"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal } from "lucide-react";

import { archiveLeadAction, deleteLeadAction, restoreLeadAction } from "@/app/leads/actions";
import { manageOpportunityAction } from "@/app/opportunities/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface RecordManagementMenuProps {
  type: "lead" | "opportunity";
  id: string;
  name: string;
  closed?: boolean;
  archived?: boolean;
  directDelete?: boolean;
  onRefresh?: () => void;
  onDeleted?: () => void;
}

export function RecordManagementMenu({ type, id, name, closed = false, archived = false, directDelete = false, onRefresh, onDeleted }: RecordManagementMenuProps) {
  const router = useRouter();
  const [confirmAction, setConfirmAction] = useState<"delete" | "archive" | "restore" | null>(null);
  const [loading, setLoading] = useState(false);

  const isOpportunity = type === "opportunity";
  const recordLabel = isOpportunity ? "Opportunity" : "Lead";
  const actionLabel = confirmAction === "delete" ? `Delete ${recordLabel}` : confirmAction === "archive" ? `Archive ${recordLabel}` : `Restore ${recordLabel}`;
  const handleEdit = () => {
    router.push(isOpportunity ? `/opportunities/${id}` : `/leads/${id}`);
  };

  const handleConfirm = async () => {
    if (!confirmAction) return;
    setLoading(true);
    try {
      const result = type === "lead"
        ? confirmAction === "delete" ? await deleteLeadAction(id) : confirmAction === "archive" ? await archiveLeadAction(id) : await restoreLeadAction(id)
        : await manageOpportunityAction(id, confirmAction);
      if (!result.ok) window.alert(result.error || "Unable to complete this action.");
      else {
        setConfirmAction(null);
        if (confirmAction === "delete") onDeleted?.();
        onRefresh?.();
      }
    } finally {
      setLoading(false);
    }
  };

  const dialogTitle = confirmAction === "delete" && isOpportunity
    ? "Delete Opportunity?"
    : `${actionLabel}?`;

  const dialogDescription = confirmAction === "delete"
    ? isOpportunity
        ? "Are you sure you want to permanently delete this Opportunity?"
        : `${name} will be permanently deleted. This action cannot be undone.${closed ? " Warning: deleting this closed Opportunity may affect historical sales reports, revenue and Won/Lost statistics." : ""}`
    : confirmAction === "archive"
      ? `${name} will be archived and removed from the active list. Its history will be preserved.`
      : `${name} will be restored to the active list.`;

  const primaryLabel = confirmAction === "delete" && isOpportunity
    ? (loading ? "Deleting..." : "Delete Opportunity")
    : (loading ? "Working..." : actionLabel);

  return (
    <>
      {directDelete && !archived && (
        <Button
          variant="outline"
          size="sm"
          className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => setConfirmAction("delete")}
        >
          Delete
        </Button>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={`Manage ${name}`} title={`Manage ${name}`}>
            <MoreHorizontal className="h-4 w-4" aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {archived ? (
            <DropdownMenuItem onSelect={() => setConfirmAction("restore")}>Restore {recordLabel}</DropdownMenuItem>
          ) : (
            <>
              <DropdownMenuItem onSelect={handleEdit}>Edit {recordLabel}</DropdownMenuItem>
              {!isOpportunity && (
                <DropdownMenuItem onSelect={() => setConfirmAction("archive")}>Archive {recordLabel}</DropdownMenuItem>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={Boolean(confirmAction)} onOpenChange={(open) => !loading && !open && setConfirmAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>
              {confirmAction === "delete" && isOpportunity ? (
                <span className="block space-y-1.5">
                  <span className="block">Are you sure you want to permanently delete:</span>
                  <span className="block font-medium text-ink">{name}</span>
                  <span className="block">This will permanently remove this Opportunity and its related operational records.</span>
                  <span className="block">This action cannot be undone.</span>
                </span>
              ) : (
                dialogDescription
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmAction(null)} disabled={loading}>Cancel</Button>
            <Button variant={confirmAction === "delete" ? "destructive" : "default"} onClick={handleConfirm} disabled={loading}>{primaryLabel}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}