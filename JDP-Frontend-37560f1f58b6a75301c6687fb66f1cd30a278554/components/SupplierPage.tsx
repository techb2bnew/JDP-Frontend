import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Badge } from './ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Textarea } from './ui/textarea'
import { ActionButtonsPopup } from './ActionButtonsPopup'
import { toast } from 'sonner'
import { SupplierDetailsPage } from './SupplierDetailsPage'
import { globalApiCall } from '../utils/globalApiHandler'
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Upload,
  Download,
  Building2,
  Phone,
  Mail,
  MapPin,
  Package,
  ArrowLeft,
  Shield
} from 'lucide-react'
import { apiClient } from '@/utils/api'

interface Supplier {
  id: string
  supplierId: string
  fullName: string
  role?: string
  companyName: string
  contactPerson: string
  email: string
  phone: string
  address: string
  status: 'active' | 'inactive' | 'pending' | 'suspended'
  contractStart: string
  contractEnd: string
  totalOrders: number
  notes?: string
}

interface SupplierFormData {
  fullName: string
  role: string
  companyName: string
  contactPerson: string
  email: string
  phone: string
  address: string
  status: 'active' | 'inactive' | 'pending' | 'suspended'
  contractStart: string
  contractEnd: string
  totalOrders: number
  notes: string
}

interface SupplierPageProps {
  onViewDetails?: (id: string) => void
  onDetailViewChange?: (isDetailView: boolean) => void
}




