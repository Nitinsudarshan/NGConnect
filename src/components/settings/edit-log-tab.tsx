"use client"

import React, { useState } from "react"
import { History, Search, Filter, RefreshCw, User, Calendar, Tag, Activity } from "lucide-react"
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

interface EditLogTabProps {
  logs: LearningCenterAuditLog[]
}

export function EditLogTab({ logs }: EditLogTabProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [entityFilter, setEntityFilter] = useState<string>("all")
  const [actionFilter, setActionFilter] = useState<string>("all")

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.user_email && log.user_email.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesEntity = entityFilter === "all" || log.entity_type === entityFilter
    const matchesAction = actionFilter === "all" || log.action === actionFilter

    return matchesSearch && matchesEntity && matchesAction
  })

  const getEntityBadge = (entityType: string) => {
    switch (entityType) {
      case "mentor":
        return <Badge variant="outline" className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800">Mentor</Badge>
      case "audience":
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800">Audience</Badge>
      case "session_type":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800">Session Type</Badge>
      case "integration":
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">Integration</Badge>
      default:
        return <Badge variant="outline">{entityType}</Badge>
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
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(date)
    } catch {
      return dateStr
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-500" /> Learning Hub Edit Log
              </CardTitle>
              <CardDescription>
                Track changes made to Mentors, Audiences, Session Types, and Integrations.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="px-3 py-1 font-mono text-xs">
                Total Logs: {logs.length}
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
            <div className="flex gap-2">
              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Entities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Entities</SelectItem>
                  <SelectItem value="mentor">Mentors</SelectItem>
                  <SelectItem value="audience">Audience</SelectItem>
                  <SelectItem value="session_type">Session Types</SelectItem>
                  <SelectItem value="integration">Integrations</SelectItem>
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
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="border rounded-md bg-card overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Timestamp</TableHead>
                  <TableHead className="w-[120px]">Entity</TableHead>
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
                  filteredLogs.map((log) => (
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
        </CardContent>
      </Card>
    </div>
  )
}
