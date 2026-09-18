import { denyUnlessAccess } from '@/lib/guard';

/**
 * Permission gate for a Content Hub course. The page itself is a Client Component, so the
 * check lives in this server layout.
 */
export default async function CourseDetailLayout({ children }: { children: React.ReactNode }) {
  const denied = await denyUnlessAccess('learning_center.content_hub', 'view', { backHref: '/learning-center/content-hub', backLabel: 'Back to Content Hub' });
  if (denied) return denied;

  return <>{children}</>;
}
