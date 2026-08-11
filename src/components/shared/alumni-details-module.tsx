"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getAlumniSlug } from "@/lib/utils";

import {
  User,
  Building2,
  GraduationCap,
  Database,
  Eye,
  History,
  Clock,
  ArrowRight,
  PhoneCall,
  DollarSign,
  AlertCircle,
  FileText,
  CheckCircle2,
  Calendar,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import CourseraAlumniStats from "@/app/(dashboard)/manage/master-data/_components/CourseraAlumniStats";
import { createClient } from "@/lib/supabase/client";

interface AlumniDetailsModuleProps {
  selectedAlumni: any;
  onClose: () => void;
}

export default function AlumniDetailsModule({
  selectedAlumni,
  onClose,
}: AlumniDetailsModuleProps) {
  const [activeTab, setActiveTab] = useState("now");
  const [interactionsHistory, setInteractionsHistory] = useState<any[]>([]);
  const [salaryHistory, setSalaryHistory] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  useEffect(() => {
    if (!selectedAlumni?.email) return;

    let isMounted = true;
    async function fetchHistory() {
      setLoadingHistory(true);
      try {
        const supabase = createClient();

        // 1. Fetch interactions
        const { data: inters } = await supabase
          .from("alumni_interactions")
          .select("*, interaction_outcomes(label, code)")
          .eq("alumni_email", selectedAlumni.email)
          .order("created_at", { ascending: false })
          .limit(10);

        // 2. Fetch salary records
        const { data: salaries } = await supabase
          .from("alumni_salary_records")
          .select("*")
          .eq("alumni_email", selectedAlumni.email)
          .order("recorded_at", { ascending: false })
          .limit(10);

        // 3. Fetch audit logs
        const { data: audits } = await supabase
          .from("audit_log")
          .select("*")
          .eq("record_id", selectedAlumni.email)
          .order("changed_at", { ascending: false })
          .limit(15);

        if (isMounted) {
          setInteractionsHistory(inters || []);
          setSalaryHistory(salaries || []);
          setAuditLogs(audits || []);
        }
      } catch (err) {
        console.error("Error fetching history for modal:", err);
      } finally {
        if (isMounted) setLoadingHistory(false);
      }
    }

    fetchHistory();
    return () => {
      isMounted = false;
    };
  }, [selectedAlumni?.email]);

  if (!selectedAlumni) return null;

  // Last interaction (most recent touchpoint)
  const lastInteraction = interactionsHistory.length > 0 ? interactionsHistory[0] : null;
  const previousInteraction = interactionsHistory.length > 1 ? interactionsHistory[1] : null;

  // Salary comparison
  const currentSalary = salaryHistory.length > 0 ? salaryHistory[0] : null;
  const previousSalary = salaryHistory.length > 1 ? salaryHistory[1] : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 md:p-8 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border/80 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border/60 p-5 bg-muted/40">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 text-primary rounded-xl border border-primary/20">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-foreground">
                  {selectedAlumni.name || "Alumni Details"}
                </h3>
                <Badge variant="outline" className="text-[10px] rounded-md font-semibold">
                  {selectedAlumni.status || "Active"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground font-mono">
                {selectedAlumni.email}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            ✕
          </Button>
        </div>

        {/* Modal Body with Tabs */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="h-10 rounded-xl bg-muted/60 p-1 mb-4 grid grid-cols-3 w-full sm:w-auto">
              <TabsTrigger value="now" className="rounded-lg text-xs font-semibold">
                What is there now
              </TabsTrigger>
              <TabsTrigger value="last" className="rounded-lg text-xs font-semibold">
                What was last there
              </TabsTrigger>
              <TabsTrigger value="audit" className="rounded-lg text-xs font-semibold">
                Audit & Change History
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: What is there now (Current State) */}
            <TabsContent value="now" className="mt-0 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Personal Info */}
                <div className="space-y-3 bg-muted/20 border border-border/60 rounded-xl p-4">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2 border-b border-border/40 pb-2">
                    <User className="w-3.5 h-3.5 text-primary" /> Personal Details
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Full Name</span>
                      <span className="font-bold text-foreground">{selectedAlumni.name || "—"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Email Address</span>
                      <span className="font-mono text-foreground">{selectedAlumni.email || "—"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Phone Number</span>
                      <span className="font-semibold text-foreground">{selectedAlumni.phone_number || "—"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Location</span>
                      <span className="font-semibold text-foreground">
                        {selectedAlumni.city || selectedAlumni.state
                          ? [selectedAlumni.city, selectedAlumni.state].filter(Boolean).join(", ")
                          : "—"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Academic Info */}
                <div className="space-y-3 bg-muted/20 border border-border/60 rounded-xl p-4">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2 border-b border-border/40 pb-2">
                    <GraduationCap className="w-3.5 h-3.5 text-primary" /> Academic Info
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Campus Location</span>
                      <span className="font-semibold text-foreground flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                        {selectedAlumni.campus || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Course / School</span>
                      <span className="font-semibold text-foreground">{selectedAlumni.course || "—"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Admission / Entry Year</span>
                      <span className="font-semibold text-foreground">{selectedAlumni.entry_year || "—"}</span>
                    </div>
                  </div>
                </div>

                {/* Career & Current Salary */}
                <div className="space-y-3 bg-muted/20 border border-border/60 rounded-xl p-4">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2 border-b border-border/40 pb-2">
                    <Database className="w-3.5 h-3.5 text-primary" /> Career & Salary
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Current Status</span>
                      <Badge variant="outline" className="text-[10px] font-bold mt-1">
                        {selectedAlumni.status || "ACTIVE"}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Placed Company</span>
                      <span className="font-bold text-foreground">{selectedAlumni.company || "—"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Current Monthly CTC</span>
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                        {currentSalary
                          ? `₹${Number(currentSalary.amount_monthly_inr).toLocaleString()}/mo`
                          : selectedAlumni.starting_salary
                          ? `₹${Number(selectedAlumni.starting_salary).toLocaleString()}/yr`
                          : "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Tech Stack</span>
                      <span className="font-semibold text-foreground">{selectedAlumni.technology_stack || "—"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Coursera Stats */}
              <CourseraAlumniStats email={selectedAlumni.email} />
            </TabsContent>

            {/* TAB 2: What was last there (Last Recorded State & Touchpoint) */}
            <TabsContent value="last" className="mt-0 space-y-6">
              {loadingHistory ? (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  Fetching previous interaction records...
                </div>
              ) : (
                <>
                  {/* Side-by-Side Comparison Card */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Previous Record (Then) */}
                    <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-3">
                      <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                        <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                          <History className="w-3.5 h-3.5" /> Then (Last Recorded Touchpoint)
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {lastInteraction ? new Date(lastInteraction.created_at).toLocaleDateString() : "No record"}
                        </span>
                      </div>

                      {lastInteraction ? (
                        <div className="space-y-2 text-xs">
                          <div>
                            <span className="text-[10px] text-muted-foreground block">Last Outcome Tag</span>
                            <Badge variant="outline" className="text-[10px] bg-background font-bold border-amber-500/40 text-amber-700 dark:text-amber-300">
                              {lastInteraction.interaction_outcomes?.label || "Call Logged"}
                            </Badge>
                          </div>
                          <div>
                            <span className="text-[10px] text-muted-foreground block">Logged By Staff</span>
                            <span className="font-semibold text-foreground">{lastInteraction.logged_by}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-muted-foreground block">Notes Recorded</span>
                            <p className="p-2 rounded-lg bg-background/80 text-foreground/90 border border-border/40 whitespace-pre-line">
                              {lastInteraction.notes || "No notes entered on last call."}
                            </p>
                          </div>
                          {previousSalary && (
                            <div>
                              <span className="text-[10px] text-muted-foreground block">Previous Recorded Salary</span>
                              <span className="font-bold text-foreground">
                                ₹{Number(previousSalary.amount_monthly_inr).toLocaleString()}/mo ({previousSalary.unit?.toUpperCase()})
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic py-6 text-center">
                          No previous interaction call recorded yet.
                        </p>
                      )}
                    </div>

                    {/* Current Record (Now) */}
                    <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3">
                      <div className="flex items-center justify-between border-b border-primary/20 pb-2">
                        <span className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Now (Current Master State)
                        </span>
                        <span className="text-[10px] text-muted-foreground">Updated Active State</span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="text-[10px] text-muted-foreground block">Current Status</span>
                          <Badge variant="default" className="text-[10px] font-bold">
                            {selectedAlumni.status || "ACTIVE"}
                          </Badge>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground block">Current Company</span>
                          <span className="font-bold text-foreground">{selectedAlumni.company || "—"}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground block">Current Normalized Monthly Salary</span>
                          <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                            {currentSalary
                              ? `₹${Number(currentSalary.amount_monthly_inr).toLocaleString()}/mo`
                              : "Not Disclosed"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground block">Active Tech Stack</span>
                          <span className="font-semibold text-foreground">{selectedAlumni.technology_stack || "—"}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Salary Evolution History */}
                  {salaryHistory.length > 0 && (
                    <div className="p-4 rounded-xl border border-border/70 bg-card space-y-2">
                      <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <DollarSign className="w-4 h-4 text-emerald-500" /> Historical Salary Log
                      </span>
                      <div className="divide-y divide-border/40">
                        {salaryHistory.map((s) => (
                          <div key={s.id} className="py-2 flex items-center justify-between text-xs">
                            <span className="font-mono text-muted-foreground">{new Date(s.recorded_at).toLocaleDateString()}</span>
                            <span className="font-bold text-foreground">₹{s.amount} ({s.unit?.toUpperCase()})</span>
                            <span className="font-semibold text-emerald-600">₹{Number(s.amount_monthly_inr).toLocaleString()}/mo</span>
                            <span className="text-[10px] text-muted-foreground">by {s.recorded_by || "System"}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            {/* TAB 3: Audit & Change History */}
            <TabsContent value="audit" className="mt-0 space-y-4">
              <div className="p-4 rounded-xl border border-border/70 bg-card space-y-3">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-primary" /> Full Append-Only Audit & Change History
                </span>
                <div className="divide-y divide-border/40">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="py-2.5 space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-[9px] uppercase font-bold">
                          {log.action_type} on {log.field_name || "Record"}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {new Date(log.changed_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground text-[11px]">
                        <span className="line-through text-destructive">{log.old_value || "empty"}</span>
                        <ArrowRight className="w-3 h-3 text-muted-foreground" />
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{log.new_value || "empty"}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground">Changed by: {log.changed_by_name || log.changed_by_user_id || "System"}</div>
                    </div>
                  ))}

                  {auditLogs.length === 0 && (
                    <div className="py-8 text-center text-xs text-muted-foreground italic">
                      No automated audit log entries found for this record yet.
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-border/60 p-4 bg-muted/40 flex justify-end gap-3 flex-wrap">
          <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl">
            Close View
          </Button>
          <Button asChild size="sm" className="rounded-xl gap-1.5">
            <Link href={`/alumni-growth/alumni/${getAlumniSlug(selectedAlumni.email, selectedAlumni.name)}`} onClick={onClose}>

              <Eye className="w-3.5 h-3.5" /> View Full Alumnus Page
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
