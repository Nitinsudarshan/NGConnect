"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getAlumniSlug } from "@/lib/utils";

import { Briefcase, ChevronDown, Filter, ChevronsRightLeft, ChevronsLeftRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageBanner } from "@/components/shared/page-banner";
import { updatePipelineMembershipAction, getKanbanColumnCardsAction } from "@/lib/engagement/actions";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

import { PipelineStage } from "@/types/engagement";

interface PlacementClientProps {
  pipeline: any;
  stages?: PipelineStage[];
  facets: { campuses: string[]; years: string[]; supporters: string[]; pocOptions?: { email: string; name: string }[] };
  userEmail: string;
}

const DEFAULT_STAGES = [
  { id: "default-needs_identified", code: "needs_identified", label: "Needs identified", sort_order: 1, is_terminal: false },
  { id: "default-searching_matched", code: "searching_matched", label: "Actively searching / matched to opportunity", sort_order: 2, is_terminal: false },
  { id: "default-interviewing", code: "interviewing", label: "Interviewing", sort_order: 3, is_terminal: false },
  { id: "default-placed", code: "placed", label: "Placed", sort_order: 4, is_terminal: true },
  { id: "default-not_placed_closed", code: "not_placed_closed", label: "Not placed (closed)", sort_order: 5, is_terminal: true },
];

