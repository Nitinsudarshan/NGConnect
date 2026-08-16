import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { checkAccess } from "@/lib/permissions";
import { getManageReportData } from "@/lib/engagement/queries";
import ManageReportsClient from "./ManageReportsClient";

export default async function ManageReportsPage() {
  const { userId } = await auth();
  const hasAccess = await checkAccess(userId, "manage.rbac", "view") || await checkAccess(userId, "reports", "view");

  if (!hasAccess) {
    redirect("/");
  }

  const data = await getManageReportData();

  return <ManageReportsClient data={data} />;
}
