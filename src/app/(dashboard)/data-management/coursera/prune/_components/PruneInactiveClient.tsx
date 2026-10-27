'use client';

import { useCallback, useState } from 'react';
import { CalendarDays, Ticket } from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useJobLoop } from '@/hooks/useJobLoop';
import { fetchOverview, fetchPreview, startScan, stepScan } from '@/lib/coursera-prune-client';
import type { InactivityScan, PruneMode, PrunePreview, ScanProgress } from '@/types/coursera-prune';
import { InactivityOverview } from './InactivityOverview';
import { ProtectedAccountsCard } from './ProtectedAccountsCard';
import { PruneHistory } from './PruneHistory';
import { PruneWorkflow } from './PruneWorkflow';

interface PruneInactiveClientProps {
  initialScan: InactivityScan | null;
  /** A refresh left running (e.g. the page was closed mid-way), to resume. */
  initialRunningScan: ScanProgress | null;
  canEdit: boolean;
  canHardDelete: boolean;
}

/** What a prune tab should show when it (re)mounts. */
interface TabSeed {
  key: number;
  days?: number;
  list?: PrunePreview;
  resumeRunId?: string;
}

/**
 * Interactive body of the Prune Inactive page: overview with a batched
 * refresh, the two prune tabs, saved lists and the prune log, and protected
 * accounts.
 */
export const PruneInactiveClient = ({ initialScan, initialRunningScan, canEdit, canHardDelete }: PruneInactiveClientProps) => {
  const [scan, setScan] = useState(initialScan);
  const [refresh, setRefresh] = useState<ScanProgress | null>(initialRunningScan);
  const [tab, setTab] = useState<PruneMode>('inactive_days');
  // Remounts a tab when the overview or the log hands it something to show
  const [seeds, setSeeds] = useState<Partial<Record<PruneMode, TabSeed>>>({});
  const [historyKey, setHistoryKey] = useState(0);
  const scanJob = useJobLoop();

  const reloadHistory = useCallback(() => setHistoryKey(k => k + 1), []);

  const handleRefresh = async () => {
    try {
      const started = await startScan();
      setRefresh(started);
      const final = await scanJob.run(() => stepScan(started.scanId), setRefresh);
      if (final) {
        const overview = await fetchOverview();
        setScan(overview.latest);
        setRefresh(null);
        toast.success('Overview refreshed from Coursera.');
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Refresh stopped. Press Resume refresh to continue.');
    }
  };

  const seedTab = (mode: PruneMode, seed: Omit<TabSeed, 'key'>) => {
    setTab(mode);
    setSeeds(prev => ({ ...prev, [mode]: { ...seed, key: Date.now() } }));
    document.getElementById('prune-heading')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleOpenList = async (previewId: string, mode: PruneMode) => {
    try {
      seedTab(mode, { list: await fetchPreview(previewId) });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Could not open the list.');
    }
  };

  const renderTab = (mode: PruneMode) => {
    const seed = seeds[mode];
    return (
      <PruneWorkflow
        key={seed?.key ?? mode}
        mode={mode}
        defaultAmount={seed?.days}
        openedList={seed?.list}
        resumeRunId={seed?.resumeRunId}
        hasScanData={!!scan}
        canHardDelete={canHardDelete}
        onLogged={reloadHistory}
      />
    );
  };

  return (
    <div className="flex flex-col gap-8">
      <InactivityOverview
        scan={scan}
        refresh={refresh}
        isRefreshing={scanJob.isRunning}
        onRefresh={handleRefresh}
        onStopRefresh={scanJob.stop}
        onPruneByDays={days => seedTab('inactive_days', { days })}
        canEdit={canEdit}
      />

      {canEdit ? (
        <Card>
          <CardHeader>
            <CardTitle id="prune-heading" className="text-xl">Prune</CardTitle>
            <CardDescription>
              Preview builds a saved list from the latest refresh. Nothing is removed until you press Prune and
              confirm; each member is checked again with Coursera just before removal.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={tab} onValueChange={v => setTab(v as PruneMode)} className="gap-6">
              <TabsList className="w-full sm:w-fit">
                <TabsTrigger value="inactive_days">
                  <CalendarDays aria-hidden="true" />
                  By days inactive
                </TabsTrigger>
                <TabsTrigger value="free_seats">
                  <Ticket aria-hidden="true" />
                  By number of seats
                </TabsTrigger>
              </TabsList>
              <TabsContent value="inactive_days" forceMount hidden={tab !== 'inactive_days'}>
                {renderTab('inactive_days')}
              </TabsContent>
              <TabsContent value="free_seats" forceMount hidden={tab !== 'free_seats'}>
                {renderTab('free_seats')}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      ) : (
        <p className="text-muted-foreground rounded-lg border p-4 text-sm">
          You can view inactivity and the prune log. Pruning needs the edit permission on Coursera Prune Inactive.
        </p>
      )}

      <PruneHistory
        reloadKey={historyKey}
        canEdit={canEdit}
        onOpenList={handleOpenList}
        onResumeRun={(runId, mode) => seedTab(mode, { resumeRunId: runId })}
      />

      <div className="w-full lg:max-w-xl">
        <ProtectedAccountsCard canEdit={canEdit} />
      </div>
    </div>
  );
};
