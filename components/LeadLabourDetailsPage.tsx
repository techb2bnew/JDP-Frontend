import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Badge } from './ui/badge'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { 
  ArrowLeft, 
  Edit, 
  Download, 
  FileText, 
  Camera, 
  Shield, 
  Clock, 
  MapPin,
  Phone,
  Mail,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Briefcase
} from 'lucide-react'

interface LeadLabourDetailsPageProps {
  leadLabourId: string
  onBack: () => void
}

interface TimesheetEntry {
  id: string
  date: string
  jobName: string
  startTime: string
  endTime: string
  totalHours: number
  status: 'submitted' | 'approved' | 'rejected'
  description: string
}

interface JobEntry {
  id: string
  jobTitle: string
  client: string
  location: string
  startDate: string
  endDate: string
  status: 'active' | 'completed' | 'pending' | 'cancelled'
  priority: 'high' | 'medium' | 'low'
  description: string
  hoursWorked: number
}

const mockLeadLabour = {
  id: 'LL001',
  leadLabourId: 'LL-2025-001',
  name: 'John Smith',
  email: 'john@gmail.com',
  phone: '+61 2222 021 203',
  dob: '20-10-1994',
  address: '47 W 13th St, New York, NY 10011, USA',
  notes: 'Experienced electrical engineer with specialized skills in high voltage systems.',
  department: 'Engineering',
  dateOfJoining: '18-10-2024',
  jobsCompleted: 67,
  documents: {
    idProof: { name: 'Driving License.pdf', type: 'Driving License' },
    photo: { name: 'profile_photo.jpg', type: 'Profile Photo' },
    resume: { name: 'abc_lead.pdf', type: 'Resume' }
  },
  permissions: {
    createJob: true,
    addClient: true,
    orderInventoryPrice: false,
    invoicePrice: true,
    invoiceGenerate: false,
    closeJob: true,
    changeLaborTime: true
  }
}

const mockTimesheets: TimesheetEntry[] = [
  {
    id: 'TS001',
    date: '2025-01-22',
    jobName: 'Office Complex Wiring',
    startTime: '08:00',
    endTime: '16:00',
    totalHours: 8,
    status: 'approved',
    description: 'Main electrical panel installation and testing'
  },
  {
    id: 'TS002',
    date: '2025-01-21',
    jobName: 'Residential Solar Installation',
    startTime: '09:00',
    endTime: '17:00',
    totalHours: 8,
    status: 'submitted',
    description: 'Solar panel wiring and inverter setup'
  },
  {
    id: 'TS003',
    date: '2025-01-20',
    jobName: 'Industrial Motor Repair',
    startTime: '07:30',
    endTime: '15:30',
    totalHours: 8,
    status: 'rejected',
    description: 'Motor control system diagnostics and repair'
  }
]

const mockJobs: JobEntry[] = [
  {
    id: 'JOB001',
    jobTitle: 'Office Complex Electrical Installation',
    client: 'ABC Corporation',
    location: 'Downtown Sydney',
    startDate: '2025-01-15',
    endDate: '2025-02-15',
    status: 'active',
    priority: 'high',
    description: 'Complete electrical installation for new office complex',
    hoursWorked: 120
  },
  {
    id: 'JOB002',
    jobTitle: 'Residential Solar System',
    client: 'Smith Family',
    location: 'Suburban Melbourne',
    startDate: '2025-01-10',
    endDate: '2025-01-25',
    status: 'completed',
    priority: 'medium',
    description: 'Solar panel installation and grid connection',
    hoursWorked: 64
  },
  {
    id: 'JOB003',
    jobTitle: 'Industrial Equipment Upgrade',
    client: 'Manufacturing Inc',
    location: 'Industrial Park Brisbane',
    startDate: '2025-02-01',
    endDate: '2025-02-28',
    status: 'pending',
    priority: 'low',
    description: 'Upgrade electrical systems for manufacturing equipment',
    hoursWorked: 0
  }
]

