import { denyUnlessAccess } from '@/lib/guard';

/**
 * Permission gate for the greetings copy preview — a developer tool, so it
 * rides along with the documentation permission.
 */
export default async function GreetingsLayout({ children }: { children: React.ReactNode }) {
  const denied = await denyUnlessAccess('general.docs');
  if (denied) return denied;

  return <>{children}</>;
}
