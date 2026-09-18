import { auth } from '@/lib/auth';
import { checkAccess } from '@/lib/permissions';
import { AccessDenied } from '@/components/access-denied';

export default async function ManageAlumniNetworkLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  const hasAccess = await checkAccess(userId, 'manage.alumni_network', 'view');
  
  if (!hasAccess) {
    return <AccessDenied resourceId="manage.alumni_network" backHref="/manage" backLabel="Back to Manage" />;
  }

  return <>{children}</>;
}
