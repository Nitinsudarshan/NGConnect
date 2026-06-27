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
  History
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useUserContext } from '@/contexts/user-context';
import type { AlumniMaster } from '@/types/alumni';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const DUMMY_ALUMNI: Partial<AlumniMaster>[] = [
  {
    email: 'aarav.sharma@nirma.edu',
    name: 'Aarav Sharma',
    phone_number: '9876543210',
    gender: 'Male',
    city: 'Ahmedabad',
    state: 'Gujarat',
    campus: 'Nirma University',
    course: 'School of Programming',
    entry_year: 2022,
    technology_stack: 'MERN Stack',
    donor: 'Yes',
    company: 'Google',
    starting_position: 'Software Engineer',
    starting_salary: 1800000,
    status: 'Placed',
    created_at: new Date().toISOString()
  },
  {
    email: 'ananya.iyer@pes.edu',
    name: 'Ananya Iyer',
    phone_number: '9123456789',
    gender: 'Female',
    city: 'Bangalore',
    state: 'Karnataka',
    campus: 'PES University',
    course: 'School of Business',
    entry_year: 2023,
    technology_stack: 'Product Management',
    donor: 'No',
    company: 'McKinsey',
    starting_position: 'Business Analyst',
    starting_salary: 1400000,
    status: 'Active',
    created_at: new Date().toISOString()
  },
  {
    email: 'rahul.verma@nirma.edu',
    name: 'Rahul Verma',
    phone_number: '9998887776',
    gender: 'Male',
    city: 'Delhi',
    state: 'Delhi',
    campus: 'Nirma University',
    course: 'School of Programming',
    entry_year: 2021,
    technology_stack: 'Python Backend',
    donor: 'No',
    status: 'Completed',
    created_at: new Date().toISOString()
  },
  {
    email: 'priya.patel@nirma.edu',
    name: 'Priya Patel',
    phone_number: '8887776665',
    gender: 'Female',
    city: 'Pune',
    state: 'Maharashtra',
    campus: 'Nirma University',
    course: 'School of Finance',
    entry_year: 2022,
    technology_stack: 'Investment Banking',
    donor: 'No',
    status: 'InActive',
    created_at: new Date().toISOString()
  },
  {
    email: 'karan.singh@gmail.com',
    name: 'Karan Singh',
    phone_number: '7776665554',
    gender: 'Male',
    city: 'Chandigarh',
    state: 'Punjab',
    campus: 'PES University',
    course: 'School of Programming',
    entry_year: 2023,
    technology_stack: 'Data Engineering',
    donor: 'No',
    company: 'Infosys',
    starting_position: 'Associate Engineer',
    starting_salary: 450000,
    status: 'Intern (In Campus)',
    created_at: new Date().toISOString()
  },
  {
    email: 'sneha.reddy@pes.edu',
    name: 'Sneha Reddy',
    phone_number: '8885554443',
    gender: 'Female',
    city: 'Hyderabad',
    state: 'Telangana',
    campus: 'PES University',
    course: 'School of Business',
    entry_year: 2022,
    technology_stack: 'Digital Marketing',
    donor: 'Yes',
    company: 'Accenture',
    starting_position: 'Marketing Analyst',
    starting_salary: 800000,
    status: 'Placed',
    created_at: new Date().toISOString()
  },
  {
    email: 'vikram.malhotra@nirma.edu',
    name: 'Vikram Malhotra',
    phone_number: '9991112223',
    gender: 'Male',
    city: 'Mumbai',
    state: 'Maharashtra',
    campus: 'Nirma University',
    course: 'School of Programming',
    entry_year: 2022,
    technology_stack: 'Java Spring Boot',
    donor: 'No',
    company: 'Microsoft',
    starting_position: 'Support Engineer',
    starting_salary: 1600000,
    status: 'Placed',
    created_at: new Date().toISOString()
  },
  {
    email: 'diya.sen@gmail.com',
    name: 'Diya Sen',
    phone_number: '9125556667',
    gender: 'Female',
    city: 'Kolkata',
    state: 'West Bengal',
    campus: 'PES University',
    course: 'School of Business',
    entry_year: 2023,
    technology_stack: 'HR Operations',
    donor: 'No',
    company: 'Goldman Sachs',
    starting_position: 'Analyst',
    starting_salary: 1100000,
    status: 'Placed',
    created_at: new Date().toISOString()
  },
  {
    email: 'rohan.gupta@nirma.edu',
    name: 'Rohan Gupta',
    phone_number: '8765432109',
    gender: 'Male',
    city: 'Surat',
    state: 'Gujarat',
    campus: 'Nirma University',
    course: 'School of Programming',
    entry_year: 2023,
    technology_stack: 'DevOps / AWS',
    donor: 'No',
    status: 'Active',
    created_at: new Date().toISOString()
  },
  {
    email: 'pooja.shah@gmail.com',
    name: 'Pooja Shah',
    phone_number: '9888877777',
    gender: 'Female',
    city: 'Baroda',
    state: 'Gujarat',
    campus: 'Nirma University',
    course: 'School of Business',
    entry_year: 2022,
    technology_stack: 'Financial Planning',
    donor: 'No',
    status: 'Active',
    created_at: new Date().toISOString()
  },
  {
    email: 'kabir.mehta@pes.edu',
    name: 'Kabir Mehta',
    phone_number: '9777766666',
    gender: 'Male',
    city: 'Bangalore',
    state: 'Karnataka',
    campus: 'PES University',
    course: 'School of Programming',
    entry_year: 2022,
    technology_stack: 'Full Stack JavaScript',
    donor: 'Yes',
    company: 'Amazon',
    starting_position: 'SDE Intern',
    starting_salary: 80000,
    status: 'Intern (Out Campus)',
    created_at: new Date().toISOString()
  },
  {
    email: 'neha.kapoor@gmail.com',
    name: 'Neha Kapoor',
    phone_number: '9666655555',
    gender: 'Female',
    city: 'Noida',
    state: 'Uttar Pradesh',
    campus: 'Nirma University',
    course: 'School of Programming',
    entry_year: 2021,
    technology_stack: 'Data Science',
    donor: 'No',
    company: 'TCS',
    starting_position: 'System Engineer',
    starting_salary: 360000,
    status: 'Placed',
    created_at: new Date().toISOString()
  },
  {
    email: 'arjun.nair@nirma.edu',
    name: 'Arjun Nair',
    phone_number: '9555544444',
    gender: 'Male',
    city: 'Cochin',
    state: 'Kerala',
    campus: 'Nirma University',
    course: 'School of Programming',
    entry_year: 2023,
    technology_stack: 'React Native',
    donor: 'No',
    status: 'Active',
    created_at: new Date().toISOString()
  },
  {
    email: 'tanvi.rao@pes.edu',
    name: 'Tanvi Rao',
    phone_number: '9444433333',
    gender: 'Female',
    city: 'Mangalore',
    state: 'Karnataka',
    campus: 'PES University',
    course: 'School of Finance',
    entry_year: 2022,
    technology_stack: 'Corporate Finance',
    donor: 'Yes',
    company: 'Goldman Sachs',
    starting_position: 'Financial Analyst',
    starting_salary: 1200000,
    status: 'Placed',
    created_at: new Date().toISOString()
  },
  {
    email: 'devendra.patil@gmail.com',
    name: 'Devendra Patil',
    phone_number: '9333322222',
    gender: 'Male',
    city: 'Nasik',
    state: 'Maharashtra',
    campus: 'Nirma University',
    course: 'School of Programming',
    entry_year: 2022,
    technology_stack: 'Manual Testing',
    donor: 'No',
    status: 'DropOut',
    created_at: new Date().toISOString()
  }
];

