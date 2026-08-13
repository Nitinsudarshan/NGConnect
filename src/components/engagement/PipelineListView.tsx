"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { getPipelineListViewAction, updatePipelineMembershipAction } from "@/lib/engagement/actions";
import { PipelineStage } from "@/types/engagement";
import { LoadingSpinner } from "@/components/loading-view";
import Link from "next/link";

interface PipelineListViewProps {
  pipelineCode: 'pay_forward' | 'mentoring' | 'placement';
  activeStages: any[];
  filters: { campus?: string; year?: string; supporter?: string; poc?: string; stage?: string };
  userEmail: string;
  pocOptions?: { email: string; name: string }[];
  extraColumn?: 'salary_progress' | 'company';
}

export function PipelineListView({
  pipelineCode,
  activeStages,
  filters,
  userEmail,
  pocOptions = [],
  extraColumn
}: PipelineListViewProps) {
  const [data, setData] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [sortField, setSortField] = useState<'name' | 'stage' | 'campus' | 'year' | 'poc'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const isFilterActive = filters.campus || filters.year || filters.supporter || (filters.poc && filters.poc !== "all");

  const fetchData = async () => {
    if (!isFilterActive) return;
    setIsLoading(true);
    const res = await getPipelineListViewAction(
      pipelineCode,
      {
        campus: filters.campus !== "all" ? filters.campus : undefined,
        year: filters.year !== "all" ? filters.year : undefined,
        supporter: filters.supporter !== "all" ? filters.supporter : undefined,
        poc: filters.poc !== "all" ? filters.poc : undefined,
        stage: filters.stage !== "all" ? filters.stage : undefined
      },
      { field: sortField, direction: sortDirection },
      page,
      pageSize
    );
    if (res.success && res.data) {
      setData(res.data);
      setTotalCount(res.totalCount || 0);
    } else {
      toast.error("Failed to load list view");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [pipelineCode, filters, sortField, sortDirection, page]);

  useEffect(() => {
    setPage(1); // Reset page on filter change
  }, [filters.campus, filters.year, filters.supporter, filters.poc, filters.stage]);

  const handleSort = (field: 'name' | 'stage' | 'campus' | 'year' | 'poc') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setPage(1);
  };

  const handleStageChange = async (alumniEmail: string, newStageId: string) => {
    const targetStage = activeStages.find(s => s.id === newStageId);
    if (!targetStage) return;

    const res = await updatePipelineMembershipAction({
      alumni_email: alumniEmail,
      pipeline_code: pipelineCode,
      stage_id: targetStage.id,
      status: targetStage.label,
      added_by: userEmail,
      is_active: true,
    });

    if (res.success) {
      toast.success(`Updated stage to ${targetStage.label}`);
      // Optimistically update
      setData(prev => prev.map(row => 
        row.alumni_email === alumniEmail ? { ...row, stage: targetStage } : row
      ));
    } else {
      toast.error(res.error || "Failed to update stage");
    }
  };

  const renderSortIcon = (field: string) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5 inline ml-1" /> : <ChevronDown className="w-3.5 h-3.5 inline ml-1" />;
  };

  if (!isFilterActive) {
    return (
      <div className="py-20 text-center border-2 border-dashed border-border/60 rounded-3xl bg-muted/20">
        <Filter className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
        <h3 className="font-bold text-foreground mb-1">Select a filter to view the board or list</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          The pipeline requires at least one active filter (Campus, Cohort Year, or Supporter) to prevent overloading the view.
        </p>
      </div>
    );
  }

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card/60 backdrop-blur-md p-1 sm:p-2 shadow-sm overflow-x-auto w-full max-w-full relative min-h-[400px]">
        {isLoading && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
            <LoadingSpinner size="md" />
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="cursor-pointer whitespace-nowrap" onClick={() => handleSort('name')}>
                Alumni Name {renderSortIcon('name')}
              </TableHead>
              <TableHead className="cursor-pointer whitespace-nowrap" onClick={() => handleSort('stage')}>
                Stage {renderSortIcon('stage')}
              </TableHead>
              <TableHead className="cursor-pointer whitespace-nowrap" onClick={() => handleSort('campus')}>
                Campus {renderSortIcon('campus')}
              </TableHead>
              <TableHead className="cursor-pointer whitespace-nowrap" onClick={() => handleSort('year')}>
                Cohort Year {renderSortIcon('year')}
              </TableHead>
              <TableHead className="cursor-pointer whitespace-nowrap" onClick={() => handleSort('poc')}>
                Owner {renderSortIcon('poc')}
              </TableHead>
              {extraColumn === 'salary_progress' && <TableHead className="whitespace-nowrap">Salary + Cap Progress</TableHead>}
              {extraColumn === 'company' && <TableHead className="whitespace-nowrap">Company</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length > 0 ? (
              data.map((row) => {
                const master = row.alumni_master || {};
                const name = master.name || "Unknown";
                const campus = master.campus || "N/A";
                const year = master.entry_year || "N/A";
                const pocName = pocOptions.find(p => p.email === row.poc_email)?.name || row.poc_email || "Unassigned";

                return (
                  <TableRow key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/50 transition-colors">
                    <TableCell className="font-medium">
                      <Link href={`/alumni-growth/alumni/${row.alumni_email}`} className="text-indigo-600 dark:text-indigo-400 hover:underline">
                        {name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Select 
                        value={row.stage?.id} 
                        onValueChange={(val) => handleStageChange(row.alumni_email, val)}
                      >
                        <SelectTrigger className="h-8 text-xs w-[160px]">
                          <SelectValue>
                            <Badge variant="outline" className="font-medium whitespace-nowrap">
                              {row.stage?.label || "Unknown"}
                            </Badge>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {activeStages.map(s => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{campus}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{year}</TableCell>
                    <TableCell className="text-xs font-medium whitespace-nowrap">{pocName}</TableCell>
                    
                    {extraColumn === 'salary_progress' && (
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {row.salary ? `₹${Math.round(row.salary / 1000)}k/mo` : "Unknown"}
                        {row.pfProgress && (
                          <span> &middot; {row.pfProgress.target_amount > 0 ? Math.round((row.pfProgress.total_paid / row.pfProgress.target_amount) * 100) : 0}%</span>
                        )}
                      </TableCell>
                    )}
                    {extraColumn === 'company' && (
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {master.company || "None"}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground italic">
                  {!isLoading ? "No alumni match these filters." : "Loading..."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground px-2">
        <div>
          Showing {data.length > 0 ? ((page - 1) * pageSize) + 1 : 0} to {Math.min(page * pageSize, totalCount)} of {totalCount} leads
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1 || isLoading}
            className="h-8"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Prev
          </Button>
          <span className="font-medium mx-2">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || isLoading}
            className="h-8"
          >
            Next <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
