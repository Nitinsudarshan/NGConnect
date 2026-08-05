import React from "react"
import { getUserRole } from "@/lib/roles"
import ContentHubAdmin from "./admin"
import LearningHubMember from "./member"

export default async function ContentHubPage() {
  const role = await getUserRole()
  const isMember = role === "Member" || role === "Viewer"

  if (isMember) {
    return <LearningHubMember />
  }

  return <ContentHubAdmin />
}
