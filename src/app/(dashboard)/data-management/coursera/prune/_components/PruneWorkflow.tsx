'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Clock, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { executePrune, requestPreview } from '@/lib/coursera-prune-client';
import { MAX_REMOVALS_PER_RUN, type PruneSettingsFormValues } from '@/lib/coursera-prune-schema';
import type { PruneExecutionResult, PruneMode, PrunePreview } from '@/types/coursera-prune';
import { PruneConfirmDialog } from './PruneConfirmDialog';
import { PrunePreviewTable } from './PrunePreviewTable';
import { PruneResultPanel } from './PruneResultPanel';
import { PruneSettingsForm } from './PruneSettingsForm';
import { describeCriteria, formatDateTime, formatNumber } from './prune-format';

interface PruneWorkflowProps {
  mode: PruneMode;
  defaultAmount?: number;
  canHardDelete: boolean;
  /** Called after a preview or prune so the history list can reload. */
  onLogged: () => void;
}

/**
 * One prune tab: settings → preview → select → prune → confirm → pruned list.
 */
export const PruneWorkflow = ({ mode, defaultAmount, canHardDelete, onLogged }: PruneWorkflowProps) => {
  const [preview, setPreview] = useState<PrunePreview | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [hardDelete, setHardDelete] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isPruning, setIsPruning] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [result, setResult] = useState<PruneExecutionResult | null>(null);
  const [now, setNow] = useState(() => Date.now());

  // Re-render every 30s so an expired preview disables the prune button.
  useEffect(() => {
    if (!preview) return;
    const id = setInterval(() => setNow(Date.now()), 30 * 1000);
    return () => clearInterval(id);
  }, [preview]);

  const candidates = useMemo(() => preview?.plan.candidates ?? [], [preview]);
  const isExpired = !!preview && Date.parse(preview.expiresAt) <= now;

  const handlePreview = async (values: PruneSettingsFormValues) => {
    setIsPreviewing(true);
    setResult(null);
    try {
      const criteria = mode === 'inactive_days' ? { mode, days: values.amount } : { mode, seats: values.amount };
      const data = await requestPreview(criteria, values.graceDays);
      setPreview(data);
      setSelected(new Set(data.plan.candidates.slice(0, MAX_REMOVALS_PER_RUN).map(c => c.email)));
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
    setIsPruning(true);
    try {
      // Keep the preview's ranking order in the request
      const emails = candidates.filter(c => selected.has(c.email)).map(c => c.email);
      const data = await executePrune(preview.previewId, emails, hardDelete);
      setResult(data);
      setPreview(null);
      setSelected(new Set());
      toast.success(`Pruned ${data.summary.succeeded} member${data.summary.succeeded === 1 ? '' : 's'}.`);
      onLogged();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Prune failed.');
    } finally {
      setIsPruning(false);
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
    setSelected(new Set());
  };

  if (result) return <PruneResultPanel result={result} onStartOver={startOver} />;

  return (
    <div className="flex flex-col gap-6">
      <PruneSettingsForm
        mode={mode}
        defaultAmount={defaultAmount}
        isLoading={isPreviewing}
        isDisabled={isPruning}
        onPreview={handlePreview}
      />

      {preview && (
        <div className="flex flex-col gap-4 border-t pt-6">
          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-semibold">
              Preview: {formatNumber(candidates.length)} member{candidates.length === 1 ? '' : 's'} match
            </h3>
            <p className="text-muted-foreground text-sm">
              {describeCriteria(preview.plan.criteria)} · {formatNumber(preview.plan.totalMembers)} members in the program ·
              skipped {preview.plan.skipped.inGracePeriod} new, {preview.plan.skipped.protected} protected,{' '}
              {preview.plan.skipped.activityLookupFailed} unreadable.
            </p>
            <p className={`flex items-center gap-1.5 text-sm ${isExpired ? 'text-destructive' : 'text-muted-foreground'}`}>
              <Clock className="size-4" aria-hidden="true" />
              {isExpired
                ? 'This preview has expired. Run Preview again to prune.'
                : `Valid until ${formatDateTime(preview.expiresAt)}. Nothing has been removed yet.`}
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
              isDisabled={isPruning}
              onToggle={toggle}
              onToggleAll={toggleAll}
            />
          ) : (
            <p className="text-muted-foreground rounded-lg border p-6 text-center text-sm">No members match these settings.</p>
          )}

          {candidates.length > 0 && (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              {canHardDelete ? (
                <div className="flex items-start gap-3">
                  <Switch id={`hard-delete-${mode}`} checked={hardDelete} onCheckedChange={setHardDelete} disabled={isPruning} />
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
                disabled={selected.size === 0 || isPruning || isExpired}
                className="w-full sm:w-fit"
              >
                <Trash2 aria-hidden="true" />
                {isPruning ? 'Pruning…' : `Prune ${formatNumber(selected.size)} member${selected.size === 1 ? '' : 's'}`}
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
