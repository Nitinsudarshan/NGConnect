'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  FileDown,
  Download,
  Users,
  User,
  FileSpreadsheet,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Loader2,
  Trash2,
  ArrowLeft,
} from 'lucide-react';

interface AvailableMonth {
  month: string;
}

type UserScope = 'all' | 'users' | 'import';

function formatMonth(dateStr: string, firstMonth?: string | null) {
  const short = new Date(dateStr + 'T12:00:00Z').toLocaleString('en-US', { month: 'short', year: '2-digit' });
  if ((firstMonth && dateStr === firstMonth) || short === 'Mar 26') {
    return `Lifetime till ${short}`;
  }
  return new Date(dateStr + 'T12:00:00Z').toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

export default function ExportCourseraActivityPage() {
  const supabase = createClient();

  // State
  const [availableMonths, setAvailableMonths] = useState<AvailableMonth[]>([]);
  const [loadingMonths, setLoadingMonths] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>('');

  // User scope selection
  const [userScope, setUserScope] = useState<UserScope>('all');
  const [rawEmailList, setRawEmailList] = useState('');
  
  // File upload state for imported list
  const [importFile, setImportFile] = useState<File | null>(null);
  const [parsingFile, setParsingFile] = useState(false);
  const [importedEmails, setImportedEmails] = useState<string[]>([]);
  const [importedFileName, setImportedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Options & export state
  const [includeCourseBreakdown, setIncludeCourseBreakdown] = useState(true);
  const [includeUnmatchedSheet, setIncludeUnmatchedSheet] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Verification state
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    total: number;
    foundCount: number;
    notFoundCount: number;
    found: Array<{
      email: string;
      name: string | null;
      inSelectedMonth: boolean;
      source?: string;
      enrollmentDate?: string;
      lastActivityDate?: string;
    }>;
    notFound: Array<{ email: string; reason: string }>;
    selectedMonth: string | null;
  } | null>(null);
  const [showMissingList, setShowMissingList] = useState(false);
  const [showFoundList, setShowFoundList] = useState(false);

  // Fetch available snapshot months
  const fetchMonths = useCallback(async () => {
    setLoadingMonths(true);
    const { data } = await supabase
      .from('coursera_computed_metrics')
      .select('month')
      .order('month', { ascending: false });

    if (data && data.length > 0) {
      setAvailableMonths(data);
      setSelectedMonth(data[0].month);
    }
    setLoadingMonths(false);
  }, [supabase]);

  useEffect(() => {
    fetchMonths();
  }, [fetchMonths]);

  // Parse comma/newline-separated emails from textarea
  const parseManualEmails = (text: string): string[] => {
    return Array.from(
      new Set(
        text
          .split(/[\n,;]+/)
          .map(e => e.trim().toLowerCase())
          .filter(e => e.length > 0 && e.includes('@'))
      )
    );
  };

  const parsedManualList = parseManualEmails(rawEmailList);

  // Handle spreadsheet upload for importing list
  const handleFileUpload = async (file: File) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setVerificationResult(null);
    const lowerName = file.name.toLowerCase();
    if (!lowerName.endsWith('.xlsx') && !lowerName.endsWith('.csv')) {
      setErrorMessage('Please upload a valid .xlsx or .csv spreadsheet.');
      return;
    }

    setImportFile(file);
    setParsingFile(true);

    try {
      const fd = new FormData();
      fd.append('file', file);

      const res = await fetch('/api/coursera/export/parse-list', {
        method: 'POST',
        body: fd,
      });

      const json = await res.json();
      if (!res.ok) {
        setErrorMessage(json.error ?? 'Failed to parse email list spreadsheet.');
        setImportedEmails([]);
        setImportedFileName(null);
      } else {
        setImportedEmails(json.emails ?? []);
        setImportedFileName(file.name);
        setSuccessMessage(`Successfully extracted ${json.count} unique email address${json.count === 1 ? '' : 'es'} from ${file.name}`);
      }
    } catch {
      setErrorMessage('Network error while processing file.');
    } finally {
      setParsingFile(false);
    }
  };

  const clearImportedFile = () => {
    setImportFile(null);
    setImportedEmails([]);
    setImportedFileName(null);
    setVerificationResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Determine active list of emails based on scope
  const getActiveEmails = (): string[] => {
    if (userScope === 'users') {
      return parsedManualList;
    }
    if (userScope === 'import') {
      return importedEmails;
    }
    return [];
  };

  // Verify whether active users exist in Coursera snapshots
  const handleVerifyUsers = async () => {
    const emails = getActiveEmails();
    if (emails.length === 0) {
      setErrorMessage('Please enter or upload at least one valid email address to verify.');
      return;
    }
    setVerifying(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/coursera/export/verify-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails, month: selectedMonth || 'all' }),
      });

      const json = await res.json();
      if (!res.ok) {
        setErrorMessage(json.error ?? 'Failed to verify users against Coursera records.');
        setVerificationResult(null);
      } else {
        setVerificationResult(json);
        if (json.notFoundCount > 0) {
          setShowMissingList(true);
        }
      }
    } catch {
      setErrorMessage('Network error while verifying users.');
    } finally {
      setVerifying(false);
    }
  };

  // Trigger export
  const handleExport = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const targetEmails = getActiveEmails();
    if (userScope !== 'all' && targetEmails.length === 0) {
      if (userScope === 'users') {
        setErrorMessage('Please enter at least one valid email address.');
      } else if (userScope === 'import') {
        setErrorMessage('Please upload an email list file containing valid emails.');
      }
      return;
    }

    setExporting(true);

    try {
      const res = await fetch('/api/coursera/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: selectedMonth || 'all',
          userScope,
          emails: targetEmails,
          includeCourseBreakdown,
          includeUnmatchedSheet,
        }),
      });

      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        setErrorMessage(errorJson.error ?? `Export failed with status ${res.status}`);
        return;
      }

      // Download the stream as a file
      const blob = await res.blob();
      const disposition = res.headers.get('Content-Disposition');
      let filename = `Coursera_Activity_Report_${selectedMonth || 'all'}.xlsx`;
      if (disposition && disposition.includes('filename=')) {
        const match = disposition.match(/filename="?([^"]+)"?/);
        if (match?.[1]) filename = match[1];
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setSuccessMessage('Activity report exported successfully!');
    } catch {
      setErrorMessage('Network error while exporting report.');
    } finally {
      setExporting(false);
    }
  };

  const firstMonth = availableMonths[availableMonths.length - 1]?.month;

  return (
    <div className="flex flex-1 flex-col gap-8 p-4 md:p-6 lg:p-8 max-w-5xl mx-auto w-full pb-20 animate-in fade-in slide-in-from-bottom-3 duration-500">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/data-management/coursera"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Coursera
            </Link>
            <span className="text-muted-foreground/40">•</span>
            <Link
              href="/data-management/coursera/activity-logs"
              className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              View Activity Logs
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-500/20 shadow-inner">
              <FileDown className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Export Activity Report</h1>
              <p className="text-muted-foreground text-sm mt-0.5">
                Generate and download filtered Coursera activity logs and course breakdown spreadsheets.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/api/coursera/export/template"
            download
            className="inline-flex items-center gap-2 text-xs font-medium px-3.5 py-2 rounded-lg border border-border/80 bg-background hover:bg-accent transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-muted-foreground" />
            Download User List Template
          </a>
        </div>
      </div>

      {/* Main Configuration Card */}
      <div className="rounded-xl border border-border/80 bg-card/60 backdrop-blur-sm p-6 space-y-6 shadow-sm">
        
        {/* Step 1: Snapshot Month */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground flex items-center justify-between">
            <span>1. Select Snapshot Month</span>
            {loadingMonths && <span className="text-xs text-muted-foreground">Loading available months…</span>}
          </label>
          <div className="relative max-w-md">
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              disabled={loadingMonths}
              className="w-full appearance-none bg-background border border-border/80 rounded-lg px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
            >
              {availableMonths.map(m => (
                <option key={m.month} value={m.month}>
                  {formatMonth(m.month, firstMonth)} ({m.month})
                </option>
              ))}
              <option value="all">All Available Snapshot Months</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
          <p className="text-xs text-muted-foreground">
            Choose which monthly snapshot records to export. Select &ldquo;All Available Snapshot Months&rdquo; for historical aggregation.
          </p>
        </div>

        {/* Step 2: User Scope Selector */}
        <div className="space-y-3 pt-2 border-t border-border/40">
          <label className="text-sm font-semibold text-foreground">
            2. Choose User Scope
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                id: 'all' as UserScope,
                label: 'All Users',
                desc: 'Export all learners in selected month',
                icon: Users,
              },
              {
                id: 'users' as UserScope,
                label: 'Specific User(s)',
                desc: 'Single or multiple comma-separated email IDs',
                icon: User,
              },
              {
                id: 'import' as UserScope,
                label: 'Import a List',
                desc: 'Upload an .xlsx or .csv email list',
                icon: FileSpreadsheet,
              },
            ].map(tab => {
              const Icon = tab.icon;
              const isSelected = userScope === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setUserScope(tab.id);
                    setErrorMessage(null);
                  }}
                  className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition-all duration-200 ${
                    isSelected
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/40 shadow-sm'
                      : 'border-border/70 hover:border-border hover:bg-accent/40'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-semibold text-foreground leading-none">{tab.label}</span>
                  </div>
                  <span className="text-xs text-muted-foreground leading-tight">{tab.desc}</span>
                </button>
              );
            })}
          </div>

          {/* Scope details container */}
          <div className="pt-2">
            {/* Scope: Specific User(s) */}
            {userScope === 'users' && (
              <div className="space-y-2 max-w-xl animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground">
                    Learner Email Address(es)
                  </label>
                  {parsedManualList.length > 0 && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                      {parsedManualList.length} valid email{parsedManualList.length === 1 ? '' : 's'} detected
                    </span>
                  )}
                </div>
                <textarea
                  rows={3}
                  value={rawEmailList}
                  onChange={e => setRawEmailList(e.target.value)}
                  placeholder="e.g. learner1@navgurukul.org, learner2@navgurukul.org"
                  className="w-full bg-background border border-border/80 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono text-xs transition"
                />
                <p className="text-xs text-muted-foreground">
                  Enter a single email ID, or if multiple email IDs then separate them with a comma (or new lines).
                </p>
              </div>
            )}

            {/* Scope: Import List File */}
            {userScope === 'import' && (
              <div className="space-y-3 max-w-xl animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground">
                    Upload Spreadsheet with Emails (.xlsx or .csv)
                  </label>
                  <a
                    href="/api/coursera/export/template"
                    download
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <Download className="w-3 h-3" /> Download Template
                  </a>
                </div>

                {!importedFileName ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-border/70 hover:border-primary/50 hover:bg-accent/40 rounded-xl p-6 text-center cursor-pointer transition-all duration-200"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.csv"
                      className="hidden"
                      onChange={e => {
                        const f = e.target.files?.[0];
                        if (f) handleFileUpload(f);
                      }}
                    />
                    <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">
                      {parsingFile ? 'Analyzing spreadsheet…' : 'Click to select or drop your user list file here'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">Supports .xlsx and .csv files with an &ldquo;Email&rdquo; column</p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{importedFileName}</p>
                        <p className="text-xs text-muted-foreground">
                          {importedEmails.length} valid learner email{importedEmails.length === 1 ? '' : 's'} extracted
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={clearImportedFile}
                      className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                      title="Remove file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Verify Accounts Action & Results */}
            {userScope !== 'all' && getActiveEmails().length > 0 && (
              <div className="pt-3 border-t border-border/40 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-muted-foreground">
                    Check if these emails exist in Coursera snapshots before exporting:
                  </div>
                  <button
                    type="button"
                    onClick={handleVerifyUsers}
                    disabled={verifying}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/80 bg-background hover:bg-accent text-xs font-medium transition shadow-sm disabled:opacity-50"
                  >
                    {verifying ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Verifying Accounts…
                      </>
                    ) : (
                      <>
                        <Search className="w-3.5 h-3.5 text-primary" /> Check Coursera Accounts
                      </>
                    )}
                  </button>
                </div>

                {verificationResult && (
                  <div className="rounded-xl border border-border/80 bg-background/50 p-4 space-y-3 animate-in fade-in duration-200">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs font-semibold">
                        <span>Account Verification Summary</span>
                        <span className="text-muted-foreground">({verificationResult.total} emails checked)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setShowFoundList(!showFoundList)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/15 transition-colors cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> {verificationResult.foundCount} Verified in Coursera
                          {showFoundList ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
                          verificationResult.notFoundCount > 0
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                            : 'bg-muted text-muted-foreground border-border/60'
                        }`}>
                          <AlertCircle className="w-3.5 h-3.5" /> {verificationResult.notFoundCount} Not Found / No Records
                        </span>
                      </div>
                    </div>

                    {/* Found users list */}
                    {showFoundList && verificationResult.foundCount > 0 && (
                      <div className="space-y-2 pt-1 border-t border-border/40">
                        <div className="flex items-center justify-between text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          <span>Verified Accounts ({verificationResult.foundCount})</span>
                          <span className="text-[10px] text-muted-foreground">Cross-checked against Snapshots & Live Enterprise API</span>
                        </div>
                        <div className="max-h-56 overflow-y-auto space-y-1.5 p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                          {verificationResult.found.map(f => (
                            <div key={f.email} className="flex flex-col sm:flex-row sm:items-center justify-between text-xs py-1.5 px-2.5 rounded bg-background/80 border border-border/50 gap-1.5 sm:gap-4">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="font-mono text-foreground truncate">{f.email}</span>
                                {f.name && <span className="text-muted-foreground text-[11px] truncate">({f.name})</span>}
                              </div>
                              <div className="flex flex-wrap items-center gap-2 shrink-0 text-[11px] text-muted-foreground">
                                {f.enrollmentDate && f.enrollmentDate !== '—' && (
                                  <span>Enrolled: <strong className="font-medium text-foreground">{f.enrollmentDate}</strong></span>
                                )}
                                {f.lastActivityDate && f.lastActivityDate !== '—' && (
                                  <span>Last Active: <strong className="font-medium text-foreground">{f.lastActivityDate}</strong></span>
                                )}
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                  f.source?.includes('Live API')
                                    ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                }`}>
                                  {f.source || 'Snapshots'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Missing / Unmatched users list */}
                    {verificationResult.notFoundCount > 0 && (
                      <div className="space-y-2 pt-1 border-t border-border/40">
                        <button
                          type="button"
                          onClick={() => setShowMissingList(!showMissingList)}
                          className="flex items-center justify-between w-full text-xs font-medium text-amber-600 dark:text-amber-400 hover:underline text-left"
                        >
                          <span>
                            {showMissingList ? 'Hide' : 'Show'} {verificationResult.notFoundCount} email(s) with no Coursera account
                          </span>
                          {showMissingList ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>

                        {showMissingList && (
                          <div className="max-h-40 overflow-y-auto space-y-1.5 p-2 rounded-lg bg-amber-500/5 border border-amber-500/20">
                            {verificationResult.notFound.map(nf => (
                              <div key={nf.email} className="flex items-center justify-between text-xs py-1 px-2 rounded bg-background/80 border border-border/50">
                                <span className="font-mono text-foreground">{nf.email}</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium">
                                  No Account Found
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* Step 3: Options */}
        <div className="pt-2 border-t border-border/40 space-y-2">
          <label className="text-sm font-semibold text-foreground">
            3. Report Output Structure
          </label>
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="include-course-breakdown"
                checked={includeCourseBreakdown}
                onChange={e => setIncludeCourseBreakdown(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary/40 cursor-pointer"
              />
              <label htmlFor="include-course-breakdown" className="text-sm text-foreground cursor-pointer select-none">
                Include Course-Level Breakdown Sheet <span className="text-xs text-muted-foreground">(adds a 2nd worksheet with individual course enrollments, hours, and grades)</span>
              </label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="include-unmatched-sheet"
                checked={includeUnmatchedSheet}
                onChange={e => setIncludeUnmatchedSheet(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary/40 cursor-pointer"
              />
              <label htmlFor="include-unmatched-sheet" className="text-sm text-foreground cursor-pointer select-none">
                Include Unmatched / No Coursera Account Sheet <span className="text-xs text-muted-foreground">(adds a worksheet listing requested users who do not exist or have no Coursera records)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Feedback banners */}
        {errorMessage && (
          <div className="flex items-start gap-3 p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-in fade-in duration-200">
            <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="flex items-start gap-3 p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-sm animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Export action */}
        <div className="pt-4 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-muted-foreground">
            {userScope === 'all' && 'Exporting all learner records for the selected month.'}
            {userScope === 'users' && `${parsedManualList.length} learner email(s) queued for export.`}
            {userScope === 'import' && `${importedEmails.length} imported learner(s) queued for export.`}
          </div>

          <button
            type="button"
            onClick={handleExport}
            disabled={exporting || loadingMonths || parsingFile}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-95 shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating Report…
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4" />
                Export Activity Report (.xlsx)
              </>
            )}
          </button>
        </div>

      </div>

    </div>
  );
}
