"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { InteractionOutcome, PipelineSuggestion, ProfileCompleteness } from "@/types/engagement";
import { logInteractionAction, updatePipelineMembershipAction, getCallReasonsAction } from "@/lib/engagement/actions";
import { toast } from "sonner";
import { PhoneCall, Calendar, AlertCircle, CheckCircle2, DollarSign, UserCheck, Linkedin, Building2, HelpCircle } from "lucide-react";
import { FollowupDateSelector } from "./FollowupDateSelector";

interface LogInteractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  alumniEmail: string;
  alumniName: string;
  outcomes: InteractionOutcome[];
  userEmail: string;
  completeness?: ProfileCompleteness;
  masterData?: any;
}

export default function LogInteractionModal({
  isOpen,
  onClose,
  alumniEmail,
  alumniName,
  outcomes,
  userEmail,
  completeness,
  masterData,
}: LogInteractionModalProps) {
  const [selectedOutcomeId, setSelectedOutcomeId] = useState<string>("");
  const [callReasonId, setCallReasonId] = useState<string>("");
  const [callReasons, setCallReasons] = useState<{ id: string; label: string; is_active: boolean }[]>([]);
  const [notes, setNotes] = useState<string>("");
  const [interactionChannel, setInteractionChannel] = useState<string>("call");
  const [followupAt, setFollowupAt] = useState<string>("");
  const [mentoringInterest, setMentoringInterest] = useState<boolean>(false);
  const [placementInterest, setPlacementInterest] = useState<boolean>(false);
  const [payForwardInterest, setPayForwardInterest] = useState<boolean>(false);
  const [supportAreas, setSupportAreas] = useState<('mentor' | 'skill_improvement' | 'career_guidance')[]>([]);

  // Profile Gap Inputs
  const [updatedCompany, setUpdatedCompany] = useState<string>("");
  const [updatedLinkedin, setUpdatedLinkedin] = useState<string>("");
  const [salaryAmount, setSalaryAmount] = useState<string>("");
  const [salaryUnit, setSalaryUnit] = useState<'monthly' | 'lpa'>("lpa");

  // Skip Reason Prompt state
  const [showSkipReasonPrompt, setShowSkipReasonPrompt] = useState<boolean>(false);
  const [pendingSkippedFields, setPendingSkippedFields] = useState<string[]>([]);
  const [skipReason, setSkipReason] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<PipelineSuggestion[]>([]);

  React.useEffect(() => {
    if (isOpen) {
      getCallReasonsAction().then(res => {
        if (res.success && res.data) {
          setCallReasons(res.data);
        }
      });
    }
  }, [isOpen]);

  const selectedOutcome = outcomes.find((o) => o.id === selectedOutcomeId);
  const isDiscussed = 
    selectedOutcome?.is_substantive_conversation || 
    selectedOutcome?.code === "discussed" || 
    selectedOutcome?.code === "connected_discussed" ||
    selectedOutcome?.code === "replied_pipeline_add" ||
    selectedOutcome?.code === "email_received";

  const suppressionReason = masterData?.contactSuppressionReason;
  const isSuppressed = !!suppressionReason;
  const allowedChannels = isSuppressed ? ["email"] : ["call", "message", "email"];

  // Ensure selected channel is valid
  React.useEffect(() => {
    if (!allowedChannels.includes(interactionChannel)) {
      setInteractionChannel(allowedChannels[0]);
    }
  }, [allowedChannels, interactionChannel]);

  const CHANNEL_OUTCOMES: Record<string, string[]> = {
    call: ['invalid_number', 'no_answer', 'callback_requested', 'discussed', 'connected_declined', 'connected_not_interested', 'do_not_contact'],
    message: ['invalid_number', 'no_answer', 'replied_requested_callback', 'replied_not_interested', 'do_not_contact', 'replied_pipeline_add'],
    email: ['email_received', 'email_sent']
  };

  const visibleOutcomes = outcomes.filter(o => 
    CHANNEL_OUTCOMES[interactionChannel]?.includes(o.code)
  );

  // Auto-deselect outcome if it's no longer valid for the channel
  React.useEffect(() => {
    if (selectedOutcomeId && !visibleOutcomes.find(o => o.id === selectedOutcomeId)) {
      setSelectedOutcomeId("");
    }
  }, [interactionChannel, selectedOutcomeId, visibleOutcomes]);

  const getFollowupConfig = () => {
    if (!selectedOutcome) return { mode: 'hidden' as const };
    const code = selectedOutcome.code;
    
    if (interactionChannel === 'call') {
      if (code === 'no_answer' || code === 'connected_declined') return { mode: 'auto' as const, autoDays: 3 };
      if (code === 'connected_not_interested') return { mode: 'auto' as const, autoDays: 180 };
      if (code === 'discussed' || code === 'connected_discussed') return { mode: 'custom' as const };
    }
    
    if (interactionChannel === 'message') {
      if (code === 'replied_not_interested') return { mode: 'auto' as const, autoDays: 180 };
      if (code === 'no_answer') return { mode: 'custom' as const };
    }

    if (interactionChannel === 'email' && code === 'email_sent') {
       return { mode: 'hidden' as const };
    }

    return selectedOutcome.requires_followup_datetime ? { mode: 'custom' as const } : { mode: 'optional' as const };
  };

  const followupConfig = getFollowupConfig();

  const missingCompany = completeness?.missing_company ?? !masterData?.company;
  const missingSalary = completeness?.missing_salary ?? (!masterData?.starting_salary && !salaryAmount);
  const missingLinkedin = completeness?.missing_linkedin ?? !masterData?.linkedin_url;

  const handleSupportAreaToggle = (area: 'mentor' | 'skill_improvement' | 'career_guidance') => {
    if (supportAreas.includes(area)) {
      setSupportAreas(supportAreas.filter((a) => a !== area));
    } else {
      setSupportAreas([...supportAreas, area]);
    }
  };

  const executeSubmission = async (skippedFields: string[], reasonForSkip?: string) => {
    setIsSubmitting(true);
    try {
      const res = await logInteractionAction({
        alumni_email: alumniEmail,
        logged_by: userEmail,
        interaction_channel: interactionChannel,
        outcome_id: selectedOutcomeId,
        call_reason_id: callReasonId || undefined,
        notes,
        mentoring_interest: mentoringInterest,
        placement_interest: placementInterest,
        pay_forward_interest: payForwardInterest,
        support_areas: supportAreas,
        followup_at: followupAt ? new Date(followupAt).toISOString() : null,
        salary_amount: salaryAmount ? parseFloat(salaryAmount) : undefined,
        salary_unit: salaryAmount ? salaryUnit : undefined,
        updated_company: updatedCompany || undefined,
        updated_linkedin: updatedLinkedin || undefined,
        skipped_missing_fields: skippedFields.length > 0 ? skippedFields : undefined,
        skip_reason: reasonForSkip || undefined,
      });

      if (!res.success) {
        toast.error(res.error || "Failed to save interaction");
      } else {
        toast.success("Interaction & Profile updates logged successfully!");
        if (res.data?.suggestions && res.data.suggestions.length > 0) {
          setSuggestions(res.data.suggestions);
        } else {
          resetForm();
          onClose();
        }
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
      setShowSkipReasonPrompt(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOutcomeId) {
      toast.error("Please select an outcome tag");
      return;
    }

    if (followupConfig.mode === 'custom' && (!followupAt || followupAt.trim() === "")) {
      toast.error("This outcome requires a follow-up date and time");
      return;
    }

    // Check for uncollected missing fields
    const skipped: string[] = [];
    if (missingCompany && !updatedCompany.trim()) skipped.push("Company");
    if (missingSalary && !salaryAmount.trim()) skipped.push("Salary");
    if (missingLinkedin && !updatedLinkedin.trim()) skipped.push("LinkedIn Profile");

    if (skipped.length > 0 && !showSkipReasonPrompt) {
      setPendingSkippedFields(skipped);
      setShowSkipReasonPrompt(true);
      return;
    }

    if (showSkipReasonPrompt && (!skipReason || skipReason.trim() === "")) {
      toast.error("Please select or enter a reason for skipping missing profile fields");
      return;
    }

    await executeSubmission(pendingSkippedFields, skipReason);
  };

  const handleAcceptSuggestion = async (sugg: PipelineSuggestion) => {
    try {
      const res = await updatePipelineMembershipAction({
        alumni_email: alumniEmail,
        pipeline_code: sugg.pipelineCode,
        added_by: userEmail,
        is_active: true,
      });
      if (res.success) {
        toast.success(`Added to ${sugg.pipelineLabel} pipeline`);
        setSuggestions(suggestions.filter((s) => s.pipelineCode !== sugg.pipelineCode));
        if (suggestions.length <= 1) {
          resetForm();
          onClose();
        }
      } else {
        toast.error(res.error || "Failed to add to pipeline");
      }
    } catch (err: any) {
      toast.error(err.message || "Error adding to pipeline");
    }
  };

  const resetForm = () => {
    setSelectedOutcomeId("");
    setCallReasonId("");
    setNotes("");
    setFollowupAt("");
    setMentoringInterest(false);
    setPlacementInterest(false);
    setPayForwardInterest(false);
    setSupportAreas([]);
    setSalaryAmount("");
    setUpdatedCompany("");
    setUpdatedLinkedin("");
    setShowSkipReasonPrompt(false);
    setPendingSkippedFields([]);
    setSkipReason("");
    setSuggestions([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) resetForm(); onClose(); }}>
      <DialogContent className="w-[90vw] max-w-[90vw] sm:max-w-[90vw] h-[90vh] max-h-[90vh] overflow-y-auto rounded-2xl border border-border/80 p-6 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
            <PhoneCall className="w-5 h-5 text-primary" />
            Log Interaction with {alumniName}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Record interaction details. Update missing profile fields below or specify a reason if skipped.
          </DialogDescription>
        </DialogHeader>

        {suggestions.length > 0 ? (
          <div className="space-y-4 py-4">
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200">
              <div className="flex items-center gap-2 font-bold text-sm mb-1">
                <CheckCircle2 className="w-4 h-4 text-amber-500" /> Suggested Pipeline Additions
              </div>
              <p className="text-xs text-muted-foreground">
                Based on your logged discussion, the system suggests adding {alumniName} to the following pipelines:
              </p>
            </div>

            <div className="space-y-3">
              {suggestions.map((sugg) => (
                <div
                  key={sugg.pipelineCode}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-card/80 shadow-xs hover:border-primary/40 transition-all"
                >
                  <div>
                    <div className="font-semibold text-sm text-foreground">{sugg.pipelineLabel}</div>
                    <div className="text-xs text-muted-foreground">{sugg.reason}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSuggestions(suggestions.filter((s) => s.pipelineCode !== sugg.pipelineCode))}
                    >
                      Dismiss
                    </Button>
                    <Button size="sm" onClick={() => handleAcceptSuggestion(sugg)}>
                      Confirm Add
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <DialogFooter className="mt-4">
              <Button variant="secondary" onClick={() => { resetForm(); onClose(); }}>
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Call Reason</label>
                <Select value={callReasonId} onValueChange={setCallReasonId}>
                  <SelectTrigger className="h-10 rounded-xl">
                    <SelectValue placeholder="Select reason..." />
                  </SelectTrigger>
                  <SelectContent>
                    {callReasons.filter(r => r.is_active).map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Interaction Channel</label>
                <Select value={interactionChannel} onValueChange={setInteractionChannel}>
                  <SelectTrigger className="h-10 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {allowedChannels.includes("call") && <SelectItem value="call">Phone Call</SelectItem>}
                    {allowedChannels.includes("message") && <SelectItem value="message">Message</SelectItem>}
                    {allowedChannels.includes("email") && <SelectItem value="email">Email</SelectItem>}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                  Outcome Tag <span className="text-destructive">*</span>
                </label>
                <Select value={selectedOutcomeId} onValueChange={setSelectedOutcomeId}>
                  <SelectTrigger className="h-10 rounded-xl">
                    <SelectValue placeholder="Select outcome..." />
                  </SelectTrigger>
                  <SelectContent>
                    {visibleOutcomes.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Profile Data Gaps Section */}
            {(missingCompany || missingSalary || missingLinkedin) && (
              <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-500" /> Missing Profile Data Fields (Fill below or state reason)
                  </span>
                  <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-700">
                    Data Collection
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {missingCompany && (
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-muted-foreground" /> Current Company
                      </label>
                      <Input
                        placeholder="Enter Company Name"
                        value={updatedCompany}
                        onChange={(e) => setUpdatedCompany(e.target.value)}
                        className="h-9 rounded-xl bg-background text-xs"
                      />
                    </div>
                  )}

                  {missingLinkedin && (
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                        <Linkedin className="w-3.5 h-3.5 text-blue-500" /> LinkedIn Profile URL
                      </label>
                      <Input
                        placeholder="https://linkedin.com/in/..."
                        value={updatedLinkedin}
                        onChange={(e) => setUpdatedLinkedin(e.target.value)}
                        className="h-9 rounded-xl bg-background text-xs"
                      />
                    </div>
                  )}

                  {missingSalary && (
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-500" /> Current Salary Update
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <Input
                          type="number"
                          placeholder="Salary Amount"
                          value={salaryAmount}
                          onChange={(e) => setSalaryAmount(e.target.value)}
                          className="col-span-2 h-9 rounded-xl bg-background text-xs"
                        />
                        <Select value={salaryUnit} onValueChange={(val: 'monthly' | 'lpa') => setSalaryUnit(val)}>
                          <SelectTrigger className="h-9 rounded-xl bg-background text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="lpa">LPA</SelectItem>
                            <SelectItem value="monthly">Monthly ₹</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Prompt Reason for Skipping Missing Fields */}
            {showSkipReasonPrompt && (
              <div className="p-4 rounded-xl border-2 border-amber-500 bg-amber-500/10 space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200">
                  <HelpCircle className="w-4 h-4 text-amber-600" /> Reason Required for Skipping Missing Fields
                </div>
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  You are submitting without entering data for: <strong>{pendingSkippedFields.join(", ")}</strong>. Please select or state why:
                </p>
                <Select value={skipReason} onValueChange={setSkipReason}>
                  <SelectTrigger className="h-10 rounded-xl bg-background">
                    <SelectValue placeholder="Select reason for skipping..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Alumnus declined to share details">Alumnus declined to share details</SelectItem>
                    <SelectItem value="Call ended abruptly / lost connection">Call ended abruptly / lost connection</SelectItem>
                    <SelectItem value="Will collect in follow-up call">Will collect in follow-up call</SelectItem>
                    <SelectItem value="Alumnus currently unemployed / searching">Alumnus currently unemployed / searching</SelectItem>
                    <SelectItem value="Other (specified in call notes)">Other (specified in call notes)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <FollowupDateSelector 
              value={followupAt} 
              onChange={setFollowupAt} 
              mode={followupConfig.mode} 
              autoDays={followupConfig.autoDays} 
            />

            {/* Interest Tags if Connected - Discussed */}
            {isDiscussed && (
              <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-3">
                <div className="text-xs font-bold text-primary tracking-wide uppercase flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4" /> Structured Discussion Outcomes
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                    <Checkbox checked={mentoringInterest} onCheckedChange={(c) => setMentoringInterest(Boolean(c))} />
                    Mentoring Interest
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                    <Checkbox checked={placementInterest} onCheckedChange={(c) => setPlacementInterest(Boolean(c))} />
                    Placement Interest
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                    <Checkbox checked={payForwardInterest} onCheckedChange={(c) => setPayForwardInterest(Boolean(c))} />
                    Pay-Forward Interest
                  </label>
                </div>

                {/* Granular support areas */}
                {mentoringInterest && (
                  <div className="pt-2 border-t border-border/60 space-y-2">
                    <label className="text-xs font-semibold text-foreground">Specific Support Areas:</label>
                    <div className="flex flex-wrap gap-2">
                      <Badge
                        variant={supportAreas.includes("mentor") ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => handleSupportAreaToggle("mentor")}
                      >
                        Mentor Matching
                      </Badge>
                      <Badge
                        variant={supportAreas.includes("skill_improvement") ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => handleSupportAreaToggle("skill_improvement")}
                      >
                        Skill Improvement
                      </Badge>
                      <Badge
                        variant={supportAreas.includes("career_guidance") ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => handleSupportAreaToggle("career_guidance")}
                      >
                        Career Guidance
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Detailed Interaction Notes</label>
              <Textarea
                placeholder="Record free-text discussion notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[90px] rounded-xl text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => { resetForm(); onClose(); }}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="rounded-xl font-medium">
                {isSubmitting ? "Saving..." : showSkipReasonPrompt ? "Confirm & Save Interaction Log" : "Save Interaction Log"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
