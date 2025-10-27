'use client'

import { Card, CardContent } from './ui/card'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Button } from './ui/button'
import {
  ArrowLeft,
  Search,
  Clock,
  Hourglass,
  CheckCircle,
  XCircle,
  Check,
  Calendar as CalendarIcon,
  X
} from 'lucide-react'
import { format } from 'date-fns'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { useEffect, useState } from 'react'
import { apiClient } from '@/utils/api'
import { LoadingSpinner } from './common/LoadingSpinner'
import { Calendar } from './ui/calendar'



interface TimesheetItem {
  employee: string;
  job: string;
  jobCode?: string;
  week: string;
  mon: string;
  tue: string;
  wed: string;
  thu: string;
  fri: string;
  sat: string;
  sun: string;
  total: string;
  billable: string;
  status: string;
  actions?: string[];
  id?: string | number;
  jobId?: number;      
  laborId?: number;
  job_id?:number;
  labor_id?:number;

}


const timesheetData = [
  {
    id: 1,
    employee: 'John Smith',
    job: 'Electrical Panel Installation',
    jobCode: 'JOB-2025-001',
    week: 'Jan 20 - Jan 26',
    hours: { mon: 8, tue: 8, wed: 8, thu: 7, fri: 0, sat: 0, sun: 0 },
    total: 37,
    billable: 37,
    status: 'Submitted'
  },
  {
    id: 2,
    employee: 'David Wilson',
    job: 'Electrical Panel Installation',
    jobCode: 'JOB-2025-001',
    week: 'Jan 20 - Jan 26',
    hours: { mon: 6, tue: 7, wed: 5, thu: 8, fri: 0, sat: 0, sun: 0 },
    total: 32,
    billable: 30,
    status: 'Approved'
  },
  {
    id: 3,
    employee: 'Sarah Johnson',
    job: 'Office Lighting Maintenance',
    jobCode: 'JOB-2025-002',
    week: 'Jan 20 - Jan 26',
    hours: { mon: 8, tue: 8, wed: 8, thu: 8, fri: 8, sat: 4, sun: 0 },
    total: 44,
    billable: 40,
    status: 'Draft'
  }
]

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'Submitted':
      return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
    case 'Approved':
      return 'bg-green-100 text-green-800 border border-green-300';
    case 'Draft':
      return 'bg-gray-100 text-gray-800 border border-gray-300';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function TimesheetsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);


  const [timesheets, setTimesheets] = useState<{
    dashboard_timesheets: TimesheetItem[];
    period: {
      start_date: string;
      end_date: string;
      week_range: string;
    };
  } | null>(null);
   const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined })
  const [statusFilter, setStatusFilter] = useState('all');
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [isLoadingTimesheets, setIsLoadingTimesheets] = useState(false);
const [totalTimesheets, setTotalTimesheets] = useState(0);
 const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
const [filteredTimesheets, setFilteredTimesheets] = useState<any[]>([]);


  const [dashboardStats, setDashboardStats] = useState({
    total: 0,
    pending: 0,
    totalHours: '0h',
    billableHours: '0h'
  });

//   const filteredTimesheets = timesheets?.dashboard_timesheets.filter((item: TimesheetItem) => {
//   const searchMatch =
//     item.employee.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     item.job.toLowerCase().includes(searchTerm.toLowerCase());

//   const statusMatch =
//     statusFilter === 'all' || item.status.toLowerCase() === statusFilter;

//   const employeeMatch =
//     employeeFilter === 'all' || item.employee.toLowerCase() === employeeFilter;

//   const dateMatch = (() => {
//     if (!dateRange.from || !dateRange.to) return true;

//     const [startStr] = item.week.split(' - ');
//     const itemStartDate = new Date(startStr);
//     return itemStartDate >= dateRange.from && itemStartDate <= dateRange.to;
//   })();

//   return searchMatch && statusMatch && employeeMatch && dateMatch;
// }) || [];


  const employeeOptions = Array.from(new Set(timesheets?.dashboard_timesheets.map(t => t.employee.toLowerCase())));





  const startDate = '2025-09-20'
  const endDate = '2025-09-26'


