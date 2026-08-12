"use client";

import React, { useState } from "react";
import { BarChart3, FileSpreadsheet, Check, SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PageBanner } from "@/components/shared/page-banner";
import ExcelJS from "exceljs";
import { toast } from "sonner";

const AVAILABLE_FIELDS = [
  { id: "name", label: "Alumnus Name", group: "Identity" },
  { id: "email", label: "Email", group: "Identity" },
  { id: "campus", label: "Campus", group: "Identity" },
  { id: "course", label: "Course", group: "Identity" },
  { id: "status", label: "Master Status", group: "Identity" },
  { id: "company", label: "Current Company", group: "Profile" },
  { id: "salary", label: "Monthly Salary (INR)", group: "Profile" },
  { id: "last_contact", label: "Last Contact Date", group: "Interactions" },
  { id: "last_outcome", label: "Last Outcome Tag", group: "Interactions" },
  { id: "pf_counted", label: "Pay-Forward Cap Progress (INR)", group: "Pay-Forward" },
  { id: "pf_lifetime", label: "Lifetime Contribution (INR)", group: "Pay-Forward" },
  { id: "mentoring_status", label: "Mentoring Pipeline Stage", group: "Pipelines" },
  { id: "placement_status", label: "Placement Pipeline Stage", group: "Pipelines" },
];

const PRESETS = [
  {
    id: "pay_forward",
    name: "Pay-Forward Report",
    desc: "Cap progress, monthly salary bands, monetary + non-monetary totals",
    fields: ["name", "email", "campus", "salary", "pf_counted", "pf_lifetime"],
  },
  {
    id: "mentoring",
    name: "Mentoring Pipeline Report",
    desc: "Stage breakdown, mentoring interest, session matching",
    fields: ["name", "email", "campus", "course", "mentoring_status", "last_contact"],
  },
  {
    id: "placement",
    name: "Placement Pipeline Report",
    desc: "Working status, current company, placement support outreach",
    fields: ["name", "email", "campus", "company", "placement_status", "last_outcome"],
  },
  {
    id: "consolidated_donor",
    name: "Consolidated Donor Report",
    desc: "Rollup of all donor contributions across campuses & teams",
    fields: ["name", "email", "campus", "pf_counted", "pf_lifetime", "last_contact"],
  },
];

interface ReportsClientProps {
  sampleData: any[];
  teamActivity: { staff: string; calls: number; messages: number; other: number; total: number }[];
}

