import type { LucideIcon } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  hint?: string;
  /** Highlights the card (used for the prune-relevant counts). */
  isEmphasised?: boolean;
  children?: React.ReactNode;
}

/**
 * Single KPI tile for the prune overview.
 */
export const StatCard = ({ label, value, icon: Icon, hint, isEmphasised, children }: StatCardProps) => (
  <Card className={cn('gap-3', isEmphasised && 'border-destructive/40')}>
    <CardHeader className="flex flex-row items-center justify-between gap-2">
      <CardDescription className="text-sm font-medium">{label}</CardDescription>
      <Icon className={cn('size-4', isEmphasised ? 'text-destructive' : 'text-muted-foreground')} aria-hidden="true" />
    </CardHeader>
    <CardContent className="flex flex-col gap-2">
      <CardTitle className="text-3xl font-bold tabular-nums">{value}</CardTitle>
      {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
      {children}
    </CardContent>
  </Card>
);
