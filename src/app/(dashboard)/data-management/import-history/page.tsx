import { redirect } from 'next/navigation';
import { getUserRole } from '@/lib/roles';
import { createClient } from '@/lib/supabase/server';
import type { ImportBatch } from '@/types/import';
import Link from 'next/link';
import {
  ArrowLeft,
  History,
  RotateCcw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Database,
  ArrowUpRight,
  FileSpreadsheet,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default async function ImportHistoryPage() {
  const role = await getUserRole();
  if (role !== 'Super Admin' && role !== 'Admin' && role !== 'Manager') { // TODO(roles-refactor): confirm access level
    redirect('/');
  }

  const supabase = await createClient();
  const { data: batches } = await supabase
    .from('import_batches')
    .select('*')
    .order('uploaded_at', { ascending: false })
    .limit(100);

  const displayBatches = batches ? (batches as ImportBatch[]) : [];

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-20 animate-in fade-in slide-in-from-bottom-2 duration-300">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/data-management"
            className="p-2 border border-border/80 rounded-md hover:bg-muted transition-all text-muted-foreground hover:text-foreground hover:scale-105"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Import History</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Review history logs and execution logs of all imported datasets.
            </p>
          </div>
        </div>
      </div>



      {/* Main Table */}
      <Card className="border border-border/80 rounded-md overflow-hidden shadow-md bg-card/45 backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse min-w-[65rem]">
            <thead className="bg-muted/50 border-b border-border/60">
              <tr>
                <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Import ID / File</th>
                <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Uploaded By</th>
                <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-[10px] text-muted-foreground text-center">Processed</th>
                <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-[10px] text-emerald-600 dark:text-emerald-400 text-center">Created</th>
                <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-[10px] text-blue-600 dark:text-blue-400 text-center">Updated</th>
                <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-[10px] text-red-600 dark:text-red-400 text-center">Failed</th>
                <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Status</th>
                <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-[10px] text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayBatches.map((batch) => {
                const isCompleted = batch.status === 'completed';
                const isRolledBack = batch.status === 'rolled_back';
                const isFailed = batch.status === 'failed';

                let rowAccentClass = '';
                if (isCompleted) rowAccentClass = 'border-l-[4px] border-l-emerald-500 hover:bg-emerald-500/5';
                else if (isRolledBack) rowAccentClass = 'border-l-[4px] border-l-amber-500 hover:bg-amber-500/5';
                else if (isFailed) rowAccentClass = 'border-l-[4px] border-l-red-500 hover:bg-red-500/5';

                return (
                  <tr key={batch.id} className={`border-t border-border/40 transition-colors ${rowAccentClass}`}>
                    <td className="px-5 py-4 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className={`w-4 h-4 shrink-0 ${isCompleted ? 'text-emerald-500' :
                            isRolledBack ? 'text-amber-500' : 'text-red-500'
                          }`} />
                        <span className="font-mono text-xs font-semibold text-foreground truncate max-w-[16rem]">
                          {batch.file_name}
                        </span>
                      </div>
                      <div className="flex gap-2 text-[10px] text-muted-foreground font-semibold items-center">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{new Date(batch.uploaded_at).toLocaleString('en-IN')}</span>
                        {batch.file_size && (
                          <>
                            <span>•</span>
                            <span>{Math.round(batch.file_size / 1024)} KB</span>
                          </>
                        )}
                      </div>
                      {batch.notes && (
                        <p className="text-xs text-muted-foreground/80 leading-normal max-w-sm italic">
                          "{batch.notes}"
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs text-muted-foreground font-semibold">
                      {batch.uploaded_by_name}
                    </td>
                    <td className="px-5 py-4 text-center font-mono text-xs font-bold text-foreground">
                      {batch.records_processed}
                    </td>
                    <td className="px-5 py-4 text-center font-mono text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                      {batch.records_created}
                    </td>
                    <td className="px-5 py-4 text-center font-mono text-xs text-blue-600 dark:text-blue-400 font-bold">
                      {batch.records_updated}
                    </td>
                    <td className="px-5 py-4 text-center font-mono text-xs text-red-600 dark:text-red-400 font-bold">
                      {batch.records_failed}
                    </td>
                    <td className="px-5 py-4">
                      <Badge
                        variant="outline"
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-md border shadow-sm ${isCompleted ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800' :
                            isFailed ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800' :
                              isRolledBack ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800' :
                                'bg-muted text-muted-foreground'
                          }`}
                      >
                        {batch.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {isCompleted && (role === 'Super Admin' || role === 'Admin') ? (
                        <Link
                          href={`/data-management/rollback?batch=${batch.id}`}
                          className="inline-flex items-center gap-1.5 text-xs text-red-600 hover:text-red-500 font-semibold bg-red-500/10 hover:bg-red-500/15 px-2.5 py-1.5 rounded-md border border-red-500/20 dark:border-red-500/30 transition-all hover:scale-105"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Roll Back
                        </Link>
                      ) : isRolledBack ? (
                        <span className="text-xs text-muted-foreground font-semibold italic bg-muted px-2 py-1.5 rounded-md border border-border/50">Restored</span>
                      ) : (
                        <span className="text-xs text-muted-foreground font-semibold">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
