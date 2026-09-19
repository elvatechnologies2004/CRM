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
  converted?: boolean;
  closed?: boolean;
  archived?: boolean;
  directDelete?: boolean;
  onRefresh?: () => void;
}

export function RecordManagementMenu({ type, id, name, converted = false, closed = false, archived = false, directDelete = false, onRefresh }: RecordManagementMenuProps) {
  const router = useRouter();
  const [confirmAction, setConfirmAction] = useState<"delete" | "archive" | "restore" | null>(null);
  const [loading, setLoading] = useState(false);

  const actionLabel = confirmAction === "delete" ? `Delete ${type === "lead" ? "Lead" : "Opportunity"}` : confirmAction === "archive" ? `Archive ${type === "lead" ? "Lead" : "Opportunity"}` : `Restore ${type === "lead" ? "Lead" : "Opportunity"}`;
  const isDeleteBlocked = Boolean(converted && !archived && type === "lead");
  const handleEdit = () => {
    router.push(type === "lead" ? `/leads/${id}` : `/opportunities/${id}`);
  };

  const handleConfirm = async () => {
    if (!confirmAction) return;
    if (confirmAction === "delete" && isDeleteBlocked) {
      window.alert("Converted leads can only be archived.");
      setConfirmAction(null);
      return;
    }
    setLoading(true);
    try {
      const result = type === "lead"
        ? confirmAction === "delete" ? await deleteLeadAction(id) : confirmAction === "archive" ? await archiveLeadAction(id) : await restoreLeadAction(id)
        : await manageOpportunityAction(id, confirmAction);
      if (!result.ok) window.alert(result.error || "Unable to complete this action.");
      else {
        setConfirmAction(null);
        onRefresh?.();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {directDelete && !archived && !isDeleteBlocked && (
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
            <DropdownMenuItem onSelect={() => setConfirmAction("restore")}>Restore {type === "lead" ? "Lead" : "Opportunity"}</DropdownMenuItem>
          ) : (
            <>
              <DropdownMenuItem onSelect={handleEdit}>Edit {type === "lead" ? "Lead" : "Opportunity"}</DropdownMenuItem>
              {(converted || closed) ? (
                <DropdownMenuItem onSelect={() => setConfirmAction("archive")}>Archive {type === "lead" ? "Lead" : "Opportunity"}</DropdownMenuItem>
              ) : (
                <DropdownMenuItem onSelect={() => setConfirmAction("archive")}>Archive {type === "lead" ? "Lead" : "Opportunity"}</DropdownMenuItem>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={Boolean(confirmAction)} onOpenChange={(open) => !loading && !open && setConfirmAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{actionLabel}?</DialogTitle>
            <DialogDescription>
              {confirmAction === "delete"
                ? isDeleteBlocked
                  ? "Converted leads can only be archived."
                  : `${name} will be permanently deleted. This action cannot be undone.${closed ? " Warning: deleting this closed Opportunity may affect historical sales reports, revenue and Won/Lost statistics." : ""}`
                : confirmAction === "archive"
                  ? `${name} will be archived and removed from the active list. Its history will be preserved.`
                  : `${name} will be restored to the active list.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmAction(null)} disabled={loading}>Cancel</Button>
            <Button variant={confirmAction === "delete" ? "destructive" : "default"} onClick={handleConfirm} disabled={loading}>{loading ? "Working..." : actionLabel}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
