import { z } from 'zod';

/**
 * Validation rules for Coursera prune requests. Shared by the prune UI forms and
 * the route handlers so both sides enforce the same limits.
 */

/** Nobody can be pruned for less than this many days of inactivity. */
export const MIN_INACTIVE_DAYS = 90;
export const MAX_INACTIVE_DAYS = 3650;
/** Upper bound on removals in a single execution (and on the seats mode). */
export const MAX_REMOVALS_PER_RUN = 500;
export const DEFAULT_GRACE_DAYS = 14;
export const MAX_GRACE_DAYS = 365;
/** A saved prune list can be pruned from for this long after it is created. */
export const PREVIEW_VALID_DAYS = 7;
/** A refresh left running longer than this is abandoned and a new one starts. */
export const SCAN_RESUME_HOURS = 24;
/** Members checked live per refresh request; small enough to finish well inside a request. */
export const SCAN_BATCH_SIZE = 25;
/** Members re-checked and removed per prune request. */
export const PRUNE_BATCH_SIZE = 10;

const daysField = z
  .number({ error: 'Enter a number of days.' })
  .int('Use a whole number of days.')
  .min(MIN_INACTIVE_DAYS, `Minimum is ${MIN_INACTIVE_DAYS} days.`)
  .max(MAX_INACTIVE_DAYS, `Maximum is ${MAX_INACTIVE_DAYS} days.`);

const seatsField = z
  .number({ error: 'Enter a number of seats.' })
  .int('Use a whole number.')
  .min(1, 'Free at least 1 seat.')
  .max(MAX_REMOVALS_PER_RUN, `Maximum is ${MAX_REMOVALS_PER_RUN} per run.`);

const graceField = z
  .number({ error: 'Enter a number of days.' })
  .int('Use a whole number of days.')
  .min(0, 'Cannot be negative.')
  .max(MAX_GRACE_DAYS, `Maximum is ${MAX_GRACE_DAYS} days.`);

/** Prune settings form: `amount` is days (inactive_days) or seats (free_seats). */
export const pruneSettingsFormSchema = (mode: 'inactive_days' | 'free_seats') =>
  z.object({ amount: mode === 'inactive_days' ? daysField : seatsField, graceDays: graceField });
export type PruneSettingsFormValues = { amount: number; graceDays: number };

export const protectedFormSchema = z.object({
  emails: z
    .string()
    .trim()
    .min(1, 'Enter at least one email.')
    .refine(
      value => splitEmails(value).every(e => z.email().safeParse(e).success),
      'One or more entries is not a valid email address.'
    ),
  note: z.string().trim().max(200, 'Keep the note under 200 characters.'),
});
export type ProtectedFormValues = z.infer<typeof protectedFormSchema>;

/** Splits a comma/space/newline separated list into lower-cased emails. */
export const splitEmails = (value: string) =>
  value
    .split(/[\s,;]+/)
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);

export const previewRequestSchema = z.discriminatedUnion('mode', [
  z.object({
    action: z.literal('preview').optional(),
    mode: z.literal('inactive_days'),
    days: daysField,
    graceDays: graceField.default(DEFAULT_GRACE_DAYS),
  }),
  z.object({
    action: z.literal('preview').optional(),
    mode: z.literal('free_seats'),
    seats: seatsField,
    graceDays: graceField.default(DEFAULT_GRACE_DAYS),
  }),
]);

const identifierField = z.string().trim().toLowerCase().min(1).max(254);

export const executeRequestSchema = z.object({
  action: z.literal('execute'),
  previewId: z.uuid('Invalid previewId.'),
  confirmEmails: z
    .array(identifierField)
    .min(1, 'Select at least one account to prune.')
    .max(MAX_REMOVALS_PER_RUN, `Maximum ${MAX_REMOVALS_PER_RUN} removals per run.`),
  hardDelete: z.boolean().default(false),
});

export const protectedAddSchema = z.object({
  emails: z.array(z.string().trim().toLowerCase().pipe(z.email('Invalid email address.'))).min(1).max(200),
  note: z.string().trim().max(200).optional(),
});

export const protectedRemoveSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email('Invalid email address.')),
});
