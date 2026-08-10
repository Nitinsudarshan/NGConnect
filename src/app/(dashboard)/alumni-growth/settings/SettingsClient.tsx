"use client";

import React, { useState } from "react";
import {
  Settings,
  ShieldAlert,
  Save,
  Plus,
  DollarSign,
  Users,
  SlidersHorizontal,
  UserCheck,
  Award,
  Layers,
  Tag,
  ArrowRightLeft,
  History,
  GitBranch,
  Percent,
  CheckCircle2,
  XCircle,
  Eye,
  MoreVertical,
  Edit2,
  Trash2,
  Archive,
  UserPlus,
  Linkedin,
  MapPin,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { PageBanner } from "@/components/shared/page-banner";
import { SettingsLayout, SettingsNavItem } from "@/components/settings/settings-layout";
import { EditLogTab } from "@/components/settings/edit-log-tab";
import { MentorStatsModalContent } from "@/components/settings/mentor-stats-modal";
import { MentorForm } from "@/components/settings/mentor-form";
import { ConfirmDeleteDialog } from "@/components/settings/confirm-delete-dialog";
import {
  ContributionType,
  DEFAULT_OUTCOME_MAPPINGS,
  InteractionOutcome,
  OrgSettings,
  OutcomeMappingRow,
  Pipeline,
  PipelineStage,
} from "@/types/engagement";
import type { Mentor, LearningCenterAuditLog } from "@/lib/learning-center/queries";
import {
  updateOrgSettingsAction,
  manageOutcomeAction,
  manageContributionTypeAction,
  managePipelineStageAction,
  saveOutcomeMappingAction,
} from "@/lib/engagement/actions";
import { archiveMentorAction } from "@/lib/learning-center/actions";
import { toast } from "sonner";

/* ─────────────────────────────────────── Types ──────────────────────────────────────── */

interface SettingsClientProps {
  settings: OrgSettings;
  outcomes: InteractionOutcome[];
  contributionTypes: ContributionType[];
  mentors: Mentor[];
  pipelines?: Pipeline[];
  stages?: PipelineStage[];
  userEmail: string;
  userRole: string;
  auditLogs: LearningCenterAuditLog[];
  initialOutcomeMappings?: OutcomeMappingRow[];
}

/* ──────────────────────────────────── Nav Items ─────────────────────────────────────── */

const NAV_ITEMS: SettingsNavItem[] = [
  // Group: Outreach Rules
  { label: "Pay-Forward Rules",      value: "pay_forward",    icon: DollarSign,    group: "Outreach Rules" },
  { label: "Active Member Criteria", value: "active_member",  icon: UserCheck,     group: "Outreach Rules" },
  { label: "Profile Scoring",        value: "profile_gaps",   icon: SlidersHorizontal, group: "Outreach Rules" },
  // Group: Pipeline Configuration
  { label: "Pipelines",              value: "pipelines",      icon: GitBranch,     group: "Pipeline Config" },
  { label: "Pipeline Stages",        value: "pipeline_stages",icon: Layers,        group: "Pipeline Config" },
  { label: "Interaction Outcomes",   value: "outcomes",       icon: Tag,           group: "Pipeline Config" },
  { label: "Contribution Types",     value: "contributions",  icon: Award,         group: "Pipeline Config" },
  { label: "Outcome Mapping",        value: "outcome_mapping",icon: ArrowRightLeft,group: "Pipeline Config" },
  // Group: People
  { label: "Mentors Directory",      value: "mentors",        icon: Users,         group: "People" },
  // Group: Audit
  { label: "Edit Log",               value: "edit_log",       icon: History,       group: "Audit" },
];

/* ────────────────────────────────── Static Outcome Mapping data ─────────────────────── */

const OUTCOME_MAPPING_ROWS = [
  { source: "Placement Dashboard", oldValue: "No Response",                                    newCode: "no_answer",          note: "" },
  { source: "Placement Dashboard", oldValue: "Call Back",                                      newCode: "callback_requested", note: "" },
  { source: "Placement Dashboard", oldValue: "Did Not Connect",                                newCode: "no_answer",          note: "" },
  { source: "Placement Dashboard", oldValue: "Discussed",                                      newCode: "discussed",          note: "" },
  { source: "Placement Dashboard", oldValue: "Invalid Number",                                 newCode: "invalid_number",     note: "" },
  { source: "Pay-Forward Data sheet", oldValue: "(free text — not auto-mapped)",               newCode: "discussed / no_answer / callback_requested", note: "Review manually" },
  { source: "Pay-Forward Data sheet", oldValue: "(free text mentioning 'don\u2019t contact again')", newCode: "do_not_contact", note: "Human review only — not auto-classified" },
  { source: "N/A \u2014 new code",     oldValue: "(no historical source)",                     newCode: "left_voicemail",     note: "Only applies going forward" },
];

/* ─────────────────────────────────────── Component ──────────────────────────────────── */

export default function SettingsClient({
  settings,
  outcomes: initialOutcomes,
  contributionTypes: initialContribTypes,
  mentors: initialMentors,
  pipelines,
  stages,
  userEmail,
  userRole,
  auditLogs,
  initialOutcomeMappings,
}: SettingsClientProps) {
  const isAdmin = userRole === "Admin" || userRole === "Super Admin";
  const [activeTab, setActiveTab] = useState("pay_forward");

  /* ── Org settings state ── */
  const [capInr, setCapInr]         = useState(settings.pay_forward_cap_inr.toString());
  const [minSalary, setMinSalary]   = useState(settings.pay_forward_min_salary_monthly_inr.toString());
  const [cooldown, setCooldown]     = useState(settings.followup_cooldown_days.toString());

  const [activeCoursera,  setActiveCoursera]  = useState(settings.active_criteria_coursera  ?? true);
  const [activeMentoring, setActiveMentoring] = useState(settings.active_criteria_mentoring ?? true);
  const [activeWatchTime, setActiveWatchTime] = useState(settings.active_criteria_watch_time ?? true);

  const [weightName,      setWeightName]      = useState((settings.weight_name      ?? 10).toString());
  const [weightEmail,     setWeightEmail]     = useState((settings.weight_email     ?? 10).toString());
  const [weightPhone,     setWeightPhone]     = useState((settings.weight_phone     ?? 10).toString());
  const [weightGender,    setWeightGender]    = useState((settings.weight_gender    ??  5).toString());
  const [weightCampus,    setWeightCampus]    = useState((settings.weight_campus    ??  5).toString());
  const [weightCourse,    setWeightCourse]    = useState((settings.weight_course    ??  5).toString());
  const [weightEntryYear, setWeightEntryYear] = useState((settings.weight_entry_year??  5).toString());
  const [weightLocation,  setWeightLocation]  = useState((settings.weight_location  ?? 10).toString());
  const [weightCompany,   setWeightCompany]   = useState((settings.weight_company   ?? 15).toString());
  const [weightSalary,    setWeightSalary]    = useState((settings.weight_salary    ?? 15).toString());
  const [weightLinkedin,  setWeightLinkedin]  = useState((settings.weight_linkedin  ??  5).toString());
  const [weightTechStack, setWeightTechStack] = useState((settings.weight_tech_stack??  5).toString());

  const [redThreshold,   setRedThreshold]   = useState((settings.profile_score_red_threshold   ?? 50).toString());
  const [amberThreshold, setAmberThreshold] = useState((settings.profile_score_amber_threshold ?? 80).toString());
  const [greenThreshold, setGreenThreshold] = useState((settings.profile_score_green_threshold ?? 100).toString());

  const [isSaving, setIsSaving] = useState(false);

  /* ── Outcome state ── */
  const [outcomes, setOutcomes] = useState<InteractionOutcome[]>(initialOutcomes);
  const [editingOutcome, setEditingOutcome] = useState<InteractionOutcome | null>(null);
  const [archivingOutcome, setArchivingOutcome] = useState<InteractionOutcome | null>(null);
  const [newOutcomeCode,        setNewOutcomeCode]        = useState("");
  const [newOutcomeLabel,       setNewOutcomeLabel]       = useState("");
  const [newOutcomeReqFollowup, setNewOutcomeReqFollowup] = useState(false);
  const [newOutcomeIsTerminal,  setNewOutcomeIsTerminal]  = useState(false);
  const [isAddingOutcome,       setIsAddingOutcome]       = useState(false);

  /* ── Contribution type state ── */
  const [contribTypes, setContribTypes] = useState<ContributionType[]>(initialContribTypes);
  const [editingContrib, setEditingContrib] = useState<ContributionType | null>(null);
  const [archivingContrib, setArchivingContrib] = useState<ContributionType | null>(null);
  const [newContribCode,        setNewContribCode]        = useState("");
  const [newContribLabel,       setNewContribLabel]       = useState("");
  const [newContribIsMonetary,  setNewContribIsMonetary]  = useState(false);
  const [isAddingContrib,       setIsAddingContrib]       = useState(false);

  /* ── Pipeline stage state ── */
  const [selectedPipelineId, setSelectedPipelineId] = useState(pipelines?.[0]?.id || "");
  const [editingPipelineStage, setEditingPipelineStage] = useState<PipelineStage | null>(null);
  const [archivingPipelineStage, setArchivingPipelineStage] = useState<PipelineStage | null>(null);
  const [newStageCode,       setNewStageCode]       = useState("");
  const [newStageLabel,      setNewStageLabel]      = useState("");
  const [newStageSortOrder,  setNewStageSortOrder]  = useState("1");
  const [newStageIsTerminal, setNewStageIsTerminal] = useState(false);

  /* ── Mentor state ── */
  const [mentorsState,     setMentorsState]     = useState<Mentor[]>(initialMentors);
  const [isAddMentorOpen,  setIsAddMentorOpen]  = useState(false);
  const [editingMentor,    setEditingMentor]    = useState<Mentor | null>(null);
  const [selectedMentorId, setSelectedMentorId] = useState<string | null>(null);
  const [archivingMentor,  setArchivingMentor]  = useState<Mentor | null>(null);

  /* ── Outcome Mapping state ── */
  const [outcomeMappings, setOutcomeMappings] = useState<OutcomeMappingRow[]>(
    initialOutcomeMappings || DEFAULT_OUTCOME_MAPPINGS
  );
  const [mappingModalOpen, setMappingModalOpen] = useState(false);
  const [editingMappingRow, setEditingMappingRow] = useState<OutcomeMappingRow | null>(null);
  const [mappingForm, setMappingForm] = useState({ source: "", old_value: "", new_code: "", note: "" });
  const [deletingMappingRow, setDeletingMappingRow] = useState<OutcomeMappingRow | null>(null);

  /* ────────────────────────────── Handlers ─────────────────────────────── */

  const totalWeightSum =
    [weightName, weightEmail, weightPhone, weightGender, weightCampus, weightCourse,
     weightEntryYear, weightLocation, weightCompany, weightSalary, weightLinkedin, weightTechStack]
      .reduce((acc, v) => acc + (parseFloat(v) || 0), 0);

  const handleSaveThresholds = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) { toast.error("Admin access required"); return; }
    setIsSaving(true);
    try {
      const res = await updateOrgSettingsAction({
        pay_forward_cap_inr:              parseFloat(capInr),
        pay_forward_min_salary_monthly_inr: parseFloat(minSalary),
        followup_cooldown_days:           parseInt(cooldown, 10),
        active_criteria_coursera:  activeCoursera,
        active_criteria_mentoring: activeMentoring,
        active_criteria_watch_time: activeWatchTime,
        weight_name:      parseFloat(weightName)      || 10,
        weight_email:     parseFloat(weightEmail)     || 10,
        weight_phone:     parseFloat(weightPhone)     || 10,
        weight_gender:    parseFloat(weightGender)    ||  5,
        weight_campus:    parseFloat(weightCampus)    ||  5,
        weight_course:    parseFloat(weightCourse)    ||  5,
        weight_entry_year: parseFloat(weightEntryYear)||  5,
        weight_location:  parseFloat(weightLocation)  || 10,
        weight_company:   parseFloat(weightCompany)   || 15,
        weight_salary:    parseFloat(weightSalary)    || 15,
        weight_linkedin:  parseFloat(weightLinkedin)  ||  5,
        weight_tech_stack: parseFloat(weightTechStack)||  5,
        profile_score_red_threshold:   parseFloat(redThreshold)   || 50,
        profile_score_amber_threshold: parseFloat(redThreshold)   || 50,
        profile_score_green_threshold: parseFloat(greenThreshold) || 100,
        updated_by: userEmail,
      });
      if (res.success) toast.success("Settings saved successfully!");
      else toast.error(res.error || "Failed to save settings");
    } catch (err: any) {
      toast.error(err.message || "Unexpected error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddOutcome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOutcomeCode || !newOutcomeLabel) return;
    setIsAddingOutcome(true);
    const res = await manageOutcomeAction({
      code:  newOutcomeCode.toLowerCase().replace(/\s+/g, "_"),
      label: newOutcomeLabel,
      requires_followup_datetime: newOutcomeReqFollowup,
      is_terminal: newOutcomeIsTerminal,
    });
    setIsAddingOutcome(false);
    if (res.success) {
      toast.success("Outcome saved");
      setNewOutcomeCode(""); setNewOutcomeLabel("");
      setNewOutcomeReqFollowup(false); setNewOutcomeIsTerminal(false);
      setEditingOutcome(null);
    } else {
      toast.error(res.error || "Failed to save outcome");
    }
  };

  const handleAddContrib = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContribCode || !newContribLabel) return;
    setIsAddingContrib(true);
    const res = await manageContributionTypeAction({
      code:  newContribCode.toLowerCase().replace(/\s+/g, "_"),
      label: newContribLabel,
      is_monetary: newContribIsMonetary,
    });
    setIsAddingContrib(false);
    if (res.success) {
      toast.success("Contribution type saved");
      setNewContribCode(""); setNewContribLabel(""); setNewContribIsMonetary(false);
      setEditingContrib(null);
    } else {
      toast.error(res.error || "Failed to save contribution type");
    }
  };

  const handleAddPipelineStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPipelineId || !newStageCode.trim() || !newStageLabel.trim()) {
      toast.error("Please select a pipeline and enter stage code and label");
      return;
    }
    const res = await managePipelineStageAction({
      pipeline_id: selectedPipelineId,
      code: newStageCode,
      label: newStageLabel,
      sort_order: parseInt(newStageSortOrder, 10) || 1,
      is_terminal: newStageIsTerminal,
    });
    if (res.success) {
      toast.success(`Stage '${newStageLabel}' saved!`);
      setNewStageCode(""); setNewStageLabel(""); setNewStageSortOrder("1"); setNewStageIsTerminal(false);
      setEditingPipelineStage(null);
    } else {
      toast.error(res.error || "Failed to save stage");
    }
  };

  const handleConfirmArchiveOutcome = async () => {
    if (!archivingOutcome) return;
    const res = await manageOutcomeAction({ ...archivingOutcome, archive: true });
    if (res.success) {
      setOutcomes(prev => prev.map(o => o.id === archivingOutcome.id ? { ...o, archived_at: new Date().toISOString() } : o));
      toast.success("Outcome archived");
    } else {
      toast.error(res.error);
    }
    setArchivingOutcome(null);
  };

  const handleConfirmArchiveContrib = async () => {
    if (!archivingContrib) return;
    const res = await manageContributionTypeAction({ ...archivingContrib, archive: true });
    if (res.success) {
      setContribTypes(prev => prev.map(c => c.id === archivingContrib.id ? { ...c, archived_at: new Date().toISOString() } : c));
      toast.success("Contribution type archived");
    } else {
      toast.error(res.error);
    }
    setArchivingContrib(null);
  };

  const handleConfirmArchivePipelineStage = async () => {
    if (!archivingPipelineStage) return;
    const res = await managePipelineStageAction({ ...archivingPipelineStage, archive: true });
    if (res.success) {
      toast.success("Pipeline stage archived");
      // Page reload to reflect changes since stages are not in local state
      window.location.reload();
    } else {
      toast.error(res.error);
    }
    setArchivingPipelineStage(null);
  };

  const handleConfirmArchiveMentor = async () => {
    if (!archivingMentor) return;
    const mentor = archivingMentor;
    setMentorsState((prev) => prev.map((m) => m.id === mentor.id ? { ...m, status: "Inactive" } : m));
    setArchivingMentor(null);
    toast.success(`Mentor '${mentor.name}' archived. Historical session data preserved.`);
    await archiveMentorAction(mentor.id, mentor.name);
  };

  const handleSaveOutcomeMapping = async () => {
    if (!mappingForm.source.trim() || !mappingForm.new_code.trim()) {
      toast.error("Source and New Code are required");
      return;
    }

    let updatedRows: OutcomeMappingRow[];
    let actionType: 'create' | 'update' = 'create';
    let detailsStr = "";

    if (editingMappingRow) {
      actionType = 'update';
      updatedRows = outcomeMappings.map((r) =>
        r.id === editingMappingRow.id
          ? { ...r, ...mappingForm }
          : r
      );
      detailsStr = `Updated outcome mapping '${mappingForm.source}: ${mappingForm.old_value} -> ${mappingForm.new_code}'`;
    } else {
      const newRow: OutcomeMappingRow = {
        id: `om-${Date.now()}`,
        ...mappingForm,
      };
      updatedRows = [...outcomeMappings, newRow];
      detailsStr = `Created outcome mapping '${mappingForm.source}: ${mappingForm.old_value} -> ${mappingForm.new_code}'`;
    }

    setOutcomeMappings(updatedRows);
    setMappingModalOpen(false);
    setEditingMappingRow(null);
    setMappingForm({ source: "", old_value: "", new_code: "", note: "" });

    const res = await saveOutcomeMappingAction(updatedRows, actionType, detailsStr);
    if (res.success) {
      toast.success(editingMappingRow ? "Outcome mapping updated" : "Outcome mapping created");
    } else {
      toast.error(res.error || "Failed to save outcome mapping");
    }
  };

  const handleConfirmDeleteMappingRow = async () => {
    if (!deletingMappingRow) return;
    const row = deletingMappingRow;
    const updatedRows = outcomeMappings.filter((r) => r.id !== row.id);
    const detailsStr = `Deleted outcome mapping '${row.source}: ${row.old_value} -> ${row.new_code}'`;
    setOutcomeMappings(updatedRows);
    setDeletingMappingRow(null);

    const res = await saveOutcomeMappingAction(updatedRows, 'delete', detailsStr);
    if (res.success) {
      toast.success("Outcome mapping deleted");
    } else {
      toast.error(res.error || "Failed to delete outcome mapping");
    }
  };

  const getMentorStatusColor = (status: string) => {
    switch (status) {
      case "Active":   return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800";
      case "Onboarded":return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800";
      case "Waitlisted":return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800";
      case "Inactive": return "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-900/50";
      default:         return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200";
    }
  };

  /* ────────────────────────────────── Render ───────────────────────────── */

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-20">
      <PageBanner
        title="Alumni Growth Settings"
        description={<p>Configure pay-forward rules, pipeline stages, interaction outcomes, contribution types, and mentor directory.</p>}
        icon={<Settings className="h-8 w-8 text-primary" />}
      />

      {!isAdmin && (
        <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-3 text-xs font-semibold">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>Restricted Access: You are in read-only mode. Only Admins can modify settings.</span>
        </div>
      )}

      <SettingsLayout navItems={NAV_ITEMS} activeValue={activeTab} onValueChange={setActiveTab}>

        {/* ════════════════ PAY-FORWARD RULES ════════════════ */}
        {activeTab === "pay_forward" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-foreground">Pay-Forward Rules &amp; Thresholds</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Set lifetime completion cap, pitch salary floor, and call cooldown periods.
              </p>
            </div>
            <form onSubmit={handleSaveThresholds} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Lifetime Completion Cap (₹)</label>
                  <Input type="number" value={capInr} onChange={(e) => setCapInr(e.target.value)} disabled={!isAdmin} className="h-10 rounded-xl" required />
                  <p className="text-[10px] text-muted-foreground">Default ₹1,20,000 completion cap</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Minimum Pitch Salary Floor (₹/mo)</label>
                  <Input type="number" value={minSalary} onChange={(e) => setMinSalary(e.target.value)} disabled={!isAdmin} className="h-10 rounded-xl" required />
                  <p className="text-[10px] text-muted-foreground">Default ₹15,000/mo minimum normalized salary</p>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-foreground">Follow-up Cool-down Period (Days)</label>
                  <Input type="number" value={cooldown} onChange={(e) => setCooldown(e.target.value)} disabled={!isAdmin} className="h-10 rounded-xl" required />
                  <p className="text-[10px] text-muted-foreground">Days before re-suggesting a call after no answer</p>
                </div>
              </div>
              {isAdmin && (
                <Button type="submit" disabled={isSaving} className="rounded-xl font-semibold gap-2">
                  <Save className="w-4 h-4" /> {isSaving ? "Saving…" : "Save Pay-Forward Rules"}
                </Button>
              )}
            </form>
          </div>
        )}

        {/* ════════════════ ACTIVE MEMBER CRITERIA ════════════════ */}
        {activeTab === "active_member" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-foreground">Active Member Criteria</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Select which criteria tag an alumnus as an "Active Member" in the Learning Center.
              </p>
            </div>
            <form onSubmit={handleSaveThresholds} className="space-y-6">
              <div className="space-y-3">
                {[
                  { label: "Active Coursera Subscription", desc: "Alumnus holds an active, unrevoked Coursera enterprise license.", checked: activeCoursera, onChange: setActiveCoursera },
                  { label: "Attended Mentoring &amp; Live Workshops", desc: "Alumnus has attended live mentoring sessions or workshops.", checked: activeMentoring, onChange: setActiveMentoring },
                  { label: "Logged Watch Hours from Video Recordings", desc: "Alumnus has recorded learning watch hours on Coursera or platform video recordings.", checked: activeWatchTime, onChange: setActiveWatchTime },
                ].map(({ label, desc, checked, onChange }) => (
                  <label key={label} className="flex items-center gap-2.5 p-3.5 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 cursor-pointer text-xs transition-colors">
                    <Checkbox checked={checked} onCheckedChange={(c) => onChange(Boolean(c))} disabled={!isAdmin} />
                    <div>
                      <span className="font-bold text-foreground block" dangerouslySetInnerHTML={{ __html: label }} />
                      <span className="text-[10px] text-muted-foreground">{desc}</span>
                    </div>
                  </label>
                ))}
              </div>
              {isAdmin && (
                <Button type="submit" disabled={isSaving} className="rounded-xl font-semibold gap-2">
                  <Save className="w-4 h-4" /> {isSaving ? "Saving…" : "Save Active Member Rules"}
                </Button>
              )}
            </form>
          </div>
        )}

        {/* ════════════════ PROFILE SCORING ════════════════ */}
        {activeTab === "profile_gaps" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-foreground">Profile Scoring &amp; Weightages</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Assign weightage points to all 12 profile parameters and set Red / Amber / Green thresholds.
              </p>
            </div>
            <form onSubmit={handleSaveThresholds} className="space-y-6">
              <div className="p-4 rounded-xl border border-border/80 bg-card/60 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Percent className="w-4 h-4 text-primary" /> Parameter Weightages (Total: {totalWeightSum} pts)
                  </span>
                  <Badge variant={totalWeightSum === 100 ? "default" : "destructive"} className="text-[10px] font-bold">
                    {totalWeightSum === 100 ? "100% Balanced" : `${totalWeightSum}% Total`}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
                  {[
                    ["Full Name",         weightName,      setWeightName],
                    ["Email Address",     weightEmail,     setWeightEmail],
                    ["Phone Number",      weightPhone,     setWeightPhone],
                    ["Gender",            weightGender,    setWeightGender],
                    ["Campus",            weightCampus,    setWeightCampus],
                    ["Course",            weightCourse,    setWeightCourse],
                    ["Entry Cohort/Year", weightEntryYear, setWeightEntryYear],
                    ["Location",          weightLocation,  setWeightLocation],
                    ["Current Company",   weightCompany,   setWeightCompany],
                    ["Salary/CTC",        weightSalary,    setWeightSalary],
                    ["LinkedIn Profile",  weightLinkedin,  setWeightLinkedin],
                    ["Technology Stack",  weightTechStack, setWeightTechStack],
                  ].map(([label, val, setter]: any) => (
                    <div key={label} className="space-y-1">
                      <label className="font-semibold text-foreground text-[11px]">{label}</label>
                      <Input type="number" value={val} onChange={(e) => setter(e.target.value)} disabled={!isAdmin} className="h-9 rounded-xl" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl border border-border/80 bg-card/60 space-y-4">
                <span className="text-xs font-bold text-foreground uppercase tracking-wider block">Stage Color Thresholds</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 space-y-1.5">
                    <div className="flex items-center justify-between font-bold text-destructive">
                      <span>RED (Critical)</span><span>Below {redThreshold}%</span>
                    </div>
                    <Input type="number" value={redThreshold} onChange={(e) => setRedThreshold(e.target.value)} disabled={!isAdmin} className="h-9 bg-background rounded-xl text-xs" />
                  </div>
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1.5">
                    <div className="flex items-center justify-between font-bold text-amber-800 dark:text-amber-300">
                      <span>AMBER (Warning)</span><span>{redThreshold}–{parseInt(greenThreshold) - 1}%</span>
                    </div>
                    <div className="h-9 bg-background/40 rounded-xl text-xs flex items-center px-3 text-amber-800/60 dark:text-amber-300/60 border border-amber-500/10 italic">
                      Auto-calculated range
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1.5">
                    <div className="flex items-center justify-between font-bold text-emerald-700 dark:text-emerald-300">
                      <span>GREEN (Verified)</span><span>{greenThreshold}%</span>
                    </div>
                    <Input type="number" value={greenThreshold} onChange={(e) => setGreenThreshold(e.target.value)} disabled={!isAdmin} className="h-9 bg-background rounded-xl text-xs" />
                  </div>
                </div>
              </div>

              {isAdmin && (
                <Button type="submit" disabled={isSaving} className="rounded-xl font-semibold gap-2">
                  <Save className="w-4 h-4" /> {isSaving ? "Saving…" : "Save Profile Scoring Rules"}
                </Button>
              )}
            </form>
          </div>
        )}

        {/* ════════════════ PIPELINES ════════════════ */}
        {activeTab === "pipelines" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-foreground">Pipelines</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                The three engagement pipelines that alumni can be enrolled into.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(pipelines || []).map((p) => {
                const pipeStages = (stages || []).filter((s) => s.pipeline_id === p.id);
                const colorMap: Record<string, string> = {
                  pay_forward: "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800",
                  mentoring:   "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800",
                  placement:   "text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800",
                };
                const cc = colorMap[p.code] || "text-foreground bg-card border-border";
                return (
                  <Card key={p.id} className={`rounded-2xl border shadow-sm ${cc}`}>
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-sm font-bold">{p.label}</CardTitle>
                        <Badge variant={p.is_active ? "default" : "outline"} className="text-[10px] shrink-0">
                          {p.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="font-mono text-[10px] text-muted-foreground">code: {p.code}</p>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                      <p className="text-xs text-muted-foreground">{pipeStages.length} stage{pipeStages.length !== 1 ? "s" : ""} configured</p>
                    </CardContent>
                  </Card>
                );
              })}
              {(!pipelines || pipelines.length === 0) && (
                <p className="text-xs text-muted-foreground col-span-3 italic">No pipelines found. Run the pipeline_stages migration SQL.</p>
              )}
            </div>
          </div>
        )}

        {/* ════════════════ PIPELINE STAGES ════════════════ */}
        {activeTab === "pipeline_stages" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-foreground">Pipeline Stages</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Admin-configurable stages for Pay-Forward, Mentoring, and Placement pipelines.
              </p>
            </div>

            <div className="space-y-4">
              {(pipelines || []).map((p) => {
                const pipeStages = (stages || []).filter((s) => s.pipeline_id === p.id);
                return (
                  <Card key={p.id} className="border border-border/80 rounded-2xl bg-card shadow-2xs">
                    <CardHeader className="p-4 pb-2 border-b border-border/40 flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-sm font-bold text-foreground">{p.label}</CardTitle>
                        <p className="text-[10px] text-muted-foreground font-mono">code: {p.code}</p>
                      </div>
                      <Badge variant="secondary" className="text-[10px] rounded-full">{pipeStages.length} stages</Badge>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="border rounded-lg overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs w-8">#</TableHead>
                              <TableHead className="text-xs">Label</TableHead>
                              <TableHead className="text-xs font-mono">Code</TableHead>
                              <TableHead className="text-xs text-center">Terminal</TableHead>
                              <TableHead className="text-xs text-center">Custom</TableHead>
                              {isAdmin && <TableHead className="text-xs text-right">Actions</TableHead>}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {pipeStages.filter(s => !s.archived_at).map((stg) => (
                              <TableRow key={stg.id}>
                                <TableCell className="text-xs text-muted-foreground">{stg.sort_order}</TableCell>
                                <TableCell className="text-xs font-medium">{stg.label}</TableCell>
                                <TableCell className="text-[11px] font-mono text-muted-foreground">{stg.code}</TableCell>
                                <TableCell className="text-center">
                                  {stg.is_terminal
                                    ? <CheckCircle2 className="w-3.5 h-3.5 text-destructive mx-auto" />
                                    : <XCircle className="w-3.5 h-3.5 text-muted-foreground/40 mx-auto" />}
                                </TableCell>
                                <TableCell className="text-center">
                                  {stg.is_custom
                                    ? <Badge variant="outline" className="text-[9px]">Custom</Badge>
                                    : <span className="text-[10px] text-muted-foreground">—</span>}
                                </TableCell>
                                {isAdmin && (
                                  <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1">
                                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                                        setSelectedPipelineId(p.id);
                                        setNewStageCode(stg.code);
                                        setNewStageLabel(stg.label);
                                        setNewStageSortOrder(stg.sort_order.toString());
                                        setNewStageIsTerminal(stg.is_terminal);
                                        setEditingPipelineStage(stg);
                                      }}>
                                        <Edit2 className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                                      </Button>
                                      <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/50" onClick={() => setArchivingPipelineStage(stg)}>
                                        <Archive className="w-3.5 h-3.5" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                )}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {isAdmin && (
              <Card className="border border-border/80 rounded-2xl bg-card shadow-2xs">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-bold text-foreground">Add Custom Stage</CardTitle>
                  <CardDescription className="text-xs">Add a campus-specific or org-specific stage to any pipeline.</CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  <form onSubmit={handleAddPipelineStage} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-muted-foreground">Pipeline</label>
                        <select
                          value={selectedPipelineId}
                          onChange={(e) => setSelectedPipelineId(e.target.value)}
                          className="w-full h-9 rounded-xl border border-border/80 bg-background px-3 text-xs"
                        >
                          {(pipelines || []).map((p) => (
                            <option key={p.id} value={p.id}>{p.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-muted-foreground">Stage Label</label>
                        <Input
                          placeholder="e.g. Screening Call"
                          value={newStageLabel}
                          onChange={(e) => {
                            setNewStageLabel(e.target.value);
                            if (!newStageCode) setNewStageCode(e.target.value.toLowerCase().replace(/\s+/g, "_"));
                          }}
                          className="h-9 rounded-xl text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-muted-foreground">Code</label>
                        <Input
                          placeholder="e.g. screening_call"
                          value={newStageCode}
                          onChange={(e) => setNewStageCode(e.target.value)}
                          className="h-9 rounded-xl text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-muted-foreground">Sort Order</label>
                        <Input
                          type="number"
                          value={newStageSortOrder}
                          onChange={(e) => setNewStageSortOrder(e.target.value)}
                          className="h-9 rounded-xl text-xs"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-border/40">
                      <label className="flex items-center gap-2 text-xs cursor-pointer">
                        <Checkbox checked={newStageIsTerminal} onCheckedChange={(c) => setNewStageIsTerminal(!!c)} />
                        <span className="font-medium">Terminal stage (closed / completed)</span>
                      </label>
                      <Button type="submit" size="sm" className="h-9 rounded-xl font-medium gap-1">
                        <Plus className="w-4 h-4" /> Add Stage
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ════════════════ INTERACTION OUTCOMES ════════════════ */}
        {activeTab === "outcomes" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-foreground">Interaction Outcomes</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Outcome codes available when logging calls or outreach attempts.
              </p>
            </div>

            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-mono">Code</TableHead>
                    <TableHead className="text-xs">Label</TableHead>
                    <TableHead className="text-xs text-center">Callback Req.</TableHead>
                    <TableHead className="text-xs text-center">Terminal</TableHead>
                    <TableHead className="text-xs text-center">Custom</TableHead>
                    <TableHead className="text-xs text-center">Active</TableHead>
                    {isAdmin && <TableHead className="text-xs text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {outcomes.filter(o => !o.archived_at).map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-mono text-[11px] text-muted-foreground">{o.code}</TableCell>
                      <TableCell className="text-xs font-medium">{o.label}</TableCell>
                      <TableCell className="text-center">
                        {o.requires_followup_datetime
                          ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mx-auto" />
                          : <XCircle className="w-3.5 h-3.5 text-muted-foreground/30 mx-auto" />}
                      </TableCell>
                      <TableCell className="text-center">
                        {o.is_terminal
                          ? <CheckCircle2 className="w-3.5 h-3.5 text-destructive mx-auto" />
                          : <XCircle className="w-3.5 h-3.5 text-muted-foreground/30 mx-auto" />}
                      </TableCell>
                      <TableCell className="text-center">
                        {o.is_custom
                          ? <Badge variant="outline" className="text-[9px]">Custom</Badge>
                          : <span className="text-[10px] text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={o.is_active ? "default" : "outline"} className="text-[9px]">
                          {o.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                              setNewOutcomeCode(o.code);
                              setNewOutcomeLabel(o.label);
                              setNewOutcomeReqFollowup(o.requires_followup_datetime);
                              setNewOutcomeIsTerminal(o.is_terminal);
                              setEditingOutcome(o);
                            }}>
                              <Edit2 className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/50" onClick={() => setArchivingOutcome(o)}>
                              <Archive className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {isAdmin && (
              <Card className="border border-border/60 rounded-2xl bg-card shadow-2xs">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-bold">Add Custom Outcome</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <form onSubmit={handleAddOutcome} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-muted-foreground">Code (snake_case)</label>
                        <Input
                          placeholder="e.g. busy_call_later"
                          value={newOutcomeCode}
                          onChange={(e) => setNewOutcomeCode(e.target.value)}
                          className="h-9 rounded-xl text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-muted-foreground">Display Label</label>
                        <Input
                          placeholder="e.g. Busy — call later"
                          value={newOutcomeLabel}
                          onChange={(e) => setNewOutcomeLabel(e.target.value)}
                          className="h-9 rounded-xl text-xs"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-6 pt-1">
                      <label className="flex items-center gap-2 text-xs cursor-pointer">
                        <Checkbox checked={newOutcomeReqFollowup} onCheckedChange={(c) => setNewOutcomeReqFollowup(!!c)} />
                        Requires callback date
                      </label>
                      <label className="flex items-center gap-2 text-xs cursor-pointer">
                        <Checkbox checked={newOutcomeIsTerminal} onCheckedChange={(c) => setNewOutcomeIsTerminal(!!c)} />
                        Terminal (ends pipeline engagement)
                      </label>
                    </div>
                    <div className="flex justify-end pt-1">
                      <Button type="submit" size="sm" disabled={isAddingOutcome} className="h-9 rounded-xl gap-1 font-medium">
                        <Plus className="w-4 h-4" /> {isAddingOutcome ? "Adding…" : "Add Outcome"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ════════════════ CONTRIBUTION TYPES ════════════════ */}
        {activeTab === "contributions" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-foreground">Contribution Types</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Monetary and non-monetary contribution types for Pay-Forward tracking.
              </p>
            </div>

            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-mono">Code</TableHead>
                    <TableHead className="text-xs">Label</TableHead>
                    <TableHead className="text-xs text-center">Monetary</TableHead>
                    <TableHead className="text-xs text-center">Custom</TableHead>
                    <TableHead className="text-xs text-center">Active</TableHead>
                    {isAdmin && <TableHead className="text-xs text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contribTypes.filter(c => !c.archived_at).map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-[11px] text-muted-foreground">{c.code}</TableCell>
                      <TableCell className="text-xs font-medium">{c.label}</TableCell>
                      <TableCell className="text-center">
                        {c.is_monetary
                          ? <Badge className="bg-emerald-500 text-white text-[9px]">₹ Monetary</Badge>
                          : <Badge variant="outline" className="text-[9px]">Non-monetary</Badge>}
                      </TableCell>
                      <TableCell className="text-center">
                        {c.is_custom
                          ? <Badge variant="outline" className="text-[9px]">Custom</Badge>
                          : <span className="text-[10px] text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={c.is_active ? "default" : "outline"} className="text-[9px]">
                          {c.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                              setNewContribCode(c.code);
                              setNewContribLabel(c.label);
                              setNewContribIsMonetary(c.is_monetary);
                              setEditingContrib(c);
                            }}>
                              <Edit2 className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/50" onClick={() => setArchivingContrib(c)}>
                              <Archive className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {isAdmin && (
              <Card className="border border-border/60 rounded-2xl bg-card shadow-2xs">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-bold">Add Custom Contribution Type</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <form onSubmit={handleAddContrib} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-muted-foreground">Code (snake_case)</label>
                        <Input
                          placeholder="e.g. workshop_hosted"
                          value={newContribCode}
                          onChange={(e) => setNewContribCode(e.target.value)}
                          className="h-9 rounded-xl text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-muted-foreground">Display Label</label>
                        <Input
                          placeholder="e.g. Workshop hosted"
                          value={newContribLabel}
                          onChange={(e) => setNewContribLabel(e.target.value)}
                          className="h-9 rounded-xl text-xs"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center gap-2 text-xs cursor-pointer">
                        <Checkbox checked={newContribIsMonetary} onCheckedChange={(c) => setNewContribIsMonetary(!!c)} />
                        Is a monetary contribution (₹ value tracked)
                      </label>
                      <Button type="submit" size="sm" disabled={isAddingContrib} className="h-9 rounded-xl gap-1 font-medium">
                        <Plus className="w-4 h-4" /> {isAddingContrib ? "Adding…" : "Add Type"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ════════════════ OUTCOME MAPPING ════════════════ */}
        {activeTab === "outcome_mapping" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-foreground">Outcome Mapping Reference</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Mapping rules from legacy source values to current <code className="bg-muted px-1 rounded text-[10px]">interaction_outcomes.code</code> values. Fully editable for system updates.
                </p>
              </div>
              {isAdmin && (
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingMappingRow(null);
                    setMappingForm({ source: "", old_value: "", new_code: "", note: "" });
                    setMappingModalOpen(true);
                  }}
                  className="rounded-xl font-medium gap-1 shrink-0"
                >
                  <Plus className="w-4 h-4" /> Add Outcome Mapping
                </Button>
              )}
            </div>

            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs w-[180px]">Source File</TableHead>
                    <TableHead className="text-xs">Old Value</TableHead>
                    <TableHead className="text-xs font-mono">New Code</TableHead>
                    <TableHead className="text-xs">Note</TableHead>
                    {isAdmin && <TableHead className="text-xs text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {outcomeMappings.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <Badge variant="secondary" className="text-[10px] font-normal whitespace-nowrap">{row.source}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground italic">{row.old_value || "(none)"}</TableCell>
                      <TableCell className="font-mono text-[11px] text-primary">{row.new_code}</TableCell>
                      <TableCell className="text-[10px] text-amber-600 dark:text-amber-400">{row.note || "—"}</TableCell>
                      {isAdmin && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setEditingMappingRow(row);
                                setMappingForm({
                                  source: row.source,
                                  old_value: row.old_value,
                                  new_code: row.new_code,
                                  note: row.note,
                                });
                                setMappingModalOpen(true);
                              }}
                            >
                              <Edit2 className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                              onClick={() => setDeletingMappingRow(row)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                  {outcomeMappings.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={isAdmin ? 5 : 4} className="text-center py-6 text-xs text-muted-foreground italic">
                        No outcome mappings defined.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="p-3 rounded-xl bg-muted/40 border border-border/60 text-xs text-muted-foreground flex items-start gap-2">
              <ArrowRightLeft className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
              <span>This table is used during legacy data ingestion to standardise historical outcomes into active system outcome codes.</span>
            </div>
          </div>
        )}

        {/* ════════════════ MENTORS DIRECTORY ════════════════ */}
        {activeTab === "mentors" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-foreground">Mentors Directory</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Shared mentor database — same data as Learning Center › Manage Mentors.
                </p>
              </div>
              <Button onClick={() => setIsAddMentorOpen(true)}>
                <UserPlus className="w-4 h-4 mr-2" /> Add Mentor
              </Button>
            </div>

            <div className="border rounded-md bg-card overflow-x-auto">
              <Table className="min-w-[640px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Domain / Role</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Sessions</TableHead>
                    <TableHead className="text-right">Rating</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mentorsState.map((mentor) => (
                    <TableRow key={mentor.id}>
                      <TableCell>
                        <div className="font-medium flex items-center gap-2">
                          {mentor.name}
                          {mentor.linkedin_url && (
                            <a href={mentor.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600">
                              <Linkedin className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{mentor.role || "—"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-muted-foreground text-sm">
                          <MapPin className="w-3 h-3" /> {mentor.city || "Remote"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`font-normal text-xs ${getMentorStatusColor(mentor.status)}`}>
                          {mentor.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm">{mentor.total_sessions}</TableCell>
                      <TableCell className="text-right font-medium text-emerald-600 dark:text-emerald-400 text-sm">
                        {mentor.rating > 0 ? `★ ${mentor.rating}` : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => setSelectedMentorId(mentor.id)}>
                                  <Eye className="w-4 h-4 text-muted-foreground hover:text-primary" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent><p>View Stats</p></TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="cursor-pointer" onClick={() => setEditingMentor(mentor)}>
                                <Edit2 className="w-4 h-4 mr-2" /> Edit Mentor
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600 cursor-pointer" onClick={() => setArchivingMentor(mentor)}>
                                <Trash2 className="w-4 h-4 mr-2" /> Archive Mentor
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {mentorsState.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-xs italic">
                        No mentors found. Add the first mentor using the button above.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* ════════════════ EDIT LOG ════════════════ */}
        {activeTab === "edit_log" && (
          <EditLogTab logs={auditLogs} sourceFilter="alumni_growth" />
        )}

      </SettingsLayout>

      {/* ── Mentor Dialogs ── */}
      <Dialog open={isAddMentorOpen} onOpenChange={setIsAddMentorOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogTitle>Add New Mentor</DialogTitle>
          <DialogDescription>Add a new mentor to the shared mentor database.</DialogDescription>
          <MentorForm onSuccess={() => setIsAddMentorOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingMentor} onOpenChange={(open) => !open && setEditingMentor(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogTitle>Edit Mentor</DialogTitle>
          <DialogDescription>Update the mentor's details.</DialogDescription>
          {editingMentor && (
            <MentorForm defaultValues={editingMentor} onSuccess={() => setEditingMentor(null)} />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedMentorId} onOpenChange={(open) => !open && setSelectedMentorId(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-[90vw] w-[95vw] sm:w-[90vw] h-[95vh] sm:h-[90vh] max-h-[95vh] p-4 sm:p-6 overflow-hidden flex flex-col">
          <DialogTitle className="sr-only">Mentor Stats &amp; Details</DialogTitle>
          <DialogDescription className="sr-only">View comprehensive statistics and session history for this mentor.</DialogDescription>
          <div className="flex-1 overflow-y-auto">
            {selectedMentorId && <MentorStatsModalContent mentorId={selectedMentorId} />}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Outcome Mapping Dialog ── */}
      <Dialog open={mappingModalOpen} onOpenChange={setMappingModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogTitle>{editingMappingRow ? "Edit Outcome Mapping" : "Add Outcome Mapping"}</DialogTitle>
          <DialogDescription>Map historical or raw file outcome text to system outcome codes.</DialogDescription>
          <div className="space-y-4 py-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Source Module / File</label>
              <Input
                placeholder="e.g. Placement Dashboard"
                value={mappingForm.source}
                onChange={(e) => setMappingForm({ ...mappingForm, source: e.target.value })}
                className="h-9 rounded-xl text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Old Raw Value / Text</label>
              <Input
                placeholder="e.g. No Response"
                value={mappingForm.old_value}
                onChange={(e) => setMappingForm({ ...mappingForm, old_value: e.target.value })}
                className="h-9 rounded-xl text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Target System Outcome Code</label>
              <Input
                placeholder="e.g. no_answer"
                value={mappingForm.new_code}
                onChange={(e) => setMappingForm({ ...mappingForm, new_code: e.target.value })}
                className="h-9 rounded-xl text-xs font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Note / Comment (Optional)</label>
              <Input
                placeholder="e.g. Review manually"
                value={mappingForm.note}
                onChange={(e) => setMappingForm({ ...mappingForm, note: e.target.value })}
                className="h-9 rounded-xl text-xs"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-border pt-3">
            <Button variant="outline" size="sm" onClick={() => setMappingModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveOutcomeMapping}>
              {editingMappingRow ? "Save Changes" : "Create Mapping"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Double Confirm Dialog for Outcome Mapping Deletion ── */}
      <ConfirmDeleteDialog
        open={!!deletingMappingRow}
        onOpenChange={(open) => !open && setDeletingMappingRow(null)}
        title="Delete Outcome Mapping"
        itemName={deletingMappingRow ? `${deletingMappingRow.source}: ${deletingMappingRow.old_value} -> ${deletingMappingRow.new_code}` : undefined}
        description="Are you sure you want to delete this outcome mapping rule? Ingested historical data matching this rule may default to unmapped."
        confirmLabel="Delete Mapping"
        onConfirm={handleConfirmDeleteMappingRow}
      />

      {/* ── Double Confirm Dialog for Mentor Archiving ── */}
      <ConfirmDeleteDialog
        open={!!archivingMentor}
        onOpenChange={(open) => !open && setArchivingMentor(null)}
        title="Archive Mentor"
        itemName={archivingMentor?.name}
        description="This mentor will be marked as Inactive. They will no longer be available for new session assignments, but all historical session data will be preserved."
        confirmLabel="Archive Mentor"
        onConfirm={handleConfirmArchiveMentor}
      />
      <ConfirmDeleteDialog
        open={!!archivingOutcome}
        onOpenChange={(open) => !open && setArchivingOutcome(null)}
        title="Archive Outcome"
        itemName={archivingOutcome?.label}
        description="Are you sure you want to archive this outcome? It will no longer be available for new interactions, but historical data will be preserved."
        confirmLabel="Archive Outcome"
        onConfirm={handleConfirmArchiveOutcome}
      />

      <ConfirmDeleteDialog
        open={!!archivingContrib}
        onOpenChange={(open) => !open && setArchivingContrib(null)}
        title="Archive Contribution Type"
        itemName={archivingContrib?.label}
        description="Are you sure you want to archive this contribution type? It will no longer be available for new records, but historical data will be preserved."
        confirmLabel="Archive Contribution"
        onConfirm={handleConfirmArchiveContrib}
      />

      <ConfirmDeleteDialog
        open={!!archivingPipelineStage}
        onOpenChange={(open) => !open && setArchivingPipelineStage(null)}
        title="Archive Pipeline Stage"
        itemName={archivingPipelineStage?.label}
        description="Are you sure you want to archive this stage? It will be removed from the pipeline options, but historical placements remain."
        confirmLabel="Archive Stage"
        onConfirm={handleConfirmArchivePipelineStage}
      />
    </div>
  );
}
