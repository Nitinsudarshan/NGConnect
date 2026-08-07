"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CalendarClock, CheckCircle2, PhoneCall, AlertTriangle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { completeFollowupAction } from "@/lib/engagement/actions";
import { toast } from "sonner";

interface FollowUpsClientProps {
  followups: any[];
}

export default function FollowUpsClient({ followups }: FollowUpsClientProps) {
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

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <CalendarClock className="w-6 h-6 text-primary" /> Scheduled Follow-ups & Callbacks
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Consolidated cross-pipeline calendar of all requested callbacks and scheduled touchpoints.
          </p>
        </div>
        <div className="w-full sm:w-64">
          <Input
            placeholder="Search callbacks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 rounded-xl bg-card text-xs"
          />
        </div>
      </div>

      <Card className="border border-border/80 rounded-2xl bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border/60 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Alumnus Name & Email</th>
                <th className="py-3 px-4">Scheduled Date & Time</th>
                <th className="py-3 px-4">Assigned Staff</th>
                <th className="py-3 px-4">Outcome / Notes</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filtered.map((item) => {
                const isOverdue = new Date(item.followup_at) < now && !item.followup_completed;

                return (
                  <tr
                    key={item.id}
                    className={`transition-colors ${isOverdue ? "bg-destructive/5 hover:bg-destructive/10" : "hover:bg-muted/20"}`}
                  >
                    <td className="py-3.5 px-4 font-bold text-foreground">
                      <Link
                        href={`/engagement/alumni/${encodeURIComponent(item.alumni_email)}`}
                        className="hover:text-primary transition-colors block"
                      >
                        {item.alumni_master?.name || item.alumni_email}
                      </Link>
                      <span className="text-[11px] text-muted-foreground font-normal">{item.alumni_email}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className={`font-bold flex items-center gap-1 ${isOverdue ? "text-destructive" : "text-foreground"}`}>
                        {isOverdue && <AlertTriangle className="w-3.5 h-3.5" />}
                        {new Date(item.followup_at).toLocaleString()}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground">
                      {item.followup_assigned_to || item.logged_by}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <Badge variant="outline" className="text-[10px] rounded-md mb-1">
                        {item.interaction_outcomes?.label}
                      </Badge>
                      {item.notes && <p className="text-[11px] text-muted-foreground truncate">{item.notes}</p>}
                    </td>
                    <td className="py-3.5 px-4">
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
                    <td className="py-3.5 px-4 text-right">
                      {!item.followup_completed && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleComplete(item.id)}
                          className="h-8 rounded-lg text-xs gap-1 border-emerald-500/40 text-emerald-600 hover:bg-emerald-50"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Complete
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-muted-foreground">
                    No scheduled follow-ups found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
