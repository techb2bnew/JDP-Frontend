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
  AlertTriangle,
  Upload,
  Eye
} from 'lucide-react'
import { LeaveRecord, TimesheetEntry, TimesheetSummary } from '../../types/profiles'

// Mock Labour Profile interface
interface LabourProfile {
  id: string
  fullName: string
  email: string
  phone: string
  dateOfBirth: string
  address: string
  city: string
  state: string
  zipCode: string
  department: string
  position: string
  dateOfJoining: string
  status: 'active' | 'inactive'
  supervisor: string
  leadLabour: string
  employeeId: string
  skillLevel: 'beginner' | 'intermediate' | 'advanced'
  hourlyRate: number
  documents: {
    idProof?: {
      fileName: string
      uploadDate: string
      fileUrl: string
    }
    drivingLicense?: {
      fileName: string
      uploadDate: string
      fileUrl: string
      licenseNumber: string
      expiryDate: string
    }
    certifications?: {
      fileName: string
      uploadDate: string
      fileUrl: string
      certificationType: string
      expiryDate?: string
    }[]
  }
  permissions: {
    viewJobDetails: boolean
    updateWorkStatus: boolean
    viewInventory: boolean
    submitTimesheet: boolean
    requestMaterials: boolean
    viewBluesheet: boolean
  }
  profilePicture?: string
  leaveRecords: LeaveRecord[]
  timesheet: TimesheetEntry[]
  timesheetSummary: TimesheetSummary
}

// Mock data for Labour
const mockLabourProfile: LabourProfile = {
  id: 'LAB-001',
  fullName: 'Mike Rodriguez',
  email: 'mike.rodriguez@jdpcorp.com',
  phone: '+1 (555) 456-7890',
  dateOfBirth: '1992-11-08',
  address: '789 Elm Street',
  city: 'Queens',
  state: 'NY',
  zipCode: '11004',
  department: 'Electrical',
  position: 'Electrician',
  dateOfJoining: '2023-06-01',
  status: 'active',
  supervisor: 'Sarah Johnson',
  leadLabour: 'David Wilson',
  employeeId: 'EMP-LAB-001',
  skillLevel: 'intermediate',
  hourlyRate: 28.50,
  documents: {
    idProof: {
      fileName: 'mike_id_proof.pdf',
      uploadDate: '2023-06-01',
      fileUrl: '/documents/mike_id.pdf'
    },
    drivingLicense: {
      fileName: 'mike_license.pdf',
      uploadDate: '2023-06-01',
      fileUrl: '/documents/mike_license.pdf',
      licenseNumber: 'DL987654321',
      expiryDate: '2028-11-08'
    },
    certifications: [
      {
        fileName: 'electrical_safety_cert.pdf',
        uploadDate: '2023-06-01',
        fileUrl: '/documents/mike_safety_cert.pdf',
        certificationType: 'Electrical Safety Certification',
        expiryDate: '2026-06-01'
      }
    ]
  },
  permissions: {
    viewJobDetails: true,
    updateWorkStatus: true,
    viewInventory: false,
    submitTimesheet: true,
    requestMaterials: true,
    viewBluesheet: true
  },
  profilePicture: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=center',
  leaveRecords: [
    {
      id: 'LV-LAB-001',
      date: '2025-01-18',
      leaveType: 'full-day',
      reason: 'Personal appointment',
      status: 'approved',
      approvedBy: 'David Wilson',
      appliedDate: '2025-01-15'
    },
    {
      id: 'LV-LAB-002',
      date: '2025-01-28',
      leaveType: 'half-day',
      reason: 'Medical appointment',
      status: 'pending',
      appliedDate: '2025-01-24'
    }
  ],
  timesheet: [
    { date: '2025-01-01', hoursWorked: 0, isLeave: false, isHoliday: true, notes: 'New Year Holiday' },
    { date: '2025-01-02', inTime: '08:00', outTime: '16:30', hoursWorked: 8, isLeave: false, isHoliday: false },
    { date: '2025-01-03', inTime: '08:15', outTime: '17:00', hoursWorked: 8, isLeave: false, isHoliday: false, overtime: 0.75 },
    { date: '2025-01-04', hoursWorked: 0, isLeave: true, isHoliday: false, leaveType: 'sick' },
    { date: '2025-01-05', inTime: '08:00', outTime: '16:30', hoursWorked: 8, isLeave: false, isHoliday: false }
  ],
  timesheetSummary: {
    totalWorkingDays: 21,
    totalLeavesTaken: 1,
    totalHolidays: 1,
    totalHoursWorked: 168,
    overtimeHours: 4
  }
}

