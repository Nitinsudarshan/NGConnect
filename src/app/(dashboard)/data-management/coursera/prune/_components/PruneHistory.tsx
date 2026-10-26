'use client';

import { useEffect, useState } from 'react';
import { Download, History } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { fetchRuns, removalsCsvUrl } from '@/lib/coursera-prune-client';
import type { PruneRunSummary } from '@/types/coursera-prune';
import { formatDateTime } from './prune-format';

const describeRun = (run: PruneRunSummary) => {
  if (!run.mode || run.threshold === null) return '—';
  return run.mode === 'inactive_days' ? `> ${run.threshold} days inactive` : `${run.threshold} seats`;
};

const describeOutcome = (run: PruneRunSummary) => {
  if (run.kind === 'preview') {
    const used = run.executedRunId ? ' · pruned' : '';
    return `${run.candidateCount ?? 0} matched${used}`;
  }
  if (run.succeeded === null) return 'Incomplete';
  return `${run.succeeded} pruned · ${run.failed ?? 0} failed · ${run.spared ?? 0} spared`;
};

/**
 * Log of recent previews and prunes, with the pruned list for each prune.
 * Reloads whenever `reloadKey` changes.
 */
export const PruneHistory = ({ reloadKey }: { reloadKey: number }) => {
  const [runs, setRuns] = useState<PruneRunSummary[] | null>(null);

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
          Prune log
        </CardTitle>
        <CardDescription>Every preview and prune, newest first. Download the pruned list to re-invite anyone.</CardDescription>
      </CardHeader>
      <CardContent>
        {runs === null ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : runs.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nothing logged yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Criteria</TableHead>
                  <TableHead>Outcome</TableHead>
                  <TableHead>By</TableHead>
                  <TableHead className="text-right">Pruned list</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.map(run => (
                  <TableRow key={run.id}>
                    <TableCell className="whitespace-nowrap">{formatDateTime(run.createdAt)}</TableCell>
                    <TableCell>
                      {run.kind === 'preview' ? (
                        <Badge variant="outline">Preview</Badge>
                      ) : (
                        <Badge variant={run.hardDelete ? 'destructive' : 'secondary'}>
                          {run.hardDelete ? 'Permanent delete' : 'Prune'}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{describeRun(run)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{describeOutcome(run)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{run.createdByEmail ?? '—'}</TableCell>
                    <TableCell className="text-right">
                      {run.kind === 'execute' && (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={removalsCsvUrl(run.id)} download aria-label={`Download pruned list for run ${run.id.slice(0, 8)}`}>
                            <Download aria-hidden="true" />
                            CSV
                          </a>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
