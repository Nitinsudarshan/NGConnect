import { denyUnlessAccess } from '@/lib/guard';

/**
 * Permission gate for a session recording. The page itself is a Client Component, so the
 * check lives in this server layout.
 */
export default async function RecordingLayout({ children }: { children: React.ReactNode }) {
  const denied = await denyUnlessAccess('learning_center.recordings', 'view', { backHref: '/learning-center/recordings', backLabel: 'Back to Past Sessions' });
  if (denied) return denied;

  return <>{children}</>;
}