export function LabourProfilePage() {
  const [activeTab, setActiveTab] = useState('personal')
  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState(mockLabourProfile)
  const [leaveFilter, setLeaveFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const handleSave = () => {
    setIsEditing(false)
    // Save logic here
  }

  const handlePermissionChange = (permission: string, value: boolean) => {
    setProfile(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permission]: value
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

  const getSkillLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-yellow-100 text-yellow-800'
      case 'intermediate': return 'bg-blue-100 text-blue-800'
      case 'advanced': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
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
            <p className="text-muted-foreground">{profile.position} • {profile.department}</p>
            <div className="flex gap-2 mt-1">
              <Badge className={profile.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                {profile.status.charAt(0).toUpperCase() + profile.status.slice(1)}
              </Badge>
              <Badge className={getSkillLevelColor(profile.skillLevel)}>
                {profile.skillLevel.charAt(0).toUpperCase() + profile.skillLevel.slice(1)}
              </Badge>
            </div>
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
            <TabsTrigger value="job">Job Details</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
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
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={profile.phone}
                      onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
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

          {/* Job Details Tab */}
          <TabsContent value="job">
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="position">Position</Label>
                    <Input
                      id="position"
                      value={profile.position}
                      onChange={(e) => setProfile(prev => ({ ...prev, position: e.target.value }))}
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
                    <Label htmlFor="employeeId">Employee ID</Label>
                    <Input
                      id="employeeId"
                      value={profile.employeeId}
                      onChange={(e) => setProfile(prev => ({ ...prev, employeeId: e.target.value }))}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="skillLevel">Skill Level</Label>
                    <Select value={profile.skillLevel} onValueChange={(value: 'beginner' | 'intermediate' | 'advanced') => setProfile(prev => ({ ...prev, skillLevel: value }))} disabled={!isEditing}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-4">
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
                    <Label htmlFor="leadLabour">Lead Labour</Label>
                    <Input
                      id="leadLabour"
                      value={profile.leadLabour}
                      onChange={(e) => setProfile(prev => ({ ...prev, leadLabour: e.target.value }))}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
                    <Input
                      id="hourlyRate"
                      type="number"
                      step="0.01"
                      value={profile.hourlyRate}
                      onChange={(e) => setProfile(prev => ({ ...prev, hourlyRate: parseFloat(e.target.value) || 0 }))}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents">
            <CardContent className="space-y-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Document Management</h3>
                  <div className="grid gap-4">
                    {/* ID Proof */}
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-medium">ID Proof</h4>
                            {profile.documents.idProof ? (
                              <p className="text-sm text-muted-foreground">
                                {profile.documents.idProof.fileName} • Uploaded {new Date(profile.documents.idProof.uploadDate).toLocaleDateString()}
                              </p>
                            ) : (
                              <p className="text-sm text-muted-foreground">No document uploaded</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {profile.documents.idProof && (
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </Button>
                            )}
                            <Button variant="outline" size="sm" disabled={!isEditing}>
                              <Download className="h-4 w-4 mr-2" />
                              Upload
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Driving License */}
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-medium">Driving License</h4>
                            {profile.documents.drivingLicense ? (
                              <div>
                                <p className="text-sm text-muted-foreground">
                                  {profile.documents.drivingLicense.fileName} • Uploaded {new Date(profile.documents.drivingLicense.uploadDate).toLocaleDateString()}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  License: {profile.documents.drivingLicense.licenseNumber} • Expires: {new Date(profile.documents.drivingLicense.expiryDate).toLocaleDateString()}
                                </p>
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">No document uploaded</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {profile.documents.drivingLicense && (
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </Button>
                            )}
                            <Button variant="outline" size="sm" disabled={!isEditing}>
                              <Download className="h-4 w-4 mr-2" />
                              Upload
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Certifications */}
                    <div>
                      <h4 className="font-medium mb-2">Certifications</h4>
                      {profile.documents.certifications && profile.documents.certifications.length > 0 ? (
                        profile.documents.certifications.map((cert, index) => (
                          <Card key={index}>
                            <CardContent className="p-4">
                              <div className="flex justify-between items-center">
                                <div>
                                  <h5 className="font-medium">{cert.certificationType}</h5>
                                  <p className="text-sm text-muted-foreground">
                                    {cert.fileName} • Uploaded {new Date(cert.uploadDate).toLocaleDateString()}
                                    {cert.expiryDate && ` • Expires: ${new Date(cert.expiryDate).toLocaleDateString()}`}
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  <Button variant="outline" size="sm">
                                    <Eye className="h-4 w-4 mr-2" />
                                    View
                                  </Button>
                                  <Button variant="outline" size="sm" disabled={!isEditing}>
                                    <Download className="h-4 w-4 mr-2" />
                                    Replace
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-center">
                              <p className="text-sm text-muted-foreground">No certifications uploaded</p>
                              <Button variant="outline" size="sm" disabled={!isEditing}>
                                <Download className="h-4 w-4 mr-2" />
                                Add Certification
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
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
                    <h3 className="text-lg font-medium">Labour Permissions</h3>
                    <p className="text-sm text-muted-foreground">Configure access permissions for this labor</p>
                  </div>
                </div>

                <div className="grid gap-4">
                  {Object.entries(profile.permissions).map(([permission, value]) => (
                    <Card key={permission}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-medium capitalize">
                              {permission.replace(/([A-Z])/g, ' $1').trim()}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {getLabourPermissionDescription(permission)}
                            </p>
                          </div>
                          <Checkbox
                            checked={value}
                            onCheckedChange={(checked) => handlePermissionChange(permission, checked as boolean)}
                            disabled={!isEditing}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </TabsContent>

          {/* Leave Records Tab - Same structure as other profiles */}
          <TabsContent value="leaves">
            <CardContent>
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium">Leave Records</h3>
                    <p className="text-sm text-muted-foreground">View and manage leave applications</p>
                  </div>
                  <Button>
                    <Upload className="h-4 w-4 mr-2" />
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

          {/* Timesheet Tab - Same structure as other profiles */}
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
                      <Upload className="h-4 w-4 mr-2" />
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

function getLabourPermissionDescription(permission: string): string {
  const descriptions: Record<string, string> = {
    viewJobDetails: 'View detailed job information and requirements',
    updateWorkStatus: 'Update work progress and status',
    viewInventory: 'View inventory items and availability',
    submitTimesheet: 'Submit daily timesheet entries',
    requestMaterials: 'Request materials for ongoing jobs',
    viewBluesheet: 'View bluesheet documents and specifications'
  }
  return descriptions[permission] || 'Permission description not available'
}