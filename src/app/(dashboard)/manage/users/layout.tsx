import { redirect } from 'next/navigation';
import { getUserRole } from '@/lib/roles';
import { checkAccess } from '@/lib/permissions';

export default async function ManageUsersLayout({ children }: { children: React.ReactNode }) {
  const role = await getUserRole();
  const hasAccess = await checkAccess(role, 'manage_users');
  
  if (!hasAccess) {
    redirect('/');
  }

  return <>{children}</>;
}
