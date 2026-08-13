"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getAlumniSlug } from "@/lib/utils";

import { GraduationCap, ChevronRight, ChevronDown, Filter, ChevronsRightLeft, ChevronsLeftRight, LayoutGrid, List } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageBanner } from "@/components/shared/page-banner";
import { updatePipelineMembershipAction, getKanbanBoardCardsAction } from "@/lib/engagement/actions";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/loading-view";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

import { PipelineStage } from "@/types/engagement";
import TransferLeadModal from "@/components/engagement/TransferLeadModal";
import { calculateProfileScore, getStageBadgeVariant } from "@/lib/engagement/utils";
import { PipelineListView } from "@/components/engagement/PipelineListView";
import { AlumniKanbanCard } from "@/components/engagement/AlumniKanbanCard";

interface MentoringClientProps {
  pipeline: any;
  stages?: PipelineStage[];
  facets: { campuses: string[]; years: string[]; supporters: string[]; pocOptions?: { email: string; name: string }[] };
  userEmail: string;
}

const DEFAULT_STAGES = [
  { id: "default-needs_assessment", code: "needs_assessment", label: "Needs assessment", sort_order: 1, is_terminal: false },
  { id: "default-matched_with_mentor", code: "matched_with_mentor", label: "Matched with mentor", sort_order: 2, is_terminal: false },
  { id: "default-in_session", code: "in_session", label: "In session", sort_order: 3, is_terminal: false },
  { id: "default-closed", code: "closed", label: "Closed", sort_order: 4, is_terminal: true },
];

