"use client";

import React, { useState } from "react";
import {
  Settings,
  ShieldAlert,
  Save,
  Plus,
  Tag,
  DollarSign,
  Users,
  SlidersHorizontal,
  Mail,
  UserPlus,
  CheckCircle2,
  UserCheck,
  Award,
  AlertCircle,
  Percent,
  Layers,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { PageBanner } from "@/components/shared/page-banner";
import { SettingsLayout, SettingsNavItem } from "@/components/settings/settings-layout";
import { ContributionType, InteractionOutcome, Mentor, OrgSettings, Pipeline, PipelineStage } from "@/types/engagement";
import { updateOrgSettingsAction, manageOutcomeAction, manageContributionTypeAction, managePipelineStageAction } from "@/lib/engagement/actions";
import { toast } from "sonner";

interface SettingsClientProps {
  settings: OrgSettings;
  outcomes: InteractionOutcome[];
  contributionTypes: ContributionType[];
  mentors: Mentor[];
  pipelines?: Pipeline[];
  stages?: PipelineStage[];
  userEmail: string;
  userRole: string;
}

const NAV_ITEMS: SettingsNavItem[] = [
  { label: "1. Pay-Forward Rules", value: "pay_forward", icon: DollarSign },
  { label: "2. Active Member Tags", value: "active_member", icon: UserCheck },
  { label: "3. Profile Data Gaps & Scoring", value: "profile_gaps", icon: SlidersHorizontal },
  { label: "Outcome Taxonomy", value: "outcomes", icon: Tag },
  { label: "Contribution Types", value: "contributions", icon: Award },
  { label: "Pipeline Stages", value: "pipeline_stages", icon: Layers },
  { label: "Mentors Directory", value: "mentors", icon: Users },
];

export default function SettingsClient({
  settings,
  outcomes,
  contributionTypes,
  mentors,
  pipelines,
  stages,
  userEmail,
  userRole,
}: SettingsClientProps) {
  const isAdmin = userRole === "Admin" || userRole === "Super Admin";
  const [activeTab, setActiveTab] = useState("pay_forward");

  // Thresholds & Rules state
  const [capInr, setCapInr] = useState(settings.pay_forward_cap_inr.toString());
  const [minSalary, setMinSalary] = useState(settings.pay_forward_min_salary_monthly_inr.toString());
  const [cooldown, setCooldown] = useState(settings.followup_cooldown_days.toString());
  
  // Active member tags state
  const [activeCoursera, setActiveCoursera] = useState(settings.active_criteria_coursera ?? true);
  const [activeMentoring, setActiveMentoring] = useState(settings.active_criteria_mentoring ?? true);
  const [activeWatchTime, setActiveWatchTime] = useState(settings.active_criteria_watch_time ?? true);

  // Full 12 Profile Parameter Weightages state
  const [weightName, setWeightName] = useState((settings.weight_name ?? 10).toString());
  const [weightEmail, setWeightEmail] = useState((settings.weight_email ?? 10).toString());
  const [weightPhone, setWeightPhone] = useState((settings.weight_phone ?? 10).toString());
  const [weightGender, setWeightGender] = useState((settings.weight_gender ?? 5).toString());
  const [weightCampus, setWeightCampus] = useState((settings.weight_campus ?? 5).toString());
  const [weightCourse, setWeightCourse] = useState((settings.weight_course ?? 5).toString());
  const [weightEntryYear, setWeightEntryYear] = useState((settings.weight_entry_year ?? 5).toString());
  const [weightLocation, setWeightLocation] = useState((settings.weight_location ?? 10).toString());
  const [weightCompany, setWeightCompany] = useState((settings.weight_company ?? 15).toString());
  const [weightSalary, setWeightSalary] = useState((settings.weight_salary ?? 15).toString());
  const [weightLinkedin, setWeightLinkedin] = useState((settings.weight_linkedin ?? 5).toString());
  const [weightTechStack, setWeightTechStack] = useState((settings.weight_tech_stack ?? 5).toString());

  // 3 Color Stage Thresholds state
  const [redThreshold, setRedThreshold] = useState((settings.profile_score_red_threshold ?? 50).toString());
  const [amberThreshold, setAmberThreshold] = useState((settings.profile_score_amber_threshold ?? 80).toString());
  const [greenThreshold, setGreenThreshold] = useState((settings.profile_score_green_threshold ?? 100).toString());

  const [isSaving, setIsSaving] = useState(false);

  // Outcome Tag state
  const [newOutcomeCode, setNewOutcomeCode] = useState("");
  const [newOutcomeLabel, setNewOutcomeLabel] = useState("");
  const [newOutcomeReqFollowup, setNewOutcomeReqFollowup] = useState(false);

  // Contribution Type state
  const [newContribCode, setNewContribCode] = useState("");
  const [newContribLabel, setNewContribLabel] = useState("");
  const [newContribIsMonetary, setNewContribIsMonetary] = useState(false);

  // Pipeline Stage state
  const [selectedPipelineId, setSelectedPipelineId] = useState(pipelines?.[0]?.id || "");
  const [newStageCode, setNewStageCode] = useState("");
  const [newStageLabel, setNewStageLabel] = useState("");
  const [newStageSortOrder, setNewStageSortOrder] = useState("1");
  const [newStageIsTerminal, setNewStageIsTerminal] = useState(false);

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
      toast.success(`Pipeline stage '${newStageLabel}' saved successfully!`);
      setNewStageCode("");
      setNewStageLabel("");
      setNewStageSortOrder("1");
      setNewStageIsTerminal(false);
    } else {
      toast.error(res.error || "Failed to save pipeline stage");
    }
  };

  const handleSaveThresholds = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      toast.error("Admin access required to modify settings");
      return;
    }

    setIsSaving(true);
    try {
      const res = await updateOrgSettingsAction({
        pay_forward_cap_inr: parseFloat(capInr),
        pay_forward_min_salary_monthly_inr: parseFloat(minSalary),
        followup_cooldown_days: parseInt(cooldown, 10),
        active_criteria_coursera: activeCoursera,
        active_criteria_mentoring: activeMentoring,
        active_criteria_watch_time: activeWatchTime,
        weight_name: parseFloat(weightName) || 10,
        weight_email: parseFloat(weightEmail) || 10,
        weight_phone: parseFloat(weightPhone) || 10,
        weight_gender: parseFloat(weightGender) || 5,
        weight_campus: parseFloat(weightCampus) || 5,
        weight_course: parseFloat(weightCourse) || 5,
        weight_entry_year: parseFloat(weightEntryYear) || 5,
        weight_location: parseFloat(weightLocation) || 10,
        weight_company: parseFloat(weightCompany) || 15,
        weight_salary: parseFloat(weightSalary) || 15,
        weight_linkedin: parseFloat(weightLinkedin) || 5,
        weight_tech_stack: parseFloat(weightTechStack) || 5,
        profile_score_red_threshold: parseFloat(redThreshold) || 50,
        profile_score_amber_threshold: parseFloat(amberThreshold) || 80,
        profile_score_green_threshold: parseFloat(greenThreshold) || 100,
        updated_by: userEmail,
      });

      if (res.success) {
        toast.success("Settings & Profile Weightages saved successfully!");
      } else {
        toast.error(res.error || "Failed to save settings");
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddOutcome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOutcomeCode || !newOutcomeLabel) return;
    const res = await manageOutcomeAction({
      code: newOutcomeCode.toLowerCase().replace(/\s+/g, "_"),
      label: newOutcomeLabel,
      requires_followup_datetime: newOutcomeReqFollowup,
    });

    if (res.success) {
      toast.success("Custom outcome tag added");
      setNewOutcomeCode("");
      setNewOutcomeLabel("");
    } else {
      toast.error(res.error || "Failed to add outcome tag");
    }
  };

  const handleAddContributionType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContribCode || !newContribLabel) return;
    const res = await manageContributionTypeAction({
      code: newContribCode.toLowerCase().replace(/\s+/g, "_"),
      label: newContribLabel,
      is_monetary: newContribIsMonetary,
    });

    if (res.success) {
      toast.success("Contribution type added");
      setNewContribCode("");
      setNewContribLabel("");
    } else {
      toast.error(res.error || "Failed to add contribution type");
    }
  };

  const totalWeightSum =
    (parseFloat(weightName) || 0) +
    (parseFloat(weightEmail) || 0) +
    (parseFloat(weightPhone) || 0) +
    (parseFloat(weightGender) || 0) +
    (parseFloat(weightCampus) || 0) +
    (parseFloat(weightCourse) || 0) +
    (parseFloat(weightEntryYear) || 0) +
    (parseFloat(weightLocation) || 0) +
    (parseFloat(weightCompany) || 0) +
    (parseFloat(weightSalary) || 0) +
    (parseFloat(weightLinkedin) || 0) +
    (parseFloat(weightTechStack) || 0);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-20">
      {/* Standard Page Banner */}
      <PageBanner
        title="Alumni Growth Settings"
        description={<p>Configure organization thresholds, active member rules, and profile completeness scoring.</p>}
        icon={<Settings className="h-8 w-8 text-primary" />}
      />

      {!isAdmin && (
        <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-3 text-xs font-semibold">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>Restricted Access: You are viewing in read-only mode. Only Admins can modify settings.</span>
        </div>
      )}

      {/* Two-Column Settings Layout */}
      <SettingsLayout navItems={NAV_ITEMS} activeValue={activeTab} onValueChange={setActiveTab}>
        {/* Section Heading Indicator */}
        {["pay_forward", "active_member", "profile_gaps"].includes(activeTab) && (
          <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 mb-4 flex items-center justify-between">
            <span className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4" /> Thresholds & Rules Settings Group
            </span>
            <Badge variant="outline" className="text-[10px] uppercase font-mono">
              Config Sub-Item
            </Badge>
          </div>
        )}

        {/* Sub-Nav 1: Pay-Forward Rules */}
        {activeTab === "pay_forward" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-foreground">1. Pay-Forward Rules & Thresholds</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Set lifetime completion cap, pitch salary floor, and call cooldown periods.
              </p>
            </div>

            <form onSubmit={handleSaveThresholds} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Pay-Forward Lifetime Completion Cap (₹)
                  </label>
                  <Input
                    type="number"
                    value={capInr}
                    onChange={(e) => setCapInr(e.target.value)}
                    disabled={!isAdmin}
                    className="h-10 rounded-xl"
                    required
                  />
                  <p className="text-[10px] text-muted-foreground">Default ₹1,20,000 completion cap</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Pay-Forward Minimum Pitch Salary Floor (₹)
                  </label>
                  <Input
                    type="number"
                    value={minSalary}
                    onChange={(e) => setMinSalary(e.target.value)}
                    disabled={!isAdmin}
                    className="h-10 rounded-xl"
                    required
                  />
                  <p className="text-[10px] text-muted-foreground">Default ₹15,000/mo minimum normalized salary</p>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-foreground">
                    Follow-up Cool-down Period (Days)
                  </label>
                  <Input
                    type="number"
                    value={cooldown}
                    onChange={(e) => setCooldown(e.target.value)}
                    disabled={!isAdmin}
                    className="h-10 rounded-xl"
                    required
                  />
                  <p className="text-[10px] text-muted-foreground">Default days before suggesting re-attempt after unanswered call</p>
                </div>
              </div>

              {isAdmin && (
                <Button type="submit" disabled={isSaving} className="rounded-xl font-semibold gap-2">
                  <Save className="w-4 h-4" /> {isSaving ? "Saving..." : "Save Pay-Forward Rules"}
                </Button>
              )}
            </form>
          </div>
        )}

        {/* Sub-Nav 2: Active Member Tags */}
        {activeTab === "active_member" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-foreground">2. Active Member Tag Definition Rules</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Select which criteria tag an alumnus as an "Active Member" in the Learning center:
              </p>
            </div>

            <form onSubmit={handleSaveThresholds} className="space-y-6">
              <div className="space-y-3">
                <label className="flex items-center gap-2.5 p-3.5 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 cursor-pointer text-xs transition-colors">
                  <Checkbox
                    checked={activeCoursera}
                    onCheckedChange={(checked) => setActiveCoursera(Boolean(checked))}
                    disabled={!isAdmin}
                  />
                  <div>
                    <span className="font-bold text-foreground block">Active Coursera Subscription</span>
                    <span className="text-[10px] text-muted-foreground">Alumnus holds an active, unrevoked Coursera enterprise license.</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-3.5 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 cursor-pointer text-xs transition-colors">
                  <Checkbox
                    checked={activeMentoring}
                    onCheckedChange={(checked) => setActiveMentoring(Boolean(checked))}
                    disabled={!isAdmin}
                  />
                  <div>
                    <span className="font-bold text-foreground block">Attended Mentoring & Live Workshops</span>
                    <span className="text-[10px] text-muted-foreground">Alumnus has attended live mentoring sessions or workshops.</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-3.5 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 cursor-pointer text-xs transition-colors">
                  <Checkbox
                    checked={activeWatchTime}
                    onCheckedChange={(checked) => setActiveWatchTime(Boolean(checked))}
                    disabled={!isAdmin}
                  />
                  <div>
                    <span className="font-bold text-foreground block">Logged Watch Hours from Video Recordings</span>
                    <span className="text-[10px] text-muted-foreground">Alumnus has recorded learning watch hours on Coursera or platform video recordings.</span>
                  </div>
                </label>
              </div>

              {isAdmin && (
                <Button type="submit" disabled={isSaving} className="rounded-xl font-semibold gap-2">
                  <Save className="w-4 h-4" /> {isSaving ? "Saving..." : "Save Active Member Rules"}
                </Button>
              )}
            </form>
          </div>
        )}

        {/* Sub-Nav 3: Profile Data Gaps & Scoring */}
        {activeTab === "profile_gaps" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-foreground">3. Full Profile Parameter Weightages & Scoring</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Assign weightage points to all 12 profile parameters and set stage color thresholds (Red, Amber, Green).
              </p>
            </div>

            <form onSubmit={handleSaveThresholds} className="space-y-6">
              {/* Full 12 Parameter Weightage Allocation */}
              <div className="p-4 rounded-xl border border-border/80 bg-card/60 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Percent className="w-4 h-4 text-primary" /> Full 12 Profile Parameter Weightages (Total: {totalWeightSum} points)
                  </span>
                  <Badge variant={totalWeightSum === 100 ? "default" : "destructive"} className="text-[10px] font-bold">
                    {totalWeightSum === 100 ? "100% Balanced" : `${totalWeightSum}% Total`}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Full Name Weightage</label>
                    <Input
                      type="number"
                      value={weightName}
                      onChange={(e) => setWeightName(e.target.value)}
                      disabled={!isAdmin}
                      className="h-9 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Email Address Weightage</label>
                    <Input
                      type="number"
                      value={weightEmail}
                      onChange={(e) => setWeightEmail(e.target.value)}
                      disabled={!isAdmin}
                      className="h-9 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Phone Number Weightage</label>
                    <Input
                      type="number"
                      value={weightPhone}
                      onChange={(e) => setWeightPhone(e.target.value)}
                      disabled={!isAdmin}
                      className="h-9 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Gender Weightage</label>
                    <Input
                      type="number"
                      value={weightGender}
                      onChange={(e) => setWeightGender(e.target.value)}
                      disabled={!isAdmin}
                      className="h-9 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Campus Weightage</label>
                    <Input
                      type="number"
                      value={weightCampus}
                      onChange={(e) => setWeightCampus(e.target.value)}
                      disabled={!isAdmin}
                      className="h-9 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Course Weightage</label>
                    <Input
                      type="number"
                      value={weightCourse}
                      onChange={(e) => setWeightCourse(e.target.value)}
                      disabled={!isAdmin}
                      className="h-9 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Entry Cohort / Year</label>
                    <Input
                      type="number"
                      value={weightEntryYear}
                      onChange={(e) => setWeightEntryYear(e.target.value)}
                      disabled={!isAdmin}
                      className="h-9 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Location (City/State)</label>
                    <Input
                      type="number"
                      value={weightLocation}
                      onChange={(e) => setWeightLocation(e.target.value)}
                      disabled={!isAdmin}
                      className="h-9 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Current Company</label>
                    <Input
                      type="number"
                      value={weightCompany}
                      onChange={(e) => setWeightCompany(e.target.value)}
                      disabled={!isAdmin}
                      className="h-9 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Salary Log / CTC</label>
                    <Input
                      type="number"
                      value={weightSalary}
                      onChange={(e) => setWeightSalary(e.target.value)}
                      disabled={!isAdmin}
                      className="h-9 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">LinkedIn Profile URL</label>
                    <Input
                      type="number"
                      value={weightLinkedin}
                      onChange={(e) => setWeightLinkedin(e.target.value)}
                      disabled={!isAdmin}
                      className="h-9 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Technology Stack</label>
                    <Input
                      type="number"
                      value={weightTechStack}
                      onChange={(e) => setWeightTechStack(e.target.value)}
                      disabled={!isAdmin}
                      className="h-9 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* 3 Color Stage Thresholds (RED, AMBER, GREEN 100%) */}
              <div className="p-4 rounded-xl border border-border/80 bg-card/60 space-y-4">
                <span className="text-xs font-bold text-foreground uppercase tracking-wider block">
                  Profile Stage Thresholds & Color Banners (Red, Amber, Green)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  {/* RED Stage */}
                  <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 space-y-1.5">
                    <div className="flex items-center justify-between font-bold text-destructive">
                      <span>RED Stage (Critical Alert)</span>
                      <span>Below {redThreshold}%</span>
                    </div>
                    <Input
                      type="number"
                      value={redThreshold}
                      onChange={(e) => setRedThreshold(e.target.value)}
                      disabled={!isAdmin}
                      className="h-9 bg-background rounded-xl text-xs"
                    />
                    <p className="text-[10px] text-muted-foreground">Scores below {redThreshold}% trigger Critical Red Data Gap banner.</p>
                  </div>

                  {/* AMBER Stage */}
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1.5">
                    <div className="flex items-center justify-between font-bold text-amber-800 dark:text-amber-300">
                      <span>AMBER Stage (Warning)</span>
                      <span>{redThreshold}% - {parseInt(greenThreshold) - 1}%</span>
                    </div>
                    <Input
                      type="number"
                      value={amberThreshold}
                      onChange={(e) => setAmberThreshold(e.target.value)}
                      disabled={!isAdmin}
                      className="h-9 bg-background rounded-xl text-xs"
                    />
                    <p className="text-[10px] text-muted-foreground">Scores between {redThreshold}% and {greenThreshold}% trigger Amber Warning banner.</p>
                  </div>

                  {/* GREEN Stage */}
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1.5">
                    <div className="flex items-center justify-between font-bold text-emerald-700 dark:text-emerald-300">
                      <span>GREEN Stage (Verified)</span>
                      <span>{greenThreshold}% Complete</span>
                    </div>
                    <Input
                      type="number"
                      value={greenThreshold}
                      onChange={(e) => setGreenThreshold(e.target.value)}
                      disabled={!isAdmin}
                      className="h-9 bg-background rounded-xl text-xs"
                    />
                    <p className="text-[10px] text-muted-foreground">Scores reaching {greenThreshold}% display Green Verified Profile badge.</p>
                  </div>
                </div>
              </div>

              {isAdmin && (
                <Button type="submit" disabled={isSaving} className="rounded-xl font-semibold gap-2">
                  <Save className="w-4 h-4" /> {isSaving ? "Saving..." : "Save Profile Scoring Rules & Thresholds"}
                </Button>
              )}
            </form>
          </div>
        )}

        {/* Tab 4: Outcome Taxonomy */}
        {activeTab === "outcomes" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-foreground">Interaction Outcome Taxonomy</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Curated & custom outcome tags available when logging calls or outreach attempts.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {outcomes.map((o) => (
                <Badge key={o.id} variant={o.is_custom ? "default" : "secondary"} className="px-3 py-1.5 text-xs rounded-xl">
                  {o.label} {o.requires_followup_datetime ? " (Requires Callback Date)" : ""}
                </Badge>
              ))}
            </div>

            {isAdmin && (
              <form onSubmit={handleAddOutcome} className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-3 pt-4">
                <span className="text-xs font-bold text-foreground">Add Custom Outcome Tag</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input
                    placeholder="Code (e.g. busy_call_later)"
                    value={newOutcomeCode}
                    onChange={(e) => setNewOutcomeCode(e.target.value)}
                    className="h-9 rounded-xl text-xs"
                  />
                  <Input
                    placeholder="Display Label"
                    value={newOutcomeLabel}
                    onChange={(e) => setNewOutcomeLabel(e.target.value)}
                    className="h-9 rounded-xl text-xs"
                  />
                  <Button type="submit" size="sm" className="h-9 rounded-xl font-medium gap-1">
                    <Plus className="w-4 h-4" /> Add Tag
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Tab 5: Contribution Types */}
        {activeTab === "contributions" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-foreground">Contribution Types Taxonomy</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Manage monetary and non-monetary contribution types for Pay-Forward tracking.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {contributionTypes.map((c) => (
                <Badge key={c.id} variant={c.is_monetary ? "default" : "outline"} className="px-3 py-1.5 text-xs rounded-xl">
                  {c.label} ({c.is_monetary ? "Monetary" : "Non-Monetary"})
                </Badge>
              ))}
            </div>

            {isAdmin && (
              <form onSubmit={handleAddContributionType} className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-3 pt-4">
                <span className="text-xs font-bold text-foreground">Add Custom Contribution Type</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input
                    placeholder="Code (e.g. workshop_hosted)"
                    value={newContribCode}
                    onChange={(e) => setNewContribCode(e.target.value)}
                    className="h-9 rounded-xl text-xs"
                  />
                  <Input
                    placeholder="Display Label"
                    value={newContribLabel}
                    onChange={(e) => setNewContribLabel(e.target.value)}
                    className="h-9 rounded-xl text-xs"
                  />
                  <Button type="submit" size="sm" className="h-9 rounded-xl font-medium gap-1">
                    <Plus className="w-4 h-4" /> Add Type
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Tab 6: Pipeline Stages Taxonomy */}
        {activeTab === "pipeline_stages" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-foreground">Per-Pipeline Stage Taxonomy</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Admin-configurable curated and custom stages for Pay-Forward, Mentoring, and Placement pipelines.
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
                      <Badge variant="secondary" className="text-[10px] rounded-full">
                        {pipeStages.length} Stages
                      </Badge>
                    </CardHeader>
                    <CardContent className="p-4 space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {pipeStages.map((stg) => (
                          <div key={stg.id} className="p-2.5 rounded-xl border border-border/60 bg-muted/20 flex flex-col justify-between text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-foreground">{stg.label}</span>
                              <Badge variant={stg.is_terminal ? "destructive" : "outline"} className="text-[9px]">
                                {stg.is_terminal ? "Terminal" : "In Progress"}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                              <span className="font-mono">code: {stg.code}</span>
                              <span>Order: {stg.sort_order}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {isAdmin && (
              <Card className="border border-border/80 rounded-2xl bg-card shadow-2xs">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-bold text-foreground">Add Custom Stage to Pipeline</CardTitle>
                  <CardDescription className="text-xs">
                    Configure additional campus-specific or custom stages for any active pipeline.
                  </CardDescription>
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
                            <option key={p.id} value={p.id}>
                              {p.label}
                            </option>
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
                            if (!newStageCode) {
                              setNewStageCode(e.target.value.toLowerCase().replace(/\s+/g, "_"));
                            }
                          }}
                          className="h-9 rounded-xl text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-muted-foreground">Stage Code</label>
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
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="is_terminal"
                          checked={newStageIsTerminal}
                          onCheckedChange={(checked) => setNewStageIsTerminal(!!checked)}
                        />
                        <label htmlFor="is_terminal" className="text-xs font-medium text-foreground cursor-pointer">
                          Is terminal stage (closed/completed)
                        </label>
                      </div>

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

        {/* Tab 7: Mentors Directory */}
        {activeTab === "mentors" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground">Volunteer Mentors Directory</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Sourced mentors feeding the Mentoring & Career Support pipeline.
                </p>
              </div>
              <Badge variant="outline" className="text-xs rounded-full">
                {mentors.length} Active Mentors
              </Badge>
            </div>

            <div className="space-y-3">
              {mentors.map((m) => (
                <div key={m.id} className="p-3.5 rounded-xl border border-border/70 bg-card flex justify-between items-center text-xs">
                  <div>
                    <div className="font-bold text-foreground text-sm">{m.name}</div>
                    <div className="text-muted-foreground font-mono text-[11px]">{m.email || "No email"}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {m.areas?.map((area) => (
                      <Badge key={area} variant="secondary" className="text-[10px]">
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}

              {mentors.length === 0 && (
                <div className="py-8 text-center text-xs text-muted-foreground italic">
                  No volunteer mentors logged yet.
                </div>
              )}
            </div>
          </div>
        )}
      </SettingsLayout>
    </div>
  );
}