export default function MasterDataPage() {
  const [alumni, setAlumni] = useState<AlumniMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUsingDummy, setIsUsingDummy] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Search & column filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterColumn, setFilterColumn] = useState('all');
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

      if (data && data.length > 0) {
        setAlumni(data as AlumniMaster[]);
        setIsUsingDummy(false);
      } else {
        setAlumni(DUMMY_ALUMNI as AlumniMaster[]);
        setIsUsingDummy(true);
      }
    } catch (err: any) {
      console.error('Failed to load master data:', err.message);
      setAlumni(DUMMY_ALUMNI as AlumniMaster[]);
      setIsUsingDummy(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role) {
      if (role !== 'Super Admin' && role !== 'Admin' && role !== 'Manager' && role !== 'Operator') {
        toast.error('Unauthorized access to Master Data');
      } else {
        fetchMasterData();
      }
    }
  }, [role]);



  if (role && role !== 'Super Admin' && role !== 'Admin' && role !== 'Manager' && role !== 'Operator') {
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
        item.company?.toLowerCase().includes(term)
      );
    }

    const value = (item as any)[filterColumn];
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
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-20 animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-primary/10 to-indigo-500/10 text-primary rounded-md border border-primary/20 shadow-sm">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Alumni Master Data</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Source-of-truth organizational records imported from GHAR exports.
            </p>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchMasterData} 
          disabled={loading}
          className="gap-2 rounded-md transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Reload Data
        </Button>
      </div>

      {isUsingDummy && !loading && (
        <Card className="border-amber-500/25 bg-amber-500/5 shadow-inner">
          <CardContent className="pt-5 pb-5 text-xs flex gap-3 text-amber-700 dark:text-amber-400">
            <Info className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="font-semibold text-sm">Viewing Demo Master Data</p>
              <p className="mt-1 leading-relaxed">
                The database `alumni_master` table is currently empty. Showing interactive mock alumni records so you can test columns filters, searches, page sizing, and pagination rules.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

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
                placeholder="Type to filter master records..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="h-9 rounded-md border-border/80"
              />
            </div>

          </div>

          {/* Page Size Selector */}
          <div className="w-full sm:w-28 space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Show Entries</label>
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
        {loading ? (
          <div className="p-12 text-center text-muted-foreground space-y-2">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="text-sm font-semibold">Loading master records...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse min-w-[65rem]">
                <thead className="bg-muted/50 border-b border-border/60">
                  <tr>
                    <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Alumni Profile</th>
                    <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Contact</th>
                    <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Academic Details</th>
                    <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Technology Stack</th>
                    <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Career Entry</th>
                    <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-[10px] text-muted-foreground text-center">Status</th>
                    <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-[10px] text-muted-foreground text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedAlumni.map((item) => (
                    <tr key={item.email} className="border-t border-border/40 hover:bg-muted/15 transition-colors">
                      <td className="px-5 py-4 space-y-1">
                        <div className="font-semibold text-sm text-foreground">{item.name || '—'}</div>
                        <div className="font-mono text-[10px] text-muted-foreground">{item.email}</div>
                      </td>
                      <td className="px-5 py-4 space-y-1 text-muted-foreground">
                        <div className="font-medium text-xs text-foreground">{item.phone_number || '—'}</div>
                        <div className="text-[10px]">
                          {item.city && item.state ? `${item.city}, ${item.state}` : item.city || item.state || '—'}
                        </div>
                      </td>
                      <td className="px-5 py-4 space-y-1">
                        <div className="flex items-center gap-1 text-foreground font-semibold">
                          <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>{item.campus || '—'}</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium">
                          <GraduationCap className="w-3.5 h-3.5 text-muted-foreground/60" />
                          <span>{item.course || '—'} (Class of {item.entry_year || '—'})</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {item.technology_stack ? (
                          <Badge variant="outline" className="font-semibold px-2 py-0.5 rounded-md border-border/70 text-[10px]">
                            {item.technology_stack}
                          </Badge>
                        ) : '—'}
                      </td>
                      <td className="px-5 py-4 space-y-0.5 text-xs text-muted-foreground">
                        {item.company ? (
                          <>
                            <p className="font-semibold text-foreground">{item.company}</p>
                            <p className="text-[10px]">{item.starting_position || '—'}</p>
                          </>
                        ) : '—'}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <Badge 
                          variant="outline" 
                          className={`text-[9px] font-bold px-2.5 py-0.5 rounded-md border shadow-sm ${
                            item.status === 'Placed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900' :
                            item.status === 'Active' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900' :
                            item.status === 'DropOut' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900' :
                                                        'bg-muted text-muted-foreground border-border/80'
                          }`}
                        >
                          {item.status ? item.status.toUpperCase() : '—'}
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
                            href={`/settings/data-management/record-history?email=${item.email}`}
                            className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-white font-bold bg-indigo-500/10 hover:bg-indigo-600 px-3 py-1.5 h-8 rounded-md border border-indigo-500/20 dark:border-indigo-500/30 transition-all hover:scale-[1.03] active:scale-[0.97] shadow-sm hover:shadow-md"
                          >
                            <History className="w-3.5 h-3.5" />
                            History
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredAlumni.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-5 py-8 text-center text-muted-foreground font-semibold">
                        No matching master records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <CardFooter className="border-t border-border/60 bg-muted/10 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-muted-foreground font-semibold">
                Showing <span className="text-foreground">{totalEntries > 0 ? startIndex + 1 : 0}</span> to <span className="text-foreground">{endIndex}</span> of <span className="text-foreground">{totalEntries}</span> records
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
                      variant={currentPage === idx + 1 ? 'default' : 'outline'}
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
          </>
        )}
      </Card>
      
      <div className="flex justify-end text-xs text-muted-foreground gap-1.5 items-center font-medium">
        <FileSpreadsheet className="w-4 h-4 text-primary" />
        Master data represents imported organizational datasets.
      </div>

      {/* Centered 80% Modal */}
      {selectedAlumni && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-10 animate-in fade-in duration-200" onClick={() => setSelectedAlumni(null)}>
          <div 
            className="bg-card border border-border/80 rounded-2xl shadow-2xl max-w-[80vw] w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border/60 p-5 bg-muted/40">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 text-primary rounded-lg border border-primary/20">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">{selectedAlumni.name || 'Alumni Details'}</h3>
                  <p className="text-xs text-muted-foreground font-mono">{selectedAlumni.email}</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSelectedAlumni(null)}
                className="h-8 w-8 p-0 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                ✕
              </Button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Personal Information */}
                <div className="space-y-4 bg-muted/20 border border-border/40 rounded-md p-5">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2 border-b border-border/40 pb-2">
                    <User className="w-3.5 h-3.5" /> Personal Information
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-xs text-muted-foreground block">Full Name</span>
                      <span className="font-semibold text-foreground">{selectedAlumni.name || '—'}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">Email ID</span>
                      <span className="font-mono text-foreground">{selectedAlumni.email || '—'}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">Phone Number</span>
                      <span className="font-semibold text-foreground">{selectedAlumni.phone_number || '—'}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">Gender</span>
                      <span className="font-semibold text-foreground">{selectedAlumni.gender || '—'}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">Location</span>
                      <span className="font-semibold text-foreground">
                        {selectedAlumni.city || selectedAlumni.state
                          ? [selectedAlumni.city, selectedAlumni.state].filter(Boolean).join(', ')
                          : '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Academic Information */}
                <div className="space-y-4 bg-muted/20 border border-border/40 rounded-md p-5">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2 border-b border-border/40 pb-2">
                    <GraduationCap className="w-4 h-4" /> Academic Info
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-xs text-muted-foreground block">Campus Location</span>
                      <span className="font-semibold text-foreground flex items-center gap-1.5 mt-0.5">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        {selectedAlumni.campus || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">Course / School</span>
                      <span className="font-semibold text-foreground">{selectedAlumni.course || '—'}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">Admission / Entry Year</span>
                      <span className="font-semibold text-foreground">{selectedAlumni.entry_year || '—'}</span>
                    </div>
                  </div>
                </div>

                {/* Professional Status */}
                <div className="space-y-4 bg-muted/20 border border-border/40 rounded-md p-5 md:col-span-2 lg:col-span-1">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2 border-b border-border/40 pb-2">
                    <Database className="w-3.5 h-3.5" /> Career & Status
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-xs text-muted-foreground block">Current Status</span>
                      <div className="mt-1">
                        <Badge 
                          variant="outline" 
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md border shadow-sm ${
                            selectedAlumni.status === 'Placed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900' :
                            selectedAlumni.status === 'Active' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900' :
                            selectedAlumni.status === 'DropOut' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900' :
                                                                'bg-muted text-muted-foreground border-border/80'
                          }`}
                        >
                          {selectedAlumni.status ? selectedAlumni.status.toUpperCase() : '—'}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">Placed Company</span>
                      <span className="font-semibold text-foreground">{selectedAlumni.company || '—'}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">Starting Position</span>
                      <span className="font-semibold text-foreground">{selectedAlumni.starting_position || '—'}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">Starting CTC (Annual)</span>
                      <span className="font-semibold text-foreground">
                        {selectedAlumni.starting_salary 
                          ? `₹${selectedAlumni.starting_salary.toLocaleString('en-IN')}` 
                          : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">Technology Stack</span>
                      <div className="mt-1">
                        {selectedAlumni.technology_stack ? (
                          <Badge variant="outline" className="font-semibold px-2 py-0.5 rounded border-border/70 text-xs">
                            {selectedAlumni.technology_stack}
                          </Badge>
                        ) : '—'}
                      </div>
                    </div>
                  </div>
                </div>

              </div>


              {/* Administrative Details */}
              <div className="bg-muted/10 border border-border/40 rounded-md p-5 flex flex-col sm:flex-row justify-between gap-4 text-xs font-semibold text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span>Donor Program Status:</span>
                  <Badge 
                    variant="outline"
                    className={`font-bold px-2 py-0.5 rounded-md border ${
                      selectedAlumni.donor && !['No', 'no', 'false', 'none'].includes(selectedAlumni.donor)
                        ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900' 
                        : 'bg-muted text-muted-foreground border-border'
                    }`}
                  >
                    {selectedAlumni.donor && !['No', 'no', 'false', 'none'].includes(selectedAlumni.donor)
                      ? selectedAlumni.donor.toUpperCase()
                      : 'NON-DONOR'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span>Record Imported At:</span>
                  <span className="font-mono text-foreground">
                    {selectedAlumni.created_at ? new Date(selectedAlumni.created_at).toLocaleString('en-IN') : '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-border/60 p-4 bg-muted/40 flex justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setSelectedAlumni(null)} className="rounded-md">
                Close View
              </Button>
              <Link 
                href={`/settings/data-management/record-history?email=${selectedAlumni.email}`}
                className="inline-flex items-center gap-1 text-xs text-white hover:text-white font-bold bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-md transition-all"
                onClick={() => setSelectedAlumni(null)}
              >
                <Eye className="w-3.5 h-3.5" />
                View Detailed Audit History
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
