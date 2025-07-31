import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Badge } from './ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { ActionButtonsPopup } from './ActionButtonsPopup'
import { StaffDetailsPage } from './StaffDetailsPage'
import { toast } from 'sonner'
import { 
  Plus, 
  Search, 
  Upload,
  Download
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
}

interface StaffFormData {
  name: string
  email: string
  phone: string
  address: string
  position: string
  department: string
  dateOfJoining: string
  status: 'active' | 'inactive' | 'on-leave'
}

const initialStaffData: Staff[] = [
  {
    id: '1111',
    name: 'John Smith',
    email: 'john@gmail.com',
    phone: '+61 2222 021 203',
    address: '47 W 13th St, New York, NY 10011, USA',
    position: 'Electrical Engineer',
    department: 'Engineering',
    dateOfJoining: '27-4-2025',
    status: 'active'
  },
  {
    id: '2122',
    name: 'David Smith',
    email: 'david@gmail.com',
    phone: '+61 2222 021 203',
    address: '47 W 13th St, New York, NY 10011, USA',
    position: 'Senior Technician',
    department: 'Operations',
    dateOfJoining: '07-4-2025',
    status: 'active'
  },
  {
    id: '0203',
    name: 'Olivia',
    email: 'olivia@gmail.com',
    phone: '+61 2222 021 203',
    address: '47 W 13th St, New York, NY 10011, USA',
    position: 'Project Manager',
    department: 'Management',
    dateOfJoining: '15-4-2025',
    status: 'on-leave'
  },
  {
    id: '0791',
    name: 'Alen',
    email: 'alen@gmail.com',
    phone: '+61 2222 021 203',
    address: '47 W 13th St, New York, NY 10011, USA',
    position: 'Technician',
    department: 'Operations',
    dateOfJoining: '19-4-2025',
    status: 'inactive'
  }
]

const departments = ['Engineering', 'Operations', 'Management', 'Sales', 'HR', 'Finance']
const positions = ['Electrical Engineer', 'Senior Technician', 'Technician', 'Project Manager', 'Sales Executive', 'HR Manager']

interface StaffPageProps {
  onViewDetails?: (id: string) => void
}

