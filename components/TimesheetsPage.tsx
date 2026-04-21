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
  X,
  Eye,
  DollarSign,
  Briefcase
} from 'lucide-react'
import { format, parse, startOfWeek, addDays } from 'date-fns'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { useEffect, useState } from 'react'
import { apiClient } from '@/utils/api'
import { LoadingSpinner } from './common/LoadingSpinner'
import { Calendar as MultiDateCalendar, DateObject } from "react-multi-date-picker"



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
  labor_id?:any;
  lead_labor_id?:any;
  hourly_rate?: number | null;
  weekly_payment?: number | null;
}

 

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
  const [selectedRanges, setSelectedRanges] = useState<DateObject[][]>([])
  const [statusFilter, setStatusFilter] = useState('all');
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [allEmployeeOptions, setAllEmployeeOptions] = useState<string[]>([]);
  const [isLoadingTimesheets, setIsLoadingTimesheets] = useState(false);
const [totalTimesheets, setTotalTimesheets] = useState(0);
 const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
const [filteredTimesheets, setFilteredTimesheets] = useState<any[]>([]);
const [selectedTimesheet, setSelectedTimesheet] = useState<TimesheetItem | null>(null);
const [showTimesheetDetail, setShowTimesheetDetail] = useState(false);
const [timesheetViewData, setTimesheetViewData] = useState<any>(null);
const [isLoadingTimesheetView, setIsLoadingTimesheetView] = useState(false);


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


  // Use allEmployeeOptions for dropdown, fallback to current timesheets if not available
  const employeeOptions = allEmployeeOptions.length > 0 
    ? allEmployeeOptions 
    : Array.from(new Set(timesheets?.dashboard_timesheets.map(t => t.employee.toLowerCase()) || []));





  const startDate = '2025-09-20'
  const endDate = '2025-09-26'


