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
  ChevronLeft,
  ChevronRight,
  Building2,
  UserCheck,
  UserX,
  Sparkles,
  Filter,
  UserPlus,
  FileSpreadsheet,
  GraduationCap,
  RefreshCw,
  Flame,
  ShieldCheck,
} from "lucide-react";
import { Card, CardFooter } from "@/components/ui/card";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageBanner } from "@/components/shared/page-banner";
import LogInteractionModal from "@/components/engagement/LogInteractionModal";
import AlumniDetailsModule from "@/components/shared/alumni-details-module";
import { HelpModal } from "@/components/shared/HelpModal";
import { InteractionOutcome, OrgSettings, PipelineOwnership } from "@/types/engagement";
import { assignToMeAction, getTeamAlumniAction } from "@/lib/engagement/actions";
import { calculateProfileScore } from "@/lib/engagement/utils";
import { toast } from "sonner";

interface WorkspaceClientProps {
  canViewTeamTab: boolean;
  initialMyQueueAlumni: any[];
  initialUnassignedAlumni: any[];
  initialTeamData: {
    alumniList: any[];
    totalEntries: number;
    totalPages: number;
  };
  outcomes: InteractionOutcome[];
  settings: OrgSettings;
  userEmail: string;
  myWorkspaceKPIs: {
    myActiveLeads: number;
    uncontactedLeads: number;
    overdueFollowups: number;
    dueToday: number;
    teamOverdueFollowups: number;
    callsLoggedToday: number;
    followupsAddedToday: number;
    interactedToday: number;
  };
  unassignedCounts: {
    unassignedPayForward: number;
    unassignedCareerSupport: number;
  };
  lastSyncedAt: string | null;
}

function PipelineOwnerTag({
  label,
  data,
  userEmail,
}: {
  label: string;
  data?: { state: string; owner: string | null };
  userEmail: string;
}) {
  if (!data || data.state === "n/a") {
    return (
      <Badge
        variant="outline"
        className="text-[9px] px-1.5 py-0 bg-slate-50 dark:bg-slate-900/40 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-800 font-medium"
      >
        {label}: N/A
      </Badge>
    );
  }

  if (data.state === "unassigned") {
    return (
      <Badge
        variant="outline"
        className="text-[9px] px-1.5 py-0 bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-400/40 font-semibold"
      >
        {label}: Unassigned
      </Badge>
    );
  }

  const isYou = data.owner === userEmail;
  const displayName = isYou ? "You" : data.owner?.split("@")[0] || data.owner;

  return (
    <Badge
      variant="outline"
      className={`text-[9px] px-1.5 py-0 font-semibold ${
        isYou
          ? "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-400/40 font-bold"
          : "bg-muted/50 text-foreground border-border/60"
      }`}
    >
      {label}: {displayName}
    </Badge>
  );
}

function OwnershipTags({
  ownership,
  userEmail,
}: {
  ownership?: PipelineOwnership;
  userEmail: string;
}) {
  if (!ownership) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <PipelineOwnerTag label="Pay-Forward" data={ownership.payForward} userEmail={userEmail} />
      <PipelineOwnerTag label="Career Support" data={ownership.careerSupport} userEmail={userEmail} />
      {ownership.careerSupport?.mismatch && (
        <Badge
          variant="destructive"
          className="text-[9px] px-1.5 py-0 bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30 font-semibold flex items-center gap-1"
        >
          <AlertTriangle className="w-2.5 h-2.5" /> Ownership mismatch
        </Badge>
      )}
    </div>
  );
}

