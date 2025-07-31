import { useState } from 'react'
import { Card, CardContent } from './ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Badge } from './ui/badge'
import { ActionButtonsPopup } from './ActionButtonsPopup'
import { toast } from 'sonner'

interface User {
  id: string
  name: string
  email: string
  phone: string
  role: string
  department: string
  status: 'Active' | 'Inactive' | 'Pending'
  lastLogin: string
  createdOn: string
}

const sampleUsers: User[] = [
  {
    id: 'USR-2024-001',
    name: 'John Smith',
    email: 'john@gmail.com',
    phone: '+61 2222 021 203',
    role: 'Admin',
    department: 'IT',
    status: 'Active',
    lastLogin: '2025-01-22 14:30',
    createdOn: '2024-01-15'
  },
  {
    id: 'USR-2024-002',
    name: 'Sarah Johnson',
    email: 'sarah@company.com',
    phone: '+61 2222 021 204',
    role: 'Manager',
    department: 'Sales',
    status: 'Active',
    lastLogin: '2025-01-21 16:45',
    createdOn: '2024-02-10'
  },
  {
    id: 'USR-2024-003',
    name: 'Mike Wilson',
    email: 'mike@company.com',
    phone: '+61 2222 021 205',
    role: 'Employee',
    department: 'Engineering',
    status: 'Inactive',
    lastLogin: '2025-01-18 10:20',
    createdOn: '2024-03-05'
  },
  {
    id: 'USR-2024-004',
    name: 'Emma Davis',
    email: 'emma@company.com',
    phone: '+61 2222 021 206',
    role: 'Employee',
    department: 'Marketing',
    status: 'Pending',
    lastLogin: 'Never',
    createdOn: '2024-04-12'
  }
]

export function ActionButtonsDemo() {
  const [users, setUsers] = useState<User[]>(sampleUsers)

  const handleView = (user: User) => {
    toast.success(`Viewing details for ${user.name}`)
    console.log('View user:', user)
  }

  const handleEdit = (user: User) => {
    toast.success(`Editing ${user.name}`)
    console.log('Edit user:', user)
  }

  const handleDelete = (userId: string) => {
    setUsers(users.filter(user => user.id !== userId))
    console.log('Delete user:', userId)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return (
          <Badge className="bg-green-50 text-green-600 border-green-200 hover:bg-green-50">
            Active
          </Badge>
        )
      case 'Inactive':
        return (
          <Badge className="bg-red-50 text-red-600 border-red-200 hover:bg-red-50">
            Inactive
          </Badge>
        )
      case 'Pending':
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
      case 'Admin':
        return (
          <Badge className="bg-[#E6F6FF] text-[#00A1FF] border-[#00A1FF]/20 hover:bg-[#E6F6FF]">
            Admin
          </Badge>
        )
      case 'Manager':
        return (
          <Badge className="bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-50">
            Manager
          </Badge>
        )
      case 'Employee':
        return (
          <Badge className="bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-50">
            Employee
          </Badge>
        )
      default:
        return (
          <Badge className="bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-50">
            {role}
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-[#2b2b2b]">Action Buttons Demo</h1>
        <p className="text-sm text-[#2b2b2b]/60 mt-1">
          Demonstration of action buttons popup functionality
        </p>
      </div>

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
              {users.map((user, index) => (
                <TableRow 
                  key={user.id} 
                  className={index % 2 === 1 ? "bg-[#eff4fa]" : ""}
                >
                  <TableCell>
                    <input type="checkbox" className="rounded border-gray-300" />
                  </TableCell>
                  <TableCell className="text-sm text-[#2b2b2b]/80 font-medium">
                    <div>
                      <div>{user.name}</div>
                      <div className="text-xs text-gray-500">{user.id}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-[#2b2b2b]/80">{user.email}</TableCell>
                  <TableCell className="text-sm text-[#2b2b2b]/80">{user.phone}</TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell className="text-sm text-[#2b2b2b]/80">{user.department}</TableCell>
                  <TableCell>{getStatusBadge(user.status)}</TableCell>
                  <TableCell className="text-sm text-[#2b2b2b]/80">{user.lastLogin}</TableCell>
                  <TableCell className="text-sm text-[#2b2b2b]/80">{user.createdOn}</TableCell>
                  <TableCell>
                    <ActionButtonsPopup
                      onView={() => handleView(user)}
                      onEdit={() => handleEdit(user)}
                      onDelete={() => handleDelete(user.id)}
                      itemName={user.name}
                      itemType="User"
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

      {users.length === 0 && (
        <Card className="bg-white shadow-sm border-0">
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">No users found. All users have been deleted.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}