const fetchAlltimesheets = async () => {
  try {
    setIsLoading(true);
    const response = await apiClient.getAllTimesheets();
    console.log('API Response:', response); // Debug log
    const timesheets = response.data.dashboard_timesheets || [];
    const period = response.data.period || { start_date: '', end_date: '', week_range: '' };
    
    const transformedTimesheets = timesheets.map((item: any) => ({
      employee: item.employee || 'N/A',
      job: item.job || 'N/A',
      jobCode: item.job ? item.job.split('(')[1]?.replace(')', '') || 'N/A' : 'N/A', // Extract job code from job name
      week: period.week_range,
      jobId: item.job_id?.toString() || '', // This might be undefined in API response
      laborId: item.labor_id?.toString() || '', // This might be undefined in API response
      mon: item.mon || '0h',
      tue: item.tue || '0h',
      wed: item.wed || '0h',
      thu: item.thu || '0h',
      fri: item.fri || '0h',
      sat: item.sat || '0h',
      sun: item.sun || '0h',
      total: item.total || '0h',
      billable: item.billable || '0h',
      status: item.status || 'Unknown',
      actions: item.actions || [], // Include actions from API
    }));

    console.log('Transformed timesheets:', transformedTimesheets); // Debug log
    console.log('Setting filteredTimesheets to:', transformedTimesheets.length, 'items'); // Debug log
    setTimesheets(response.data); 
    setFilteredTimesheets(transformedTimesheets); 
  } catch (error) {
    console.error('Error fetching timesheets:', error);
    setFilteredTimesheets([]); 
  } finally {
    setIsLoading(false); 
  }
};



  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const response = await apiClient.getTimesheetDashboardStats();
        console.log("Dashboard stats", response);
        setDashboardStats(response?.data);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      }
    };

    fetchDashboardStats();
  }, []);

const handleApproveTimesheet = async (item: TimesheetItem) => {
  try {
    setIsLoading(true);

    const payload = {
      jobId: item.jobId ||item.job_id|| 0,
      laborId: item.laborId || item.labor_id|| 0,
      startDate: timesheets?.period.start_date || '2025-09-20',
      endDate: timesheets?.period.end_date || '2025-09-26',
      status: 'approved',
    };
    console.log(payload,"playload ")
  

    await apiClient.approveWeekTimesheet(payload); 
    const refreshed = await apiClient.getAllTimesheets();
    setTimesheets(refreshed.data);

  } catch (error) {
    console.error('Error approving timesheet:', error);
    alert("Failed to approve timesheet.");
  } finally {
    setIsLoading(false);
  }
};

const fetchBySearchTimesheets = async () => {
  if (!searchTerm.trim()) return;

  setIsLoadingTimesheets(true);

  try {
    const response = await apiClient.searchTimesheetsByQuery(searchTerm.trim(), 1, 10);
    console.log('Search API Response:', response); // Debug log
    const timesheetsData = response.data;
    const timesheets = timesheetsData?.dashboard_timesheets || [];

    const transformedTimesheets = timesheets.map((item: any) => ({
      employee: item.employee || 'N/A',
      job: item.job || 'N/A',
      jobCode: item.job ? item.job.split('(')[1]?.replace(')', '') || 'N/A' : 'N/A', // Extract job code from job name
      week: timesheetsData?.period?.week_range || '', 
      jobId: item.job_id?.toString() || '',
      laborId: item.labor_id?.toString() || '',
      mon: item.mon || '0h',
      tue: item.tue || '0h',
      wed: item.wed || '0h',
      thu: item.thu || '0h',
      fri: item.fri || '0h',
      sat: item.sat || '0h',
      sun: item.sun || '0h',
      total: item.total || '0h',
      billable: item.billable || '0h',
      status: item.status || 'Unknown',
      actions: item.actions || [], // Include actions from API
    }));

    console.log('Search transformed timesheets:', transformedTimesheets); // Debug log
    setFilteredTimesheets(transformedTimesheets); 
    setTimesheets(timesheetsData); 
    setTotalTimesheets(transformedTimesheets.length);
  } catch (err) {
    console.error('Timesheet search error:', err);
    setFilteredTimesheets([]); 
    setTimesheets({
      dashboard_timesheets: [],
      period: {
        start_date: '',
        end_date: '',
        week_range: '',
      },
    });
  } finally {
    setIsLoadingTimesheets(false);
  }
};




