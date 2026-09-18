import { denyUnlessAccess } from '@/lib/guard';

/**
 * Permission gate for the Coursera learner enrolment tool. The page itself is a Client Component, so the
 * check lives in this server layout.
 */
export default async function CourseraEnrollLayout({ children }: { children: React.ReactNode }) {
  const denied = await denyUnlessAccess('data_management.coursera_enroll', 'view', { backHref: '/data-management', backLabel: 'Back to Data Management' });
  if (denied) return denied;

  return <>{children}</>;
}
