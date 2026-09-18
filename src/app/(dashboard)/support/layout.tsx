import { denyUnlessAccess } from '@/lib/guard';

/**
 * Permission gate for the support desk. The page itself is a Client Component, so the
 * check lives in this server layout.
 */
export default async function SupportLayout({ children }: { children: React.ReactNode }) {
  const denied = await denyUnlessAccess('general.support');
  if (denied) return denied;

  return <>{children}</>;
}
