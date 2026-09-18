import { denyUnlessAccess } from '@/lib/guard';

/**
 * Permission gate for the Coursera report import tool. The page itself is a Client Component, so the
 * check lives in this server layout.
 */
export default async function ImportCourseraLayout({ children }: { children: React.ReactNode }) {
  const denied = await denyUnlessAccess('data_management.import_coursera', 'view', { backHref: '/data-management', backLabel: 'Back to Data Management' });
  if (denied) return denied;

  return <>{children}</>;
}
