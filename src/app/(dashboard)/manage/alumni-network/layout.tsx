import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getUserRole } from '@/lib/roles';
import { checkAccess } from '@/lib/permissions';

export default async function ManageAlumniNetworkLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  const hasAccess = await checkAccess(userId, 'manage.alumni_network', 'view');
  
  if (!hasAccess) {
    redirect('/');
  }

  return <>{children}</>;
}
