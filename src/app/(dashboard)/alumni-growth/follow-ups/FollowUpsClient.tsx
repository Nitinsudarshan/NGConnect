"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { getAlumniSlug } from "@/lib/utils";

import {
  CalendarClock,
  AlertTriangle,
  Clock,
  CalendarDays,
  Search,
  PhoneCall,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  ExternalLink,
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
import { PageBanner } from "@/components/shared/page-banner";
import { HelpModal } from "@/components/shared/HelpModal";
import LogInteractionModal from "@/components/engagement/LogInteractionModal";
import { InteractionOutcome } from "@/types/engagement";
import { toast } from "sonner";

/* ─── Helpers ─────────────────────────────────── */

function startOf(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function classifyFollowup(item: any, now: Date) {
  const due = new Date(item.followup_at);
  const todayStart = startOf(now);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  if (due < todayStart) return "overdue";
  if (due < todayEnd) return "today";
  return "upcoming";
}

const STATUS_STYLES = {
  overdue: {
    badge: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
    row: "border-l-4 border-l-red-400 bg-red-50/30 dark:bg-red-950/20",
    icon: <AlertTriangle className="w-3.5 h-3.5 text-red-500" />,
    label: "Overdue",
  },
  today: {
    badge: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
    row: "border-l-4 border-l-amber-400 bg-amber-50/30 dark:bg-amber-950/20",
    icon: <Clock className="w-3.5 h-3.5 text-amber-500" />,
    label: "Due Today",
  },
  upcoming: {
    badge: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-300",
    row: "border-l-4 border-l-slate-200 dark:border-l-slate-700 hover:bg-muted/20",
    icon: <CalendarDays className="w-3.5 h-3.5 text-slate-400" />,
    label: "Upcoming",
  },
};

/* ─── Calendar strip ───────────────────────────── */
function CalendarStrip({ followups, now }: { followups: any[]; now: Date }) {
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
    const map: Record<string, { overdue: number; today: number; upcoming: number }> = {};
    followups.forEach((f) => {
      const due = new Date(f.followup_at);
      const key = startOf(due).toDateString();
      if (!map[key]) map[key] = { overdue: 0, today: 0, upcoming: 0 };
      const cat = classifyFollowup(f, now);
      map[key][cat]++;
    });
    return map;
  }, [followups, now]);

  const todayStr = startOf(now).toDateString();

  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Period summary counts
  const countFor = (daysAhead: number) => {
    let c = 0;
    followups.forEach((f) => {
      const due = new Date(f.followup_at);
      const diff = Math.ceil((startOf(due).getTime() - startOf(now).getTime()) / 86400000);
      if (diff >= 0 && diff < daysAhead) c++;
    });
    return c;
  };
  const overdueCount = followups.filter((f) => classifyFollowup(f, now) === "overdue").length;
  const todayCount = followups.filter((f) => classifyFollowup(f, now) === "today").length;
  const next3Count = countFor(3);
  const weekCount = countFor(7);
  const monthCount = countFor(30);

  return (
    <div className="space-y-4">
      {/* Period summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl p-3.5">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-xs font-semibold text-red-700 dark:text-red-400">Overdue</span>
          </div>
          <p className="text-2xl font-bold text-red-700 dark:text-red-400">{overdueCount}</p>
          <p className="text-[10px] text-red-500/80 mt-0.5">Needs immediate action</p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl p-3.5">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">Due Today</span>
          </div>
          <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{todayCount}</p>
          <p className="text-[10px] text-amber-500/80 mt-0.5">Plan into today's session</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-xl p-3.5">
          <div className="flex items-center gap-2 mb-1">
            <CalendarDays className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">Next 3 Days</span>
          </div>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{next3Count}</p>
          <p className="text-[10px] text-blue-500/80 mt-0.5">This week · {weekCount} total</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center gap-2 mb-1">
            <CalendarClock className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">This Month</span>
          </div>
          <p className="text-2xl font-bold text-slate-700 dark:text-slate-300">{monthCount}</p>
          <p className="text-[10px] text-slate-500/80 mt-0.5">Scheduled follow-ups</p>
        </div>
      </div>

      {/* Calendar strip */}
      <div className="bg-card border border-border/60 rounded-xl p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2.5 px-1">
          29-day view · click a day to filter
        </p>
        <div className="flex gap-1 overflow-x-auto pb-1">
          {days.map((d) => {
            const key = d.toDateString();
            const counts = countByDate[key];
            const isToday = key === todayStr;
            const isPast = d < startOf(now);
            const isSelected = selectedDay === key;

            return (
              <button
                key={key}
                onClick={() => setSelectedDay(isSelected ? null : key)}
                className={`flex flex-col items-center min-w-[40px] rounded-lg px-1.5 py-1.5 transition-all border text-[10px] font-medium
                  ${isSelected ? "bg-primary text-primary-foreground border-primary" :
                    isToday ? "bg-amber-500/10 border-amber-400 text-amber-700 dark:text-amber-400" :
                    isPast && counts ? "bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-800 text-red-600" :
                    "border-transparent hover:border-border hover:bg-muted/50 text-muted-foreground"}`}
              >
                <span className="text-[9px] uppercase">{d.toLocaleDateString("en", { weekday: "short" })}</span>
                <span className={`text-sm font-bold ${isToday && !isSelected ? "text-amber-700 dark:text-amber-400" : ""}`}>
                  {d.getDate()}
                </span>
                {counts && (counts.overdue > 0 || counts.today > 0 || counts.upcoming > 0) ? (
                  <div className="flex gap-0.5 mt-0.5 justify-center">
                    {(counts.overdue > 0) && <div className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                    {(counts.today > 0) && <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                    {(counts.upcoming > 0) && <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
                  </div>
                ) : (
                  <div className="h-2 mt-0.5" />
                )}
              </button>
            );
          })}
        </div>
        {selectedDay && (
          <div className="mt-2 px-1">
            <button onClick={() => setSelectedDay(null)} className="text-[10px] text-muted-foreground underline">
              Clear day filter
            </button>
          </div>
        )}
      </div>
      {/* Export the selected day filter so the parent can use it */}
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
            Last Conversation
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

/* ─── Kanban Column ─────────────────────────────── */
function KanbanColumn({
  title,
  category,
  items,
  onLogCall,
  onViewDetails,
}: {
  title: string;
  category: keyof typeof STATUS_STYLES;
  items: any[];
  onLogCall: (alumni: { email: string; name: string }) => void;
  onViewDetails: (item: any) => void;
}) {
  const style = STATUS_STYLES[category];
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex flex-col gap-2 min-w-0">
      {/* Column header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={`flex items-center justify-between px-3 py-2 rounded-xl border ${
          category === "overdue"
            ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50"
            : category === "today"
            ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50"
            : "bg-muted/30 border-border/60"
        }`}
      >
        <div className="flex items-center gap-2">
          {style.icon}
          <span className="text-xs font-bold text-foreground">{title}</span>
          <Badge
            className={`text-[10px] px-1.5 py-0 h-4 border ${style.badge}`}
          >
            {items.length}
          </Badge>
        </div>
        {collapsed ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />}
      </button>

      {/* Cards */}
      {!collapsed && (
        <div className="flex flex-col gap-2">
          {items.length === 0 && (
            <div className="text-center text-xs text-muted-foreground py-8 border border-dashed border-border/50 rounded-xl">
              No follow-ups here
            </div>
          )}
          {items.map((item) => {
            const dueDate = new Date(item.followup_at);
            const alumniName = item.alumni_master?.name || item.alumni_email;
            const campus = item.alumni_master?.campus || "Unknown Campus";
            const assignedPoc = item.followup_assigned_to || item.logged_by;

            return (
              <div
                key={item.id}
                className={`rounded-lg border border-border/70 bg-card p-2.5 space-y-2 shadow-2xs hover:shadow-md hover:border-primary/40 transition-all ${style.row}`}
              >
                {/* Header: Name & Scheduled Date */}
                <div className="flex items-start justify-between gap-1.5">
                  <Link
                    href={`/alumni-growth/alumni/${getAlumniSlug(item.alumni_email, item.alumni_master?.name)}`}
                    className="font-semibold text-xs text-foreground hover:text-primary transition-colors truncate block"
                  >
                    {alumniName}
                  </Link>
                  <div className={`flex items-center gap-1 text-[10px] font-semibold shrink-0 px-1.5 py-0.5 rounded border ${style.badge}`}>
                    {style.icon}
                    {dueDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}{" "}
                    {dueDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>

                {/* Subtitle / Meta row */}
                <div className="flex items-center justify-between text-[11px] text-muted-foreground truncate">
                  <span className="truncate">{campus} • {item.alumni_email}</span>
                  {assignedPoc && (
                    <Badge variant="outline" className="text-[9px] bg-indigo-500/5 text-indigo-600 border-indigo-500/20 shrink-0 h-4 px-1.5 py-0 font-medium leading-none flex items-center">
                      {assignedPoc.split('@')[0]}
                    </Badge>
                  )}
                </div>

                {/* Action buttons */}
                <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-border/40">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onViewDetails(item)}
                    className="h-6 text-[11px] gap-1 px-2 rounded border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 w-full"
                  >
                    <MessageSquare className="w-3 h-3 shrink-0 text-muted-foreground" />
                    View Details
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onLogCall({ email: item.alumni_email, name: alumniName })}
                    className="h-6 text-[11px] gap-1 px-2 rounded border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/60 w-full font-medium"
                  >
                    <PhoneCall className="w-3 h-3 shrink-0 text-primary" />
                    Log Interaction
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Main Client ────────────────────────────────── */

interface FollowUpsClientProps {
  followups: any[];
  outcomes: InteractionOutcome[];
  userEmail: string;
}

export default function FollowUpsClient({ followups, outcomes, userEmail }: FollowUpsClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [logModalTarget, setLogModalTarget] = useState<{ email: string; name: string } | null>(null);
  const [detailItem, setDetailItem] = useState<any | null>(null);

  const now = new Date();

  const filtered = useMemo(() => {
    if (!searchTerm) return followups;
    const term = searchTerm.toLowerCase();
    return followups.filter(
      (f) =>
        f.alumni_email?.toLowerCase().includes(term) ||
        f.alumni_master?.name?.toLowerCase().includes(term) ||
        f.notes?.toLowerCase().includes(term)
    );
  }, [followups, searchTerm]);

  const overdue = filtered.filter((f) => classifyFollowup(f, now) === "overdue");
  const today = filtered.filter((f) => classifyFollowup(f, now) === "today");
  const upcoming = filtered.filter((f) => classifyFollowup(f, now) === "upcoming");

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-20">
      {/* Banner */}
      <PageBanner
        title="Scheduled Follow-ups & Callbacks"
        description={<p>Consolidated cross-pipeline calendar of all requested callbacks and scheduled touchpoints.</p>}
        icon={<CalendarClock className="h-8 w-8 text-primary" />}
        actions={
          <div className="flex items-center gap-2">
            <div className="w-full sm:w-64">
              <Input
                placeholder="Search by name or notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10 rounded-xl bg-white/80 dark:bg-zinc-900/80 border-slate-200 dark:border-zinc-800 text-xs"
              />
            </div>
            <HelpModal helpId="follow_ups" />
          </div>
        }
      />

      {/* Calendar strip + period KPIs */}
      <CalendarStrip followups={followups} now={now} />

      {/* Instruction banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 text-xs text-blue-800 dark:text-blue-300">
        <PhoneCall className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
        <span>
          <strong>To close a follow-up:</strong> click <em>"Log Interaction to Close Follow-up"</em> on the card. 
          Log the call outcome (e.g. Connected, No Answer) — the follow-up will be marked complete automatically once an interaction is saved against the alumnus.
        </span>
      </div>

      {/* Kanban columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KanbanColumn
          title="Overdue"
          category="overdue"
          items={overdue}
          onLogCall={setLogModalTarget}
          onViewDetails={setDetailItem}
        />
        <KanbanColumn
          title="Due Today"
          category="today"
          items={today}
          onLogCall={setLogModalTarget}
          onViewDetails={setDetailItem}
        />
        <KanbanColumn
          title="Upcoming"
          category="upcoming"
          items={upcoming}
          onLogCall={setLogModalTarget}
          onViewDetails={setDetailItem}
        />
      </div>

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
