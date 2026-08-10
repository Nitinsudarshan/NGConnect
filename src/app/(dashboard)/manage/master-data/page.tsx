"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Database,
  Search,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Info,
  Building2,
  GraduationCap,
  Eye,
  RefreshCw,
  HelpCircle,
  FileSpreadsheet,
  User,
  History,
  BookOpen,
  ArrowUpDown
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useUserContext } from '@/contexts/user-context';
import type { AlumniMaster } from '@/types/alumni';
import AlumniDetailsModule from '@/components/shared/alumni-details-module';
import { PageBanner } from '@/components/shared/page-banner';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function MasterDataPage() {
  const [alumni, setAlumni] = useState<AlumniMaster[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Search & column filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterColumn, setFilterColumn] = useState('all');
  const [sortOption, setSortOption] = useState('name_asc');
  const [selectedAlumni, setSelectedAlumni] = useState<AlumniMaster | null>(null);


  const supabase = createClient();
  const user = useUserContext();
  const role = user?.role;

  const fetchMasterData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('alumni_master')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      if (data) {
        setAlumni(data as AlumniMaster[]);
      }
    } catch (err: any) {
      console.error('Failed to load master data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role) {
      if (role !== 'Super Admin' && role !== 'Admin' && role !== 'Manager') { // TODO(roles-refactor): confirm access level
        toast.error('Unauthorized access to Master Data');
      } else {
        fetchMasterData();
      }
    }
  }, [role]);



  if (role && role !== 'Super Admin' && role !== 'Admin' && role !== 'Manager') { // TODO(roles-refactor): confirm access level
    return (
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-20 text-center items-center justify-center h-[50vh]">
        <HelpCircle className="w-12 h-12 text-red-500 animate-bounce" />
        <h2 className="text-xl font-bold mt-2">Access Denied</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          You do not have the required permissions to view alumni master data sheets.
        </p>
      </div>
    );
  }

  // Filter logic
  const filteredAlumni = alumni.filter((item) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();

    if (filterColumn === 'all') {
      return (
        item.name?.toLowerCase().includes(term) ||
        item.email?.toLowerCase().includes(term) ||
        item.campus?.toLowerCase().includes(term) ||
        item.course?.toLowerCase().includes(term) ||
        item.technology_stack?.toLowerCase().includes(term) ||
        item.status?.toLowerCase().includes(term) ||
        item.company?.toLowerCase().includes(term) ||
        item.city?.toLowerCase().includes(term) ||
        item.state?.toLowerCase().includes(term) ||
        item.gender?.toLowerCase().includes(term)
      );
    }

    const value = (item as any)[filterColumn];
    return value ? String(value).toLowerCase().includes(term) : false;
  });

  // Sort logic
  const sortedAlumni = [...filteredAlumni].sort((a, b) => {
    let valA: any = '';
    let valB: any = '';
    let order = 1;

    if (sortOption === 'name_asc') {
      valA = a.name; valB = b.name; order = 1;
    } else if (sortOption === 'name_desc') {
      valA = a.name; valB = b.name; order = -1;
    } else if (sortOption === 'entry_year_desc') {
      valA = a.entry_year; valB = b.entry_year; order = -1;
    } else if (sortOption === 'entry_year_asc') {
      valA = a.entry_year; valB = b.entry_year; order = 1;
    } else if (sortOption === 'year_of_placement_desc') {
      valA = a.year_of_placement; valB = b.year_of_placement; order = -1;
    } else if (sortOption === 'year_of_placement_asc') {
      valA = a.year_of_placement; valB = b.year_of_placement; order = 1;
    } else if (sortOption === 'starting_salary_desc') {
      valA = a.starting_salary; valB = b.starting_salary; order = -1;
    } else if (sortOption === 'starting_salary_asc') {
      valA = a.starting_salary; valB = b.starting_salary; order = 1;
    } else if (sortOption === 'campus_asc') {
      valA = a.campus; valB = b.campus; order = 1;
    } else if (sortOption === 'campus_desc') {
      valA = a.campus; valB = b.campus; order = -1;
    } else if (sortOption === 'status_asc') {
      valA = a.status; valB = b.status; order = 1;
    } else if (sortOption === 'status_desc') {
      valA = a.status; valB = b.status; order = -1;
    }

    if (valA === null || valA === undefined) valA = '';
    if (valB === null || valB === undefined) valB = '';

    if (valA < valB) return -1 * order;
    if (valA > valB) return 1 * order;
    return 0;
  });

  // Pagination logic
  const totalEntries = sortedAlumni.length;
  const totalPages = Math.ceil(totalEntries / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalEntries);
  const paginatedAlumni = sortedAlumni.slice(startIndex, endIndex);

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
    <div className="flex flex-1 flex-col gap-4 p-3 md:p-4 lg:p-6 max-w-7xl mx-auto w-full pb-10 animate-in fade-in slide-in-from-bottom-2 duration-300">

      {/* Header Banner */}
      <PageBanner
        title="Alumni Master Data"
        description={<p>Source-of-truth organizational records imported from GHAR exports.</p>}
        icon={<Database className="h-8 w-8 text-indigo-500" />}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMasterData}
            disabled={loading}
            className="gap-2 h-10 px-4 text-sm font-semibold rounded-lg transition-all shadow-sm shrink-0 bg-white/80 dark:bg-zinc-900/80 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 border-slate-200 dark:border-zinc-700"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Reload Data
          </Button>
        }
      />



      {/* Filters Card */}
      <Card className="border border-border/80 rounded-xl shadow-sm bg-card/60">
        <CardContent className="px-5 py-0 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-2 w-full items-center flex-1">

            {/* Column Selector */}
            <div className="w-full sm:w-40 space-y-1">
              <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <SlidersHorizontal className="w-2.5 h-2.5" /> Filter By
              </label>
              <Select value={filterColumn} onValueChange={handleFilterColumnChange}>
                <SelectTrigger className="h-8 rounded-md text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-md text-xs">
                  <SelectItem value="all">All Fields</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="email">Email ID</SelectItem>
                  <SelectItem value="campus">Campus</SelectItem>
                  <SelectItem value="course">Course</SelectItem>
                  <SelectItem value="technology_stack">Tech Stack</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="company">Placed Company</SelectItem>
                  <SelectItem value="gender">Gender</SelectItem>
                  <SelectItem value="city">City</SelectItem>
                  <SelectItem value="state">State</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort Selector */}
            <div className="w-full sm:w-44 space-y-1">
              <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <ArrowUpDown className="w-2.5 h-2.5" /> Sort By
              </label>
              <Select value={sortOption} onValueChange={(val) => { setSortOption(val); setCurrentPage(1); }}>
                <SelectTrigger className="h-8 rounded-md text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-md text-xs">
                  <SelectItem value="name_asc">Name (A-Z)</SelectItem>
                  <SelectItem value="name_desc">Name (Z-A)</SelectItem>
                  <SelectItem value="entry_year_desc">Admission Year (Newest)</SelectItem>
                  <SelectItem value="entry_year_asc">Admission Year (Oldest)</SelectItem>
                  <SelectItem value="year_of_placement_desc">Placement Year (Newest)</SelectItem>
                  <SelectItem value="year_of_placement_asc">Placement Year (Oldest)</SelectItem>
                  <SelectItem value="starting_salary_desc">Salary (Highest)</SelectItem>
                  <SelectItem value="starting_salary_asc">Salary (Lowest)</SelectItem>
                  <SelectItem value="campus_asc">Campus (A-Z)</SelectItem>
                  <SelectItem value="campus_desc">Campus (Z-A)</SelectItem>
                  <SelectItem value="status_asc">Status (A-Z)</SelectItem>
                  <SelectItem value="status_desc">Status (Z-A)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Search Input */}
            <div className="w-full space-y-1 flex-1">
              <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Search className="w-2.5 h-2.5 text-muted-foreground" /> Search
              </label>
              <Input
                placeholder="Type to filter..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="h-8 rounded-md border-border/80 text-xs"
              />
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Main Table */}
      <Card className="border border-border/80 rounded-2xl overflow-hidden shadow-md bg-card/45 backdrop-blur-sm p-3">
        {loading ? (
          <div className="p- text-center text-muted-foreground space-y-2">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="text-sm font-semibold">Loading master records...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse min-w-[65rem]">
                <thead className="bg-muted/50 border-b border-border/60">
                  <tr>
                    <th className="px-3 py-2.5 font-bold uppercase tracking-wider text-[9px] text-muted-foreground">Alumni Profile</th>
                    <th className="px-3 py-2.5 font-bold uppercase tracking-wider text-[9px] text-muted-foreground">Contact</th>
                    <th className="px-3 py-2.5 font-bold uppercase tracking-wider text-[9px] text-muted-foreground">Academic Details</th>
                    <th className="px-3 py-2.5 font-bold uppercase tracking-wider text-[9px] text-muted-foreground">Technology Stack</th>
                    <th className="px-3 py-2.5 font-bold uppercase tracking-wider text-[9px] text-muted-foreground">Career Entry</th>
                    <th className="px-3 py-2.5 font-bold uppercase tracking-wider text-[9px] text-muted-foreground text-center">Status</th>
                    <th className="px-3 py-2.5 font-bold uppercase tracking-wider text-[9px] text-muted-foreground text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedAlumni.map((item) => (
                    <tr key={item.email} className="border-t border-border/40 hover:bg-muted/15 transition-colors">
                      <td className="px-3 py-2 space-y-1">
                        <div className="font-semibold text-sm text-foreground">{item.name || '—'}</div>
                        <div className="font-mono text-[10px] text-muted-foreground">{item.email}</div>
                      </td>
                      <td className="px-3 py-2 space-y-1 text-muted-foreground">
                        <div className="font-medium text-xs text-foreground">{item.phone_number || '—'}</div>
                        <div className="text-[10px]">
                          {item.city && item.state ? `${item.city}, ${item.state}` : item.city || item.state || '—'}
                        </div>
                      </td>
                      <td className="px-3 py-2 space-y-1">
                        <div className="flex items-center gap-1 text-foreground font-semibold">
                          <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>{item.campus || '—'}</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium">
                          <GraduationCap className="w-3.5 h-3.5 text-muted-foreground/60" />
                          <span>{item.course || '—'} (Class of {item.entry_year || '—'})</span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        {item.technology_stack ? (
                          <Badge variant="outline" className="font-semibold px-2 py-0.5 rounded-md border-border/70 text-[10px]">
                            {item.technology_stack}
                          </Badge>
                        ) : '—'}
                      </td>
                      <td className="px-3 py-2 space-y-0.5 text-xs text-muted-foreground">
                        {item.company ? (
                          <>
                            <p className="font-semibold text-foreground">{item.company}</p>
                            <p className="text-[10px]">{item.starting_position || '—'}</p>
                          </>
                        ) : '—'}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant="outline"
                          className={`text-[9px] font-bold px-2.5 py-0.5 rounded-md border shadow-sm ${item.status === 'Placed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900' :
                            item.status === 'Active' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900' :
                              item.status === 'DropOut' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900' :
                                'bg-muted text-muted-foreground border-border/80'
                            }`}
                        >
                          {item.status ? item.status.toUpperCase() : '—'}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <div className="flex justify-center gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedAlumni(item)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-muted-foreground hover:text-foreground hover:bg-muted/80 px-2 py-1 h-7 rounded-md border border-border/80 shadow-sm transition-all hover:scale-[1.03] active:scale-[0.97]"
                          >
                            <Info className="w-3 h-3 text-primary" />
                            Details
                          </Button>
                          <Link
                            href={`/data-management/record-history?email=${item.email}`}
                            className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:text-white font-bold bg-indigo-500/10 hover:bg-indigo-600 px-2 py-1 h-7 rounded-md border border-indigo-500/20 dark:border-indigo-500/30 transition-all hover:scale-[1.03] active:scale-[0.97] shadow-sm hover:shadow-md"
                          >
                            <History className="w-3 h-3" />
                            History
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredAlumni.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground font-semibold">
                        No matching master records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <CardFooter className="border-t border-border/60 bg-muted/10 p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex flex-col sm:flex-row items-center gap-3">
                {/* Page Size Selector */}
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Show</label>
                  <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
                    <SelectTrigger className="h-7 w-16 text-xs rounded-md">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-md text-xs">
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-[11px] text-muted-foreground font-medium sm:border-l sm:border-border/60 sm:pl-3">
                  Showing <span className="text-foreground font-bold">{totalEntries > 0 ? startIndex + 1 : 0}</span> to <span className="text-foreground font-bold">{endIndex}</span> of <span className="text-foreground font-bold">{totalEntries}</span>
                </div>
              </div>
              <div className="flex gap-1.5 mt-2 sm:mt-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="h-7 rounded-md gap-1 text-[11px] font-semibold px-2"
                >
                  <ChevronLeft className="w-3 h-3" />
                  Prev
                </Button>

                <div className="flex gap-1 hidden sm:flex">
                  {Array.from({ length: totalPages }).map((_, idx) => (
                    <Button
                      key={idx}
                      variant={currentPage === idx + 1 ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handlePageChange(idx + 1)}
                      className={`h-7 w-7 rounded-md font-bold text-[11px] p-0`}
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
                  Next
                  <ChevronRight className="w-3 h-3" />
                </Button>
              </div>
            </CardFooter>
          </>
        )}
      </Card>

      <div className="flex justify-end text-xs text-muted-foreground gap-1.5 items-center font-medium">
        <FileSpreadsheet className="w-4 h-4 text-primary" />
        Master data represents imported organizational datasets.
      </div>

      {/* Shared Details Modal */}
      <AlumniDetailsModule
        selectedAlumni={selectedAlumni}
        onClose={() => setSelectedAlumni(null)}
      />
    </div>
  );
}