export function StaffPage({ onViewDetails }: StaffPageProps) {
  const [staff, setStaff] = useState<Staff[]>(initialStaffData)
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null)
  const [filterDepartment, setFilterDepartment] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const itemsPerPage = 10

  const [formData, setFormData] = useState<StaffFormData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    position: '',
    department: '',
    dateOfJoining: '',
    status: 'active'
  })

  const handleViewDetails = (id: string) => { 
    setSelectedStaffId(id)
    setShowDetails(true)
  } 

  const handleBackToList = () => {
    setSelectedStaffId(null)
    setShowDetails(false)
  }

  // If showing details, render the details page
  if (showDetails && selectedStaffId) {
    return (
      <StaffDetailsPage 
        staffId={selectedStaffId} 
        onBack={handleBackToList}
      />
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-green-50 text-green-600 border-green-200 hover:bg-green-50">
            Active
          </Badge>
        )
      case 'inactive':
        return (
          <Badge className="bg-red-50 text-red-600 border-red-200 hover:bg-red-50">
            Inactive
          </Badge>
        )
      case 'on-leave':
        return (
          <Badge className="bg-yellow-50 text-yellow-600 border-yellow-200 hover:bg-yellow-50">
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

  const filteredStaff = staff.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.phone.includes(searchTerm) ||
                         member.id.includes(searchTerm)
    
    const matchesDepartment = filterDepartment === 'all' || member.department === filterDepartment
    const matchesStatus = filterStatus === 'all' || member.status === filterStatus
    
    return matchesSearch && matchesDepartment && matchesStatus
  })

  const paginatedStaff = filteredStaff.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalPages = Math.ceil(filteredStaff.length / itemsPerPage)

  const handleCreate = () => {
    if (!formData.name || !formData.email || !formData.phone) {
      toast.error('Please fill in all required fields')
      return
    }

    const newStaff: Staff = {
      id: Math.random().toString(36).substr(2, 9),
      ...formData
    }

    setStaff([...staff, newStaff])
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      position: '',
      department: '',
      dateOfJoining: '',
      status: 'active'
    })
    setIsCreateDialogOpen(false)
    toast.success('Staff member created successfully')
  }

  const handleEdit = (staffMember: Staff) => {
    setEditingStaff(staffMember)
    setFormData({
      name: staffMember.name,
      email: staffMember.email,
      phone: staffMember.phone,
      address: staffMember.address,
      position: staffMember.position,
      department: staffMember.department,
      dateOfJoining: staffMember.dateOfJoining,
      status: staffMember.status
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdate = () => {
    if (!editingStaff) return

    if (!formData.name || !formData.email || !formData.phone) {
      toast.error('Please fill in all required fields')
      return
    }

    setStaff(staff.map(member => 
      member.id === editingStaff.id 
        ? { ...member, ...formData }
        : member
    ))
    
    setIsEditDialogOpen(false)
    setEditingStaff(null)
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      position: '',
      department: '',
      dateOfJoining: '',
      status: 'active'
    })
    toast.success('Staff member updated successfully')
  }

  const handleDelete = (id: string) => {
    setStaff(staff.filter(member => member.id !== id))
    toast.success('Staff member deleted successfully')
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      position: '',
      department: '',
      dateOfJoining: '',
      status: 'active'
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-[#2b2b2b]">Staff Management</h1>
          <p className="text-sm text-[#2b2b2b]/60 mt-1">Manage your staff members and their information.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Upload className="h-4 w-4" />
            Import
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#00A1FF] hover:bg-[#0090e6] gap-2">
                <Plus className="h-4 w-4" />
                Add Staff
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-white">
              <DialogHeader>
                <DialogTitle>Add New Staff Member</DialogTitle>
                <DialogDescription>
                  Fill in the information below to add a new staff member to your organization.
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Enter full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="Enter email address"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Select value={formData.position} onValueChange={(value) => setFormData({...formData, position: value})}>
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
                  <Select value={formData.department} onValueChange={(value) => setFormData({...formData, department: value})}>
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
                  <Label htmlFor="dateOfJoining">Date of Joining</Label>
                  <Input
                    id="dateOfJoining"
                    type="date"
                    value={formData.dateOfJoining}
                    onChange={(e) => setFormData({...formData, dateOfJoining: e.target.value})}
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    placeholder="Enter full address"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: 'active' | 'inactive' | 'on-leave') => setFormData({...formData, status: value})}>
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
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => {setIsCreateDialogOpen(false); resetForm();}}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} className="bg-[#00A1FF] hover:bg-[#0090e6]">
                  Create Staff
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="bg-white shadow-sm border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search staff..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by Department" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="on-leave">On Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Total: {filteredStaff.length}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Staff Table */}
      <Card className="bg-white shadow-sm border-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#162f3d] hover:bg-[#162f3d]">
                <TableHead className="text-white font-medium">
                  <input type="checkbox" className="rounded border-white/30" />
                </TableHead>
                <TableHead className="text-white font-medium">ID</TableHead>
                <TableHead className="text-white font-medium">Name</TableHead>
                <TableHead className="text-white font-medium">Phone</TableHead>
                <TableHead className="text-white font-medium">Email</TableHead>
                <TableHead className="text-white font-medium">Address</TableHead>
                <TableHead className="text-white font-medium">Position</TableHead>
                <TableHead className="text-white font-medium">Department</TableHead>
                <TableHead className="text-white font-medium">Date of Joining</TableHead>
                <TableHead className="text-white font-medium">Status</TableHead>
                <TableHead className="text-white font-medium">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedStaff.map((member, index) => (
                <TableRow key={member.id} className={index % 2 === 1 ? "bg-[#eff4fa]" : ""}>
                  <TableCell>
                    <input type="checkbox" className="rounded border-gray-300" />
                  </TableCell>
                  <TableCell className="text-sm text-[#2b2b2b]/80">#{member.id}</TableCell>
                  <TableCell className="text-sm text-[#2b2b2b]/80 font-medium">{member.name}</TableCell>
                  <TableCell className="text-sm text-[#2b2b2b]/80">{member.phone}</TableCell>
                  <TableCell className="text-sm text-gray-900">{member.email}</TableCell>
                  <TableCell className="text-sm text-gray-900 max-w-xs truncate">{member.address}</TableCell>
                  <TableCell className="text-sm text-[#2b2b2b]/80">{member.position}</TableCell>
                  <TableCell className="text-sm text-[#2b2b2b]/80">{member.department}</TableCell>
                  <TableCell className="text-sm text-gray-900">{member.dateOfJoining}</TableCell>
                  <TableCell>{getStatusBadge(member.status)}</TableCell>
                  <TableCell>
                    <ActionButtonsPopup
                      onView={() => handleViewDetails(member.id)}
                      onEdit={() => handleEdit(member)}
                      onDelete={() => handleDelete(member.id)}
                      itemName={member.name}
                      itemType="Staff Member"
                      showView={true}
                      showEdit={true}
                      showDelete={true}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              onClick={() => setCurrentPage(page)}
              className={currentPage === page ? "bg-[#00A1FF] hover:bg-[#0090e6]" : ""}
            >
              {page}
            </Button>
          ))}
          
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
            <DialogDescription>
              Update the information below to modify the staff member's details.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Enter full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="Enter email address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone Number *</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="Enter phone number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-position">Position</Label>
              <Select value={formData.position} onValueChange={(value) => setFormData({...formData, position: value})}>
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
              <Label htmlFor="edit-department">Department</Label>
              <Select value={formData.department} onValueChange={(value) => setFormData({...formData, department: value})}>
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
              <Label htmlFor="edit-dateOfJoining">Date of Joining</Label>
              <Input
                id="edit-dateOfJoining"
                type="date"
                value={formData.dateOfJoining}
                onChange={(e) => setFormData({...formData, dateOfJoining: e.target.value})}
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="edit-address">Address</Label>
              <Input
                id="edit-address"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                placeholder="Enter full address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select value={formData.status} onValueChange={(value: 'active' | 'inactive' | 'on-leave') => setFormData({...formData, status: value})}>
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
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => {setIsEditDialogOpen(false); resetForm();}}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} className="bg-[#00A1FF] hover:bg-[#0090e6]">
              Update Staff
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}