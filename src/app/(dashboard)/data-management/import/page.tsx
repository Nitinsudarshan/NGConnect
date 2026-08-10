"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileUp,
  Settings2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Save,
  Eye,
  Info,
  Database,
  ArrowRight,
  Sparkles,
  Sheet,
  FileText
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import type { GharColumnMap, ImportPreviewResult, ParsedImportRow } from '@/types/import';

const MAP_FIELDS = [
  { key: 'email', label: 'Email Address (Primary Key)', required: true },
  { key: 'name', label: 'Full Name', required: false },
  { key: 'phone_number', label: 'Phone Number', required: false },
  { key: 'gender', label: 'Gender', required: false },
  { key: 'city', label: 'City', required: false },
  { key: 'state', label: 'State', required: false },
  { key: 'campus', label: 'Campus Name', required: false },
  { key: 'course', label: 'Course/School Name', required: false },
  { key: 'entry_year', label: 'Entry Year', required: false },
  { key: 'technology_stack', label: 'Technology Stack', required: false },
  { key: 'donor', label: 'Donor', required: false },
  { key: 'cycle', label: 'Placement Cycle', required: false },
  { key: 'company', label: 'Company Name', required: false },
  { key: 'starting_position', label: 'Starting Position', required: false },
  { key: 'starting_salary', label: 'Starting Salary', required: false },
  { key: 'month_of_placement', label: 'Month of Placement', required: false },
  { key: 'year_of_placement', label: 'Year of Placement', required: false },
  { key: 'linkedin_profile', label: 'LinkedIn Profile URL', required: false },
  { key: 'status', label: 'Alumni Status', required: false },
  { key: 'dropout_date', label: 'Dropout Date', required: false },
  { key: 'reason', label: 'Status Reason/Note', required: false },
];

