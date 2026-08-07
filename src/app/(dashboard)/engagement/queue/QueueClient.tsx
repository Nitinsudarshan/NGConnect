"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  PhoneCall,
  CalendarClock,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  CheckCircle2,
  UserCheck,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import LogInteractionModal from "@/components/engagement/LogInteractionModal";
import { InteractionOutcome, OrgSettings } from "@/types/engagement";
import { completeFollowupAction } from "@/lib/engagement/actions";
import { toast } from "sonner";

interface QueueClientProps {
  alumniList: any[];
  followups: any[];
  recentInteractions: any[];
  outcomes: InteractionOutcome[];
  settings: OrgSettings;
  userEmail: string;
}

export default function QueueClient({
  alumniList,
  followups,
  recentInteractions,
  outcomes,
  settings,
  userEmail,
}: QueueClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAlumni, setSelectedAlumni] = useState<{ email: string; name: string } | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  const now = new Date();

  // Categorize followups
  const overdueFollowups = followups.filter(
    (f) => new Date(f.followup_at) < now && !f.followup_completed
  );
  const dueTodayFollowups = followups.filter((f) => {
    const d = new Date(f.followup_at);
    return (
      d >= new Date(now.setHours(0, 0, 0, 0)) &&
      d <= new Date(now.setHours(23, 59, 59, 999)) &&
      !f.followup_completed
    );
  });

  // Filtered alumni search
  const filteredAlumni = alumniList.filter((a) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      a.name?.toLowerCase().includes(term) ||
      a.email?.toLowerCase().includes(term) ||
      a.campus?.toLowerCase().includes(term) ||
      a.course?.toLowerCase().includes(term) ||
      a.company?.toLowerCase().includes(term)
    );
  });

  const handleCompleteFollowup = async (id: string) => {
    const res = await completeFollowupAction(id);
    if (res.success) {
      toast.success("Follow-up marked complete!");
    } else {
      toast.error(res.error || "Failed to complete follow-up");
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <PhoneCall className="w-6 h-6 text-primary" /> Daily Engagement Queue
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Prioritized contact queue for Alumni Growth, CEO's Office, and Mentoring teams.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1 text-xs rounded-full bg-primary/5 border-primary/20 text-primary">
            <Sparkles className="w-3.5 h-3.5 mr-1" /> Cool-down: {settings.followup_cooldown_days} days
          </Badge>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-destructive/30 bg-destructive/5 rounded-2xl shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-destructive tracking-wider">Overdue Callbacks</p>
              <h3 className="text-2xl font-extrabold text-destructive mt-0.5">{overdueFollowups.length}</h3>
            </div>
            <div className="p-2.5 rounded-xl bg-destructive/10 text-destructive">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-amber-500/30 bg-amber-500/5 rounded-2xl shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-amber-600 dark:text-amber-400 tracking-wider">Due Today</p>
              <h3 className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">{dueTodayFollowups.length}</h3>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-primary/30 bg-primary/5 rounded-2xl shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-primary tracking-wider">Total Active Pool</p>
              <h3 className="text-2xl font-extrabold text-primary mt-0.5">{alumniList.length}</h3>
            </div>
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <UserCheck className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-4">
          <TabsList className="h-10 rounded-xl bg-muted/60 p-1">
            <TabsTrigger value="all" className="rounded-lg text-xs font-medium">
              All Queue ({filteredAlumni.length})
            </TabsTrigger>
            <TabsTrigger value="overdue" className="rounded-lg text-xs font-medium">
              Overdue Callbacks ({overdueFollowups.length})
            </TabsTrigger>
            <TabsTrigger value="due_today" className="rounded-lg text-xs font-medium">
              Due Today ({dueTodayFollowups.length})
            </TabsTrigger>
          </TabsList>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, campus, company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 rounded-xl bg-card border-border/80 text-xs"
            />
          </div>
        </div>

        {/* Tab 1: All Alumni List */}
        <TabsContent value="all" className="mt-0">
          <Card className="border border-border/80 rounded-2xl shadow-xs bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border/60 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Alumnus Name</th>
                    <th className="py-3 px-4">Campus & Course</th>
                    <th className="py-3 px-4">Status & Company</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredAlumni.slice(0, 50).map((alumnus) => (
                    <tr key={alumnus.email} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4">
                        <Link
                          href={`/engagement/alumni/${encodeURIComponent(alumnus.email)}`}
                          className="font-bold text-foreground hover:text-primary transition-colors flex items-center gap-1.5"
                        >
                          {alumnus.name}
                        </Link>
                        <span className="text-[11px] text-muted-foreground">{alumnus.email}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-foreground">{alumnus.campus || "N/A"}</div>
                        <div className="text-[11px] text-muted-foreground">{alumnus.course || "N/A"}</div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="text-[10px] rounded-md font-medium">
                          {alumnus.status || "Active"}
                        </Badge>
                        <div className="text-[11px] text-muted-foreground mt-0.5">{alumnus.company || "N/A"}</div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground font-mono text-[11px]">
                        {alumnus.phone_number || "No Phone"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => setSelectedAlumni({ email: alumnus.email, name: alumnus.name })}
                            className="h-8 rounded-lg text-xs font-medium gap-1"
                          >
                            <PhoneCall className="w-3.5 h-3.5" /> Log Call
                          </Button>
                          <Button size="sm" variant="ghost" asChild className="h-8 w-8 p-0 rounded-lg">
                            <Link href={`/engagement/alumni/${encodeURIComponent(alumnus.email)}`}>
                              <ChevronRight className="w-4 h-4" />
                            </Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredAlumni.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        No alumni found matching criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Tab 2: Overdue Callbacks */}
        <TabsContent value="overdue" className="mt-0">
          <Card className="border border-destructive/20 rounded-2xl shadow-xs bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-destructive/5 text-destructive font-semibold border-b border-destructive/10 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Alumnus Email</th>
                    <th className="py-3 px-4">Scheduled For</th>
                    <th className="py-3 px-4">Assigned To</th>
                    <th className="py-3 px-4">Last Outcome</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {overdueFollowups.map((f) => (
                    <tr key={f.id} className="hover:bg-destructive/5 transition-colors">
                      <td className="py-3 px-4 font-bold text-foreground">
                        <Link href={`/engagement/alumni/${encodeURIComponent(f.alumni_email)}`} className="hover:underline">
                          {f.alumni_email}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-destructive font-semibold">
                        {new Date(f.followup_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{f.followup_assigned_to || f.logged_by}</td>
                      <td className="py-3 px-4">
                        <Badge variant="destructive" className="text-[10px] rounded-md">
                          {f.interaction_outcomes?.label || "Callback Requested"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCompleteFollowup(f.id)}
                          className="h-8 text-xs rounded-lg gap-1 border-emerald-500/40 text-emerald-600 hover:bg-emerald-50"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Complete
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => setSelectedAlumni({ email: f.alumni_email, name: f.alumni_email })}
                          className="h-8 text-xs rounded-lg gap-1"
                        >
                          <PhoneCall className="w-3.5 h-3.5" /> Call Now
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {overdueFollowups.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        No overdue callbacks! 🎉
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Tab 3: Due Today */}
        <TabsContent value="due_today" className="mt-0">
          <Card className="border border-amber-500/20 rounded-2xl shadow-xs bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-amber-500/5 text-amber-700 dark:text-amber-400 font-semibold border-b border-amber-500/10 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Alumnus Email</th>
                    <th className="py-3 px-4">Scheduled For</th>
                    <th className="py-3 px-4">Assigned To</th>
                    <th className="py-3 px-4">Outcome</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {dueTodayFollowups.map((f) => (
                    <tr key={f.id} className="hover:bg-amber-500/5 transition-colors">
                      <td className="py-3 px-4 font-bold text-foreground">
                        <Link href={`/engagement/alumni/${encodeURIComponent(f.alumni_email)}`} className="hover:underline">
                          {f.alumni_email}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-amber-600 dark:text-amber-400 font-semibold">
                        {new Date(f.followup_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{f.followup_assigned_to || f.logged_by}</td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="text-[10px] rounded-md border-amber-500/40 text-amber-600">
                          {f.interaction_outcomes?.label || "Callback Requested"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCompleteFollowup(f.id)}
                          className="h-8 text-xs rounded-lg gap-1 border-emerald-500/40 text-emerald-600 hover:bg-emerald-50"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Complete
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => setSelectedAlumni({ email: f.alumni_email, name: f.alumni_email })}
                          className="h-8 text-xs rounded-lg gap-1"
                        >
                          <PhoneCall className="w-3.5 h-3.5" /> Call Now
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {dueTodayFollowups.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        No callbacks scheduled for today.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Log Interaction Modal */}
      {selectedAlumni && (
        <LogInteractionModal
          isOpen={Boolean(selectedAlumni)}
          onClose={() => setSelectedAlumni(null)}
          alumniEmail={selectedAlumni.email}
          alumniName={selectedAlumni.name}
          outcomes={outcomes}
          userEmail={userEmail}
        />
      )}
    </div>
  );
}
