import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { checkAccess } from '@/lib/permissions';
import { RbacGrid } from './_components/rbac-grid';
import { RbacAuditLog } from './_components/rbac-audit-log';
import { ShieldAlert } from 'lucide-react';
import { HelpModal } from '@/components/shared/HelpModal';

export default async function RbacPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const canView = await checkAccess(user?.id ?? null, "manage.rbac", "view");
  if (!canView) {
    redirect('/');
  }
  const canEdit = await checkAccess(user?.id ?? null, "manage.rbac", "edit");

  const { data: permissions, error } = await supabase
    .from('rbac_permissions')
    .select('*');

  const { data: logs, error: logsError } = await supabase
    .from('rbac_audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50); // Get latest 50 logs

  const adminClient = createAdminClient();
  const { data: { users } } = await adminClient.auth.admin.listUsers();
  
  const staffUsers = (users || []).filter(u => {
    const isSuperUser = u.email && ["nitin@navgurukul.org", "nitinsudarshan@gmail.com"].includes(u.email.toLowerCase());
    const role = isSuperUser ? "Super Admin" : (u.user_metadata?.role || "Member");
    return role !== "Member" && role !== "Super Admin";
  }).map(u => ({
    id: u.id,
    name: u.user_metadata?.full_name || u.user_metadata?.name || '',
    email: u.email || '',
    role: (u.email && ["nitin@navgurukul.org", "nitinsudarshan@gmail.com"].includes(u.email.toLowerCase())) ? "Super Admin" : (u.user_metadata?.role || "Member"),
    team: u.user_metadata?.team || "None"
  }));

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
        <div className="flex items-center gap-2">
          <HelpModal helpId="manage.rbac" />
        </div>
      </div>

      {error && error.code === '42P01' ? (
        <div className="bg-destructive/10 text-destructive border border-destructive/20 p-6 rounded-xl flex flex-col gap-2">
          <h2 className="font-bold text-lg">Database Table Missing</h2>
          <p>
            The <code>rbac_permissions</code> table does not exist yet. Please run the provided SQL script in the Supabase SQL Editor.
          </p>
        </div>
      ) : (
        <>
          <RbacGrid initialData={permissions as any || []} canEdit={canEdit} users={staffUsers} />
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
