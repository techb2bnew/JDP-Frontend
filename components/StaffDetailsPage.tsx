import React, { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { toast } from 'sonner'
import type { LucideIcon } from 'lucide-react'
import { 
  ArrowLeft, 
  Edit, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Briefcase,
  Clock,
  User,
  Building2,
  Shield,
  FileText,
  CheckCircle,
  DollarSign
} from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'

type StaffJobHistory = {
  jobTitle: string
  client: string
  location: string
  startDate: string
  endDate: string
  status: string
  hoursWorked: number
}

interface Staff {
  id: string
  name: string
  email: string
  phone: string
  address: string
  position: string
  department: string
  dateOfJoining: string
  status: 'active' | 'inactive' | 'on-leave'
  avatar?: string
  employeeId?: string
  manager?: string
  salary?: number
  workSchedule?: string
  emergencyContact?: string
  notes?: string
  totalJobs?: number
  totalHours?: number
  completedJobs?: number
  jobHistory?: StaffJobHistory[]
}

interface StaffDetailsPageProps {
  staffId: string
  staffDetails: any
  isLoading: boolean
  onBack: () => void
}

// Sample staff data - in a real app, this would come from an API
const getStaffById = (id: string): Staff | null => {
  const staffData: Staff[] = [
    {
      id: '1111',
      name: 'John Smith',
      email: 'john@gmail.com',
      phone: '+61 2222 021 203',
      address: '47 W 13th St, New York, NY 10011, USA',
      position: 'Electrical Engineer',
      department: 'Engineering',
      dateOfJoining: '2025-04-27',
      status: 'active',
      employeeId: 'EMP-2025-001',
      manager: 'Sarah Thompson',
      salary: 85000,
      workSchedule: 'Full-time (9 AM - 5 PM)',
      emergencyContact: '+61 2222 021 204',
      notes: 'Experienced electrical engineer with expertise in high voltage systems and safety protocols.',
      totalJobs: 3,
      totalHours: 184,
      completedJobs: 1,
      jobHistory: [
        {
          jobTitle: 'Office Complex Electrical Installation',
          client: 'ABC Corporation',
          location: 'Downtown Sydney',
          startDate: '2025-01-15',
          endDate: '2025-02-15',
          status: 'Active',
          hoursWorked: 120
        },
        {
          jobTitle: 'Residential Solar System',
          client: 'Smith Family',
          location: 'Suburban Melbourne',
          startDate: '2025-01-10',
          endDate: '2025-01-25',
          status: 'Completed',
          hoursWorked: 64
        },
        {
          jobTitle: 'Industrial Equipment Upgrade',
          client: 'Manufacturing Inc',
          location: 'Industrial Park Brisbane',
          startDate: '2025-02-01',
          endDate: '2025-02-28',
          status: 'Pending',
          hoursWorked: 0
        }
      ]
    },
    {
      id: '2122',
      name: 'David Smith',
      email: 'david@gmail.com',
      phone: '+61 2222 021 203',
      address: '47 W 13th St, New York, NY 10011, USA',
      position: 'Senior Technician',
      department: 'Operations',
      dateOfJoining: '2025-04-07',
      status: 'active',
      employeeId: 'EMP-2025-002',
      manager: 'Michael Rodriguez',
      salary: 65000,
      workSchedule: 'Full-time (8 AM - 4 PM)',
      emergencyContact: '+61 2222 021 205',
      notes: 'Senior technician with strong troubleshooting skills and team leadership experience.'
    },
    {
      id: '0203',
      name: 'Olivia',
      email: 'olivia@gmail.com',
      phone: '+61 2222 021 203',
      address: '47 W 13th St, New York, NY 10011, USA',
      position: 'Project Manager',
      department: 'Management',
      dateOfJoining: '2025-04-15',
      status: 'on-leave',
      employeeId: 'EMP-2025-003',
      manager: 'Jennifer Clarke',
      salary: 95000,
      workSchedule: 'Full-time (9 AM - 6 PM)',
      emergencyContact: '+61 2222 021 206',
      notes: 'Project manager overseeing multiple electrical installation projects.'
    },
    {
      id: '0791',
      name: 'Alen',
      email: 'alen@gmail.com',
      phone: '+61 2222 021 203',
      address: '47 W 13th St, New York, NY 10011, USA',
      position: 'Technician',
      department: 'Operations',
      dateOfJoining: '2025-04-19',
      status: 'inactive',
      employeeId: 'EMP-2025-004',
      manager: 'David Smith',
      salary: 55000,
      workSchedule: 'Full-time (7 AM - 3 PM)',
      emergencyContact: '+61 2222 021 207',
      notes: 'Technician specializing in electrical maintenance and repairs.'
    }
  ]
  
  return staffData.find(staff => staff.id === id) || null
}

const departments = ['Engineering', 'Operations', 'Management', 'Sales', 'HR', 'Finance']
const positions = ['Electrical Engineer', 'Senior Technician', 'Technician', 'Project Manager', 'Sales Executive', 'HR Manager']

export function StaffDetailsPage({ staffId, staffDetails, isLoading, onBack }: StaffDetailsPageProps) {
  // Transform API data to component format
  const transformApiData = (apiData: any): Staff | null => {
    if (!apiData) return null
    
    const jobHistory: StaffJobHistory[] = Array.isArray(apiData.job_history)
      ? apiData.job_history.map((job: any) => ({
          jobTitle: job.job_title || job.title || 'N/A',
          client: job.client_name || job.client || job.customer?.name || 'N/A',
          location: job.location || job.job_location || 'N/A',
          startDate: job.start_date || job.assigned_at || '',
          endDate: job.end_date || job.completed_at || '',
          status: job.status || 'N/A',
          hoursWorked: job.hours_worked ?? job.total_hours ?? 0
        }))
      : []

    const totalJobs = apiData.job_statistics?.total_jobs
      ?? apiData.total_jobs
      ?? jobHistory.length

    const completedJobs = apiData.job_statistics?.completed_jobs
      ?? jobHistory.filter(job => job.status?.toLowerCase() === 'completed').length

    const totalHours = apiData.job_statistics?.total_hours
      ?? apiData.total_hours
      ?? apiData.timesheet_stats?.total_hours
      ?? 0

    return {
      id: apiData.id?.toString() || staffId,
      name: apiData.users?.full_name || '',
      email: apiData.users?.email || '',
      phone: apiData.users?.phone || '',
      address: apiData.address || '',
      position: apiData.position || '',
      department: apiData.department || '',
      dateOfJoining: apiData.date_of_joining || '',
      status: apiData.users?.status || 'active',
      employeeId: `EMP-${apiData.id}`,
      manager: apiData.manager || apiData.supervisor || 'Not assigned',
      salary: apiData.salary || apiData.annual_salary || 0,
      workSchedule: apiData.work_schedule || 'Full-time',
      emergencyContact: apiData.emergency_contact || 'Not provided',
      notes: apiData.notes || 'No additional notes',
      totalJobs,
      totalHours,
      completedJobs,
      jobHistory
    }
  }

  const [staff, setStaff] = useState<Staff | null>(transformApiData(staffDetails))
  
  // Update staff when API data changes
  React.useEffect(() => {
    setStaff(transformApiData(staffDetails))
  }, [staffDetails])
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editFormData, setEditFormData] = useState({
    name: staff?.name || '',
    email: staff?.email || '',
    phone: staff?.phone || '',
    address: staff?.address || '',
    position: staff?.position || '',
    department: staff?.department || '',
    dateOfJoining: staff?.dateOfJoining || '',
    status: staff?.status || 'active',
    manager: staff?.manager || '',
    salary: staff?.salary || 0,
    workSchedule: staff?.workSchedule || '',
    emergencyContact: staff?.emergencyContact || '',
    notes: staff?.notes || ''
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Staff List
          </Button>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2 text-gray-600">Loading staff details...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!staff) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Staff List
          </Button>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">Staff member not found.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-green-50 text-green-600 border-green-200 hover:bg-green-50">
            <Shield className="w-3 h-3 mr-1" />
            Active
          </Badge>
        )
      case 'inactive':
        return (
          <Badge className="bg-red-50 text-red-600 border-red-200 hover:bg-red-50">
            <Shield className="w-3 h-3 mr-1" />
            Inactive
          </Badge>
        )
      case 'on-leave':
        return (
          <Badge className="bg-yellow-50 text-yellow-600 border-yellow-200 hover:bg-yellow-50">
            <Clock className="w-3 h-3 mr-1" />
            On Leave
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

  const handleEdit = () => {
    setEditFormData({
      name: staff.name,
      email: staff.email,
      phone: staff.phone,
      address: staff.address,
      position: staff.position,
      department: staff.department,
      dateOfJoining: staff.dateOfJoining,
      status: staff.status,
      manager: staff.manager || '',
      salary: staff.salary || 0,
      workSchedule: staff.workSchedule || '',
      emergencyContact: staff.emergencyContact || '',
      notes: staff.notes || ''
    })
    setIsEditDialogOpen(true)
  }

  const handleSave = () => {
    if (!editFormData.name || !editFormData.email || !editFormData.phone) {
      toast.error('Please fill in all required fields')
      return
    }

    const updatedStaff: Staff = {
      ...staff,
      name: editFormData.name,
      email: editFormData.email,
      phone: editFormData.phone,
      address: editFormData.address,
      position: editFormData.position,
      department: editFormData.department,
      dateOfJoining: editFormData.dateOfJoining,
      status: editFormData.status as 'active' | 'inactive' | 'on-leave',
      manager: editFormData.manager,
      salary: editFormData.salary,
      workSchedule: editFormData.workSchedule,
      emergencyContact: editFormData.emergencyContact,
      notes: editFormData.notes
    } 
    
    setStaff(updatedStaff)
    setIsEditDialogOpen(false)
    toast.success('Staff member updated successfully')
  }

  const formatSalary = (salary?: number) => {
    if (!salary) return 'Not specified'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(salary)
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  const summaryMetrics = [
    {
      label: 'Total Jobs',
      value: staff.totalJobs ?? 0,
      icon: Briefcase,
      iconBg: 'bg-blue-500'
    },
    {
      label: 'Total Hours',
      value: staff.totalHours ?? 0,
      icon: Clock,
      iconBg: 'bg-emerald-500',
      formatter: (value: number) => `${value.toLocaleString()}h`
    },
    {
      label: 'Completed Jobs',
      value: staff.completedJobs ?? 0,
      icon: CheckCircle,
      iconBg: 'bg-purple-500'
    }
  ]

  const contactInfoItems: Array<{ label: string; value: string; icon: LucideIcon; colSpan?: number }> = [
    {
      label: 'Email Address',
      value: staff.email || 'Not provided',
      icon: Mail
    },
    {
      label: 'Phone Number',
      value: staff.phone || 'Not provided',
      icon: Phone
    },
    {
      label: 'DOB',
      value: (staffDetails as any)?.date_of_birth || (staffDetails as any)?.dob || (staffDetails as any)?.dateOfBirth || 'Not provided',
      icon: Calendar
    },
    {
      label: 'Address',
      value: staff.address || 'Not provided',
      icon: MapPin, 
    }
  ]

  const employmentInfoItems: Array<{ label: string; value: string; icon: LucideIcon }> = [
    {
      label: 'Position',
      value: staff.position || 'Not assigned',
      icon: User
    },
    {
      label: 'Work Schedule',
      value: staff.workSchedule || 'Not specified',
      icon: Clock
    } 
  ]

  const jobHistory = staff.jobHistory ?? []

  const renderJobStatusBadge = (status: string) => {
    const normalized = status?.toLowerCase()
    switch (normalized) {
      case 'active':
        return (
          <Badge className="bg-green-50 text-green-600 border-green-200">
            Active
          </Badge>
        )
      case 'completed':
        return (
          <Badge className="bg-blue-50 text-blue-600 border-blue-200">
            Completed
          </Badge>
        )
      case 'pending':
        return (
          <Badge className="bg-yellow-50 text-yellow-600 border-yellow-200">
            Pending
          </Badge>
        )
      case 'cancelled':
      case 'canceled':
        return (
          <Badge className="bg-red-50 text-red-600 border-red-200">
            Cancelled
          </Badge>
        )
      default:
        return (
          <Badge className="bg-gray-50 text-gray-600 border-gray-200">
            {status || 'N/A'}
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back  
        </Button>
        <div>
            <h1 className="text-2xl font-semibold text-[#2b2b2b]">Staff Details</h1>
            <p className="text-sm text-gray-500">View and manage staff profile</p>
          </div>
        {/* <Button onClick={handleEdit} className="gap-2 bg-primary text-white hover:bg-[#0090e6]">
          <Edit className="h-4 w-4" />
          Edit Staff
        </Button> */}
      </div>

      <Card className="bg-white shadow-md border-0">
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5 text-[#00A1FF]" />
              Profile Overview
            </CardTitle>
            <p className="text-sm text-gray-500">View and manage staff profile and job history</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-100">
              Staff ID: {staff.employeeId}
            </span>
            {getStatusBadge(staff.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-[#00A1FF] rounded-full flex items-center justify-center shadow-inner">
                <span className="text-white font-medium text-xl">
                  {staff.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-[#2b2b2b]">{staff.name}</h2>
                <p className="text-sm text-gray-600">{staff.position}</p>
                <p className="text-xs text-gray-500 mt-1">Joined {formatDate(staff.dateOfJoining)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-right text-sm text-gray-600">
              <div>
                <p className="text-xs text-gray-500">Department</p>
                <p className="font-medium text-[#2b2b2b]">{staff.department}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Work Schedule</p>
                <p className="font-medium text-[#2b2b2b]">{staff.workSchedule || 'Not specified'}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contactInfoItems.map((item, index) => {
              const Icon = item.icon
              return (
                <div
                  key={index}
                  className={`flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50 ${item.colSpan ? 'md:col-span-2' : ''}`}
                >
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                    <Icon className="h-4 w-4 text-[#00A1FF]" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{item.label}</p>
                    <p className="text-sm font-medium text-[#2b2b2b] break-all">{item.value}</p>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {employmentInfoItems.map((item, index) => {
              const Icon = item.icon
              return (
                <div key={index} className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                    <Icon className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">{item.label}</p>
                    <p className="text-sm font-medium text-[#2b2b2b]">{item.value}</p>
                  </div>
                </div>
              )
            })}
          </div>

          {staff.notes && (
            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50">
              <p className="text-sm text-[#2b2b2b] leading-relaxed">{staff.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

       

      {/* Edit Dialog */}
      {/* <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={editFormData.name}
                onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                placeholder="Enter full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                placeholder="Enter email address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                value={editFormData.phone}
                onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                placeholder="Enter phone number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergencyContact">Emergency Contact</Label>
              <Input
                id="emergencyContact"
                value={editFormData.emergencyContact}
                onChange={(e) => setEditFormData({...editFormData, emergencyContact: e.target.value})}
                placeholder="Enter emergency contact"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Select value={editFormData.position} onValueChange={(value) => setEditFormData({...editFormData, position: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  {positions.map((position) => (
                    <SelectItem key={position} value={position}>{position}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select value={editFormData.department} onValueChange={(value) => setEditFormData({...editFormData, department: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="manager">Manager</Label>
              <Input
                id="manager"
                value={editFormData.manager}
                onChange={(e) => setEditFormData({...editFormData, manager: e.target.value})}
                placeholder="Enter manager name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salary">Salary</Label>
              <Input
                id="salary"
                type="number"
                value={editFormData.salary || ''}
                onChange={(e) => setEditFormData({...editFormData, salary: Number(e.target.value)})}
                placeholder="Enter salary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="workSchedule">Work Schedule</Label>
              <Input
                id="workSchedule"
                value={editFormData.workSchedule}
                onChange={(e) => setEditFormData({...editFormData, workSchedule: e.target.value})}
                placeholder="Enter work schedule"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={editFormData.status} onValueChange={(value: 'active' | 'inactive' | 'on-leave') => setEditFormData({...editFormData, status: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="on-leave">On Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateOfJoining">Date of Joining</Label>
              <Input
                id="dateOfJoining"
                type="date"
                value={editFormData.dateOfJoining}
                onChange={(e) => setEditFormData({...editFormData, dateOfJoining: e.target.value})}
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={editFormData.address}
                onChange={(e) => setEditFormData({...editFormData, address: e.target.value})}
                placeholder="Enter full address"
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={editFormData.notes}
                onChange={(e) => setEditFormData({...editFormData, notes: e.target.value})}
                placeholder="Additional notes..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-primary text-white hover:bg-[#0090e6]">
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog> */}
    </div>
  )
}