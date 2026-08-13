"use client";

import React, { useState } from "react";
import Link from "next/link";
import { getAlumniSlug } from "@/lib/utils";

import {
  CalendarClock,
  CheckCircle2,
  AlertTriangle,
  Search,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
} from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { PageBanner } from "@/components/shared/page-banner";
import { HelpModal } from "@/components/shared/HelpModal";
import { completeFollowupAction } from "@/lib/engagement/actions";
import { toast } from "sonner";

interface FollowUpsClientProps {
  followups: any[];
}

export default function FollowUpsClient({ followups }: FollowUpsClientProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");

  const now = new Date();

  const handleComplete = async (id: string) => {
    const res = await completeFollowupAction(id);
    if (res.success) {
      toast.success("Follow-up marked complete!");
    } else {
      toast.error(res.error || "Failed to mark complete");
    }
  };

  const filtered = followups.filter((f) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      f.alumni_email.toLowerCase().includes(term) ||
      f.alumni_master?.name?.toLowerCase().includes(term) ||
      f.notes?.toLowerCase().includes(term)
    );
  });

  // Pagination logic (matching master-data)
  const totalEntries = filtered.length;
  const totalPages = Math.ceil(totalEntries / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalEntries);
  const paginatedFollowups = filtered.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handlePageSizeChange = (val: string) => {
    setPageSize(parseInt(val, 10));
    setCurrentPage(1);
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-20">
      <PageBanner
        title="Scheduled Follow-ups & Callbacks"
        description={<p>Consolidated cross-pipeline calendar of all requested callbacks and scheduled touchpoints.</p>}
        icon={<CalendarClock className="h-8 w-8 text-primary" />}
        actions={
          <div className="flex items-center gap-2">
            <div className="w-full sm:w-64">
              <Input
                placeholder="Search callbacks..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="h-10 rounded-xl bg-white/80 dark:bg-zinc-900/80 border-slate-200 dark:border-zinc-800 text-xs"
              />
            </div>
            <HelpModal helpId="follow_ups" />
          </div>
        }
      />

      <Card className="border border-border/80 rounded-2xl bg-card shadow-2xs p-3 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse min-w-[60rem]">
            <thead className="bg-muted/50 border-b border-border/60 uppercase tracking-wider">
              <tr>
                <th className="px-3 py-2.5 font-bold text-[9px] text-muted-foreground">Alumnus Name & Email</th>
                <th className="px-3 py-2.5 font-bold text-[9px] text-muted-foreground">Scheduled Date & Time</th>
                <th className="px-3 py-2.5 font-bold text-[9px] text-muted-foreground">Assigned Staff</th>
                <th className="px-3 py-2.5 font-bold text-[9px] text-muted-foreground">Outcome / Notes</th>
                <th className="px-3 py-2.5 font-bold text-[9px] text-muted-foreground">Status</th>
                <th className="px-3 py-2.5 font-bold text-[9px] text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedFollowups.map((item) => {
                const isOverdue = new Date(item.followup_at) < now && !item.followup_completed;

                return (
                  <tr
                    key={item.id}
                    className={`border-t border-border/40 transition-colors ${
                      isOverdue ? "bg-destructive/5 hover:bg-destructive/10" : "hover:bg-muted/15"
                    }`}
                  >
                    <td className="px-3 py-2.5 font-bold text-foreground">
                      <Link
                        href={`/alumni-growth/alumni/${getAlumniSlug(item.alumni_email, item.alumni_master?.name)}`}
                        className="hover:text-primary transition-colors block"
                      >

                        {item.alumni_master?.name || item.alumni_email}
                      </Link>
                      <span className="text-[10px] text-muted-foreground font-mono font-normal">{item.alumni_email}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className={`font-bold flex items-center gap-1 ${isOverdue ? "text-destructive" : "text-foreground"}`}>
                        {isOverdue && <AlertTriangle className="w-3.5 h-3.5" />}
                        {new Date(item.followup_at).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">
                      {item.followup_assigned_to || item.logged_by}
                    </td>
                    <td className="px-3 py-2.5 max-w-xs">
                      <Badge variant="outline" className="text-[10px] rounded-md mb-0.5">
                        {item.interaction_outcomes?.label}
                      </Badge>
                      {item.notes && <p className="text-[10px] text-muted-foreground truncate">{item.notes}</p>}
                    </td>
                    <td className="px-3 py-2.5">
                      {item.followup_completed ? (
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
                          Completed
                        </Badge>
                      ) : isOverdue ? (
                        <Badge variant="destructive" className="text-[10px]">
                          Overdue
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">
                          Pending
                        </Badge>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      {!item.followup_completed && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleComplete(item.id)}
                          className="h-7 rounded-md text-xs gap-1 border-emerald-500/40 text-emerald-600 hover:bg-emerald-50 px-2.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Complete
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}

              {paginatedFollowups.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    No scheduled follow-ups found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Master-Data Style Pagination Footer */}
        <CardFooter className="pt-3 pb-1 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border/40">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Rows per page:</span>
              <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                <SelectTrigger className="h-7 w-16 text-xs rounded-md">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="text-xs rounded-md">
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <span className="text-xs text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{totalEntries > 0 ? startIndex + 1 : 0}</span> - <span className="font-semibold text-foreground">{endIndex}</span> of <span className="font-semibold text-foreground">{totalEntries}</span> entries
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-7 rounded-md gap-1 text-[11px] font-semibold px-2"
            >
              <ChevronLeft className="w-3 h-3" /> Prev
            </Button>

            <div className="flex gap-1 hidden sm:flex">
              {Array.from({ length: totalPages }).map((_, idx) => (
                <Button
                  key={idx}
                  variant={currentPage === idx + 1 ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(idx + 1)}
                  className="h-7 w-7 rounded-md font-bold text-[11px] p-0"
                >
                  {idx + 1}
                </Button>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="h-7 rounded-md gap-1 text-[11px] font-semibold px-2"
            >
              Next <ChevronRight className="w-3 h-3" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
