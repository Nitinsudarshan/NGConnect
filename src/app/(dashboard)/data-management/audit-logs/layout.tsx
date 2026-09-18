import { denyUnlessAccess } from '@/lib/guard';

/**
 * Permission gate for the audit logs. The page itself is a Client Component, so the
 * check lives in this server layout.
 */
export default async function AuditLogsLayout({ children }: { children: React.ReactNode }) {
  const denied = await denyUnlessAccess('data_management.audit_logs', 'view', { backHref: '/data-management', backLabel: 'Back to Data Management' });
  if (denied) return denied;

  return <>{children}</>;
}
