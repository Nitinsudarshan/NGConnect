'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import {
  UserPlus,
  Mail,
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Loader2,
  Trash2,
  ArrowLeft,
  RefreshCw,
  Sparkles,
  ExternalLink,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface CheckerItem {
  email: string;
  fullName: string;
  nameSource: 'uploaded' | 'snapshot' | 'database' | 'coursera' | 'derived';
  status: 'enrolled' | 'invited' | 'not_enrolled';
  source: 'Snapshots' | 'Coursera Enterprise (Live API)' | 'None';
  enrollmentDate: string;
  lastActivityDate: string;
  courseraId?: string;
  // Local operation tracking
  actionStatus?: 'idle' | 'loading' | 'success' | 'already_invited' | 'already_enrolled' | 'error';
  actionMessage?: string;
  errorCode?: string;
}

type InputMethod = 'manual' | 'spreadsheet';
type FilterTab = 'all' | 'not_enrolled' | 'invited' | 'enrolled';

export default function CourseraEnrollmentCheckerPage() {
  // Input mode state
  const [inputMethod, setInputMethod] = useState<InputMethod>('manual');
  const [manualText, setManualText] = useState('');
  
  // Spreadsheet state
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedFileItems, setParsedFileItems] = useState<Array<{ email: string; fullName?: string }>>([]);
  const [parsingFile, setParsingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Checker state
  const [isChecking, setIsChecking] = useState(false);
  const [checkResults, setCheckResults] = useState<CheckerItem[] | null>(null);
  const [summary, setSummary] = useState<{ total: number; enrolledCount: number; notEnrolledCount: number } | null>(null);

  // Table filtering and search
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Bulk action state
  const [isBulkRunning, setIsBulkRunning] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number } | null>(null);

  // General banner alerts
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Parse manual emails
  const parseManualList = (text: string): Array<{ email: string; fullName?: string }> => {
    const rawTokens = text.split(/[\n,;]+/);
    const seen = new Set<string>();
    const items: Array<{ email: string; fullName?: string }> = [];

    for (const token of rawTokens) {
      const trimmed = token.trim();
      if (!trimmed) continue;

      // Check if format is "Name <email@domain.com>"
      const match = trimmed.match(/^(.*)<([^>]+)>$/);
      if (match) {
        const name = match[1].trim();
        const email = match[2].trim().toLowerCase();
        if (email.includes('@') && !seen.has(email)) {
          seen.add(email);
          items.push({ email, fullName: name });
        }
      } else {
        const email = trimmed.toLowerCase();
        if (email.includes('@') && !seen.has(email)) {
          seen.add(email);
          items.push({ email });
        }
      }
    }
    return items;
  };

  const currentItemsToVerify = inputMethod === 'manual' 
    ? parseManualList(manualText) 
    : parsedFileItems;

  // Handle spreadsheet file upload
  const handleFileUpload = async (uploadedFile: File) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    const lowerName = uploadedFile.name.toLowerCase();
    if (!lowerName.endsWith('.xlsx') && !lowerName.endsWith('.csv')) {
      setErrorMessage('Please upload a valid .xlsx or .csv spreadsheet.');
      return;
    }

    setFile(uploadedFile);
    setParsingFile(true);

    try {
      const fd = new FormData();
      fd.append('file', uploadedFile);

      const res = await fetch('/api/coursera/enroll/parse', {
        method: 'POST',
        body: fd,
      });

      const json = await res.json();
      if (!res.ok) {
        setErrorMessage(json.error ?? 'Failed to parse spreadsheet.');
        setParsedFileItems([]);
        setFileName(null);
      } else {
        setParsedFileItems(json.items ?? []);
        setFileName(uploadedFile.name);
        setSuccessMessage(`Parsed ${json.count} learner record${json.count === 1 ? '' : 's'} from ${uploadedFile.name}`);
      }
    } catch {
      setErrorMessage('Network error while uploading and parsing file.');
    } finally {
      setParsingFile(false);
    }
  };

  const clearSpreadsheet = () => {
    setFile(null);
    setFileName(null);
    setParsedFileItems([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Run status checker (Snapshots -> Live API -> Name auto-resolution)
  const handleRunChecker = async () => {
    if (currentItemsToVerify.length === 0) {
      setErrorMessage('Please provide at least one valid email address to check.');
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsChecking(true);

    try {
      const res = await fetch('/api/coursera/enroll/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: currentItemsToVerify }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to check learner records.');
        return;
      }

      setCheckResults(
        data.results.map((r: any) => ({
          ...r,
          actionStatus: 'idle',
        }))
      );
      setSummary({
        total: data.total,
        enrolledCount: data.enrolledCount,
        notEnrolledCount: data.notEnrolledCount,
      });
      setSuccessMessage(
        `Check complete: ${data.enrolledCount} already active on Coursera, ${data.notEnrolledCount} ready for invitation or enrollment.`
      );
    } catch (err: any) {
      setErrorMessage(`Verification check error: ${err.message || 'Network error'}`);
    } finally {
      setIsChecking(false);
    }
  };

  // Update learner name in the results table
  const handleNameChange = (email: string, newName: string) => {
    setCheckResults(prev =>
      prev
        ? prev.map(item => (item.email === email ? { ...item, fullName: newName } : item))
        : null
    );
  };

  // Single learner action: Invite or Force Enroll
  const handleSingleAction = async (user: CheckerItem, action: 'invite' | 'enroll') => {
    if (!user.fullName.trim()) {
      setErrorMessage(`Please provide a Full Name for ${user.email} before enrolling.`);
      return;
    }

    // Set row loading
    setCheckResults(prev =>
      prev
        ? prev.map(item =>
            item.email === user.email
              ? { ...item, actionStatus: 'loading', actionMessage: undefined }
              : item
          )
        : null
    );

    try {
      const res = await fetch('/api/coursera/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          users: [{ email: user.email, fullName: user.fullName.trim() }],
        }),
      });

      const data = await res.json();
      const r = data.results?.[0];

      if (!res.ok || !r?.success) {
        const msg = r?.message || data.error || 'Operation failed';
        const isExistingInvite =
          r?.statusCategory === 'already_invited' ||
          r?.errorCode === 'PROGRAM_INVITEE_ERROR_EXISTING_INVITATION_FOR_EMAIL';
        const isExistingMember =
          r?.statusCategory === 'already_enrolled' ||
          r?.errorCode === 'PROGRAM_MEMBER_ERROR_EXISTING_MEMBERSHIP_FOR_EMAIL';

        if (isExistingInvite) {
          setCheckResults(prev =>
            prev
              ? prev.map(item =>
                  item.email === user.email
                    ? {
                        ...item,
                        status: 'invited',
                        actionStatus: 'already_invited',
                        actionMessage: msg,
                        errorCode: r?.errorCode,
                      }
                    : item
                )
              : null
          );
          setSuccessMessage(
            `Notice for ${user.email}: Learner already has an active invitation to join Coursera Enterprise. You can click "Force Enroll" to activate their account immediately without waiting for them to accept.`
          );
        } else if (isExistingMember) {
          setCheckResults(prev =>
            prev
              ? prev.map(item =>
                  item.email === user.email
                    ? {
                        ...item,
                        status: 'enrolled',
                        source: 'Coursera Enterprise (Live API)',
                        actionStatus: 'already_enrolled',
                        actionMessage: msg,
                        errorCode: r?.errorCode,
                      }
                    : item
                )
              : null
          );
          setSuccessMessage(`${user.email} is already an active enrolled member of this Coursera program.`);
        } else {
          setCheckResults(prev =>
            prev
              ? prev.map(item =>
                  item.email === user.email
                    ? {
                        ...item,
                        actionStatus: 'error',
                        actionMessage: msg,
                        errorCode: r?.errorCode,
                      }
                    : item
                )
              : null
          );
          setErrorMessage(`${user.email}: ${msg}`);
        }
      } else {
        const msg = r.message;
        const newStatus = action === 'enroll' ? 'enrolled' : 'invited';
        setCheckResults(prev =>
          prev
            ? prev.map(item =>
                item.email === user.email
                  ? {
                      ...item,
                      status: newStatus,
                      source: 'Coursera Enterprise (Live API)',
                      actionStatus: 'success',
                      actionMessage: msg,
                    }
                  : item
              )
            : null
        );
        setSuccessMessage(`${user.email}: ${msg}`);
        // Refresh summary
        setSummary(prev =>
          prev
            ? {
                ...prev,
                enrolledCount: action === 'enroll' ? prev.enrolledCount + 1 : prev.enrolledCount,
                notEnrolledCount: Math.max(0, prev.notEnrolledCount - 1),
              }
            : null
        );
      }
    } catch (err: any) {
      setCheckResults(prev =>
        prev
          ? prev.map(item =>
              item.email === user.email
                ? { ...item, actionStatus: 'error', actionMessage: err.message || 'Network error' }
                : item
            )
          : null
      );
      setErrorMessage(`${user.email}: ${err.message || 'Network error'}`);
    }
  };

  // Bulk action: Invite or Force Enroll all unenrolled users
  const handleBulkAction = async (action: 'invite' | 'enroll') => {
    if (!checkResults) return;

    const eligible = checkResults.filter(
      item => item.status === 'not_enrolled' || item.actionStatus === 'error'
    );

    if (eligible.length === 0) {
      setErrorMessage('No unenrolled learners to process.');
      return;
    }

    setIsBulkRunning(true);
    setBulkProgress({ current: 0, total: eligible.length });
    setErrorMessage(null);

    const BATCH_SIZE = 5;
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < eligible.length; i += BATCH_SIZE) {
      const chunk = eligible.slice(i, i + BATCH_SIZE);

      // Set chunk to loading
      setCheckResults(prev =>
        prev
          ? prev.map(item =>
              chunk.some(c => c.email === item.email)
                ? { ...item, actionStatus: 'loading', actionMessage: undefined }
                : item
            )
          : null
      );

      try {
        const res = await fetch('/api/coursera/enroll', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action,
            users: chunk.map(u => ({ email: u.email, fullName: u.fullName.trim() })),
          }),
        });

        const data = await res.json();
        if (res.ok && Array.isArray(data.results)) {
          const resMap = new Map<string, any>(data.results.map((r: any) => [r.email, r]));

          setCheckResults(prev =>
            prev
              ? prev.map(item => {
                  const r = resMap.get(item.email);
                  if (r) {
                    if (r.success) {
                      successCount++;
                      return {
                        ...item,
                        status: action === 'enroll' ? 'enrolled' : 'invited',
                        source: 'Coursera Enterprise (Live API)',
                        actionStatus: 'success',
                        actionMessage: r.message,
                      };
                    } else if (
                      r.statusCategory === 'already_invited' ||
                      r.errorCode === 'PROGRAM_INVITEE_ERROR_EXISTING_INVITATION_FOR_EMAIL'
                    ) {
                      return {
                        ...item,
                        status: 'invited',
                        actionStatus: 'already_invited',
                        actionMessage: r.message,
                      };
                    } else if (r.statusCategory === 'already_enrolled') {
                      return {
                        ...item,
                        status: 'enrolled',
                        source: 'Coursera Enterprise (Live API)',
                        actionStatus: 'already_enrolled',
                        actionMessage: r.message,
                      };
                    } else {
                      failCount++;
                      return {
                        ...item,
                        actionStatus: 'error',
                        actionMessage: r.message,
                      };
                    }
                  }
                  return item;
                })
              : null
          );
        } else {
          failCount += chunk.length;
          setCheckResults(prev =>
            prev
              ? prev.map(item =>
                  chunk.some(c => c.email === item.email)
                    ? { ...item, actionStatus: 'error', actionMessage: data.error || 'Batch failed' }
                    : item
                )
              : null
          );
        }
      } catch (err: any) {
        failCount += chunk.length;
        setCheckResults(prev =>
          prev
            ? prev.map(item =>
                chunk.some(c => c.email === item.email)
                  ? { ...item, actionStatus: 'error', actionMessage: err.message || 'Network error' }
                  : item
              )
            : null
        );
      }

      setBulkProgress({ current: Math.min(i + BATCH_SIZE, eligible.length), total: eligible.length });
    }

    setIsBulkRunning(false);
    setBulkProgress(null);

    setSuccessMessage(
      `Batch ${action === 'invite' ? 'invitations' : 'enrollments'} finished: ${successCount} succeeded, ${failCount} failed.`
    );
  };

  // Filtered results
  const filteredResults = (checkResults || []).filter(item => {
    if (filterTab === 'not_enrolled' && item.status !== 'not_enrolled') return false;
    if (filterTab === 'invited' && item.status !== 'invited') return false;
    if (filterTab === 'enrolled' && item.status !== 'enrolled') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return item.email.toLowerCase().includes(q) || item.fullName.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-24 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <Link
            href="/data-management"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Data Management
          </Link>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
              <UserPlus className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
              Learner Enrollment & Verification Checker
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Verify learner account status across historical snapshots and live Coursera Enterprise API, then invite or force-enroll.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/api/coursera/enroll/template"
              download
              className="inline-flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg border border-border bg-card hover:bg-accent text-foreground transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-indigo-500" />
              Download Excel Template
            </a>
            <a
              href="https://www.coursera.org/o/uhss-ngf/admin/home"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border border-border bg-card hover:bg-accent text-muted-foreground hover:text-foreground transition-colors shadow-xs"
            >
              Coursera Admin
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Global Alerts */}
      {errorMessage && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-destructive/20 bg-destructive/10 text-destructive text-sm animate-in fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{errorMessage}</div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-xs underline hover:no-underline ml-auto"
          >
            Dismiss
          </button>
        </div>
      )}

      {successMessage && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-sm animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{successMessage}</div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-xs underline hover:no-underline ml-auto"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Input Selection Card */}
      <div className="p-6 rounded-2xl border border-border bg-card shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">Step 1: Provide Learner Accounts</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Input single/multiple emails or upload a spreadsheet containing learner emails and names.
            </p>
          </div>
          {/* Method Switcher */}
          <div className="inline-flex p-1 bg-muted rounded-xl gap-1">
            <button
              onClick={() => setInputMethod('manual')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                inputMethod === 'manual'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Manual Email Input
            </button>
            <button
              onClick={() => setInputMethod('spreadsheet')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                inputMethod === 'spreadsheet'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              Upload Spreadsheet
            </button>
          </div>
        </div>

        {/* Manual Input View */}
        {inputMethod === 'manual' && (
          <div className="space-y-3">
            <label className="text-xs font-medium text-foreground block">
              Enter Email Addresses (or &quot;Name &lt;email@example.com&gt;&quot;)
            </label>
            <textarea
              rows={4}
              value={manualText}
              onChange={e => setManualText(e.target.value)}
              placeholder="e.g. nitin@navgurukul.org, John Doe <john@navgurukul.org>, priya@example.com&#10;One per line or comma-separated"
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm font-mono placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring resize-y"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Detected valid emails:{' '}
                <strong className="text-foreground">{parseManualList(manualText).length}</strong>
              </span>
              {manualText && (
                <button
                  onClick={() => setManualText('')}
                  className="hover:text-destructive transition-colors text-xs flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" /> Clear input
                </button>
              )}
            </div>
          </div>
        )}

        {/* Spreadsheet Upload View */}
        {inputMethod === 'spreadsheet' && (
          <div className="space-y-4">
            {!fileName ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border hover:border-indigo-500/50 dark:hover:border-indigo-500/50 rounded-2xl p-8 text-center cursor-pointer transition-colors bg-muted/20 hover:bg-muted/40"
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
                <div className="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
                  {parsingFile ? <Loader2 className="w-6 h-6 animate-spin" /> : <FileSpreadsheet className="w-6 h-6" />}
                </div>
                <div className="text-sm font-semibold text-foreground">Click to upload spreadsheet</div>
                <div className="text-xs text-muted-foreground mt-1">Supports .xlsx and .csv files up to 10MB</div>
                <div className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-3">
                  Columns supported: Email Address, Full Name (Optional)
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">{fileName}</div>
                    <div className="text-xs text-muted-foreground">
                      {parsedFileItems.length} learner records identified
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSpreadsheet}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4 mr-1.5" />
                  Remove
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Trigger Verification Check */}
        <div className="flex items-center justify-end pt-2 border-t border-border">
          <Button
            onClick={handleRunChecker}
            disabled={isChecking || currentItemsToVerify.length === 0}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs font-semibold px-6"
          >
            {isChecking ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Checking Snapshots & Coursera API...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Check Account Status ({currentItemsToVerify.length})
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Results Section */}
      {checkResults && summary && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-border bg-card shadow-xs">
              <div className="text-xs text-muted-foreground font-medium">Total Evaluated</div>
              <div className="text-2xl font-bold text-foreground mt-1">{summary.total}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Learner records submitted</div>
            </div>

            <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 shadow-xs">
              <div className="text-xs text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Already Enrolled / Active
              </div>
              <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">
                {summary.enrolledCount}
              </div>
              <div className="text-xs text-emerald-600/80 dark:text-emerald-400/70 mt-0.5">
                Existing Coursera Enterprise accounts
              </div>
            </div>

            <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 shadow-xs">
              <div className="text-xs text-indigo-700 dark:text-indigo-400 font-medium flex items-center gap-1.5">
                <UserPlus className="w-3.5 h-3.5" /> Needs Invitation / Enrollment
              </div>
              <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-400 mt-1">
                {summary.notEnrolledCount}
              </div>
              <div className="text-xs text-indigo-600/80 dark:text-indigo-400/70 mt-0.5">
                Ready for one-click action
              </div>
            </div>
          </div>

          {/* Bulk Action & Filter Bar */}
          <div className="p-4 rounded-xl border border-border bg-card shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-muted p-1 rounded-xl w-fit">
              <button
                onClick={() => setFilterTab('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filterTab === 'all'
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All ({checkResults.length})
              </button>
              <button
                onClick={() => setFilterTab('not_enrolled')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filterTab === 'not_enrolled'
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Not Enrolled ({checkResults.filter(r => r.status === 'not_enrolled').length})
              </button>
              <button
                onClick={() => setFilterTab('invited')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filterTab === 'invited'
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Invite Pending ({checkResults.filter(r => r.status === 'invited').length})
              </button>
              <button
                onClick={() => setFilterTab('enrolled')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filterTab === 'enrolled'
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Active ({checkResults.filter(r => r.status === 'enrolled').length})
              </button>
            </div>

            {/* Live Search */}
            <div className="relative flex-1 max-w-xs">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by email or name..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            {/* Bulk Action Buttons */}
            {summary.notEnrolledCount > 0 && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction('invite')}
                  disabled={isBulkRunning}
                  className="text-xs h-9"
                >
                  <Mail className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />
                  Invite All ({summary.notEnrolledCount})
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleBulkAction('enroll')}
                  disabled={isBulkRunning}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 font-semibold"
                >
                  <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                  Force Enroll All ({summary.notEnrolledCount})
                </Button>
              </div>
            )}
          </div>

          {/* Bulk Progress Indicator */}
          {bulkProgress && (
            <div className="p-3 rounded-xl border border-indigo-500/20 bg-indigo-500/10 flex items-center justify-between text-xs text-indigo-700 dark:text-indigo-300">
              <div className="flex items-center gap-2 font-medium">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                Processing bulk enrollment batch... ({bulkProgress.current} / {bulkProgress.total})
              </div>
              <div>Please keep this window open</div>
            </div>
          )}

          {/* Results Table */}
          <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b border-border text-muted-foreground font-medium uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Learner Email</th>
                    <th className="py-3 px-4">Full Name (Editable)</th>
                    <th className="py-3 px-4">Current Status</th>
                    <th className="py-3 px-4">Verified Source</th>
                    <th className="py-3 px-4">Enrollment Date</th>
                    <th className="py-3 px-4">Last Activity</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredResults.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-muted-foreground">
                        No learners match the current filter or search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredResults.map(item => (
                      <tr key={item.email} className="hover:bg-muted/30 transition-colors">
                        {/* Email */}
                        <td className="py-3 px-4 font-mono font-medium text-foreground">
                          {item.email}
                        </td>

                        {/* Full Name Input & Source Badge */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2 max-w-xs">
                            <input
                              type="text"
                              value={item.fullName}
                              onChange={e => handleNameChange(item.email, e.target.value)}
                              disabled={item.actionStatus === 'loading'}
                              placeholder="Required for Coursera"
                              className="w-full rounded-md border border-input bg-background px-2.5 py-1 text-xs text-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                            />
                            <Badge
                              variant="secondary"
                              className="shrink-0 text-[10px] px-1.5 py-0 capitalize"
                              title={`Name source: ${item.nameSource}`}
                            >
                              {item.nameSource === 'derived' && <Sparkles className="w-2.5 h-2.5 mr-0.5 text-amber-500" />}
                              {item.nameSource}
                            </Badge>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">
                          {item.status === 'enrolled' ? (
                            <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Active Enterprise
                            </Badge>
                          ) : item.status === 'invited' || item.actionStatus === 'already_invited' ? (
                            <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400 hover:bg-blue-500/20 border-blue-500/20">
                              <Mail className="w-3 h-3 mr-1" />
                              Invite Pending
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/5">
                              <XCircle className="w-3 h-3 mr-1" />
                              Not Enrolled
                            </Badge>
                          )}
                        </td>

                        {/* Verified Source */}
                        <td className="py-3 px-4 text-muted-foreground">
                          {item.source}
                        </td>

                        {/* Enrollment Date */}
                        <td className="py-3 px-4 font-mono text-muted-foreground">
                          {item.enrollmentDate}
                        </td>

                        {/* Last Activity */}
                        <td className="py-3 px-4 font-mono text-muted-foreground">
                          {item.lastActivityDate}
                        </td>

                        {/* Row Actions */}
                        <td className="py-3 px-4 text-right">
                          {item.actionStatus === 'loading' ? (
                            <span className="inline-flex items-center text-xs text-muted-foreground">
                              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1 text-indigo-600" />
                              Processing...
                            </span>
                          ) : item.actionStatus === 'success' ? (
                            <span className="inline-flex items-center text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                              {item.actionMessage || 'Success'}
                            </span>
                          ) : item.actionStatus === 'already_invited' || item.status === 'invited' ? (
                            <div className="flex items-center justify-end gap-2">
                              <div className="text-right hidden sm:block">
                                <span className="text-xs font-medium text-blue-600 dark:text-blue-400 block leading-tight">
                                  Invite Already Sent
                                </span>
                                <span className="text-[10px] text-muted-foreground block leading-tight">
                                  Pending learner acceptance
                                </span>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => handleSingleAction(item, 'enroll')}
                                className="h-7 px-2 text-[11px] bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-xs"
                                title="Direct Force Enroll into Program (bypasses pending invite)"
                              >
                                <UserPlus className="w-3 h-3 mr-1" />
                                Force Enroll
                              </Button>
                            </div>
                          ) : item.actionStatus === 'error' ? (
                            <div className="flex items-center justify-end gap-2">
                              <div className="text-right max-w-[220px]">
                                <span className="text-xs font-semibold text-destructive flex items-center justify-end gap-1 leading-tight">
                                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                  Action Failed
                                </span>
                                <span
                                  className="text-[10px] text-muted-foreground block truncate leading-tight mt-0.5"
                                  title={item.actionMessage}
                                >
                                  {item.actionMessage}
                                </span>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSingleAction(item, 'invite')}
                                className="h-7 px-2 text-[11px]"
                                title="Retry sending invitation"
                              >
                                <Mail className="w-3 h-3 mr-1 text-indigo-500" />
                                Retry
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleSingleAction(item, 'enroll')}
                                className="h-7 px-2 text-[11px] bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
                                title="Direct Force Enroll into Program"
                              >
                                <UserPlus className="w-3 h-3 mr-1" />
                                Enroll
                              </Button>
                            </div>
                          ) : item.status === 'not_enrolled' ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSingleAction(item, 'invite')}
                                className="h-7 px-2 text-[11px]"
                                title="Send Coursera Email Invitation"
                              >
                                <Mail className="w-3 h-3 mr-1 text-indigo-500" />
                                Invite
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleSingleAction(item, 'enroll')}
                                className="h-7 px-2 text-[11px] bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
                                title="Direct Force Enroll into Program"
                              >
                                <UserPlus className="w-3 h-3 mr-1" />
                                Enroll
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">
                              Already enrolled
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
