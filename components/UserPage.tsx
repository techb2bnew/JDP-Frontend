import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Badge } from './ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Textarea } from './ui/textarea'
import { Checkbox } from './ui/checkbox'
import { ActionButtonsPopup } from './ActionButtonsPopup'
import { toast } from 'sonner'
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye,
  Upload,
  Download,
  User,
  Shield,
  Calendar,
  MapPin,
  Key
} from 'lucide-react'

interface SystemUser {
  id: string
  userId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  role: string
  department: string
  status: 'active' | 'inactive' | 'suspended' | 'pending'
  lastLogin: string
  dateCreated: string
  permissions: string[]
  notes?: string
}

interface UserFormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  role: string
  department: string
  status: 'active' | 'inactive' | 'suspended' | 'pending'
  permissions: string[]
  notes: string
}

const initialUserData: SystemUser[] = [
  {
    id: 'USR001',
    userId: 'USR-2025-001',
    firstName: 'John',
    lastName: 'Smith',
    email: 'john@gmail.com',
    phone: '+61 2222 021 203',
    address: '47 W 13th St, New York, NY 10011, USA',
    role: 'Administrator',
    department: 'IT',
    status: 'active',
    lastLogin: '2025-01-22 14:30',
    dateCreated: '2024-01-15',
    permissions: ['user_management', 'system_settings', 'reports', 'data_export'],
    notes: 'System administrator with full access rights.'
  },
  {
    id: 'USR002',
    userId: 'USR-2025-002',
    firstName: 'David',
    lastName: 'Smith',
    email: 'david@gmail.com',
    phone: '+61 2222 021 203',
    address: '312 NSW 2042, Australia',
    role: 'Manager',
    department: 'Operations',
    status: 'active',
    lastLogin: '2025-01-22 09:15',
    dateCreated: '2024-02-20',
    permissions: ['staff_management', 'reports', 'job_management'],
    notes: 'Operations manager responsible for day-to-day activities.'
  },
  {
    id: 'USR003',
    userId: 'USR-2025-003',
    firstName: 'Olivia',
    lastName: 'Johnson',
    email: 'olivia@gmail.com',
    phone: '+61 2222 021 203',
    address: '312 NSW 2042, Australia',
    role: 'Employee',
    department: 'HR',
    status: 'active',
    lastLogin: '2025-01-21 16:45',
    dateCreated: '2024-03-10',
    permissions: ['staff_view', 'basic_reports'],
    notes: 'HR representative with limited system access.'
  }
]

const roles = [
  'Administrator',
  'Manager',
  'Supervisor',
  'Employee',
  'Contractor',
  'Viewer'
]

const departments = [
  'IT',
  'Operations',
  'HR',
  'Finance',
  'Engineering',
  'Sales',
  'Marketing',
  'Support'
]

const availablePermissions = [
  'user_management',
  'staff_management',
  'system_settings',
  'reports',
  'data_export',
  'job_management',
  'financial_access',
  'staff_view',
  'basic_reports',
  'invoice_management',
  'supplier_management'
]

interface UserPageProps {
  onViewDetails?: (id: string) => void
}

