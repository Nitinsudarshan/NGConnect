import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getUserRole } from '@/lib/roles';
import { checkClusterAccess } from '@/lib/permissions';

export default async function DataManagementLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  const hasAccess = await checkClusterAccess(userId, 'data_management');
  
  if (!hasAccess) {
    redirect('/');
  }

  return <>{children}</>;
}
