import { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Badge } from './ui/badge'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { ArrowLeft, Clock, Search, CheckSquare, X } from 'lucide-react'

interface Job {
  id: string
  title: string
  type: 'service-based' | 'contract-based'
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled'
  assignedLabor: string[]
  contractor?: string
  customer: string
  description: string
  createdDate: string
  dueDate: string
  estimatedHours?: number
  actualHours?: number
  estimatedCost?: number
  actualCost?: number
  materials?: string[]
  location: string
  priority: 'low' | 'medium' | 'high'
  billingStatus?: 'pending' | 'invoiced' | 'paid'
}

interface TimesheetEntry {
  id: string
  employeeName: string
  jobId: string
  jobTitle: string
  week: string
  monday: number
  tuesday: number
  wednesday: number
  thursday: number
  friday: number
  saturday: number
  sunday: number
  totalHours: number
  billableHours: number
  status: 'draft' | 'submitted' | 'approved' | 'rejected'
}

interface TimesheetManagementProps {
  onBack: () => void
  jobs: Job[]
}

export function TimesheetManagement({ onBack, jobs }: TimesheetManagementProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterEmployee, setFilterEmployee] = useState<string>('all')

  // Sample timesheet data
  const [timesheets] = useState<TimesheetEntry[]>([
    {
      id: '1',
      employeeName: 'John Smith',
      jobId: 'JOB-2025-001',
      jobTitle: 'Electrical Panel Installation',
      week: '2025-01-20',
      monday: 8,
      tuesday: 8,
      wednesday: 6,
      thursday: 8,
      friday: 7,
      saturday: 0,
      sunday: 0,
      totalHours: 37,
      billableHours: 37,
      status: 'submitted'
    },
    {
      id: '2',
      employeeName: 'David Wilson',
      jobId: 'JOB-2025-001',
      jobTitle: 'Electrical Panel Installation',
      week: '2025-01-20',
      monday: 6,
      tuesday: 7,
      wednesday: 5,
      thursday: 8,
      friday: 6,
      saturday: 0,
      sunday: 0,
      totalHours: 32,
      billableHours: 30,
      status: 'approved'
    },
    {
      id: '3',
      employeeName: 'Sarah Johnson',
      jobId: 'JOB-2025-002',
      jobTitle: 'Office Lighting Maintenance',
      week: '2025-01-20',
      monday: 8,
      tuesday: 8,
      wednesday: 8,
      thursday: 8,
      friday: 8,
      saturday: 4,
      sunday: 0,
      totalHours: 44,
      billableHours: 40,
      status: 'draft'
    }
  ])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return (
          <Badge className="bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-50">
            Draft
          </Badge>
        )
      case 'submitted':
        return (
          <Badge className="bg-yellow-50 text-yellow-600 border-yellow-200 hover:bg-yellow-50">
            Submitted
          </Badge>
        )
      case 'approved':
        return (
          <Badge className="bg-green-50 text-green-600 border-green-200 hover:bg-green-50">
            <CheckSquare className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        )
      case 'rejected':
        return (
          <Badge className="bg-red-50 text-red-600 border-red-200 hover:bg-red-50">
            <X className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        )
      default:
        return (
          <Badge className="bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-50">
            {status}
          </Badge>
        )
    }
  }

  const formatWeek = (weekString: string) => {
    const date = new Date(weekString)
    const endDate = new Date(date)
    endDate.setDate(date.getDate() + 6)
    
    return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
  }

  const uniqueEmployees = Array.from(new Set(timesheets.map(t => t.employeeName)))

  const filteredTimesheets = timesheets.filter(timesheet => {
    const matchesSearch = timesheet.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         timesheet.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         timesheet.jobId.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || timesheet.status === filterStatus
    const matchesEmployee = filterEmployee === 'all' || timesheet.employeeName === filterEmployee
    
    return matchesSearch && matchesStatus && matchesEmployee
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Jobs
          </Button>
          <div>
            <h1 className="text-2xl font-medium text-[#2b2b2b]">Timesheet Management</h1>
            <p className="text-sm text-[#2b2b2b]/60 mt-1">Review and approve employee timesheets</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white shadow-sm border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Timesheets</p>
                <p className="text-2xl font-medium text-[#2b2b2b]">{timesheets.length}</p>
              </div>
              <div className="w-12 h-12 bg-[#E6F6FF] rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-[#00A1FF]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Approval</p>
                <p className="text-2xl font-medium text-[#2b2b2b]">
                  {timesheets.filter(t => t.status === 'submitted').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Hours</p>
                <p className="text-2xl font-medium text-[#2b2b2b]">
                  {timesheets.reduce((sum, t) => sum + t.totalHours, 0)}h
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Billable Hours</p>
                <p className="text-2xl font-medium text-[#2b2b2b]">
                  {timesheets.reduce((sum, t) => sum + t.billableHours, 0)}h
                </p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <CheckSquare className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-white shadow-sm border-0">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search timesheets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterEmployee} onValueChange={setFilterEmployee}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by Employee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                {uniqueEmployees.map((employee) => (
                  <SelectItem key={employee} value={employee}>{employee}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>{filteredTimesheets.length} timesheets</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timesheets Table */}
      <Card className="bg-white shadow-sm border-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#162f3d] hover:bg-[#162f3d]">
                <TableHead className="text-white font-medium">Employee</TableHead>
                <TableHead className="text-white font-medium">Job</TableHead>
                <TableHead className="text-white font-medium">Week</TableHead>
                <TableHead className="text-white font-medium">Mon</TableHead>
                <TableHead className="text-white font-medium">Tue</TableHead>
                <TableHead className="text-white font-medium">Wed</TableHead>
                <TableHead className="text-white font-medium">Thu</TableHead>
                <TableHead className="text-white font-medium">Fri</TableHead>
                <TableHead className="text-white font-medium">Sat</TableHead>
                <TableHead className="text-white font-medium">Sun</TableHead>
                <TableHead className="text-white font-medium">Total</TableHead>
                <TableHead className="text-white font-medium">Billable</TableHead>
                <TableHead className="text-white font-medium">Status</TableHead>
                <TableHead className="text-white font-medium">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTimesheets.map((timesheet, index) => (
                <TableRow key={timesheet.id} className={index % 2 === 1 ? "bg-[#eff4fa]" : ""}>
                  <TableCell className="font-medium">{timesheet.employeeName}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium text-sm">{timesheet.jobTitle}</div>
                      <div className="text-xs text-gray-500">{timesheet.jobId}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{formatWeek(timesheet.week)}</TableCell>
                  <TableCell className="text-center">{timesheet.monday}h</TableCell>
                  <TableCell className="text-center">{timesheet.tuesday}h</TableCell>
                  <TableCell className="text-center">{timesheet.wednesday}h</TableCell>
                  <TableCell className="text-center">{timesheet.thursday}h</TableCell>
                  <TableCell className="text-center">{timesheet.friday}h</TableCell>
                  <TableCell className="text-center">{timesheet.saturday}h</TableCell>
                  <TableCell className="text-center">{timesheet.sunday}h</TableCell>
                  <TableCell className="font-medium">{timesheet.totalHours}h</TableCell>
                  <TableCell className="font-medium">{timesheet.billableHours}h</TableCell>
                  <TableCell>{getStatusBadge(timesheet.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {timesheet.status === 'submitted' && (
                        <>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700">
                            <CheckSquare className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                            <X className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Empty State */}
      {filteredTimesheets.length === 0 && (
        <Card className="bg-white shadow-sm border-0">
          <CardContent className="p-12 text-center">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[#2b2b2b] mb-2">No timesheets found</h3>
            <p className="text-gray-600">
              {searchTerm || filterStatus !== 'all' || filterEmployee !== 'all'
                ? 'Try adjusting your search criteria or filters'
                : 'Timesheets will appear here when employees submit them'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}