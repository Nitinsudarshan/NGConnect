"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { getAlumniSlug } from "@/lib/utils";

import {
  CalendarClock,
  AlertTriangle,
  Clock,
  CalendarDays,
  PhoneCall,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  UserCheck,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageBanner } from "@/components/shared/page-banner";
import LogInteractionModal from "@/components/engagement/LogInteractionModal";
import { OwnershipTags } from "@/components/engagement/OwnershipTags";
import { InteractionOutcome } from "@/types/engagement";

/* ─── Helpers ─────────────────────────────────── */

function startOf(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export type FollowUpCategory = "overdue" | "today" | "this_week" | "later";

function classifyFollowup(item: any, now: Date): FollowUpCategory {
  const due = new Date(item.followup_at);
  const todayStart = startOf(now);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const weekEnd = new Date(todayStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  if (due < todayStart) return "overdue";
  if (due < todayEnd) return "today";
  if (due < weekEnd) return "this_week";
  return "later";
}

const CATEGORY_STYLES: Record<
  FollowUpCategory,
  {
    badge: string;
    border: string;
    icon: React.ReactNode;
    label: string;
  }
> = {
  overdue: {
    badge: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
    border: "border-l-4 border-l-red-500",
    icon: <AlertTriangle className="w-3.5 h-3.5 text-red-500" />,
    label: "Overdue",
  },
  today: {
    badge: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
    border: "border-l-4 border-l-amber-500",
    icon: <Clock className="w-3.5 h-3.5 text-amber-500" />,
    label: "Due Today",
  },
  this_week: {
    badge: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
    border: "border-l-4 border-l-blue-500",
    icon: <CalendarDays className="w-3.5 h-3.5 text-blue-500" />,
    label: "This Week",
  },
  later: {
    badge: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700",
    border: "border-l-4 border-l-slate-400 dark:border-l-slate-600",
    icon: <CalendarClock className="w-3.5 h-3.5 text-slate-400" />,
    label: "Later",
  },
};

/* ─── Calendar strip ───────────────────────────── */
function CalendarStrip({
  followups,
  now,
  selectedDay,
  onSelectDay,
}: {
  followups: any[];
  now: Date;
  selectedDay: string | null;
  onSelectDay: (dayKey: string | null) => void;
}) {
  const days = useMemo(() => {
    const arr = [];
    for (let i = -1; i <= 27; i++) {
      const d = new Date(startOf(now));
      d.setDate(d.getDate() + i);
      arr.push(d);
    }
    return arr;
  }, [now]);

  const countByDate = useMemo(() => {
    const map: Record<string, { overdue: number; today: number; this_week: number; later: number }> = {};
    followups.forEach((f) => {
      const due = new Date(f.followup_at);
      const key = startOf(due).toDateString();
      if (!map[key]) map[key] = { overdue: 0, today: 0, this_week: 0, later: 0 };
      const cat = classifyFollowup(f, now);
      map[key][cat]++;
    });
    return map;
  }, [followups, now]);

  const todayStr = startOf(now).toDateString();

  return (
    <div className="bg-card border border-border/60 rounded-xl p-3 shadow-2xs">
      <div className="flex items-center justify-between mb-2.5 px-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          29-day working calendar strip · click a day to inspect
        </p>
        {selectedDay && (
          <button
            onClick={() => onSelectDay(null)}
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            <XCircle className="w-3.5 h-3.5" /> Clear day filter
          </button>
        )}
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
        {days.map((d) => {
          const key = d.toDateString();
          const counts = countByDate[key];
          const isToday = key === todayStr;
          const isPast = d < startOf(now);
          const isSelected = selectedDay === key;

          const totalForDay = counts
            ? counts.overdue + counts.today + counts.this_week + counts.later
            : 0;

          return (
            <button
              key={key}
              onClick={() => onSelectDay(isSelected ? null : key)}
              className={`flex flex-col items-center min-w-[42px] rounded-lg px-1.5 py-1.5 transition-all border text-[10px] font-medium
                ${
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : isToday
                    ? "bg-amber-500/10 border-amber-400 text-amber-700 dark:text-amber-400 font-bold"
                    : isPast && totalForDay > 0
                    ? "bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-800 text-red-600"
                    : "border-transparent hover:border-border hover:bg-muted/50 text-muted-foreground"
                }`}
            >
              <span className="text-[9px] uppercase">{d.toLocaleDateString("en", { weekday: "short" })}</span>
              <span className={`text-sm font-bold ${isToday && !isSelected ? "text-amber-700 dark:text-amber-400" : ""}`}>
                {d.getDate()}
              </span>
              {totalForDay > 0 ? (
                <div className="flex gap-0.5 mt-0.5 justify-center items-center">
                  {counts.overdue > 0 && <div className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                  {counts.today > 0 && <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                  {counts.this_week > 0 && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                  {counts.later > 0 && <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />}
                </div>
              ) : (
                <div className="h-2 mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Conversation Detail Modal ──────────────────── */

function ConversationDetailModal({
  item,
  open,
  onClose,
}: {
  item: any;
  open: boolean;
  onClose: () => void;
}) {
  if (!item) return null;
  const loggedAt = item.created_at
    ? new Date(item.created_at).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";
  const gaps: string[] = Array.isArray(item.skipped_missing_fields)
    ? item.skipped_missing_fields
    : [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg rounded-2xl border border-border/80 shadow-2xl p-0 overflow-hidden">
        <DialogHeader className="p-5 pb-4 border-b border-border/40 bg-muted/20">
          <DialogTitle className="text-base font-bold flex items-center gap-2 text-foreground">
            <MessageSquare className="w-4 h-4 text-primary" />
            Last Conversation Details
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {item.alumni_master?.name || item.alumni_email} · Logged {loggedAt} by{" "}
            {item.logged_by || "staff"}
          </DialogDescription>
        </DialogHeader>

        <div className="p-5 space-y-4 text-sm">
          {/* Outcome */}
          {item.interaction_outcomes?.label && (
            <div className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Outcome</p>
              <Badge variant="outline" className="text-xs rounded-md">
                {item.interaction_outcomes.label}
              </Badge>
            </div>
          )}

          {/* Channel */}
          {item.interaction_channel && (
            <div className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Channel</p>
              <p className="text-sm text-foreground capitalize">{item.interaction_channel}</p>
            </div>
          )}

          {/* Data Gaps */}
          {gaps.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Data Gaps Skipped
              </p>
              <p className="text-sm text-foreground">
                <span className="font-medium">{gaps.join(", ")}</span>
                {item.skip_reason ? (
                  <span className="text-muted-foreground"> — {item.skip_reason}</span>
                ) : null}
              </p>
            </div>
          )}

          {/* Notes */}
          {item.notes && (
            <div className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Notes</p>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{item.notes}</p>
            </div>
          )}

          {/* Assigned */}
          {(item.followup_assigned_to || item.logged_by) && (
            <div className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Assigned To</p>
              <p className="text-sm text-foreground">{item.followup_assigned_to || item.logged_by}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Followup Card ──────────────────────────────── */
function FollowUpCard({
  item,
  category,
  userEmail,
  onLogCall,
  onViewDetails,
}: {
  item: any;
  category: FollowUpCategory;
  userEmail: string;
  onLogCall: (alumni: { email: string; name: string }) => void;
  onViewDetails: (item: any) => void;
}) {
  const style = CATEGORY_STYLES[category];
  const dueDate = new Date(item.followup_at);
  const alumniName = item.alumni_master?.name || item.alumni_email;
  const campus = item.alumni_master?.campus || "Unknown Campus";

  return (
    <div
      className={`rounded-xl border border-border/80 bg-card p-3 space-y-2.5 shadow-2xs hover:shadow-md hover:border-primary/40 transition-all ${style.border}`}
    >
      {/* Header: Name & Scheduled Date */}
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/alumni-growth/alumni/${getAlumniSlug(item.alumni_email, item.alumni_master?.name)}`}
          className="font-bold text-xs text-foreground hover:text-primary transition-colors truncate block"
        >
          {alumniName}
        </Link>
        <div className={`flex items-center gap-1 text-[10px] font-semibold shrink-0 px-1.5 py-0.5 rounded-md border ${style.badge}`}>
          {style.icon}
          {dueDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}{" "}
          {dueDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>

      {/* Campus & Email */}
      <div className="text-[11px] text-muted-foreground truncate">
        {campus} • <span className="font-mono text-[10px]">{item.alumni_email}</span>
      </div>

      {/* Ownership Tags */}
      <OwnershipTags ownership={item.pipelineOwnership} userEmail={userEmail} />

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-border/40">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onViewDetails(item)}
          className="h-7 text-[11px] gap-1 px-2 rounded-lg border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 w-full font-medium"
        >
          <MessageSquare className="w-3 h-3 shrink-0 text-muted-foreground" />
          View Details
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onLogCall({ email: item.alumni_email, name: alumniName })}
          className="h-7 text-[11px] gap-1 px-2 rounded-lg border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/60 w-full font-semibold"
        >
          <PhoneCall className="w-3 h-3 shrink-0 text-primary" />
          Log Call
        </Button>
      </div>
    </div>
  );
}

/* ─── Kanban Column ─────────────────────────────── */
function KanbanColumn({
  title,
  category,
  items,
  userEmail,
  onLogCall,
  onViewDetails,
}: {
  title: string;
  category: FollowUpCategory;
  items: any[];
  userEmail: string;
  onLogCall: (alumni: { email: string; name: string }) => void;
  onViewDetails: (item: any) => void;
}) {
  const style = CATEGORY_STYLES[category];
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex flex-col gap-2 min-w-0">
      {/* Column header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-between px-3 py-2 rounded-xl border bg-muted/40 border-border/60 hover:bg-muted/70 transition-colors"
      >
        <div className="flex items-center gap-2">
          {style.icon}
          <span className="text-xs font-bold text-foreground">{title}</span>
          <Badge className={`text-[10px] px-1.5 py-0 h-4 border font-bold ${style.badge}`}>
            {items.length}
          </Badge>
        </div>
        {collapsed ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />}
      </button>

      {/* Cards */}
      {!collapsed && (
        <div className="flex flex-col gap-2">
          {items.length === 0 && (
            <div className="text-center text-xs text-muted-foreground py-8 border border-dashed border-border/50 rounded-xl bg-card/30">
              No follow-ups in this bucket
            </div>
          )}
          {items.map((item) => (
            <FollowUpCard
              key={item.id}
              item={item}
              category={category}
              userEmail={userEmail}
              onLogCall={onLogCall}
              onViewDetails={onViewDetails}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Main Client ────────────────────────────────── */

interface FollowUpsClientProps {
  canViewTeamTab: boolean;
  initialMyFollowups: any[];
  initialTeamFollowups: any[];
  outcomes: InteractionOutcome[];
  userEmail: string;
}

export default function FollowUpsClient({
  canViewTeamTab,
  initialMyFollowups,
  initialTeamFollowups,
  outcomes,
  userEmail,
}: FollowUpsClientProps) {
  const [activeTab, setActiveTab] = useState<"my" | "team">("my");
  const [myFollowupsList, setMyFollowupsList] = useState<any[]>(initialMyFollowups);
  const [teamFollowupsList, setTeamFollowupsList] = useState<any[]>(initialTeamFollowups);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const [logModalTarget, setLogModalTarget] = useState<{ email: string; name: string } | null>(null);
  const [detailItem, setDetailItem] = useState<any | null>(null);

  const now = new Date();

  // Active raw list based on tab
  const activeRawList = activeTab === "my" ? myFollowupsList : teamFollowupsList;

  // Filtered by Search Term
  const filteredList = useMemo(() => {
    if (!searchTerm) return activeRawList;
    const term = searchTerm.toLowerCase();
    return activeRawList.filter(
      (f) =>
        f.alumni_email?.toLowerCase().includes(term) ||
        f.alumni_master?.name?.toLowerCase().includes(term) ||
        f.notes?.toLowerCase().includes(term) ||
        f.alumni_master?.campus?.toLowerCase().includes(term)
    );
  }, [activeRawList, searchTerm]);

  // Unified 4-Bucket Classification
  const overdue = useMemo(() => filteredList.filter((f) => classifyFollowup(f, now) === "overdue"), [filteredList, now]);
  const today = useMemo(() => filteredList.filter((f) => classifyFollowup(f, now) === "today"), [filteredList, now]);
  const thisWeek = useMemo(() => filteredList.filter((f) => classifyFollowup(f, now) === "this_week"), [filteredList, now]);
  const later = useMemo(() => filteredList.filter((f) => classifyFollowup(f, now) === "later"), [filteredList, now]);

  // Selected Day Filtered Items
  const dayFilteredList = useMemo(() => {
    if (!selectedDay) return [];
    return activeRawList.filter((f) => {
      const due = new Date(f.followup_at);
      return startOf(due).toDateString() === selectedDay;
    });
  }, [activeRawList, selectedDay]);

  const handleInteractionSaved = (email: string) => {
    // Automatically remove follow-ups for this alumnus from local state
    setMyFollowupsList((prev) => prev.filter((f) => f.alumni_email !== email));
    setTeamFollowupsList((prev) => prev.filter((f) => f.alumni_email !== email));
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-20">
      {/* Banner */}
      <PageBanner
        title="Scheduled Follow-ups & Callbacks"
        description={<p>Consolidated calendar & queue of requested callbacks across all teams.</p>}
        icon={<CalendarClock className="h-8 w-8 text-primary" />}
        actions={
          <div className="flex items-center gap-2">
            <div className="w-full sm:w-64">
              <Input
                placeholder="Search by name, email, or notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10 rounded-xl bg-white/80 dark:bg-zinc-900/80 border-slate-200 dark:border-zinc-800 text-xs"
              />
            </div>
          </div>
        }
      />

      {/* Tabs Navigation */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => {
          setActiveTab(val as any);
          setSelectedDay(null);
        }}
        className="w-full"
      >
        <div className="flex items-center justify-between mb-4">
          <TabsList className="h-10 rounded-xl bg-muted/60 p-1">
            <TabsTrigger value="my" className="rounded-lg text-xs font-semibold gap-1.5 px-3">
              <UserCheck className="w-3.5 h-3.5 text-indigo-500" /> My Follow-ups ({myFollowupsList.length})
            </TabsTrigger>
            {canViewTeamTab && (
              <TabsTrigger value="team" className="rounded-lg text-xs font-semibold gap-1.5 px-3">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Team View ({teamFollowupsList.length})
              </TabsTrigger>
            )}
          </TabsList>
        </div>
      </Tabs>

      {/* KPI Cards: Single Metric per Card */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-red-50/60 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wider">Overdue</span>
          </div>
          <p className="text-3xl font-extrabold text-red-700 dark:text-red-400">{overdue.length}</p>
          <p className="text-[10px] text-red-600/80 font-medium mt-0.5">Needs immediate action</p>
        </div>

        <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Due Today</span>
          </div>
          <p className="text-3xl font-extrabold text-amber-700 dark:text-amber-400">{today.length}</p>
          <p className="text-[10px] text-amber-600/80 font-medium mt-0.5">Plan into today's session</p>
        </div>

        <div className="bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center gap-2 mb-1">
            <CalendarDays className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">This Week</span>
          </div>
          <p className="text-3xl font-extrabold text-blue-700 dark:text-blue-400">{thisWeek.length}</p>
          <p className="text-[10px] text-blue-600/80 font-medium mt-0.5">Next 7 rolling days</p>
        </div>

        <div className="bg-slate-50/60 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center gap-2 mb-1">
            <CalendarClock className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Later</span>
          </div>
          <p className="text-3xl font-extrabold text-slate-700 dark:text-slate-300">{later.length}</p>
          <p className="text-[10px] text-slate-500/80 font-medium mt-0.5">Scheduled after this week</p>
        </div>
      </div>

      {/* Calendar Strip */}
      <CalendarStrip
        followups={activeRawList}
        now={now}
        selectedDay={selectedDay}
        onSelectDay={setSelectedDay}
      />

      {/* Instruction banner */}
      <div className="flex items-start gap-3 p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 text-xs text-blue-800 dark:text-blue-300">
        <PhoneCall className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
        <span>
          <strong>To close a follow-up:</strong> click <em>"Log Call"</em> on any follow-up card. 
          Save the outcome — the follow-up will be marked complete automatically once an interaction is logged against the alumnus.
        </span>
      </div>

      {/* Main Roster View: Calendar Day Filter vs 4-Bucket Kanban View */}
      {selectedDay ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
              <CalendarClock className="w-4 h-4 text-primary" />
              <span>
                Follow-ups for {new Date(selectedDay).toLocaleDateString("en-IN", { dateStyle: "full" })}
              </span>
              <Badge variant="default" className="text-xs font-bold px-2 py-0.5">
                {dayFilteredList.length} items
              </Badge>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedDay(null)}
              className="h-8 text-xs font-semibold gap-1 rounded-lg"
            >
              <XCircle className="w-3.5 h-3.5" /> Clear day filter
            </Button>
          </div>

          {dayFilteredList.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-12 border border-dashed border-border/60 rounded-xl bg-card">
              No follow-ups scheduled for {new Date(selectedDay).toLocaleDateString("en-IN", { dateStyle: "medium" })}.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {dayFilteredList.map((item) => {
                const cat = classifyFollowup(item, now);
                return (
                  <FollowUpCard
                    key={item.id}
                    item={item}
                    category={cat}
                    userEmail={userEmail}
                    onLogCall={setLogModalTarget}
                    onViewDetails={setDetailItem}
                  />
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* 4 Kanban Columns */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KanbanColumn
            title="Overdue"
            category="overdue"
            items={overdue}
            userEmail={userEmail}
            onLogCall={setLogModalTarget}
            onViewDetails={setDetailItem}
          />
          <KanbanColumn
            title="Due Today"
            category="today"
            items={today}
            userEmail={userEmail}
            onLogCall={setLogModalTarget}
            onViewDetails={setDetailItem}
          />
          <KanbanColumn
            title="This Week"
            category="this_week"
            items={thisWeek}
            userEmail={userEmail}
            onLogCall={setLogModalTarget}
            onViewDetails={setDetailItem}
          />
          <KanbanColumn
            title="Later"
            category="later"
            items={later}
            userEmail={userEmail}
            onLogCall={setLogModalTarget}
            onViewDetails={setDetailItem}
          />
        </div>
      )}

      {/* Conversation Detail Modal */}
      <ConversationDetailModal
        item={detailItem}
        open={!!detailItem}
        onClose={() => setDetailItem(null)}
      />

      {/* Log Interaction Modal */}
      {logModalTarget && (
        <LogInteractionModal
          isOpen={!!logModalTarget}
          onClose={() => setLogModalTarget(null)}
          alumniEmail={logModalTarget.email}
          alumniName={logModalTarget.name}
          outcomes={outcomes}
          userEmail={userEmail}
        />
      )}

    </div>
  );
}
