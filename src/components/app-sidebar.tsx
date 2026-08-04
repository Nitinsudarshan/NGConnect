"use client"

import * as React from "react"
import {
  BookOpen,
  LifeBuoy,
  Send,
  LayoutDashboard,
  GalleryVerticalEnd,
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
} from "lucide-react"

import { NavMain, NavItem } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import Link from "next/link"
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
  const user = useUserContext()
  const isExcludedRole = user?.role === "Member" || user?.role === "Viewer"

  const navGeneral: NavItem[] = [
    {
      title: "Dashboard",
      url: "/",
      icon: LayoutDashboard,
      isActive: true,
    },
    ...(isExcludedRole ? [] : [
      {
        title: "Reports",
        url: "/reports",
        icon: BarChart,
      }
    ]),
  ];

  const navManage: NavItem[] = [
    {
      title: "Users",
      url: "/manage/users",
      icon: Users,
    },
    {
      title: "Alumni Network",
      url: "/manage/alumni-network",
      icon: GraduationCap,
    },
    {
      title: "Data Management",
      url: "/data-management",
      icon: DatabaseBackup,
    },
    {
      title: "Master Data",
      url: "/manage/master-data",
      icon: Database,
    },
    ...(user?.role === "Super Admin" || user?.role === "Admin" ? [
      {
        title: "RBAC",
        url: "/manage/rbac",
        icon: ShieldCheck,
      }
    ] : []),
  ];

  const navAlumniGrowth: NavItem[] = [
    {
      title: "Workspace",
      url: "/alumni-growth/workspace",
      icon: Briefcase,
    },
    {
      title: "Followups",
      url: "/alumni-growth/follow-ups",
      icon: CalendarClock,
    },
    {
      title: "All Data",
      url: "/alumni-growth/all-data",
      icon: Database,
    },
    {
      title: "Reports",
      url: "/alumni-growth/reports",
      icon: BarChart,
    },
    {
      title: "Settings",
      url: "/alumni-growth/settings",
      icon: Settings,
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
                <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <GalleryVerticalEnd className="size-4" />
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
        <NavMain items={navGeneral} />
        {!isExcludedRole && (
          <>
            <NavMain items={navAlumniGrowth} label="Alumni Growth" />
            <NavMain items={navManage} label="Manage" />
            <NavSecondary items={data.navSecondary} className="mt-auto" />
          </>
        )}
      </SidebarContent>
    </Sidebar>
  )
}
