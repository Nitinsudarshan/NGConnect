"use client";

import React, { useState } from "react";
import { Settings, ShieldAlert, Save, Plus, Tag, DollarSign, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ContributionType, InteractionOutcome, OrgSettings } from "@/types/engagement";
import { updateOrgSettingsAction, manageOutcomeAction, manageContributionTypeAction } from "@/lib/engagement/actions";
import { toast } from "sonner";

interface SettingsClientProps {
  settings: OrgSettings;
  outcomes: InteractionOutcome[];
  contributionTypes: ContributionType[];
  userEmail: string;
  userRole: string;
}

export default function SettingsClient({
  settings,
  outcomes,
  contributionTypes,
  userEmail,
  userRole,
}: SettingsClientProps) {
  const isAdmin = userRole === "Admin" || userRole === "Super Admin";

  const [capInr, setCapInr] = useState(settings.pay_forward_cap_inr.toString());
  const [minSalary, setMinSalary] = useState(settings.pay_forward_min_salary_monthly_inr.toString());
  const [cooldown, setCooldown] = useState(settings.followup_cooldown_days.toString());
  const [isSaving, setIsSaving] = useState(false);

  // New Outcome tag form state
  const [newOutcomeCode, setNewOutcomeCode] = useState("");
  const [newOutcomeLabel, setNewOutcomeLabel] = useState("");
  const [newOutcomeReqFollowup, setNewOutcomeReqFollowup] = useState(false);

  // New Contribution type form state
  const [newContribCode, setNewContribCode] = useState("");
  const [newContribLabel, setNewContribLabel] = useState("");
  const [newContribIsMonetary, setNewContribIsMonetary] = useState(false);

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
        updated_by: userEmail,
      });

      if (res.success) {
        toast.success("Org settings saved successfully!");
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

  return (
    <div className="space-y-6 pb-16 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary" /> Org-Level Engagement Settings
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Configure thresholds for Pay-Forward caps, salary eligibility floors, and taxonomy lists.
        </p>
      </div>

      {!isAdmin && (
        <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-3 text-xs font-semibold">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>Restricted Access: You are viewing in read-only mode. Only Admins can modify settings.</span>
        </div>
      )}

      {/* Thresholds Form */}
      <Card className="border border-border/80 rounded-2xl bg-card shadow-xs">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-500" /> Thresholds & Rules Configuration
          </CardTitle>
          <CardDescription className="text-xs">
            Changes apply dynamically across all pipelines and dashboards without code deployments.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveThresholds} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Pay-Forward Lifetime Cap (₹)
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
                  Pay-Forward Min Monthly Salary (₹)
                </label>
                <Input
                  type="number"
                  value={minSalary}
                  onChange={(e) => setMinSalary(e.target.value)}
                  disabled={!isAdmin}
                  className="h-10 rounded-xl"
                  required
                />
                <p className="text-[10px] text-muted-foreground">Default ₹15,000/mo pitch floor</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Follow-up Cool-down (Days)
                </label>
                <Input
                  type="number"
                  value={cooldown}
                  onChange={(e) => setCooldown(e.target.value)}
                  disabled={!isAdmin}
                  className="h-10 rounded-xl"
                  required
                />
                <p className="text-[10px] text-muted-foreground">Days before re-attempt suggestion</p>
              </div>
            </div>

            {isAdmin && (
              <Button type="submit" disabled={isSaving} className="rounded-xl font-semibold gap-2">
                <Save className="w-4 h-4" /> {isSaving ? "Saving..." : "Save Configured Thresholds"}
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Outcome Taxonomy Management */}
      <Card className="border border-border/80 rounded-2xl bg-card shadow-xs">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Tag className="w-4 h-4 text-primary" /> Curated & Custom Outcome Tags
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {outcomes.map((o) => (
              <Badge key={o.id} variant={o.is_custom ? "default" : "secondary"} className="px-3 py-1 text-xs rounded-xl">
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
        </CardContent>
      </Card>

      {/* Contribution Types Management */}
      <Card className="border border-border/80 rounded-2xl bg-card shadow-xs">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-amber-500" /> Contribution Types (Monetary & Non-Monetary)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {contributionTypes.map((c) => (
              <Badge key={c.id} variant={c.is_monetary ? "default" : "outline"} className="px-3 py-1 text-xs rounded-xl">
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
        </CardContent>
      </Card>
    </div>
  );
}
