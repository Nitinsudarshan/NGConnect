"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  DollarSign,
  Award,
  Filter,
  Plus,
  ArrowRight,
  TrendingUp,
  User,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updatePipelineMembershipAction } from "@/lib/engagement/actions";
import { toast } from "sonner";

interface PayForwardClientProps {
  pipeline: any;
  memberships: any[];
  pfProgressMap: Record<string, any>;
  salaryMap: Record<string, number>;
  userEmail: string;
}

const STAGES = ["Paid", "Communicated", "Waiting", "Not Paying Right Now"];

export default function PayForwardClient({
  pipeline,
  memberships,
  pfProgressMap,
  salaryMap,
  userEmail,
}: PayForwardClientProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const handleStageChange = async (alumniEmail: string, newStatus: string) => {
    const res = await updatePipelineMembershipAction({
      alumni_email: alumniEmail,
      pipeline_code: "pay_forward",
      status: newStatus,
      added_by: userEmail,
      is_active: true,
    });
    if (res.success) {
      toast.success(`Updated status to ${newStatus}`);
    } else {
      toast.error(res.error || "Failed to update stage");
    }
  };

  const filteredMemberships = memberships.filter((m) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const name = m.alumni_master?.name?.toLowerCase() || "";
    const email = m.alumni_email.toLowerCase();
    return name.includes(term) || email.includes(term);
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-500" /> Pay-Forward Pipeline Board
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Track monetary and non-monetary pay-forward contributions against ₹1,20,000 lifetime cap.
          </p>
        </div>

        <div className="w-full sm:w-64">
          <Input
            placeholder="Search cards..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 rounded-xl bg-card text-xs"
          />
        </div>
      </div>

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {STAGES.map((stage) => {
          const cards = filteredMemberships.filter((m) => m.status === stage || (!STAGES.includes(m.status) && stage === "Waiting"));

          return (
            <div key={stage} className="bg-muted/40 p-4 rounded-2xl border border-border/60 flex flex-col min-h-[500px]">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-border/60">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  {stage}
                </h3>
                <Badge variant="secondary" className="rounded-full text-[10px] font-bold">
                  {cards.length}
                </Badge>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto">
                {cards.map((card) => {
                  const prog = pfProgressMap[card.alumni_email] || { counted_toward_cap: 0, cap_inr: 120000 };
                  const percent = Math.round((prog.counted_toward_cap / (prog.cap_inr || 120000)) * 100);
                  const salary = salaryMap[card.alumni_email];

                  return (
                    <Card key={card.id} className="border border-border/80 rounded-xl bg-card shadow-2xs hover:shadow-md transition-all">
                      <CardContent className="p-3.5 space-y-2.5">
                        <div className="flex items-start justify-between gap-1">
                          <Link
                            href={`/engagement/alumni/${encodeURIComponent(card.alumni_email)}`}
                            className="font-bold text-xs text-foreground hover:text-primary transition-colors"
                          >
                            {card.alumni_master?.name || card.alumni_email}
                          </Link>
                          {salary && (
                            <Badge variant="outline" className="text-[9px] bg-emerald-500/5 text-emerald-600 border-emerald-500/20">
                              ₹{Math.round(salary / 1000)}k/mo
                            </Badge>
                          )}
                        </div>

                        <div className="text-[11px] text-muted-foreground">
                          {card.alumni_master?.campus || "Unknown Campus"}
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1 pt-1">
                          <div className="flex justify-between text-[10px] text-muted-foreground font-semibold">
                            <span>Cap Progress:</span>
                            <span className="text-primary font-bold">{percent}%</span>
                          </div>
                          <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                            <div className="bg-primary h-full rounded-full" style={{ width: `${Math.min(100, percent)}%` }} />
                          </div>
                        </div>

                        {/* Quick Stage Move Dropdown */}
                        <div className="pt-2 flex items-center justify-between border-t border-border/40 text-[10px]">
                          <span className="text-muted-foreground">Move stage:</span>
                          <div className="flex flex-wrap gap-1">
                            {STAGES.filter((s) => s !== stage).slice(0, 2).map((targetStage) => (
                              <button
                                key={targetStage}
                                onClick={() => handleStageChange(card.alumni_email, targetStage)}
                                className="px-2 py-0.5 rounded-md bg-muted hover:bg-primary/10 hover:text-primary text-foreground transition-colors font-medium"
                              >
                                → {targetStage.split(" ")[0]}
                              </button>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {cards.length === 0 && (
                  <div className="py-10 text-center text-xs text-muted-foreground italic">
                    No alumni in this stage.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
