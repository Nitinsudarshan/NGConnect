'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, ShieldCheck, X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { addProtected, fetchProtected, removeProtected } from '@/lib/coursera-prune-client';
import { protectedFormSchema, splitEmails, type ProtectedFormValues } from '@/lib/coursera-prune-schema';
import type { ProtectedAccount } from '@/types/coursera-prune';
import { formatDate } from './prune-format';

/**
 * Stored list of accounts that prune runs always skip (staff, test accounts).
 */
export const ProtectedAccountsCard = ({ canEdit }: { canEdit: boolean }) => {
  const [accounts, setAccounts] = useState<ProtectedAccount[] | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  const form = useForm<ProtectedFormValues>({
    resolver: zodResolver(protectedFormSchema),
    defaultValues: { emails: '', note: '' },
  });

  useEffect(() => {
    fetchProtected()
      .then(setAccounts)
      .catch((err: Error) => {
        setAccounts([]);
        toast.error(err.message);
      });
  }, []);

  const handleAdd = async (values: ProtectedFormValues) => {
    try {
      setAccounts(await addProtected(splitEmails(values.emails), values.note || undefined));
      form.reset();
      toast.success('Protected accounts saved.');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Could not save.');
    }
  };

  const handleRemove = async (email: string) => {
    setRemoving(email);
    try {
      setAccounts(await removeProtected(email));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Could not remove.');
    } finally {
      setRemoving(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="size-5" aria-hidden="true" />
          Protected accounts
        </CardTitle>
        <CardDescription>Never pruned, whatever the settings. Applies to every preview and prune.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {canEdit && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAdd)} className="flex flex-col gap-3">
              <FormField
                control={form.control}
                name="emails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Emails</FormLabel>
                    <FormControl>
                      <Textarea rows={2} placeholder="staff@navgurukul.org, test@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Note (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Staff account" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" variant="secondary" disabled={form.formState.isSubmitting} className="w-full sm:w-fit">
                {form.formState.isSubmitting && <Loader2 className="animate-spin" aria-hidden="true" />}
                Protect
              </Button>
            </form>
          </Form>
        )}

        {accounts === null ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : accounts.length === 0 ? (
          <p className="text-muted-foreground text-sm">No protected accounts yet.</p>
        ) : (
          <ul className="flex max-h-72 flex-col divide-y overflow-y-auto rounded-lg border">
            {accounts.map(a => (
              <li key={a.email} className="flex items-center justify-between gap-2 px-3 py-2">
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium">{a.email}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {a.note ? `${a.note} · ` : ''}added {formatDate(a.addedAt)}{a.addedByEmail ? ` by ${a.addedByEmail}` : ''}
                  </span>
                </div>
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemove(a.email)}
                    disabled={removing === a.email}
                    aria-label={`Stop protecting ${a.email}`}
                  >
                    {removing === a.email ? <Loader2 className="animate-spin" aria-hidden="true" /> : <X aria-hidden="true" />}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};
