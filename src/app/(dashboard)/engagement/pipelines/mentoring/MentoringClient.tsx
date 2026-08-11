"use client";

import React, { useState } from "react";
import Link from "next/link";
import { GraduationCap, UserCheck, Search, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { updatePipelineMembershipAction } from "@/lib/engagement/actions";
import { toast } from "sonner";

interface MentoringClientProps {
  pipeline: any;
  memberships: any[];
  userEmail: string;
}

const STAGES = ["Needs assessment", "Matched with mentor", "In session", "Placement support", "Closed"];

export default function MentoringClient({ pipeline, memberships, userEmail }: MentoringClientProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const handleStageChange = async (alumniEmail: string, newStatus: string) => {
    const res = await updatePipelineMembershipAction({
      alumni_email: alumniEmail,
      pipeline_code: "mentoring",
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

  const filtered = memberships.filter((m) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const name = m.alumni_master?.name?.toLowerCase() || "";
    return name.includes(term) || m.alumni_email.toLowerCase().includes(term);
  });

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-primary" /> Mentoring & Career Support Pipeline
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Manage learning needs assessment, mentor matching, and session attendance tracking.
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

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {STAGES.map((stage) => {
          const cards = filtered.filter((m) => m.status === stage || (!STAGES.includes(m.status) && stage === "Needs assessment"));

          return (
            <div key={stage} className="bg-muted/40 p-3.5 rounded-2xl border border-border/60 flex flex-col min-h-[480px]">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-border/60">
                <h3 className="font-bold text-xs text-foreground flex items-center gap-1">
                  {stage}
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
                        href={`/engagement/alumni/${encodeURIComponent(card.alumni_email)}`}
                        className="font-bold text-xs text-foreground hover:text-primary transition-colors block"
                      >
                        {card.alumni_master?.name || card.alumni_email}
                      </Link>
                      <div className="text-[10px] text-muted-foreground">
                        {card.alumni_master?.campus} • {card.alumni_master?.course}
                      </div>

                      <div className="pt-2 flex items-center justify-between border-t border-border/40 text-[10px]">
                        <span className="text-muted-foreground">Move stage:</span>
                        <div className="flex flex-wrap gap-1">
                          {STAGES.filter((s) => s !== stage).slice(0, 2).map((targetStage) => (
                            <button
                              key={targetStage}
                              onClick={() => handleStageChange(card.alumni_email, targetStage)}
                              className="px-1.5 py-0.5 rounded bg-muted hover:bg-primary/10 hover:text-primary text-foreground font-medium"
                            >
                              → {targetStage.split(" ")[0]}
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
