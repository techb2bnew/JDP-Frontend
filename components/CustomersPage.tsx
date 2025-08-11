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
  MapPin,
  Briefcase,
  CalendarDays,
  Eye,
  Download,
  Trash2,
  Edit,
  Users,
  UserCheck,
  UserRoundX,
  ArrowUpAZ
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'

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
    company: 'abc',
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
    company: 'abc',
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
    company: 'abc',
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
    company: 'abc',
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
    company: 'abc',
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
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [customerFormData, setCustomerFormData] = useState({
    name: '',
    email: '',
    phone: '',
    contactPerson: '',
    address: '',
    company: ''
  })
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-medium text-[#2b2b2b]">Customer Management</h1>
          <p className="text-muted-foreground">Manage and track all customer relationships and service history</p>
        </div>
        <div className='flex gap-2'>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Customers
          </Button>
          <Button className='text-white' onClick={() => setShowAddCustomerModal(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className='bg-blue-100 border border-blue-300'>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              <div className="flex gap-2 items-center text-blue-500">
                <Users />
                Total Customers
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}</div>
            <p className='text-blue-500'>All registered customers</p>
          </CardContent>
        </Card>

        <Card className='bg-green-50 border border-green-300'>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              <div className="flex gap-2 items-center text-green-500">
                <UserCheck />
                Active Customers
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customers.filter(c => c.status === 'active').length}
            </div>
            <p className='text-green-600'>28.6% of total</p>

          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              <div className="flex gap-2 items-center">
                <UserRoundX />
                Inactive Customers
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customers.filter(c => c.status === 'vip').length}
            </div>
            <p>28.6% of total</p>

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
            <div className="flex gap-4">
              <Select value=''>
                <SelectTrigger className="w-auto min-w-[150px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Active</SelectItem>
                  <SelectItem value="sent">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Select value=''>
                <SelectTrigger className="w-auto min-w-[150px]">
                  <SelectValue placeholder="Sort By Name" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Sort By Name</SelectItem>
                  <SelectItem value="proposed">Sort By Total Jobs</SelectItem>
                  <SelectItem value="roughen">Sort By Join Date</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" className='w-[70px]'>
                <ArrowUpAZ className="w-4 h-4" /> A-Z
              </Button>
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
                <TableHead>Total Jobs</TableHead>
                <TableHead>Total Spent</TableHead>
                <TableHead>Join Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
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
                        <p className="text-xs text-muted-foreground">Contact: John Smith</p>
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
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Briefcase className='w-4 h-4' /> {customer.orders}

                    </div>
                  </TableCell>
                  <TableCell className="font-medium">${customer.totalSpent}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <CalendarDays className='w-4 h-4' />
                      {customer.joinDate}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(customer.status)}>
                      {customer.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => {
                        setEditingCustomer(customer);
                        setCustomerFormData({
                          name: customer.name,
                          email: customer.email,
                          phone: customer.phone,
                          contactPerson: "John Smith",
                          address: customer.location,
                          company: customer.company || ""
                        });
                        setShowAddCustomerModal(true);
                      }}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="icon">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showAddCustomerModal} onOpenChange={(open) => {
        if (!open) {
          setEditingCustomer(null);
          setCustomerFormData({
            name: '',
            email: '',
            phone: '',
            contactPerson: '',
            address: '',
            company: ''
          });
        }
        setShowAddCustomerModal(open);
      }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
            </DialogTitle>
            <DialogDescription>
              {editingCustomer ? 'Update customer profile' : 'Create a new customer profile for service management'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Customer/Company Name */}
            <div className='grid grid-cols-2 gap-2'>
              <div>
                <Label className="mb-2" htmlFor="name">Customer/Company Name *</Label>
                <Input
                  id="name"
                  value={customerFormData.name}
                  onChange={(e) => setCustomerFormData({ ...customerFormData, name: e.target.value })}
                  placeholder="Enter customer name"
                  className="mt-1"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <Label className="mb-2" htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={customerFormData.email}
                  onChange={(e) => setCustomerFormData({ ...customerFormData, email: e.target.value })}
                  placeholder="Enter email address"
                  className="mt-1"
                  required
                />
              </div>
            </div>
            <div className='grid grid-cols-2 gap-2'>

              {/* Phone */}
              <div>
                <Label className="mb-2" htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={customerFormData.phone}
                  onChange={(e) => setCustomerFormData({ ...customerFormData, phone: e.target.value })}
                  placeholder="Enter phone number"
                  className="mt-1"
                />
              </div>

              {/* Contact Person */}
              <div>
                <Label className="mb-2" htmlFor="contact">Contact Person</Label>
                <Input
                  id="contact"
                  value={customerFormData.contactPerson}
                  onChange={(e) => setCustomerFormData({ ...customerFormData, contactPerson: e.target.value })}
                  placeholder="Enter contact person name"
                  className="mt-1"
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <Label className="mb-2" htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={customerFormData.address}
                onChange={(e) => setCustomerFormData({ ...customerFormData, address: e.target.value })}
                placeholder="Enter full address"
                className="mt-1"
              ></Textarea>
            </div>

            {/* Company */}
            <div>
              <Label className="mb-2" htmlFor="company">Company</Label>
              <Input
                id="company"
                value={customerFormData.company}
                onChange={(e) => setCustomerFormData({ ...customerFormData, company: e.target.value })}
                placeholder="Enter company name"
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddCustomerModal(false);
                setEditingCustomer(null);
                setCustomerFormData({
                  name: '',
                  email: '',
                  phone: '',
                  contactPerson: '',
                  address: '',
                  company: ''
                });
              }}
            >
              Cancel
            </Button>
            <Button
              className="text-white"
              onClick={() => {
                if (editingCustomer) {
                  console.log('Updated customer:', customerFormData);
                  // Add your update logic here
                } else {
                  console.log('New customer:', customerFormData);
                  // Add your create logic here
                }
                setShowAddCustomerModal(false);
                setEditingCustomer(null);
                setCustomerFormData({
                  name: '',
                  email: '',
                  phone: '',
                  contactPerson: '',
                  address: '',
                  company: ''
                });
              }}
            >
              {editingCustomer ? 'Update Customer' : 'Add Customer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}