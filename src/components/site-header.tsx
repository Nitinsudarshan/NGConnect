"use client"

import { SidebarIcon, Fingerprint } from "lucide-react"
import { usePathname } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useSidebar } from "@/components/ui/sidebar"
import { ModeToggle } from "@/components/mode-toggle"
import { DevRoleToggle } from "@/components/dev-role-toggle"
import dynamic from "next/dynamic"
import { useBreadcrumb } from "@/contexts/breadcrumb-context"

const HeaderUserMenu = dynamic(
  () => import("@/components/header-user-menu").then((m) => ({ default: m.HeaderUserMenu })),
  { ssr: false }
)

export function SiteHeader({
  isSuperAdmin,
  ...props
}: any) {
  const { toggleSidebar } = useSidebar()
  const pathname = usePathname()
  const { customTitle } = useBreadcrumb()

  const rawLastSegment = pathname.split('/').pop() || ""
  const decodedLastSegment = decodeURIComponent(rawLastSegment)
  const defaultPageTitle = pathname === "/" ? "Dashboard" :
    decodedLastSegment
      .replace(/-/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase()) || "Dashboard"

  const activePage = customTitle || defaultPageTitle


  return (
    <header className="bg-sidebar sticky top-0 z-50 flex w-full items-center border-b">
      <div className="flex h-(--header-height) w-full items-center gap-2 px-4">
        <Button
          className="h-8 w-8"
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
        >
          <SidebarIcon />
        </Button>
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb className="hidden sm:block">
          <BreadcrumbList>
            {pathname !== "/" && (
              <>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/" className="text-muted-foreground hover:text-foreground">
                    Dashboard
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
              </>
            )}
            <BreadcrumbItem>
              <BreadcrumbPage className="font-semibold text-foreground">{activePage}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto flex items-center gap-2">
          <DevRoleToggle isSuperAdmin={isSuperAdmin} />
          <ModeToggle />
          <HeaderUserMenu />
        </div>
      </div>
    </header>
  )
}
