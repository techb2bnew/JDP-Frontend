'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Badge } from './ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { usePermissions } from '../contexts/PermissionContext'
import { globalApiCall } from '../utils/globalApiHandler'
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog'
import { Label } from "@/components/ui/label"
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { apiClient } from '@/utils/api'

// Static customers data removed - now using API data from /customer/getCustomers

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-800' 
    case 'inactive': return 'bg-gray-100 text-gray-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase()
}

export function CustomersPage() {
  const { hasPermission } = usePermissions()
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [customerFormData, setCustomerFormData] = useState({
    name: '',
    email: '',
    phone: '',
    contactPerson: '',
    address: '',
    company: '',
    status: 'active'
  })
 
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [customersData, setCustomersData] = useState<any[]>([]);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<any>(null);
  const [viewCustomerData, setViewCustomerData] = useState<any>(null);
  const [isLoadingView, setIsLoadingView] = useState(false);
  const [currentAction, setCurrentAction] = useState<'add' | 'edit' | 'view'>('add');
  const [filteredCustomers, setFilteredCustomers] = useState<any>(null);
  const [customerStats, setCustomerStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    activePercentage: '0.0',
    inactivePercentage: '0.0'
  });
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

  // Fetch customers data and stats on component mount and when page changes
  useEffect(() => {
    fetchCustomersData(currentPage, itemsPerPage);
    fetchCustomerStats();
  }, [currentPage, itemsPerPage]);

  const clearValidationError = (field: string) => {
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!customerFormData.name.trim()) {
      errors.name = 'Customer name is required';
    }
    if (!customerFormData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerFormData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!customerFormData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else {
      // Remove all non-digit characters for validation
      const phoneDigits = customerFormData.phone.replace(/\D/g, '');
      if (phoneDigits.length !== 10) {
        errors.phone = 'Phone number must be exactly 10 digits';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const fetchCustomerStats = async () => {
    try {
      setIsLoadingStats(true);
      
      const response = await globalApiCall(`${apiBaseUrl}/customer/getCustomerStats/stats`, {
        method: 'GET'
      });

      const responseData = await response.json();
      console.log('Customer Stats API Response:', responseData);

      if (responseData.success && responseData.data) {
        setCustomerStats({
          total: responseData.data.total || 0,
          active: responseData.data.active || 0,
          inactive: responseData.data.inactive || 0,
          activePercentage: responseData.data.activePercentage || '0.0',
          inactivePercentage: responseData.data.inactivePercentage || '0.0'
        });
      } else {
        console.error('Invalid customer stats API response structure:', responseData);
      }
    } catch (error) {
      console.error('Error fetching customer stats:', error);
      // Error is already handled by globalApiCall (token revocation, etc.)
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleCreateCustomer = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);
      
      // Get system IP address
      const getSystemIP = async () => {
        try {
          const response = await fetch('https://api.ipify.org?format=json');
          const data = await response.json();
          return data.ip;
        } catch (error) {
          console.error('Error fetching IP:', error);
          return 'unknown';
        }
      };

      const systemIP = await getSystemIP();
      
      const payload = {
        customer_name: customerFormData.name,
        company_name: customerFormData.company || '',
        email: customerFormData.email.toLowerCase(),
        phone: customerFormData.phone || '',
        contact_person: customerFormData.contactPerson || '',
        address: customerFormData.address || '',
        status: customerFormData.status,
        system_ip: systemIP
      };

      console.log('Creating customer with payload:', payload);

      const response = await globalApiCall(`${apiBaseUrl}/customer/createCustomer`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      const responseData = await response.json();
      console.log('Customer creation response:', responseData);

      if (responseData.success) {
        // Show success message
        if (typeof window !== 'undefined') {
          const { toast } = await import('sonner');
          toast.success('Customer created successfully!');
        }
        
        setShowAddCustomerModal(false);
        setEditingCustomer(null);
        setCustomerFormData({
          name: '',
          email: '',
          phone: '',
          contactPerson: '',
          address: '',
          company: '',
          status: 'active'
        });
        setValidationErrors({});
        // Refresh the customers list and stats
        fetchCustomersData(currentPage, itemsPerPage);
        fetchCustomerStats();
      } else {
        throw new Error(responseData.message || 'Failed to create customer');
      }
    } catch (error) {
      console.error('Error creating customer:', error);
      if (typeof window !== 'undefined') {
        const { toast } = await import('sonner');
        toast.error(error instanceof Error ? error.message : 'Failed to create customer');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCustomersData = async (page: number, limit: number) => {
    try {
      setIsLoadingCustomers(true);
      
      const response = await globalApiCall(`${apiBaseUrl}/customer/getCustomers?page=${page}&limit=${limit}`, {
        method: 'GET'
      });

      const responseData = await response.json();
      console.log('Customers API Response:', responseData);

      if (responseData.success && responseData.data) {
        // Transform API response to match component's expected format
        const transformedCustomers = responseData.data?.customers.map((apiCustomer: any) => ({
          id: apiCustomer.id?.toString() || `CUST-${Date.now()}`,
          name: apiCustomer.customer_name || '',
          email: apiCustomer.email || '',
          phone: apiCustomer.phone || '',
          location: apiCustomer.address || '',
          orders: apiCustomer.total_orders || 0,
          totalSpent: apiCustomer.total_spent || 0,
          joinDate: apiCustomer.created_at ? new Date(apiCustomer.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          status: apiCustomer.status || 'active',
          company: apiCustomer.company_name || '',
          contactPerson: apiCustomer.contact_person || '',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face' // Default avatar
        }));

        setCustomersData(transformedCustomers);
        setFilteredCustomers(transformedCustomers);
        setTotalCustomers(responseData.data.pagination?.total || transformedCustomers.length);
        console.log('Total customers:', responseData.data.pagination?.total);
        console.log('Items per page:', itemsPerPage);
        console.log('Should show pagination:', (responseData.data.pagination?.total || transformedCustomers.length) > itemsPerPage);
      } else {
        console.error('Invalid customers API response structure:', responseData);
        setCustomersData([]);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      // Error is already handled by globalApiCall (token revocation, etc.)
      if (!(error instanceof Error && error.message?.includes('Session expired'))) {
        setCustomersData([]);
      }
    } finally {
      setIsLoadingCustomers(false);
    }
  };

  const fetchBySearchCustomers = async () => {
  if (!searchTerm.trim()) return;

  setIsLoadingCustomers(true);

  try {
    const response = await apiClient.searchCutomerByQuery(searchTerm.trim(), 1, 10);
    const customersData = response.data;
    const customersList = customersData?.customers || [];

    const transformedData = customersList.map((customer: any) => ({
      id: customer.id,
      customerName: customer.customer_name || 'N/A',
      companyName: customer.company_name || 'N/A',
      email: customer.email || 'N/A',
      phone: customer.phone || 'N/A',
      contactPerson: customer.contact_person || 'N/A',
      address: customer.address || 'N/A',
      status: customer.status || 'N/A',
      createdAt: customer.created_at || '',
      createdByUser: customer.created_by_user?.full_name || 'N/A',
    }));

    setFilteredCustomers(transformedData);
    setTotalCustomers(customersData.pagination.total || transformedData.length);
  } catch (error) {
    console.error('Customer search error:', error);
    setFilteredCustomers([]);
  } finally {
    setIsLoadingCustomers(false);
  }
};

useEffect(() => {
  const debounceTimeout = setTimeout(() => {
    if (!searchTerm.trim()) {
      fetchCustomersData(currentPage, itemsPerPage); 
    } else {
      fetchBySearchCustomers();
    }
  }, 500);

  return () => clearTimeout(debounceTimeout);
}, [searchTerm, currentPage, itemsPerPage]);


  const handleUpdateCustomer = async () => {
    if (!validateForm()) {
      return;
    }

    if (!editingCustomer) {
      console.error('No customer selected for editing');
      return;
    }

    try {
      setIsLoading(true);
      
      // Get system IP address
      const getSystemIP = async () => {
        try {
          const response = await fetch('https://api.ipify.org?format=json');
          const data = await response.json();
          return data.ip;
        } catch (error) {
          console.error('Error fetching IP:', error);
          return 'unknown';
        }
      };

      const systemIP = await getSystemIP();
      
      const payload = {
        customer_name: customerFormData.name,
        company_name: customerFormData.company || '',
        email: customerFormData.email.toLowerCase(),
        phone: customerFormData.phone || '',
        contact_person: customerFormData.contactPerson || '',
        address: customerFormData.address || '',
        status: customerFormData.status,
        system_ip: systemIP
      };

      console.log('Updating customer with payload:', payload);

      const response = await globalApiCall(`${apiBaseUrl}/customer/updateCustomer/${editingCustomer.id}`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      const responseData = await response.json();
      console.log('Customer update response:', responseData);

      if (responseData.success) {
        // Show success message
        if (typeof window !== 'undefined') {
          const { toast } = await import('sonner');
          toast.success('Customer updated successfully!');
        }
        
        setShowAddCustomerModal(false);
        setEditingCustomer(null);
        setCustomerFormData({
          name: '',
          email: '',
          phone: '',
          contactPerson: '',
          address: '',
          company: '',
          status: 'active'
        });
        setValidationErrors({});
        // Refresh the customers list and stats
        fetchCustomersData(currentPage, itemsPerPage);
        fetchCustomerStats();
      } else {
        throw new Error(responseData.message || 'Failed to update customer');
      }
    } catch (error) {
      console.error('Error updating customer:', error);
      if (typeof window !== 'undefined') {
        const { toast } = await import('sonner');
        toast.error(error instanceof Error ? error.message : 'Failed to update customer');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return;

    try {
      setIsLoading(true); 
      const token = localStorage.getItem('jdp_auth') ? JSON.parse(localStorage.getItem('jdp_auth')!).token : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${apiBaseUrl}/customer/deleteCustomer/${customerToDelete.id}`, {
        method: 'DELETE',
        headers
      });

      const responseData = await response.json();
      console.log('Customer deletion response:', responseData);

      if (responseData.success) {
        // Show success message
        if (typeof window !== 'undefined') {
          const { toast } = await import('sonner');
          toast.success('Customer deleted successfully!');
        }
        
        setShowDeleteAlert(false);
        setCustomerToDelete(null);
        // Refresh the customers list and stats
        fetchCustomersData(currentPage, itemsPerPage);
        fetchCustomerStats();
      } else {
        throw new Error(responseData.message || 'Failed to delete customer');
      }
    } catch (error) {
      console.error('Error deleting customer:', error);
      if (typeof window !== 'undefined') {
        const { toast } = await import('sonner');
        toast.error(error instanceof Error ? error.message : 'Failed to delete customer');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCustomerForView = async (customerId: string) => {
    try {
      setIsLoadingView(true);
      
      const response = await globalApiCall(`${apiBaseUrl}/customer/getCustomerById/${customerId}`, {
        method: 'GET'
      });

      const responseData = await response.json();
      console.log('Customer View API Response:', responseData);

      if (responseData.success && responseData.data) {
        setViewCustomerData(responseData.data);
        return responseData.data;
      } else {
        throw new Error(responseData.message || 'Failed to fetch customer details');
      }
    } catch (error) {
      console.error('Error fetching customer for view:', error);
      if (typeof window !== 'undefined') {
        const { toast } = await import('sonner');
        toast.error(error instanceof Error ? error.message : 'Failed to fetch customer details');
      }
      throw error;
    } finally {
      setIsLoadingView(false);
    }
  };

  const fetchCustomerById = async (customerId: string) => {
    try {
      setIsLoading(true);
      
      const response = await globalApiCall(`${apiBaseUrl}/customer/getCustomerById/${customerId}`, {
        method: 'GET'
      });

      const responseData = await response.json();
      console.log('Customer by ID API Response:', responseData);

      if (responseData.success && responseData.data) {
        const apiCustomer = responseData.data;
        
        // Transform API response to match form data format
        const customerData = {
          name: apiCustomer.customer_name || '',
          email: apiCustomer.email || '',
          phone: apiCustomer.phone || '',
          contactPerson: apiCustomer.contact_person || '',
          address: apiCustomer.address || '',
          company: apiCustomer.company_name || '',
          status: apiCustomer.status || 'active'
        };

        setCustomerFormData(customerData);
        return customerData;
      } else {
        throw new Error(responseData.message || 'Failed to fetch customer details');
      }
    } catch (error) {
      console.error('Error fetching customer by ID:', error);
      if (typeof window !== 'undefined') {
        const { toast } = await import('sonner');
        toast.error(error instanceof Error ? error.message : 'Failed to fetch customer details');
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCustomers = () => {
    // Prepare CSV headers
    const headers = [
      'Customer ID',
      'Name',
      'Email',
      'Phone',
      'Location',
      'Company',
      'Contact Person',
      'Total Orders',
      'Total Spent ($)',
      'Status'
    ];

    // Prepare CSV rows
    const rows = customersData.map(customer => [
      customer.id,
      customer.name,
      customer.email,
      customer.phone,
      customer.location,
      customer.company,
      'John Smith', // Contact person (hardcoded in your data)
      customer.orders,
      customer.totalSpent,
      customer.joinDate,
      customer.status.toUpperCase()
    ]);

    // Convert to CSV string
    let csvContent = headers.join(',') + '\n';
    rows.forEach(row => {
      csvContent += row.map(field => `"${field}"`).join(',') + '\n';
    });

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'customers_export.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
useEffect(() => {
  const fetchCustomersByStatus = async () => {
    if (!statusFilter) return;

    setIsLoadingCustomers(true);

    try {
      const res = await apiClient.getCustomersByStatus(statusFilter);
      const customers = res.data?.customers || [];

      console.log(customers, "customers");

      setCustomerFormData(customers);
      setTotalCustomers(customers.length);
    } catch (error) {
      console.error("Customer fetch error:", error);
      setCustomerFormData({
          name: '',
          email: '',
          phone: '',
          contactPerson: '',
          address: '',
          company: '',
          status: 'active'
        });
    } finally {
      setIsLoadingCustomers(false);
    }
  };

  fetchCustomersByStatus();
}, [statusFilter]);




  // const filteredCustomers = customersData
  //   .filter(customer => {
  //     // Search filter
  //     const matchesSearch =
  //       customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //       customer.email.toLowerCase().includes(searchTerm.toLowerCase());

  //     // Status filter
  //     const matchesStatus =
  //       statusFilter === 'all' ||
  //       customer.status === statusFilter;

  //     return matchesSearch && matchesStatus;
  //   })
  //   .sort((a, b) => {
  //     // Only sort if sortBy is set (button clicked)
  //     if (!sortBy) return 0;
      
  //     // Sorting logic
  //     if (sortBy === 'name') {
  //       return sortOrder === 'asc'
  //         ? a.name.localeCompare(b.name)
  //         : b.name.localeCompare(a.name);
  //     } else if (sortBy === 'orders') {
  //       return sortOrder === 'asc'
  //         ? a.orders - b.orders
  //         : b.orders - a.orders;
  //     } else if (sortBy === 'joinDate') {
  //       return sortOrder === 'asc'
  //         ? new Date(a.joinDate).getTime() - new Date(b.joinDate).getTime()
  //         : new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime();
  //     }
  //     return 0;
  //   });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-medium text-[#2b2b2b]">Customer Management</h1>
          <p className="text-muted-foreground">Manage and track all customer relationships and service history</p>
        </div>
        <div className='flex gap-2'>
          {hasPermission('customers', 'view') && (
            <Button variant="outline" onClick={handleExportCustomers}>
              <Download className="h-4 w-4 mr-2" />
              Export Customers
            </Button>
          )}
          {hasPermission('customers', 'create') && (
            <Button className='text-white' onClick={() => {
              setCurrentAction('add');
              setEditingCustomer(null);
              setViewCustomerData(null);
              setShowAddCustomerModal(true);
            }}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Customer
            </Button>
          )}
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
            <div className="text-2xl font-bold">
              {isLoadingStats ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              ) : (
                customerStats.total
              )}
            </div>
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
              {isLoadingStats ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
              ) : (
                customerStats.active
              )}
            </div>
            <p className='text-green-600'>{customerStats.activePercentage}% of total</p>

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
              {isLoadingStats ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-500"></div>
              ) : (
                customerStats.inactive
              )}
            </div>
            <p>{customerStats.inactivePercentage}% of total</p>

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
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-auto min-w-[150px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem> 
                </SelectContent>
              </Select>
              {/* <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-auto min-w-[150px]">
                  <SelectValue placeholder="Sort By Name" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Sort By Name</SelectItem>
                  <SelectItem value="orders">Sort By Total Jobs</SelectItem>
                  <SelectItem value="joinDate">Sort By Join Date</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                className='w-[70px]'
                onClick={() => {
                  setSortBy('name');
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                }}
              >
                <ArrowUpAZ className="w-4 h-4" />
                {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
              </Button> */}
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
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingCustomers ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      <span className="ml-2">Loading customers...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredCustomers?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No customers found
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers?.map((customer:any) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <div className="flex items-center gap-3"> 
                      <div>
                        <p className="font-medium">{customer.name}</p>
                        <p className="text-sm text-muted-foreground">#{customer.id}</p>
                        <p className="text-xs text-muted-foreground">Contact: {customer.contactPerson || 'N/A'}</p>
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
                    <Badge className={getStatusColor(customer.status)}>
                      {customer.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {hasPermission('customers', 'view') && (
                        <Button variant="outline" size="icon" onClick={() => {
                          setCurrentAction('view');
                          // Fetch customer details from API for view
                          fetchCustomerForView(customer.id).then(() => {
                            setShowAddCustomerModal(true);
                          }).catch((error) => {
                            console.error('Failed to load customer for viewing:', error);
                          });
                        }}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                      {hasPermission('customers', 'edit') && (
                        <Button variant="outline" size="icon" onClick={() => {
                          setCurrentAction('edit');
                          setEditingCustomer(customer);
                          // Fetch customer details from API for editing
                          fetchCustomerById(customer.id).then(() => {
                            setShowAddCustomerModal(true);
                          }).catch((error) => {
                            console.error('Failed to load customer for editing:', error);
                          });
                        }}>
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                      {hasPermission('customers', 'delete') && (
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={() => {
                            setCustomerToDelete(customer);
                            setShowDeleteAlert(true);
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          {/* Pagination Controls */}
          {totalCustomers > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCustomers)} of {totalCustomers} customers
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1 || isLoadingCustomers}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {Math.ceil(totalCustomers / itemsPerPage)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={currentPage >= Math.ceil(totalCustomers / itemsPerPage) || isLoadingCustomers}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAddCustomerModal} onOpenChange={(open) => {
        if (!open) {
          setEditingCustomer(null);
          setViewCustomerData(null);
          setCustomerFormData({
            name: '',
            email: '',
            phone: '',
            contactPerson: '',
            address: '',
            company: '',
            status: 'active'
          });
          setValidationErrors({});
        }
        setShowAddCustomerModal(open);
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {currentAction === 'add' ? 'Add New Customer' :
                currentAction === 'edit' ? 'Edit Customer' :
                  'Customer Details'}
            </DialogTitle>
            <DialogDescription>
              {currentAction === 'add' ? 'Create a new customer profile for service management' :
                currentAction === 'edit' ? 'Update customer profile' :
                  'View complete customer details'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {currentAction === 'view' && viewCustomerData ? (
              // View Mode - Customer Details
              <div className="space-y-6">
                {isLoadingView ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-2">Loading customer details...</span>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Customer Information Section */}
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">Customer Name</Label>
                        <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-gray-900">
                          {viewCustomerData.customer_name}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">Company Name</Label>
                        <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-gray-900">
                          {viewCustomerData.company_name || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">Email Address</Label>
                        <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-gray-900">
                          {viewCustomerData.email}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">Phone Number</Label>
                        <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-gray-900">
                          {viewCustomerData.phone || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">Contact Person</Label>
                        <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-gray-900">
                          {viewCustomerData.contact_person || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">Status</Label>
                        <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-gray-900">
                          <Badge className={getStatusColor(viewCustomerData.status || 'active')}>
                            {(viewCustomerData.status || 'active').toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Address Section */}
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">Address</Label>
                      <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-gray-900 min-h-[60px]">
                        {viewCustomerData.address || 'No address provided'}
                      </div>
                    </div>

                    {/* Timestamps */}
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">Created At</Label>
                        <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-gray-900">
                          {viewCustomerData.created_at ? new Date(viewCustomerData.created_at).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">Last Updated</Label>
                        <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-gray-900">
                          {viewCustomerData.updated_at ? new Date(viewCustomerData.updated_at).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Add/Edit Mode - Form
              <>
                {/* Customer/Company Name */}
                <div className='grid grid-cols-2 gap-2'>
                  <div>
                    <Label className="mb-2" htmlFor="name">Customer Name *</Label>
                    <Input
                      id="name"
                      value={customerFormData.name}
                      onChange={(e) => {
                        setCustomerFormData({ ...customerFormData, name: e.target.value });
                        clearValidationError('name');
                      }}
                      placeholder="Enter customer name"
                      className={`mt-1 ${validationErrors.name ? 'border-red-500' : ''}`}
                      required
                    />
                    {validationErrors.name && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.name}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <Label className="mb-2" htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={customerFormData.email}
                      onChange={(e) => {
                        setCustomerFormData({ ...customerFormData, email: e.target.value });
                        clearValidationError('email');
                      }}
                      placeholder="Enter email address"
                      className={`mt-1 ${validationErrors.email ? 'border-red-500' : ''}`}
                      required
                    />
                    {validationErrors.email && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.email}</p>
                    )}
                  </div>
                </div>
                <div className='grid grid-cols-2 gap-2'>

                  {/* Phone */}
                  <div>
                    <Label className="mb-2" htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="number"
                      value={customerFormData.phone}
                      onChange={(e) => {
                        setCustomerFormData({ ...customerFormData, phone: e.target.value });
                        clearValidationError('phone');
                      }}
                      placeholder="Enter phone number"
                      className={`mt-1 ${validationErrors.phone ? 'border-red-500' : ''}`}
                      required
                    />
                    {validationErrors.phone && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.phone}</p>
                    )}
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

                {/* Status */}
                <div>
                  <Label className="mb-2" htmlFor="status">Status *</Label>
                  <Select
                    value={customerFormData.status}
                    onValueChange={(value) => setCustomerFormData({ ...customerFormData, status: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem> 
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            {currentAction === 'view' ? (
              <div className="flex gap-2">
                {hasPermission('customers', 'edit') && (
                  <Button variant="outline" onClick={() => {
                    setCurrentAction('edit');
                    // Create customer object from view data to ensure consistency
                    const customerToEdit = {
                      id: viewCustomerData.id?.toString() || '',
                      name: viewCustomerData.customer_name || '',
                      email: viewCustomerData.email || '',
                      phone: viewCustomerData.phone || '',
                      location: viewCustomerData.address || '',
                      orders: 0, // Default value
                      totalSpent: 0, // Default value
                      joinDate: viewCustomerData.created_at ? new Date(viewCustomerData.created_at).toISOString().split('T')[0] : '',
                      status: viewCustomerData.status || 'active',
                      company: viewCustomerData.company_name || '',
                      contactPerson: viewCustomerData.contact_person || '',
                      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face'
                    };
                    setEditingCustomer(customerToEdit);
                    // Fetch customer details for editing
                    fetchCustomerById(viewCustomerData.id).catch((error) => {
                      console.error('Failed to load customer for editing:', error);
                    });
                  }}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
               
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddCustomerModal(false);
                    setEditingCustomer(null);
                    setViewCustomerData(null);
                    setCustomerFormData({
                      name: '',
                      email: '',
                      phone: '',
                      contactPerson: '',
                      address: '',
                      company: '',
                      status: 'active'
                    });
                    setValidationErrors({});
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="text-white"
                  disabled={isLoading}
                  onClick={() => {
                    if (editingCustomer) {
                      handleUpdateCustomer();
                    } else {
                      handleCreateCustomer();
                    }
                  }}
                >
                  {isLoading ? (editingCustomer ? 'Updating...' : 'Creating...') : (editingCustomer ? 'Update Customer' : 'Add Customer')}
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this customer?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the customer &quot;{customerToDelete?.name}&quot; from your database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>No</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteCustomer} 
              disabled={isLoading}
              className="bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
            >
              {isLoading ? 'Deleting...' : 'Yes'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}