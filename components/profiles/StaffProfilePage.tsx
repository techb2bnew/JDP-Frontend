'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Badge } from '../ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Checkbox } from '../ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  Building,
  Shield,
  FileText,
  Clock,
  Save,
  Edit,
  Download,
  Filter,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react'
import { AdminStaffProfile, LeaveRecord, TimesheetEntry, TimesheetSummary, ExtendedPermissions } from '../../types/profiles'

// Mock data
const mockStaffProfile: AdminStaffProfile & {
  leaveRecords: LeaveRecord[]
  timesheet: TimesheetEntry[]
  timesheetSummary: TimesheetSummary
  extendedPermissions: ExtendedPermissions
} = {
  id: 'STAFF-001',
  legalName: 'John Michael Smith',
  fullName: 'John Smith',
  printOnCheckAs: 'John Smith',
  socialSecurityNo: '***-**-1234',
  mediaNo: 'MED-001',
  dateOfBirth: '1990-05-15',
  gender: 'male',
  maritalStatus: 'married',
  usStatus: 'online',
  dateOfJoining: '2023-01-15',
  status: 'active',
  email: 'john.smith@jdpcorp.com',
  mainPhone: '+1 (555) 123-4567',
  altPhone: '+1 (555) 234-5678',
  mobilePhone: '+1 (555) 345-6789',
  faxNumber: '+1 (555) 456-7890',
  ccMail: 'john.smith.cc@jdpcorp.com',
  address: '123 Main Street, Apt 4B',
  city: 'New York',
  state: 'NY',
  zipCode: '10001',
  website: 'johnsmith.com',
  otherInfo: 'Excellent team player with leadership qualities',
  hireDate: '2023-01-15',
  originalHireDate: '2023-01-15',
  adjustedServiceDate: '2023-01-15',
  employmentType: 'full_time',
  jobTitle: 'Senior Project Manager',
  supervisor: 'Sarah Johnson',
  department: 'Operations',
  targetBonus: 5000,
  description: 'Manages multiple construction projects and coordinates with contractors',
  permissions: {
    dashboard: { view: true, edit: false, update: false },
    products: { view: true, edit: true, update: true },
    orders: { view: true, edit: true, update: false },
    customers: { view: true, edit: false, update: false },
    analytics: { view: true, edit: false, update: false },
    invoices: { view: true, edit: true, update: true },
    staff: { view: true, edit: false, update: false },
    jobs: { view: true, edit: true, update: true }
  },
  profilePicture: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=center',
  leaveRecords: [
    {
      id: 'LV-001',
      date: '2025-01-10',
      leaveType: 'full-day',
      reason: 'Personal Work',
      status: 'approved',
      approvedBy: 'HR Manager',
      appliedDate: '2025-01-05'
    },
    {
      id: 'LV-002',
      date: '2025-01-15',
      leaveType: 'half-day',
      reason: 'Medical Appointment',
      status: 'pending',
      appliedDate: '2025-01-12'
    },
    {
      id: 'LV-003',
      date: '2024-12-25',
      leaveType: 'sick',
      reason: 'Flu symptoms',
      status: 'approved',
      approvedBy: 'Sarah Johnson',
      appliedDate: '2024-12-24'
    }
  ],
  timesheet: [
    { date: '2025-01-01', inTime: '09:00', outTime: '17:00', hoursWorked: 8, isLeave: false, isHoliday: true, notes: 'New Year Holiday' },
    { date: '2025-01-02', inTime: '09:00', outTime: '18:00', hoursWorked: 8, isLeave: false, isHoliday: false, overtime: 1 },
    { date: '2025-01-03', inTime: '09:15', outTime: '17:30', hoursWorked: 8, isLeave: false, isHoliday: false },
    { date: '2025-01-04', hoursWorked: 0, isLeave: true, isHoliday: false, leaveType: 'sick' },
    { date: '2025-01-05', inTime: '09:00', outTime: '17:00', hoursWorked: 8, isLeave: false, isHoliday: false }
  ],
  timesheetSummary: {
    totalWorkingDays: 20,
    totalLeavesTaken: 3,
    totalHolidays: 2,
    totalHoursWorked: 160,
    overtimeHours: 8
  },
  extendedPermissions: {
    dashboard: { view: true, edit: false, create: false, delete: false },
    products: { view: true, edit: true, create: true, delete: false },
    orders: { view: true, edit: true, create: true, delete: false },
    customers: { view: true, edit: false, create: false, delete: false },
    analytics: { view: true, edit: false, create: false, delete: false },
    invoices: { view: true, edit: true, create: true, delete: false },
    staff: { view: true, edit: false, create: false, delete: false },
    jobs: { view: true, edit: true, create: true, delete: false },
    leaves: { view: true, edit: true, create: true, delete: false },
    inventory: { view: true, edit: true, create: false, delete: false }
  }
}

