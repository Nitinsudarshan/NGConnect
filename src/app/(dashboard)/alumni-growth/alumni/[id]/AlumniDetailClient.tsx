"use client";

import React, { useState, useEffect } from "react";
import { useBreadcrumb } from "@/contexts/breadcrumb-context";
import Link from "next/link";

import {
  User,
  Building2,
  GraduationCap,
  Calendar,
  Phone,
  Mail,
  Linkedin,
  DollarSign,
  PhoneCall,
  History,
  AlertCircle,
  Award,
  ArrowLeft,
  Clock,
  ArrowRight,
  CheckCircle2,
  Database,
  FileText,
  Maximize2,
  MapPin,
  Briefcase,
  BookOpen,
  UserCheck,
  Video,
  PlayCircle,
  Star,
  ExternalLink,
  Code2,
  CheckCircle,
  Edit3,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageBanner } from "@/components/shared/page-banner";
import CourseraAlumniStats from "@/app/(dashboard)/manage/master-data/_components/CourseraAlumniStats";
import LogInteractionModal from "@/components/engagement/LogInteractionModal";
import TransferLeadModal from "@/components/engagement/TransferLeadModal";
import { InteractionOutcome, OrgSettings } from "@/types/engagement";
import { updateAlumniProfileFieldsAction } from "@/lib/engagement/actions";
import { calculateProfileScore, formatINR } from "@/lib/engagement/utils";
import { toast } from "sonner";

interface AlumniDetailClientProps {
  data: any;
  outcomes: InteractionOutcome[];
  settings: OrgSettings;
  userEmail: string;
}