const fetchAlltimesheets = async () => {
  try {
    setIsLoading(true);
    // Use searchTimesheets API if employee filter is selected
    const nameParam = employeeFilter && employeeFilter !== 'all' ? employeeFilter : null;
    let response;
    if (nameParam) {
      response = await apiClient.searchTimesheetsByQuery('', 1, 10, null, null, nameParam, null);
    } else {
      response = await apiClient.getAllTimesheets();
      // Store all employees when fetching without filters
      const allEmployees = Array.from(new Set(
        (response.data.dashboard_timesheets || []).map((t: any) => (t.employee || '').toLowerCase())
      )) as string[];
      setAllEmployeeOptions(allEmployees);
    }
    console.log('API Response:', response); // Debug log
    const timesheets = response.data.dashboard_timesheets || [];
    const period = response.data.period || { start_date: '', end_date: '', week_range: '' };
    
    const transformedTimesheets = timesheets.map((item: any) => ({
      employee: item.employee || 'N/A',
      job: item.job || 'N/A',
      jobCode: item.job ? item.job.split('(')[1]?.replace(')', '') || 'N/A' : 'N/A', 
      week: item.week || '',
      jobId: item.job_id?.toString() || '', 
      laborId: item.labor_id?.toString() || '', 
      lead_labor_id:item.lead_labor_id?.toString()|| '',
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
      hourly_rate: item.hourly_rate || null,
      weekly_payment: item.weekly_payment || null,
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

// Common function for timesheet status updates
const updateTimesheetStatus = async (item: TimesheetItem, status: 'Approved' | 'Draft') => {
  try {
    setIsLoading(true);

    const payload = {
      jobId: item.jobId || item.job_id || 0,
      startDate: timesheets?.period.start_date || '2025-09-20',
      endDate: timesheets?.period.end_date || '2025-09-26',
      status: status,
      laborId: item.laborId || item.labor_id || null,
      lead_labor_id: item.lead_labor_id || item.lead_labor_id || null,
    };

    if (payload.laborId) payload.lead_labor_id = null;
    else if (payload.lead_labor_id) payload.laborId = null;

    console.log(payload, "payload");

    await apiClient.approveWeekTimesheet(payload);

    // Reload listing data after successful API call
    await fetchAlltimesheets();

    // Refresh dashboard stats after status update
    try {
      const statsResponse = await apiClient.getTimesheetDashboardStats();
      console.log("Dashboard stats after update", statsResponse);
      setDashboardStats(statsResponse?.data);
    } catch (statsError) {
      console.error('Error fetching dashboard stats after update:', statsError);
    }

  } catch (error) {
    console.error(`Error updating timesheet to ${status}:`, error);
    alert(`Failed to update timesheet to ${status}.`);
  } finally {
    setIsLoading(false);
  }
};

const handleApproveTimesheet = async (item: TimesheetItem) => {
  await updateTimesheetStatus(item, 'Approved');
};

const handleDraftTimesheet = async (item: TimesheetItem) => {
  await updateTimesheetStatus(item, 'Draft');
};

const handleViewTimesheet = async (item: TimesheetItem) => {
  setSelectedTimesheet(item);
  setShowTimesheetDetail(true);
  setIsLoadingTimesheetView(true);
  setTimesheetViewData(null);

  try {
    // Prefer API period; fall back to parsing "MMM d - MMM d" week label.
    const resolveWeekRange = () => {
      const periodStart = timesheets?.period?.start_date || "";
      const periodEnd = timesheets?.period?.end_date || "";
      if (periodStart && periodEnd) {
        return { startDate: periodStart, endDate: periodEnd };
      }

      const weekLabel = String(item.week || "").trim();
      const weekMatch = weekLabel.match(
        /^([A-Za-z]{3})\s+(\d{1,2})\s*-\s*([A-Za-z]{3})\s+(\d{1,2})$/,
      );
      if (!weekMatch) return { startDate: "", endDate: "" };

      const [, startMon, startDay, endMon, endDay] = weekMatch;
      const year = new Date().getFullYear();
      const start = parse(`${startMon} ${startDay} ${year}`, "MMM d yyyy", new Date());
      const end = parse(`${endMon} ${endDay} ${year}`, "MMM d yyyy", new Date());

      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return { startDate: "", endDate: "" };
      }

      return {
        startDate: format(start, "yyyy-MM-dd"),
        endDate: format(end, "yyyy-MM-dd"),
      };
    };

    const { startDate, endDate } = resolveWeekRange();

    if (!startDate || !endDate) {
      console.error('Start date or end date is missing');
      setIsLoadingTimesheetView(false);
      return;
    }

    // Determine which ID to use
    const params: {
      labor_id?: number | string;
      lead_labor_id?: number | string;
      start_date: string;
      end_date: string;
    } = {
      start_date: startDate,
      end_date: endDate,
    };

    const laborId = item.labor_id ?? item.laborId;
    const leadLaborId = item.lead_labor_id;

    if (laborId) {
      params.labor_id = laborId;
    } else if (leadLaborId) {
      params.lead_labor_id = leadLaborId;
    } else {
      console.error('Neither labor_id nor lead_labor_id is available');
      setIsLoadingTimesheetView(false);
      return;
    }

    const response = await apiClient.getWeeklyTimesheetView(params);
    setTimesheetViewData(response.data);
  } catch (error) {
    console.error('Error fetching timesheet view:', error);
  } finally {
    setIsLoadingTimesheetView(false);
  }
};

const handleBackToList = () => {
  setShowTimesheetDetail(false);
  setSelectedTimesheet(null);
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
};

const parseHours = (hoursStr: string): number => {
  if (!hoursStr || hoursStr === '0h' || hoursStr === '0m' || hoursStr === '-') return 0;
  const match = hoursStr.match(/(\d+\.?\d*)h/);
  if (match) return parseFloat(match[1]);
  return 0;
};

const formatWeekRange = (weekStr: string) => {
  if (!weekStr) return '';
  const match = weekStr.match(/(\w+ \d{1,2}) - (\w+ \d{1,2})/);
  if (match) {
    try {
      const currentYear = new Date().getFullYear();
      const startDate = parse(`${match[1]} ${currentYear}`, 'MMM d yyyy', new Date());
      const endDate = parse(`${match[2]} ${currentYear}`, 'MMM d yyyy', new Date());
      return `Week of ${format(startDate, 'EEE, MMM d, yyyy')} - ${format(endDate, 'EEE, MMM d, yyyy')}`;
    } catch {
      return weekStr;
    }
  }
  return weekStr;
};

const getWeekDays = (weekStr: string) => {
  if (!weekStr) return [];
  const match = weekStr.match(/(\w+ \d{1,2}) - (\w+ \d{1,2})/);
  if (match) {
    try {
      const currentYear = new Date().getFullYear();
      const startDate = parse(`${match[1]} ${currentYear}`, 'MMM d yyyy', new Date());
      const weekStart = startOfWeek(startDate, { weekStartsOn: 1 });
      return Array.from({ length: 7 }, (_, i) => {
        const day = addDays(weekStart, i);
        return {
          date: day,
          dateStr: format(day, 'EEE, MMM d, yyyy'),
          dayName: format(day, 'EEEE'),
          dayShort: format(day, 'EEE')
        };
      });
    } catch {
      return [];
    }
  }
  return [];
};



const fetchBySearchTimesheets = async () => {
  if (!searchTerm.trim()) return;

  setIsLoadingTimesheets(true);

  try {
    const nameParam = employeeFilter && employeeFilter !== 'all' ? employeeFilter : null;
    const statusParam = statusFilter && statusFilter !== 'all' ? statusFilter : null;
    const response = await apiClient.searchTimesheetsByQuery(searchTerm.trim(), 1, 10, null, null, nameParam, statusParam);
    console.log('Search API Response:', response); // Debug log
    const timesheetsData = response.data;
    const timesheets = timesheetsData?.dashboard_timesheets || [];
    const period = timesheetsData?.period || { start_date: '', end_date: '', week_range: '' };
    const transformedTimesheets = timesheets.map((item: any) => ({
      employee: item.employee || 'N/A',
      job: item.job || 'N/A',
      jobCode: item.job ? item.job.split('(')[1]?.replace(')', '') || 'N/A' : 'N/A', 
      week: period.week_range || item.week || '',
      jobId: item.job_id?.toString() || '',
      laborId: item.labor_id?.toString() || '',
      lead_labor_id: item.lead_labor_id?.toString() || '',
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
      hourly_rate: item.hourly_rate || null,
      weekly_payment: item.weekly_payment || null,
    }));

    console.log('Search transformed timesheets:', transformedTimesheets); 
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
}, [searchTerm, statusFilter, employeeFilter]);

// Add new useEffect for date range changes
useEffect(() => {
  if (dateRange.from && dateRange.to) {
    fetchTimesheetsByDateRange();
  }
}, [dateRange]);

const fetchTimesheetsByFilters = async () => {
  if (searchTerm.trim()) return;

  setIsLoadingTimesheets(true);

  try {
    const nameParam = employeeFilter && employeeFilter !== 'all' ? employeeFilter : null;
    let response;
    if (statusFilter !== 'all') {
      response = await apiClient.searchTimesheetsByStatus(statusFilter, 1, 10, nameParam);
    } else {
      // If no status filter but employee filter is selected, use searchTimesheetsByQuery
      if (nameParam) {
        response = await apiClient.searchTimesheetsByQuery('', 1, 10, null, null, nameParam, null);
      } else {
        response = await apiClient.getAllTimesheets();
      }
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
      lead_labor_id: item.lead_labor_id?.toString() || '',
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
      hourly_rate: item.hourly_rate || null,
      weekly_payment: item.weekly_payment || null,
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

// New function to fetch timesheets by date range
const fetchTimesheetsByDateRange = async () => {
  if (!dateRange.from || !dateRange.to) return;

  setIsLoadingTimesheets(true);

  try {
    // Format dates as YYYY-MM-DD in local timezone (not UTC)
    const formatLocalDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    const startDate = formatLocalDate(dateRange.from);
    const endDate = formatLocalDate(dateRange.to);

    console.log('Fetching timesheets for date range:', { startDate, endDate });

    const nameParam = employeeFilter && employeeFilter !== 'all' ? employeeFilter : null;
    const statusParam = statusFilter && statusFilter !== 'all' ? statusFilter : null;
    const response = await apiClient.searchTimesheetsByQuery('', 1, 10, startDate, endDate, nameParam, statusParam);
    console.log('Date range API Response:', response);
    
    const timesheetsData = response.data;
    const timesheets = timesheetsData?.dashboard_timesheets || [];
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
    console.error('Error fetching timesheets by date range:', error);
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
  
  // Render timesheet detail view if selected
  if (showTimesheetDetail && selectedTimesheet) {
    // Use API data if available, otherwise use fallback
    const employeeName = timesheetViewData?.employee_name || selectedTimesheet.employee;
    const hourlyRate = timesheetViewData?.hourly_rate || selectedTimesheet.hourly_rate;
    const weekRange = timesheetViewData?.period?.week_range || selectedTimesheet.week;
    const formattedWeek = formatWeekRange(weekRange);
    const weekTotal = timesheetViewData?.week_total;
    const totalHours = weekTotal?.total_hours || parseHours(selectedTimesheet.total);
    const totalHoursDisplay = weekTotal?.total_hours_display || selectedTimesheet.total;
    const totalPay = weekTotal?.total_pay || (totalHours * hourlyRate);
    const dailyBreakdown = timesheetViewData?.daily_breakdown || [];

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={handleBackToList}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Timesheets</h2>
            <p className="text-sm text-muted-foreground">Track and manage employee timesheets for all jobs</p>
          </div>
        </div>
 

        {/* Employee and Week Details */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{employeeName}</h3>
                <p className="text-sm text-muted-foreground">{formattedWeek}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Hourly Rate</p>
                  <p className="text-xl font-semibold">{formatCurrency(hourlyRate)}/hr</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Hours</p>
                  <p className="text-xl font-semibold">{totalHoursDisplay || `${totalHours}h`}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Pay</p>
                  <p className="text-xl font-semibold">{formatCurrency(totalPay)}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Payment Status</p>
                  <p className={`text-xl font-semibold ${selectedTimesheet.status.toLowerCase() === 'approved' ? 'text-green-600' : 'text-gray-600'}`}>
                    {selectedTimesheet.status === 'Approved' ? 'Paid' : selectedTimesheet.status}
                  </p>
                  {selectedTimesheet.status.toLowerCase() === 'approved' && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(), 'EEE, MMM d, yyyy')}
                    </p>
                  )}
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <CalendarIcon className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Daily Job Breakdown */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Briefcase className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg font-semibold">Daily Job Breakdown</h3>
            </div>
            
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-800 text-slate-50">
                  <TableRow>
                    <TableHead className="text-white">Date</TableHead>
                    <TableHead className="text-white">Day</TableHead>
                    <TableHead className="text-white">Job ID</TableHead>
                    <TableHead className="text-white">Job Title</TableHead>
                    <TableHead className="text-white text-right">Hours Worked</TableHead>
                    <TableHead className="text-white text-right">Pay Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingTimesheetView ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8">
                        <div className="flex w-full items-center justify-center">
                          <LoadingSpinner />
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : dailyBreakdown.length > 0 ? (
                    dailyBreakdown.map((entry: {
                      date?: string;
                      formatted_date?: string;
                      day?: string;
                      job_id?: number | null;
                      job_title?: string;
                      hours_worked?: number;
                      hours_worked_display?: string;
                      pay_amount?: number;
                    }, index: number) => (
                      <TableRow key={index}>
                        <TableCell>{entry.formatted_date || entry.date}</TableCell>
                        <TableCell>{entry.day}</TableCell>
                        <TableCell>{entry.job_id ? `Job-${entry.job_id}` : '-'}</TableCell>
                        <TableCell>{entry.job_title || 'Leave'}</TableCell>
                        <TableCell className={`text-right font-medium ${(entry.hours_worked ?? 0) > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                          {entry.hours_worked_display || ((entry.hours_worked ?? 0) > 0 ? `${entry.hours_worked}h` : '0h')}
                        </TableCell>
                        <TableCell className={`text-right font-medium ${(entry.pay_amount ?? 0) > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                          {formatCurrency(entry.pay_amount || 0)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No data found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Week Total Summary */}
            {weekTotal && (
              <div className="mt-6 pt-6 border-t flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Week Total</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {weekTotal.total_hours_display || `${totalHours}h`} × {formatCurrency(weekTotal.hourly_rate || hourlyRate)}/hour
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-semibold text-blue-600">{formatCurrency(weekTotal.total_pay || totalPay)}</p>
                  <p className="text-sm text-muted-foreground">Total Pay</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }
  
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              <p className="text-2xl font-bold">{dashboardStats.totalHours}<span className="text-lg font-medium text-muted-foreground"></span></p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg"><Clock className="h-6 w-6 text-blue-600" /></div>
          </CardContent>
        </Card>
        {/* <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Billable Hours</p>
              <p className="text-2xl font-bold">{dashboardStats.billableHours}<span className="text-lg font-medium text-muted-foreground"></span></p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg"><CheckCircle className="h-6 w-6 text-green-600" /></div>
          </CardContent>
        </Card> */}
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
                  <SelectItem value="approved">Paid</SelectItem>
                  <SelectItem value="draft">Pending</SelectItem>
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
               <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="relative h-10 w-[260px] justify-start border-sky-300 bg-sky-50/90 pr-10 text-left font-normal text-sky-900 shadow-sm hover:bg-sky-100/90 hover:text-sky-950"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-sky-600" />
                      <span className="flex-1 truncate">
                        {dateRange?.from ? (
                          dateRange?.to ? (
                            <>
                              {format(dateRange.from, "LLL dd, y")} -{" "}
                              {format(dateRange.to, "LLL dd, y")}
                            </>
                          ) : (
                            format(dateRange.from, "LLL dd, y")
                          )
                        ) : (
                          <span className="text-sky-800">Pick date ranges</span>
                        )}
                      </span>
                      {dateRange?.from && (
                        <button
                          type="button"
                          aria-label="Clear date range"
                          className="absolute right-2 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md hover:bg-sky-200/80"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRanges([]);
                            setDateRange({ from: undefined, to: undefined });
                            fetchAlltimesheets();
                          }}
                        >
                          <X className="h-3.5 w-3.5 text-sky-700" />
                        </button>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="z-[300] w-auto rounded-xl border border-slate-200 bg-white p-3 text-slate-900 shadow-[0_16px_48px_-12px_rgba(15,23,42,0.35)]"
                    align="start"
                    sideOffset={8}
                    collisionPadding={16}
                  >
                    <MultiDateCalendar
                      multiple
                      range
                      value={selectedRanges}
                      onChange={(value) => {
                        const values = (
                          Array.isArray(value) ? value : value ? [value] : []
                        ) as unknown as DateObject[][];
                        setSelectedRanges(values);

                        const allDates = values
                          .flat()
                          .map((d) =>
                            d instanceof DateObject
                              ? d.toDate()
                              : new Date(d as any),
                          )
                          .filter(
                            (d) => d instanceof Date && !Number.isNaN(d.getTime()),
                          );

                        if (allDates.length === 0) {
                          setDateRange({ from: undefined, to: undefined });
                          return;
                        }

                        const sorted = [...allDates].sort(
                          (a, b) => a.getTime() - b.getTime(),
                        );
                        setDateRange({
                          from: sorted[0],
                          to: sorted[sorted.length - 1],
                        });
                      }}
                      numberOfMonths={2}
                      disableMonthPicker={false}
                      disableYearPicker={false}
                      className="w-full"
                    />
                  </PopoverContent>
                </Popover>
              </div>

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
                  <TableHead className="text-white">Week Period</TableHead>
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => <TableHead key={day} className="text-white text-center">{day}</TableHead>)}
                  <TableHead className="text-white text-center">Total Hours</TableHead>
                  <TableHead className="text-white text-center">Hourly Rate</TableHead>
                  <TableHead className="text-white text-center">Total Pay</TableHead>
                  <TableHead className="text-white">Payment Status</TableHead>
                  <TableHead className="text-white">Payment Date</TableHead>
                  <TableHead className="text-white text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTimesheets.length > 0 ? (
                  filteredTimesheets.map((item: any, index: number) => {
                    const totalHours = parseHours(item.total);
                    const hourlyRate = item.hourly_rate; // Use API value or default
                    const totalPay = item.weekly_payment || (totalHours * hourlyRate);
                    const isPaid = item.status.toLowerCase() === 'approved';
                    const paymentDate = isPaid ? format(new Date(), 'MMM d, yyyy') : '-';
                    
                    return (
                      <TableRow key={`timesheet-${index}-${item.employee}-${item.job}-${item.week}`} className="odd:bg-white even:bg-slate-50">
                        <TableCell className="font-medium">
                          {item.employee}
                          {/* {item.laborId && <span className="text-xs text-muted-foreground ml-1">(EMP-{String(item.laborId).padStart(3, '0')})</span>} */}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                            <span>{item.week}</span>
                          </div>
                        </TableCell>
                        {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((day: string) => {
                          const hourValue = item[day];
                          const hasHours = hourValue && hourValue !== '0h' && hourValue !== '0m' && hourValue !== '-';
                          return (
                            <TableCell key={day} className="text-center">
                              <span className={hasHours ? 'text-blue-600 font-medium' : ''}>
                                {hasHours ? hourValue : 'L'}
                              </span>
                            </TableCell>
                          );
                        })}
                        <TableCell className="font-bold text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{item.total && item.total !== '0h' && item.total !== '0m' ? item.total : '0h'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {formatCurrency(item.hourly_rate)}/hr
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {formatCurrency(totalPay)}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            isPaid 
                              ? 'bg-green-100 text-green-800 border border-green-300' 
                              : 'bg-orange-100 text-orange-800 border border-orange-300'
                          }`}>
                            {isPaid ? 'Paid' : 'Pending'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {paymentDate}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-blue-500 text-blue-500 hover:bg-blue-50 hover:text-blue-600"
                              onClick={() => handleViewTimesheet(item)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            
                            {!isPaid && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-green-500 text-green-500 hover:bg-green-50 hover:text-green-600"
                                onClick={() => handleApproveTimesheet(item)}
                              >
                                <Check className="w-4 h-4 mr-1" />
                                Mark as Paid
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={15} className="text-center py-6 text-muted-foreground">
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
