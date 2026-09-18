import { auth } from '@/lib/auth';
import { checkAccess } from '@/lib/permissions';
import { AccessDenied } from '@/components/access-denied';

export default async function ManageMasterDataLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  const hasAccess = await checkAccess(userId, 'manage.master_data', 'view');
  
  if (!hasAccess) {
    return <AccessDenied resourceId="manage.master_data" backHref="/manage" backLabel="Back to Manage" />;
  }

  return <>{children}</>;
}
