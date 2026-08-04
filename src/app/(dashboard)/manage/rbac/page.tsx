import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { isTrueAdmin } from '@/lib/roles';
import { RbacGrid } from './_components/rbac-grid';
import { RbacAuditLog } from './_components/rbac-audit-log';
import { ShieldAlert } from 'lucide-react';

export default async function RbacPage() {
  const isAdmin = await isTrueAdmin();
  if (!isAdmin) {
    redirect('/');
  }

  const supabase = await createClient();
  const { data: permissions, error } = await supabase
    .from('role_permissions')
    .select('*')
    .order('role', { ascending: true });

  const { data: logs, error: logsError } = await supabase
    .from('rbac_audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50); // Get latest 50 logs

  // Custom sort to keep roles in logical order
  const order = ['Super Admin', 'Admin', 'Manager', 'Program', 'Operations', 'Viewer', 'Member'];
  const sortedPermissions = (permissions || []).sort((a, b) => {
    return order.indexOf(a.role) - order.indexOf(b.role);
  });

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-primary/10 to-indigo-500/10 text-primary rounded-xl border border-primary/20 shadow-inner">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground/80">
              Role-Based Access Control (RBAC)
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Configure which page clusters each user role can access.
            </p>
          </div>
        </div>
      </div>

      {error && error.code === '42P01' ? (
        <div className="bg-destructive/10 text-destructive border border-destructive/20 p-6 rounded-xl flex flex-col gap-2">
          <h2 className="font-bold text-lg">Database Table Missing</h2>
          <p>
            The <code>role_permissions</code> table does not exist yet. Please run the provided SQL script in the Supabase SQL Editor.
          </p>
        </div>
      ) : (
        <>
          <RbacGrid initialData={sortedPermissions as any} />
          {logsError && logsError.code === '42P01' ? (
            <div className="mt-8 bg-yellow-500/10 text-yellow-600 border border-yellow-500/20 p-4 rounded-xl">
              <h2 className="font-bold">Audit Logs Table Missing</h2>
              <p className="text-sm">Please run the SQL script to create <code>rbac_audit_logs</code> to enable edit tracking and rollback features.</p>
            </div>
          ) : (
            <RbacAuditLog logs={logs as any || []} />
          )}
        </>
      )}
    </div>
  );
}