export default function ImportAlumniDataPage() {
  const router = useRouter();

  // Mapping state
  const [mapping, setMapping] = useState<GharColumnMap>({});
  const [showMapping, setShowMapping] = useState(false);
  const [isSavingMapping, setIsSavingMapping] = useState(false);

  // File import state
  const [file, setFile] = useState<File | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewResult, setPreviewResult] = useState<ImportPreviewResult | null>(null);

  // Import processing state
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importStep, setImportStep] = useState<string>('');
  const [importResult, setImportResult] = useState<any | null>(null);

  // Load current mapping on mount
  useEffect(() => {
    fetch('/api/alumni/import/mapping')
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setMapping(data);
        }
      })
      .catch(err => {
        console.error('Failed to load mapping config:', err);
      });
  }, []);

  const handleSaveMapping = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingMapping(true);
    try {
      const res = await fetch('/api/alumni/import/mapping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mapping)
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
      } else {
        toast.success('Column mappings updated successfully');
        setShowMapping(false);
      }
    } catch (err) {
      toast.error('Failed to save mapping config');
    } finally {
      setIsSavingMapping(false);
    }
  };

  const handleMappingChange = (key: string, val: string) => {
    setMapping(prev => ({
      ...prev,
      [key]: val
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setPreviewResult(null);
    }
  };

  const handleGeneratePreview = async () => {
    if (!file) {
      toast.error('Please select a file to preview');
      return;
    }
    setIsPreviewing(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/alumni/import/preview', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setPreviewResult(data);
        toast.success(`Parsed ${data.total_rows} rows successfully`);
      } else {
        toast.error(data.error || 'Preview failed');
      }
    } catch (err) {
      toast.error('Failed to parse file preview');
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleProceedImport = async () => {
    if (!file) return;

    setIsImporting(true);
    setImportStep('Uploading file...');
    setImportProgress(15);

    try {
      const uploadForm = new FormData();
      uploadForm.append('file', file);
      const uploadRes = await fetch('/api/alumni/import/upload', {
        method: 'POST',
        body: uploadForm
      });
      const uploadData = await uploadRes.json();

      if (!uploadRes.ok) {
        throw new Error(uploadData.error || 'File upload failed');
      }

      setImportStep('Processing records...');
      setImportProgress(50);

      const processRes = await fetch('/api/alumni/import/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId: uploadData.batchId,
          storagePath: uploadData.storagePath
        })
      });
      const processData = await processRes.json();

      if (!processRes.ok) {
        throw new Error(processData.error || 'Record processing failed');
      }

      setImportProgress(100);
      setImportResult(processData);
      toast.success('Import batch processed successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Import failed');
      setImportResult({
        status: 'failed',
        error_message: err.message
      });
    } finally {
      setIsImporting(false);
    }
  };

  const resetImportFlow = () => {
    setFile(null);
    setPreviewResult(null);
    setIsImporting(false);
    setImportProgress(0);
    setImportResult(null);
  };

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
            <h1 className="text-2xl font-bold tracking-tight">Import Alumni Data</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Upload raw CSV or XLSX spreadsheets. Validate schema mapping and row entries before commit.
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 rounded-md"
            onClick={() => setShowMapping(!showMapping)}
          >
            <Settings2 className="w-4 h-4" />
            {showMapping ? 'Hide Mapping Config' : 'Configure Column Map'}
          </Button>
        </div>
      </div>

      {/* Mapping Configuration Panel */}
      {showMapping && (
        <Card className="border-indigo-500/30 bg-indigo-500/5 shadow-lg rounded-md animate-in slide-in-from-top-4 duration-300">
          <form onSubmit={handleSaveMapping}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
                <Settings2 className="w-5 h-5" />
                Column Mapping Rules
              </CardTitle>
              <CardDescription>
                Define the header names used in the incoming spreadsheet exports. Values are mapped dynamically to the database columns.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {MAP_FIELDS.map((field) => (
                <div key={field.key} className="space-y-1.5 bg-card/40 border border-border/50 p-3 rounded-md hover:border-indigo-500/35 transition-colors">
                  <label className="text-[11px] font-bold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
                    {field.label}
                    {field.required && (
                      <span className="text-red-500 font-bold">*</span>
                    )}
                  </label>
                  <Input
                    placeholder={`e.g. ${field.label}`}
                    value={(mapping as any)[field.key] || ''}
                    onChange={(e) => handleMappingChange(field.key, e.target.value)}
                    className="h-8 text-xs rounded-md"
                    required={field.required}
                  />
                </div>
              ))}
            </CardContent>
            <CardFooter className="border-t border-border/60 pt-4 flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" className="rounded-md" onClick={() => setShowMapping(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="gap-2 rounded-md" disabled={isSavingMapping}>
                {isSavingMapping ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                Save Mapping Rules
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {/* File Dropzone */}
      {!previewResult && !isImporting && (
        <div className="border-2 border-dashed border-border/80 rounded-md p-14 text-center bg-card/30 hover:bg-card/70 hover:border-primary/40 transition-all duration-300 relative overflow-hidden group">
          {/* Subtle Ambient Background Light */}
          <div className="absolute -inset-10 bg-radial-gradient from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

          <div className="max-w-md mx-auto space-y-6 flex flex-col items-center relative z-10">
            <div className="p-4.5 bg-primary/5 text-primary rounded-md group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-sm border border-primary/10">
              <FileUp className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-lg text-foreground">Select your GHAR Export Spreadsheet</p>
              <p className="text-xs text-muted-foreground max-w-[18rem] mx-auto leading-relaxed">
                Drag and drop your spreadsheet here or click browse. Supports CSV or Microsoft Excel (XLSX).
              </p>
            </div>

            <div className="relative pt-2 w-full">
              <input
                type="file"
                accept=".csv,.xlsx"
                id="file-upload"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="flex gap-2 justify-center">
                <Button asChild variant="outline" className="rounded-md hover:scale-105 transition-transform">
                  <label htmlFor="file-upload" className="cursor-pointer">
                    Browse File
                  </label>
                </Button>
                {file && (
                  <Button onClick={handleGeneratePreview} disabled={isPreviewing} className="rounded-md hover:scale-105 transition-transform">
                    {isPreviewing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating Preview...
                      </>
                    ) : (
                      'Load Preview'
                    )}
                  </Button>
                )}
              </div>
              {file && (
                <div className="mt-4 inline-flex items-center gap-2 text-xs font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3.5 py-2 rounded-md border border-emerald-500/20 animate-in zoom-in-95 duration-200">
                  <Sheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{file.name} ({Math.round(file.size / 1024)} KB)</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Import Progress Loader */}
      {isImporting && (
        <Card className="p-8 text-center space-y-6 border border-indigo-500/20 bg-indigo-500/5 rounded-md shadow-md">
          <div className="flex flex-col items-center space-y-2">
            <Loader2 className="w-9 h-9 animate-spin text-primary" />
            <p className="font-bold text-lg text-foreground">{importStep}</p>
            <p className="text-xs text-muted-foreground">Database triggers and audit log pipelines are executing. Please wait.</p>
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <Progress value={importProgress} className="h-2.5 rounded-md" />
            <p className="text-right text-xs font-bold font-mono text-muted-foreground">{importProgress}%</p>
          </div>
        </Card>
      )}

      {/* Import Result Screen */}
      {importResult && (
        <Card className="border border-border/80 rounded-md overflow-hidden shadow-lg animate-in zoom-in-98 duration-300">
          <CardHeader className="border-b border-border/60 bg-muted/20 pb-5">
            <CardTitle className="flex items-center gap-2.5">
              {importResult.status === 'completed' ? (
                <>
                  <div className="p-1.5 bg-emerald-500/10 rounded-md text-emerald-600">
                    <CheckCircle2 className="w-6 h-6 animate-bounce" />
                  </div>
                  <span className="text-xl font-bold tracking-tight">Import Processing Completed</span>
                </>
              ) : (
                <>
                  <div className="p-1.5 bg-red-500/10 rounded-md text-red-600">
                    <XCircle className="w-6 h-6" />
                  </div>
                  <span className="text-xl font-bold tracking-tight">Import Processing Failed</span>
                </>
              )}
            </CardTitle>
            <CardDescription className="mt-1">
              Job summary log for file import execution. All actions recorded in audit trail.
            </CardDescription>
          </CardHeader>
          <CardContent className="py-8 space-y-8">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-md bg-card border border-border/60 hover:shadow-sm transition-shadow">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Total Processed</p>
                <p className="text-3xl font-extrabold tracking-tight mt-1">{importResult.records_processed ?? 0}</p>
              </div>
              <div className="p-4 rounded-md bg-emerald-500/5 border border-emerald-500/15 hover:shadow-sm transition-shadow">
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-bold tracking-wider">Created (New)</p>
                <p className="text-3xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400 mt-1">{importResult.records_created ?? 0}</p>
              </div>
              <div className="p-4 rounded-md bg-blue-500/5 border border-blue-500/15 hover:shadow-sm transition-shadow">
                <p className="text-[10px] text-blue-600 dark:text-blue-400 uppercase font-bold tracking-wider">Updated</p>
                <p className="text-3xl font-extrabold tracking-tight text-blue-600 dark:text-blue-400 mt-1">{importResult.records_updated ?? 0}</p>
              </div>
              <div className="p-4 rounded-md bg-red-500/5 border border-red-500/15 hover:shadow-sm transition-shadow">
                <p className="text-[10px] text-red-600 dark:text-red-400 uppercase font-bold tracking-wider">Failed Rows</p>
                <p className="text-3xl font-extrabold tracking-tight text-red-600 dark:text-red-400 mt-1">{importResult.records_failed ?? 0}</p>
              </div>
            </div>

            {/* Error logs */}
            {importResult.errors && importResult.errors.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-bold text-sm text-red-700 dark:text-red-400 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  Skipped / Failed Row Logs
                </h3>
                <div className="border border-border/80 rounded-md overflow-hidden text-xs font-mono bg-card">
                  <div className="max-h-60 overflow-y-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-muted sticky top-0 border-b">
                        <tr>
                          <th className="px-4 py-2.5 font-bold">Email Anchor</th>
                          <th className="px-4 py-2.5 font-bold">Failure Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importResult.errors.map((err: any, idx: number) => (
                          <tr key={idx} className="border-t border-border/50 hover:bg-muted/40 transition-colors">
                            <td className="px-4 py-2.5 font-semibold text-foreground">{err.email || '(blank)'}</td>
                            <td className="px-4 py-2.5 text-red-600 dark:text-red-400">{err.error}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="border-t border-border/60 bg-muted/10 justify-end gap-2 pt-4 pb-4">
            <Button variant="outline" className="rounded-md" onClick={resetImportFlow}>
              Import Another File
            </Button>
            <Button className="rounded-md" onClick={() => router.push('/data-management/import-history')}>
              View Import History
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Preview Table */}
      {previewResult && !isImporting && !importResult && (
        <Card className="border border-border/80 rounded-md overflow-hidden shadow-lg animate-in fade-in duration-300">
          <CardHeader className="border-b border-border/60 bg-muted/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-bold tracking-tight">Import Preview & Verification</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Parsed columns and mapped outputs. Verify error highlights before committing batches.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="rounded-md" onClick={resetImportFlow}>
                Cancel File
              </Button>
              <Button
                size="sm"
                onClick={handleProceedImport}
                disabled={previewResult.valid_rows === 0}
                className="gap-1.5 rounded-md hover:scale-105 transition-transform"
              >
                <Database className="w-4 h-4" />
                Commit Mapped Data ({previewResult.valid_rows} Valid Rows)
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* Stats Header */}
            <div className="grid grid-cols-3 divide-x divide-border border-b border-border/60 text-center py-4 bg-muted/5 text-xs font-semibold">
              <div>
                <span className="text-muted-foreground uppercase tracking-wider text-[10px]">Total Rows:</span>{' '}
                <span className="font-extrabold text-sm ml-1 text-foreground">{previewResult.total_rows}</span>
              </div>
              <div>
                <span className="text-emerald-600 uppercase tracking-wider text-[10px]">Valid Rows:</span>{' '}
                <span className="font-extrabold text-sm ml-1 text-emerald-600">{previewResult.valid_rows}</span>
              </div>
              <div>
                <span className="text-red-600 uppercase tracking-wider text-[10px]">Invalid Rows:</span>{' '}
                <span className="font-extrabold text-sm ml-1 text-red-600">{previewResult.invalid_rows}</span>
              </div>
            </div>

            {/* Preview Grid */}
            <div className="overflow-x-auto max-h-[35rem] overflow-y-auto">
              <table className="w-full text-xs text-left border-collapse min-w-[70rem]">
                <thead className="bg-muted sticky top-0 border-b border-border/60 shadow-sm z-10">
                  <tr>
                    <th className="px-4 py-3 w-12 text-center font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Row</th>
                    <th className="px-4 py-3 w-14 text-center font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Status</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Email</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Name</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Campus</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Course</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Entry Year</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Alumni Status</th>
                    <th className="px-4 py-3 max-w-[20rem] font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Notes/Errors</th>
                  </tr>
                </thead>
                <tbody>
                  {previewResult.preview.map((row: ParsedImportRow, idx: number) => {
                    const isValid = row._valid;
                    return (
                      <tr
                        key={idx}
                        className={`border-b border-border/40 transition-colors duration-150 ${isValid
                            ? 'hover:bg-emerald-500/5 bg-emerald-500/1 border-l-[3px] border-l-emerald-500'
                            : 'hover:bg-red-500/5 bg-red-500/1 border-l-[3px] border-l-red-500'
                          }`}
                      >
                        <td className="px-4 py-3 text-center font-mono text-muted-foreground">{idx + 1}</td>
                        <td className="px-4 py-3 text-center">
                          {isValid ? (
                            <div className="inline-flex text-emerald-600"><CheckCircle2 className="w-4 h-4" /></div>
                          ) : (
                            <div className="inline-flex text-red-500"><XCircle className="w-4 h-4" /></div>
                          )}
                        </td>
                        <td className={`px-4 py-3 font-mono font-medium ${!row.email ? 'text-red-500 italic' : 'text-foreground'}`}>
                          {row.email || '(blank email)'}
                        </td>
                        <td className="px-4 py-3 font-semibold">{row.name || '—'}</td>
                        <td className="px-4 py-3">{row.campus || '—'}</td>
                        <td className="px-4 py-3">{row.course || '—'}</td>
                        <td className="px-4 py-3 font-mono">{row.entry_year || '—'}</td>
                        <td className="px-4 py-3">
                          {row.status ? (
                            <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">
                              {row.status}
                            </Badge>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3 max-w-[20rem]">
                          {isValid ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px] flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                            </span>
                          ) : (
                            <div className="flex items-start gap-1 text-red-600 dark:text-red-400 font-bold text-[11px] leading-tight">
                              <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                              <span>
                                {row._errors && row._errors.join('; ')}
                              </span>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
          <CardFooter className="border-t border-border/60 bg-muted/20 text-xs py-3 flex items-center gap-1.5 text-muted-foreground font-medium">
            <Info className="w-4 h-4 shrink-0 text-primary" />
            Showing up to 50 preview records. Please review carefully.
          </CardFooter>
        </Card>
      )}

    </div>
  );
}
