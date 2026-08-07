"use client";

import React, { useState } from "react";
import Link from "next/link";
import { getAlumniSlug } from "@/lib/utils";

import { DollarSign, HeartHandshake, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PageBanner } from "@/components/shared/page-banner";
import { updatePipelineMembershipAction } from "@/lib/engagement/actions";
import { toast } from "sonner";

import { PipelineStage } from "@/types/engagement";

interface PayForwardClientProps {
  pipeline: any;
  stages?: PipelineStage[];
  memberships: any[];
  pfProgressMap: Record<string, any>;
  salaryMap: Record<string, number>;
  userEmail: string;
}

const DEFAULT_STAGES = [
  { id: "default-paid", code: "paid", label: "Paid", sort_order: 1 },
  { id: "default-communicated", code: "communicated", label: "Communicated", sort_order: 2 },
  { id: "default-waiting", code: "waiting", label: "Waiting", sort_order: 3 },
  { id: "default-not_paying_right_now", code: "not_paying_right_now", label: "Not Paying Right Now", sort_order: 4 },
];

export default function PayForwardClient({
  pipeline,
  stages,
  memberships,
  pfProgressMap,
  salaryMap,
  userEmail,
}: PayForwardClientProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const activeStages = (stages && stages.length > 0) ? stages : DEFAULT_STAGES;

  const handleStageChange = async (alumniEmail: string, targetStage: { id: string; label: string }) => {
    const res = await updatePipelineMembershipAction({
      alumni_email: alumniEmail,
      pipeline_code: "pay_forward",
      stage_id: targetStage.id,
      status: targetStage.label,
      added_by: userEmail,
      is_active: true,
    });
    if (res.success) {
      toast.success(`Updated stage to ${targetStage.label}`);
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
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-20">
      <PageBanner
        title="Pay-Forward Pipeline Board"
        description={<p>Track monetary and non-monetary pay-forward contributions against ₹1,20,000 lifetime cap.</p>}
        icon={<HeartHandshake className="h-8 w-8 text-emerald-500" />}
        actions={
          <div className="w-full sm:w-64">
            <Input
              placeholder="Search cards..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 rounded-xl bg-white/80 dark:bg-zinc-900/80 border-slate-200 dark:border-zinc-800 text-xs"
            />
          </div>
        }
      />

      <div className={`grid grid-cols-1 md:grid-cols-${Math.min(activeStages.length, 5)} gap-4`} style={{ gridTemplateColumns: `repeat(${activeStages.length}, minmax(0, 1fr))` }}>
        {activeStages.map((stage, stageIdx) => {
          const cards = filteredMemberships.filter((m) => {
            if (m.stage_id && m.stage_id === stage.id) return true;
            if (m.status === stage.label || m.status === stage.code) return true;
            
            // Check if card matches any stage label/code
            const matchesAnyStage = activeStages.some(
              (s) => (m.stage_id && m.stage_id === s.id) || m.status === s.label || m.status === s.code
            );
            // If card matches no stage, place in the first column or waiting column
            return !matchesAnyStage && (stage.code === "waiting" || stageIdx === 0);
          });

          return (
            <div key={stage.id || stage.code} className="bg-muted/40 p-4 rounded-2xl border border-border/60 flex flex-col min-h-[500px]">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-border/60">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5 truncate">
                  {stage.label}
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
                            href={`/alumni-growth/alumni/${getAlumniSlug(card.alumni_email, card.alumni_master?.name)}`}
                            className="font-bold text-xs text-foreground hover:text-primary transition-colors block truncate"
                          >
                            {card.alumni_master?.name || card.alumni_email}
                          </Link>
                          {salary && (
                            <Badge variant="outline" className="text-[9px] bg-emerald-500/5 text-emerald-600 border-emerald-500/20 shrink-0">
                              ₹{Math.round(salary / 1000)}k/mo
                            </Badge>
                          )}
                        </div>

                        <div className="text-[11px] text-muted-foreground truncate">
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

                        {/* Stage transition controls */}
                        <div className="pt-2 flex items-center justify-between border-t border-border/40 text-[10px]">
                          <span className="text-muted-foreground">Move stage:</span>
                          <div className="flex flex-wrap gap-1">
                            {activeStages.filter((s) => s.id !== stage.id && s.code !== stage.code).slice(0, 2).map((targetStage) => (
                              <button
                                key={targetStage.id || targetStage.code}
                                onClick={() => handleStageChange(card.alumni_email, targetStage)}
                                className="px-2 py-0.5 rounded-md bg-muted hover:bg-primary/10 hover:text-primary text-foreground transition-colors font-medium truncate max-w-[110px]"
                              >
                                → {targetStage.label.split(" ")[0]}
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
