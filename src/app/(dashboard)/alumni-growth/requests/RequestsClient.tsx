"use client";

import React, { useEffect, useState } from "react";
import {
  Inbox,
  BookOpen,
  HeartHandshake,
  CheckCircle2,
  Clock,
  UserCheck,
  Search,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageBanner } from "@/components/shared/page-banner";
import { useUserContext } from "@/contexts/user-context";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface MemberRequest {
  id: string;
  type: "coursera" | "pay_forward";
  user_id: string;
  user_email: string;
  user_name: string;
  status: "pending" | "approved" | "received" | "rejected";
  created_at: string;
  updated_at: string;
  processed_by?: string | null;
}

export function RequestsClient() {
  const user = useUserContext();
  const router = useRouter();
  const [requests, setRequests] = useState<MemberRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"coursera" | "pay_forward">("coursera");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [actioningId, setActioningId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role === "Member" || user?.role === "Viewer") {
      router.replace("/");
    }
  }, [user, router]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/member-requests");
      const data = await res.json();
      if (data.success && data.data) {
        setRequests(data.data);
      }
    } catch (e) {
      toast.error("Failed to load member requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleGrantCourseraAccess = async (reqId: string, memberEmail: string) => {
    setActioningId(reqId);
    try {
      const res = await fetch("/api/member-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: reqId, status: "approved" }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Granted Coursera Enterprise access for ${memberEmail}!`);
        fetchRequests();
      } else {
        toast.error(data.error || "Failed to grant access.");
      }
    } catch (e) {
      toast.error("Error processing access request.");
    } finally {
      setActioningId(null);
    }
  };

  const handleReceivePayForward = async (reqId: string, memberEmail: string) => {
    setActioningId(reqId);
    try {
      const res = await fetch("/api/member-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: reqId, status: "received" }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Marked Pay-Forward request from ${memberEmail} as received!`);
        fetchRequests();
      } else {
        toast.error(data.error || "Failed to mark as received.");
      }
    } catch (e) {
      toast.error("Error processing Pay-Forward request.");
    } finally {
      setActioningId(null);
    }
  };

  const currentTabRequests = requests.filter((r) => r.type === activeTab);

  const filteredRequests = currentTabRequests.filter((r) => {
    const matchesSearch =
      r.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.user_email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCourseraCount = requests.filter((r) => r.type === "coursera" && r.status === "pending").length;
  const pendingPayForwardCount = requests.filter((r) => r.type === "pay_forward" && r.status === "pending").length;
  const totalProcessedCount = requests.filter((r) => r.status === "approved" || r.status === "received").length;

  return (
    <div className="p-3 sm:p-4 space-y-4 max-w-7xl mx-auto w-full pb-16 animate-in fade-in duration-300">
      {/* Standard App PageBanner */}
      <PageBanner
        title="Member Growth Requests"
        description="Review and process member Coursera Enterprise access requests and Pay-Forward engagement submissions."
        icon={<Inbox className="w-6 h-6 text-indigo-500" />}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={fetchRequests}
            className="gap-2 border-slate-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 hover:bg-slate-100 dark:hover:bg-zinc-800 text-xs font-medium"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        }
      />

      {/* Compact Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border border-blue-200 dark:border-blue-900/60 bg-gradient-to-br from-blue-50/50 to-white dark:from-blue-950/20 dark:to-zinc-950 rounded-xl shadow-xs p-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              Coursera Requests
            </span>
            <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono mt-1 text-slate-900 dark:text-white">
            {pendingCourseraCount} <span className="text-xs font-normal text-slate-500 dark:text-zinc-400">Pending</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-zinc-400 mt-0.5">
            Members requesting Coursera Enterprise licenses.
          </p>
        </Card>

        <Card className="border border-emerald-200 dark:border-emerald-900/60 bg-gradient-to-br from-emerald-50/50 to-white dark:from-emerald-950/20 dark:to-zinc-950 rounded-xl shadow-xs p-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Pay-Forward Submissions
            </span>
            <div className="p-1.5 rounded-md bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400">
              <HeartHandshake className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono mt-1 text-slate-900 dark:text-white">
            {pendingPayForwardCount} <span className="text-xs font-normal text-slate-500 dark:text-zinc-400">Pending</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-zinc-400 mt-0.5">
            Alumni offering mentoring or sharing opportunities.
          </p>
        </Card>

        <Card className="border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-xl shadow-xs p-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              Actioned Requests
            </span>
            <div className="p-1.5 rounded-md bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300">
              <ShieldCheck className="w-4 h-4 text-indigo-500" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono mt-1 text-slate-900 dark:text-white">
            {totalProcessedCount} <span className="text-xs font-normal text-slate-500 dark:text-zinc-400">Completed</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-zinc-400 mt-0.5">
            Total member requests approved or received.
          </p>
        </Card>
      </div>

      {/* Tabs & Compact Filters */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-zinc-800 pb-2.5">
          {/* Compact Tab Switcher */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab("coursera")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === "coursera"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Coursera Access ({requests.filter((r) => r.type === "coursera").length})
            </button>
            <button
              onClick={() => setActiveTab("pay_forward")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === "pay_forward"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800"
              }`}
            >
              <HeartHandshake className="w-3.5 h-3.5" />
              Pay-Forward ({requests.filter((r) => r.type === "pay_forward").length})
            </button>
          </div>

          {/* Search & Status Filter */}
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400 dark:text-zinc-500" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name or email..."
                className="pl-8 h-8 text-xs bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs h-8 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-md px-2 focus:ring-indigo-500 text-slate-700 dark:text-zinc-300"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value={activeTab === "coursera" ? "approved" : "received"}>
                {activeTab === "coursera" ? "Approved" : "Received"}
              </option>
            </select>
          </div>
        </div>

        {/* Compact Standard App Card List */}
        <Card className="border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm rounded-xl overflow-hidden">
          <CardHeader className="p-3.5 bg-slate-50/60 dark:bg-zinc-900/50 border-b border-slate-200 dark:border-zinc-800">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-900 dark:text-white">
              {activeTab === "coursera" ? (
                <>
                  <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Coursera Enterprise Access Requests
                </>
              ) : (
                <>
                  <HeartHandshake className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Pay-Forward Engagement Requests
                </>
              )}
            </CardTitle>
            <CardDescription className="text-xs text-slate-600 dark:text-zinc-400">
              {activeTab === "coursera"
                ? "Grant Coursera Enterprise access to allow members to start learning."
                : "Acknowledge alumni Pay-Forward requests to reset their member banner state."}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 text-center text-xs text-slate-500 dark:text-zinc-400">Loading member requests...</div>
            ) : filteredRequests.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 dark:text-zinc-400 space-y-1">
                <p className="font-semibold text-slate-700 dark:text-zinc-300">No requests found</p>
                <p>No member requests match the selected filters.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                {filteredRequests.map((req) => {
                  const isPending = req.status === "pending";

                  return (
                    <div
                      key={req.id}
                      className="p-3 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-zinc-900/40 transition-colors"
                    >
                      {/* Request Info */}
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-xs text-slate-900 dark:text-white">{req.user_name}</span>
                          <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono">{req.user_email}</span>
                          <Badge
                            variant="outline"
                            className={`text-[9px] uppercase font-mono px-1.5 py-0 ${
                              isPending
                                ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
                                : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
                            }`}
                          >
                            {req.status}
                          </Badge>
                        </div>

                        <div className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            Requested: {new Date(req.created_at).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                          </span>
                          {req.processed_by && (
                            <span className="flex items-center gap-1">
                              <UserCheck className="w-3 h-3 text-emerald-500" />
                              Processed by: {req.processed_by}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="flex items-center gap-2">
                        {req.type === "coursera" ? (
                          isPending ? (
                            <Button
                              size="sm"
                              className="h-8 bg-blue-600 hover:bg-blue-700 text-white gap-1.5 text-xs font-semibold px-3"
                              disabled={actioningId === req.id}
                              onClick={() => handleGrantCourseraAccess(req.id, req.user_email)}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {actioningId === req.id ? "Granting..." : "Grant Access"}
                            </Button>
                          ) : (
                            <Badge className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60 py-0.5 px-2.5 text-xs gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Access Granted
                            </Badge>
                          )
                        ) : isPending ? (
                          <Button
                            size="sm"
                            className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs font-semibold px-3"
                            disabled={actioningId === req.id}
                            onClick={() => handleReceivePayForward(req.id, req.user_email)}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {actioningId === req.id ? "Receiving..." : "Receive Request"}
                          </Button>
                        ) : (
                          <Badge className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60 py-0.5 px-2.5 text-xs gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Received
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
