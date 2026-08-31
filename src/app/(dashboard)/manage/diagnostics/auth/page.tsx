import React from 'react';
import { headers, cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { isTrueAdmin, getUserRole } from '@/lib/roles';
import { AUTH_BUDGET, getPayloadSizeBytes } from '@/lib/auth-guard';
import { inspectCookieHeader } from '@/lib/auth-diagnostics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ShieldCheck, ShieldAlert, AlertTriangle, Cookie, Database, Cpu, CheckCircle2, HardDrive } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Auth & Session Diagnostics | NGConnect',
};

export default async function AuthDiagnosticsPage() {
  const isAdmin = await isTrueAdmin();
  if (!isAdmin) {
    redirect('/');
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userRole = await getUserRole(user);

  // Read raw request headers for cookie size calculation
  const reqHeaders = await headers();
  const rawCookieHeader = reqHeaders.get('cookie') || '';
  const cookieDiagnostics = inspectCookieHeader(rawCookieHeader);

  // Calculate metadata footprints
  const userMeta = user?.user_metadata || {};
  const appMeta = user?.app_metadata || {};
  const userMetaBytes = getPayloadSizeBytes(userMeta);
  const appMetaBytes = getPayloadSizeBytes(appMeta);
  const totalMetadataBytes = userMetaBytes + appMetaBytes;

  // Percentage of the 4KB single chunk limit
  const headerPercentOfBudget = Math.min(100, Math.round((cookieDiagnostics.totalCookieHeaderBytes / AUTH_BUDGET.HARD_BLOCK_BYTES) * 100));

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'HEALTHY':
        return (
          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 px-3 py-1 font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Healthy
          </Badge>
        );
      case 'WARNING':
        return (
          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 px-3 py-1 font-semibold flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> Warning (&gt;= 3KB)
          </Badge>
        );
      case 'CRITICAL':
      default:
        return (
          <Badge className="bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30 px-3 py-1 font-semibold flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5" /> Critical (&gt;= 3.8KB)
          </Badge>
        );
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-20 animate-in fade-in duration-500">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-indigo-500/10 to-primary/10 text-primary rounded-xl border border-primary/20 shadow-inner">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground/80">
                Auth & Session Diagnostics
              </h1>
              {getStatusBadge(cookieDiagnostics.status)}
            </div>
            <p className="text-muted-foreground text-sm mt-1">
              Real-time telemetry measuring cookie payload footprints, JWT metadata, and session budgets.
            </p>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Cookie Header */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Cookie className="w-4 h-4 text-indigo-500" /> Total Cookie Header
            </CardDescription>
            <CardTitle className="text-2xl font-bold">
              {cookieDiagnostics.totalCookieHeaderBytes} <span className="text-sm font-normal text-muted-foreground">bytes</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              <Progress value={headerPercentOfBudget} className="h-1.5" />
              <div className="text-[11px] text-muted-foreground flex justify-between">
                <span>{headerPercentOfBudget}% of 4KB limit</span>
                <span>Budget: &lt;3KB</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Supabase Chunks */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-blue-500" /> Supabase Session Chunks
            </CardDescription>
            <CardTitle className="text-2xl font-bold">
              {cookieDiagnostics.supabaseCookieCount} <span className="text-sm font-normal text-muted-foreground">cookie(s)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              {cookieDiagnostics.totalAuthCookieBytes} bytes across auth cookies
            </div>
          </CardContent>
        </Card>

        {/* User Metadata Size */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Database className="w-4 h-4 text-purple-500" /> Auth Metadata Footprint
            </CardDescription>
            <CardTitle className="text-2xl font-bold">
              {totalMetadataBytes} <span className="text-sm font-normal text-muted-foreground">bytes</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              User: {userMetaBytes} B | App: {appMetaBytes} B
            </div>
          </CardContent>
        </Card>

        {/* Active Session Identity */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-emerald-500" /> Active Identity
            </CardDescription>
            <CardTitle className="text-lg font-bold truncate">
              {user?.email || 'N/A'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              Role: <span className="font-semibold text-foreground">{userRole}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Active Request Cookies Table */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Cookie className="w-4 h-4 text-indigo-500" /> Request Cookies Breakdown
            </CardTitle>
            <CardDescription>
              Inspection of cookies received by the server for this request. (No token values are displayed).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-border/60 overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 border-b border-border/60">
                  <tr>
                    <th className="p-2.5 font-bold">Cookie Name</th>
                    <th className="p-2.5 font-bold text-right">Size</th>
                    <th className="p-2.5 font-bold text-right">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {cookieDiagnostics.cookies.map((c, i) => (
                    <tr key={i} className="hover:bg-muted/10">
                      <td className="p-2.5 font-mono text-[11px] truncate max-w-[180px]">{c.name}</td>
                      <td className="p-2.5 font-mono text-[11px] text-right">{c.sizeBytes} B</td>
                      <td className="p-2.5 text-right">
                        {c.isSupabaseAuth ? (
                          <Badge variant="outline" className="text-[10px] bg-indigo-500/10 text-indigo-600 border-indigo-500/30">
                            Supabase Auth
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px]">
                            Application
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                  {cookieDiagnostics.cookies.length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-4 text-center text-muted-foreground italic">
                        No cookies detected in current request header.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Auth Claims & Metadata Breakdown */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Database className="w-4 h-4 text-purple-500" /> Auth Claims Breakdown
            </CardTitle>
            <CardDescription>
              Properties stored inside Supabase Auth JWT claims. All rich profile data lives in the database.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-border/60 overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 border-b border-border/60">
                  <tr>
                    <th className="p-2.5 font-bold">Metadata Key</th>
                    <th className="p-2.5 font-bold">Scope</th>
                    <th className="p-2.5 font-bold text-right">Payload Size</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {Object.entries(appMeta).map(([k, v]) => (
                    <tr key={`app-${k}`} className="hover:bg-muted/10">
                      <td className="p-2.5 font-mono text-[11px]">{k}</td>
                      <td className="p-2.5 text-muted-foreground">app_metadata (Authz)</td>
                      <td className="p-2.5 font-mono text-[11px] text-right">{getPayloadSizeBytes(v)} B</td>
                    </tr>
                  ))}
                  {Object.entries(userMeta).map(([k, v]) => (
                    <tr key={`user-${k}`} className="hover:bg-muted/10">
                      <td className="p-2.5 font-mono text-[11px]">{k}</td>
                      <td className="p-2.5 text-muted-foreground">user_metadata (Identity)</td>
                      <td className="p-2.5 font-mono text-[11px] text-right">{getPayloadSizeBytes(v)} B</td>
                    </tr>
                  ))}
                  {Object.keys(appMeta).length === 0 && Object.keys(userMeta).length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-4 text-center text-muted-foreground italic">
                        No metadata keys found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Safety Policy Box */}
      <div className="bg-muted/40 border border-border/60 rounded-xl p-4 text-xs text-muted-foreground space-y-2">
        <h3 className="font-bold text-foreground text-sm flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-indigo-500" /> NGConnect Auth Invariants
        </h3>
        <p>
          • <strong>Target Budget:</strong> Total Cookie Header must remain below <strong>3,072 bytes (3.0 KB)</strong>.
        </p>
        <p>
          • <strong>Profile Isolation:</strong> Rich profile attributes (bio, skills array, campus, education) are strictly persisted to PostgreSQL (<code className="text-foreground">public.alumni_profile</code>) and forbidden in Auth JWT metadata.
        </p>
        <p>
          • <strong>Avatar Safety:</strong> Uploaded avatars are stored as public objects in Supabase Storage. Only sanitized HTTP(S) URLs (&lt; 2048 characters) are linked in metadata.
        </p>
      </div>

    </div>
  );
}