export default function WorkspaceClient({
  canViewTeamTab,
  initialMyQueueAlumni,
  initialUnassignedAlumni,
  initialTeamData,
  outcomes,
  settings,
  userEmail,
  myWorkspaceKPIs,
  unassignedCounts,
  lastSyncedAt,
}: WorkspaceClientProps) {
  const [activeTab, setActiveTab] = useState<"queue" | "unassigned" | "team">("queue");
  const [unassignedPipelineFilter, setUnassignedPipelineFilter] = useState<
    "all" | "pay_forward" | "career_support"
  >("all");

  // Roster states
  const [myQueueList, setMyQueueList] = useState<any[]>(initialMyQueueAlumni);
  const [unassignedList, setUnassignedList] = useState<any[]>(initialUnassignedAlumni);
  const [teamList, setTeamList] = useState<any[]>(initialTeamData.alumniList);

  // Team pagination
  const [teamCurrentPage, setTeamCurrentPage] = useState(1);
  const [teamTotalEntries, setTeamTotalEntries] = useState(initialTeamData.totalEntries);
  const [teamTotalPages, setTeamTotalPages] = useState(initialTeamData.totalPages);
  const [isTeamLoading, setIsTeamLoading] = useState(false);

  // Client-side pagination for My Queue & Unassigned
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterColumn, setFilterColumn] = useState("all");
  const [sortOption, setSortOption] = useState("name_asc");

  // Modals & Drawers
  const [selectedAlumniForCall, setSelectedAlumniForCall] = useState<{ email: string; name: string } | null>(null);
  const [selectedAlumniForDrawer, setSelectedAlumniForDrawer] = useState<any | null>(null);
  const [assigningEmail, setAssigningEmail] = useState<string | null>(null);

  // Format last synced timestamp
  const formattedLastSynced = lastSyncedAt
    ? new Date(lastSyncedAt).toLocaleString("en-IN", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Recently";

  // Handle Team View Server-side Page Changes
  const fetchTeamPage = async (page: number) => {
    setIsTeamLoading(true);
    const res = await getTeamAlumniAction({ page, pageSize });
    setIsTeamLoading(false);
    if (res.success && "alumniList" in res && res.alumniList) {
      setTeamList(res.alumniList);
      setTeamTotalEntries(res.totalEntries || 0);
      setTeamTotalPages(res.totalPages || Math.ceil((res.totalEntries || 0) / pageSize) || 1);
      setTeamCurrentPage(page);
    } else if (!res.success) {
      toast.error(res.error || "Failed to load team view page");
    }
  };

  const handleAssignToMe = async (alumniEmail: string) => {
    setAssigningEmail(alumniEmail);
    const res = await assignToMeAction({
      alumni_email: alumniEmail,
      pipeline_code: "career_support",
      assigned_by: userEmail,
    });
    setAssigningEmail(null);

    if (res.success) {
      toast.success("Lead claimed successfully!");
      // Move item from Unassigned to My Queue locally
      const claimedItem = unassignedList.find((a) => a.email === alumniEmail);
      if (claimedItem) {
        setUnassignedList((prev) => prev.filter((a) => a.email !== alumniEmail));
        setMyQueueList((prev) => [
          {
            ...claimedItem,
            poc_email: userEmail,
            pocAssignedAt: new Date().toISOString(),
            pipelineOwnership: {
              ...claimedItem.pipelineOwnership,
              careerSupport: { state: "owned", owner: userEmail, mismatch: false },
            },
          },
          ...prev,
        ]);
      }
    } else {
      toast.error(res.error || "Failed to claim lead");
    }
  };

  // Filter Unassigned List by Segmented Control
  const filteredUnassignedList = unassignedList.filter((item) => {
    if (unassignedPipelineFilter === "pay_forward") {
      return item.pipelineOwnership?.payForward?.state === "unassigned";
    }
    if (unassignedPipelineFilter === "career_support") {
      return item.pipelineOwnership?.careerSupport?.state === "unassigned";
    }
    return true;
  });

  // Determine active raw list based on activeTab
  const currentRawList =
    activeTab === "queue" ? myQueueList : activeTab === "unassigned" ? filteredUnassignedList : teamList;

  // Filter logic
  const filteredAlumni = currentRawList.filter((item) => {
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
    if (sortOption === "status_asc") return (a.status || "").localeCompare(b.status || "");
    return 0;
  });

  // Pagination for client tabs (queue / unassigned)
  const isServerPaginated = activeTab === "team";
  const totalEntries = isServerPaginated ? teamTotalEntries : sortedAlumni.length;
  const totalPages = isServerPaginated ? teamTotalPages : Math.ceil(totalEntries / pageSize) || 1;
  const activeCurrentPage = isServerPaginated ? teamCurrentPage : currentPage;
  const startIndex = isServerPaginated ? (teamCurrentPage - 1) * pageSize : (currentPage - 1) * pageSize;
  const endIndex = isServerPaginated
    ? Math.min(startIndex + teamList.length, totalEntries)
    : Math.min(startIndex + pageSize, totalEntries);
  const displayAlumni = isServerPaginated ? sortedAlumni : sortedAlumni.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      if (isServerPaginated) {
        fetchTeamPage(page);
      } else {
        setCurrentPage(page);
      }
    }
  };

  const handlePageSizeChange = (val: string) => {
    const newSize = parseInt(val, 10);
    setPageSize(newSize);
    if (isServerPaginated) {
      getTeamAlumniAction({ page: 1, pageSize: newSize }).then((res) => {
        if (res.success && "alumniList" in res && res.alumniList) {
          setTeamList(res.alumniList);
          setTeamTotalEntries(res.totalEntries || 0);
          setTeamTotalPages(res.totalPages || 1);
          setTeamCurrentPage(1);
        }
      });
    } else {
      setCurrentPage(1);
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
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="px-3 py-1.5 text-xs rounded-full bg-white/80 dark:bg-zinc-900/80 border-slate-200 dark:border-zinc-800 text-muted-foreground shadow-2xs"
            >
              <RefreshCw className="w-3 h-3 mr-1.5 text-indigo-500" /> Last synced: {formattedLastSynced}
            </Badge>
            <Badge
              variant="outline"
              className="px-3 py-1.5 text-xs rounded-full bg-white/80 dark:bg-zinc-900/80 border-indigo-200 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 font-semibold shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Cool-down: {settings.followup_cooldown_days} days
            </Badge>
            <HelpModal helpId="workspace" />
          </div>
        }
      />

      {/* Tabs Navigation */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => {
          setActiveTab(val as any);
          setCurrentPage(1);
        }}
        className="w-full"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2">
          <TabsList className="h-10 rounded-xl bg-muted/60 p-1">
            <TabsTrigger value="queue" className="rounded-lg text-xs font-semibold gap-1.5 px-3">
              <UserCheck className="w-3.5 h-3.5" /> My Queue ({myQueueList.length})
            </TabsTrigger>
            <TabsTrigger value="unassigned" className="rounded-lg text-xs font-semibold gap-1.5 px-3">
              <UserX className="w-3.5 h-3.5" /> Unassigned (
              {unassignedCounts.unassignedPayForward + unassignedCounts.unassignedCareerSupport})
            </TabsTrigger>
            {canViewTeamTab && (
              <TabsTrigger value="team" className="rounded-lg text-xs font-semibold gap-1.5 px-3">
                <ShieldCheck className="w-3.5 h-3.5" /> Team View (All Org)
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        {/* Tab 1: My Queue KPI Cards */}
        {activeTab === "queue" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 my-4">
            {/* Overdue Follow-ups */}
            <div className="bg-card/60 backdrop-blur-md border border-red-200 dark:border-red-900/40 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 group">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase text-red-600 dark:text-red-400 tracking-wider">
                    Overdue Callbacks
                  </p>
                  <p className="text-3xl font-bold text-red-700 dark:text-red-400">
                    {myWorkspaceKPIs.overdueFollowups}
                  </p>
                </div>
                <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 text-xs text-red-500 font-medium">Needs immediate action</div>
            </div>

            {/* Due Today */}
            <div className="bg-card/60 backdrop-blur-md border border-amber-200 dark:border-amber-900/40 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 group">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase text-amber-600 dark:text-amber-400 tracking-wider">
                    Due Today
                  </p>
                  <p className="text-3xl font-bold text-amber-700 dark:text-amber-400">
                    {myWorkspaceKPIs.dueToday}
                  </p>
                </div>
                <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-600">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 text-xs text-amber-500 font-medium">Scheduled for today</div>
            </div>

            {/* Uncontacted Leads */}
            <div className="bg-card/60 backdrop-blur-md border border-orange-200 dark:border-orange-900/40 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 group">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase text-orange-600 dark:text-orange-400 tracking-wider">
                    Uncontacted Leads
                  </p>
                  <p className="text-3xl font-bold text-orange-700 dark:text-orange-400">
                    {myWorkspaceKPIs.uncontactedLeads}
                  </p>
                </div>
                <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-orange-600">
                  <UserX className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 text-xs text-orange-500 font-medium">No contact in &gt;30 days</div>
            </div>

            {/* My Active Leads */}
            <div className="bg-card/60 backdrop-blur-md border border-indigo-200 dark:border-indigo-900/40 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 group">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">
                    My Active Leads
                  </p>
                  <p className="text-3xl font-bold text-indigo-700 dark:text-indigo-400">
                    {myWorkspaceKPIs.myActiveLeads}
                  </p>
                </div>
                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600">
                  <UserCheck className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 text-xs text-indigo-500 font-medium">Total leads assigned to me</div>
            </div>
          </div>
        )}

        {/* Tab 2: Unassigned KPI Cards & Segmented Control */}
        {activeTab === "unassigned" && (
          <div className="space-y-4 my-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="bg-card/60 backdrop-blur-md border border-blue-200 dark:border-blue-900/40 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase text-blue-600 dark:text-blue-400 tracking-wider">
                      Unassigned Pay-Forward
                    </p>
                    <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">
                      {unassignedCounts.unassignedPayForward}
                    </p>
                  </div>
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4 text-xs text-muted-foreground">Pay-Forward pipeline leads with no POC assigned</div>
              </div>

              <div className="bg-card/60 backdrop-blur-md border border-purple-200 dark:border-purple-900/40 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase text-purple-600 dark:text-purple-400 tracking-wider">
                      Unassigned Career Support
                    </p>
                    <p className="text-3xl font-bold text-purple-700 dark:text-purple-400">
                      {unassignedCounts.unassignedCareerSupport}
                    </p>
                  </div>
                  <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-purple-600">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4 text-xs text-muted-foreground">
                  Mentoring / Placement leads with no POC assigned
                </div>
              </div>
            </div>

            {/* Segmented Control Filter for Unassigned */}
            <div className="flex items-center gap-2 p-1 bg-muted/40 rounded-xl w-fit border border-border/50">
              <span className="text-xs font-semibold text-muted-foreground px-2">Pipeline Filter:</span>
              <Button
                size="sm"
                variant={unassignedPipelineFilter === "all" ? "default" : "ghost"}
                onClick={() => {
                  setUnassignedPipelineFilter("all");
                  setCurrentPage(1);
                }}
                className="h-7 text-xs rounded-lg font-semibold px-3"
              >
                All Unassigned
              </Button>
              <Button
                size="sm"
                variant={unassignedPipelineFilter === "pay_forward" ? "default" : "ghost"}
                onClick={() => {
                  setUnassignedPipelineFilter("pay_forward");
                  setCurrentPage(1);
                }}
                className="h-7 text-xs rounded-lg font-semibold px-3"
              >
                Pay-Forward
              </Button>
              <Button
                size="sm"
                variant={unassignedPipelineFilter === "career_support" ? "default" : "ghost"}
                onClick={() => {
                  setUnassignedPipelineFilter("career_support");
                  setCurrentPage(1);
                }}
                className="h-7 text-xs rounded-lg font-semibold px-3"
              >
                Career Support
              </Button>
            </div>
          </div>
        )}

        {/* Tab 3: Team View KPI Cards */}
        {activeTab === "team" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 my-4">
            <div className="bg-card/60 backdrop-blur-md border border-red-200 dark:border-red-900/40 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase text-red-600 dark:text-red-400 tracking-wider">
                    Team Overdue Callbacks
                  </p>
                  <p className="text-3xl font-bold text-red-700 dark:text-red-400">
                    {myWorkspaceKPIs.teamOverdueFollowups}
                  </p>
                </div>
                <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 text-xs text-red-500 font-medium">System-wide overdue follow-ups</div>
            </div>

            <div className="bg-card/60 backdrop-blur-md border border-emerald-200 dark:border-emerald-900/40 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">
                    Calls Logged Today
                  </p>
                  <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">
                    {myWorkspaceKPIs.callsLoggedToday}
                  </p>
                </div>
                <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600">
                  <PhoneCall className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 text-xs text-muted-foreground">System-wide calls today</div>
            </div>

            <div className="bg-card/60 backdrop-blur-md border border-blue-200 dark:border-blue-900/40 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase text-blue-600 dark:text-blue-400 tracking-wider">
                    Follow-ups Added Today
                  </p>
                  <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">
                    {myWorkspaceKPIs.followupsAddedToday}
                  </p>
                </div>
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600">
                  <CalendarClock className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 text-xs text-muted-foreground">System-wide follow-ups today</div>
            </div>

            <div className="bg-card/60 backdrop-blur-md border border-fuchsia-200 dark:border-fuchsia-900/40 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase text-fuchsia-600 dark:text-fuchsia-400 tracking-wider">
                    Interacted Today
                  </p>
                  <p className="text-3xl font-bold text-fuchsia-700 dark:text-fuchsia-400">
                    {myWorkspaceKPIs.interactedToday}
                  </p>
                </div>
                <div className="p-2 bg-fuchsia-50 dark:bg-fuchsia-900/20 rounded-lg text-fuchsia-600">
                  <Briefcase className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 text-xs text-muted-foreground">Unique alumni system-wide</div>
            </div>
          </div>
        )}

        {/* Shared Filters Bar */}
        <div className="bg-card border border-border/80 rounded-2xl p-1.5 px-3 shadow-2xs flex flex-col sm:flex-row gap-2 items-center w-full my-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground pr-2 sm:border-r sm:border-border/60 shrink-0 hidden sm:flex">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters</span>
          </div>

          <Select
            value={filterColumn}
            onValueChange={(val) => {
              setFilterColumn(val);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-full sm:w-[160px] text-xs bg-muted/60 hover:bg-muted/80 rounded-lg">
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

          <Select
            value={sortOption}
            onValueChange={(val) => {
              setSortOption(val);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-full sm:w-[140px] text-xs bg-muted/60 hover:bg-muted/80 rounded-lg">
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
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="h-8 pl-8 bg-muted/60 hover:bg-muted/80 text-xs w-full focus-visible:ring-1 focus-visible:ring-primary/50 transition-all rounded-lg"
            />
          </div>
        </div>

        {/* Roster Table Card */}
        <Card className="border border-border/80 rounded-2xl overflow-hidden shadow-sm bg-card/60 backdrop-blur-xs p-3">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse min-w-[65rem]">
              <thead className="bg-muted/50 border-b border-border/60">
                <tr>
                  <th className="px-3 py-2.5 font-bold uppercase tracking-wider text-[9px] text-muted-foreground">
                    Alumni Profile & Pipeline Ownership
                  </th>
                  <th className="px-3 py-2.5 font-bold uppercase tracking-wider text-[9px] text-muted-foreground">
                    Campus & Course
                  </th>
                  {activeTab === "team" ? (
                    <>
                      <th className="px-3 py-2.5 font-bold uppercase tracking-wider text-[9px] text-muted-foreground">
                        Pay-Forward Owner
                      </th>
                      <th className="px-3 py-2.5 font-bold uppercase tracking-wider text-[9px] text-muted-foreground">
                        Career Support Owner
                      </th>
                    </>
                  ) : (
                    <th className="px-3 py-2.5 font-bold uppercase tracking-wider text-[9px] text-muted-foreground">
                      Status & Company
                    </th>
                  )}
                  <th className="px-3 py-2.5 font-bold uppercase tracking-wider text-[9px] text-muted-foreground">
                    Profile Score
                  </th>
                  <th className="px-3 py-2.5 font-bold uppercase tracking-wider text-[9px] text-muted-foreground">
                    Contact & Status
                  </th>
                  <th className="px-3 py-2.5 font-bold uppercase tracking-wider text-[9px] text-muted-foreground text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {displayAlumni.map((item) => {
                  const profileData = item.profile || item.alumni_profile?.[0] || item.alumni_profile;
                  const hasSalaries = Boolean(
                    item.hasSalaryRecords || (item.alumni_salary_records && item.alumni_salary_records.length > 0)
                  );

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

                  // Cooldown check
                  const isCooldown = item.cooldownUntil && new Date(item.cooldownUntil) > new Date();
                  const cooldownFormatted = isCooldown
                    ? new Date(item.cooldownUntil).toLocaleDateString("en-IN", { month: "short", day: "numeric" })
                    : null;

                  // New Lead check (assigned within 3 days / 72 hours)
                  const isNewLead =
                    item.pocAssignedAt && Date.now() - new Date(item.pocAssignedAt).getTime() < 3 * 86400000;

                  return (
                    <tr key={item.email} className="border-t border-border/40 hover:bg-muted/15 transition-colors">
                      <td className="px-3 py-2.5 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/alumni-growth/alumni/${getAlumniSlug(item.email, item.name)}`}
                            className="font-bold text-sm text-foreground hover:text-primary transition-colors flex items-center gap-1.5"
                          >
                            {item.name || "—"}
                          </Link>
                          {isNewLead && (
                            <Badge className="text-[9px] px-1.5 py-0 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 font-semibold leading-tight">
                              <Flame className="w-3 h-3 mr-0.5" /> New
                            </Badge>
                          )}
                        </div>
                        <div className="font-mono text-[10px] text-muted-foreground">{item.email}</div>

                        {/* Pipeline Ownership Tags (My Queue & Unassigned Tabs) */}
                        {activeTab !== "team" && (
                          <OwnershipTags ownership={item.pipelineOwnership} userEmail={userEmail} />
                        )}
                      </td>

                      <td className="px-3 py-2.5 space-y-1">
                        <div className="flex items-center gap-1 text-foreground font-semibold">
                          <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>{item.campus || "—"}</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground">{item.course || "—"}</div>
                      </td>

                      {activeTab === "team" ? (
                        <>
                          <td className="px-3 py-2.5">
                            <PipelineOwnerTag
                              label="PF"
                              data={item.pipelineOwnership?.payForward}
                              userEmail={userEmail}
                            />
                          </td>
                          <td className="px-3 py-2.5 space-y-1">
                            <PipelineOwnerTag
                              label="CS"
                              data={item.pipelineOwnership?.careerSupport}
                              userEmail={userEmail}
                            />
                            {item.pipelineOwnership?.careerSupport?.mismatch && (
                              <Badge
                                variant="destructive"
                                className="text-[8px] px-1 py-0 bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30 font-semibold flex items-center gap-0.5 w-fit"
                              >
                                <AlertTriangle className="w-2.5 h-2.5" /> Mismatch
                              </Badge>
                            )}
                          </td>
                        </>
                      ) : (
                        <td className="px-3 py-2.5 space-y-1">
                          <Badge variant="outline" className="text-[10px] rounded-md font-medium">
                            {item.status || "Active"}
                          </Badge>
                          <div className="text-[10px] text-muted-foreground">{item.company || "—"}</div>
                        </td>
                      )}

                      <td className="px-3 py-2.5">
                        <Badge className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${scoreResult.badgeColor}`}>
                          {scoreResult.score}% Score
                        </Badge>
                      </td>

                      <td className="px-3 py-2.5 space-y-1">
                        {item.contactSuppressionReason === "invalid_number" ? (
                          <Badge
                            variant="destructive"
                            className="text-[9px] px-1.5 py-0 bg-red-100 text-red-700 hover:bg-red-200 shadow-none border-red-200"
                          >
                            Incorrect Number
                          </Badge>
                        ) : item.contactSuppressionReason === "do_not_contact" ? (
                          <Badge
                            variant="destructive"
                            className="text-[9px] px-1.5 py-0 bg-red-100 text-red-700 hover:bg-red-200 shadow-none border-red-200"
                          >
                            Do Not Call
                          </Badge>
                        ) : (
                          <div className="font-mono text-[11px] text-muted-foreground">{item.phone_number || "—"}</div>
                        )}

                        {isCooldown && (
                          <Badge
                            variant="outline"
                            className="text-[9px] px-1.5 py-0 bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-400/30 flex items-center gap-1 w-fit"
                          >
                            <Clock className="w-2.5 h-2.5" /> Cooldown until {cooldownFormatted}
                          </Badge>
                        )}
                      </td>

                      <td className="px-3 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {activeTab === "unassigned" && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={assigningEmail === item.email}
                              onClick={() => handleAssignToMe(item.email)}
                              className="h-7 rounded-md text-xs font-semibold gap-1 px-2.5 text-indigo-600 border-indigo-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/20"
                            >
                              <UserPlus className="w-3 h-3" />
                              {assigningEmail === item.email ? "Assigning..." : "Assign to me"}
                            </Button>
                          )}

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

                {displayAlumni.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                      No alumni records found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
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
                Showing{" "}
                <span className="font-semibold text-foreground">{totalEntries > 0 ? startIndex + 1 : 0}</span> -{" "}
                <span className="font-semibold text-foreground">{endIndex}</span> of{" "}
                <span className="font-semibold text-foreground">{totalEntries}</span> entries
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(activeCurrentPage - 1)}
                disabled={activeCurrentPage === 1 || isTeamLoading}
                className="h-7 rounded-md gap-1 text-[11px] font-semibold px-2"
              >
                <ChevronLeft className="w-3 h-3" /> Prev
              </Button>

              <div className="flex gap-1 hidden sm:flex">
                {Array.from({ length: Math.min(totalPages, 7) }).map((_, idx) => (
                  <Button
                    key={idx}
                    variant={activeCurrentPage === idx + 1 ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(idx + 1)}
                    disabled={isTeamLoading}
                    className="h-7 w-7 rounded-md font-bold text-[11px] p-0"
                  >
                    {idx + 1}
                  </Button>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(activeCurrentPage + 1)}
                disabled={activeCurrentPage === totalPages || isTeamLoading}
                className="h-7 rounded-md gap-1 text-[11px] font-semibold px-2"
              >
                Next <ChevronRight className="w-3 h-3" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      </Tabs>

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
