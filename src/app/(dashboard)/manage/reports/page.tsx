import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { checkAccess } from "@/lib/permissions";
import { getManageReportData } from "@/lib/engagement/queries";
import ManageReportsClient from "./ManageReportsClient";
import { AccessDenied } from '@/components/access-denied';

export default async function ManageReportsPage() {
  const { userId } = await auth();
  const hasAccess = await checkAccess(userId, "manage.reports", "view");

  if (!hasAccess) {
    return <AccessDenied resourceId="manage.reports" backHref="/manage" backLabel="Back to Manage" />;
  }

  const data = await getManageReportData();

  return <ManageReportsClient data={data} />;
}
