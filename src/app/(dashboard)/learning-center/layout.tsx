import { ReactNode } from "react";

/**
 * Learning Center shell.
 *
 * Route gating lives on each page (`denyUnlessAccess`) so that access follows
 * the RBAC matrix rather than a hardcoded role list, and so a user who opens a
 * restricted link sees why instead of being bounced elsewhere.
 */
export default function LearningCenterLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col flex-1 h-full w-full">
      {children}
    </div>
  );
}