export default function ReportsClient({ sampleData, teamActivity }: ReportsClientProps) {
  const [selectedFields, setSelectedFields] = useState<string[]>([
    "name",
    "email",
    "campus",
    "company",
    "salary",
    "pf_lifetime",
  ]);
  const [activePreset, setActivePreset] = useState<string>("pay_forward");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [activeTab, setActiveTab] = useState("overview");

  const toggleField = (id: string) => {
    if (selectedFields.includes(id)) {
      if (selectedFields.length === 1) {
        toast.error("At least one field must remain selected");
        return;
      }
      setSelectedFields(selectedFields.filter((f) => f !== id));
    } else {
      setSelectedFields([...selectedFields, id]);
    }
  };

  const applyPreset = (presetId: string) => {
    const preset = PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setSelectedFields(preset.fields);
      setActivePreset(presetId);
      setCurrentPage(1);
      toast.success(`Loaded preset: ${preset.name}`);
    }
  };

  const handleExportXLSX = async () => {
    const exportRows = sampleData.map((item) => {
      const row: Record<string, any> = {};
      selectedFields.forEach((fieldId) => {
        const fieldObj = AVAILABLE_FIELDS.find((f) => f.id === fieldId);
        if (fieldObj) {
          row[fieldObj.label] = item[fieldId] ?? "N/A";
        }
      });
      return row;
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Engagement Report");
    
    if (exportRows.length > 0) {
      const headers = Object.keys(exportRows[0]);
      worksheet.addRow(headers);
      exportRows.forEach(row => {
        worksheet.addRow(Object.values(row));
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `NGConnect_Engagement_Report_${new Date().toISOString().split("T")[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Exported report to XLSX!");
  };

  // Pagination logic (matching master-data)
  const totalEntries = sampleData.length;
  const totalPages = Math.ceil(totalEntries / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalEntries);
  const paginatedData = sampleData.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handlePageSizeChange = (val: string) => {
    setPageSize(parseInt(val, 10));
    setCurrentPage(1);
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-20">
      <PageBanner
        title="Engagement Reporting Hub"
        description={<p>Field-picker driven custom report generator with standard presets & export options.</p>}
        icon={<BarChart3 className="h-8 w-8 text-primary" />}
        actions={
          <Button onClick={handleExportXLSX} className="gap-2 rounded-xl text-xs font-semibold shadow-xs">
            <FileSpreadsheet className="w-4 h-4" /> Export XLSX
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="team">Team Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-0 space-y-6">
          {/* Presets Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {PRESETS.map((preset) => (
          <Card
            key={preset.id}
            onClick={() => applyPreset(preset.id)}
            className={`border cursor-pointer transition-all rounded-2xl ${
              activePreset === preset.id
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border/80 bg-card hover:border-primary/40"
            }`}
          >
            <CardContent className="p-4 space-y-1.5">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-xs text-foreground">{preset.name}</h3>
                {activePreset === preset.id && <Check className="w-4 h-4 text-primary" />}
              </div>
              <p className="text-[11px] text-muted-foreground line-clamp-2">{preset.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Field Picker Controls */}
      <Card className="border border-border/80 rounded-2xl bg-card shadow-2xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-primary" /> Select Fields to Include ({selectedFields.length} Selected)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {AVAILABLE_FIELDS.map((field) => (
              <label
                key={field.id}
                className="flex items-center gap-2 p-2.5 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 cursor-pointer text-xs transition-colors"
              >
                <Checkbox
                  checked={selectedFields.includes(field.id)}
                  onCheckedChange={() => toggleField(field.id)}
                />
                <div>
                  <div className="font-medium text-foreground">{field.label}</div>
                  <div className="text-[9px] text-muted-foreground uppercase tracking-wider">{field.group}</div>
                </div>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Live Preview Table Card */}
      <Card className="border border-border/80 rounded-2xl bg-card shadow-2xs p-3 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse min-w-[60rem]">
            <thead className="bg-muted/50 border-b border-border/60 uppercase tracking-wider">
              <tr>
                {selectedFields.map((fieldId) => {
                  const f = AVAILABLE_FIELDS.find((item) => item.id === fieldId);
                  return <th key={fieldId} className="px-3 py-2.5 font-bold text-[9px] text-muted-foreground">{f?.label || fieldId}</th>;
                })}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((item, idx) => (
                <tr key={idx} className="border-t border-border/40 hover:bg-muted/15 transition-colors">
                  {selectedFields.map((fieldId) => (
                    <td key={fieldId} className="px-3 py-2.5">
                      {item[fieldId] !== undefined ? String(item[fieldId]) : "—"}
                    </td>
                  ))}
                </tr>
              ))}
              {sampleData.length === 0 && (
                <tr>
                  <td colSpan={selectedFields.length} className="py-12 text-center text-muted-foreground">
                    No data available for preview.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Master-Data Style Pagination Footer */}
        <CardFooter className="pt-3 pb-1 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border/40">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Rows per page:</span>
              <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                <SelectTrigger className="h-7 w-16 text-xs rounded-md">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="text-xs rounded-md">
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <span className="text-xs text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{totalEntries > 0 ? startIndex + 1 : 0}</span> - <span className="font-semibold text-foreground">{endIndex}</span> of <span className="font-semibold text-foreground">{totalEntries}</span> entries
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-7 rounded-md gap-1 text-[11px] font-semibold px-2"
            >
              <ChevronLeft className="w-3 h-3" /> Prev
            </Button>

            <div className="flex gap-1 hidden sm:flex">
              {Array.from({ length: totalPages }).map((_, idx) => (
                <Button
                  key={idx}
                  variant={currentPage === idx + 1 ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(idx + 1)}
                  className="h-7 w-7 rounded-md font-bold text-[11px] p-0"
                >
                  {idx + 1}
                </Button>
              ))}
            </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="h-7 rounded-md gap-1 text-[11px] font-semibold px-2"
              >
                Next <ChevronRight className="w-3 h-3" />
              </Button>
            </div>
          </CardFooter>
        </Card>
        </TabsContent>

        <TabsContent value="team" className="mt-0 space-y-6">
          <Card className="border border-border/80 rounded-2xl bg-card shadow-2xs p-3 overflow-hidden">
            <CardHeader className="pb-3 px-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                Team Activity (Last 30 Days)
              </CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse min-w-[40rem]">
                <thead className="bg-muted/50 border-b border-border/60 uppercase tracking-wider">
                  <tr>
                    <th className="px-3 py-2.5 font-bold text-[9px] text-muted-foreground">Staff Member</th>
                    <th className="px-3 py-2.5 font-bold text-[9px] text-muted-foreground">Calls</th>
                    <th className="px-3 py-2.5 font-bold text-[9px] text-muted-foreground">Messages (WhatsApp)</th>
                    <th className="px-3 py-2.5 font-bold text-[9px] text-muted-foreground">Other</th>
                    <th className="px-3 py-2.5 font-bold text-[9px] text-muted-foreground">Total Interactions</th>
                  </tr>
                </thead>
                <tbody>
                  {teamActivity.map((item, idx) => (
                    <tr key={idx} className="border-t border-border/40 hover:bg-muted/15 transition-colors">
                      <td className="px-3 py-2.5 font-semibold text-foreground">{item.staff}</td>
                      <td className="px-3 py-2.5 text-indigo-600 dark:text-indigo-400 font-bold">{item.calls}</td>
                      <td className="px-3 py-2.5 text-emerald-600 dark:text-emerald-400 font-bold">{item.messages}</td>
                      <td className="px-3 py-2.5 text-muted-foreground font-bold">{item.other}</td>
                      <td className="px-3 py-2.5 text-foreground font-black">{item.total}</td>
                    </tr>
                  ))}
                  {teamActivity.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-muted-foreground">
                        No team activity found in the last 30 days.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
