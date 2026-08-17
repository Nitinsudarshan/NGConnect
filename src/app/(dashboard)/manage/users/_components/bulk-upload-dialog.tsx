"use client";

import React, { useState } from "react";
import readXlsxFile from "read-excel-file/browser";
import { toast } from "sonner";
import { bulkCreateUsers, BulkUserRow } from "../actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  FileUp,
  Loader2,
  Download,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Database,
  Sheet,
  Info,
} from "lucide-react";

interface BulkUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface ParsedPreviewRow extends BulkUserRow {
  _valid: boolean;
  _error?: string;
}

export function BulkUploadDialog({ open, onOpenChange, onSuccess }: BulkUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewRows, setPreviewRows] = useState<ParsedPreviewRow[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<any | null>(null);

  const resetState = () => {
    setFile(null);
    setPreviewRows([]);
    setIsParsing(false);
    setIsImporting(false);
    setImportResult(null);
  };

  const handleClose = (newOpen: boolean) => {
    if (!isImporting) {
      if (!newOpen) resetState();
      onOpenChange(newOpen);
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent =
      "email,full_name,role,team,is_alumni\n" +
      "rahul.sharma@example.com,Rahul Sharma,Member,Alumni Growth,Yes\n" +
      "priya.singh@example.com,Priya Singh,Operations,PNC,Yes\n" +
      "amit.kumar@example.com,Amit Kumar,Viewer,None,No\n";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "ngconnect_users_sample_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Downloaded sample CSV template.");
  };

  const parseFileRows = async (selectedFile: File): Promise<Record<string, string>[]> => {
    const isCsv = selectedFile.name.toLowerCase().endsWith(".csv");

    if (isCsv) {
      const text = await selectedFile.text();
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length < 2) return [];

      const headers = lines[0].split(",").map((h) => h.trim().replace(/^["']|["']$/g, ""));
      const rawRows: Record<string, string>[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const values = line.split(",").map((v) => v.trim().replace(/^["']|["']$/g, ""));
        const rowObj: Record<string, string> = {};
        headers.forEach((header, idx) => {
          rowObj[header] = values[idx] || "";
        });
        rawRows.push(rowObj);
      }
      return rawRows;
    } else {
      const rows = await readXlsxFile(selectedFile);
      if (!rows || rows.length < 2) return [];

      const headers = (rows[0] as any[]).map((h) => String(h || "").trim());
      const rawRows: Record<string, string>[] = [];

      for (let i = 1; i < rows.length; i++) {
        const rowData = rows[i] as any[];
        const rowObj: Record<string, string> = {};
        headers.forEach((header, idx) => {
          const val = rowData[idx] !== null && rowData[idx] !== undefined ? String(rowData[idx]).trim() : "";
          rowObj[header] = val;
        });
        rawRows.push(rowObj);
      }
      return rawRows;
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setPreviewRows([]);
    setImportResult(null);
    setIsParsing(true);

    try {
      const rawJson = await parseFileRows(selectedFile);

      if (!rawJson || rawJson.length === 0) {
        toast.error("The selected file contains no readable rows.");
        setIsParsing(false);
        return;
      }

      const parsed: ParsedPreviewRow[] = rawJson.map((row) => {
        const normalizedRow: Record<string, any> = {};
        Object.keys(row).forEach((k) => {
          normalizedRow[k.trim().toLowerCase().replace(/[\s_\-]+/g, "_")] = row[k];
        });

        const email = String(normalizedRow.email || normalizedRow.email_address || "").trim();
        const fullName = String(normalizedRow.full_name || normalizedRow.name || "").trim();
        const role = String(normalizedRow.role || "").trim();
        const team = String(normalizedRow.team || "").trim();
        
        let isAlumni = true;
        if (normalizedRow.is_alumni !== undefined && normalizedRow.is_alumni !== "") {
          const val = String(normalizedRow.is_alumni).trim().toLowerCase();
          if (val === "no" || val === "false" || val === "0") isAlumni = false;
        }

        const isValid = Boolean(email && email.includes("@"));
        const errorMsg = !email
          ? "Missing email address"
          : !email.includes("@")
          ? "Invalid email format"
          : undefined;

        return {
          email,
          full_name: fullName,
          role: role || "Member",
          team: team || "None",
          is_alumni: isAlumni,
          _valid: isValid,
          _error: errorMsg,
        };
      });

      setPreviewRows(parsed);
      toast.success(`Parsed ${parsed.length} row(s) from ${selectedFile.name}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to parse spreadsheet.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleCommitImport = async () => {
    const validRows = previewRows.filter((r) => r._valid);
    if (validRows.length === 0) {
      toast.error("No valid user rows to import.");
      return;
    }

    setIsImporting(true);
    try {
      const res = await bulkCreateUsers(
        validRows.map((r) => ({
          email: r.email,
          full_name: r.full_name,
          role: r.role,
          team: r.team,
          is_alumni: r.is_alumni,
        }))
      );

      if (res?.error) {
        toast.error(res.error);
        setImportResult({ status: "failed", error_message: res.error });
      } else {
        setImportResult(res);
        toast.success(`Bulk upload processed! ${res.records_created} created, ${res.records_updated} updated.`);
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      toast.error(err.message || "Bulk import failed.");
      setImportResult({ status: "failed", error_message: err.message });
    } finally {
      setIsImporting(false);
    }
  };

  const validCount = previewRows.filter((r) => r._valid).length;
  const invalidCount = previewRows.filter((r) => !r._valid).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto rounded-2xl border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <DialogHeader className="space-y-1.5 border-b pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold tracking-tight flex items-center gap-2 text-slate-900 dark:text-zinc-100">
              <div className="p-2 bg-indigo-500/10 text-indigo-600 rounded-xl">
                <FileUp className="h-5 w-5" />
              </div>
              Bulk Upload Users
            </DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadTemplate}
              className="h-8 text-xs font-semibold rounded-lg gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              Sample Template
            </Button>
          </div>
          <DialogDescription className="text-muted-foreground text-xs font-medium">
            Upload CSV or XLSX spreadsheets to batch create or update user accounts with role and team assignments.
          </DialogDescription>
        </DialogHeader>

        {/* 1. File Upload Dropzone (When no preview rows & not importing) */}
        {previewRows.length === 0 && !isImporting && !importResult && (
          <div className="py-8">
            <div className="border-2 border-dashed border-border/80 rounded-2xl p-10 text-center bg-card/40 hover:bg-card/70 hover:border-indigo-500/40 transition-all duration-300 relative overflow-hidden group">
              <div className="max-w-md mx-auto space-y-4 flex flex-col items-center">
                <div className="p-4 bg-indigo-500/10 text-indigo-600 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <FileUp className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-base text-foreground">Select spreadsheet file</p>
                  <p className="text-xs text-muted-foreground">
                    Supports .CSV or .XLSX files containing columns: <code className="font-mono text-indigo-500">email</code>, <code className="font-mono text-indigo-500">full_name</code>, <code className="font-mono text-indigo-500">role</code>, <code className="font-mono text-indigo-500">team</code>, <code className="font-mono text-indigo-500">is_alumni</code>.
                  </p>
                </div>

                <div className="relative pt-2">
                  <input
                    type="file"
                    accept=".csv,.xlsx"
                    id="bulk-users-upload"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <Button asChild variant="default" className="rounded-xl font-semibold hover:scale-105 transition-transform">
                    <label htmlFor="bulk-users-upload" className="cursor-pointer flex items-center gap-2">
                      {isParsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />}
                      {isParsing ? "Parsing File..." : "Browse Spreadsheet"}
                    </label>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. Loading State */}
        {isImporting && (
          <div className="py-12 text-center space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto" />
            <div>
              <p className="font-bold text-base text-foreground">Processing User Batch Import</p>
              <p className="text-xs text-muted-foreground mt-1">Creating auth credentials and syncing metadata...</p>
            </div>
            <Progress value={65} className="h-2 rounded-full max-w-xs mx-auto" />
          </div>
        )}

        {/* 3. Summary Result Screen */}
        {importResult && (
          <div className="py-4 space-y-6">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span className="font-bold text-base">Import Execution Complete</span>
              </div>
              <div className="grid grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-card border rounded-lg">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Processed</p>
                  <p className="text-xl font-black mt-0.5">{importResult.records_processed ?? 0}</p>
                </div>
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 text-emerald-700 dark:text-emerald-400 rounded-lg">
                  <p className="text-[10px] uppercase font-bold">Created</p>
                  <p className="text-xl font-black mt-0.5">{importResult.records_created ?? 0}</p>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 text-blue-700 dark:text-blue-400 rounded-lg">
                  <p className="text-[10px] uppercase font-bold">Updated</p>
                  <p className="text-xl font-black mt-0.5">{importResult.records_updated ?? 0}</p>
                </div>
                <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 text-rose-700 dark:text-rose-400 rounded-lg">
                  <p className="text-[10px] uppercase font-bold">Failed</p>
                  <p className="text-xl font-black mt-0.5">{importResult.records_failed ?? 0}</p>
                </div>
              </div>
            </div>

            {importResult.errors && importResult.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-bold text-xs text-rose-600 flex items-center gap-1.5 uppercase tracking-wider">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Skipped / Failed Entries
                </h4>
                <div className="max-h-40 overflow-y-auto border rounded-xl font-mono text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-muted sticky top-0">
                      <tr>
                        <th className="p-2.5 font-bold">Email</th>
                        <th className="p-2.5 font-bold">Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importResult.errors.map((err: any, idx: number) => (
                        <tr key={idx} className="border-t">
                          <td className="p-2.5">{err.email}</td>
                          <td className="p-2.5 text-rose-500">{err.error}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={resetState} className="rounded-xl">
                Upload Another Spreadsheet
              </Button>
              <Button onClick={() => handleClose(false)} className="rounded-xl">
                Done
              </Button>
            </div>
          </div>
        )}

        {/* 4. Preview Table Grid */}
        {previewRows.length > 0 && !isImporting && !importResult && (
          <div className="py-3 space-y-4">
            <div className="flex items-center justify-between bg-muted/40 p-3 rounded-xl text-xs font-semibold border">
              <div className="flex items-center gap-2">
                <Sheet className="w-4 h-4 text-indigo-500" />
                <span>{file?.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-emerald-600 font-bold">{validCount} Valid</span>
                {invalidCount > 0 && <span className="text-rose-500 font-bold">{invalidCount} Invalid</span>}
              </div>
            </div>

            <div className="max-h-[320px] overflow-y-auto border rounded-xl overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted sticky top-0 border-b">
                  <tr>
                    <th className="p-2.5 font-bold">Status</th>
                    <th className="p-2.5 font-bold">Email</th>
                    <th className="p-2.5 font-bold">Full Name</th>
                    <th className="p-2.5 font-bold">Role</th>
                    <th className="p-2.5 font-bold">Team</th>
                    <th className="p-2.5 font-bold">Alumni</th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, idx) => (
                    <tr key={idx} className={`border-b ${row._valid ? "hover:bg-emerald-500/5" : "bg-rose-500/5 hover:bg-rose-500/10"}`}>
                      <td className="p-2.5">
                        {row._valid ? (
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] px-2 py-0">
                            Valid
                          </Badge>
                        ) : (
                          <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[10px] px-2 py-0">
                            {row._error || "Invalid"}
                          </Badge>
                        )}
                      </td>
                      <td className="p-2.5 font-mono font-medium">{row.email || "(blank)"}</td>
                      <td className="p-2.5 font-semibold">{row.full_name || "—"}</td>
                      <td className="p-2.5">{row.role}</td>
                      <td className="p-2.5">{row.team}</td>
                      <td className="p-2.5">{row.is_alumni ? "Yes" : "No"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <DialogFooter className="mt-4 gap-2 sm:gap-0">
              <Button variant="outline" onClick={resetState} className="rounded-xl">
                Choose Different File
              </Button>
              <Button
                onClick={handleCommitImport}
                disabled={validCount === 0}
                className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-5 flex items-center gap-2"
              >
                <Database className="w-4 h-4" />
                Commit Import ({validCount} Users)
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
