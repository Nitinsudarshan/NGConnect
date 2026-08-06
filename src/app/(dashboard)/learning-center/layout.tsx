import { ReactNode } from "react";
import { getUserRole } from "@/lib/roles";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export default async function LearningCenterLayout({
  children,
}: {
  children: ReactNode;
}) {
  const role = await getUserRole();
  const isMember = role === "Member" || role === "Viewer";
  
  // A hacky but effective way to get the pathname in a server layout to do route gating
  const headersList = await headers();
  const pathname = headersList.get("x-invoke-path") || "";

  if (isMember) {
    if (
      pathname.startsWith("/learning-center/sessions") ||
      pathname.endsWith("/create") ||
      pathname.endsWith("/settings")
    ) {
      // Members cannot access create, settings, or session management. Redirect to Past Sessions (recordings).
      redirect("/learning-center/recordings");
    }
  } else {
    if (pathname.startsWith("/learning-center/recordings")) {
      // Non-members cannot access Past Sessions (recordings page). Redirect to sessions.
      redirect("/learning-center/sessions");
    }
  }

  return (
    <div className="flex flex-col flex-1 h-full w-full">
      {children}
    </div>
  );
}
