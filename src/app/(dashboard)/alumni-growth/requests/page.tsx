import React from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { RequestsClient } from "./RequestsClient";

export const metadata = {
  title: "Member Growth Requests | NGConnect",
  description: "Manage Coursera Enterprise access requests and Pay-Forward alumni submissions.",
};

export default async function RequestsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const role = user?.user_metadata?.role || user?.app_metadata?.role;
  if (role === "Member" || role === "Viewer") {
    redirect("/");
  }

  return <RequestsClient />;
}
