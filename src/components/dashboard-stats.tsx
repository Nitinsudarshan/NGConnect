"use client"

import React, { useMemo } from "react"
import {
  Users,
  Layers,
  Activity,
  Info,
  CheckCircle2
} from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { UserRole, UserTeam } from "@/lib/roles"

interface DashboardStatsProps {
  initialUsers: any[]
  error?: string | null
}

const SUPER_ADMINS = ["nitin@navgurukul.org", "nitinsudarshan@gmail.com"]

export function DashboardStats({ initialUsers, error }: DashboardStatsProps) {
  // Helper to standardise user attributes (filters only Alumni)
  const users = useMemo(() => {
    return (initialUsers || [])
      .map(u => {
        const metadata = u.user_metadata || {}
        const email = u.email || ""
        const isSuper = SUPER_ADMINS.includes(email.toLowerCase())

        const appRole = (isSuper ? "Super Admin" : (metadata.role || "Viewer")) as UserRole
        const appTeam = (metadata.team || "None") as UserTeam
        const isUserAlumni = metadata.is_alumni !== false

        return {
          ...u,
          name: metadata.full_name || metadata.name || "Unknown User",
          appRole,
          appTeam,
          isUserAlumni,
          createdAtDate: new Date(u.created_at),
          lastSignInDate: u.last_sign_in_at ? new Date(u.last_sign_in_at) : null
        }
      })
      .filter(user => user.isUserAlumni) // Filter ONLY Alumni members!
  }, [initialUsers])

  // General stats summaries
  const stats = useMemo(() => {
    const total = users.length
    const activated = users.filter(u => u.lastSignInDate !== null).length
    const withTeam = users.filter(u => u.appTeam !== "None").length

    // Active in last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const activeRecently = users.filter(u => u.lastSignInDate && u.lastSignInDate >= sevenDaysAgo).length

    const activationPercentage = total > 0 ? Math.round((activated / total) * 100) : 0
    const teamPercentage = total > 0 ? Math.round((withTeam / total) * 100) : 0
    const activePercentage = total > 0 ? Math.round((activeRecently / total) * 100) : 0

    return {
      total,
      activated,
      activationPercentage,
      withTeam,
      teamPercentage,
      activeRecently,
      activePercentage
    }
  }, [users])

  if (error) {
    return (
      <Card className="border-red-200 dark:border-red-950/50 bg-red-50/50 dark:bg-red-950/10 p-6 rounded-md">
        <div className="flex gap-3 items-start text-red-700 dark:text-red-400">
          <Info className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-bold text-lg">Failed to load statistics</h3>
            <p className="text-sm mt-1 opacity-90">{error}</p>
            <p className="text-xs mt-2 text-muted-foreground">
              Please verify your Supabase service credentials or database schema.
            </p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stat Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Total Alumni */}
        <div className="bg-card/60 backdrop-blur-md border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Alumni</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
            </div>
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/40 transition-colors">
              <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-slate-500 font-medium">
            Active Alumni members
          </div>
        </div>

        {/* Activation Rate */}
        <div className="bg-card/60 backdrop-blur-md border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Activation Rate</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">
                {stats.activated} <span className="text-lg text-slate-400">/ {stats.total}</span>
              </p>
            </div>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/40 transition-colors">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-md text-xs">
              <i className="fa-solid fa-arrow-up mr-1 text-[10px]"></i> {stats.activationPercentage}%
            </span>
            <span className="text-slate-500 ml-2 font-medium text-xs">logged in at least once</span>
          </div>
        </div>

        {/* Team Coverage */}
        <div className="bg-card/60 backdrop-blur-md border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Team Coverage</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.withTeam}</p>
            </div>
            <div className="p-2 bg-pink-50 dark:bg-pink-900/20 rounded-lg group-hover:bg-pink-100 dark:group-hover:bg-pink-900/40 transition-colors">
              <Layers className="w-5 h-5 text-pink-600 dark:text-pink-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-pink-600 dark:text-pink-400 font-medium flex items-center bg-pink-50 dark:bg-pink-900/20 px-2 py-0.5 rounded-md text-xs">
              <i className="fa-solid fa-arrow-up mr-1 text-[10px]"></i> {stats.teamPercentage}%
            </span>
            <span className="text-slate-500 ml-2 font-medium text-xs">assigned to functional teams</span>
          </div>
        </div>
      </div>
    </div>
  )
}
