import { AlertTriangle, CheckCircle2, Download, RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { PruneExecutionResult, PrunedAccount } from '@/types/coursera-prune';
import { describeCriteria, formatDate, formatNumber } from './prune-format';

interface PruneResultPanelProps {
  result: PruneExecutionResult;
  onStartOver: () => void;
}

const AccountTable = ({ title, accounts, showMessage }: { title: string; accounts: PrunedAccount[]; showMessage?: boolean }) => (
  <div className="flex flex-col gap-2">
    <h4 className="text-sm font-semibold">{title} ({accounts.length})</h4>
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead>Last seen</TableHead>
            <TableHead className="text-right">Days inactive</TableHead>
            {showMessage && <TableHead>Reason</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {accounts.map(a => (
            <TableRow key={a.email}>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">{a.fullName || '—'}</span>
                  <span className="text-muted-foreground text-xs">{a.email}</span>
                </div>
              </TableCell>
              <TableCell>{formatDate(a.lastSeenAt)}</TableCell>
              <TableCell className="text-right tabular-nums">{a.daysInactive ?? '—'}</TableCell>
              {showMessage && <TableCell className="text-muted-foreground text-xs">{a.message}</TableCell>}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  </div>
);

/**
 * Outcome of a prune: counts, the pruned list (downloadable), failures, and
 * anyone spared because they no longer qualified.
 */
export const PruneResultPanel = ({ result, onStartOver }: PruneResultPanelProps) => {
  const { summary } = result;
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-muted/40 flex flex-col gap-1 rounded-lg border p-4">
        <p className="flex items-center gap-2 font-semibold">
          <CheckCircle2 className="size-5 text-primary" aria-hidden="true" />
          Pruned {formatNumber(summary.succeeded)} of {formatNumber(summary.requested)} selected member{summary.requested === 1 ? '' : 's'}
        </p>
        <p className="text-muted-foreground text-sm">
          {describeCriteria(result.criteria)} · {result.hardDelete ? 'Permanent delete' : 'Soft delete'} · {formatNumber(summary.failed)} failed · {formatNumber(summary.spared)} spared · Run {result.runId.slice(0, 8)}
        </p>
      </div>

      {result.logWarning && (
        <p role="alert" className="text-destructive flex items-start gap-2 rounded-lg border border-destructive/40 p-3 text-sm">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {result.logWarning}
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button asChild>
          <a href={result.downloadUrl} download>
            <Download aria-hidden="true" />
            Download pruned list (CSV)
          </a>
        </Button>
        <Button variant="outline" onClick={onStartOver}>
          <RotateCcw aria-hidden="true" />
          Start a new prune
        </Button>
      </div>

      {result.removedAccounts.length > 0 && <AccountTable title="Pruned members" accounts={result.removedAccounts} />}
      {result.failedAccounts.length > 0 && <AccountTable title="Could not be pruned" accounts={result.failedAccounts} showMessage />}
      {result.sparedEmails.length > 0 && (
        <div className="rounded-lg border p-3 text-sm">
          <p className="font-medium">Spared ({result.sparedEmails.length}) — active again or protected since the preview</p>
          <p className="text-muted-foreground mt-1 break-words">{result.sparedEmails.join(', ')}</p>
        </div>
      )}
    </div>
  );
};