export function LeadLabourDetailsPage({ leadLabourId, onBack }: LeadLabourDetailsPageProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [timesheetFilter, setTimesheetFilter] = useState('all')
  const [jobFilter, setJobFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const getStatusBadge = (status: string, type: 'timesheet' | 'job') => {
    if (type === 'timesheet') {
      switch (status) {
        case 'approved':
          return <Badge className="bg-green-50 text-green-600 border-green-200">Approved</Badge>
        case 'submitted':
          return <Badge className="bg-blue-50 text-blue-600 border-blue-200">Submitted</Badge>
        case 'rejected':
          return <Badge className="bg-red-50 text-red-600 border-red-200">Rejected</Badge>
        default:
          return <Badge className="bg-gray-50 text-gray-600 border-gray-200">{status}</Badge>
      }
    } else {
      switch (status) {
        case 'active':
          return <Badge className="bg-green-50 text-green-600 border-green-200">Active</Badge>
        case 'completed':
          return <Badge className="bg-blue-50 text-blue-600 border-blue-200">Completed</Badge>
        case 'pending':
          return <Badge className="bg-yellow-50 text-yellow-600 border-yellow-200">Pending</Badge>
        case 'cancelled':
          return <Badge className="bg-red-50 text-red-600 border-red-200">Cancelled</Badge>
        default:
          return <Badge className="bg-gray-50 text-gray-600 border-gray-200">{status}</Badge>
      }
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge className="bg-red-50 text-red-600 border-red-200">High</Badge>
      case 'medium':
        return <Badge className="bg-yellow-50 text-yellow-600 border-yellow-200">Medium</Badge>
      case 'low':
        return <Badge className="bg-green-50 text-green-600 border-green-200">Low</Badge>
      default:
        return <Badge className="bg-gray-50 text-gray-600 border-gray-200">{priority}</Badge>
    }
  }

  const filteredTimesheets = mockTimesheets.filter(timesheet => {
    const matchesFilter = timesheetFilter === 'all' || timesheet.status === timesheetFilter
    const matchesSearch = timesheet.jobName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         timesheet.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const filteredJobs = mockJobs.filter(job => {
    const matchesFilter = jobFilter === 'all' || job.status === jobFilter
    const matchesSearch = job.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.location.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const totalHoursThisWeek = filteredTimesheets
    .filter(t => new Date(t.date) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
    .reduce((acc, t) => acc + t.totalHours, 0)

  const totalHoursThisMonth = filteredTimesheets
    .filter(t => new Date(t.date).getMonth() === new Date().getMonth())
    .reduce((acc, t) => acc + t.totalHours, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-medium text-[#2b2b2b]">Lead Labour Details</h1>
            <p className="text-sm text-[#2b2b2b]/60 mt-1">Comprehensive information and activity tracking</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
          <Button className="bg-primary text-white hover:bg-[#0090e6] gap-2">
            <Edit className="h-4 w-4" />
            Edit Details
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="timesheet">Timesheet</TabsTrigger>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
          <TabsTrigger value="total-time">Total Time</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Personal Details Card */}
          <Card className="bg-white shadow-sm border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>Personal Detail</span>
                <Badge className="bg-[#E6F6FF] text-[#00A1FF]">#{mockLeadLabour.leadLabourId}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#00A1FF] rounded-full flex items-center justify-center text-white font-medium">
                      {mockLeadLabour.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h3 className="font-medium text-[#2b2b2b]">{mockLeadLabour.name}</h3>
                      <p className="text-sm text-gray-600">{mockLeadLabour.department}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-[#2b2b2b]">{mockLeadLabour.email}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-[#2b2b2b]">{mockLeadLabour.phone}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-[#2b2b2b]">DOB: {mockLeadLabour.dob}</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                      <span className="text-sm text-[#2b2b2b]">{mockLeadLabour.address}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-[#2b2b2b] mb-2">Job Information</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Department:</span>
                        <span className="text-sm text-[#2b2b2b]">{mockLeadLabour.department}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Date of Joining:</span>
                        <span className="text-sm text-[#2b2b2b]">{mockLeadLabour.dateOfJoining}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Jobs Completed:</span>
                        <span className="text-sm text-[#2b2b2b]">{mockLeadLabour.jobsCompleted}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-[#2b2b2b] mb-2">Notes</h4>
                    <p className="text-sm text-gray-600">{mockLeadLabour.notes}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Document Upload Card */}
          <Card className="bg-white shadow-sm border-0">
            <CardHeader>
              <CardTitle>Document Upload</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label className="text-sm font-medium text-[#2b2b2b]">ID Proof</Label>
                  <div className="mt-2 p-4 border rounded-lg bg-gray-50">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-[#00A1FF]" />
                      <div>
                        <p className="text-sm font-medium text-[#2b2b2b]">{mockLeadLabour.documents.idProof.type}</p>
                        <p className="text-xs text-gray-600">{mockLeadLabour.documents.idProof.name}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-[#2b2b2b]">Resume</Label>
                  <div className="mt-2 p-4 border rounded-lg bg-gray-50">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-[#00A1FF]" />
                      <div>
                        <p className="text-sm font-medium text-[#2b2b2b]">Resume Id Proof</p>
                        <p className="text-xs text-gray-600">{mockLeadLabour.documents.resume.name}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-[#2b2b2b]">Upload ID Proof</Label>
                  <div className="mt-2 p-4 border rounded-lg bg-gray-50">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-[#00A1FF]" />
                      <div>
                        <p className="text-sm font-medium text-[#2b2b2b]">{mockLeadLabour.documents.idProof.type}</p>
                        <p className="text-xs text-gray-600">{mockLeadLabour.documents.idProof.name}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Permissions Card */}
          <Card className="bg-white shadow-sm border-0">
            <CardHeader>
              <CardTitle>Permission</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(mockLeadLabour.permissions).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2">
                    {value ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span className="text-sm text-[#2b2b2b]">
                      {key === 'createJob' && 'Create Job'}
                      {key === 'addClient' && 'Add Client/Customer'}
                      {key === 'orderInventoryPrice' && 'Order Inventory Price'}
                      {key === 'invoicePrice' && 'Invoice Price'}
                      {key === 'invoiceGenerate' && 'Invoice Generate'}
                      {key === 'closeJob' && 'Close Job'}
                      {key === 'changeLaborTime' && 'Change Labor Time'}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timesheet" className="space-y-6">
          {/* Timesheet Filters */}
          <Card className="bg-white shadow-sm border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search timesheets..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  
                  <Select value={timesheetFilter} onValueChange={setTimesheetFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timesheet Table */}
          <Card className="bg-white shadow-sm border-0">
            <CardHeader>
              <CardTitle>Timesheet Entries</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#162f3d] hover:bg-[#162f3d]">
                    <TableHead className="text-white font-medium">Date</TableHead>
                    <TableHead className="text-white font-medium">Job</TableHead>
                    <TableHead className="text-white font-medium">Start Time</TableHead>
                    <TableHead className="text-white font-medium">End Time</TableHead>
                    <TableHead className="text-white font-medium">Total Hours</TableHead>
                    <TableHead className="text-white font-medium">Status</TableHead>
                    <TableHead className="text-white font-medium">Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTimesheets.map((timesheet, index) => (
                    <TableRow key={timesheet.id} className={index % 2 === 1 ? "bg-[#eff4fa]" : ""}>
                      <TableCell className="text-sm text-[#2b2b2b]/80">{timesheet.date}</TableCell>
                      <TableCell className="text-sm text-[#2b2b2b]/80 font-medium">{timesheet.jobName}</TableCell>
                      <TableCell className="text-sm text-[#2b2b2b]/80">{timesheet.startTime}</TableCell>
                      <TableCell className="text-sm text-[#2b2b2b]/80">{timesheet.endTime}</TableCell>
                      <TableCell className="text-sm text-[#2b2b2b]/80">{timesheet.totalHours}h</TableCell>
                      <TableCell>{getStatusBadge(timesheet.status, 'timesheet')}</TableCell>
                      <TableCell className="text-sm text-gray-600 max-w-xs truncate">{timesheet.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-6">
          {/* Jobs Filters */}
          <Card className="bg-white shadow-sm border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search jobs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  
                  <Select value={jobFilter} onValueChange={setJobFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Jobs Table */}
          <Card className="bg-white shadow-sm border-0">
            <CardHeader>
              <CardTitle>Job Assignments</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#162f3d] hover:bg-[#162f3d]">
                    <TableHead className="text-white font-medium">Job Title</TableHead>
                    <TableHead className="text-white font-medium">Client</TableHead>
                    <TableHead className="text-white font-medium">Location</TableHead>
                    <TableHead className="text-white font-medium">Start Date</TableHead>
                    <TableHead className="text-white font-medium">End Date</TableHead>
                    <TableHead className="text-white font-medium">Status</TableHead>
                    <TableHead className="text-white font-medium">Priority</TableHead>
                    <TableHead className="text-white font-medium">Hours Worked</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredJobs.map((job, index) => (
                    <TableRow key={job.id} className={index % 2 === 1 ? "bg-[#eff4fa]" : ""}>
                      <TableCell className="text-sm text-[#2b2b2b]/80 font-medium">{job.jobTitle}</TableCell>
                      <TableCell className="text-sm text-[#2b2b2b]/80">{job.client}</TableCell>
                      <TableCell className="text-sm text-[#2b2b2b]/80">{job.location}</TableCell>
                      <TableCell className="text-sm text-[#2b2b2b]/80">{job.startDate}</TableCell>
                      <TableCell className="text-sm text-[#2b2b2b]/80">{job.endDate}</TableCell>
                      <TableCell>{getStatusBadge(job.status, 'job')}</TableCell>
                      <TableCell>{getPriorityBadge(job.priority)}</TableCell>
                      <TableCell className="text-sm text-[#2b2b2b]/80">{job.hoursWorked}h</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="total-time" className="space-y-6">
          {/* Time Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white shadow-sm border-0">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Clock className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">This Week</p>
                    <p className="text-2xl font-medium text-[#2b2b2b]">{totalHoursThisWeek}h</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white shadow-sm border-0">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Calendar className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">This Month</p>
                    <p className="text-2xl font-medium text-[#2b2b2b]">{totalHoursThisMonth}h</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white shadow-sm border-0">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#E6F6FF] rounded-lg">
                    <Briefcase className="h-6 w-6 text-[#00A1FF]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Jobs</p>
                    <p className="text-2xl font-medium text-[#2b2b2b]">{mockLeadLabour.jobsCompleted}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Time Breakdown */}
          <Card className="bg-white shadow-sm border-0">
            <CardHeader>
              <CardTitle>Time Breakdown by Job</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockJobs.map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-[#2b2b2b]">{job.jobTitle}</h4>
                      <p className="text-sm text-gray-600">{job.client} • {job.location}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-[#2b2b2b]">{job.hoursWorked}h</p>
                      <p className="text-sm text-gray-600">{getStatusBadge(job.status, 'job')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}