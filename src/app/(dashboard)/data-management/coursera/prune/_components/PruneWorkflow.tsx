'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Clock, Play, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useJobLoop } from '@/hooks/useJobLoop';
import { fetchPruneResult, requestPreview, startPrune, stepPrune } from '@/lib/coursera-prune-client';
import { MAX_REMOVALS_PER_RUN, type PruneSettingsFormValues } from '@/lib/coursera-prune-schema';
import type { PruneExecutionResult, PruneMode, PrunePreview, PruneRunProgress } from '@/types/coursera-prune';
import { JobProgress } from './JobProgress';
import { PruneConfirmDialog } from './PruneConfirmDialog';
import { PrunePreviewTable } from './PrunePreviewTable';
import { PruneResultPanel } from './PruneResultPanel';
import { PruneSettingsForm } from './PruneSettingsForm';
import { describeCriteria, formatDateTime, formatNumber } from './prune-format';

interface PruneWorkflowProps {
  mode: PruneMode;
  defaultAmount?: number;
  /** A saved list reopened from the prune log. */
  openedList?: PrunePreview;
  /** A stopped prune to resume from the prune log. */
  resumeRunId?: string;
  hasScanData: boolean;
  canHardDelete: boolean;
  /** Called after a list is saved or a prune advances, so the log can reload. */
  onLogged: () => void;
}

/**
 * One prune tab: settings → saved list (preview) → select → prune → confirm →
 * batched removal with progress → pruned list.
 */
