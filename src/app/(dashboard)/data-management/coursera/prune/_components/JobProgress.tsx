import { Loader2, Square } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { formatNumber } from './prune-format';

interface JobProgressProps {
  label: string;
  done: number;
  total: number;
  /** Extra line under the bar, e.g. removed / spared counts. */
  detail?: string;
  /** Shown while the job waits on a Coursera cooldown. */
  waitMs?: number;
  isRunning: boolean;
  onStop?: () => void;
}

/**
 * Progress bar for a batched job (refresh or prune), with a Stop button.
 * Stopping only pauses the browser; the job can be resumed later.
 */
export const JobProgress = ({ label, done, total, detail, waitMs, isRunning, onStop }: JobProgressProps) => {
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div className="flex flex-col gap-2 rounded-lg border p-4" role="status" aria-live="polite">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-medium">
          {isRunning && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          {label}: {formatNumber(done)} of {formatNumber(total)} ({percent}%)
        </p>
        {isRunning && onStop && (
          <Button variant="outline" size="sm" onClick={onStop}>
            <Square aria-hidden="true" />
            Stop
          </Button>
        )}
      </div>
      <Progress value={percent} aria-label={`${label} progress`} />
      {detail && <p className="text-muted-foreground text-xs">{detail}</p>}
      {isRunning && waitMs ? (
        <p className="text-muted-foreground text-xs">
          Coursera asked us to slow down. Continuing in about {Math.ceil(waitMs / 1000)}s.
        </p>
      ) : null}
    </div>
  );
};
