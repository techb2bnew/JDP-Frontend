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
  X
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { apiClient } from '@/utils/api'



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

  const [timesheets, setTimesheets] = useState<{
    dashboard_timesheets: TimesheetItem[];
    period: {
      start_date: string;
      end_date: string;
      week_range: string;
    };
  } | null>(null);

  const filteredTimesheets = timesheets?.dashboard_timesheets.filter(item =>
    item.employee.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.job.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];



  const startDate = '2025-09-20'
  const endDate = '2025-09-26'


  useEffect(() => {
    console.log('asas')
    const fetchAlltimesheets = async () => {
      try {
        const response = await apiClient.getAllTimesheets(startDate, endDate);
        console.log(response, "timeres")
        setTimesheets(response.data);
        console.log(response.data, "newtimeres")
      } catch (error) {
        console.error('Error fetching suppliers:', error);
      }
    };

    fetchAlltimesheets();
  }, []);
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Timesheets</p>
              <p className="text-2xl font-bold">3</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg"><Clock className="h-6 w-6 text-blue-600" /></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending Approval</p>
              <p className="text-2xl font-bold">1</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg"><Hourglass className="h-6 w-6 text-yellow-600" /></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Hours</p>
              <p className="text-2xl font-bold">113<span className="text-lg font-medium text-muted-foreground">h</span></p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg"><Clock className="h-6 w-6 text-blue-600" /></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Billable Hours</p>
              <p className="text-2xl font-bold">107<span className="text-lg font-medium text-muted-foreground">h</span></p>
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
              <Select defaultValue="all-status">
                <SelectTrigger className="w-auto min-w-[150px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-status">All Status</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="all-employees">
                <SelectTrigger className="w-auto min-w-[150px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-employees">All Employees</SelectItem>
                  <SelectItem value="john-smith">John Smith</SelectItem>
                  <SelectItem value="david-wilson">David Wilson</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">3 timesheets</span>
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
                {filteredTimesheets?.map((item: any) => (
                  <TableRow key={item.id || `${item.employee}-${item.week}`} className="odd:bg-white even:bg-slate-50">
                    <TableCell className="font-medium">{item.employee}</TableCell>
                    <TableCell>
                      <div>{item.job}</div>
                      <div className="text-xs text-muted-foreground">{item.jobCode}</div>
                    </TableCell>
                    <TableCell>{item.week}</TableCell>
                    {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((day: string) => {
                      const hourValue = item[day];
                      return (
                        <TableCell key={day} className="text-center">
                          {hourValue !== '0h' ? hourValue : '-'}
                        </TableCell>
                      );
                    })}

                    <TableCell className="font-bold text-center">{item.total}h</TableCell>
                    <TableCell className="font-bold text-center">{item.billable}h</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(item.status)}`}>
                        {item.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {item.status === 'Submitted' && (
                          <>
                            <Button variant="outline" size="icon" className="border-green-500 text-green-500 hover:bg-green-50 hover:text-green-600">
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
    </div>
  )
}