function PlacementColumn({ stage, activeStages, filters, userEmail, collapsed, setCollapsed, pocOptions }: { stage: any, activeStages: any[], filters: any, userEmail: string, collapsed: boolean, setCollapsed: (v: boolean) => void, pocOptions?: {email: string; name: string}[] }) {
  const [cards, setCards] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const fetchCards = async (pageNum: number, overwrite: boolean = false) => {
    setLoading(true);
    const res = await getKanbanColumnCardsAction("placement", stage.id, filters, pageNum);
    if (res.success && res.data) {
      if (overwrite) {
        setCards(res.data);
      } else {
        setCards((prev) => [...prev, ...res.data]);
      }
      if (res.data.length < 25) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
      if (overwrite && res.data.length > 0) {
        setTotalCount((prev) => Math.max(prev, res.data.length));
      }
    } else {
      toast.error(`Failed to load cards for ${stage.label}`);
    }
    setLoading(false);
  };

  useEffect(() => {
    setPage(1);
    setCards([]);
    setTotalCount(0);
    fetchCards(1, true);
  }, [filters, stage.id]);

  useEffect(() => {
    setTotalCount(Math.max(totalCount, cards.length));
  }, [cards.length, totalCount]);

  const handleStageChange = async (alumniEmail: string, targetStage: any) => {
    const res = await updatePipelineMembershipAction({
      alumni_email: alumniEmail,
      pipeline_code: "placement",
      stage_id: targetStage.id,
      status: targetStage.label,
      added_by: userEmail,
      is_active: true,
    });
    if (res.success) {
      toast.success(`Updated stage to ${targetStage.label}`);
      setCards((prev) => prev.filter((c) => c.alumni_email !== alumniEmail));
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
        <Badge variant="secondary" className="rounded-full text-[10px] font-bold mb-6 shrink-0">
          {totalCount || cards.length}
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
    <div className="bg-muted/40 p-4 rounded-2xl border border-border/60 flex flex-col min-h-[500px] min-w-[280px]">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-border/60">
        <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5 truncate">
          <button onClick={() => setCollapsed(true)} className="p-0.5 hover:bg-black/5 dark:hover:bg-white/10 rounded">
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>
          {stage.label}
        </h3>
        <Badge variant="secondary" className="rounded-full text-[10px] font-bold">
          {cards.length}
        </Badge>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto pr-1">
        {cards.map((card) => {
          const am = card.alumni_master || {};

          return (
            <Card key={card.id} className="border border-border/80 rounded-xl bg-card shadow-2xs hover:shadow-md transition-all">
              <CardContent className="p-3.5 space-y-2.5">
                <div className="flex items-start justify-between gap-1">
                  <Link
                    href={`/alumni-growth/alumni/${getAlumniSlug(card.alumni_email, am.name)}`}
                    className="font-bold text-xs text-foreground hover:text-primary transition-colors block truncate"
                  >
                    {am.name || card.alumni_email}
                  </Link>
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground truncate mt-1">
                  <span>{am.campus || "Unknown Campus"} • {am.entry_year || "N/A"}</span>
                  {card.poc_email && (
                    <Badge variant="outline" className="text-[9px] bg-indigo-500/5 text-indigo-600 border-indigo-500/20 shrink-0">
                      {pocOptions?.find(p => p.email === card.poc_email)?.name || card.poc_email.split('@')[0]}
                    </Badge>
                  )}
                </div>
                
                {am.company && (
                  <div className="text-[10px] font-medium text-primary/80 truncate">
                    {am.company}
                  </div>
                )}

                {/* Stage transition controls */}
                <div className="pt-2 flex items-center justify-between border-t border-border/40 text-[10px]">
                  <span className="text-muted-foreground">Move:</span>
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

        {cards.length === 0 && !loading && (
          <div className="py-10 text-center text-xs text-muted-foreground italic">
            No alumni in this stage.
          </div>
        )}

        {hasMore && cards.length > 0 && (
          <div className="pt-2 pb-1 text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const next = page + 1;
                setPage(next);
                fetchCards(next);
              }}
              disabled={loading}
              className="text-xs h-7 rounded-lg"
            >
              {loading ? "Loading..." : "Load More"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PlacementClient({
  pipeline,
  stages,
  facets,
  userEmail,
}: PlacementClientProps) {
  const [campusFilter, setCampusFilter] = useState<string>("");
  const [yearFilter, setYearFilter] = useState<string>("");
  const [supporterFilter, setSupporterFilter] = useState<string>("");

  const isEligible = facets.pocOptions?.some(p => p.email === userEmail);
  const [pocFilter, setPocFilter] = useState<string>(isEligible ? userEmail : "all");

  const activeStages = (stages && stages.length > 0) ? stages : DEFAULT_STAGES;
  const isFilterActive = campusFilter !== "" || yearFilter !== "" || supporterFilter !== "" || pocFilter !== "all";

  const [collapsedStates, setCollapsedStates] = useState<Record<string, boolean>>({});

  const isStagePassive = (stageCode: string, isTerminal: boolean) => {
    return isTerminal || ["placed", "not_placed_closed", "declined_not_interested"].includes(stageCode);
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
        title="Placement Support Pipeline"
        description={<p>Track alumni actively seeking employment, interviewing, and job placements.</p>}
        icon={<Briefcase className="h-8 w-8 text-indigo-500" />}
      />

      <div className="bg-card border border-border/80 rounded-2xl p-1.5 px-3 shadow-2xs flex flex-row gap-2 items-center">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground pr-2 border-r border-border/60">
          <Filter className="w-3.5 h-3.5" />
          <span>Filters</span>
        </div>

        <div className="flex bg-muted/60 p-0.5 rounded-lg border border-border/50 items-center mr-2">
          {isEligible && (
            <button
              onClick={() => setPocFilter(userEmail)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${pocFilter === userEmail ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              My Leads
            </button>
          )}
          <button
            onClick={() => setPocFilter("all")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${pocFilter === "all" ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            All
          </button>
          
          <Select value={pocFilter !== userEmail && pocFilter !== "all" ? pocFilter : ""} onValueChange={setPocFilter}>
            <SelectTrigger className={`h-7 px-3 text-xs border-0 bg-transparent shadow-none focus:ring-0 ${pocFilter !== userEmail && pocFilter !== "all" ? 'bg-background shadow-sm text-foreground rounded-md' : 'text-muted-foreground hover:text-foreground'}`}>
              <SelectValue placeholder="Other" />
            </SelectTrigger>
            <SelectContent>
              {facets.pocOptions?.filter(p => p.email !== userEmail).map(p => (
                <SelectItem key={p.email} value={p.email}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
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

        {isFilterActive && (
          <div className="flex items-center gap-1.5 ml-auto">
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
            <div className="w-px h-4 bg-border mx-1"></div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => { setCampusFilter(""); setYearFilter(""); setSupporterFilter(""); }}
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
          <h3 className="font-bold text-foreground mb-1">Select a filter to view the board</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            The Kanban board requires at least one active filter (Campus, Cohort Year, or Supporter) to prevent overloading the view.
          </p>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 items-stretch">
          {activeStages.map((stage) => (
            <PlacementColumn
              key={stage.id}
              stage={stage}
              activeStages={activeStages}
              filters={{
                campus: campusFilter !== "all" ? campusFilter : undefined,
                year: yearFilter !== "all" ? yearFilter : undefined,
                supporter: supporterFilter !== "all" ? supporterFilter : undefined,
                poc: pocFilter !== "all" ? pocFilter : undefined,
              }}
              userEmail={userEmail}
              pocOptions={facets.pocOptions}
              collapsed={collapsedStates[stage.id] ?? isStagePassive(stage.code, stage.is_terminal)}
              setCollapsed={(val) => setCollapsedStates(prev => ({...prev, [stage.id]: val}))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
