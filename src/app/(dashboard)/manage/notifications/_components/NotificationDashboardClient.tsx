'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { NotificationSendLog, NotificationTemplate, NotificationTrigger } from '@/types/email-notifications';
import { NotificationTrendChart, TrendDataPoint } from './TrendChart';
import { DrillDownDialog } from './DrillDownDialog';
import {
  Mail,
  Send,
  AlertOctagon,
  ShieldOff,
  Eye,
  Settings,
  ArrowUpRight,
  TrendingUp,
  BarChart3,
  Layers,
} from 'lucide-react';

interface DashboardClientProps {
  sends: NotificationSendLog[];
  templates: NotificationTemplate[];
  triggers: NotificationTrigger[];
}

export function NotificationDashboardClient({
  sends = [],
  templates = [],
  triggers = [],
}: DashboardClientProps) {
  const safeSends = Array.isArray(sends) ? sends : [];
  const safeTemplates = Array.isArray(templates) ? templates : [];
  const safeTriggers = Array.isArray(triggers) ? triggers : [];

  const [selectedTemplateCode, setSelectedTemplateCode] = useState<string | null>(null);
  const [selectedTemplateSubject, setSelectedTemplateSubject] = useState<string | null>(null);
  const [drillDownOpen, setDrillDownOpen] = useState(false);

  // Compute KPI metrics
  const totalSends = safeSends.length;
  const sentCount = safeSends.filter((s) => s.status === 'sent').length;
  const failedCount = safeSends.filter((s) => s.status === 'failed' && !s.skip_reason).length;
  const skippedCount = safeSends.filter((s) => s.skip_reason !== null).length;
  const openedCount = safeSends.filter((s) => s.opened_at !== null).length;
  const openRate = sentCount > 0 ? Math.round((openedCount / sentCount) * 100) : 0;

  // Compute trend chart data grouped by day and module
  const trendMap: Record<string, { crm: number; lc: number }> = {};
  safeSends.forEach((send) => {
    const dateStr = new Date(send.sent_at).toISOString().split('T')[0];
    if (!trendMap[dateStr]) {
      trendMap[dateStr] = { crm: 0, lc: 0 };
    }
    const module = send.template?.module || send.trigger?.module || 'crm';
    if (module === 'learning_center') {
      trendMap[dateStr].lc += 1;
    } else {
      trendMap[dateStr].crm += 1;
    }
  });

  const trendData: TrendDataPoint[] = Object.keys(trendMap)
    .sort()
    .slice(-14) // Last 14 days
    .map((date) => ({
      date,
      crm_sends: trendMap[date].crm,
      learning_center_sends: trendMap[date].lc,
    }));

  // Group performance by template
  const templateStats = safeTemplates.map((tmpl) => {
    const tmplSends = safeSends.filter((s) => s.template_id === tmpl.id || s.template?.code === tmpl.code);
    const tmplSentCount = tmplSends.filter((s) => s.status === 'sent').length;
    const tmplOpenedCount = tmplSends.filter((s) => s.opened_at !== null).length;
    const tmplOpenRate = tmplSentCount > 0 ? Math.round((tmplOpenedCount / tmplSentCount) * 100) : 0;

    return {
      template: tmpl,
      totalSends: tmplSends.length,
      sentCount: tmplSentCount,
      openedCount: tmplOpenedCount,
      openRate: tmplOpenRate,
    };
  });

  const handleOpenDrillDown = (code: string, subject: string) => {
    setSelectedTemplateCode(code);
    setSelectedTemplateSubject(subject);
    setDrillDownOpen(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground/80">
            Email Notifications Dashboard
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Real-time delivery status, suppression gating, engagement open rates, and trigger metrics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" className="gap-2">
            <Link href="/manage/notifications/settings">
              <Settings className="w-4 h-4 text-primary" />
              Notification Settings
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm border-border/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Dispatched
            </CardTitle>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
              <Send className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sentCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Out of {totalSends} total queue items
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Open Rate
            </CardTitle>
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Eye className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {openedCount} verified pixel opens
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Skipped (Suppressed)
            </CardTitle>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
              <ShieldOff className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{skippedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Blocked by unsubscribe or inactivity
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Failed Sends
            </CardTitle>
            <div className="p-2 rounded-lg bg-destructive/10 text-destructive">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{failedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Provider transport errors
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Volume Trend Chart */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="w-5 h-5 text-primary" />
            Notification Volume Trend (CRM vs Learning Center)
          </CardTitle>
          <CardDescription>
            Daily email sends across modules, rendered using harmonized primary green (CRM) and split-complementary blue-violet (Learning Center).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NotificationTrendChart data={trendData} />
        </CardContent>
      </Card>

      {/* Breakdown Table by Template & Trigger */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Layers className="w-5 h-5 text-primary" />
              Template Performance & Trigger Catalog
            </CardTitle>
            <CardDescription>
              Breakdown of template usage, send counts, and pixel open rates. Click any row to inspect individual recipient sends.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Template Code</TableHead>
                <TableHead>Module</TableHead>
                <TableHead>Subject Template</TableHead>
                <TableHead className="text-right">Sends</TableHead>
                <TableHead className="text-right">Opens</TableHead>
                <TableHead className="text-right">Open Rate</TableHead>
                <TableHead className="text-right">Drill Down</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templateStats.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No notification templates registered.
                  </TableCell>
                </TableRow>
              ) : (
                templateStats.map(({ template: tmpl, totalSends, openedCount, openRate }) => (
                  <TableRow
                    key={tmpl.id}
                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => handleOpenDrillDown(tmpl.code, tmpl.subject_template)}
                  >
                    <TableCell className="font-mono text-sm font-semibold text-primary">
                      {tmpl.code}
                    </TableCell>
                    <TableCell>
                      {tmpl.module === 'crm' ? (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                          CRM
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-indigo-500/10 text-indigo-600 border-indigo-500/20">
                          Learning Center
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm max-w-xs truncate">
                      {tmpl.subject_template}
                    </TableCell>
                    <TableCell className="text-right font-medium">{totalSends}</TableCell>
                    <TableCell className="text-right font-medium">{openedCount}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {openRate}%
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDrillDown(tmpl.code, tmpl.subject_template);
                        }}
                      >
                        Inspect <ArrowUpRight className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Drill-down modal */}
      <DrillDownDialog
        open={drillDownOpen}
        onOpenChange={setDrillDownOpen}
        templateCode={selectedTemplateCode}
        templateSubject={selectedTemplateSubject}
        sends={safeSends}
      />
    </div>
  );
}
