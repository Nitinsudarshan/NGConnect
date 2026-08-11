"use client";

import React, { useState } from "react";
import { BarChart3, Download, Filter, Check, SlidersHorizontal, FileSpreadsheet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as XLSX from "xlsx";
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
}

export default function ReportsClient({ sampleData }: ReportsClientProps) {
  const [selectedFields, setSelectedFields] = useState<string[]>([
    "name",
    "email",
    "campus",
    "company",
    "salary",
    "pf_lifetime",
  ]);
  const [activePreset, setActivePreset] = useState<string>("pay_forward");

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
      toast.success(`Loaded preset: ${preset.name}`);
    }
  };

  const handleExportXLSX = () => {
    const headers = AVAILABLE_FIELDS.filter((f) => selectedFields.includes(f.id)).map((f) => f.label);

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

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Engagement Report");
    XLSX.writeFile(workbook, `NGConnect_Engagement_Report_${new Date().toISOString().split("T")[0]}.xlsx`);
    toast.success("Exported report to XLSX!");
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" /> Engagement Reporting Hub
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Field-picker driven custom report generator with standard presets & export options.
          </p>
        </div>

        <Button onClick={handleExportXLSX} className="gap-2 rounded-xl text-xs font-semibold shadow-xs">
          <FileSpreadsheet className="w-4 h-4" /> Export XLSX
        </Button>
      </div>

      {/* Standard Presets Selector */}
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
      <Card className="border border-border/80 rounded-2xl bg-card shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-primary" /> Select Fields to Include in Output ({selectedFields.length} Selected)
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

      {/* Live Preview Table */}
      <Card className="border border-border/80 rounded-2xl bg-card shadow-xs overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/60">
          <CardTitle className="text-sm font-bold">Report Preview Data</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border/60 uppercase tracking-wider">
              <tr>
                {selectedFields.map((fieldId) => {
                  const f = AVAILABLE_FIELDS.find((item) => item.id === fieldId);
                  return <th key={fieldId} className="py-3 px-4">{f?.label || fieldId}</th>;
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {sampleData.slice(0, 15).map((item, idx) => (
                <tr key={idx} className="hover:bg-muted/20 transition-colors">
                  {selectedFields.map((fieldId) => (
                    <td key={fieldId} className="py-3 px-4">
                      {item[fieldId] !== undefined ? String(item[fieldId]) : "—"}
                    </td>
                  ))}
                </tr>
              ))}
              {sampleData.length === 0 && (
                <tr>
                  <td colSpan={selectedFields.length} className="py-8 text-center text-muted-foreground">
                    No data available for preview.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
