import { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { toast } from 'sonner'
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
  FileText
} from 'lucide-react'

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
}

interface StaffDetailsPageProps {
  staffId: string
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
      notes: 'Experienced electrical engineer with expertise in high voltage systems and safety protocols.'
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

export function StaffDetailsPage({ staffId, onBack }: StaffDetailsPageProps) {
  const [staff, setStaff] = useState<Staff | null>(getStaffById(staffId))
  console.log(staff, 'staff>>>');
  
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Staff List
          </Button>
        </div>
        <Button onClick={handleEdit} className="gap-2 bg-primary text-white hover:bg-[#0090e6]">
          <Edit className="h-4 w-4" />
          Edit Staff
        </Button>
      </div>

      {/* Staff Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information Card */}
          <Card className="bg-white shadow-md border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-[#00A1FF]" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-[#00A1FF] rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-xl">
                    {staff.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-medium text-[#2b2b2b]">{staff.name}</h2>
                  <p className="text-sm text-gray-600">{staff.employeeId}</p>
                  <div className="mt-2">
                    {getStatusBadge(staff.status)}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Email Address</p>
                      <p className="text-sm font-medium text-[#2b2b2b]">{staff.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Phone Number</p>
                      <p className="text-sm font-medium text-[#2b2b2b]">{staff.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Emergency Contact</p>
                      <p className="text-sm font-medium text-[#2b2b2b]">{staff.emergencyContact || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Address</p>
                      <p className="text-sm font-medium text-[#2b2b2b]">{staff.address}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Job Information Card */}
          <Card className="bg-white shadow-md border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Briefcase className="h-5 w-5 text-[#00A1FF]" />
                Job Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Department</p>
                      <p className="text-sm font-medium text-[#2b2b2b]">{staff.department}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Briefcase className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Position</p>
                      <p className="text-sm font-medium text-[#2b2b2b]">{staff.position}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Manager</p>
                      <p className="text-sm font-medium text-[#2b2b2b]">{staff.manager || 'Not assigned'}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Date of Joining</p>
                      <p className="text-sm font-medium text-[#2b2b2b]">{formatDate(staff.dateOfJoining)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Work Schedule</p>
                      <p className="text-sm font-medium text-[#2b2b2b]">{staff.workSchedule || 'Not specified'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="text-sm text-gray-600">Salary</p>
                      <p className="text-sm font-medium text-[#2b2b2b]">{formatSalary(staff.salary)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Notes */}
          {staff.notes && (
            <Card className="bg-white shadow-md border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-[#00A1FF]" />
                  Additional Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[#2b2b2b] leading-relaxed">{staff.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Summary Card */}
        <div className="space-y-6">
          <Card className="bg-white shadow-md border-0">
            <CardHeader>
              <CardTitle className="text-lg">Quick Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Staff ID</p>
                <p className="text-sm font-medium text-[#2b2b2b]">#{staff.id}</p>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-gray-600">Employee ID</p>
                <p className="text-sm font-medium text-[#2b2b2b]">{staff.employeeId}</p>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-gray-600">Status</p>
                <div className="mt-1">
                  {getStatusBadge(staff.status)}
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-gray-600">Department</p>
                <p className="text-sm font-medium text-[#2b2b2b]">{staff.department}</p>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-gray-600">Position</p>
                <p className="text-sm font-medium text-[#2b2b2b]">{staff.position}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
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
      </Dialog>
    </div>
  )
}