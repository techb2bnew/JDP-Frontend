'use client'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Badge } from './ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { 
  Search, 
  UserPlus,
  Mail,
  Phone,
  MapPin
} from 'lucide-react'

const customers = [
  {
    id: 'CUST-001',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1 (555) 123-4567',
    location: 'New York, NY',
    orders: 12,
    totalSpent: 1299.99,
    joinDate: '2023-06-15',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face'
  },
  {
    id: 'CUST-002',
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '+1 (555) 234-5678',
    location: 'Los Angeles, CA',
    orders: 8,
    totalSpent: 599.50,
    joinDate: '2023-08-22',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face'
  },
  {
    id: 'CUST-003',
    name: 'Bob Johnson',
    email: 'bob@example.com',
    phone: '+1 (555) 345-6789',
    location: 'Chicago, IL',
    orders: 15,
    totalSpent: 2199.99,
    joinDate: '2023-03-10',
    status: 'vip',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face'
  },
  {
    id: 'CUST-004',
    name: 'Alice Brown',
    email: 'alice@example.com',
    phone: '+1 (555) 456-7890',
    location: 'Miami, FL',
    orders: 4,
    totalSpent: 299.99,
    joinDate: '2024-01-05',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face'
  },
  {
    id: 'CUST-005',
    name: 'Charlie Davis',
    email: 'charlie@example.com',
    phone: '+1 (555) 567-8901',
    location: 'Seattle, WA',
    orders: 0,
    totalSpent: 0,
    joinDate: '2024-12-01',
    status: 'inactive',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&crop=face'
  },
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-800'
    case 'vip': return 'bg-purple-100 text-purple-800'
    case 'inactive': return 'bg-gray-100 text-gray-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase()
}

export function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1>Customers</h1>
          <p className="text-muted-foreground">Manage your customer relationships and data.</p>
        </div>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {customers.filter(c => c.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">VIP Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {customers.filter(c => c.status === 'vip').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(customers.reduce((sum, c) => sum + c.totalSpent, 0) / customers.filter(c => c.orders > 0).length || 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Customer List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Total Spent</TableHead>
                <TableHead>Join Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={customer.avatar} alt={customer.name} />
                        <AvatarFallback>{getInitials(customer.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{customer.name}</p>
                        <p className="text-sm text-muted-foreground">{customer.id}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-3 w-3" />
                        {customer.email}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {customer.phone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-3 w-3" />
                      {customer.location}
                    </div>
                  </TableCell>
                  <TableCell>{customer.orders}</TableCell>
                  <TableCell className="font-medium">${customer.totalSpent}</TableCell>
                  <TableCell>{customer.joinDate}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(customer.status)}>
                      {customer.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}