import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { checkAccess } from "@/lib/permissions";
import { getLearningCenterReportData } from "@/lib/learning-center/queries";
import LearningCenterReportsClient from "./LearningCenterReportsClient";

export default async function LearningCenterReportsPage() {
  const { userId } = await auth();
  const hasAccess = await checkAccess(userId, "learning_center.dashboard", "view") || await checkAccess(userId, "reports", "view");

  if (!hasAccess) {
    redirect("/");
  }

  const supabase = await createClient();

  const [reportData, { data: metricsData }] = await Promise.all([
    getLearningCenterReportData(),
    supabase
      .from("coursera_computed_metrics")
      .select("month, metrics, generated_at")
      .order("month", { ascending: true }),
  ]);

  const availableMonths = (metricsData ?? []).map(m => m.month);

  return (
    <LearningCenterReportsClient
      reportData={reportData}
      metricsData={metricsData ?? []}
      availableMonths={availableMonths}
    />
  );
}
