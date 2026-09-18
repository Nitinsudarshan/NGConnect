import { denyUnlessAccess } from '@/lib/guard';

/**
 * Permission gate for the developer documentation hub. The page itself is a Client Component, so the
 * check lives in this server layout.
 */
export default async function DocsLayout({ children }: { children: React.ReactNode }) {
  const denied = await denyUnlessAccess('general.docs');
  if (denied) return denied;

  return <>{children}</>;
}