export function StaffProfilePage() {
  const [activeTab, setActiveTab] = useState('personal')
  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState(mockStaffProfile)
  const [leaveFilter, setLeaveFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const handleSave = () => {
    setIsEditing(false)
    // Save logic here
  }

  const handlePermissionChange = (module: string, permission: string, value: boolean) => {
    setProfile(prev => ({
      ...prev,
      extendedPermissions: {
        ...prev.extendedPermissions,
        [module]: {
          ...prev.extendedPermissions[module as keyof ExtendedPermissions],
          [permission]: value
        }
      }
    }))
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'pending': return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'rejected': return <XCircle className="h-4 w-4 text-red-600" />
      default: return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200'
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const filteredLeaveRecords = profile.leaveRecords.filter(record => {
    const matchesFilter = leaveFilter === 'all' || record.status === leaveFilter
    const matchesSearch = record.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.leaveType.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16">
            <AvatarImage src={profile.profilePicture} alt={profile.fullName} />
            <AvatarFallback>{profile.fullName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">{profile.fullName}</h1>
            <p className="text-muted-foreground">{profile.jobTitle} • {profile.department}</p>
            <Badge className={profile.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
              {profile.status.charAt(0).toUpperCase() + profile.status.slice(1)}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start">
            <TabsTrigger value="personal">Personal Info</TabsTrigger>
            <TabsTrigger value="contact">Contact Details</TabsTrigger>
            <TabsTrigger value="employment">Employment Info</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
            <TabsTrigger value="leaves">Leave Records</TabsTrigger>
            <TabsTrigger value="timesheet">Timesheet</TabsTrigger>
          </TabsList>

          {/* Personal Info Tab */}
          <TabsContent value="personal">
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={profile.fullName}
                      onChange={(e) => setProfile(prev => ({ ...prev, fullName: e.target.value }))}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="legalName">Legal Name</Label>
                    <Input
                      id="legalName"
                      value={profile.legalName}
                      onChange={(e) => setProfile(prev => ({ ...prev, legalName: e.target.value }))}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={profile.dateOfBirth}
                      onChange={(e) => setProfile(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="gender">Gender</Label>
                    <Select value={profile.gender} onValueChange={(value: 'male' | 'female' | 'other') => setProfile(prev => ({ ...prev, gender: value }))} disabled={!isEditing}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="socialSecurityNo">Social Security No.</Label>
                    <Input
                      id="socialSecurityNo"
                      value={profile.socialSecurityNo}
                      onChange={(e) => setProfile(prev => ({ ...prev, socialSecurityNo: e.target.value }))}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="maritalStatus">Marital Status</Label>
                    <Select value={profile.maritalStatus} onValueChange={(value: 'single' | 'married' | 'divorced' | 'widowed') => setProfile(prev => ({ ...prev, maritalStatus: value }))} disabled={!isEditing}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Single</SelectItem>
                        <SelectItem value="married">Married</SelectItem>
                        <SelectItem value="divorced">Divorced</SelectItem>
                        <SelectItem value="widowed">Widowed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="mediaNo">Media Number</Label>
                    <Input
                      id="mediaNo"
                      value={profile.mediaNo || ''}
                      onChange={(e) => setProfile(prev => ({ ...prev, mediaNo: e.target.value }))}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="dateOfJoining">Date of Joining</Label>
                    <Input
                      id="dateOfJoining"
                      type="date"
                      value={profile.dateOfJoining}
                      onChange={(e) => setProfile(prev => ({ ...prev, dateOfJoining: e.target.value }))}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </TabsContent>

          {/* Contact Details Tab */}
          <TabsContent value="contact">
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="mainPhone">Main Phone</Label>
                    <Input
                      id="mainPhone"
                      value={profile.mainPhone}
                      onChange={(e) => setProfile(prev => ({ ...prev, mainPhone: e.target.value }))}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="altPhone">Alternative Phone</Label>
                    <Input
                      id="altPhone"
                      value={profile.altPhone || ''}
                      onChange={(e) => setProfile(prev => ({ ...prev, altPhone: e.target.value }))}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="mobilePhone">Mobile Phone</Label>
                    <Input
                      id="mobilePhone"
                      value={profile.mobilePhone || ''}
                      onChange={(e) => setProfile(prev => ({ ...prev, mobilePhone: e.target.value }))}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={profile.address}
                      onChange={(e) => setProfile(prev => ({ ...prev, address: e.target.value }))}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={profile.city}
                      onChange={(e) => setProfile(prev => ({ ...prev, city: e.target.value }))}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={profile.state}
                      onChange={(e) => setProfile(prev => ({ ...prev, state: e.target.value }))}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="zipCode">ZIP Code</Label>
                    <Input
                      id="zipCode"
                      value={profile.zipCode}
                      onChange={(e) => setProfile(prev => ({ ...prev, zipCode: e.target.value }))}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </TabsContent>

          {/* Employment Info Tab */}
          <TabsContent value="employment">
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="jobTitle">Job Title</Label>
                    <Input
                      id="jobTitle"
                      value={profile.jobTitle}
                      onChange={(e) => setProfile(prev => ({ ...prev, jobTitle: e.target.value }))}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      value={profile.department}
                      onChange={(e) => setProfile(prev => ({ ...prev, department: e.target.value }))}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="supervisor">Supervisor</Label>
                    <Input
                      id="supervisor"
                      value={profile.supervisor}
                      onChange={(e) => setProfile(prev => ({ ...prev, supervisor: e.target.value }))}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="employmentType">Employment Type</Label>
                    <Select value={profile.employmentType} onValueChange={(value: 'full_time' | 'part_time') => setProfile(prev => ({ ...prev, employmentType: value }))} disabled={!isEditing}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full_time">Full Time</SelectItem>
                        <SelectItem value="part_time">Part Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="hireDate">Hire Date</Label>
                    <Input
                      id="hireDate"
                      type="date"
                      value={profile.hireDate}
                      onChange={(e) => setProfile(prev => ({ ...prev, hireDate: e.target.value }))}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="originalHireDate">Original Hire Date</Label>
                    <Input
                      id="originalHireDate"
                      type="date"
                      value={profile.originalHireDate}
                      onChange={(e) => setProfile(prev => ({ ...prev, originalHireDate: e.target.value }))}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="targetBonus">Target Bonus ($)</Label>
                    <Input
                      id="targetBonus"
                      type="number"
                      value={profile.targetBonus || ''}
                      onChange={(e) => setProfile(prev => ({ ...prev, targetBonus: parseFloat(e.target.value) || 0 }))}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={profile.description || ''}
                      onChange={(e) => setProfile(prev => ({ ...prev, description: e.target.value }))}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </TabsContent>

          {/* Permissions Tab */}
          <TabsContent value="permissions">
            <CardContent>
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium">Access Permissions</h3>
                    <p className="text-sm text-muted-foreground">Configure what this staff member can access and modify</p>
                  </div>
                  <Button variant="outline" disabled={!isEditing}>
                    <Shield className="h-4 w-4 mr-2" />
                    Reset to Default
                  </Button>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Module</TableHead>
                        <TableHead className="text-center">View</TableHead>
                        <TableHead className="text-center">Edit</TableHead>
                        <TableHead className="text-center">Create</TableHead>
                        <TableHead className="text-center">Delete</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(profile.extendedPermissions).map(([module, perms]) => (
                        <TableRow key={module}>
                          <TableCell className="font-medium capitalize">
                            {module.replace(/([A-Z])/g, ' $1').trim()}
                          </TableCell>
                          <TableCell className="text-center">
                            <Checkbox
                              checked={perms.view}
                              onCheckedChange={(checked) => handlePermissionChange(module, 'view', checked as boolean)}
                              disabled={!isEditing}
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Checkbox
                              checked={perms.edit}
                              onCheckedChange={(checked) => handlePermissionChange(module, 'edit', checked as boolean)}
                              disabled={!isEditing}
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Checkbox
                              checked={perms.create}
                              onCheckedChange={(checked) => handlePermissionChange(module, 'create', checked as boolean)}
                              disabled={!isEditing}
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Checkbox
                              checked={perms.delete}
                              onCheckedChange={(checked) => handlePermissionChange(module, 'delete', checked as boolean)}
                              disabled={!isEditing}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </TabsContent>

          {/* Leave Records Tab */}
          <TabsContent value="leaves">
            <CardContent>
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium">Leave Records</h3>
                    <p className="text-sm text-muted-foreground">View and manage leave applications</p>
                  </div>
                  <Button>
                    <Download className="h-4 w-4 mr-2" />
                    Export Leave Data
                  </Button>
                </div>

                {/* Filters */}
                <div className="flex gap-4 items-center">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search leave records..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={leaveFilter} onValueChange={setLeaveFilter}>
                    <SelectTrigger className="w-[180px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Leave Type</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Approved By</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLeaveRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                          <TableCell className="capitalize">{record.leaveType.replace('-', ' ')}</TableCell>
                          <TableCell>{record.reason}</TableCell>
                          <TableCell>
                            <Badge className={`${getStatusColor(record.status)} flex items-center gap-1 w-fit`}>
                              {getStatusIcon(record.status)}
                              {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>{record.approvedBy || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </TabsContent>

          {/* Timesheet Tab */}
          <TabsContent value="timesheet">
            <CardContent>
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium">Monthly Timesheet</h3>
                    <p className="text-sm text-muted-foreground">Track daily working hours and attendance</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline">
                      <Calendar className="h-4 w-4 mr-2" />
                      January 2025
                    </Button>
                    <Button>
                      <Download className="h-4 w-4 mr-2" />
                      Export Timesheet
                    </Button>
                  </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-5 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-2xl font-semibold text-primary">{profile.timesheetSummary.totalWorkingDays}</div>
                        <div className="text-sm text-muted-foreground">Working Days</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-2xl font-semibold text-red-600">{profile.timesheetSummary.totalLeavesTaken}</div>
                        <div className="text-sm text-muted-foreground">Leaves Taken</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-2xl font-semibold text-green-600">{profile.timesheetSummary.totalHolidays}</div>
                        <div className="text-sm text-muted-foreground">Holidays</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-2xl font-semibold text-blue-600">{profile.timesheetSummary.totalHoursWorked}</div>
                        <div className="text-sm text-muted-foreground">Hours Worked</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-2xl font-semibold text-orange-600">{profile.timesheetSummary.overtimeHours}</div>
                        <div className="text-sm text-muted-foreground">Overtime Hours</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Timesheet Table */}
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>In Time</TableHead>
                        <TableHead>Out Time</TableHead>
                        <TableHead>Hours Worked</TableHead>
                        <TableHead>Leave</TableHead>
                        <TableHead>Holiday</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {profile.timesheet.map((entry) => (
                        <TableRow key={entry.date}>
                          <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                          <TableCell>{entry.inTime || '-'}</TableCell>
                          <TableCell>{entry.outTime || '-'}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span>{entry.hoursWorked}</span>
                              {entry.overtime && (
                                <Badge className="bg-orange-100 text-orange-800 text-xs">
                                  +{entry.overtime}h OT
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {entry.isLeave ? (
                              <Badge className="bg-red-100 text-red-800">
                                {entry.leaveType || 'Leave'}
                              </Badge>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>
                            {entry.isHoliday ? (
                              <Badge className="bg-green-100 text-green-800">Holiday</Badge>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>{entry.notes || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  )
}