export const PruneWorkflow = ({
  mode,
  defaultAmount,
  openedList,
  resumeRunId,
  hasScanData,
  canHardDelete,
  onLogged,
}: PruneWorkflowProps) => {
  const [preview, setPreview] = useState<PrunePreview | null>(openedList ?? null);
  const [selected, setSelected] = useState<Set<string>>(() => initialSelection(openedList));
  const [hardDelete, setHardDelete] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [runId, setRunId] = useState<string | null>(null);
  const [progress, setProgress] = useState<PruneRunProgress | null>(null);
  const [result, setResult] = useState<PruneExecutionResult | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const job = useJobLoop();
  const hasResumed = useRef(false);

  // Re-render every minute so an expired list disables the prune button.
  useEffect(() => {
    if (!preview) return;
    const id = setInterval(() => setNow(Date.now()), 60 * 1000);
    return () => clearInterval(id);
  }, [preview]);

  const candidates = useMemo(() => preview?.plan.candidates ?? [], [preview]);
  const isExpired = !!preview && Date.parse(preview.expiresAt) <= now;
  const isUsed = !!preview?.executedRunId;

  const runPrune = useCallback(
    async (id: string) => {
      setRunId(id);
      try {
        const final = await job.run(() => stepPrune(id), setProgress);
        if (final) {
          setResult(await fetchPruneResult(id));
          toast.success(`Prune finished: ${final.removed} removed, ${final.spared} spared, ${final.failed} failed.`);
        }
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'The prune stopped. Resume it from the prune log.');
      } finally {
        onLogged();
      }
    },
    [job, onLogged]
  );

  // Resume a stopped prune handed over from the prune log.
  useEffect(() => {
    if (resumeRunId && !hasResumed.current) {
      hasResumed.current = true;
      void runPrune(resumeRunId);
    }
  }, [resumeRunId, runPrune]);

  const handlePreview = async (values: PruneSettingsFormValues) => {
    setIsPreviewing(true);
    setResult(null);
    try {
      const criteria = mode === 'inactive_days' ? { mode, days: values.amount } : { mode, seats: values.amount };
      const data = await requestPreview(criteria, values.graceDays);
      setPreview(data);
      setSelected(initialSelection(data));
      setHardDelete(false);
      setNow(Date.now());
      onLogged();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Preview failed.');
    } finally {
      setIsPreviewing(false);
    }
  };

  const handlePrune = async () => {
    if (!preview) return;
    setIsConfirmOpen(false);
    try {
      const emails = candidates.filter(c => selected.has(c.email)).map(c => c.email);
      const started = await startPrune(preview.previewId, emails, hardDelete);
      setProgress(started);
      setPreview({ ...preview, executedRunId: started.runId });
      await runPrune(started.runId);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Prune failed to start.');
    }
  };

  const toggle = (email: string, isChecked: boolean) =>
    setSelected(prev => {
      const next = new Set(prev);
      if (isChecked) next.add(email);
      else next.delete(email);
      return next;
    });

  const toggleAll = (isChecked: boolean) =>
    setSelected(isChecked ? new Set(candidates.slice(0, MAX_REMOVALS_PER_RUN).map(c => c.email)) : new Set());

  const startOver = () => {
    setResult(null);
    setPreview(null);
    setProgress(null);
    setRunId(null);
    setSelected(new Set());
  };

  if (result) return <PruneResultPanel result={result} onStartOver={startOver} />;

  if (runId && progress) {
    return (
      <div className="flex flex-col gap-4">
        <JobProgress
          label={job.isRunning ? 'Pruning' : 'Prune paused'}
          done={progress.processed}
          total={progress.total}
          detail={`${formatNumber(progress.removed)} removed · ${formatNumber(progress.spared)} spared (active again or protected) · ${formatNumber(progress.failed)} failed. Each member is logged as they are handled.`}
          waitMs={progress.waitMs}
          isRunning={job.isRunning}
          onStop={job.stop}
        />
        {!job.isRunning && (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={() => void runPrune(runId)}>
              <Play aria-hidden="true" />
              Resume prune
            </Button>
            <Button variant="outline" onClick={async () => setResult(await fetchPruneResult(runId))}>
              See what was pruned so far
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {hasScanData ? (
        <PruneSettingsForm
          mode={mode}
          defaultAmount={defaultAmount}
          isLoading={isPreviewing}
          isDisabled={job.isRunning}
          onPreview={handlePreview}
        />
      ) : (
        <p className="text-muted-foreground rounded-lg border p-4 text-sm">
          Refresh from Coursera in the overview above first. Previews are built from the latest refresh.
        </p>
      )}

      {preview && (
        <div className="flex flex-col gap-4 border-t pt-6">
          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-semibold">
              Prune list: {formatNumber(candidates.length)} member{candidates.length === 1 ? '' : 's'} match
            </h3>
            <p className="text-muted-foreground text-sm">
              {describeCriteria(preview.plan.criteria)} · {formatNumber(preview.plan.totalMembers)} members in the program ·
              skipped {preview.plan.skipped.inGracePeriod} new, {preview.plan.skipped.protected} protected,{' '}
              {preview.plan.skipped.activityLookupFailed} unreadable. Based on Coursera data from{' '}
              {formatDateTime(preview.scannedAt)}.
            </p>
            <p className={`flex items-center gap-1.5 text-sm ${isExpired || isUsed ? 'text-destructive' : 'text-muted-foreground'}`}>
              <Clock className="size-4" aria-hidden="true" />
              {isUsed
                ? 'This list has already been used for a prune. Resume or review it from the prune log.'
                : isExpired
                  ? 'This list has expired. Run Preview again to prune.'
                  : `Saved. You can come back and prune from it until ${formatDateTime(preview.expiresAt)}. Nothing has been removed yet.`}
            </p>
          </div>

          {candidates.length > MAX_REMOVALS_PER_RUN && (
            <p role="status" className="flex items-start gap-2 rounded-lg border p-3 text-sm">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              Only the {MAX_REMOVALS_PER_RUN} most inactive can be pruned in one run. Run again for the rest.
            </p>
          )}

          {candidates.length > 0 ? (
            <PrunePreviewTable
              candidates={candidates}
              selected={selected}
              selectableLimit={MAX_REMOVALS_PER_RUN}
              isDisabled={isUsed || isExpired}
              onToggle={toggle}
              onToggleAll={toggleAll}
            />
          ) : (
            <p className="text-muted-foreground rounded-lg border p-6 text-center text-sm">No members match these settings.</p>
          )}

          {candidates.length > 0 && !isUsed && (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              {canHardDelete ? (
                <div className="flex items-start gap-3">
                  <Switch id={`hard-delete-${mode}`} checked={hardDelete} onCheckedChange={setHardDelete} />
                  <div className="flex flex-col gap-0.5">
                    <Label htmlFor={`hard-delete-${mode}`}>Permanent delete</Label>
                    <span className="text-muted-foreground text-xs">
                      Off by default. Soft delete lets members rejoin and keeps the option to re-invite them.
                    </span>
                  </div>
                </div>
              ) : (
                <span className="text-muted-foreground text-xs">Members are soft-deleted and can be re-invited.</span>
              )}
              <Button
                variant="destructive"
                onClick={() => setIsConfirmOpen(true)}
                disabled={selected.size === 0 || isExpired}
                className="w-full sm:w-fit"
              >
                <Trash2 aria-hidden="true" />
                {`Prune ${formatNumber(selected.size)} member${selected.size === 1 ? '' : 's'}`}
              </Button>
            </div>
          )}

          <PruneConfirmDialog
            open={isConfirmOpen}
            count={selected.size}
            criteria={preview.plan.criteria}
            hardDelete={hardDelete}
            onOpenChange={setIsConfirmOpen}
            onConfirm={handlePrune}
          />
        </div>
      )}
    </div>
  );
};

/** By default the first MAX_REMOVALS_PER_RUN members of a list are selected. */
function initialSelection(list?: PrunePreview | null): Set<string> {
  return new Set((list?.plan.candidates ?? []).slice(0, MAX_REMOVALS_PER_RUN).map(c => c.email));
}
