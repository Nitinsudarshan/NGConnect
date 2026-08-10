"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  FileSpreadsheet,
  Search,
  RefreshCw,
  Database,
  SlidersHorizontal,
  Info,
  HelpCircle,
  User,
  ShieldAlert,
  Server
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { AuditLog } from '@/types/audit';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import LoadingView from '@/components/loading-view';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchEmail, setSearchEmail] = useState('');
  const [filterTable, setFilterTable] = useState('all');
  const [filterAction, setFilterAction] = useState('all');
  const [filterField, setFilterField] = useState('');

  const supabase = createClient();

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('audit_log')
        .select('*')
        .order('changed_at', { ascending: false })
        .limit(200);

      if (error) throw error;

      if (data) {
        setLogs(data as AuditLog[]);
      }
    } catch (err: any) {
      console.error('Failed to load audit logs:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesEmail = searchEmail === '' || log.record_id.toLowerCase().includes(searchEmail.toLowerCase());
    const matchesTable = filterTable === 'all' || log.table_name === filterTable;
    const matchesAction = filterAction === 'all' || log.action_type === filterAction;
    const matchesField = filterField === '' || log.field_name.toLowerCase().includes(filterField.toLowerCase());

    return matchesEmail && matchesTable && matchesAction && matchesField;
  });

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-20 animate-in fade-in slide-in-from-bottom-2 duration-300">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/data-management"
            className="p-2 border border-border/80 rounded-md hover:bg-muted transition-all text-muted-foreground hover:text-foreground hover:scale-105"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Comprehensive changelogs and operations audit history. Read-only.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchLogs}
          disabled={loading}
          className="gap-2 rounded-md transition-all active:scale-95"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Audit Trail
        </Button>
      </div>



      {/* Filters panel */}
      <Card className="border border-border/80 rounded-md shadow-sm bg-card/50">
        <CardContent className="pt-5 pb-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Search Record ID / Email</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-3" />
              <Input
                placeholder="e.g. name@domain.com"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                className="pl-9 rounded-md h-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Table Name</label>
            <Select value={filterTable} onValueChange={setFilterTable}>
              <SelectTrigger className="rounded-md h-9">
                <SelectValue placeholder="All Tables" />
              </SelectTrigger>
              <SelectContent className="rounded-md">
                <SelectItem value="all">All Tables</SelectItem>
                <SelectItem value="alumni_master">Alumni Master</SelectItem>
                <SelectItem value="alumni_profile">Alumni Profile</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Action Type</label>
            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger className="rounded-md h-9">
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent className="rounded-md">
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="INSERT">INSERT</SelectItem>
                <SelectItem value="UPDATE">UPDATE</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
                <SelectItem value="IMPORT">IMPORT</SelectItem>
                <SelectItem value="RESTORE">RESTORE</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Field Name</label>
            <div className="relative">
              <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-3" />
              <Input
                placeholder="e.g. status, phone"
                value={filterField}
                onChange={(e) => setFilterField(e.target.value)}
                className="pl-9 rounded-md h-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Table */}
      <Card className="border border-border/80 rounded-md overflow-hidden shadow-md bg-card/45 backdrop-blur-sm">
        {loading ? (
          <LoadingView fullScreen={false} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse min-w-[70rem]">
              <thead className="bg-muted/50 border-b border-border/60">
                <tr>
                  <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Timestamp</th>
                  <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">User</th>
                  <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Record ID / Target</th>
                  <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Table</th>
                  <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Field</th>
                  <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Old Value</th>
                  <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">New Value</th>
                  <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => {
                  const isInsert = log.action_type === 'INSERT';
                  const isDelete = log.action_type === 'DELETE';
                  const isRestore = log.action_type === 'RESTORE';
                  const isUpdate = log.action_type === 'UPDATE';

                  let logRowAccent = '';
                  if (isInsert) logRowAccent = 'border-l-[4px] border-l-emerald-500 hover:bg-emerald-500/5';
                  else if (isDelete) logRowAccent = 'border-l-[4px] border-l-red-500 hover:bg-red-500/5';
                  else if (isRestore) logRowAccent = 'border-l-[4px] border-l-indigo-500 hover:bg-indigo-500/5';
                  else if (isUpdate) logRowAccent = 'border-l-[4px] border-l-blue-500 hover:bg-blue-500/5';

                  return (
                    <tr key={log.id} className={`border-t border-border/40 transition-colors ${logRowAccent}`}>
                      <td className="px-5 py-3.5 font-mono text-[11px] text-muted-foreground">
                        {new Date(log.changed_at).toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-3.5 space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-muted-foreground" />
                          <p className="font-semibold text-foreground">{log.changed_by_name ?? '—'}</p>
                        </div>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold pl-5">{log.changed_by_role ?? '—'}</p>
                      </td>
                      <td className="px-5 py-3.5 font-mono font-bold text-foreground max-w-[12rem] truncate">
                        {log.record_id}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                        <Server className="w-3 h-3 text-muted-foreground/60" />
                        <span>{log.table_name}</span>
                      </td>
                      <td className="px-5 py-3.5 font-mono font-bold text-foreground">
                        <Badge variant="secondary" className="font-mono px-2 py-0.5 rounded-md text-[11px] border border-border/60">
                          {log.field_name}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-red-600 dark:text-red-400 font-mono max-w-[12rem] truncate italic font-medium">
                        {log.old_value !== null ? log.old_value : 'NULL'}
                      </td>
                      <td className="px-5 py-3.5 text-emerald-600 dark:text-emerald-400 font-mono max-w-[12rem] truncate italic font-semibold">
                        {log.new_value !== null ? log.new_value : 'NULL'}
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge
                          variant="outline"
                          className={`text-[9px] font-bold px-2 py-0.5 border shadow-sm rounded-md ${isInsert ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900' :
                              isDelete ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900' :
                                isRestore ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900' :
                                  'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900'
                            }`}
                        >
                          {log.action_type}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-8 text-center text-muted-foreground font-semibold">
                      No matching audit records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <div className="flex justify-end text-xs text-muted-foreground gap-1.5 items-center font-medium">
        <ShieldAlert className="w-4 h-4 text-primary" />
        Audit logs are permanent and append-only for security integrity.
      </div>
    </div>
  );
}
