'use client'
import {useState, useEffect} from 'react'
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
  X,
  Package
} from 'lucide-react'
import { apiClient } from '@/utils/api'
import { toast } from 'sonner'
import { LoadingSpinner } from './common/LoadingSpinner'

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

interface Timesheet {
  employee: string;
  job: string;
  week: string;
  sat: string;
  sun: string;
  mon: string;
  tue: string;
  wed: string;
  thu: string;
  fri: string;
  total: string;     // e.g., "21h"
  billable: string;  // e.g., "21h"
  status: "Draft" | "Approved" | "Rejected";
  invoice_type?: string;
  actions: string[];
}

interface TimesheetsPageProps {
  timesheets: Timesheet[];
  employees: any[];
  period: any;
}

interface ApproveTimesheet {
  jobId: number,
  laborId: number,
  startDate: string,
  endDate: string,
  status: string
}

export function TimesheetsPage({timesheets, period, employees}: TimesheetsPageProps) {
  console.log('employees', employees);
  const [isLoading, setIsLoading] = useState(false);
  const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [employeeFilter, setEmployeeFilter] = useState('all')
  const [approveData, setApproveData] = useState<ApproveTimesheet | null>(null);

  let totalHours = 0;
  let billableHours = 0;
  let statusCounts = {
    Draft: 0,
    Approved: 0,
    Rejected: 0,
  };

  let totalTimesheets = timesheets.length;

  timesheets.forEach((ts:Timesheet) => {
    totalHours += parseFloat(ts.total.replace("h", "")) || 0;
    billableHours += parseFloat(ts.billable.replace("h", "")) || 0;

    if (statusCounts.hasOwnProperty(ts.status)) {
      statusCounts[ts.status]++;
    }
  });


  const filteredTimesheets = timesheets.filter((timesheet:any) => {
    const search = searchTerm.toLowerCase();

    const matchesSearch =
      timesheet.employee?.toLowerCase().includes(search) ||
      timesheet.job?.toLowerCase().includes(search) ||
      timesheet.week?.toLowerCase().includes(search);

    const matchesStatus = statusFilter === 'all' || timesheet.status === statusFilter;
    const matchesEmployee = employeeFilter === 'all' || timesheet.invoice_type === employeeFilter;

    return matchesSearch && matchesStatus && matchesEmployee;
  });

  const timesheetsToRender = (
    searchTerm || statusFilter !== 'all' || employeeFilter !== 'all'
  ) ? filteredTimesheets : timesheets;

  const formattedDate = (date: string): string => {
    const [startStr, endStr] = date.split(" - ");

    const startDate = new Date(startStr);
    const endDate = new Date(endStr);

    const formatOptions: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
    };

    const formatter = new Intl.DateTimeFormat("en-US", formatOptions);

    const formattedStart = formatter.format(startDate);
    const formattedEnd = formatter.format(endDate);

    return `${formattedStart} - ${formattedEnd}`;
  };

  const handleApproveTimesheet = async (timesheet: Timesheet) => {
    const payload = {
      //  "jobId": timesheet.job,
      // "laborId": timesheet.employee,
      // "startDate": period.start_date,
      // "endDate": period.end_date,
      // "status": timesheet.status

       "jobId": 21,
      "laborId": 45,
      "startDate": period?.start_date,
      "endDate": period?.end_date,
      "status": timesheet.status
    }
    try {
      setIsLoading(true);

      const response = await apiClient.approveWeekTimesheet(payload);
      if(response.success){
        toast.success('Timesheet approved successfully');
      }
      
    } catch (error) {
      setIsLoading(false);
      toast.error(`Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Timesheet Management</h2>
          <p className="text-sm text-muted-foreground">Review and approve employee timesheets</p>
        </div>
      </div>

      {/* Summary Cards */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner />
        </div>
      ): timesheets.length === 0 ? (
          // Empty state
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">No timesheets found</p>
          </div>
        ): (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Timesheets</p>
                    <p className="text-2xl font-bold">{totalTimesheets}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg"><Clock className="h-6 w-6 text-blue-600" /></div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending Approval</p>
                    <p className="text-2xl font-bold">{(statusCounts['Draft'] + statusCounts['Approved'])}</p>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-lg"><Hourglass className="h-6 w-6 text-yellow-600" /></div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Hours</p>
                    <p className="text-2xl font-bold">{totalHours}<span className="text-lg font-medium text-muted-foreground">h</span></p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg"><Clock className="h-6 w-6 text-blue-600" /></div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Billable Hours</p>
                    <p className="text-2xl font-bold">{billableHours}<span className="text-lg font-medium text-muted-foreground">h</span></p>
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
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search timesheets..." className="pl-10" />
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-auto min-w-[150px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="Submitted">Submitted</SelectItem>
                        <SelectItem value="Approved">Approved</SelectItem>
                        <SelectItem value="Draft">Draft</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
                      <SelectTrigger className="w-auto min-w-[150px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Employees</SelectItem>
                        {employees.map(emp => (<SelectItem value={emp.name}>{emp.name}</SelectItem>))}
                      </SelectContent>
                    </Select>
                    <span className="text-sm text-muted-foreground">{timesheetsToRender.length} timesheets</span>
                  </div>
                </div>

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
                      {timesheetsToRender.map((item:any, index: number) => (
                        // add key when timesheet ID will be sent in the response
                        // <TableRow key={item.id} className="odd:bg-white even:bg-slate-50">
                        <TableRow key={item.id || `${item.employee}-${item.week}-${index}`} className="odd:bg-white even:bg-slate-50">
                          <TableCell className="font-medium">{item.employee}</TableCell>
                          <TableCell>
                            <div>{item.job}</div>
                            {/* <div className="text-xs text-muted-foreground">{item.jobCode}</div> */}
                          </TableCell>
                          <TableCell>{formattedDate(item.week)}</TableCell>
                          {days.map(day => {
                            const hours = item[day] 
                            return (
                              <TableCell key={day} className="text-center">
                                {hours}
                              </TableCell>
                            )
                          })}
                          <TableCell className="font-bold text-center">{item.total}</TableCell>
                          <TableCell className="font-bold text-center">{item.billable}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(item.status)}`}>
                              {item.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {item.status === 'Submitted' && (
                                <>
                                  <Button variant="outline" size="icon" className="border-green-500 text-green-500 hover:bg-green-50 hover:text-green-600" onClick={() => handleApproveTimesheet(item)}>
                                    <Check className="w-4 h-4" />
                                  </Button>
                                  <Button variant="outline" size="icon" className="border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600">
                                    <X className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
      )}
    </div>
  )
}