export function SupplierPage({ onViewDetails, onDetailViewChange }: SupplierPageProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [totalSuppliers, setTotalSuppliers] = useState(0)
  const [viewingSupplier, setViewingSupplier] = useState<Supplier | null>(null)
  const [supplierDetails, setSupplierDetails] = useState<any>(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [isLoadingEdit, setIsLoadingEdit] = useState(false)
  const [filteredSuppliers, setFilteredSuppliers] = useState<any[]>([])
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL
  const [roles, setRoles] = useState<any[]>([])
  const [supplierStats, setSupplierStats] = useState({
    total_suppliers: 0,
    active_suppliers: 0,
    inactive_suppliers: 0,
    total_orders: 0
  })
  const [isStatsLoading, setIsStatsLoading] = useState(false)

  const [formData, setFormData] = useState<SupplierFormData>({
    fullName: '',
    role: '',
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    status: 'pending',
    contractStart: '',
    contractEnd: '',
    totalOrders: 0,
    notes: ''
  })

  const generateSupplierId = () => {
    const year = new Date().getFullYear()
    const count = suppliers.length + 1
    return `SP-${year}-${String(count).padStart(3, '0')}`
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
      case 'pending':
        return (
          <Badge className="bg-yellow-50 text-yellow-600 border-yellow-200 hover:bg-yellow-50">
            Pending
          </Badge>
        )
      case 'suspended':
        return (
          <Badge className="bg-red-50 text-red-600 border-red-200 hover:bg-red-50">
            Suspended
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


  // const filteredSuppliers = suppliers.filter(supplier => {
  //   const matchesSearch = supplier.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //     supplier.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //                        supplier.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //                        supplier.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //                        supplier.phone.includes(searchTerm) ||
  //                        supplier.supplierId.includes(searchTerm)

  //   const matchesStatus = filterStatus === 'all' || supplier.status === filterStatus

  //   return matchesSearch && matchesStatus
  // })

  // For API-based pagination, we don't need to slice the data
  const paginatedSuppliers = filteredSuppliers
  const totalPages = Math.ceil(totalSuppliers / itemsPerPage)

  const handleCreate = async () => {
    // Validation
    if (!formData.fullName || !formData.role || !formData.companyName || !formData.contactPerson || !formData.email || !formData.phone) {
      const errors: Record<string, string> = {};
      if (!formData.fullName) errors.fullName = 'Full Name is required';
      if (!formData.role) errors.role = 'Role is required';
      if (!formData.companyName) errors.companyName = 'Company Name is required';
      if (!formData.contactPerson) errors.contactPerson = 'Contact Person is required';
      if (!formData.email) errors.email = 'Email is required';
      if (!formData.phone) errors.phone = 'Phone is required';

      setValidationErrors(errors);
      toast.error('Please fill in all required fields');
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      const errors = { ...validationErrors, email: 'Please enter a valid email address' };
      setValidationErrors(errors);
      toast.error('Please enter a valid email address');
      return;
    }

    // Phone number validation (exactly 10 digits)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(formData.phone)) {
      const errors = { ...validationErrors, phone: 'Phone number must be exactly 10 digits' };
      setValidationErrors(errors);
      toast.error('Phone number must be exactly 10 digits');
      return;
    }

    let loadingToastId: string | number | undefined;

    try {
      loadingToastId = toast.loading('Creating supplier...');

      const token = localStorage.getItem('jdp_auth') ? JSON.parse(localStorage.getItem('jdp_auth')!).token : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // Prepare payload according to API requirements
      const payload = {
        full_name: formData.fullName,
        email: formData.email.toLowerCase(),
        phone: formData.phone,
        role: formData.role,
        status: formData.status === 'active' ? 'active' : formData.status === 'inactive' ? 'inactive' : formData.status === 'pending' ? 'pending' : 'suspended',
        company_name: formData.companyName,
        contact_person: formData.contactPerson,
        address: formData.address,
        contract_start: formData.contractStart,
        contract_end: formData.contractEnd,
        notes: formData.notes
      };

      const response = await fetch(`${apiBaseUrl}/suppliers/createSupplier`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      toast.dismiss(loadingToastId);

      if (response.ok) {
        const responseData = await response.json();
        if (responseData.success) {
          toast.success('Supplier created successfully!');
          setIsCreateDialogOpen(false);
          resetForm();
          setValidationErrors({});
          // Refresh the supplier list
          fetchSuppliersData(currentPage, itemsPerPage);
        } else {
          toast.error(responseData.message || 'Failed to create supplier');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.message || 'Failed to create supplier');
      }
    } catch (error) {
      if (loadingToastId) {
        toast.dismiss(loadingToastId);
      }
      console.error('Error creating supplier:', error);
      toast.error('An error occurred while creating supplier');
    }
  }

  const handleEdit = async (supplier: Supplier) => {
    setEditingSupplier(supplier)
    setIsEditDialogOpen(true)
    setIsLoadingEdit(true)

    // Show loading state
    let loadingToastId: string | number | undefined;

    try {
      // loadingToastId = toast.loading('Loading supplier details...');

      const token = localStorage.getItem('jdp_auth') ? JSON.parse(localStorage.getItem('jdp_auth')!).token : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${apiBaseUrl}/suppliers/getSupplierById/${supplier.id}`, {
        method: 'GET',
        headers
      });

      toast.dismiss(loadingToastId);

      if (response.ok) {
        const responseData = await response.json();
        console.log('Edit Supplier API Response:', responseData);

        if (responseData.success && responseData.data) {
          const apiData = responseData.data;
          const userData = apiData.users || {};

          // Populate form with API data
          setFormData({
            fullName: userData.full_name || userData.name || '',
            role: userData.role || '',
            companyName: apiData.company_name || '',
            contactPerson: apiData.contact_person || '',
            email: userData.email || '',
            phone: userData.phone || '',
            address: apiData.address || '',
            status: userData.status?.toLowerCase() || 'pending',
            contractStart: apiData.contract_start || '',
            contractEnd: apiData.contract_end || '',
            totalOrders: apiData.total_orders || 0,
            notes: apiData.notes || ''
          });
        } else {
          console.error('Invalid edit supplier API response structure:', responseData);
          toast.error('Failed to load supplier details for editing');
          // Fallback to existing data
          setFormData({
            fullName: supplier.fullName,
            role: supplier.role || '',
            companyName: supplier.companyName,
            contactPerson: supplier.contactPerson,
            email: supplier.email,
            phone: supplier.phone,
            address: supplier.address,
            status: supplier.status,
            contractStart: supplier.contractStart,
            contractEnd: supplier.contractEnd,
            totalOrders: supplier.totalOrders,
            notes: supplier.notes || ''
          });
        }
      } else {
        console.error('Failed to fetch supplier details for editing:', response.status, response.statusText);
        toast.error('Failed to load supplier details for editing');
        // Fallback to existing data
        setFormData({
          fullName: supplier.fullName,
          role: supplier.role || '',
          companyName: supplier.companyName,
          contactPerson: supplier.contactPerson,
          email: supplier.email,
          phone: supplier.phone,
          address: supplier.address,
          status: supplier.status,
          contractStart: supplier.contractStart,
          contractEnd: supplier.contractEnd,
          totalOrders: supplier.totalOrders,
          notes: supplier.notes || ''
        });
      }
    } catch (error) {
      if (loadingToastId) {
        toast.dismiss(loadingToastId);
      }
      console.error('Error fetching supplier details for editing:', error);
      toast.error('An error occurred while loading supplier details');
      // Fallback to existing data
      setFormData({
        fullName: supplier.fullName,
        role: supplier.role || '',
        companyName: supplier.companyName,
        contactPerson: supplier.contactPerson,
        email: supplier.email,
        phone: supplier.phone,
        address: supplier.address,
        status: supplier.status,
        contractStart: supplier.contractStart,
        contractEnd: supplier.contractEnd,
        totalOrders: supplier.totalOrders,
        notes: supplier.notes || ''
      });
    } finally {
      setIsLoadingEdit(false)
    }
  }

  const handleUpdate = async () => {
    if (!editingSupplier) return

    // Validation
    if (!formData.fullName || !formData.role || !formData.companyName || !formData.contactPerson || !formData.email || !formData.phone) {
      const errors: Record<string, string> = {};
      if (!formData.fullName) errors.fullName = 'Full Name is required';
      if (!formData.role) errors.role = 'Role is required';
      if (!formData.companyName) errors.companyName = 'Company Name is required';
      if (!formData.contactPerson) errors.contactPerson = 'Contact Person is required';
      if (!formData.email) errors.email = 'Email is required';
      if (!formData.phone) errors.phone = 'Phone is required';

      setValidationErrors(errors);
      toast.error('Please fill in all required fields');
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      const errors = { ...validationErrors, email: 'Please enter a valid email address' };
      setValidationErrors(errors);
      toast.error('Please enter a valid email address');
      return;
    }

    // Phone number validation (exactly 10 digits)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(formData.phone)) {
      const errors = { ...validationErrors, phone: 'Phone number must be exactly 10 digits' };
      setValidationErrors(errors);
      toast.error('Phone number must be exactly 10 digits');
      return;
    }

    let loadingToastId: string | number | undefined;

    try {
      loadingToastId = toast.loading('Updating supplier...');

      const token = localStorage.getItem('jdp_auth') ? JSON.parse(localStorage.getItem('jdp_auth')!).token : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // Prepare payload according to API requirements
      const payload = {
        full_name: formData.fullName,
        email: formData.email.toLowerCase(),
        phone: formData.phone,
        role: formData.role,
        status: formData.status === 'active' ? 'active' : formData.status === 'inactive' ? 'inactive' : formData.status === 'pending' ? 'pending' : 'suspended',
        company_name: formData.companyName,
        contact_person: formData.contactPerson,
        address: formData.address,
        contract_start: formData.contractStart,
        contract_end: formData.contractEnd,
        notes: formData.notes
      };

      const response = await fetch(`${apiBaseUrl}/suppliers/updateSupplier/${editingSupplier.id}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      toast.dismiss(loadingToastId);

      if (response.ok) {
        const responseData = await response.json();
        if (responseData.success) {
          toast.success('Supplier updated successfully!');
          setIsEditDialogOpen(false);
          setEditingSupplier(null);
          resetForm();
          setValidationErrors({});
          // Refresh the supplier list
          fetchSuppliersData(currentPage, itemsPerPage);
        } else {
          toast.error(responseData.message || 'Failed to update supplier');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.message || 'Failed to update supplier');
      }
    } catch (error) {
      if (loadingToastId) {
        toast.dismiss(loadingToastId);
      }
      console.error('Error updating supplier:', error);
      toast.error('An error occurred while updating supplier');
    }
  }

  const handleView = async (supplier: Supplier) => {
    if (onViewDetails) {
      onViewDetails(supplier.id)
      return
    }
    setIsLoadingDetails(true);
    setViewingSupplier(supplier);
    await fetchSupplierDetails(supplier.id);
  };

  const handleBackToList = () => {
    setViewingSupplier(null);
    setSupplierDetails(null);
    setIsLoadingDetails(false);
  };

  const handleDelete = async (id: string) => {


    let loadingToastId: string | number | undefined;

    try {
      loadingToastId = toast.loading('Deleting supplier...');

      const token = localStorage.getItem('jdp_auth') ? JSON.parse(localStorage.getItem('jdp_auth')!).token : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${apiBaseUrl}/suppliers/deleteSupplier/${id}`, {
        method: 'DELETE',
        headers
      });

      toast.dismiss(loadingToastId);

      if (response.ok) {
        const responseData = await response.json();
        if (responseData.success) {
          toast.success('Supplier deleted successfully!');
          // Refresh the supplier list
          fetchSuppliersData(currentPage, itemsPerPage);
        } else {
          toast.error(responseData.message || 'Failed to delete supplier');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.message || 'Failed to delete supplier');
      }
    } catch (error) {
      if (loadingToastId) {
        toast.dismiss(loadingToastId);
      }
      console.error('Error deleting supplier:', error);
      toast.error('An error occurred while deleting supplier');
    }
  }

  const resetForm = () => {
    setFormData({
      fullName: '',
      role: '',
      companyName: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      status: 'pending',
      contractStart: '',
      contractEnd: '',
      totalOrders: 0,
      notes: ''
    })
    setValidationErrors({})
  }


  function convertSuppliersToCSV(data: Supplier[]) {
    const headers = [
      'Supplier ID',
      'Full Name',
      'Company Name',
      'Contact Person',
      'Email',
      'Phone',
      'Address',
      'Status',
      'Contract Start',
      'Contract End',
      'Total Orders',
      'Notes'
    ].join(',');

    const rows = data.map(supplier => [
      supplier.supplierId,
      supplier.fullName,
      supplier.companyName,
      supplier.contactPerson,
      supplier.email,
      supplier.phone,
      supplier.address,
      supplier.status,
      supplier.contractStart,
      supplier.contractEnd,
      supplier.totalOrders,
      supplier.notes || ''
    ].map(field => `"${field?.toString().replace(/"/g, '""')}"`).join(','));

    return [headers, ...rows].join('\n');
  }

  function downloadCSV(data: Supplier[], filename: string) {
    const csv = convertSuppliersToCSV(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  useEffect(() => {
    fetchRoles();
    // Don't fetch data here - let the search/pagination useEffect handle initial fetch
  }, []);

  const fetchRoles = async () => {
    try {
      const token = localStorage.getItem('jdp_auth') ? JSON.parse(localStorage.getItem('jdp_auth')!).token : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${apiBaseUrl}/permissions/roles-with-permissions`, {
        method: 'GET',
        headers
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log('API Response:', responseData);

        // Transform API response to match component's expected format
        if (responseData.success && responseData.data) {
          const transformedRoles = responseData.data.map((apiRole: any) => ({
            id: apiRole.id.toString(),
            roleName: apiRole.role_name || '',
            roleType: apiRole.role_type || '',
            permissions: apiRole.permissions || []
          }));

          setRoles(transformedRoles);
        } else {
          console.error('Invalid API response structure:', responseData);
        }
      } else {
        console.error('Failed to fetch roles:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const fetchSuppliersData = async (page: number, limit: number) => {
    try {
      setIsLoading(true);

      const response = await globalApiCall(`${apiBaseUrl}/suppliers/getAllSuppliers?page=${page}&limit=${limit}`, {
        method: 'GET'
      });

      const responseData = await response.json();
      console.log('Suppliers API Response:', responseData);

      if (responseData.success && responseData.data) {
        // Transform API response to match component's expected format
        const transformedSuppliers = responseData.data?.data.map((apiSupplier: any) => ({
          id: apiSupplier.id.toString(),
          supplierId: apiSupplier.supplier_code || '',
          fullName: apiSupplier.users.full_name || '',
          role: apiSupplier.role || '',
          companyName: apiSupplier.company_name || '',
          contactPerson: apiSupplier.contact_person || '',
          email: apiSupplier.users.email || '',
          phone: apiSupplier.users.phone || '',
          address: apiSupplier.address || '',
          status: apiSupplier.users.status?.toLowerCase() || '',
          contractStart: apiSupplier.contract_start || '',
          contractEnd: apiSupplier.contract_end || '',
          totalOrders: apiSupplier.total_orders || 0,
          notes: apiSupplier.notes || ''
        }));

        setSuppliers(transformedSuppliers);
        setFilteredSuppliers(transformedSuppliers);
        setTotalSuppliers(responseData.data.pagination.totalItems || transformedSuppliers.length);
      } else {
        console.error('Invalid suppliers API response structure:', responseData);
        setSuppliers([]);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      // Error is already handled by globalApiCall (token revocation, etc.)
      if (!(error instanceof Error && error.message?.includes('Session expired'))) {
        setSuppliers([]);
      }
    } finally {
      setIsLoading(false);
    }
  };
  const fetchBySearchSuppliers = async () => {
    if (!searchTerm.trim()) return;

    setIsLoading(true);

    try {
      const response = await apiClient.searchSuppliersByQuery(searchTerm.trim(), 1, 10);
      const suppliersData = response.data;
      const suppliersList = suppliersData?.suppliers || [];

      const transformedData = suppliersList.map((supplier: any) => ({
        id: supplier.id.toString(),
        userId: supplier.user_id,
        supplierCode: supplier.supplier_code || 'N/A',
        companyName: supplier.company_name || 'N/A',
        contactPerson: supplier.contact_person || 'N/A',
        address: supplier.address || 'N/A',
        contractStart: supplier.contract_start || 'N/A',
        contractEnd: supplier.contract_end || 'N/A',
        notes: supplier.notes || '',
        createdAt: supplier.created_at || '',
        email: supplier.users?.email || 'N/A',
        phone: supplier.users?.phone || 'N/A',
        status: supplier.users?.status || 'N/A',
        fullName: supplier.users?.full_name || 'N/A',
        role: supplier.users?.role || 'N/A',
        photoUrl: supplier.users?.photo_url || null
      }));

      setFilteredSuppliers(transformedData);
      setTotalSuppliers(suppliersData.pagination.total || transformedData.length);
    } catch (error) {
      console.error('Suppliers search error:', error);
      setFilteredSuppliers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      if (!searchTerm.trim()) {
        // Only fetch all when status filter is 'all'
        if (!filterStatus || filterStatus === 'all') {
          fetchSuppliersData(currentPage, itemsPerPage);
        }
      } else {
        fetchBySearchSuppliers();
      }
    }, 500);

    return () => clearTimeout(debounceTimeout);
  }, [searchTerm, currentPage, itemsPerPage, filterStatus]);

  useEffect(() => {
    const fetchSuppliersByStatus = async () => {
      // Don't fetch when 'all' is selected - let the search useEffect handle it
      if (!filterStatus || filterStatus === 'all') {
        return;
      }

      setIsLoading(true);
      try {
        const res = await apiClient.searchSuppliersByStatus(filterStatus, 1, itemsPerPage);
        const supplierList = res.data?.suppliers || [];
        const transformed = supplierList.map((apiSupplier: any) => ({
          id: apiSupplier.id.toString(),
          supplierId: apiSupplier.supplier_code || '',
          fullName: apiSupplier.users?.full_name || '',
          role: apiSupplier.role || '',
          companyName: apiSupplier.company_name || '',
          contactPerson: apiSupplier.contact_person || '',
          email: apiSupplier.users?.email || '',
          phone: apiSupplier.users?.phone || '',
          address: apiSupplier.address || '',
          status: (apiSupplier.users?.status || '').toLowerCase(),
          contractStart: apiSupplier.contract_start || '',
          contractEnd: apiSupplier.contract_end || '',
          totalOrders: apiSupplier.total_orders || 0,
          notes: apiSupplier.notes || ''
        }));
        setSuppliers(transformed);
        setFilteredSuppliers(transformed);
        setTotalSuppliers(res.data?.pagination?.total ?? transformed.length ?? 0);
      } catch (err) {
        console.error("Supplier filter error:", err);
        setSuppliers([]);
        setFilteredSuppliers([]);
        setTotalSuppliers(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuppliersByStatus();
  }, [filterStatus, currentPage, itemsPerPage]);

// Fetch supplier statistics
useEffect(() => {
  const fetchStats = async () => {
    try {
      setIsStatsLoading(true);
      const response = await apiClient.getManagementStats();
      if (response.success && response.data && response.data.suppliers) {
        setSupplierStats(response.data.suppliers);
      }
    } catch (error) {
      console.error('Error fetching supplier stats:', error);
    } finally {
      setIsStatsLoading(false);
    }
  };
  fetchStats();
}, []);


  const fetchSupplierDetails = async (supplierId: string) => {
    try {
      setIsLoadingDetails(true);
      const token = localStorage.getItem('jdp_auth') ? JSON.parse(localStorage.getItem('jdp_auth')!).token : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${apiBaseUrl}/suppliers/getSupplierById/${supplierId}`, {
        method: 'GET',
        headers
      });

      if (response.ok) {
        const responseData = await response.json();

        if (responseData.success && responseData.data) {
          setSupplierDetails(responseData.data);
        } else {
          toast.error('Failed to load supplier details');
        }
      } else {
        toast.error('Failed to load supplier details');
      }
    } catch (error) {
      toast.error('An error occurred while loading supplier details');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const renderForm = () => (
    <div className="grid grid-cols-2 gap-4 py-4 max-h-[65vh] overflow-y-auto p-2">
      <div className="space-y-2">
        <Label htmlFor="role">Role *</Label>
        <Select value={formData.role} onValueChange={(value) => {
          setFormData({ ...formData, role: value })
          if (validationErrors.role) {
            setValidationErrors({ ...validationErrors, role: '' })
          }
        }}>
          <SelectTrigger className={validationErrors.role ? 'border-red-500' : ''}>
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            {roles.map((role) => (
              <SelectItem key={role.id} value={role.roleName}>
                {role.roleName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {validationErrors.role && (
          <p className="text-sm text-red-500 mt-1">{validationErrors.role}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name *</Label>
        <Input
          id="fullName"
          value={formData.fullName}
          onChange={(e) => {
            setFormData({ ...formData, fullName: e.target.value })
            if (validationErrors.fullName) {
              setValidationErrors({ ...validationErrors, fullName: '' })
            }
          }}
          placeholder="Enter full name"
          className={validationErrors.fullName ? 'border-red-500' : ''}
        />
        {validationErrors.fullName && (
          <p className="text-sm text-red-500 mt-1">{validationErrors.fullName}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="companyName">Company Name *</Label>
        <Input
          id="companyName"
          value={formData.companyName}
          onChange={(e) => {
            setFormData({ ...formData, companyName: e.target.value })
            if (validationErrors.companyName) {
              setValidationErrors({ ...validationErrors, companyName: '' })
            }
          }}
          placeholder="Enter company name"
          className={validationErrors.companyName ? 'border-red-500' : ''}
        />
        {validationErrors.companyName && (
          <p className="text-sm text-red-500 mt-1">{validationErrors.companyName}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="contactPerson">Contact Person *</Label>
        <Input
          id="contactPerson"
          value={formData.contactPerson}
          onChange={(e) => {
            setFormData({ ...formData, contactPerson: e.target.value })
            if (validationErrors.contactPerson) {
              setValidationErrors({ ...validationErrors, contactPerson: '' })
            }
          }}
          placeholder="Enter contact person name"
          className={validationErrors.contactPerson ? 'border-red-500' : ''}
        />
        {validationErrors.contactPerson && (
          <p className="text-sm text-red-500 mt-1">{validationErrors.contactPerson}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => {
            setFormData({ ...formData, email: e.target.value })
            if (validationErrors.email) {
              setValidationErrors({ ...validationErrors, email: '' })
            }
          }}
          placeholder="Enter email address"
          className={validationErrors.email ? 'border-red-500' : ''}
        />
        {validationErrors.email && (
          <p className="text-sm text-red-500 mt-1">{validationErrors.email}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number *</Label>
        <Input
          id="phone"
          value={formData.phone}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, '').slice(0, 10);
            setFormData({ ...formData, phone: value })
            if (validationErrors.phone) {
              setValidationErrors({ ...validationErrors, phone: '' })
            }
          }}
          placeholder="Enter 10-digit phone number"
          className={validationErrors.phone ? 'border-red-500' : ''}
        />
        {validationErrors.phone && (
          <p className="text-sm text-red-500 mt-1">{validationErrors.phone}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select value={formData.status} onValueChange={(value: 'active' | 'inactive' ) => setFormData({ ...formData, status: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem> 
          </SelectContent>
        </Select>
      </div>
      <div className="col-span-2 space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="Enter full address"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="contractStart">Contract Start</Label>
        <Input
          id="contractStart"
          type="date"
          value={formData.contractStart}
          max={formData.contractEnd || undefined}
          onChange={(e) => setFormData({ ...formData, contractStart: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contractEnd">Contract End</Label>
        <Input
          id="contractEnd"
          type="date"
          value={formData.contractEnd}
          min={formData.contractStart || undefined}
          onChange={(e) => setFormData({ ...formData, contractEnd: e.target.value })}
        />
      </div>


      <div className="col-span-2 space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Additional notes..."
          rows={3}
        />
      </div>
    </div>
  )

  // Show supplier details page if viewing a supplier
  if (viewingSupplier) {
    return (
      <SupplierDetailsPage
        supplierId={viewingSupplier.id}
        onBack={handleBackToList}
        supplierData={supplierDetails}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-medium text-[#2b2b2b]">Supplier Management</h2>
          <p className="text-sm text-[#2b2b2b]/60 mt-1">Manage your suppliers and vendor relationships.</p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Upload className="h-4 w-4" />
            Import
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => {
            downloadCSV(filteredSuppliers, `suppliers-export-${new Date().toISOString().split('T')[0]}.csv`);
            toast.success('CSV export started');
          }}>
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-white hover:bg-[#0090e6] gap-2">
                <Plus className="h-4 w-4" />
                Add Supplier
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>Add New Supplier</DialogTitle>
              </DialogHeader>
              {renderForm()}
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={() => { setIsCreateDialogOpen(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} className="bg-primary text-white hover:bg-[#0090e6]">
                  Create Supplier
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white shadow-md border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Building2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-medium text-[#2b2b2b]">
                  {isStatsLoading ? '...' : supplierStats.active_suppliers}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Package className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Inactive</p>
                <p className="text-2xl font-medium text-[#2b2b2b]">
                  {isStatsLoading ? '...' : supplierStats.inactive_suppliers}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>


        <Card className="bg-white shadow-md border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-2xl font-medium text-[#2b2b2b]">
                  {isStatsLoading ? '...' : supplierStats.total_orders}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Shield className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Supplier</p>
                <p className="text-2xl font-medium text-[#2b2b2b]">
                {isStatsLoading ? '...' : supplierStats.total_suppliers}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="bg-white shadow-md border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search suppliers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>


              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem> 
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Total: {filteredSuppliers.length}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Supplier Table */}
      <Card className="bg-white shadow-md border-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#162f3d] hover:bg-[#162f3d]">
                <TableHead className="text-white font-medium">
                  <input type="checkbox" className="rounded border-white/30" />
                </TableHead>
                <TableHead className="text-white font-medium">ID</TableHead>
                <TableHead className="text-white font-medium">Name</TableHead>
                <TableHead className="text-white font-medium">Company</TableHead>
                <TableHead className="text-white font-medium">Contact</TableHead>
                <TableHead className="text-white font-medium">Orders</TableHead>
                <TableHead className="text-white font-medium">Status</TableHead>
                <TableHead className="text-white font-medium">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      <span className="ml-2 text-gray-600">Loading suppliers...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedSuppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="text-gray-500">No suppliers found</div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedSuppliers.map((supplier, index) => (
                  <TableRow key={supplier.id} className={index % 2 === 1 ? "bg-[#eff4fa]" : ""}>
                    <TableCell>
                      <input type="checkbox" className="rounded border-gray-300" />
                    </TableCell>
                    <TableCell className="text-sm text-[#2b2b2b]/80">#{supplier.supplierId}</TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm text-[#2b2b2b]/80">{supplier.fullName}</div>
                        <div className="text-xs text-gray-500">{supplier.email}</div>
                        <div className="text-xs text-gray-500">{supplier.phone}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm font-medium text-[#2b2b2b]/80">{supplier.companyName}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {supplier.address.split(',')[0]}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm text-[#2b2b2b]/80">{supplier.contactPerson}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-[#2b2b2b]/80">{supplier.totalOrders}</TableCell>
                    <TableCell>{getStatusBadge(supplier.status)}</TableCell>
                    <TableCell>
                      <ActionButtonsPopup
                        onView={() => handleView(supplier)}
                        onEdit={() => handleEdit(supplier)}
                        onDelete={() => handleDelete(supplier.id)}
                        itemName={supplier.companyName}
                        itemType="Supplier"
                        showView={!!onViewDetails}
                        showEdit={true}
                        showDelete={true}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 0 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              const newPage = Math.max(currentPage - 1, 1);
              setCurrentPage(newPage);
              fetchSuppliersData(newPage, itemsPerPage);
            }}
            disabled={currentPage === 1}
          >
            Previous
          </Button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              onClick={() => {
                setCurrentPage(page);
                fetchSuppliersData(page, itemsPerPage);
              }}
              className={currentPage === page ? "bg-primary text-white hover:bg-[#0090e6]" : ""}
            >
              {page}
            </Button>
          ))}

          <Button
            variant="outline"
            onClick={() => {
              const newPage = Math.min(currentPage + 1, totalPages);
              setCurrentPage(newPage);
              fetchSuppliersData(newPage, itemsPerPage);
            }}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Edit Supplier</DialogTitle>
          </DialogHeader>
          {isLoadingEdit ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-2 text-gray-600">Loading supplier details...</span>
              </div>
            </div>
          ) : (
            <>
              {renderForm()}
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button onClick={handleUpdate} className="bg-primary text-white hover:bg-[#0090e6]">
                  Update Supplier
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}