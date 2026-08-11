"use client";

import React, { useState } from "react";
import Link from "next/link";
import { getAlumniSlug } from "@/lib/utils";

import {
  Briefcase,
  PhoneCall,
  CalendarClock,
  Clock,
  AlertTriangle,
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Info,
  Building2,
  GraduationCap,
  ArrowUpDown,
  FileSpreadsheet,
  CheckCircle2,
  UserCheck,
  ChevronRight as ChevronRightIcon,
  Sparkles,
  Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { PageBanner } from "@/components/shared/page-banner";
import LogInteractionModal from "@/components/engagement/LogInteractionModal";
import AlumniDetailsModule from "@/components/shared/alumni-details-module";
import { InteractionOutcome, OrgSettings } from "@/types/engagement";
import { completeFollowupAction } from "@/lib/engagement/actions";
import { calculateProfileScore } from "@/lib/engagement/utils";
import { toast } from "sonner";

interface WorkspaceClientProps {
  alumniList: any[];
  followups: any[];
  recentInteractions: any[];
  outcomes: InteractionOutcome[];
  settings: OrgSettings;
  userEmail: string;
}

export default function WorkspaceClient({
  alumniList,
  followups,
  recentInteractions,
  outcomes,
  settings,
  userEmail,
}: WorkspaceClientProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterColumn, setFilterColumn] = useState("all");
  const [sortOption, setSortOption] = useState("name_asc");
  const [selectedAlumniForCall, setSelectedAlumniForCall] = useState<{ email: string; name: string } | null>(null);
  const [selectedAlumniForDrawer, setSelectedAlumniForDrawer] = useState<any | null>(null);

  const now = new Date();
  const overdueFollowups = followups.filter((f) => new Date(f.followup_at) < now && !f.followup_completed);
  const dueTodayFollowups = followups.filter((f) => {
    const d = new Date(f.followup_at);
    return (
      d >= new Date(now.setHours(0, 0, 0, 0)) &&
      d <= new Date(now.setHours(23, 59, 59, 999)) &&
      !f.followup_completed
    );
  });

  // Filter logic
  const filteredAlumni = alumniList.filter((item) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();

    if (filterColumn === "all") {
      return (
        item.name?.toLowerCase().includes(term) ||
        item.email?.toLowerCase().includes(term) ||
        item.campus?.toLowerCase().includes(term) ||
        item.course?.toLowerCase().includes(term) ||
        item.status?.toLowerCase().includes(term) ||
        item.company?.toLowerCase().includes(term)
      );
    }

    const value = item[filterColumn];
    return value ? String(value).toLowerCase().includes(term) : false;
  });

  // Sort logic
  const sortedAlumni = [...filteredAlumni].sort((a, b) => {
    if (sortOption === "name_asc") return (a.name || "").localeCompare(b.name || "");
    if (sortOption === "name_desc") return (b.name || "").localeCompare(a.name || "");
    if (sortOption === "campus_asc") return (a.campus || "").localeCompare(b.campus || "");
    if (sortOption === "campus_desc") return (b.campus || "").localeCompare(a.campus || "");
    if (sortOption === "status_asc") return (a.status || "").localeCompare(b.status || "");
    if (sortOption === "status_desc") return (b.status || "").localeCompare(a.status || "");
    return 0;
  });

  // Pagination logic (matching master-data)
  const totalEntries = sortedAlumni.length;
  const totalPages = Math.ceil(totalEntries / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalEntries);
  const paginatedAlumni = sortedAlumni.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handlePageSizeChange = (val: string) => {
    setPageSize(parseInt(val, 10));
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleCompleteFollowup = async (id: string) => {
    const res = await completeFollowupAction(id);
    if (res.success) {
      toast.success("Follow-up marked complete!");
    } else {
      toast.error(res.error || "Failed to complete follow-up");
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-20">
      {/* Standard Page Banner */}
      <PageBanner
        title="Alumni Daily Workspace"
        description={<p>Prioritized daily work queue & alumni engagement roster across all teams.</p>}
        icon={<Briefcase className="h-8 w-8 text-indigo-500" />}
        actions={
          <Badge variant="outline" className="px-3 py-1.5 text-xs rounded-full bg-white/80 dark:bg-zinc-900/80 border-indigo-200 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 font-semibold shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Cool-down: {settings.followup_cooldown_days} days
          </Badge>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {/* Overdue Callbacks */}
        <div className="bg-card/60 backdrop-blur-md border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Overdue Callbacks</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{overdueFollowups.length}</p>
            </div>
            <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg group-hover:bg-red-100 dark:group-hover:bg-red-900/40 transition-colors">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-red-600 dark:text-red-400 font-medium flex items-center bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-md text-xs">
               Action Required
            </span>
          </div>
        </div>

        {/* Due Today */}
        <div className="bg-card/60 backdrop-blur-md border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Due Today</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{dueTodayFollowups.length}</p>
            </div>
            <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg group-hover:bg-amber-100 dark:group-hover:bg-amber-900/40 transition-colors">
              <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-md text-xs">
               Scheduled for today
            </span>
          </div>
        </div>

        {/* Total Active Pool */}
        <div className="bg-card/60 backdrop-blur-md border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Active Pool</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{alumniList.length}</p>
            </div>
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/40 transition-colors">
              <UserCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-slate-500 font-medium">
            Alumni assigned to workspace
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-card border border-border/80 rounded-2xl p-1.5 px-3 shadow-2xs flex flex-col sm:flex-row gap-2 items-center w-full">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground pr-2 sm:border-r sm:border-border/60 shrink-0 hidden sm:flex">
          <Filter className="w-3.5 h-3.5" />
          <span>Filters</span>
        </div>

        <Select value={filterColumn} onValueChange={(val) => { setFilterColumn(val); setCurrentPage(1); }}>
          <SelectTrigger className="h-8 w-full sm:w-[160px] text-xs  bg-muted bg-muted/60 hover:bg-muted/80 rounded-lg">
            <SelectValue placeholder="Filter By Column" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Fields</SelectItem>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="campus">Campus</SelectItem>
            <SelectItem value="course">Course</SelectItem>
            <SelectItem value="status">Status</SelectItem>
            <SelectItem value="company">Company</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortOption} onValueChange={(val) => { setSortOption(val); setCurrentPage(1); }}>
          <SelectTrigger className="h-8 w-full sm:w-[140px] text-xs  bg-muted bg-muted/60 hover:bg-muted/80 rounded-lg">
            <SelectValue placeholder="Sort By" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name_asc">Name (A-Z)</SelectItem>
            <SelectItem value="name_desc">Name (Z-A)</SelectItem>
            <SelectItem value="campus_asc">Campus (A-Z)</SelectItem>
            <SelectItem value="status_asc">Status (A-Z)</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative flex-1 w-full flex items-center sm:ml-auto">
          <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5" />
          <Input
            placeholder="Type to search queue..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="h-8 pl-8  bg-muted bg-muted/60 hover:bg-muted/80 text-xs w-full focus-visible:ring-1 focus-visible:ring-primary/50 transition-all rounded-lg"
          />
        </div>
      </div>

      {/* Main Table Card */}
      <Card className="border border-border/80 rounded-2xl overflow-hidden shadow-sm bg-card/60 backdrop-blur-xs p-3">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse min-w-[60rem]">
            <thead className="bg-muted/50 border-b border-border/60">
              <tr>
                <th className="px-3 py-2.5 font-bold uppercase tracking-wider text-[9px] text-muted-foreground">Alumni Profile</th>
                <th className="px-3 py-2.5 font-bold uppercase tracking-wider text-[9px] text-muted-foreground">Campus & Course</th>
                <th className="px-3 py-2.5 font-bold uppercase tracking-wider text-[9px] text-muted-foreground">Status & Company</th>
                <th className="px-3 py-2.5 font-bold uppercase tracking-wider text-[9px] text-muted-foreground">Profile Score</th>
                <th className="px-3 py-2.5 font-bold uppercase tracking-wider text-[9px] text-muted-foreground">Contact</th>
                <th className="px-3 py-2.5 font-bold uppercase tracking-wider text-[9px] text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedAlumni.map((item) => {
                const profileData = item.alumni_profile?.[0] || item.alumni_profile;
                const hasSalaries = Boolean(item.alumni_salary_records && item.alumni_salary_records.length > 0);

                const scoreResult = calculateProfileScore(
                  {
                    name: item.name,
                    email: item.email,
                    phone_number: item.phone_number || profileData?.phone_number,
                    gender: item.gender || profileData?.gender,
                    campus: item.campus,
                    course: item.course,
                    entry_year: item.entry_year,
                    city: item.city,
                    state: item.state,
                    company: item.company || profileData?.current_company,
                    current_company: profileData?.current_company,
                    starting_salary: item.starting_salary,
                    has_salary_records: hasSalaries,
                    linkedin_url: item.linkedin_url || profileData?.linkedin_profile,
                    linkedin_profile: profileData?.linkedin_profile,
                    technology_stack: item.technology_stack,
                  },
                  settings
                );

                return (
                  <tr key={item.email} className="border-t border-border/40 hover:bg-muted/15 transition-colors">
                    <td className="px-3 py-2.5 space-y-1">
                      <Link
                        href={`/alumni-growth/alumni/${getAlumniSlug(item.email, item.name)}`}
                        className="font-bold text-sm text-foreground hover:text-primary transition-colors flex items-center gap-1.5"
                      >
                        {item.name || "—"}
                      </Link>
                      <div className="font-mono text-[10px] text-muted-foreground">{item.email}</div>
                    </td>
                    <td className="px-3 py-2.5 space-y-1">
                      <div className="flex items-center gap-1 text-foreground font-semibold">
                        <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{item.campus || "—"}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground">{item.course || "—"}</div>
                    </td>
                    <td className="px-3 py-2.5 space-y-1">
                      <Badge variant="outline" className="text-[10px] rounded-md font-medium">
                        {item.status || "Active"}
                      </Badge>
                      <div className="text-[10px] text-muted-foreground">{item.company || "—"}</div>
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${scoreResult.badgeColor}`}>
                        {scoreResult.score}% Score
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[11px] text-muted-foreground">
                      {item.phone_number || "—"}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => setSelectedAlumniForCall({ email: item.email, name: item.name })}
                          className="h-7 rounded-md text-xs font-semibold gap-1 px-2.5"
                        >
                          <PhoneCall className="w-3 h-3" /> Log Call
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                          className="h-7 rounded-md text-xs font-semibold px-2"
                        >
                          <Link href={`/alumni-growth/alumni/${getAlumniSlug(item.email, item.name)}`}>
                            Details
                          </Link>
                        </Button>
                      </div>
                    </td>
                  </tr>

                );
              })}

              {paginatedAlumni.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground">
                    No alumni records found matching your filters.
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

      {/* Log Call Modal */}
      {selectedAlumniForCall && (
        <LogInteractionModal
          isOpen={Boolean(selectedAlumniForCall)}
          onClose={() => setSelectedAlumniForCall(null)}
          alumniEmail={selectedAlumniForCall.email}
          alumniName={selectedAlumniForCall.name}
          outcomes={outcomes}
          userEmail={userEmail}
        />
      )}

      {/* Shared Details Drawer */}
      <AlumniDetailsModule
        selectedAlumni={selectedAlumniForDrawer}
        onClose={() => setSelectedAlumniForDrawer(null)}
      />
    </div>
  );
}
