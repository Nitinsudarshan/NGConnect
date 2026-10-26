'use client';

import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { PruneCandidate } from '@/types/coursera-prune';
import { SOURCE_LABELS, formatDate } from './prune-format';

const PAGE_SIZE = 100;

interface PrunePreviewTableProps {
  candidates: PruneCandidate[];
  selected: Set<string>;
  /** Rows beyond this rank cannot be selected (per-run removal cap). */
  selectableLimit: number;
  isDisabled: boolean;
  onToggle: (email: string, isChecked: boolean) => void;
  onToggleAll: (isChecked: boolean) => void;
}

/**
 * Candidate list for a preview, most inactive first. Unticking a row keeps
 * that member out of the prune.
 */
export const PrunePreviewTable = ({ candidates, selected, selectableLimit, isDisabled, onToggle, onToggleAll }: PrunePreviewTableProps) => {
  const [visible, setVisible] = useState(PAGE_SIZE);
  const selectable = Math.min(candidates.length, selectableLimit);
  const allChecked = selectable > 0 && selected.size === selectable;

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={allChecked ? true : selected.size > 0 ? 'indeterminate' : false}
                  onCheckedChange={v => onToggleAll(v === true)}
                  disabled={isDisabled || selectable === 0}
                  aria-label="Select all members that can be pruned"
                />
              </TableHead>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Member</TableHead>
              <TableHead>Last seen</TableHead>
              <TableHead className="text-right">Days inactive</TableHead>
              <TableHead className="text-right">Courses</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {candidates.slice(0, visible).map((c, i) => {
              const isSelectable = i < selectableLimit;
              return (
                <TableRow key={c.email} data-state={selected.has(c.email) ? 'selected' : undefined}>
                  <TableCell>
                    <Checkbox
                      checked={selected.has(c.email)}
                      onCheckedChange={v => onToggle(c.email, v === true)}
                      disabled={isDisabled || !isSelectable}
                      aria-label={`Prune ${c.email}`}
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">{c.rank}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{c.fullName || '—'}</span>
                      <span className="text-muted-foreground text-xs">{c.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col items-start gap-1">
                      <span>{formatDate(c.lastSeenAt)}</span>
                      <Badge variant="outline">{SOURCE_LABELS[c.lastSeenSource]}</Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{c.daysInactive ?? '—'}</TableCell>
                  <TableCell className="text-right tabular-nums">{c.coursesCount}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      {candidates.length > visible && (
        <Button variant="ghost" onClick={() => setVisible(v => v + PAGE_SIZE)} className="w-fit self-center">
          Show {Math.min(PAGE_SIZE, candidates.length - visible)} more of {candidates.length - visible} remaining
        </Button>
      )}
    </div>
  );
};
