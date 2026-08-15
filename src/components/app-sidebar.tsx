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

const data = {
  navSecondary: [
    {
      title: "Documentation",
      url: "/docs",
      icon: BookOpen,
    },
    {
      title: "Support",
      url: "#",
      icon: LifeBuoy,
    },
    {
      title: "Feedback",
      url: "#",
      icon: Send,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { setOpenMobile, isMobile } = useSidebar()
  const pathname = usePathname()
  const user = useUserContext()
  const isExcludedRole = user?.role === "Member" || user?.role === "Viewer"

  const navGeneral: NavItem[] = [
    {
      title: "Dashboard",
      url: "/",
      icon: LayoutDashboard,
      isActive: pathname === "/",
    },
    {
      title: "Learning Center",
      url: "/learning-center",
      icon: GraduationCap,
      isActive: pathname.startsWith("/learning-center"),
      items: [
        {
          title: "Dashboard",
          url: "/learning-center",
          isActive: pathname === "/learning-center",
        },
        ...(!isExcludedRole ? [
          {
            title: "Sessions",
            url: "/learning-center/sessions",
            isActive: pathname.startsWith("/learning-center/sessions"),
          },
        ] : [
          {
            title: "Past Sessions",
            url: "/learning-center/recordings",
            isActive: pathname.startsWith("/learning-center/recordings"),
          },
        ]),
        {
          title: isExcludedRole ? "Learning Hub" : "Content Hub",
          url: "/learning-center/content-hub",
          isActive: pathname.startsWith("/learning-center/content-hub"),
        },
        ...(!isExcludedRole ? [
          {
            title: "Settings",
            url: "/learning-center/settings",
            isActive: pathname.startsWith("/learning-center/settings"),
          }
        ] : []),
      ],
    },
    ...(isExcludedRole ? [] : [
      {
        title: "Reports",
        url: "/reports",
        icon: BarChart,
        isActive: pathname.startsWith("/reports"),
      }
    ]),
  ];

  const navManage: NavItem[] = [
    {
      title: "Manage",
      url: "#",
      icon: Settings,
      isActive: pathname.startsWith("/manage") || pathname.startsWith("/data-management"),
      items: [
        {
          title: "Users",
          url: "/manage/users",
          icon: Users,
          isActive: pathname === "/manage/users",
        },
        {
          title: "Alumni Network",
          url: "/manage/alumni-network",
          icon: GraduationCap,
          isActive: pathname === "/manage/alumni-network",
        },
        {
          title: "Data Management",
          url: "/data-management",
          icon: DatabaseBackup,
          isActive: pathname === "/data-management",
        },
        {
          title: "Master Data",
          url: "/manage/master-data",
          icon: Database,
          isActive: pathname === "/manage/master-data",
        },
        ...(user?.role === "Super Admin" || user?.role === "Admin" ? [
          {
            title: "RBAC",
            url: "/manage/rbac",
            icon: ShieldCheck,
            isActive: pathname === "/manage/rbac",
          },
          {
            title: "Notifications",
            url: "/manage/notifications",
            icon: Mail,
            isActive: pathname.startsWith("/manage/notifications"),
          },
          {
            title: "Help Docs",
            url: "/manage/help",
            icon: FileQuestion,
            isActive: pathname === "/manage/help",
          },
        ] : []),
      ],
    }
  ];

  const navAlumniGrowth: NavItem[] = [
    {
      title: "Alumni Growth",
      url: "#",
      icon: TrendingUp,
      isActive: pathname.startsWith("/alumni-growth"),
      items: [
        {
          title: "Workspace",
          url: "/alumni-growth/workspace",
          icon: Briefcase,
          isActive: pathname === "/alumni-growth/workspace",
        },
        {
          title: "Pay-Forward Board",
          url: "/alumni-growth/pipelines/pay-forward",
          icon: HeartHandshake,
          isActive: pathname === "/alumni-growth/pipelines/pay-forward",
        },
        {
          title: "Mentoring Board",
          url: "/alumni-growth/pipelines/mentoring",
          icon: GraduationCap,
          isActive: pathname === "/alumni-growth/pipelines/mentoring",
        },
        {
          title: "Placement Board",
          url: "/alumni-growth/pipelines/placement",
          icon: Briefcase,
          isActive: pathname === "/alumni-growth/pipelines/placement",
        },
        {
          title: "Follow-ups",
          url: "/alumni-growth/follow-ups",
          icon: CalendarClock,
          isActive: pathname === "/alumni-growth/follow-ups",
        },
        {
          title: "Reports",
          url: "/alumni-growth/reports",
          icon: BarChart,
          isActive: pathname === "/alumni-growth/reports",
        },
        {
          title: "Settings",
          url: "/alumni-growth/settings",
          icon: Settings,
          isActive: pathname === "/alumni-growth/settings",
        },
      ],
    },
  ];

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
          ...(!isExcludedRole ? navAlumniGrowth : []),
          ...(!isExcludedRole ? navManage : []),
        ]} />
        <div className="mt-auto flex flex-col">
          <NavSecondary items={data.navSecondary} />
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
