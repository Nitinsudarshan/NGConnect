import { auth } from '@/lib/auth';
import { checkClusterAccess } from '@/lib/permissions';
import { AccessDenied } from '@/components/access-denied';

export default async function DataManagementLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  const hasAccess = await checkClusterAccess(userId, 'data_management');
  
  if (!hasAccess) {
    return <AccessDenied description="Your role does not include access to Data Management. Ask an administrator to grant it from the RBAC matrix." />;
  }

  return <>{children}</>;
}
