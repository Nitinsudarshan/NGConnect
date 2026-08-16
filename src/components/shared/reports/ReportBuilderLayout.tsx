"use client";

import React, { useState, useMemo } from "react";
import { BarChart3, FileSpreadsheet, Check, SlidersHorizontal, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PageBanner } from "@/components/shared/page-banner";
import ExcelJS from "exceljs";
import { toast } from "sonner";

export interface ReportField {
  id: string;
  label: string;
  group: string;
}

export interface ReportPreset {
  id: string;
  name: string;
  desc: string;
  fields: string[];
}

export interface ReportBuilderTab {
  id: string;
  label: string;
  content: React.ReactNode;
}

export interface ReportBuilderProps {
  title: string;
  description: React.ReactNode;
  icon?: React.ReactNode;
  availableFields: ReportField[];
  presets: ReportPreset[];
  data: Record<string, any>[];
  defaultFields?: string[];
  defaultPresetId?: string;
  exportFilenamePrefix?: string;
  extraTabs?: ReportBuilderTab[];
}

export function ReportBuilderLayout({
  title,
  description,
  icon = <BarChart3 className="h-8 w-8 text-primary" />,
  availableFields,
  presets,
  data,
  defaultFields,
  defaultPresetId,
  exportFilenamePrefix = "NGConnect_Report",
  extraTabs = [],
}: ReportBuilderProps) {
  const initialFields = defaultFields || (presets[0] ? presets[0].fields : availableFields.map(f => f.id));
  const initialPreset = defaultPresetId || (presets[0] ? presets[0].id : "");

  const [selectedFields, setSelectedFields] = useState<string[]>(initialFields);
  const [activePreset, setActivePreset] = useState<string>(initialPreset);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [activeTab, setActiveTab] = useState<string>("overview");

  // Group fields by category
  const groupedFields = useMemo(() => {
    const map: Record<string, ReportField[]> = {};
    availableFields.forEach(f => {
      if (!map[f.group]) map[f.group] = [];
      map[f.group].push(f);
    });
    return map;
  }, [availableFields]);

  // Toggle single field
  const toggleField = (id: string) => {
    if (selectedFields.includes(id)) {
      if (selectedFields.length === 1) {
        toast.error("At least one field must remain selected");
        return;
      }
      setSelectedFields(selectedFields.filter(f => f !== id));
    } else {
      setSelectedFields([...selectedFields, id]);
    }
  };

  // Apply preset
  const applyPreset = (presetId: string) => {
    const preset = presets.find(p => p.id === presetId);
    if (preset) {
      setSelectedFields(preset.fields);
      setActivePreset(presetId);
      setCurrentPage(1);
      toast.success(`Loaded preset: ${preset.name}`);
    }
  };

  // Search filter
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const q = searchQuery.toLowerCase();
    return data.filter(item => {
      return Object.values(item).some(val => String(val || "").toLowerCase().includes(q));
    });
  }, [data, searchQuery]);

  // Export to Excel
  const handleExportXLSX = async () => {
    if (filteredData.length === 0) {
      toast.error("No data available to export");
      return;
    }

    const exportRows = filteredData.map(item => {
      const row: Record<string, any> = {};
      selectedFields.forEach(fieldId => {
        const fieldObj = availableFields.find(f => f.id === fieldId);
        if (fieldObj) {
          row[fieldObj.label] = item[fieldId] ?? "N/A";
        }
      });
      return row;
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Report Data");

    if (exportRows.length > 0) {
      const headers = Object.keys(exportRows[0]);
      worksheet.addRow(headers);
      exportRows.forEach(row => {
        worksheet.addRow(Object.values(row));
      });

      // Style header row
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true };
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${exportFilenamePrefix}_${new Date().toISOString().split("T")[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Exported report to XLSX!");
  };

  // Pagination logic
  const totalEntries = filteredData.length;
  const totalPages = Math.ceil(totalEntries / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalEntries);
  const paginatedData = filteredData.slice(startIndex, endIndex);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-20">
      <PageBanner
        title={title}
        description={description}
        icon={icon}
        actions={
          <Button onClick={handleExportXLSX} className="gap-2 rounded-xl text-xs font-semibold shadow-xs">
            <FileSpreadsheet className="w-4 h-4" /> Export XLSX
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Report Builder</TabsTrigger>
          {extraTabs.map(tab => (
            <TabsTrigger key={tab.id} value={tab.id}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="mt-0 space-y-6">
          {/* Presets Cards */}
          {presets.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {presets.map(preset => (
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
          )}

          {/* Field Selection Panel */}
          <Card className="border border-border/80 rounded-2xl bg-card shadow-2xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-primary" /> Select Fields to Include ({selectedFields.length} Selected)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(groupedFields).map(([groupName, groupFields]) => (
                <div key={groupName} className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{groupName}</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                    {groupFields.map(field => (
                      <label
                        key={field.id}
                        className="flex items-center gap-2 p-2.5 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 cursor-pointer text-xs transition-colors"
                      >
                        <Checkbox
                          checked={selectedFields.includes(field.id)}
                          onCheckedChange={() => toggleField(field.id)}
                        />
                        <span className="font-medium text-foreground">{field.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Live Preview Table */}
          <Card className="border border-border/80 rounded-2xl bg-card shadow-2xs overflow-hidden">
            <CardHeader className="border-b border-border/60 bg-muted/10 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    Live Report Preview
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Showing {paginatedData.length} of {filteredData.length} matching records
                  </p>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search in report..."
                    value={searchQuery}
                    onChange={e => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-9 h-9 text-xs rounded-xl"
                  />
                </div>
              </div>
            </CardHeader>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-muted/50 border-b border-border/60">
                  <tr>
                    {selectedFields.map(fieldId => {
                      const fieldObj = availableFields.find(f => f.id === fieldId);
                      return (
                        <th key={fieldId} className="px-4 py-3 font-semibold text-muted-foreground whitespace-nowrap">
                          {fieldObj?.label || fieldId}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((row, idx) => (
                    <tr key={idx} className="border-b border-border/40 hover:bg-muted/20 transition-colors">
                      {selectedFields.map(fieldId => (
                        <td key={fieldId} className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                          {row[fieldId] !== undefined && row[fieldId] !== null ? String(row[fieldId]) : "N/A"}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {paginatedData.length === 0 && (
                    <tr>
                      <td colSpan={selectedFields.length} className="px-4 py-8 text-center text-muted-foreground">
                        No report records match the selected search filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer / Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border/60 bg-muted/10 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Rows per page:</span>
                  <Select value={String(pageSize)} onValueChange={val => { setPageSize(Number(val)); setCurrentPage(1); }}>
                    <SelectTrigger className="h-8 w-16 text-xs rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-lg"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-lg"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        {extraTabs.map(tab => (
          <TabsContent key={tab.id} value={tab.id} className="mt-0">
            {tab.content}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
