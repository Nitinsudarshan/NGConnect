"use client"

import * as React from "react"
import {
  BookOpen,
  LifeBuoy,
  Send,
  LayoutDashboard,
  Fingerprint,
  Users,
  GraduationCap,
  Database,
  DatabaseBackup,
  Briefcase,
  CalendarClock,
  HeartHandshake,
  BarChart,
  Settings,
  TrendingUp,
  ShieldCheck,
  FileQuestion,
  Mail,
  Inbox,
} from "lucide-react"

import { NavMain, NavItem } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { CourseraSidebarBanner } from "@/components/learning-center/coursera-sidebar-banner"
import { PayForwardSidebarBanner } from "@/components/pay-forward-sidebar-banner"
import { SidebarVersionFooter } from "@/components/sidebar-version-footer"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useUserContext } from "@/contexts/user-context"
import { useCan, useCanAny } from "@/contexts/permission-context"
import { getResourceIdsByPrefix } from "@/lib/resource-tree"

const CRM_SETTINGS_RESOURCES = getResourceIdsByPrefix('crm.settings.')
const LC_SETTINGS_RESOURCES = getResourceIdsByPrefix('learning_center.settings.')
const DATA_MANAGEMENT_RESOURCES = getResourceIdsByPrefix('data_management.')

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { setOpenMobile, isMobile } = useSidebar()
  const pathname = usePathname()
  const user = useUserContext()
  const can = useCan()
  const canAny = useCanAny()
  // Role only decides wording (a Member sees "Past Sessions" / "Learning Hub");
  // what is actually listed is decided by the RBAC matrix.
  const isExcludedRole = user?.role === "Member" || user?.role === "Viewer"

  const navSecondary = [
    ...(can("general.docs") ? [
      {
        title: "Documentation",
        url: "/docs",
        icon: BookOpen,
        isActive: pathname.startsWith("/docs"),
      },
    ] : []),
    ...(can("general.support") ? [
      {
        title: "Support",
        url: "/support",
        icon: LifeBuoy,
        isActive: pathname === "/support",
      },
    ] : []),
    ...(can("general.feedback") ? [
      {
        title: "Feedback",
        url: "/feedback",
        icon: Send,
        isActive: pathname === "/feedback",
      },
    ] : []),
  ]

  const learningCenterItems: NavItem[] = [
    ...(can("learning_center.dashboard") ? [
      {
        title: "Dashboard",
        url: "/learning-center",
        isActive: pathname === "/learning-center",
      },
    ] : []),
    ...(can("learning_center.sessions") ? [
      {
        title: "Sessions",
        url: "/learning-center/sessions",
        isActive: pathname.startsWith("/learning-center/sessions"),
      },
    ] : []),
    ...(can("learning_center.recordings") ? [
      {
        title: "Past Sessions",
        url: "/learning-center/recordings",
        isActive: pathname.startsWith("/learning-center/recordings"),
      },
    ] : []),
    ...(can("learning_center.content_hub") ? [
      {
        title: isExcludedRole ? "Learning Hub" : "Content Hub",
        url: "/learning-center/content-hub",
        isActive: pathname.startsWith("/learning-center/content-hub"),
      },
    ] : []),
    ...(can("learning_center.reports") ? [
      {
        title: "Reports",
        url: "/learning-center/reports",
        isActive: pathname === "/learning-center/reports",
      },
    ] : []),
    ...(canAny(LC_SETTINGS_RESOURCES) ? [
      {
        title: "Settings",
        url: "/learning-center/settings",
        isActive: pathname.startsWith("/learning-center/settings"),
      },
    ] : []),
  ];

  const navGeneral: NavItem[] = [
    ...(can("dashboard") ? [
      {
        title: "Dashboard",
        url: "/",
        icon: LayoutDashboard,
        isActive: pathname === "/",
      },
    ] : []),
    ...(learningCenterItems.length > 0 ? [
      {
        title: "Learning Center",
        url: learningCenterItems[0].url,
        icon: GraduationCap,
        isActive: pathname.startsWith("/learning-center"),
        items: learningCenterItems,
      },
    ] : []),
  ];

  const manageItems: NavItem[] = [
    ...(can("manage.users") ? [
      {
        title: "Users",
        url: "/manage/users",
        icon: Users,
        isActive: pathname === "/manage/users",
      },
    ] : []),
    ...(can("manage.alumni_network") ? [
      {
        title: "Alumni Network",
        url: "/manage/alumni-network",
        icon: GraduationCap,
        isActive: pathname === "/manage/alumni-network",
      },
    ] : []),
    ...(can("manage.reports") ? [
      {
        title: "Reports",
        url: "/manage/reports",
        icon: BarChart,
        isActive: pathname === "/manage/reports",
      },
    ] : []),
    ...(canAny(DATA_MANAGEMENT_RESOURCES) ? [
      {
        title: "Data Management",
        url: "/data-management",
        icon: DatabaseBackup,
        isActive: pathname === "/data-management",
      },
    ] : []),
    ...(can("manage.master_data") ? [
      {
        title: "Master Data",
        url: "/manage/master-data",
        icon: Database,
        isActive: pathname === "/manage/master-data",
      },
    ] : []),
    ...(can("manage.rbac") ? [
      {
        title: "RBAC",
        url: "/manage/rbac",
        icon: ShieldCheck,
        isActive: pathname === "/manage/rbac",
      },
    ] : []),
    ...(can("manage.notifications") ? [
      {
        title: "Notifications",
        url: "/manage/notifications",
        icon: Mail,
        isActive: pathname.startsWith("/manage/notifications"),
      },
    ] : []),
    ...(can("manage.help") ? [
      {
        title: "Help Docs",
        url: "/manage/help",
        icon: FileQuestion,
        isActive: pathname === "/manage/help",
      },
    ] : []),
    ...(can("manage.diagnostics") ? [
      {
        title: "Auth Diagnostics",
        url: "/manage/diagnostics/auth",
        icon: ShieldCheck,
        isActive: pathname.startsWith("/manage/diagnostics/auth"),
      },
    ] : []),
  ];

  const navManage: NavItem[] = manageItems.length > 0 ? [
    {
      title: "Manage",
      url: "/manage",
      icon: Settings,
      isActive: pathname.startsWith("/manage") || pathname.startsWith("/data-management"),
      items: manageItems,
    }
  ] : [];

  const alumniGrowthItems: NavItem[] = [
    ...(can("crm.workspace") ? [
      {
        title: "Workspace",
        url: "/alumni-growth/workspace",
        icon: Briefcase,
        isActive: pathname === "/alumni-growth/workspace",
      },
    ] : []),
    ...(can("crm.requests") ? [
      {
        title: "Requests",
        url: "/alumni-growth/requests",
        icon: Inbox,
        isActive: pathname === "/alumni-growth/requests",
      },
    ] : []),
    ...(can("crm.pipelines.pay_forward") ? [
      {
        title: "Pay-Forward Board",
        url: "/alumni-growth/pipelines/pay-forward",
        icon: HeartHandshake,
        isActive: pathname === "/alumni-growth/pipelines/pay-forward",
      },
    ] : []),
    ...(can("crm.pipelines.mentoring") ? [
      {
        title: "Mentoring Board",
        url: "/alumni-growth/pipelines/mentoring",
        icon: GraduationCap,
        isActive: pathname === "/alumni-growth/pipelines/mentoring",
      },
    ] : []),
    ...(can("crm.pipelines.placement") ? [
      {
        title: "Placement Board",
        url: "/alumni-growth/pipelines/placement",
        icon: Briefcase,
        isActive: pathname === "/alumni-growth/pipelines/placement",
      },
    ] : []),
    ...(can("crm.follow_ups") ? [
      {
        title: "Follow-ups",
        url: "/alumni-growth/follow-ups",
        icon: CalendarClock,
        isActive: pathname === "/alumni-growth/follow-ups",
      },
    ] : []),
    ...(can("crm.reports") ? [
      {
        title: "Reports",
        url: "/alumni-growth/reports",
        icon: BarChart,
        isActive: pathname === "/alumni-growth/reports",
      },
    ] : []),
    ...(canAny(CRM_SETTINGS_RESOURCES) ? [
      {
        title: "Settings",
        url: "/alumni-growth/settings",
        icon: Settings,
        isActive: pathname === "/alumni-growth/settings",
      },
    ] : []),
  ];

  const navAlumniGrowth: NavItem[] = alumniGrowthItems.length > 0 ? [
    {
      title: "Alumni Growth",
      url: alumniGrowthItems[0].url,
      icon: TrendingUp,
      isActive: pathname.startsWith("/alumni-growth"),
      items: alumniGrowthItems,
    },
  ] : [];

  return (
    <Sidebar
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link
                href="/"
                onClick={() => {
                  if (isMobile) setOpenMobile(false)
                }}
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground [&_svg]:size-6">
                  <Fingerprint />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">NGConnect</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Admin Workspace
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={[
          ...navGeneral,
          ...navAlumniGrowth,
          ...navManage,
        ]} />
        <div className="mt-auto flex flex-col">
          <NavSecondary items={navSecondary} />
          {user?.role === "Member" && <CourseraSidebarBanner />}
          {user?.role === "Member" && <PayForwardSidebarBanner />}
        </div>
      </SidebarContent>
      <SidebarFooter className="p-0 border-t-0">
        <SidebarVersionFooter />
      </SidebarFooter>
    </Sidebar>
  )
}
