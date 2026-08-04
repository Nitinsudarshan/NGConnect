import { redirect } from 'next/navigation';
import { getUserRole } from '@/lib/roles';
import { checkAccess } from '@/lib/permissions';

export default async function CrmLayout({ children }: { children: React.ReactNode }) {
  const role = await getUserRole();
  const hasAccess = await checkAccess(role, 'crm');
  
  if (!hasAccess) {
    redirect('/');
  }

  return <>{children}</>;
}
