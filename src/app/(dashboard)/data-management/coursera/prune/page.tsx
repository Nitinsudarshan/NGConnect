import Link from 'next/link';
import { ArrowLeft, UserMinus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { denyUnlessAccess } from '@/lib/guard';
import { getCurrentUserPermissions } from '@/lib/permissions';
import { getLatestScan } from '@/lib/coursera-prune-store';
import { PRUNE_RESOURCE } from '@/lib/coursera-prune-auth';
import type { InactivityScan } from '@/types/coursera-prune';
import { PruneInactiveClient } from './_components/PruneInactiveClient';

/**
 * Coursera Prune Inactive: inactivity overview and seat reclamation.
 * view = this page, edit = preview/prune, delete = permanent delete.
 */
export default async function CourseraPrunePage() {
  const denied = await denyUnlessAccess(PRUNE_RESOURCE, 'view', {
    backHref: '/data-management',
    backLabel: 'Back to Data Management',
  });
  if (denied) return denied;

  const permissions = await getCurrentUserPermissions();
  const canEdit = !!permissions[PRUNE_RESOURCE]?.edit;
  const canHardDelete = !!permissions[PRUNE_RESOURCE]?.delete;

  let initialScan: InactivityScan | null = null;
  try {
    initialScan = await getLatestScan();
  } catch {
    // The page still works; the overview shows the "refresh" prompt.
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-4 pb-20 md:px-6 md:py-6 lg:px-8 lg:py-8">
      <div className="flex flex-col gap-4 border-b pb-6">
        <Button variant="ghost" size="sm" asChild className="w-fit">
          <Link href="/data-management">
            <ArrowLeft aria-hidden="true" />
            Data Management
          </Link>
        </Button>
        <div className="flex items-center gap-4">
          <div className="bg-destructive/10 text-destructive rounded-lg p-3">
            <UserMinus className="size-6" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Prune inactive learners</h1>
            <p className="text-muted-foreground text-sm">
              Free Coursera seats held by learners who have stopped learning.
            </p>
          </div>
        </div>
      </div>

      <PruneInactiveClient initialScan={initialScan} canEdit={canEdit} canHardDelete={canHardDelete} />
    </div>
  );
}
