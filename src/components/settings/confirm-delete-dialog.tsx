"use client"

import { useState } from "react"
import { AlertTriangle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface ConfirmDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Dialog title — defaults to "Confirm Deletion" */
  title?: string
  /** The item name to highlight in the description */
  itemName?: string
  /** Custom description line (shown below item name) */
  description?: string
  /** Label for the confirm button — defaults to "Delete permanently" */
  confirmLabel?: string
  /** Whether the action is in progress */
  isDeleting?: boolean
  /** Called when the user confirms the deletion */
  onConfirm: () => void
}

/**
 * Reusable double-confirmation delete dialog.
 * First click on the Delete icon → this dialog opens.
 * User must explicitly click "Delete permanently" to proceed.
 */
export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title = "Confirm Deletion",
  itemName,
  description,
  confirmLabel = "Delete permanently",
  isDeleting = false,
  onConfirm,
}: ConfirmDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[420px]">
        <DialogTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="w-5 h-5" />
          {title}
        </DialogTitle>
        <DialogDescription asChild>
          <div className="space-y-2">
            {itemName && (
              <p className="text-foreground font-medium">
                Are you sure you want to delete{" "}
                <span className="font-bold">&quot;{itemName}&quot;</span>?
              </p>
            )}
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
            {!itemName && !description && (
              <p className="text-sm text-muted-foreground">
                This action cannot be undone.
              </p>
            )}
          </div>
        </DialogDescription>
        <div className="flex justify-end gap-2 border-t border-border pt-4 mt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onConfirm()
              onOpenChange(false)
            }}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting…" : confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
