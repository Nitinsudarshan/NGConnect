import React from "react";
import { RequestsClient } from "./RequestsClient";
import { denyUnlessAccess } from '@/lib/guard';

export const metadata = {
  title: "Member Growth Requests | NGConnect",
  description: "Manage Coursera Enterprise access requests and Pay-Forward alumni submissions.",
};

export default async function RequestsPage() {
  const denied = await denyUnlessAccess('crm.requests');
  if (denied) return denied;

  return <RequestsClient />;
}
