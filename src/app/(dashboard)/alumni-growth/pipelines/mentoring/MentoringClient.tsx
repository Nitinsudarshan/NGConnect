"use client";

import React, { useState } from "react";
import Link from "next/link";
import { getAlumniSlug } from "@/lib/utils";

import { GraduationCap, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PageBanner } from "@/components/shared/page-banner";
import { updatePipelineMembershipAction } from "@/lib/engagement/actions";
import { toast } from "sonner";

import { PipelineStage } from "@/types/engagement";

interface MentoringClientProps {
  pipeline: any;
  stages?: PipelineStage[];
  memberships: any[];
  userEmail: string;
}

const DEFAULT_STAGES = [
  { id: "default-needs_assessment", code: "needs_assessment", label: "Needs assessment", sort_order: 1 },
  { id: "default-matched_with_mentor", code: "matched_with_mentor", label: "Matched with mentor", sort_order: 2 },
  { id: "default-in_session", code: "in_session", label: "In session", sort_order: 3 },
  { id: "default-closed", code: "closed", label: "Closed", sort_order: 4 },
];

export default function MentoringClient({ pipeline, stages, memberships, userEmail }: MentoringClientProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const activeStages = (stages && stages.length > 0) ? stages : DEFAULT_STAGES;

  const handleStageChange = async (alumniEmail: string, targetStage: { id: string; label: string }) => {
    const res = await updatePipelineMembershipAction({
      alumni_email: alumniEmail,
      pipeline_code: "mentoring",
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

  const filtered = memberships.filter((m) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const name = m.alumni_master?.name?.toLowerCase() || "";
    return name.includes(term) || m.alumni_email.toLowerCase().includes(term);
  });

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-20">
      <PageBanner
        title="Mentoring & Career Support Pipeline"
        description={<p>Manage learning needs assessment, mentor matching, and session attendance tracking.</p>}
        icon={<GraduationCap className="h-8 w-8 text-primary" />}
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
          const cards = filtered.filter((m) => {
            if (m.stage_id && m.stage_id === stage.id) return true;
            if (m.status === stage.label || m.status === stage.code) return true;

            const matchesAnyStage = activeStages.some(
              (s) => (m.stage_id && m.stage_id === s.id) || m.status === s.label || m.status === s.code
            );
            return !matchesAnyStage && (stage.code === "needs_assessment" || stageIdx === 0);
          });

          return (
            <div key={stage.id || stage.code} className="bg-muted/40 p-3.5 rounded-2xl border border-border/60 flex flex-col min-h-[480px]">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-border/60">
                <h3 className="font-bold text-xs text-foreground flex items-center gap-1 truncate">
                  {stage.label}
                </h3>
                <Badge variant="secondary" className="rounded-full text-[10px]">
                  {cards.length}
                </Badge>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto">
                {cards.map((card) => (
                  <Card key={card.id} className="border border-border/80 rounded-xl bg-card shadow-2xs">
                    <CardContent className="p-3 space-y-2">
                      <Link
                        href={`/alumni-growth/alumni/${getAlumniSlug(card.alumni_email, card.alumni_master?.name)}`}
                        className="font-bold text-xs text-foreground hover:text-primary transition-colors block truncate"
                      >
                        {card.alumni_master?.name || card.alumni_email}
                      </Link>
                      <div className="text-[10px] text-muted-foreground truncate">
                        {card.alumni_master?.campus} • {card.alumni_master?.course}
                      </div>

                      <div className="pt-2 flex items-center justify-between border-t border-border/40 text-[10px]">
                        <span className="text-muted-foreground">Move stage:</span>
                        <div className="flex flex-wrap gap-1">
                          {activeStages.filter((s) => s.id !== stage.id && s.code !== stage.code).slice(0, 2).map((targetStage) => (
                            <button
                              key={targetStage.id || targetStage.code}
                              onClick={() => handleStageChange(card.alumni_email, targetStage)}
                              className="px-1.5 py-0.5 rounded bg-muted hover:bg-primary/10 hover:text-primary text-foreground font-medium truncate max-w-[100px]"
                            >
                              → {targetStage.label.split(" ")[0]}
                            </button>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {cards.length === 0 && (
                  <div className="py-8 text-center text-xs text-muted-foreground italic">
                    No alumni in stage.
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