useEffect(() => {
  const debounceTimeout = setTimeout(() => {
    if (!searchTerm.trim()) {
      // Only fetch all timesheets if no status filter is applied
      if (statusFilter === 'all') {
        fetchAlltimesheets();
      } else {
        // Use the status filter logic
        fetchTimesheetsByFilters();
      }
    } else {
      fetchBySearchTimesheets(); 
    }
  }, 500); 

  return () => clearTimeout(debounceTimeout);
}, [searchTerm, statusFilter]);

const fetchTimesheetsByFilters = async () => {
  if (searchTerm.trim()) return;

  setIsLoadingTimesheets(true);

  try {
    let response;
    if (statusFilter !== 'all') {
      response = await apiClient.searchTimesheetsByStatus(statusFilter);
    } else {
      response = await apiClient.searchTimesheetsByStatus('Active'); 
    }

    const timesheetsData = response.data;
    const timesheets = timesheetsData.dashboard_timesheets || [];
    const period = timesheetsData.period || { start_date: '', end_date: '', week_range: '' };

    const transformedTimesheets = timesheets.map((item: any) => ({
      employee: item.employee || 'N/A',
      job: item.job || 'N/A',
      jobCode: item.job ? item.job.split('(')[1]?.replace(')', '') || 'N/A' : 'N/A',
      week: period.week_range,
      jobId: item.job_id?.toString() || '',
      laborId: item.labor_id?.toString() || '',
      mon: item.mon || '0h',
      tue: item.tue || '0h',
      wed: item.wed || '0h',
      thu: item.thu || '0h',
      fri: item.fri || '0h',
      sat: item.sat || '0h',
      sun: item.sun || '0h',
      total: item.total || '0h',
      billable: item.billable || '0h',
      status: item.status || 'Unknown',
      actions: item.actions || [],
    }));

    setTimesheets(timesheetsData); 
    setFilteredTimesheets(transformedTimesheets);
    setTotalTimesheets(transformedTimesheets.length);
  } catch (error) {
    console.error("Timesheet filter error:", error);
    setTimesheets({
      dashboard_timesheets: [],
      period: {
        start_date: '',
        end_date: '',
        week_range: '',
      },
    });
    setFilteredTimesheets([]);
    setTotalTimesheets(0);
  } finally {
    setIsLoadingTimesheets(false);
  }
};






  console.log('TimesheetsPage render - filteredTimesheets:', filteredTimesheets.length, 'items');
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        {/* <Button variant="outline" size="icon">
          <ArrowLeft className="h-4 w-4" />
        </Button> */}
        <div>
          <h2 className="text-xl font-semibold text-foreground">Timesheet Management</h2>
          <p className="text-sm text-muted-foreground">Review and approve employee timesheets</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Timesheets</p>
              <p className="text-2xl font-bold">{dashboardStats.total}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg"><Clock className="h-6 w-6 text-blue-600" /></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending Approval</p>
              <p className="text-2xl font-bold">{dashboardStats.pending}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg"><Hourglass className="h-6 w-6 text-yellow-600" /></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Hours</p>
              <p className="text-2xl font-bold">{dashboardStats.totalHours}<span className="text-lg font-medium text-muted-foreground">h</span></p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg"><Clock className="h-6 w-6 text-blue-600" /></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Billable Hours</p>
              <p className="text-2xl font-bold">{dashboardStats.billableHours}<span className="text-lg font-medium text-muted-foreground">h</span></p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg"><CheckCircle className="h-6 w-6 text-green-600" /></div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Table */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex-1 min-w-[250px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search timesheets..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-auto min-w-[150px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                   <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Submitted">Submitted</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Draft">Draft</SelectItem>
                </SelectContent>
              </Select>

              <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
                <SelectTrigger className="w-auto min-w-[150px]">
                  <SelectValue placeholder="All Employees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  {employeeOptions.map(emp => (
                    <SelectItem key={emp} value={emp}>
                      {emp.charAt(0).toUpperCase() + emp.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
               <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} -{" "}
                          {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={dateRange as any}
                    onSelect={(range: any) => setDateRange(range)}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>

              <span className="text-sm text-muted-foreground">{filteredTimesheets.length} timesheets</span>
            </div>

          </div>
                  {isLoading ? (
          <div className="flex justify-center items-center py-10 text-muted-foreground">
            <LoadingSpinner />
            Loading timesheets...
          </div>
        ) : (

          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-800 text-slate-50">
                <TableRow>
                  <TableHead className="text-white">Employee</TableHead>
                  <TableHead className="text-white">Job</TableHead>
                  <TableHead className="text-white">Week</TableHead>
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => <TableHead key={day} className="text-white text-center">{day}</TableHead>)}
                  <TableHead className="text-white text-center">Total</TableHead>
                  <TableHead className="text-white text-center">Billable</TableHead>
                  <TableHead className="text-white">Status</TableHead>
                  <TableHead className="text-white text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTimesheets.length > 0 ? (
                  filteredTimesheets.map((item: any, index: number) => (
                    <TableRow key={`timesheet-${index}-${item.employee}-${item.job}-${item.week}`} className="odd:bg-white even:bg-slate-50">
                      <TableCell className="font-medium">{item.employee}</TableCell>
                      <TableCell>
                        <div>{item.job}</div> 
                      </TableCell>
                      <TableCell>{item.week}</TableCell>
                      {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((day: string) => {
                        const hourValue = item[day];
                        return (
                          <TableCell key={day} className="text-center">
                            {hourValue !== '0h' && hourValue !== '0m' ? hourValue : '-'}
                          </TableCell>
                        );
                      })}
                      <TableCell className="font-bold text-center">
                        {item.total && item.total !== '0h' && item.total !== '0m' ? item.total : '0h'}
                      </TableCell>
                      <TableCell className="font-bold text-center">
                        {item.billable && item.billable !== '0h' && item.billable !== '0m' ? item.billable : '0h'}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(item.status)}`}>
                          {item.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {item.status.toLowerCase() === 'approved' && (
                          <Button
                            variant="outline"
                            size="icon"
                            className="border-green-500 text-green-500 hover:bg-green-50 hover:text-green-600"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        )}

                        {item.status.toLowerCase() === 'draft' && (
                          <Button
                            variant="outline"
                            size="icon"
                            className="border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}

                        {item.status.toLowerCase() === 'active' && (
                          <>
                            <Button
                              variant="outline"
                              size="icon"
                              className="border-green-500 text-green-500 hover:bg-green-50 hover:text-green-600"
                              onClick={() => handleApproveTimesheet(item)}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>

                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={14} className="text-center py-6 text-muted-foreground">
                      No matching timesheets found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>

            </Table>
          </div>
          )}

 {/* Pagination Controls */}
{totalTimesheets > 0 && (
  <div className="flex items-center justify-between px-4 py-3 border-t">
    <div className="text-sm text-muted-foreground">
      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalTimesheets)} of {totalTimesheets} products
    </div>
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
        disabled={currentPage === 1 || isLoading}
      >
        Previous
      </Button>
      <span className="text-sm">
        Page {currentPage} of {Math.ceil(totalTimesheets / itemsPerPage)}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setCurrentPage(prev => prev + 1)}
        disabled={currentPage >= Math.ceil(totalTimesheets / itemsPerPage) || isLoading}
      >
        Next
      </Button>
    </div>
  </div>
)}

        </CardContent>
      </Card>
    </div>
  )
}
