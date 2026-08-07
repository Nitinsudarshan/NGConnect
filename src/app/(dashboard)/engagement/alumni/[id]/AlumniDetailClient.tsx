"use client";

import React, { useState } from "react";
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
  PlusCircle,
  Award,
  BookOpen,
  ArrowLeft,
  BadgeCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import LogInteractionModal from "@/components/engagement/LogInteractionModal";
import { InteractionOutcome, OrgSettings } from "@/types/engagement";

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
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  const { master, profile, interactions, memberships, salaryRecords, contributions, completeness, pfProgress } = data;

  if (!master) {
    return (
      <div className="p-12 text-center">
        <h2 className="text-xl font-bold text-foreground">Alumnus Record Not Found</h2>
        <Button asChild className="mt-4">
          <Link href="/engagement/queue">Return to Queue</Link>
        </Button>
      </div>
    );
  }

  const latestSalary = salaryRecords && salaryRecords.length > 0 ? salaryRecords[0] : null;

  return (
    <div className="space-y-6 pb-16">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild className="gap-2 text-xs">
          <Link href="/engagement/queue">
            <ArrowLeft className="w-4 h-4" /> Back to Queue
          </Link>
        </Button>

        <Button onClick={() => setIsLogModalOpen(true)} className="gap-2 rounded-xl text-xs font-semibold shadow-xs">
          <PhoneCall className="w-4 h-4" /> Log New Interaction
        </Button>
      </div>

      {/* Main Alumnus Header Card */}
      <Card className="border border-border/80 rounded-2xl bg-card shadow-xs overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-extrabold text-2xl">
                {master.name?.charAt(0) || "A"}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-extrabold text-foreground">{master.name}</h1>
                  <Badge variant="outline" className="rounded-full text-[10px] bg-primary/5 text-primary border-primary/20">
                    {master.status || "Active"}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" /> {master.email}
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" /> {master.phone_number || profile?.phone_number || "No phone"}
                  </span>
                  <span className="flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5" /> {master.campus} ({master.course})
                  </span>
                </div>
              </div>
            </div>

            {/* Active Pipeline Badges */}
            <div className="flex flex-col items-start md:items-end gap-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Active Pipelines</span>
              <div className="flex flex-wrap gap-2">
                {memberships.map((m: any) => (
                  <Badge key={m.id} className="rounded-xl px-3 py-1 text-xs font-semibold">
                    {m.pipelines?.label} ({m.status})
                  </Badge>
                ))}
                {memberships.length === 0 && (
                  <span className="text-xs text-muted-foreground italic">No active pipelines</span>
                )}
              </div>
            </div>
          </div>

          {/* Completeness Data Gap Banner */}
          {(completeness.missing_linkedin || completeness.missing_company || completeness.missing_salary) && (
            <div className="mt-6 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-medium">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Profile Data Gaps: </span>
                {completeness.missing_linkedin && <Badge variant="outline" className="text-[10px] bg-background">Missing LinkedIn</Badge>}
                {completeness.missing_company && <Badge variant="outline" className="text-[10px] bg-background">Missing Company</Badge>}
                {completeness.missing_salary && <Badge variant="outline" className="text-[10px] bg-background">Missing Salary</Badge>}
              </div>
              <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">Ask caller to verify on next call</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grid: Financial & Pay-Forward + Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Stats & Profile Info */}
        <div className="space-y-6 lg:col-span-1">
          {/* Salary & Income Card */}
          <Card className="border border-border/80 rounded-2xl bg-card shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-500" /> Salary & Financial Eligibility
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-border/40">
                <span className="text-muted-foreground">Current Monthly Income:</span>
                <span className="font-bold text-foreground">
                  {latestSalary ? `₹${Number(latestSalary.amount_monthly_inr).toLocaleString()}/mo` : "Not Disclosed"}
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-border/40">
                <span className="text-muted-foreground">Pay-Forward Pitch Floor:</span>
                <span className="font-semibold text-foreground">₹{settings.pay_forward_min_salary_monthly_inr.toLocaleString()}/mo</span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-muted-foreground">Eligibility Status:</span>
                {latestSalary && latestSalary.amount_monthly_inr >= settings.pay_forward_min_salary_monthly_inr ? (
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
                    Eligible for Pitch
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-[10px]">Below Floor / Unknown</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pay-Forward Progress Card */}
          <Card className="border border-border/80 rounded-2xl bg-card shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" /> Pay-Forward Journey Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span>Progress toward ₹{settings.pay_forward_cap_inr.toLocaleString()} Cap:</span>
                  <span className="text-primary font-bold">
                    {Math.round((pfProgress.counted_toward_cap / pfProgress.cap_inr) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-muted h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (pfProgress.counted_toward_cap / pfProgress.cap_inr) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 text-xs border-t border-border/40">
                <span className="text-muted-foreground">Lifetime Monetary Total:</span>
                <span className="font-extrabold text-foreground">₹{pfProgress.lifetime_monetary_total.toLocaleString()}</span>
              </div>

              {/* Contributions Breakdown */}
              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-bold text-muted-foreground uppercase">Recorded Contributions</span>
                {contributions.map((c: any) => (
                  <div key={c.id} className="p-2.5 rounded-xl bg-muted/40 flex justify-between items-center text-xs">
                    <div>
                      <div className="font-semibold text-foreground">{c.contribution_types?.label}</div>
                      <div className="text-[10px] text-muted-foreground">{c.contributed_at}</div>
                    </div>
                    {c.contribution_types?.is_monetary ? (
                      <span className="font-bold text-emerald-600">₹{Number(c.amount_inr).toLocaleString()}</span>
                    ) : (
                      <span className="text-xs text-primary font-medium">{c.non_monetary_detail || "Non-monetary"}</span>
                    )}
                  </div>
                ))}
                {contributions.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">No contributions logged yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Interaction Timeline */}
        <div className="space-y-6 lg:col-span-2">
          <Card className="border border-border/80 rounded-2xl bg-card shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <History className="w-4 h-4 text-primary" /> Chronological Interaction Timeline
              </CardTitle>
              <Badge variant="outline" className="text-[10px]">
                {interactions.length} Touchpoints Logged
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                {interactions.map((item: any) => (
                  <div key={item.id} className="relative group">
                    <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-primary ring-4 ring-background" />
                    <div className="p-4 rounded-xl border border-border/70 bg-card/80 shadow-2xs space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="font-bold text-[10px] uppercase">
                            {item.interaction_outcomes?.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground font-mono">
                            via {item.interaction_channel} by {item.logged_by}
                          </span>
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                          {new Date(item.created_at).toLocaleString()}
                        </span>
                      </div>

                      {item.notes && <p className="text-xs text-foreground/90 whitespace-pre-line">{item.notes}</p>}

                      {item.followup_at && (
                        <div className="mt-2 text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 pt-2 border-t border-border/40">
                          <Calendar className="w-3.5 h-3.5" /> Follow-up scheduled for:{" "}
                          {new Date(item.followup_at).toLocaleString()}
                          {item.followup_completed ? (
                            <Badge variant="outline" className="ml-2 text-[9px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                              Completed
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="ml-2 text-[9px] bg-amber-500/10 text-amber-600 border-amber-500/20">
                              Pending
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {interactions.length === 0 && (
                  <div className="py-12 text-center text-muted-foreground text-xs">
                    No interaction logs found for this alumnus yet. Click "Log New Interaction" to record the first contact!
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Log Interaction Modal */}
      {isLogModalOpen && (
        <LogInteractionModal
          isOpen={isLogModalOpen}
          onClose={() => setIsLogModalOpen(false)}
          alumniEmail={master.email}
          alumniName={master.name}
          outcomes={outcomes}
          userEmail={userEmail}
        />
      )}
    </div>
  );
}
