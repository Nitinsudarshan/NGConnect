import Link from 'next/link';
import { Lock, ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getResource } from '@/lib/resource-tree';

/**
 * Shown when an authenticated user opens a page they do not have permission
 * for — typically by following a direct link or a bookmark, since navigation
 * entries and cards for restricted areas are hidden up front.
 *
 * Preferred over bouncing the user to the dashboard: a silent redirect looks
 * like a broken link, while this states what is missing and who can grant it.
 */
export function AccessDenied({
  resourceId,
  title = 'You do not have access to this page',
  description,
  backHref = '/',
  backLabel = 'Back to Dashboard',
}: {
  resourceId?: string;
  title?: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
}) {
  const resourceLabel = resourceId ? getResource(resourceId)?.label : undefined;

  return (
    <div className="flex flex-1 items-center justify-center p-4 md:p-8 animate-in fade-in duration-500">
      <Card className="max-w-lg w-full border-border/60 bg-card/60 backdrop-blur-sm shadow-lg">
        <CardHeader className="items-center text-center gap-3">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 w-fit">
            <Lock className="w-6 h-6" />
          </div>
          <CardTitle className="text-xl font-bold tracking-tight">{title}</CardTitle>
          <CardDescription className="text-sm leading-relaxed">
            {description ?? (
              <>
                Your role does not include access to
                {resourceLabel ? <span className="font-semibold text-foreground"> {resourceLabel}</span> : ' this area'}.
                Ask an administrator to grant it from the RBAC matrix.
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-2 justify-center">
          <Button asChild variant="outline" className="gap-2">
            <Link href={backHref}>
              <ArrowLeft className="w-4 h-4" /> {backLabel}
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