function MentoringColumn({ 
  stage, 
  activeStages, 
  allCards, 
  userEmail, 
  collapsed, 
  setCollapsed, 
  pocOptions,
  onMoveCard 
}: { 
  stage: any, 
  activeStages: any[], 
  allCards: any[], 
  userEmail: string, 
  collapsed: boolean, 
  setCollapsed: (v: boolean) => void, 
  pocOptions?: {email: string; name: string}[],
  onMoveCard: (email: string, targetStage: any) => void
}) {
  const [displayLimit, setDisplayLimit] = useState(25);
  const cards = allCards || [];
  const displayedCards = cards.slice(0, displayLimit);
  const hasMore = cards.length > displayLimit;

  // We rely on the parent to fetch and update cards.
  // The onMoveCard is used to optimistically move the card locally.

  const handleStageChange = async (alumniEmail: string, targetStage: any) => {
    onMoveCard(alumniEmail, targetStage); // Optimistically move locally
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

  if (collapsed) {
    return (
      <div 
        className="w-12 bg-muted/40 rounded-2xl border border-border/60 flex flex-col items-center justify-start cursor-pointer hover:bg-muted/60 transition-colors min-h-[500px] shrink-0 py-4"
        onClick={() => setCollapsed(false)}
      >
        <Badge variant={getStageBadgeVariant(cards.length, stage.code)} className="rounded-lg min-w-5 h-5 flex items-center justify-center px-1.5 text-[10px] font-bold mb-6 shrink-0 leading-none">
          {cards.length}
        </Badge>
        <div 
          className="whitespace-nowrap font-bold text-sm text-muted-foreground rotate-180" 
          style={{ writingMode: 'vertical-rl' }}
        >
          {stage.label}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-muted/40 p-4 rounded-2xl border border-border/60 flex flex-col min-h-[500px] min-w-[340px]">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-border/60">
        <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5 truncate">
          <button onClick={() => setCollapsed(true)} className="p-0.5 hover:bg-black/5 dark:hover:bg-white/10 rounded">
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>
          {stage.label}
        </h3>
        <Badge variant={getStageBadgeVariant(cards.length, stage.code)} className="rounded-lg min-w-5 h-5 flex items-center justify-center px-1.5 text-[10px] font-bold leading-none">
          {cards.length}
        </Badge>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto pr-1 pt-1 -mt-1">
        {displayedCards.map((card) => {
          const am = card.alumni_master || {};

          return (
            <AlumniKanbanCard
              key={card.id}
              card={card}
              activeStages={activeStages}
              stage={stage}
              pocOptions={pocOptions}
              onMoveCard={handleStageChange}
              pipelineExtra={
                am.company ? (
                  <div className="text-[10px] font-medium text-primary/80 truncate">
                    {am.company}
                  </div>
                ) : null
              }
            />
          );
        })}

        {cards.length === 0 && (
          <div className="py-10 text-center text-xs text-muted-foreground italic">
            No alumni in this stage.
          </div>
        )}

        {hasMore && cards.length > 0 && (
          <div className="pt-2 pb-1 text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDisplayLimit(displayLimit + 25)}
              className="text-xs h-7 rounded-lg"
            >
              Load More
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MentoringClient({
  pipeline,
  stages,
  facets,
  userEmail,
}: MentoringClientProps) {
  const [campusFilter, setCampusFilter] = useState<string>("");
  const [yearFilter, setYearFilter] = useState<string>("");
  const [supporterFilter, setSupporterFilter] = useState<string>("");

  const isEligible = facets.pocOptions?.some(p => p.email === userEmail);
  const [pocFilter, setPocFilter] = useState<string>(isEligible ? userEmail : "all");

  const activeStages = (stages && stages.length > 0) ? stages : DEFAULT_STAGES;
  const isFilterActive = campusFilter !== "" || yearFilter !== "" || supporterFilter !== "" || pocFilter !== "all";

  const [collapsedStates, setCollapsedStates] = useState<Record<string, boolean>>({});
  const [boardCards, setBoardCards] = useState<Record<string, any[]>>({});
  const [isLoadingBoard, setIsLoadingBoard] = useState(false);

  const [viewMode, setViewMode] = useState<"board" | "list">("board");
  const [stageFilter, setStageFilter] = useState<string>("all");

  useEffect(() => {
    const stored = localStorage.getItem('ngc-pipeline-view');
    if (stored === 'list' || stored === 'board') setViewMode(stored);
  }, []);

  const handleViewModeChange = (mode: "board" | "list") => {
    setViewMode(mode);
    localStorage.setItem('ngc-pipeline-view', mode);
  };

  useEffect(() => {
    if (!isFilterActive) {
      setBoardCards({});
      return;
    }
    const fetchBoard = async () => {
      setIsLoadingBoard(true);
      const filters = {
        campus: campusFilter !== "all" ? campusFilter : undefined,
        year: yearFilter !== "all" ? yearFilter : undefined,
        supporter: supporterFilter !== "all" ? supporterFilter : undefined,
        poc: pocFilter !== "all" ? pocFilter : undefined,
      };
      const res = await getKanbanBoardCardsAction("mentoring", activeStages, filters);
      if (res.success && res.data) {
        setBoardCards(res.data);
      } else {
        toast.error("Failed to load kanban board");
      }
      setIsLoadingBoard(false);
    };
    fetchBoard();
  }, [campusFilter, yearFilter, supporterFilter, pocFilter, activeStages]);

  const handleMoveCard = (alumniEmail: string, targetStage: any) => {
    setBoardCards((prev) => {
      const newMap = { ...prev };
      let foundCard: any = null;
      for (const stageId of Object.keys(newMap)) {
        const idx = newMap[stageId]?.findIndex(c => c.alumni_email === alumniEmail);
        if (idx !== undefined && idx !== -1) {
          foundCard = newMap[stageId][idx];
          newMap[stageId] = [...newMap[stageId]];
          newMap[stageId].splice(idx, 1);
          break;
        }
      }
      if (foundCard) {
        if (!newMap[targetStage.id]) newMap[targetStage.id] = [];
        newMap[targetStage.id] = [foundCard, ...newMap[targetStage.id]];
      }
      return newMap;
    });
  };

  const isStagePassive = (stageCode: string, isTerminal: boolean) => {
    return isTerminal || ["closed", "declined_not_interested"].includes(stageCode);
  };

  const handleCollapseAll = () => {
    const newState: Record<string, boolean> = {};
    activeStages.forEach(s => newState[s.id] = true);
    setCollapsedStates(newState);
  };

  const handleExpandAll = () => {
    const newState: Record<string, boolean> = {};
    activeStages.forEach(s => newState[s.id] = false);
    setCollapsedStates(newState);
  };

  const isAllCollapsed = activeStages.every(s => collapsedStates[s.id] ?? isStagePassive(s.code, s.is_terminal));
  const isAllExpanded = activeStages.every(s => !(collapsedStates[s.id] ?? isStagePassive(s.code, s.is_terminal)));

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto w-full pb-20">
      <PageBanner
        title="Mentoring / Career Support Pipeline"
        description={<p>Track alumni engagement in mentoring programs, mock interviews, and technical upskilling.</p>}
        icon={<GraduationCap className="h-8 w-8 text-blue-500" />}
      />

      <div className="bg-card border border-border/80 rounded-2xl p-1.5 px-3 shadow-2xs flex flex-row gap-2 items-center">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground pr-2 border-r border-border/60">
          <Filter className="w-3.5 h-3.5" />
          <span>Filters</span>
        </div>

        <Select value={pocFilter} onValueChange={setPocFilter}>
          <SelectTrigger className="h-8 w-[160px] text-xs bg-muted bg-muted/60 hover:bg-muted/80 rounded-lg mr-2">
            <SelectValue placeholder="Owner" />
          </SelectTrigger>
          <SelectContent>
            {isEligible && <SelectItem value={userEmail}>Me (My Leads)</SelectItem>}
            <SelectItem value="all">All Owners</SelectItem>
            {facets.pocOptions?.filter(p => p.email !== userEmail).map(p => (
              <SelectItem key={p.email} value={p.email}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={campusFilter} onValueChange={setCampusFilter}>
          <SelectTrigger className="h-8 w-[160px] text-xs border-transparent bg-muted/30 hover:bg-muted/60 rounded-lg">
            <SelectValue placeholder="Campus" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Campuses</SelectItem>
            {facets.campuses.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={yearFilter} onValueChange={setYearFilter}>
          <SelectTrigger className="h-8 w-[140px] text-xs border-transparent bg-muted/30 hover:bg-muted/60 rounded-lg">
            <SelectValue placeholder="Cohort Year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Years</SelectItem>
            {facets.years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={supporterFilter} onValueChange={setSupporterFilter}>
          <SelectTrigger className="h-8 w-[180px] text-xs border-transparent bg-muted/30 hover:bg-muted/60 rounded-lg">
            <SelectValue placeholder="Supporter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Supporters</SelectItem>
            {facets.supporters.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>

        {viewMode === "list" && (
          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="h-8 w-[180px] text-xs border-transparent bg-muted/30 hover:bg-muted/60 rounded-lg mr-2">
              <SelectValue placeholder="Stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              {activeStages.map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        )}

        {isFilterActive && (
          <div className="flex items-center gap-1.5 ml-auto">
            <div className="flex bg-muted/60 p-0.5 rounded-lg border border-border/50 items-center mr-2">
              <button 
                onClick={() => handleViewModeChange("board")} 
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${viewMode === "board" ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <LayoutGrid className="h-3.5 w-3.5" /> Board
              </button>
              <button 
                onClick={() => handleViewModeChange("list")} 
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${viewMode === "list" ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <List className="h-3.5 w-3.5" /> List
              </button>
            </div>

            {viewMode === "board" && (
              <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={handleExpandAll}
                    disabled={isAllExpanded}
                    className="h-7 w-7 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-800 dark:hover:text-indigo-300 disabled:opacity-40"
                  >
                    <ChevronsLeftRight className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Expand All Columns</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={handleCollapseAll}
                    disabled={isAllCollapsed}
                    className="h-7 w-7 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-800 dark:hover:text-indigo-300 disabled:opacity-40"
                  >
                    <ChevronsRightLeft className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Collapse All Columns</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            )}
            
            {(viewMode === "board") && <div className="w-px h-4 bg-border mx-1"></div>}
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => { setCampusFilter(""); setYearFilter(""); setSupporterFilter(""); setStageFilter("all"); }}
              className="h-8 text-xs rounded-lg px-2 text-muted-foreground hover:text-foreground"
            >
              Clear
            </Button>
          </div>
        )}
      </div>

      {!isFilterActive ? (
        <div className="py-20 text-center border-2 border-dashed border-border/60 rounded-3xl bg-muted/20">
          <Filter className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="font-bold text-foreground mb-1">Select a filter to view the board or list</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            The pipeline requires at least one active filter (Campus, Cohort Year, or Supporter) to prevent overloading the view.
          </p>
        </div>
      ) : viewMode === "list" ? (
        <PipelineListView
          pipelineCode="mentoring"
          activeStages={activeStages}
          filters={{
            campus: campusFilter,
            year: yearFilter,
            supporter: supporterFilter,
            poc: pocFilter,
            stage: stageFilter
          }}
          userEmail={userEmail}
          pocOptions={facets.pocOptions}
          extraColumn="company"
        />
      ) : isLoadingBoard ? (
        <div className="py-20 text-center rounded-3xl bg-muted/10 flex flex-col items-center justify-center">
          <LoadingSpinner size="md" />
          <h3 className="font-bold text-muted-foreground mb-1 mt-4">Loading Board Data...</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">Fetching all matching alumni</p>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 items-stretch">
          {activeStages.map((stage) => (
            <MentoringColumn
              key={stage.id}
              stage={stage}
              activeStages={activeStages}
              allCards={boardCards[stage.id] || []}
              userEmail={userEmail}
              pocOptions={facets.pocOptions}
              collapsed={collapsedStates[stage.id] ?? isStagePassive(stage.code, stage.is_terminal)}
              setCollapsed={(val) => setCollapsedStates(prev => ({ ...prev, [stage.id]: val }))}
              onMoveCard={handleMoveCard}
            />
          ))}
        </div>
      )}
    </div>
  );
}
