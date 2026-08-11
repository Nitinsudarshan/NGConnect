'use client';

import React, { useState, useTransition } from 'react';
import { rollbackGranularRbac } from '@/app/actions/permissions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { History, Undo2, Loader2, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

type AuditLog = {
  id: string;
  created_at: string;
  changed_by: string;
  snapshot: any; // Now structured as { type: 'granular_update', subjectType, count, data }
};

function getChanges(currentSnapshot: any) {
  if (!currentSnapshot) return ["System baseline or unknown state."];
  if (currentSnapshot.type !== 'granular_update') return ["Legacy snapshot format. Cannot parse granular changes."];
  
  if (currentSnapshot.isRollback) {
    return [`Rolled back ${currentSnapshot.subjectType} permissions (${currentSnapshot.count} items)`];
  }
  
  return [`Updated granular permissions for ${currentSnapshot.subjectType} (${currentSnapshot.count} permissions)`];
}

export function RbacAuditLog({ logs }: { logs: AuditLog[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmLog, setConfirmLog] = useState<{id: string, snapshot: any} | null>(null);

  const handleRollback = () => {
    if (!confirmLog) return;
    
    startTransition(async () => {
      const res = await rollbackGranularRbac(confirmLog.id, confirmLog.snapshot);
      if (!res.success) {
        toast.error(`Failed to rollback: ${res.error}`);
      } else {
        toast.success('Successfully rolled back permissions!');
        setConfirmLog(null);
        router.refresh();
      }
    });
  };

  return (
    <>
      {confirmLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card border border-border shadow-lg p-6 rounded-xl max-w-sm w-full space-y-4">
            <div className="flex items-center gap-3 text-destructive">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              <h3 className="font-bold text-lg">Restore Version?</h3>
            </div>
            <p className="text-muted-foreground text-sm">
              Are you sure you want to rollback to this exact state? This will instantly overwrite all current permissions for the targeted subject with the ones from this snapshot.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setConfirmLog(null)} disabled={isPending}>Cancel</Button>
              <Button onClick={handleRollback} disabled={isPending} variant="destructive">
                {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Yes, Restore
              </Button>
            </div>
          </div>
        </div>
      )}

      <Card className="mt-8 border-border/60 bg-card/40 backdrop-blur-md shadow-lg overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border/40 p-6">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <History className="w-5 h-5 text-muted-foreground" />
            <span>Edit Log & Rollback</span>
            {isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </CardTitle>
          <CardDescription>
            A history of permission changes. You can restore granular permissions to any previous state.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {(!logs || logs.length === 0) ? (
            <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
              <History className="w-10 h-10 opacity-20" />
              <p className="text-lg">No edit history available yet.</p>
              <p className="text-sm opacity-70">Changes you save to the grid above will appear here.</p>
            </div>
          ) : (
            <div className="max-h-[500px] overflow-y-auto">
              <table className="w-full text-sm text-left relative">
                <thead className="bg-muted/50 text-muted-foreground font-semibold uppercase text-xs sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4 whitespace-nowrap border-b border-border/50">Date & Time</th>
                    <th className="px-6 py-4 whitespace-nowrap border-b border-border/50">Changed By</th>
                    <th className="px-6 py-4 border-b border-border/50">Summary</th>
                    <th className="px-6 py-4 whitespace-nowrap border-b border-border/50 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {logs.map((log) => {
                    const changes = getChanges(log.snapshot);

                    return (
                      <tr key={log.id} className="hover:bg-muted/20 transition-colors group">
                        <td className="px-6 py-5 whitespace-nowrap font-medium text-foreground align-top">
                          {String(log.created_at).substring(0, 19).replace('T', ' ')} UTC
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap align-top">
                          <span className="px-2.5 py-1 bg-muted rounded-full text-muted-foreground border border-border/50 text-xs">
                            {log.changed_by}
                          </span>
                        </td>
                        <td className="px-6 py-5 align-top">
                          <div className="flex flex-col gap-1.5 text-muted-foreground">
                            {changes.map((change, i) => (
                              <div key={i} className="flex items-start gap-2 leading-tight">
                                <span className="text-primary mt-0.5 text-[10px]">●</span>
                                <span>{change}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap align-top text-right">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            disabled={isPending || log.snapshot?.type !== 'granular_update'}
                            className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                            onClick={() => setConfirmLog({ id: log.id, snapshot: log.snapshot })}
                          >
                            <Undo2 className="w-4 h-4" /> Restore
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
