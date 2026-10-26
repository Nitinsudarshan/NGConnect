'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  DEFAULT_GRACE_DAYS,
  MAX_GRACE_DAYS,
  MAX_INACTIVE_DAYS,
  MAX_REMOVALS_PER_RUN,
  MIN_INACTIVE_DAYS,
  pruneSettingsFormSchema,
  type PruneSettingsFormValues,
} from '@/lib/coursera-prune-schema';
import type { PruneMode } from '@/types/coursera-prune';

interface PruneSettingsFormProps {
  mode: PruneMode;
  defaultAmount?: number;
  isLoading: boolean;
  isDisabled: boolean;
  onPreview: (values: PruneSettingsFormValues) => void;
}

const toNumber = (value: string) => (value === '' ? undefined : Number(value));

/**
 * Settings for one prune mode. Submitting only previews; nothing is removed here.
 */
export const PruneSettingsForm = ({ mode, defaultAmount, isLoading, isDisabled, onPreview }: PruneSettingsFormProps) => {
  const isDays = mode === 'inactive_days';
  const min = isDays ? MIN_INACTIVE_DAYS : 1;
  const max = isDays ? MAX_INACTIVE_DAYS : MAX_REMOVALS_PER_RUN;

  const form = useForm<PruneSettingsFormValues>({
    resolver: zodResolver(pruneSettingsFormSchema(mode)),
    defaultValues: { amount: defaultAmount ?? (isDays ? 180 : 50), graceDays: DEFAULT_GRACE_DAYS },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onPreview)} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{isDays ? 'Inactive for more than (days)' : 'Number of seats to free'}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={min}
                    max={max}
                    step={1}
                    name={field.name}
                    ref={field.ref}
                    value={Number.isFinite(field.value) ? field.value : ''}
                    onChange={e => field.onChange(toNumber(e.target.value))}
                    // Values below the minimum snap back to it, so nothing under 90 days can be submitted.
                    onBlur={() => {
                      if (typeof field.value === 'number' && field.value < min) field.onChange(min);
                      if (typeof field.value === 'number' && field.value > max) field.onChange(max);
                      field.onBlur();
                    }}
                  />
                </FormControl>
                <FormDescription>
                  {isDays
                    ? `Minimum ${MIN_INACTIVE_DAYS} days. Members who never started count as inactive.`
                    : `The least active members are chosen first. Maximum ${MAX_REMOVALS_PER_RUN} per run.`}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="graceDays"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Skip members who joined in the last (days)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={MAX_GRACE_DAYS}
                    step={1}
                    name={field.name}
                    ref={field.ref}
                    value={Number.isFinite(field.value) ? field.value : ''}
                    onChange={e => field.onChange(toNumber(e.target.value))}
                    onBlur={field.onBlur}
                  />
                </FormControl>
                <FormDescription>Gives new members time to start. Default {DEFAULT_GRACE_DAYS}.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" disabled={isLoading || isDisabled} className="w-full sm:w-fit">
          {isLoading ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Eye aria-hidden="true" />}
          {isLoading ? 'Building preview… (can take a few minutes)' : 'Preview'}
        </Button>
      </form>
    </Form>
  );
};
