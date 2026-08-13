"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { transferPocAction, getPipelineEligibleStaffAction } from "@/lib/engagement/actions";
import { toast } from "sonner";
import { Users } from "lucide-react";

interface TransferLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  alumniEmail: string;
  alumniName: string;
  memberships: any[];
  userEmail: string;
}

export default function TransferLeadModal({ isOpen, onClose, alumniEmail, alumniName, memberships, userEmail }: TransferLeadModalProps) {
  const [pipelineCode, setPipelineCode] = useState<string>("");
  const [newPocEmail, setNewPocEmail] = useState<string>("");
  const [eligibleStaff, setEligibleStaff] = useState<{ email: string; name: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPipelineCode("");
      setNewPocEmail("");
      setEligibleStaff([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (pipelineCode) {
      const fetchStaff = async () => {
        setIsLoadingStaff(true);
        const res = await getPipelineEligibleStaffAction(pipelineCode);
        if (res.success && res.data) {
          setEligibleStaff(res.data);
        } else {
          toast.error("Failed to load eligible staff");
        }
        setIsLoadingStaff(false);
      };
      fetchStaff();
    } else {
      setEligibleStaff([]);
    }
  }, [pipelineCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pipelineCode || !newPocEmail) return;
    
    setIsSubmitting(true);
    const res = await transferPocAction({
      alumni_email: alumniEmail,
      pipeline_code: pipelineCode,
      new_poc_email: newPocEmail,
      transferred_by: userEmail,
    });
    
    setIsSubmitting(false);
    
    if (res.success) {
      toast.success("Lead transferred successfully");
      onClose();
    } else {
      toast.error(res.error || "Failed to transfer lead");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-2xl border border-border/80 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-500" /> Transfer Lead
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Transfer ownership of {alumniName} ({alumniEmail}) to another staff member.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Select Lead Type</label>
            <Select value={pipelineCode} onValueChange={setPipelineCode}>
              <SelectTrigger className="text-xs h-9">
                <SelectValue placeholder="Select lead type" />
              </SelectTrigger>
              <SelectContent>
                {memberships.some(m => m.pipelines?.code === 'pay_forward') && (
                  <SelectItem value="pay_forward">Pay-Forward</SelectItem>
                )}
                {memberships.some(m => m.pipelines?.code === 'mentoring' || m.pipelines?.code === 'placement') && (
                  <SelectItem value="career_support">Career Support (Mentoring & Placement)</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {pipelineCode && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Assign to (New POC)</label>
              <Select value={newPocEmail} onValueChange={setNewPocEmail} disabled={isLoadingStaff}>
                <SelectTrigger className="text-xs h-9">
                  <SelectValue placeholder={isLoadingStaff ? "Loading staff..." : "Select new owner"} />
                </SelectTrigger>
                <SelectContent>
                  {eligibleStaff.map(s => (
                    <SelectItem key={s.email} value={s.email}>
                      {s.name} ({s.email})
                    </SelectItem>
                  ))}
                  {eligibleStaff.length === 0 && !isLoadingStaff && (
                    <SelectItem value="none" disabled>No eligible staff found</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="h-8 text-xs">Cancel</Button>
            <Button type="submit" disabled={isSubmitting || !pipelineCode || !newPocEmail} className="h-8 text-xs bg-indigo-600 hover:bg-indigo-500">
              {isSubmitting ? "Transferring..." : "Transfer Lead"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
