'use client';

import { useEffect, useState } from 'react';
import { Download, FolderOpen, History, Play } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { fetchRuns, removalsCsvUrl } from '@/lib/coursera-prune-client';
import type { PruneMode, PruneRunSummary } from '@/types/coursera-prune';
import { formatDateTime } from './prune-format';

type RunState = 'saved' | 'expired' | 'used' | 'running' | 'done' | 'partly' | 'failed';

const STATE_LABELS: Record<RunState, string> = {
  saved: 'Saved list',
  expired: 'Expired list',
  used: 'Used list',
  running: 'In progress',
  done: 'Done',
  partly: 'Done with failures',
  failed: 'Failed',
};

const stateOf = (run: PruneRunSummary, now: number): RunState => {
  if (run.kind === 'preview') {
    if (run.executedRunId) return 'used';
    return run.expiresAt && Date.parse(run.expiresAt) <= now ? 'expired' : 'saved';
  }
  if (run.status === 'running') return 'running';
  if (run.status === 'failed') return 'failed';
  return (run.failed ?? 0) > 0 ? 'partly' : 'done';
};

const describeRun = (run: PruneRunSummary) => {
  if (!run.mode || run.threshold === null) return '—';
  return run.mode === 'inactive_days' ? `> ${run.threshold} days inactive` : `${run.threshold} seats`;
};

const describeOutcome = (run: PruneRunSummary) => {
  if (run.kind === 'preview') return `${run.candidateCount ?? 0} matched`;
  const handled = (run.succeeded ?? 0) + (run.failed ?? 0) + (run.spared ?? 0);
  return `${run.succeeded ?? 0} pruned · ${run.spared ?? 0} spared · ${run.failed ?? 0} failed · ${handled}/${run.candidateCount ?? 0} handled`;
};

interface PruneHistoryProps {
  reloadKey: number;
  canEdit: boolean;
  onOpenList: (previewId: string, mode: PruneMode) => void;
  onResumeRun: (runId: string, mode: PruneMode) => void;
}

/**
 * Saved prune lists and prunes, newest first. Saved lists can be reopened and
 * pruned from; stopped prunes can be resumed. Reloads whenever `reloadKey` changes.
 */
export const PruneHistory = ({ reloadKey, canEdit, onOpenList, onResumeRun }: PruneHistoryProps) => {
  const [runs, setRuns] = useState<PruneRunSummary[] | null>(null);
  const [now] = useState(() => Date.now());

  useEffect(() => {
    fetchRuns()
      .then(setRuns)
      .catch((err: Error) => {
        setRuns([]);
        toast.error(err.message);
      });
  }, [reloadKey]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="size-5" aria-hidden="true" />
          Prune lists and log
        </CardTitle>
        <CardDescription>
          Every preview is saved as a list you can open and prune from for 7 days. A stopped prune can be resumed.
          Download a prune&apos;s list to re-invite anyone.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {runs === null ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : runs.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nothing saved yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criteria</TableHead>
                  <TableHead>Outcome</TableHead>
                  <TableHead>By</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.map(run => {
                  const state = stateOf(run, now);
                  return (
                    <TableRow key={run.id}>
                      <TableCell className="whitespace-nowrap">{formatDateTime(run.createdAt)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            run.kind === 'execute' && run.hardDelete
                              ? 'destructive'
                              : state === 'saved' || state === 'running'
                                ? 'default'
                                : run.kind === 'preview'
                                  ? 'outline'
                                  : 'secondary'
                          }
                        >
                          {run.kind === 'execute' && run.hardDelete ? `Permanent · ${STATE_LABELS[state]}` : STATE_LABELS[state]}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{describeRun(run)}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{describeOutcome(run)}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{run.createdByEmail ?? '—'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {state === 'saved' && canEdit && run.mode && (
                            <Button variant="outline" size="sm" onClick={() => onOpenList(run.id, run.mode!)}>
                              <FolderOpen aria-hidden="true" />
                              Open
                            </Button>
                          )}
                          {state === 'running' && canEdit && run.mode && (
                            <Button size="sm" onClick={() => onResumeRun(run.id, run.mode!)}>
                              <Play aria-hidden="true" />
                              Resume
                            </Button>
                          )}
                          {run.kind === 'execute' && (
                            <Button variant="ghost" size="sm" asChild>
                              <a href={removalsCsvUrl(run.id)} download aria-label={`Download pruned list for run ${run.id.slice(0, 8)}`}>
                                <Download aria-hidden="true" />
                                CSV
                              </a>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
