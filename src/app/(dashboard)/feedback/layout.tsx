import { denyUnlessAccess } from '@/lib/guard';

/**
 * Permission gate for the feedback form. The page itself is a Client Component, so the
 * check lives in this server layout.
 */
export default async function FeedbackLayout({ children }: { children: React.ReactNode }) {
  const denied = await denyUnlessAccess('general.feedback');
  if (denied) return denied;

  return <>{children}</>;
}
