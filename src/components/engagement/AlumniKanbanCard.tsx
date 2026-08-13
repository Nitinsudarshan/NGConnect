"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { getAlumniSlug } from "@/lib/utils";

interface AlumniKanbanCardProps {
  card: any;
  activeStages: any[];
  stage: any;
  pocOptions?: { email: string; name: string }[];
  onMoveCard: (email: string, targetStage: any) => void;
  pipelineExtra?: React.ReactNode;
  salaryBadge?: boolean;
}

export function AlumniKanbanCard({
  card,
  activeStages,
  stage,
  pocOptions,
  onMoveCard,
  pipelineExtra,
  salaryBadge
}: AlumniKanbanCardProps) {
  const router = useRouter();
  const am = card.alumni_master || {};
  const currentIndex = activeStages.findIndex((s) => s.id === stage.id);
  const prevStage = currentIndex > 0 ? activeStages[currentIndex - 1] : null;
  const nextStage = currentIndex < activeStages.length - 1 ? activeStages[currentIndex + 1] : null;

  const navigateToDetail = () => {
    router.push(`/alumni-growth/alumni/${getAlumniSlug(card.alumni_email, am.name)}`);
  };

  return (
    <Card
      onClick={navigateToDetail}
      onKeyDown={(e) => { 
        if (e.key === "Enter" || e.key === " ") { 
          e.preventDefault(); 
          navigateToDetail(); 
        } 
      }}
      role="button"
      tabIndex={0}
      className="relative z-10 cursor-pointer border border-primary/30 rounded-lg bg-card shadow-md hover:shadow-lg hover:border-primary/60 hover:-translate-y-0.5 hover:z-50 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 py-2 px-2"
    >
      <CardContent className="p-0 flex items-center gap-0.5">
        {prevStage ? (
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={(e) => { e.stopPropagation(); onMoveCard(card.alumni_email, prevStage); }}
                  className="shrink-0 flex items-center justify-center w-6 h-8 mr-2 rounded border border-border bg-muted/40 text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom"><p>Move to: {prevStage.label}</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : <div className="w-4 shrink-0" />}

        <div className="flex-1 min-w-0 space-y-0.5 px-0.5">
          <div className="flex items-start justify-between gap-1">
            <span className="font-semibold text-xs text-foreground truncate block">
              {am.name || card.alumni_email}
            </span>
            {salaryBadge && card.salary > 0 && (
              <Badge variant="outline" className="text-[9px] bg-emerald-500/5 text-emerald-600 border-emerald-500/20 shrink-0 h-4 px-1.5 py-0 font-semibold leading-none flex items-center">
                ₹{Math.round(card.salary / 1000)}k/mo
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] text-muted-foreground truncate">
            <span>{am.campus || "Unknown Campus"} • {am.entry_year || "N/A"}</span>
            {card.poc_email && (
              <Badge variant="outline" className="text-[9px] bg-indigo-500/5 text-indigo-600 border-indigo-500/20 shrink-0 h-4 px-1.5 py-0 font-medium leading-none flex items-center">
                {pocOptions?.find(p => p.email === card.poc_email)?.name || card.poc_email.split('@')[0]}
              </Badge>
            )}
          </div>

          {pipelineExtra}
        </div>

        {nextStage ? (
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={(e) => { e.stopPropagation(); onMoveCard(card.alumni_email, nextStage); }}
                  className="shrink-0 flex items-center justify-center w-6 h-8 ml-2 rounded border border-border bg-muted/40 text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom"><p>Move to: {nextStage.label}</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : <div className="w-4 shrink-0" />}
      </CardContent>
    </Card>
  );
}
