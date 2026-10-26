'use client';

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { buttonVariants } from '@/components/ui/button';
import type { PruneCriteria } from '@/types/coursera-prune';
import { describeCriteria, formatNumber } from './prune-format';

/** At or above this many members, the count must be typed to confirm. */
const TYPE_COUNT_THRESHOLD = 50;
const HARD_DELETE_PHRASE = 'DELETE';

interface PruneConfirmDialogProps {
  open: boolean;
  count: number;
  criteria: PruneCriteria;
  hardDelete: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

/**
 * Final "are you sure" step before a prune. Large prunes require typing the
 * member count; permanent deletes also require typing DELETE.
 */
export const PruneConfirmDialog = ({ open, count, criteria, hardDelete, onOpenChange, onConfirm }: PruneConfirmDialogProps) => {
  const [typedCount, setTypedCount] = useState('');
  const [typedPhrase, setTypedPhrase] = useState('');

  const needsCount = count >= TYPE_COUNT_THRESHOLD;
  const isReady =
    (!needsCount || typedCount.trim() === String(count)) && (!hardDelete || typedPhrase.trim() === HARD_DELETE_PHRASE);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setTypedCount('');
      setTypedPhrase('');
    }
    onOpenChange(next);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="text-destructive size-5" aria-hidden="true" />
            Are you sure you want to prune {formatNumber(count)} member{count === 1 ? '' : 's'}?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="flex flex-col gap-2">
              <span>
                {describeCriteria(criteria)}. Their Coursera seats are freed straight away. Everyone is checked
                again first, so anyone who became active since the preview is skipped.
              </span>
              {hardDelete ? (
                <span className="text-destructive font-medium">
                  Permanent delete: the membership is removed without Coursera&apos;s soft-delete option. Bringing
                  someone back needs a fresh invite, and their program progress may not be kept.
                </span>
              ) : (
                <span>
                  Soft delete: members can rejoin, and you can re-invite them from the downloaded list.
                </span>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        {needsCount && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirm-count">Type {count} to confirm</Label>
            <Input id="confirm-count" inputMode="numeric" autoComplete="off" value={typedCount} onChange={e => setTypedCount(e.target.value)} />
          </div>
        )}
        {hardDelete && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirm-phrase">Type {HARD_DELETE_PHRASE} to confirm permanent deletion</Label>
            <Input id="confirm-phrase" autoComplete="off" value={typedPhrase} onChange={e => setTypedPhrase(e.target.value)} />
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className={buttonVariants({ variant: 'destructive' })}
            disabled={!isReady}
            onClick={() => {
              setTypedCount('');
              setTypedPhrase('');
              onConfirm();
            }}
          >
            Prune {formatNumber(count)} member{count === 1 ? '' : 's'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
