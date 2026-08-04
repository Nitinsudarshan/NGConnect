"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Info,
  Building2,
  GraduationCap,
  History,
  User,
  Database,
} from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import AlumniDetailsModule from "@/components/shared/alumni-details-module";

export default function CallListTable({ alumniData }: { alumniData: any[] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterColumn, setFilterColumn] = useState("all");
  const [selectedAlumni, setSelectedAlumni] = useState<any | null>(null);

  // Filter logic
  const filteredAlumni = alumniData.filter((item) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();

    if (filterColumn === "all") {
      return (
        item.name?.toLowerCase().includes(term) ||
        item.email?.toLowerCase().includes(term) ||
        item.campus?.toLowerCase().includes(term) ||
        item.course?.toLowerCase().includes(term) ||
        item.technology_stack?.toLowerCase().includes(term) ||
        item.status?.toLowerCase().includes(term) ||
        item.company?.toLowerCase().includes(term)
      );
    }

    const value = item[filterColumn];
    return value ? String(value).toLowerCase().includes(term) : false;
  });

  // Pagination logic
  const totalEntries = filteredAlumni.length;
  const totalPages = Math.ceil(totalEntries / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalEntries);
  const paginatedAlumni = filteredAlumni.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handlePageSizeChange = (val: string) => {
    setPageSize(parseInt(val, 10));
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterColumnChange = (val: string) => {
    setFilterColumn(val);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Filters Card */}
      <Card className="border border-border/80 rounded-2xl shadow-sm bg-card/60">
        <CardContent className="pt-5 pb-5 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto items-center flex-1">
            {/* Column Selector */}
            <div className="w-full sm:w-44 space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <SlidersHorizontal className="w-3 h-3" /> Filter By Column
              </label>
              <Select value={filterColumn} onValueChange={handleFilterColumnChange}>
                <SelectTrigger className="h-9 rounded-md">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-md">
                  <SelectItem value="all">All Fields</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="email">Email ID</SelectItem>
                  <SelectItem value="campus">Campus</SelectItem>
                  <SelectItem value="course">Course</SelectItem>
                  <SelectItem value="technology_stack">Tech Stack</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="company">Placed Company</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Search Input */}
            <div className="w-full space-y-1 flex-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Search className="w-3.5 h-3.5 text-muted-foreground" /> Search Term
              </label>
              <Input
                placeholder="Type to filter records..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="h-9 rounded-md border-border/80"
              />
            </div>
          </div>

          {/* Page Size Selector */}
          <div className="w-full sm:w-28 space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
              Show Entries
            </label>
            <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="h-9 rounded-md">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-md">
                <SelectItem value="10">10 entries</SelectItem>
                <SelectItem value="25">25 entries</SelectItem>
                <SelectItem value="50">50 entries</SelectItem>
                <SelectItem value="100">100 entries</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Main Table */}
      <Card className="border border-border/80 rounded-2xl overflow-hidden shadow-md bg-card/45 backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse min-w-[65rem]">
            <thead className="bg-muted/50 border-b border-border/60">
              <tr>
                <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">
                  Alumni Profile
                </th>
                <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">
                  Contact
                </th>
                <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">
                  Academic Details
                </th>
                <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">
                  Technology Stack
                </th>
                <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">
                  Career Entry
                </th>
                <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-[10px] text-muted-foreground text-center">
                  Status
                </th>
                <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-[10px] text-muted-foreground text-center">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedAlumni.map((item) => (
                <tr
                  key={item.email || item.id}
                  className="border-t border-border/40 hover:bg-muted/15 transition-colors"
                >
                  <td className="px-5 py-4 space-y-1">
                    <div className="font-semibold text-sm text-foreground">
                      {item.name || "—"}
                    </div>
                    <div className="font-mono text-[10px] text-muted-foreground">
                      {item.email}
                    </div>
                  </td>
                  <td className="px-5 py-4 space-y-1 text-muted-foreground">
                    <div className="font-medium text-xs text-foreground">
                      {item.phone_number || "—"}
                    </div>
                    <div className="text-[10px]">
                      {item.city && item.state
                        ? `${item.city}, ${item.state}`
                        : item.city || item.state || "—"}
                    </div>
                  </td>
                  <td className="px-5 py-4 space-y-1">
                    <div className="flex items-center gap-1 text-foreground font-semibold">
                      <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>{item.campus || "—"}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium">
                      <GraduationCap className="w-3.5 h-3.5 text-muted-foreground/60" />
                      <span>
                        {item.course || "—"} (Class of {item.entry_year || "—"})
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {item.technology_stack ? (
                      <Badge
                        variant="outline"
                        className="font-semibold px-2 py-0.5 rounded-md border-border/70 text-[10px]"
                      >
                        {item.technology_stack}
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-5 py-4 space-y-0.5 text-xs text-muted-foreground">
                    {item.company ? (
                      <>
                        <p className="font-semibold text-foreground">
                          {item.company}
                        </p>
                        <p className="text-[10px]">
                          {item.starting_position || "—"}
                        </p>
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <Badge
                      variant="outline"
                      className={`text-[9px] font-bold px-2.5 py-0.5 rounded-md border shadow-sm ${
                        item.status === "Placed"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900"
                          : item.status === "Active"
                          ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900"
                          : item.status === "DropOut"
                          ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900"
                          : "bg-muted text-muted-foreground border-border/80"
                      }`}
                    >
                      {item.status ? item.status.toUpperCase() : "—"}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <div className="flex justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedAlumni(item)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted/80 px-3 py-1.5 h-8 rounded-md border border-border/80 shadow-sm transition-all hover:scale-[1.03] active:scale-[0.97]"
                      >
                        <Info className="w-3.5 h-3.5 text-primary" />
                        Details
                      </Button>
                      <Link
                        href={`/data-management/record-history?email=${item.email}`}
                        className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-white font-bold bg-indigo-500/10 hover:bg-indigo-600 px-3 py-1.5 h-8 rounded-md border border-indigo-500/20 dark:border-indigo-500/30 transition-all hover:scale-[1.03] active:scale-[0.97] shadow-sm hover:shadow-md"
                      >
                        <History className="w-3.5 h-3.5" />
                        History
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedAlumni.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-8 text-center text-muted-foreground font-semibold"
                  >
                    No matching records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <CardFooter className="border-t border-border/60 bg-muted/10 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-muted-foreground font-semibold">
            Showing{" "}
            <span className="text-foreground">
              {totalEntries > 0 ? startIndex + 1 : 0}
            </span>{" "}
            to <span className="text-foreground">{endIndex}</span> of{" "}
            <span className="text-foreground">{totalEntries}</span> records
          </div>
          <div className="flex gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-8 rounded-md gap-1 text-xs font-semibold px-3"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>

            <div className="flex gap-1">
              {Array.from({ length: totalPages }).map((_, idx) => (
                <Button
                  key={idx}
                  variant={currentPage === idx + 1 ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(idx + 1)}
                  className={`h-8 w-8 rounded-md font-bold text-xs p-0`}
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
              className="h-8 rounded-md gap-1 text-xs font-semibold px-3"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Details Modal Component */}
      <AlumniDetailsModule 
        selectedAlumni={selectedAlumni} 
        onClose={() => setSelectedAlumni(null)} 
      />
    </div>
  );
}
