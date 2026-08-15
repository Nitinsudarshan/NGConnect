"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  UserRoundCog,
  Search,
  Clock,
  RotateCcw,
  CheckCircle2,
  Info,
  Sparkles,
  User,
  ArrowRight,
  Database,
  Loader2,
  Calendar,
  Layers,
  Undo
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { AuditLog } from '@/types/audit';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import LoadingView from '@/components/loading-view';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { HelpModal } from '@/components/shared/HelpModal';

function RecordHistoryContent() {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email');

  const [email, setEmail] = useState('');
  const [timeline, setTimeline] = useState<AuditLog[] | null>(null);
  const [searchedEmail, setSearchedEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRollingBack, setIsRollingBack] = useState<string | null>(null);

  const supabase = createClient();

  const handleSearch = async (e?: React.FormEvent, overrideEmail?: string) => {
    if (e) e.preventDefault();
    const searchVal = overrideEmail || email;
    if (!searchVal) return;

    setLoading(true);
    setTimeline(null);
    setSearchedEmail(searchVal);

    try {
      const { data: profile } = await supabase
        .from('alumni_profile')
        .select('id')
        .eq('alumni_email', searchVal.trim())
        .maybeSingle();

      const ids = [searchVal.trim()];
      if (profile?.id) {
        ids.push(profile.id);
      }

      const { data: logs, error } = await supabase
        .from('audit_log')
        .select('*')
        .in('record_id', ids)
        .order('changed_at', { ascending: false });

      if (error) throw error;

      if (logs && logs.length > 0) {
        setTimeline(logs as AuditLog[]);
      } else {
        // Fallback: Check if record exists in alumni_master to synthesize initial insert log
        const { data: masterRec } = await supabase
          .from('alumni_master')
          .select('created_at, name')
          .eq('email', searchVal.trim())
          .maybeSingle();

        if (masterRec) {
          const defaultLog: AuditLog = {
            id: `initial-import-${searchVal.trim()}`,
            table_name: 'alumni_master',
            record_id: searchVal.trim(),
            field_name: 'record',
            old_value: null,
            new_value: 'Imported from GHAR Excel sheet',
            action_type: 'INSERT',
            changed_by_user_id: 'system',
            changed_by_name: 'System',
            changed_by_role: 'Super Admin',
            changed_at: masterRec.created_at || new Date().toISOString(),
            ip_address: '127.0.0.1'
          };
          setTimeline([defaultLog]);
        } else {
          setTimeline([]);
          toast.error('No audit records found for this email address.');
        }
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Search failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
      handleSearch(undefined, emailParam);
    }
  }, [emailParam]);

  const handleRollback = async (log: AuditLog) => {
    setIsRollingBack(log.id);
    try {
      const res = await fetch('/api/alumni/admin/rollback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recordId: log.record_id,
          tableName: log.table_name,
          targetTimestamp: log.changed_at
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Record successfully restored to this point in time');
        handleSearch(undefined, searchedEmail);
      } else {
        toast.error(data.error || 'Restore failed');
      }
    } catch (err) {
      toast.error('Failed to trigger restore API');
    } finally {
      setIsRollingBack(null);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-20 animate-in fade-in slide-in-from-bottom-2 duration-300">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-5">
        <div className="flex items-center gap-3">
          <Link
            href={emailParam ? '/manage/master-data' : '/data-management'}
            className="p-2 border border-border/80 rounded-md hover:bg-muted transition-all text-muted-foreground hover:text-foreground hover:scale-105"
            title={emailParam ? 'Back to Master Data' : 'Back to Data Management'}
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Record History</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {emailParam ? `Viewing history log details for ${emailParam}.` : 'Search alumni accounts to view and restore granular field modifications over time.'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <HelpModal helpId="data_management.record_history" />
        </div>
      </div>

      {/* Search Input Card — ONLY shown when directly navigating, NOT from Master Data */}
      {!emailParam && (
        <Card className="border border-border/80 shadow-md rounded-2xl bg-card/60 overflow-hidden">
          <CardContent className="pt-6 pb-6">
            <form onSubmit={(e) => handleSearch(e)} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                <Input
                  placeholder="Enter alumni email to fetch history..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 rounded-md h-10 border-border/80"
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={loading} className="rounded-md h-10 flex-1 sm:flex-none">
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Search Timeline'
                  )}
                </Button>

              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Results Section */}
      {loading && (
        <Card className="border border-border/80 rounded-md shadow-lg bg-card/45 backdrop-blur-sm mt-6 overflow-hidden">
          <LoadingView fullScreen={false} />
        </Card>
      )}
      {!loading && timeline !== null && (
        <Card className="border border-border/80 rounded-md shadow-lg bg-card/45 backdrop-blur-sm">
          <CardHeader className="border-b border-border/60 bg-muted/15 flex flex-row items-center justify-between pb-5">
            <div>
              <CardTitle className="text-base flex items-center gap-2 font-bold text-foreground">
                <Clock className="w-4.5 h-4.5 text-muted-foreground" />
                Change Timeline for <span className="text-primary dark:text-indigo-400 font-mono text-sm ml-1">{searchedEmail}</span>
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                Chronological list of all schema field adjustments.
              </CardDescription>
            </div>

          </CardHeader>
          <CardContent className="pt-10 pb-8 px-6 sm:px-8">
            {timeline.length > 0 ? (
              <div className="relative border-l border-border/80 pl-8 ml-3 space-y-10">
                <div className="absolute top-0 bottom-0 left-[-1.5px] w-[3px] bg-gradient-to-b from-indigo-500 via-primary/40 to-transparent pointer-events-none" />

                {timeline.map((log) => {
                  const isInsert = log.action_type === 'INSERT';
                  const isDelete = log.action_type === 'DELETE';
                  const isRestore = log.action_type === 'RESTORE';
                  const isUpdate = log.action_type === 'UPDATE';

                  let dotColor = 'border-primary bg-primary';
                  let ringGlow = '';
                  if (isInsert) {
                    dotColor = 'border-emerald-500 bg-emerald-500';
                    ringGlow = 'ring-emerald-500/20';
                  } else if (isDelete) {
                    dotColor = 'border-red-500 bg-red-500';
                    ringGlow = 'ring-red-500/20';
                  } else if (isRestore) {
                    dotColor = 'border-indigo-500 bg-indigo-500';
                    ringGlow = 'ring-indigo-500/20';
                  } else if (isUpdate) {
                    dotColor = 'border-blue-500 bg-blue-500';
                    ringGlow = 'ring-blue-500/20';
                  }

                  return (
                    <div key={log.id} className="relative group animate-in fade-in-50 duration-500">
                      <div className={`absolute -left-[41px] top-1.5 w-4 h-4 rounded-md border-2 bg-background transition-all ring-4 ${dotColor} ${ringGlow} group-hover:scale-110`} />

                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 bg-card/60 p-4 border border-border/50 rounded-2xl hover:border-border transition-all hover:shadow-sm">
                        <div className="space-y-3 flex-1">

                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground font-semibold">
                            <span className="font-mono bg-muted/65 px-2 py-0.5 rounded-md border border-border/40 flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {new Date(log.changed_at).toLocaleString('en-IN')}
                            </span>
                            <span>•</span>
                            <span className="text-foreground font-bold flex items-center gap-1.5 bg-secondary/80 px-2.5 py-0.5 rounded-md border border-border/60">
                              <User className="w-3.5 h-3.5 text-muted-foreground" />
                              {log.changed_by_name} ({log.changed_by_role})
                            </span>
                            {log.ip_address && (
                              <>
                                <span>•</span>
                                <span className="font-mono text-[10px]">IP: {log.ip_address}</span>
                              </>
                            )}
                          </div>

                          <div className="text-xs font-semibold flex items-center flex-wrap gap-2 text-foreground/80">
                            <Badge
                              variant="outline"
                              className={`text-[9px] font-bold px-2 py-0.5 border rounded-md shadow-sm ${isInsert ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900' :
                                  isDelete ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900' :
                                    isRestore ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900' :
                                      'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900'
                                }`}
                            >
                              {log.action_type}
                            </Badge>
                            <span>modified field</span>
                            <span className="font-mono font-bold text-foreground bg-muted px-2 py-0.5 rounded-md border border-border/65 flex items-center gap-1">
                              <UserRoundCog className="w-3 h-3 text-muted-foreground" />
                              {log.field_name}
                            </span>
                            <span>on table</span>
                            <span className="font-mono text-xs text-muted-foreground underline decoration-dotted">{log.table_name}</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono max-w-2xl bg-card border border-border/60 rounded-md p-3.5">
                            <div className="space-y-1 border-r border-border/50 pr-2">
                              <span className="text-[10px] font-bold text-red-500 uppercase tracking-wide block">Previous Value</span>
                              <div className="text-red-600 line-through truncate font-medium bg-red-500/5 px-2 py-1 rounded-md border border-red-500/10 min-h-[1.75rem]">
                                {log.old_value !== null ? log.old_value : 'NULL'}
                              </div>
                            </div>
                            <div className="space-y-1 pl-1">
                              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wide block">New Mapped Value</span>
                              <div className="text-emerald-600 font-bold truncate bg-emerald-500/5 px-2 py-1 rounded-md border border-emerald-500/10 min-h-[1.75rem] flex items-center gap-1">
                                <span>{log.new_value !== null ? log.new_value : 'NULL'}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {!isInsert && !isDelete && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRollback(log)}
                            disabled={isRollingBack === log.id}
                            className="text-red-600 hover:text-red-500 hover:bg-red-500/10 border-red-500/20 dark:border-red-500/30 rounded-md self-start gap-1.5 transition-all hover:scale-105 font-bold text-xs"
                          >
                            {isRollingBack === log.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <RotateCcw className="w-3.5 h-3.5" />
                            )}
                            Revert to this
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground font-semibold">
                No change logs recorded for this record yet.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Help Footer */}
      <div className="flex items-start gap-3 text-xs text-muted-foreground bg-muted/20 border border-border/80 p-4.5 rounded-md">
        <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>How Rollbacks Work:</strong> Reverting to a state replays all preceding audit log modifications up to that point. The change itself creates a new <strong>RESTORE</strong> audit log. User self-reports do not overwrite imports.
        </p>
      </div>

    </div>
  );
}

export default function RecordHistoryPage() {
  return (
    <Suspense fallback={
      <div className="p-6 text-center text-muted-foreground font-semibold flex items-center justify-center gap-2 h-[40vh]">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
        Loading Record Timeline...
      </div>
    }>
      <RecordHistoryContent />
    </Suspense>
  );
}
