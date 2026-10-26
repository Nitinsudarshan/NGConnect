'use client';

import { useMemo, useState } from 'react';
import { CalendarClock, Hourglass, Loader2, RefreshCw, UserX, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MIN_INACTIVE_DAYS } from '@/lib/coursera-prune-schema';
import type { InactivityScan } from '@/types/coursera-prune';
import { StatCard } from './StatCard';
import {
  DAY_MS,
  countInactiveSince,
  countNeverActive,
  daysAgo,
  formatDateTime,
  formatNumber,
  fromDateInputValue,
  toDateInputValue,
} from './prune-format';

const PRESET_DAYS = [90, 180, 365];

interface InactivityOverviewProps {
  scan: InactivityScan | null;
  isRefreshing: boolean;
  onRefresh: () => void;
  /** Opens the "By days" prune tab pre-filled with this many days. */
  onPruneByDays: (days: number) => void;
  canEdit: boolean;
}

/**
 * Program-wide inactivity cards from the latest stored scan, with a refresh
 * button (live Coursera re-scan) and an "inactive since" date picker.
 */
export const InactivityOverview = ({ scan, isRefreshing, onRefresh, onPruneByDays, canEdit }: InactivityOverviewProps) => {
  // Latest date that is still at least MIN_INACTIVE_DAYS ago
  const maxDate = useMemo(() => toDateInputValue(new Date(Date.now() - MIN_INACTIVE_DAYS * DAY_MS)), []);
  const [sinceDate, setSinceDate] = useState(maxDate);

  const lastSeen = useMemo(() => scan?.lastSeen ?? [], [scan]);
  const presetCounts = useMemo(
    () => PRESET_DAYS.map(days => ({ days, count: countInactiveSince(lastSeen, Date.now() - days * DAY_MS) })),
    [lastSeen]
  );
  const sinceCount = useMemo(
    () => countInactiveSince(lastSeen, fromDateInputValue(sinceDate).getTime()),
    [lastSeen, sinceDate]
  );
  const sinceDays = daysAgo(fromDateInputValue(sinceDate));

  // Typed dates later than the max are pulled back so the picker never goes under 90 days.
  const handleDateChange = (value: string) => {
    if (!value) return;
    setSinceDate(value > maxDate ? maxDate : value);
  };

  return (
    <section aria-labelledby="overview-heading" className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="overview-heading" className="text-xl font-semibold">Inactivity overview</h2>
          <p className="text-muted-foreground text-sm">
            {scan
              ? `Last refreshed ${formatDateTime(scan.scannedAt)}. Counts exclude members who joined in the last ${scan.graceDays} days, protected accounts, and members whose activity could not be read.`
              : 'No data yet. Refresh to read every member’s last activity from Coursera.'}
          </p>
        </div>
        <Button variant="outline" onClick={onRefresh} disabled={isRefreshing} className="shrink-0">
          {isRefreshing ? <Loader2 className="animate-spin" aria-hidden="true" /> : <RefreshCw aria-hidden="true" />}
          {isRefreshing ? 'Refreshing… (can take a few minutes)' : 'Refresh from Coursera'}
        </Button>
      </div>

      {scan && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <StatCard label="Total members" value={formatNumber(scan.totalMembers)} icon={Users} hint={`${formatNumber(lastSeen.length)} ranked by activity`} />
            <StatCard label="Never started" value={formatNumber(countNeverActive(lastSeen))} icon={UserX} hint="No course activity or enrolment date" />
            {presetCounts.map(({ days, count }) => (
              <StatCard key={days} label={`Inactive ${days}+ days`} value={formatNumber(count)} icon={Hourglass} isEmphasised hint={`${scan.totalMembers ? Math.round((count / scan.totalMembers) * 100) : 0}% of members`} />
            ))}
          </div>

          <StatCard label="Inactive since a date" value={formatNumber(sinceCount)} icon={CalendarClock} isEmphasised hint={`No activity since ${sinceDate} (${sinceDays} days). The latest date you can pick is ${MIN_INACTIVE_DAYS} days ago.`}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="inactive-since">Inactive since</Label>
                <Input
                  id="inactive-since"
                  type="date"
                  value={sinceDate}
                  max={maxDate}
                  onChange={e => handleDateChange(e.target.value)}
                  className="w-full sm:w-48"
                />
              </div>
              {canEdit && (
                <Button variant="secondary" onClick={() => onPruneByDays(Math.max(MIN_INACTIVE_DAYS, sinceDays))}>
                  Prune by these days
                </Button>
              )}
            </div>
          </StatCard>
        </>
      )}
    </section>
  );
};