export function UserPage({ onViewDetails }: UserPageProps) {
  const [users, setUsers] = useState<SystemUser[]>(initialUserData)
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null)
  const [filterRole, setFilterRole] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const [formData, setFormData] = useState<UserFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    role: '',
    department: '',
    status: 'pending',
    permissions: [],
    notes: ''
  })

  const generateUserId = () => {
    const year = new Date().getFullYear()
    const count = users.length + 1
    return `USR-${year}-${String(count).padStart(3, '0')}`
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
          <Badge className="bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-50">
            Inactive
          </Badge>
        )
      case 'suspended':
        return (
          <Badge className="bg-red-50 text-red-600 border-red-200 hover:bg-red-50">
            Suspended
          </Badge>
        )
      case 'pending':
        return (
          <Badge className="bg-yellow-50 text-yellow-600 border-yellow-200 hover:bg-yellow-50">
            Pending
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

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'Administrator':
        return <Badge className="bg-purple-50 text-purple-600 border-purple-200">Admin</Badge>
      case 'Manager':
        return <Badge className="bg-blue-50 text-blue-600 border-blue-200">Manager</Badge>
      case 'Supervisor':
        return <Badge className="bg-indigo-50 text-indigo-600 border-indigo-200">Supervisor</Badge>
      case 'Employee':
        return <Badge className="bg-green-50 text-green-600 border-green-200">Employee</Badge>
      case 'Contractor':
        return <Badge className="bg-orange-50 text-orange-600 border-orange-200">Contractor</Badge>
      case 'Viewer':
        return <Badge className="bg-gray-50 text-gray-600 border-gray-200">Viewer</Badge>
      default:
        return <Badge className="bg-gray-50 text-gray-600 border-gray-200">{role}</Badge>
    }
  }

  const filteredUsers = users.filter(user => {
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase()
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.phone.includes(searchTerm) ||
                         user.userId.includes(searchTerm)
    
    const matchesRole = filterRole === 'all' || user.role === filterRole
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus
    
    return matchesSearch && matchesRole && matchesStatus
  })

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)

  const handleCreate = () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.role) {
      toast.error('Please fill in all required fields')
      return
    }

    const newUser: SystemUser = {
      id: `USR${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
      userId: generateUserId(),
      lastLogin: 'Never',
      dateCreated: new Date().toISOString().split('T')[0],
      ...formData
    }

    setUsers([...users, newUser])
    resetForm()
    setIsCreateDialogOpen(false)
    toast.success('User created successfully')
  }

  const handleEdit = (user: SystemUser) => {
    setEditingUser(user)
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      address: user.address,
      role: user.role,
      department: user.department,
      status: user.status,
      permissions: user.permissions,
      notes: user.notes || ''
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdate = () => {
    if (!editingUser) return

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.role) {
      toast.error('Please fill in all required fields')
      return
    }

    setUsers(users.map(user => 
      user.id === editingUser.id 
        ? { ...user, ...formData }
        : user
    ))
    
    setIsEditDialogOpen(false)
    setEditingUser(null)
    resetForm()
    toast.success('User updated successfully')
  }

  const handleDelete = (id: string) => {
    setUsers(users.filter(user => user.id !== id))
    toast.success('User deleted successfully')
  }

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      role: '',
      department: '',
      status: 'pending',
      permissions: [],
      notes: ''
    })
  }

  const handlePermissionChange = (permission: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        permissions: [...prev.permissions, permission]
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        permissions: prev.permissions.filter(p => p !== permission)
      }))
    }
  }

  const formatPermissionName = (permission: string) => {
    return permission.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const renderForm = () => (
    <div className="grid grid-cols-2 gap-4 py-4 max-h-96 overflow-y-auto">
      <div className="space-y-2">
        <Label htmlFor="firstName">First Name *</Label>
        <Input
          id="firstName"
          value={formData.firstName}
          onChange={(e) => setFormData({...formData, firstName: e.target.value})}
          placeholder="Enter first name"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="lastName">Last Name *</Label>
        <Input
          id="lastName"
          value={formData.lastName}
          onChange={(e) => setFormData({...formData, lastName: e.target.value})}
          placeholder="Enter last name"
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
        <Label htmlFor="userId">User ID (Auto generated)</Label>
        <Input
          id="userId"
          value={generateUserId()}
          disabled
          className="bg-gray-100"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          value={formData.phone}
          onChange={(e) => setFormData({...formData, phone: e.target.value})}
          placeholder="Enter phone number"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="role">Role *</Label>
        <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
          <SelectTrigger>
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            {roles.map((role) => (
              <SelectItem key={role} value={role}>{role}</SelectItem>
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
        <Label htmlFor="status">Status</Label>
        <Select value={formData.status} onValueChange={(value: 'active' | 'inactive' | 'suspended' | 'pending') => setFormData({...formData, status: value})}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
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
      
      <div className="col-span-2 space-y-2">
        <Label>Permissions</Label>
        <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded p-2">
          {availablePermissions.map((permission) => (
            <div key={permission} className="flex items-center space-x-2">
              <Checkbox
                id={`permission-${permission}`}
                checked={formData.permissions.includes(permission)}
                onCheckedChange={(checked) => handlePermissionChange(permission, checked as boolean)}
              />
              <Label htmlFor={`permission-${permission}`} className="text-sm">
                {formatPermissionName(permission)}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="col-span-2 space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({...formData, notes: e.target.value})}
          placeholder="Additional notes..."
          rows={3}
        />
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-medium text-[#2b2b2b]">User Management</h2>
          <p className="text-sm text-[#2b2b2b]/60 mt-1">Manage system users and their access permissions.</p>
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
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
              </DialogHeader>
              {renderForm()}
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={() => {setIsCreateDialogOpen(false); resetForm();}}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} className="bg-[#00A1FF] hover:bg-[#0090e6]">
                  Create User
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white shadow-sm border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <User className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Users</p>
                <p className="text-2xl font-medium text-[#2b2b2b]">
                  {users.filter(u => u.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow-sm border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Administrators</p>
                <p className="text-2xl font-medium text-[#2b2b2b]">
                  {users.filter(u => u.role === 'Administrator').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow-sm border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Key className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-medium text-[#2b2b2b]">
                  {users.filter(u => u.status === 'pending').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow-sm border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#E6F6FF] rounded-lg">
                <Calendar className="h-6 w-6 text-[#00A1FF]" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-medium text-[#2b2b2b]">
                  {users.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="bg-white shadow-sm border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="Filter by Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {roles.map((role) => (
                    <SelectItem key={role} value={role}>{role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Total: {filteredUsers.length}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Table */}
      <Card className="bg-white shadow-sm border-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#162f3d] hover:bg-[#162f3d]">
                <TableHead className="text-white font-medium">
                  <input type="checkbox" className="rounded border-white/30" />
                </TableHead>
                <TableHead className="text-white font-medium">Name</TableHead>
                <TableHead className="text-white font-medium">Email</TableHead>
                <TableHead className="text-white font-medium">Phone</TableHead>
                <TableHead className="text-white font-medium">Role</TableHead>
                <TableHead className="text-white font-medium">Department</TableHead>
                <TableHead className="text-white font-medium">Status</TableHead>
                <TableHead className="text-white font-medium">Last Login</TableHead>
                <TableHead className="text-white font-medium">Created On</TableHead>
                <TableHead className="text-white font-medium">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedUsers.map((user, index) => (
                <TableRow key={user.id} className={index % 2 === 1 ? "bg-[#eff4fa]" : ""}>
                  <TableCell>
                    <input type="checkbox" className="rounded border-gray-300" />
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="text-sm font-medium text-[#2b2b2b]/80">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-xs text-gray-500">#{user.userId}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-[#2b2b2b]/80">{user.email}</TableCell>
                  <TableCell className="text-sm text-[#2b2b2b]/80">{user.phone}</TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell className="text-sm text-[#2b2b2b]/80">{user.department}</TableCell>
                  <TableCell>{getStatusBadge(user.status)}</TableCell>
                  <TableCell className="text-sm text-[#2b2b2b]/80">{user.lastLogin}</TableCell>
                  <TableCell className="text-sm text-gray-900">{user.dateCreated}</TableCell>
                  <TableCell>
                    <ActionButtonsPopup
                      onView={onViewDetails ? () => onViewDetails(user.id) : undefined}
                      onEdit={() => handleEdit(user)}
                      onDelete={() => handleDelete(user.id)}
                      itemName={`${user.firstName} ${user.lastName}`}
                      itemType="User"
                      showView={!!onViewDetails}
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
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          {renderForm()}
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => {setIsEditDialogOpen(false); resetForm();}}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} className="bg-[#00A1FF] hover:bg-[#0090e6]">
              Update User
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}