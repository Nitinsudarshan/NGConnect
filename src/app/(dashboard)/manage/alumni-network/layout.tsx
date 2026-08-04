import { redirect } from 'next/navigation';
import { getUserRole } from '@/lib/roles';
import { checkAccess } from '@/lib/permissions';

export default async function ManageAlumniNetworkLayout({ children }: { children: React.ReactNode }) {
  const role = await getUserRole();
  const hasAccess = await checkAccess(role, 'manage_alumni_network');
  
  if (!hasAccess) {
    redirect('/');
  }

  return <>{children}</>;
}
