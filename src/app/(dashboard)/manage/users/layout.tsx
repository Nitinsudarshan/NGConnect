import { auth } from '@/lib/auth';
import { checkAccess } from '@/lib/permissions';
import { AccessDenied } from '@/components/access-denied';

export default async function ManageUsersLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  const hasAccess = await checkAccess(userId, 'manage.users', 'view');
  
  if (!hasAccess) {
    return <AccessDenied resourceId="manage.users" backHref="/manage" backLabel="Back to Manage" />;
  }

  return <>{children}</>;
}
