'use client';

import { useState } from 'react';
import { CalendarDays, Ticket } from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { refreshScan } from '@/lib/coursera-prune-client';
import type { InactivityScan, PruneMode } from '@/types/coursera-prune';
import { InactivityOverview } from './InactivityOverview';
import { ProtectedAccountsCard } from './ProtectedAccountsCard';
import { PruneHistory } from './PruneHistory';
import { PruneWorkflow } from './PruneWorkflow';

interface PruneInactiveClientProps {
  initialScan: InactivityScan | null;
  canEdit: boolean;
  canHardDelete: boolean;
}

/**
 * Interactive body of the Prune Inactive page: overview, the two prune tabs,
 * protected accounts, and the prune log.
 */
export const PruneInactiveClient = ({ initialScan, canEdit, canHardDelete }: PruneInactiveClientProps) => {
  const [scan, setScan] = useState(initialScan);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [tab, setTab] = useState<PruneMode>('inactive_days');
  // Remounts the days tab when the overview hands it a new value
  const [daysPrefill, setDaysPrefill] = useState<{ days: number; key: number } | null>(null);
  const [historyKey, setHistoryKey] = useState(0);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      setScan(await refreshScan());
      toast.success('Overview refreshed from Coursera.');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Refresh failed.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handlePruneByDays = (days: number) => {
    setTab('inactive_days');
    setDaysPrefill({ days, key: Date.now() });
    document.getElementById('prune-heading')?.scrollIntoView({ behavior: 'smooth' });
  };

  const reloadHistory = () => setHistoryKey(k => k + 1);

  return (
    <div className="flex flex-col gap-8">
      <InactivityOverview
        scan={scan}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
        onPruneByDays={handlePruneByDays}
        canEdit={canEdit}
      />

      {canEdit ? (
        <Card>
          <CardHeader>
            <CardTitle id="prune-heading" className="text-xl">Prune</CardTitle>
            <CardDescription>
              Preview first — nothing is removed until you press Prune and confirm. Every preview and prune is logged.
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
                <PruneWorkflow
                  key={daysPrefill?.key ?? 'days'}
                  mode="inactive_days"
                  defaultAmount={daysPrefill?.days}
                  canHardDelete={canHardDelete}
                  onLogged={reloadHistory}
                />
              </TabsContent>
              <TabsContent value="free_seats" forceMount hidden={tab !== 'free_seats'}>
                <PruneWorkflow mode="free_seats" canHardDelete={canHardDelete} onLogged={reloadHistory} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      ) : (
        <p className="text-muted-foreground rounded-lg border p-4 text-sm">
          You can view inactivity and the prune log. Pruning needs the edit permission on Coursera Prune Inactive.
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <ProtectedAccountsCard canEdit={canEdit} />
        </div>
        <div className="lg:col-span-2">
          <PruneHistory reloadKey={historyKey} />
        </div>
      </div>
    </div>
  );
};
