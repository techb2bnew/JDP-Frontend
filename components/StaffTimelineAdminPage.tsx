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
import { Calendar as MultiDateCalendar, DateObject } from "react-multi-date-picker";
import { normalizeSingleRangeSelection, sortedDatesFromPickerRange } from '@/utils/dateRangeSelection'

interface StaffTimesheetItem {
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
  job_id?: number;
  staff_id?: number;
  hourly_rate?: number | null;
  weekly_payment?: number | null;
}

export function StaffTimelineAdminPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [timesheets, setTimesheets] = useState<{
    dashboard_timesheets: StaffTimesheetItem[];
    period: {
      start_date: string;
      end_date: string;
      week_range: string;
    };
  } | null>(null);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined })
  const [selectedRanges, setSelectedRanges] = useState<DateObject[]>([])
  const [statusFilter, setStatusFilter] = useState('all');
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [allEmployeeOptions, setAllEmployeeOptions] = useState<string[]>([]);
  const [isLoadingTimesheets, setIsLoadingTimesheets] = useState(false);
  const [totalTimesheets, setTotalTimesheets] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [filteredTimesheets, setFilteredTimesheets] = useState<any[]>([]);
  const [selectedTimesheet, setSelectedTimesheet] = useState<StaffTimesheetItem | null>(null);
  const [showTimesheetDetail, setShowTimesheetDetail] = useState(false);
  const [timesheetViewData, setTimesheetViewData] = useState<any>(null);
  const [isLoadingTimesheetView, setIsLoadingTimesheetView] = useState(false);

  const [dashboardStats, setDashboardStats] = useState({
    total: 0,
    pending: 0,
    totalHours: '0h',
    billableHours: '0h'
  });

  // Use allEmployeeOptions for dropdown, fallback to current timesheets if not available
  const employeeOptions = allEmployeeOptions.length > 0 
    ? allEmployeeOptions 
    : Array.from(new Set(timesheets?.dashboard_timesheets.map(t => t.employee.toLowerCase()) || []));

  const fetchAllStaffTimesheets = async (startDate?: string, endDate?: string) => {
    try {
      setIsLoading(true);
      const response = await apiClient.getAllStaffWeeklyTimesheetSummary(startDate, endDate);
      console.log('API Response:', response);
      const timesheets = response.data.dashboard_timesheets || [];
      const period = response.data.period || { start_date: '', end_date: '', week_range: '' };
      
      // Store all employees when fetching without filters
      const allEmployees = Array.from(new Set(
        timesheets.map((t: any) => (t.employee || '').toLowerCase())
      )) as string[];
      setAllEmployeeOptions(allEmployees);
      
      const transformedTimesheets = timesheets.map((item: any) => ({
        employee: item.employee || 'N/A',
        job: item.job || 'N/A',
        jobCode: item.job ? item.job.split('(')[1]?.replace(')', '') || 'N/A' : 'N/A', 
        week: item.week || period.week_range || '',
        jobId: item.job_id?.toString() || '', 
        job_id: item.job_id || null,
        staff_id: item.staff_id || null,
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

      console.log('Transformed timesheets:', transformedTimesheets);
      setTimesheets(response.data); 
      setFilteredTimesheets(transformedTimesheets);
      setTotalTimesheets(transformedTimesheets.length);
    } catch (error) {
      console.error('Error fetching staff timesheets:', error);
      setFilteredTimesheets([]); 
    } finally {
      setIsLoading(false); 
    }
  };

  useEffect(() => {
    fetchAllStaffTimesheets();
  }, []);

  const handleViewTimesheet = async (item: StaffTimesheetItem) => {
    setSelectedTimesheet(item);
    setShowTimesheetDetail(true);
    setIsLoadingTimesheetView(true);
    setTimesheetViewData(null);

    try {
      // Get start_date and end_date from period
      const startDate = timesheets?.period?.start_date || '';
      const endDate = timesheets?.period?.end_date || '';

      if (!startDate || !endDate) {
        console.error('Start date or end date is missing');
        setIsLoadingTimesheetView(false);
        return;
      }

      if (!item.staff_id) {
        console.error('staff_id is not available');
        setIsLoadingTimesheetView(false);
        return;
      }

      const response = await apiClient.getStaffWeeklyTimesheetView({
        staff_id: item.staff_id,
        start_date: startDate,
        end_date: endDate,
      });
      setTimesheetViewData(response.data);
    } catch (error) {
      console.error('Error fetching staff timesheet view:', error);
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
    // Handle format like "2025-12-15 - 2025-12-21"
    if (weekStr.includes('-')) {
      const parts = weekStr.split(' - ');
      if (parts.length === 2) {
        try {
          const startDate = parse(parts[0], 'yyyy-MM-dd', new Date());
          const endDate = parse(parts[1], 'yyyy-MM-dd', new Date());
          return `Week of ${format(startDate, 'EEE, MMM d, yyyy')} - ${format(endDate, 'EEE, MMM d, yyyy')}`;
        } catch {
          return weekStr;
        }
      }
    }
    return weekStr;
  };

  const fetchBySearchStaffTimesheets = async () => {
    if (!searchTerm.trim()) return;

    setIsLoadingTimesheets(true);

    try {
      const response = await apiClient.searchStaffTimesheets(searchTerm.trim());
      console.log('Search API Response:', response);
      const timesheetsData = response.data;
      const timesheets = timesheetsData?.dashboard_timesheets || [];
      const period = timesheetsData?.period || { start_date: '', end_date: '', week_range: '' };
      const transformedTimesheets = timesheets.map((item: any) => ({
        employee: item.employee || 'N/A',
        job: item.job || 'N/A',
        jobCode: item.job ? item.job.split('(')[1]?.replace(')', '') || 'N/A' : 'N/A', 
        week: period.week_range || item.week || '',
        jobId: item.job_id?.toString() || '',
        job_id: item.job_id || null,
        staff_id: item.staff_id || null,
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
      console.error('Staff timesheet search error:', err);
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

      console.log('Fetching staff timesheets for date range:', { startDate, endDate });

      // Call API with date range parameters
      const response = await apiClient.getAllStaffWeeklyTimesheetSummary(startDate, endDate);
      console.log('Date range API Response:', response);
      
      const timesheetsData = response.data;
      const timesheets = timesheetsData?.dashboard_timesheets || [];
      const period = timesheetsData.period || { start_date: '', end_date: '', week_range: '' };
      
      const transformedTimesheets = timesheets.map((item: any) => ({
        employee: item.employee || 'N/A',
        job: item.job || 'N/A',
        jobCode: item.job ? item.job.split('(')[1]?.replace(')', '') || 'N/A' : 'N/A',
        week: period.week_range || item.week || '',
        jobId: item.job_id?.toString() || '',
        job_id: item.job_id || null,
        staff_id: item.staff_id || null,
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
      console.error('Error fetching staff timesheets by date range:', error);
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

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      if (!searchTerm.trim()) {
        if (dateRange.from && dateRange.to) {
          fetchTimesheetsByDateRange();
        } else {
          fetchAllStaffTimesheets();
        }
      } else {
        fetchBySearchStaffTimesheets(); 
      }
    }, 500); 

    return () => clearTimeout(debounceTimeout);
  }, [searchTerm, dateRange]);

  // Render timesheet detail view if selected
  if (showTimesheetDetail && selectedTimesheet) {
    const employeeName = timesheetViewData?.employee_name || selectedTimesheet.employee;
    const hourlyRate = timesheetViewData?.hourly_rate || selectedTimesheet.hourly_rate || 0;
    const weekRange = timesheetViewData?.period?.week_range || selectedTimesheet.week;
    const formattedWeek = formatWeekRange(weekRange);
    const weekTotal = timesheetViewData?.week_total;
    const totalHours = weekTotal?.total_hours || parseHours(selectedTimesheet.total);
    const totalHoursDisplay = weekTotal?.total_hours_display || selectedTimesheet.total;
    const totalPay = weekTotal?.total_pay || (totalHours * hourlyRate);
    const dailyBreakdown = timesheetViewData?.daily_breakdown || [];

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={handleBackToList}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Staff Timeline</h2>
            <p className="text-sm text-muted-foreground">View staff timesheet details</p>
          </div>
        </div>

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
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className={`text-xl font-semibold ${selectedTimesheet.status.toLowerCase() === 'active' ? 'text-green-600' : 'text-gray-600'}`}>
                    {selectedTimesheet.status}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <CalendarIcon className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

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
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex justify-center items-center">
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
      <div className="flex items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Staff Timeline Management</h2>
          <p className="text-sm text-muted-foreground">Review and manage staff timesheets</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Timesheets</p>
              <p className="text-2xl font-bold">{dashboardStats.total || filteredTimesheets.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg"><Clock className="h-6 w-6 text-blue-600" /></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-2xl font-bold">{filteredTimesheets.filter(t => t.status?.toLowerCase() === 'active').length}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg"><CheckCircle className="h-6 w-6 text-green-600" /></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Hours</p>
              <p className="text-2xl font-bold">{dashboardStats.totalHours || '0h'}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg"><Clock className="h-6 w-6 text-blue-600" /></div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex-1 min-w-[250px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search staff timesheets..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
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
                    <Button variant="outline" className="w-[240px] justify-start text-left font-normal relative pr-10">
                      <CalendarIcon className="mr-2 h-4 w-4" />
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
                          <span>Pick date ranges</span>
                        )}
                      </span>
                      {dateRange?.from && (
                        <button
                          type="button"
                          aria-label="Clear date range"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 inline-flex items-center justify-center rounded-sm hover:bg-muted"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRanges([]);
                            setDateRange({ from: undefined, to: undefined });
                            fetchAllStaffTimesheets();
                          }}
                        >
                          <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                        </button>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto rounded-md border bg-background p-3 shadow-lg" align="start">
                    <MultiDateCalendar
                      range
                      value={selectedRanges}
                      onChange={(value) => {
                        const values = normalizeSingleRangeSelection(value);
                        setSelectedRanges(values);

                        const allDates = sortedDatesFromPickerRange(values);

                        if (allDates.length === 0) {
                          setDateRange({ from: undefined, to: undefined });
                          return;
                        }

                        const sorted = [...allDates].sort((a, b) => a.getTime() - b.getTime());
                        setDateRange({ from: sorted[0], to: sorted[sorted.length - 1] });
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
                    <TableHead className="text-white">Status</TableHead>
                    <TableHead className="text-white text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTimesheets.length > 0 ? (
                    filteredTimesheets.map((item: any, index: number) => {
                      const totalHours = parseHours(item.total);
                      const hourlyRate = item.hourly_rate || 0;
                      const totalPay = item.weekly_payment || (totalHours * hourlyRate);
                      
                      return (
                        <TableRow key={`timesheet-${index}-${item.employee}-${item.job}-${item.week}`} className="odd:bg-white even:bg-slate-50">
                          <TableCell className="font-medium">
                            {item.employee}
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
                            {formatCurrency(item.hourly_rate || 0)}/hr
                          </TableCell>
                          <TableCell className="text-center font-medium">
                            {formatCurrency(totalPay)}
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              item.status?.toLowerCase() === 'active'
                                ? 'bg-green-100 text-green-800 border border-green-300' 
                                : 'bg-gray-100 text-gray-800 border border-gray-300'
                            }`}>
                              {item.status || 'Unknown'}
                            </span>
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

          {totalTimesheets > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalTimesheets)} of {totalTimesheets} timesheets
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