export default function AlumniDetailClient({
  data,
  outcomes,
  settings,
  userEmail,
}: AlumniDetailClientProps) {
  const [activeTab, setActiveTab] = useState("details");
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  // Missing Fields Modal State
  const [isEditMissingModalOpen, setIsEditMissingModalOpen] = useState(false);
  const [editCompany, setEditCompany] = useState("");
  const [editSalaryAmount, setEditSalaryAmount] = useState("");
  const [editSalaryUnit, setEditSalaryUnit] = useState<'monthly' | 'lpa'>("lpa");
  const [editLinkedin, setEditLinkedin] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editTechStack, setEditTechStack] = useState("");
  const [isSubmittingMissing, setIsSubmittingMissing] = useState(false);

  const { master, profile, interactions, memberships, salaryRecords, contributions, auditLogs, mentoringAttendance, learningSessions, courseraData, completeness, pfProgress } = data;
  const { setCustomTitle } = useBreadcrumb();

  useEffect(() => {
    if (master?.name) {
      setCustomTitle(master.name);
    } else if (master?.email) {
      setCustomTitle(master.email);
    }
  }, [master?.name, master?.email, setCustomTitle]);


  if (!master) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-lg font-bold text-foreground">Alumnus Record Not Found</h2>
        <Button asChild className="mt-3">
          <Link href="/alumni-growth/workspace">Return to Workspace</Link>
        </Button>
      </div>
    );
  }

  const latestSalary = salaryRecords && salaryRecords.length > 0 ? salaryRecords[0] : null;
  const lastInteraction = interactions && interactions.length > 0 ? interactions[0] : null;

  const checkCoursera = settings.active_criteria_coursera !== false && Boolean(courseraData?.has_active_subscription);
  const checkMentoring = settings.active_criteria_mentoring !== false && (mentoringAttendance && mentoringAttendance.length > 0);
  const checkWatchTime = settings.active_criteria_watch_time !== false && Boolean(courseraData?.has_active_subscription && courseraData?.total_learning_hours && courseraData.total_learning_hours > 0);

  const isActiveMember = checkCoursera || checkMentoring || checkWatchTime;

  // Active learning hours only when subscription is active
  const activeLearningHours = courseraData?.has_active_subscription ? courseraData?.total_learning_hours ?? 0 : 0;
  const activeLearningHoursFormatted = `${activeLearningHours.toFixed(1)} hrs`;

  // Cumulative learning hours across Coursera (all-time) + mentoring + other platform modes
  const courseraTotalHours = courseraData?.total_learning_hours ?? 0;
  const mentoringHours = (mentoringAttendance || []).reduce((acc: number, item: any) => {
    const durationMins = item.mentoring_sessions?.duration_minutes ?? 60;
    return acc + (durationMins / 60);
  }, 0);
  const otherLearningHours = (learningSessions || []).reduce((acc: number, item: any) => {
    const durationMins = item.duration_minutes ?? item.duration ?? 0;
    return acc + (durationMins / 60);
  }, 0);
  const cumulativeLearningHours = courseraTotalHours + mentoringHours + otherLearningHours;
  const cumulativeLearningHoursFormatted = `${cumulativeLearningHours.toFixed(1)} hrs`;

  const profileScoreResult = calculateProfileScore(
    {
      name: master.name,
      email: master.email,
      phone_number: master.phone_number || profile?.phone_number,
      gender: master.gender || profile?.gender,
      campus: master.campus,
      course: master.course,
      entry_year: master.entry_year,
      city: master.city,
      state: master.state,
      company: master.company,
      current_company: profile?.current_company,
      starting_salary: master.starting_salary,
      has_salary_records: salaryRecords && salaryRecords.length > 0,
      linkedin_url: master.linkedin_url,
      linkedin_profile: profile?.linkedin_profile,
      technology_stack: master.technology_stack,
    },
    settings
  );

  const handleSaveMissingFields = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingMissing(true);
    try {
      const res = await updateAlumniProfileFieldsAction({
        alumni_email: master.email,
        company: editCompany || undefined,
        salary_amount: editSalaryAmount ? parseFloat(editSalaryAmount) : undefined,
        salary_unit: editSalaryAmount ? editSalaryUnit : undefined,
        linkedin_url: editLinkedin || undefined,
        phone_number: editPhone || undefined,
        technology_stack: editTechStack || undefined,
        updated_by: userEmail,
      });

      if (res.success) {
        toast.success("Profile fields updated successfully!");
        setIsEditMissingModalOpen(false);
      } else {
        toast.error(res.error || "Failed to update profile fields");
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmittingMissing(false);
    }
  };

  return (
    <div className="flex flex-col gap-3.5 p-3.5 sm:p-4 md:p-5 max-w-7xl mx-auto w-full pb-12">
      {/* Top Page Banner */}
      <PageBanner
        title={master.name}
        description={
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-700 dark:text-zinc-300 mt-0.5">
            <span className="flex items-center gap-1 font-mono">
              <Mail className="w-3.5 h-3.5 text-indigo-500" /> {master.email}
            </span>
            <span className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-indigo-500" /> {master.phone_number || profile?.phone_number || "No phone"}
            </span>
            <span className="flex items-center gap-1 font-medium">
              <GraduationCap className="w-3.5 h-3.5 text-indigo-500" /> {master.campus} Campus ({master.course || "General Course"})
            </span>
          </div>
        }
        icon={<User className="h-7 w-7 text-indigo-500" />}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild className="gap-1 text-xs rounded-xl h-8 hover:bg-muted">
              <Link href="/alumni-growth/workspace">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Workspace
              </Link>
            </Button>
            {memberships.length > 0 && (
              <Button onClick={() => setIsTransferModalOpen(true)} variant="outline" className="gap-1.5 rounded-xl h-8 text-xs font-semibold shadow-xs hover:bg-muted">
                <Users className="w-3.5 h-3.5" /> Transfer Lead
              </Button>
            )}
            <Button onClick={() => setIsLogModalOpen(true)} className="gap-1.5 rounded-xl h-8 text-xs font-semibold shadow-xs bg-indigo-600 hover:bg-indigo-500 text-white">
              <PhoneCall className="w-3.5 h-3.5" /> Log Interaction
            </Button>
          </div>
        }
      />

      {/* Active Pipeline Badges & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-card border border-border/80 shadow-2xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Active Pipelines:</span>
          {memberships.map((m: any) => (
            <Badge key={m.id} className="rounded-lg px-2.5 py-0.5 text-[11px] font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              {m.pipelines?.label} ({m.status})
            </Badge>
          ))}
          {memberships.length === 0 && (
            <span className="text-xs text-muted-foreground italic">No active pipeline memberships</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Badge className={`rounded-full text-[11px] font-bold px-2.5 py-0.5 ${profileScoreResult.badgeColor}`}>
            Profile Score: {profileScoreResult.score}%
          </Badge>
          <Badge variant="outline" className="rounded-full text-[11px] font-semibold px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
            Status: {master.status || "Active"}
          </Badge>
          <Badge variant="outline" className="rounded-full text-[11px] font-semibold px-2.5 py-0.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20">
            Active Member: {isActiveMember ? "YES" : "NO"}
          </Badge>
        </div>
      </div>

      {/* Interactive Profile Data Gap & Stage Banner */}
      {profileScoreResult.missingFields.length > 0 ? (
        <div className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs text-xs font-medium ${profileScoreResult.stage === 'RED'
          ? 'bg-destructive/10 border-destructive/30 text-destructive'
          : profileScoreResult.stage === 'AMBER'
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200'
            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
          }`}>
          <div className="flex items-center gap-2 flex-wrap">
            <AlertCircle className={`w-4 h-4 shrink-0 ${profileScoreResult.stage === 'RED' ? 'text-destructive' : 'text-amber-500'}`} />
            <span className="font-bold">
              Profile Score: {profileScoreResult.score}% ({profileScoreResult.missingFields.length} parameter(s) missing):
            </span>
            {profileScoreResult.missingFields.map((field) => (
              <Badge
                key={field}
                variant="outline"
                onClick={() => setIsEditMissingModalOpen(true)}
                className="text-[10px] bg-background border-primary/40 text-primary cursor-pointer hover:bg-primary/10 transition-colors gap-1 shadow-2xs"
              >
                <Edit3 className="w-2.5 h-2.5" /> Missing {field}
              </Badge>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 dark:text-emerald-200 flex items-center justify-between shadow-2xs text-xs font-medium">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="font-bold">100% Profile Complete: All primary parameters documented!</span>
          </div>
          <Badge className="bg-emerald-500 text-white text-[10px] font-bold">Verified Profile</Badge>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full gap-0">
        <TabsList className="h-9 rounded-xl bg-muted/60 p-0.5 mb-4 flex w-full sm:w-auto border border-border/40">
          <TabsTrigger value="details" className="rounded-lg text-xs font-bold transition-all px-3 py-1 flex-1 sm:flex-initial data-[state=active]:bg-card data-[state=active]:shadow-2xs">
            Details Summary
          </TabsTrigger>
          <TabsTrigger value="learning" className="rounded-lg text-xs font-bold transition-all px-3 py-1 flex-1 sm:flex-initial gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-2xs">
            <BookOpen className="w-3.5 h-3.5 text-primary" /> Learning Center & Coursera
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg text-xs font-bold transition-all px-3 py-1 flex-1 sm:flex-initial data-[state=active]:bg-card data-[state=active]:shadow-2xs">
            Interaction & Audit History
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: High-Density Details Summary */}
        <TabsContent value="details" className="mt-0 space-y-4">
          {/* Compact Quick Info Strip (Gender, Location, Entry Cohort, Tech Stack) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-2.5 px-3 rounded-xl border border-border/70 bg-card/80 flex items-center gap-2.5 shadow-2xs">
              <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                <UserCheck className="w-3.5 h-3.5" />
              </div>
              <div className="text-xs min-w-0">
                <span className="text-[9px] text-muted-foreground block font-medium uppercase tracking-wider leading-none mb-0.5">Gender</span>
                <span className="font-bold text-foreground text-xs block truncate">{master.gender || profile?.gender || "Not specified"}</span>
              </div>
            </div>

            <div className="p-2.5 px-3 rounded-xl border border-border/70 bg-card/80 flex items-center gap-2.5 shadow-2xs">
              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                <MapPin className="w-3.5 h-3.5" />
              </div>
              <div className="text-xs min-w-0">
                <span className="text-[9px] text-muted-foreground block font-medium uppercase tracking-wider leading-none mb-0.5">Location</span>
                <span className="font-bold text-foreground text-xs block truncate">
                  {master.city || master.state ? [master.city, master.state].filter(Boolean).join(", ") : "Not specified"}
                </span>
              </div>
            </div>

            <div className="p-2.5 px-3 rounded-xl border border-border/70 bg-card/80 flex items-center gap-2.5 shadow-2xs">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <Calendar className="w-3.5 h-3.5" />
              </div>
              <div className="text-xs min-w-0">
                <span className="text-[9px] text-muted-foreground block font-medium uppercase tracking-wider leading-none mb-0.5">Entry Cohort</span>
                <span className="font-bold text-foreground text-xs font-mono block truncate">{master.entry_year || "—"}</span>
              </div>
            </div>

            <div className="p-2.5 px-3 rounded-xl border border-border/70 bg-card/80 flex items-center gap-2.5 shadow-2xs">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Code2 className="w-3.5 h-3.5" />
              </div>
              <div className="text-xs min-w-0">
                <span className="text-[9px] text-muted-foreground block font-medium uppercase tracking-wider leading-none mb-0.5">Tech Stack</span>
                <span className="font-bold text-foreground text-xs block truncate">
                  {master.technology_stack || "General Tech"}
                </span>
              </div>
            </div>
          </div>

          {/* 3 Compact Equal Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1: Employment & Compensation */}
            <Card className="border py-1 gap-2 border-border/80 rounded-xl bg-card/80 shadow-2xs flex flex-col justify-between">
              <CardHeader className="py-2.5 px-3.5 border-b border-border/40 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <Briefcase className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Employment & Compensation</CardTitle>
                    <div className="text-xs font-bold text-foreground">{master.company || "Not Placed / Searching"}</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-3 space-y-2.5 text-xs flex-1 flex flex-col justify-between">
                <div className="p-2 rounded-lg bg-muted/30 border border-border/40 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-muted-foreground font-medium">Current Monthly CTC</span>
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-xs">
                      {latestSalary
                        ? `₹${formatINR(latestSalary.amount_monthly_inr)}/mo`
                        : master.starting_salary
                          ? `₹${formatINR(master.starting_salary)}/yr`
                          : "—"}
                    </span>
                  </div>
                  {master.starting_salary && latestSalary && (
                    <div className="flex justify-between items-center text-[10px] border-t border-border/30 pt-1">
                      <span className="text-muted-foreground">Starting CTC</span>
                      <span className="font-semibold text-muted-foreground">₹{formatINR(master.starting_salary)}/yr</span>
                    </div>
                  )}
                </div>

                {/* Salary Log */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Historical Salary Logs ({salaryRecords.length})</span>
                  {salaryRecords.length > 0 ? (
                    <div className="divide-y divide-border/30 border border-border/40 rounded-lg bg-card overflow-hidden">
                      {salaryRecords.slice(0, 3).map((s: any) => (
                        <div key={s.id} className="py-1 px-2 flex items-center justify-between text-xs">
                          <div>
                            <div className="font-bold text-foreground text-[10px]">₹{s.amount} ({s.unit?.toUpperCase()})</div>
                            <div className="text-[9px] text-muted-foreground font-mono">{new Date(s.recorded_at).toLocaleDateString()}</div>
                          </div>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 text-[11px]">
                            ₹{formatINR(s.amount_monthly_inr)}/mo
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic py-2 text-center">No salary updates logged.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Card 2: Pay-Forward Commitment */}
            <Card className="border py-1 gap-2  border-border/80 rounded-xl bg-card/80 shadow-2xs flex flex-col justify-between">
              <CardHeader className="py-2.5 px-3.5 border-b border-border/40 flex flex-row items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  <Award className="w-3.5 h-3.5" />
                </div>
                <div>
                  <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Pay-Forward Commitment</CardTitle>
                  <div className="text-xs font-bold text-foreground">₹{formatINR(pfProgress.lifetime_monetary_total)} Contributed</div>
                </div>
              </CardHeader>
              <CardContent className="p-3 space-y-2.5 text-xs flex-1 flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-muted-foreground text-[11px]">Cap Progress (₹{formatINR(pfProgress.cap_inr)} Cap):</span>
                    <span className="text-primary font-bold text-[11px]">{Math.round((pfProgress.counted_toward_cap / pfProgress.cap_inr) * 100)}%</span>
                  </div>
                  <div className="w-full bg-muted h-2 rounded-full overflow-hidden p-0.5 border border-border/40">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-indigo-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (pfProgress.counted_toward_cap / pfProgress.cap_inr) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Contributions ({contributions.length})</span>
                  {contributions.slice(0, 3).map((c: any) => (
                    <div key={c.id} className="py-1 px-2 rounded-lg bg-muted/30 border border-border/40 flex justify-between items-center text-xs">
                      <div>
                        <div className="font-semibold text-foreground text-[10px]">{c.contribution_types?.label}</div>
                        <div className="text-[9px] text-muted-foreground">{c.contributed_at}</div>
                      </div>
                      {c.contribution_types?.is_monetary ? (
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 text-[11px]">₹{formatINR(c.amount_inr)}</span>
                      ) : (
                        <span className="text-[9px] text-primary font-medium">{c.non_monetary_detail || "Non-monetary"}</span>
                      )}
                    </div>
                  ))}
                  {contributions.length === 0 && (
                    <p className="text-xs text-muted-foreground italic py-2 text-center">No contributions logged.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Card 3: Touchpoints & Pipeline Engagement */}
            <Card className="border py-1 gap-2 border-amber-500/30 bg-amber-500/5 rounded-xl shadow-2xs flex flex-col justify-between">
              <CardHeader className="py-2.5 px-3.5 border-b border-amber-500/20 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    <History className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300">Last Touchpoint</CardTitle>
                    {lastInteraction && (
                      <span className="text-[9px] text-muted-foreground font-mono block">
                        {new Date(lastInteraction.created_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <Button size="sm" onClick={() => setIsLogModalOpen(true)} className="h-6 text-[10px] px-2 rounded-lg font-bold bg-amber-500 hover:bg-amber-600 text-white gap-1">
                  <PhoneCall className="w-3 h-3" /> Log Call
                </Button>
              </CardHeader>
              <CardContent className="p-3 space-y-2 text-xs flex-1 flex flex-col justify-between">
                {lastInteraction ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[9px] bg-background font-bold border-amber-500/40 text-amber-700 dark:text-amber-300">
                        {lastInteraction.interaction_outcomes?.label || "Call Logged"}
                      </Badge>
                      <span className="text-[9px] text-muted-foreground">
                        by <strong className="text-foreground">{lastInteraction.logged_by}</strong>
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-background/90 text-foreground border-l-3 border-amber-500 border border-border/40 text-[11px] leading-relaxed max-h-24 overflow-y-auto">
                      {lastInteraction.notes || "No call notes entered."}
                    </div>
                  </div>
                ) : (
                  <div className="py-2 text-center text-xs text-muted-foreground italic">
                    No call recorded yet. Click Log Call above.
                  </div>
                )}

                <div className="pt-1.5 border-t border-amber-500/20 space-y-1">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Active Pipelines ({memberships.length})</span>
                  <div className="flex flex-wrap gap-1">
                    {memberships.map((m: any) => (
                      <Badge key={m.id} variant="secondary" className="text-[9px] font-medium bg-background border border-amber-500/20 px-2 py-0.5">
                        {m.pipelines?.label}
                      </Badge>
                    ))}
                    {memberships.length === 0 && (
                      <span className="text-[9px] text-muted-foreground italic">No pipeline memberships</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 2: Learning (NavGurukul Learning Center & Coursera) */}
        <TabsContent value="learning" className="mt-0 space-y-4">
          {/* 4 Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Metric 1: Active Watch Hours (This Month) */}
            <div className="p-3 rounded-xl border border-border/80 bg-card/80 shadow-2xs space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-semibold">
                <Clock className="w-3.5 h-3.5 text-indigo-500" /> Active Watch Hours
              </div>
              <div className="text-lg font-extrabold text-foreground font-mono">
                {activeLearningHoursFormatted}
              </div>
              <p className="text-[9px] text-muted-foreground">Active platform learning & Coursera hours</p>
            </div>

            {/* Metric 2: Cumulative Watch Hours */}
            <div className="p-3 rounded-xl border border-border/80 bg-card/80 shadow-2xs space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-semibold">
                <History className="w-3.5 h-3.5 text-purple-500" /> Cumulative Watch Hours
              </div>
              <div className="text-lg font-extrabold text-foreground font-mono">
                {cumulativeLearningHoursFormatted}
              </div>
              <p className="text-[9px] text-muted-foreground">Coursera + other modes across learning center</p>
            </div>

            {/* Metric 3: Active Member (YES/NO) */}
            <div className="p-3 rounded-xl border border-border/80 bg-card/80 shadow-2xs space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-semibold">
                <UserCheck className="w-3.5 h-3.5 text-emerald-500" /> Active Member
              </div>
              <div>
                {isActiveMember ? (
                  <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold px-2.5 py-0.5 text-xs shadow-2xs">
                    YES
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="font-extrabold px-2.5 py-0.5 text-xs shadow-2xs">
                    NO
                  </Badge>
                )}
              </div>
              <p className="text-[9px] text-muted-foreground">Based on active subscription & learning rules</p>
            </div>

            {/* Metric 4: Coursera Access Status */}
            <div className="p-3 rounded-xl border border-border/80 bg-card/80 shadow-2xs space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-semibold">
                <BookOpen className="w-3.5 h-3.5 text-blue-500" /> Coursera Access
              </div>
              <div>
                {courseraData?.found_in_db && courseraData?.has_active_subscription ? (
                  <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-2.5 py-0.5 text-xs shadow-2xs">
                    HAS COURSERA ACCESS
                  </Badge>
                ) : courseraData?.found_in_db ? (
                  <Badge className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-2.5 py-0.5 text-xs shadow-2xs">
                    HISTORICAL ACCESS (INACTIVE)
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="font-bold px-2.5 py-0.5 text-xs shadow-2xs">
                    NO COURSERA ACCESS
                  </Badge>
                )}
              </div>
              <p className="text-[9px] text-muted-foreground font-mono truncate">API check for: {master.email}</p>
            </div>
          </div>

          {/* NavGurukul Learning Center Live Attended Sessions Card */}
          <Card className="border py-1 border-border/80 rounded-xl bg-card/80 shadow-2xs">
            <CardHeader className="py-2 px-3.5 border-b border-border/40 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 ">
                  <Video className="w-3.5 h-3.5" />
                </div>
                <div>
                  <CardTitle className="text-xs font-bold text-foreground">Mentoring & Live Sessions Attended</CardTitle>
                  <p className="text-[10px] text-muted-foreground">Live workshops and 1-on-1 mentoring logs.</p>
                </div>
              </div>
              <Badge variant="secondary" className="text-[9px] font-bold">
                {mentoringAttendance.length} Attended
              </Badge>
            </CardHeader>
            <CardContent className="p-3">
              <div className="divide-y divide-border/40 border border-border/60 rounded-lg overflow-hidden bg-muted/20">
                {mentoringAttendance.map((item: any) => (
                  <div key={item.id} className="p-2 flex items-center justify-between text-xs hover:bg-muted/40 transition-colors">
                    <div>
                      <div className="font-bold text-foreground text-xs">{item.mentoring_sessions?.topic || "Mentoring Session"}</div>
                      <div className="text-[9px] text-muted-foreground">
                        Mentor: <span className="font-semibold text-foreground">{item.mentoring_sessions?.mentors?.name || "NavGurukul Mentor"}</span> • Date: {item.mentoring_sessions?.session_date || "Past Session"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.feedback_rating && (
                        <Badge variant="outline" className="text-[9px] gap-0.5 bg-amber-500/10 text-amber-600 border-amber-500/20 font-bold">
                          <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" /> {item.feedback_rating}/5
                        </Badge>
                      )}
                      <Badge className="text-[9px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold">
                        {item.attendance_status || "Attended"}
                      </Badge>
                    </div>
                  </div>
                ))}

                {mentoringAttendance.length === 0 && (
                  <div className="py-4 text-center text-xs text-muted-foreground italic">
                    No live mentoring session attendance recorded for this alumnus.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Coursera Stats */}
          <CourseraAlumniStats email={master.email} />
        </TabsContent>

        {/* TAB 3: Interaction & Audit History */}
        <TabsContent value="history" className="mt-0 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Timeline Column */}
            <Card className="border border-border/80 rounded-xl bg-card shadow-2xs">
              <CardHeader className="py-2.5 px-3.5 border-b border-border/40">
                <CardTitle className="text-xs font-bold flex items-center gap-2">
                  <History className="w-3.5 h-3.5 text-primary" /> Chronological Touchpoint Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="relative pl-5 space-y-4 before:absolute before:left-2 before:top-1.5 before:bottom-1.5 before:w-0.5 before:bg-border">
                  {interactions.map((item: any) => (
                    <div key={item.id} className="relative group">
                      <div className="absolute -left-5 top-1 w-3 h-3 rounded-full bg-primary ring-3 ring-background" />
                      <div className="p-3 rounded-lg border border-border/70 bg-card/90 shadow-2xs space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="font-bold text-[9px] uppercase">
                            {item.interaction_outcomes?.label}
                          </Badge>
                          <span className="text-[9px] text-muted-foreground font-mono">
                            {new Date(item.created_at).toLocaleString()}
                          </span>
                        </div>
                        {item.notes && <p className="text-foreground/90 text-[11px] whitespace-pre-line leading-relaxed">{item.notes}</p>}
                        <div className="text-[9px] text-muted-foreground border-t border-border/30 pt-1.5 flex items-center justify-between">
                          <span>Channel: <strong className="text-foreground">{item.interaction_channel}</strong></span>
                          <span>Logged by: <strong className="text-foreground">{item.logged_by}</strong></span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {interactions.length === 0 && (
                    <div className="py-6 text-center text-xs text-muted-foreground italic">
                      No interaction logs found.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Audit Log Column */}
            <Card className="border border-border/80 rounded-xl bg-card shadow-2xs">
              <CardHeader className="py-2.5 px-3.5 border-b border-border/40 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-bold flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-primary" /> Field Change & Audit History
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAuditModalOpen(true)}
                  className="h-6 text-[10px] font-semibold gap-1 text-primary hover:bg-primary/10 rounded-lg px-2"
                >
                  <Maximize2 className="w-3 h-3" /> Expand View
                </Button>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                <div className="divide-y divide-border/40">
                  {auditLogs.slice(0, 3).map((log: any) => (
                    <div key={log.id} className="py-2 space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-[9px] uppercase font-bold">
                          {log.action_type} on {log.field_name || "Record"}
                        </Badge>
                        <span className="text-[9px] text-muted-foreground font-mono">
                          {new Date(log.changed_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground text-[10px]">
                        <span className="line-through text-destructive">{log.old_value || "empty"}</span>
                        <ArrowRight className="w-2.5 h-2.5 text-muted-foreground" />
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{log.new_value || "empty"}</span>
                      </div>
                      <div className="text-[9px] text-muted-foreground">Changed by: {log.changed_by_name || log.changed_by_user_id || "System"}</div>
                    </div>
                  ))}

                  {auditLogs.length === 0 && (
                    <div className="py-6 text-center text-xs text-muted-foreground italic">
                      No audit log entries recorded yet.
                    </div>
                  )}
                </div>

                {auditLogs.length > 3 && (
                  <div className="pt-2 text-center border-t border-border/40">
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => setIsAuditModalOpen(true)}
                      className="text-[10px] text-primary font-semibold h-auto p-0"
                    >
                      Showing last 3 entries. Click to view all {auditLogs.length} changes →
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Interactive Modal to Fill Missing Fields */}
      <Dialog open={isEditMissingModalOpen} onOpenChange={setIsEditMissingModalOpen}>
        <DialogContent className="max-w-lg rounded-2xl border border-border/80 p-5 shadow-2xl">
          <DialogHeader className="pb-2 border-b border-border/40">
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-foreground">
              <Edit3 className="w-4 h-4 text-primary" /> Fill Missing Profile Parameters
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Enter documented data below to update {master.name}'s profile score to 100%.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveMissingFields} className="space-y-4 pt-3 text-xs">
            {profileScoreResult.missingFields.includes("Company") && (
              <div className="space-y-1">
                <label className="font-semibold text-foreground flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-muted-foreground" /> Current Company Name
                </label>
                <Input
                  placeholder="e.g. Thoughtworks / Infosys"
                  value={editCompany}
                  onChange={(e) => setEditCompany(e.target.value)}
                  className="h-9 rounded-xl text-xs"
                />
              </div>
            )}

            {profileScoreResult.missingFields.includes("Salary") && (
              <div className="space-y-1">
                <label className="font-semibold text-foreground flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-500" /> Current Salary Update
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    type="number"
                    placeholder="Salary Amount"
                    value={editSalaryAmount}
                    onChange={(e) => setEditSalaryAmount(e.target.value)}
                    className="col-span-2 h-9 rounded-xl text-xs"
                  />
                  <Select value={editSalaryUnit} onValueChange={(val: 'monthly' | 'lpa') => setEditSalaryUnit(val)}>
                    <SelectTrigger className="h-9 rounded-xl text-xs">
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

            {profileScoreResult.missingFields.includes("LinkedIn Profile") && (
              <div className="space-y-1">
                <label className="font-semibold text-foreground flex items-center gap-1">
                  <Linkedin className="w-3.5 h-3.5 text-blue-500" /> LinkedIn Profile URL
                </label>
                <Input
                  placeholder="https://linkedin.com/in/username"
                  value={editLinkedin}
                  onChange={(e) => setEditLinkedin(e.target.value)}
                  className="h-9 rounded-xl text-xs"
                />
              </div>
            )}

            {profileScoreResult.missingFields.includes("Phone Number") && (
              <div className="space-y-1">
                <label className="font-semibold text-foreground flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-indigo-500" /> Phone Number
                </label>
                <Input
                  placeholder="+91 9876543210"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="h-9 rounded-xl text-xs"
                />
              </div>
            )}

            {profileScoreResult.missingFields.includes("Tech Stack") && (
              <div className="space-y-1">
                <label className="font-semibold text-foreground flex items-center gap-1">
                  <Code2 className="w-3.5 h-3.5 text-emerald-500" /> Technology Stack
                </label>
                <Input
                  placeholder="e.g. Full-Stack / Python / React"
                  value={editTechStack}
                  onChange={(e) => setEditTechStack(e.target.value)}
                  className="h-9 rounded-xl text-xs"
                />
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsEditMissingModalOpen(false)} className="rounded-xl h-8 text-xs">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmittingMissing} className="rounded-xl h-8 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5">
                {isSubmittingMissing ? "Saving Updates..." : "Save Profile Parameters"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Expandable Audit Log Modal */}
      <Dialog open={isAuditModalOpen} onOpenChange={setIsAuditModalOpen}>
        <DialogContent className="max-w-none w-[90vw] h-[80vh] flex flex-col p-5 rounded-2xl border border-border/80 bg-card shadow-2xl overflow-hidden">
          <DialogHeader className="pb-3 border-b border-border/60 shrink-0">
            <DialogTitle className="text-base font-bold flex items-center justify-between text-foreground">
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" /> Full Audit & Field Change History
              </span>
              <Badge variant="outline" className="text-[10px] font-mono">
                {auditLogs.length} Total Edits Logged
              </Badge>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Complete, immutable change log for {master.name} ({master.email}).
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pt-3">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-muted/50 border-b border-border/60 uppercase tracking-wider sticky top-0 bg-card z-10">
                <tr>
                  <th className="py-2.5 px-3 font-bold text-[9px] text-muted-foreground">Date & Time</th>
                  <th className="py-2.5 px-3 font-bold text-[9px] text-muted-foreground">Action</th>
                  <th className="py-2.5 px-3 font-bold text-[9px] text-muted-foreground">Field Changed</th>
                  <th className="py-2.5 px-3 font-bold text-[9px] text-muted-foreground">Old Value</th>
                  <th className="py-2.5 px-3 font-bold text-[9px] text-muted-foreground">New Value</th>
                  <th className="py-2.5 px-3 font-bold text-[9px] text-muted-foreground">Changed By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-mono text-[11px]">
                {auditLogs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-2 px-3 text-muted-foreground whitespace-nowrap">
                      {new Date(log.changed_at).toLocaleString()}
                    </td>
                    <td className="py-2 px-3">
                      <Badge variant="outline" className="text-[9px] font-bold uppercase">
                        {log.action_type}
                      </Badge>
                    </td>
                    <td className="py-2 px-3 font-bold text-foreground">{log.field_name || "Record"}</td>
                    <td className="py-2 px-3 text-destructive font-sans">{log.old_value || "—"}</td>
                    <td className="py-2 px-3 text-emerald-600 dark:text-emerald-400 font-sans font-bold">{log.new_value || "—"}</td>
                    <td className="py-2 px-3 text-muted-foreground font-sans">
                      {log.changed_by_name || log.changed_by_user_id || "System"}
                    </td>
                  </tr>
                ))}
                {auditLogs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-muted-foreground font-sans text-xs">
                      No audit history entries found for this record.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>

      {/* Log Interaction Modal */}
      {isLogModalOpen && (
        <LogInteractionModal
          isOpen={isLogModalOpen}
          onClose={() => setIsLogModalOpen(false)}
          alumniEmail={master.email}
          alumniName={master.name}
          outcomes={outcomes}
          userEmail={userEmail}
          completeness={completeness}
          masterData={master}
        />
      )}

      <TransferLeadModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        alumniEmail={master.email}
        alumniName={master.name}
        memberships={memberships}
        userEmail={userEmail}
      />
    </div>
  );
}
