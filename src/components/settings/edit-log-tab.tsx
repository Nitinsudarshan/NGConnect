"use client"

import React, { useState } from "react"
import { History, Search, Activity, Calendar, User } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LearningCenterAuditLog } from "@/lib/learning-center/queries"

/** LC-native entity types */
const LC_ENTITY_TYPES = ["mentor", "audience", "session_type", "integration", "category", "subcategory"]
/** Alumni-growth entity types prefix */
const ALUMNI_PREFIX = "alumni_"

interface EditLogTabProps {
  logs: LearningCenterAuditLog[]
  /**
   * "learning_hub" → show only LC-native entity types
   * "alumni_growth" → show only alumni_ prefixed entity types
   * undefined → show all
   */
  sourceFilter?: "learning_hub" | "alumni_growth"
}

export function EditLogTab({ logs, sourceFilter }: EditLogTabProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [entityFilter, setEntityFilter] = useState<string>("all")
  const [actionFilter, setActionFilter] = useState<string>("all")
  const [page, setPage] = useState(1)

  const ITEMS_PER_PAGE = 10

  // Reset page when filters change
  React.useEffect(() => {
    setPage(1)
  }, [searchTerm, entityFilter, actionFilter])

  // Pre-filter by source
  const sourceLogs = logs.filter((log) => {
    if (!sourceFilter) return true
    if (sourceFilter === "learning_hub") return LC_ENTITY_TYPES.includes(log.entity_type)
    if (sourceFilter === "alumni_growth") return log.entity_type.startsWith(ALUMNI_PREFIX)
    return true
  })

  const filteredLogs = sourceLogs.filter((log) => {
    const matchesSearch =
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.user_email && log.user_email.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesEntity = entityFilter === "all" || log.entity_type === entityFilter
    const matchesAction = actionFilter === "all" || log.action === actionFilter

    return matchesSearch && matchesEntity && matchesAction
  })

  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE)
  const currentLogs = filteredLogs.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  const getEntityBadge = (entityType: string) => {
    switch (entityType) {
      // LC types
      case "mentor":
        return <Badge variant="outline" className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800">Mentor</Badge>
      case "audience":
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800">Audience</Badge>
      case "session_type":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800">Session Type</Badge>
      case "integration":
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">Integration</Badge>
      case "category":
        return <Badge variant="outline" className="bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300 border-violet-200 dark:border-violet-800">Category</Badge>
      case "subcategory":
        return <Badge variant="outline" className="bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-950/40 dark:text-fuchsia-300 border-fuchsia-200 dark:border-fuchsia-800">Subcategory</Badge>
      // Alumni-growth types
      case "alumni_org_settings":
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border-orange-200 dark:border-orange-800">Org Settings</Badge>
      case "alumni_outcome":
        return <Badge variant="outline" className="bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border-teal-200 dark:border-teal-800">Outcome</Badge>
      case "alumni_pipeline_stage":
        return <Badge variant="outline" className="bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200 dark:border-sky-800">Pipeline Stage</Badge>
      case "alumni_contribution_type":
        return <Badge variant="outline" className="bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800">Contribution Type</Badge>
      case "alumni_mentor":
        return <Badge variant="outline" className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800">Mentor</Badge>
      default:
        return <Badge variant="outline" className="capitalize">{entityType.replace("alumni_", "")}</Badge>
    }
  }

  const getActionBadge = (action: string) => {
    switch (action) {
      case "create":
        return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white capitalize">Create</Badge>
      case "update":
        return <Badge className="bg-blue-500 hover:bg-blue-600 text-white capitalize">Update</Badge>
      case "delete":
        return <Badge className="bg-red-500 hover:bg-red-600 text-white capitalize">Delete</Badge>
      case "archive":
        return <Badge className="bg-amber-500 hover:bg-amber-600 text-white capitalize">Archive</Badge>
      case "connect":
        return <Badge className="bg-teal-500 hover:bg-teal-600 text-white capitalize">Connect</Badge>
      case "disconnect":
        return <Badge className="bg-rose-500 hover:bg-rose-600 text-white capitalize">Disconnect</Badge>
      default:
        return <Badge variant="secondary" className="capitalize">{action}</Badge>
    }
  }

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return new Intl.DateTimeFormat("en-IN", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date)
    } catch {
      return dateStr
    }
  }

  // Build entity type options based on source filter
  const entityOptions =
    sourceFilter === "learning_hub"
      ? LC_ENTITY_TYPES
      : sourceFilter === "alumni_growth"
        ? ["alumni_org_settings", "alumni_outcome", "alumni_pipeline_stage", "alumni_contribution_type", "alumni_mentor"]
        : [...LC_ENTITY_TYPES, "alumni_org_settings", "alumni_outcome", "alumni_pipeline_stage", "alumni_contribution_type"]

  const titleText =
    sourceFilter === "learning_hub"
      ? "Learning Hub Edit Log"
      : sourceFilter === "alumni_growth"
        ? "Alumni Growth Edit Log"
        : "Edit Log"

  const descriptionText =
    sourceFilter === "learning_hub"
      ? "Track changes made within Learning Center settings — Mentors, Audiences, Session Types, Categories, and Integrations."
      : sourceFilter === "alumni_growth"
        ? "Track changes made within Alumni Growth settings — Org Rules, Outcomes, Pipeline Stages, Contribution Types, and Mentors."
        : "Track all settings changes across the platform."

  return (
    <div className="space-y-6">
      <Card className="border shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-500" /> {titleText}
              </CardTitle>
              <CardDescription>{descriptionText}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="px-3 py-1 font-mono text-xs">
                {filteredLogs.length} / {sourceLogs.length} entries
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Controls / Filters */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search details or user email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="All Entities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Entities</SelectItem>
                  {entityOptions.map((type) => (
                    <SelectItem key={type} value={type} className="capitalize">
                      {type.replace("alumni_", "").replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="archive">Archive</SelectItem>
                  <SelectItem value="connect">Connect</SelectItem>
                  <SelectItem value="disconnect">Disconnect</SelectItem>
                </SelectContent>
              </Select>

              {(searchTerm || entityFilter !== "all" || actionFilter !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setSearchTerm(""); setEntityFilter("all"); setActionFilter("all") }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="border rounded-md bg-card overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[160px]">Timestamp</TableHead>
                  <TableHead className="w-[150px]">Entity</TableHead>
                  <TableHead className="w-[110px]">Action</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead className="w-[200px]">Performed By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Activity className="w-8 h-8 text-slate-300 dark:text-slate-700" />
                        <p>No audit log entries found matching your filters.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  currentLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(log.created_at)}
                        </div>
                      </TableCell>
                      <TableCell>{getEntityBadge(log.entity_type)}</TableCell>
                      <TableCell>{getActionBadge(log.action)}</TableCell>
                      <TableCell className="font-medium text-sm text-foreground">
                        {log.details}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-muted-foreground" />
                          {log.user_email || "System User"}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-2 text-sm text-muted-foreground px-2">
              <div>
                Showing {(page - 1) * ITEMS_PER_PAGE + 1} to {Math.min(page * ITEMS_PER_PAGE, filteredLogs.length)} of {filteredLogs.length} entries
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
