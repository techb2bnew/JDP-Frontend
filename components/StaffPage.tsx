import { useState, useEffect } from 'react'
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
import { AutoSuggestInput } from './ui/auto-suggest-input'
import { Checkbox } from './ui/checkbox'
import { toast } from 'sonner'
import { apiClient } from '../utils/api'
import { usePermissions } from '../contexts/PermissionContext'
import { 
  Plus, 
  Search, 
  Upload,
  Download
} from 'lucide-react'
import { globalApiCall, getAuthToken, handleTokenRevocation } from '../utils/globalApiHandler'

interface Staff {
  id: string
  name: string
  email: string
  phone: string
  dob: string
  address: string
  position: string
  department: string
  dateOfJoining: string
  status: 'active' | 'inactive'
  role: string
  avatar?: string
}

interface StaffFormData {
  name: string
  email: string
  phone: string
  dob: string
  address: string
  position: string
  department: string
  dateOfJoining: string
  status: 'active' | 'inactive'
  role: string
}

const initialStaffData: Staff[] = [
  {
    id: '1111',
    name: 'John Smith',
    email: 'john@gmail.com',
    phone: '+61 2222 021 203',
    dob: '1990-01-15',
    address: '47 W 13th St, New York, NY 10011, USA',
    position: 'Electrical Engineer',
    department: 'Engineering',
    dateOfJoining: '27-4-2025',
    status: 'active',
    role: '1'
  },
  {
    id: '2122',
    name: 'David Smith',
    email: 'david@gmail.com',
    phone: '+61 2222 021 203',
    dob: '1985-05-20',
    address: '47 W 13th St, New York, NY 10011, USA',
    position: 'Senior Technician',
    department: 'Operations',
    dateOfJoining: '07-4-2025',
    status: 'active',
    role: '2'
  }, 
  {
    id: '0791',
    name: 'Alen',
    email: 'alen@gmail.com',
    phone: '+61 2222 021 203',
    dob: '1992-12-10',
    address: '47 W 13th St, New York, NY 10011, USA',
    position: 'Technician',
    department: 'Operations',
    dateOfJoining: '19-4-2025',
    status: 'inactive',
    role: '2'
  }
]

const positions = ['Electrical Engineer', 'Senior Technician', 'Technician', 'Project Manager', 'Sales Executive', 'HR Manager']

interface StaffPageProps {
  onViewDetails?: (id: string) => void
}
type FilterStatus = 'all' | 'active' | 'inactive';

export function StaffPage({ onViewDetails }: StaffPageProps) {
  const { hasPermission, isLoading: permissionsLoading, permissions } = usePermissions()
  const [staff, setStaff] = useState<Staff[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isStaffDialogOpen, setIsStaffDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null)
  const [filterDepartment, setFilterDepartment] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const itemsPerPage = 10
  const [totalStaff, setTotalStaff] = useState(0) 
  const [filteredStaff, setFilteredStaff] = useState<any[]>([]);

  // Check if user is admin (has no specific permissions but should see all actions)
  const isAdmin = !permissionsLoading && permissions.length === 0

  // Permission checks for staff module (only check if permissions are loaded)
  // Show buttons if user has specific permissions OR if user is admin
  const canViewStaff = !permissionsLoading && (isAdmin || hasPermission('staff', 'view'))
  const canCreateStaff = !permissionsLoading && (isAdmin || hasPermission('staff', 'create'))
  const canEditStaff = !permissionsLoading && (isAdmin || hasPermission('staff', 'edit'))
  const canDeleteStaff = !permissionsLoading && (isAdmin || hasPermission('staff', 'delete'))

  const [formData, setFormData] = useState<StaffFormData>({
    name: '',
    email: '',
    phone: '',
    dob: '',
    address: '',
    position: '',
    department: '',
    dateOfJoining: '',
    status: 'active',
    role: ''
  })

  // State for roles from API
  const [roles, setRoles] = useState<any[]>([])
  const [isLoadingStaff, setIsLoadingStaff] = useState(false)
  const [staffDetails, setStaffDetails] = useState<any>(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [departments, setDepartments] = useState<string[]>([])
  const [positions, setPositions] = useState<string[]>([])
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({})
  const [selectedStaff, setSelectedStaff] = useState<string[]>([])
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  
  // API base URL
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL

  // Validation functions
  const validateField = (fieldName: string, value: string) => {
    const errors = { ...validationErrors }
    
    switch (fieldName) {
      case 'name':
        if (!value.trim()) {
          errors.name = 'Name is required'
        } else if (value.trim().length < 2) {
          errors.name = 'Name must be at least 2 characters'
        } else if (!/^[a-zA-Z\s]+$/.test(value)) {
          errors.name = 'Name can only contain letters and spaces'
        } else {
          delete errors.name
        }
        break
        
      case 'email':
        if (!value.trim()) {
          errors.email = 'Email is required'
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.email = 'Please enter a valid email address'
        } else {
          delete errors.email
        }
        break
        
      case 'phone':
        if (!value.trim()) {
          errors.phone = 'Phone number is required'
        } else if (value.replace(/\D/g, '').length !== 10) {
          errors.phone = 'Phone number must be exactly 10 digits'
        } else {
          delete errors.phone
        }
        break
        
      case 'dob':
        if (!value.trim()) {
          errors.dob = 'Date of Birth is required'
        } else if (new Date(value) > new Date()) {
          errors.dob = 'Date of Birth cannot be in the future'
        } else {
          delete errors.dob
        }
        break
        
      case 'dateOfJoining':
        if (!value.trim()) {
          errors.dateOfJoining = 'Date of Joining is required'
        } else {
          delete errors.dateOfJoining
        }
        break
        
      case 'position':
        if (!value.trim()) {
          errors.position = 'Position is required'
        } else if (value.trim().length < 2) {
          errors.position = 'Position must be at least 2 characters'
        } else {
          delete errors.position
        }
        break
        
      case 'department':
        if (!value.trim()) {
          errors.department = 'Department is required'
        } else if (value.trim().length < 2) {
          errors.department = 'Department must be at least 2 characters'
        } else {
          delete errors.department
        }
        break
        
      case 'address':
        if (value.trim() && value.trim().length < 5) {
          errors.address = 'Address must be at least 5 characters'
        } else {
          delete errors.address
        }
        break
    }
    
    setValidationErrors(errors)
  }

  const handleViewDetails = async (id: string) => { 
    // If parent component provided onViewDetails callback, use it
    if (onViewDetails) {
      onViewDetails(id)
      return
    }
    
    // Otherwise, use internal state management
    setSelectedStaffId(id)
    setShowDetails(true)
    
    try {
      setIsLoadingDetails(true)
      const response = await apiClient.getStaffById(id)
      
      if (response.success && response.data) {
        setStaffDetails(response.data)
      } else {
        toast.error('Failed to load staff details')
        setStaffDetails(null)
      }
    } catch (error) {
      console.error('Error fetching staff details:', error)
      toast.error('Failed to load staff details')
      setStaffDetails(null)
    } finally {
      setIsLoadingDetails(false)
    }
  } 

  const handleBackToList = () => {
    setSelectedStaffId(null)
    setShowDetails(false)
  }

  // Fetch roles from API when component mounts
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
  const fetchStaffData = async (page: number, limit: number) => {
    try {
      setIsLoadingStaff(true);
      
      const response = await globalApiCall(`${apiBaseUrl}/staff/getAllStaff?page=${page}&limit=${limit}`, {
        method: 'GET'
      });

      const responseData = await response.json();
      
      
      if (responseData.success && responseData.data) {
        // Transform API response to match component's expected format
        const transformedStaff = responseData.data.data.map((apiStaff: any) => ({
          id: apiStaff.id.toString(),
          name: apiStaff.users?.full_name || '',
          email: apiStaff.users?.email || '',
          phone: apiStaff.users?.phone || '',
          dob: apiStaff.dob || '',
          address: apiStaff.address || '',
          position: apiStaff.position || '',
          department: apiStaff.department || '',
          dateOfJoining: apiStaff.date_of_joining || '',
          status: apiStaff.users?.status || 'active',
          role: apiStaff.users?.role || ''
        }));
        
        setStaff(transformedStaff);
        setFilteredStaff(transformedStaff);
        setTotalStaff(responseData.data.pagination.totalItems || transformedStaff.length);
        
        // Extract unique departments and positions from the staff data
        const departmentSet = new Set<string>();
        const positionSet = new Set<string>();
        
        responseData.data.data.forEach((apiStaff: any) => {
          if (apiStaff.department && apiStaff.department.trim() !== '') {
            departmentSet.add(apiStaff.department);
          }
          if (apiStaff.position && apiStaff.position.trim() !== '') {
            positionSet.add(apiStaff.position);
          }
        });
        
        const uniqueDepartments = Array.from(departmentSet);
        const uniquePositions = Array.from(positionSet);
        
        setDepartments(uniqueDepartments);
        setPositions(uniquePositions);
      } else {
        console.error('Invalid API response structure:', response);
        toast.error('Failed to load staff data');
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast.error('Failed to load staff data');
    } finally {
      setIsLoadingStaff(false);
    }
  };

  // Note: Early return moved after all hooks to avoid Rules of Hooks violation

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
      default:
        return (
          <Badge className="bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-50">
            {status}
          </Badge>
        )
    }
  }

  // const filteredStaff = staff.filter(member => {
  //   const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //                        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //                        member.phone.includes(searchTerm) ||
  //                        member.id.includes(searchTerm)
    
  //   const matchesDepartment = filterDepartment === 'all' || member.department === filterDepartment
  //   const matchesStatus = filterStatus === 'all' || member.status === filterStatus
    
  //   return matchesSearch && matchesDepartment && matchesStatus
  // })

  
  const paginatedStaff = filteredStaff
 
  const totalPages = Math.ceil(totalStaff / itemsPerPage)

  const handleCreate = async () => {
    if (!formData.name || !formData.email || !formData.phone || !formData.role) {
      return
    }

    try {
      const loadingToast = toast.loading('Creating staff member...')
      
      // Prepare API payload
      const staffPayload = {
        full_name: formData.name,
        email: formData.email,
        phone: formData.phone,
        position: formData.position,
        department: formData.department,
        date_of_joining: formData.dateOfJoining,
        dob: formData.dob,
        address: formData.address,
        role: formData.role,
        status: formData.status,
        management_type: "staff"
      }

      const response = await apiClient.createStaff(staffPayload)
      
      toast.dismiss(loadingToast)
      
      if (response.success) {
        // Refresh staff list from API
        await fetchStaffData(currentPage, itemsPerPage)
        
    setFormData({
      name: '',
      email: '',
      phone: '',
      dob: '',
      address: '',
      position: '',
      department: '',
      dateOfJoining: '',
      status: 'active',
      role: ''
    })
        setIsStaffDialogOpen(false)
        setIsEditMode(false)
    toast.success('Staff member created successfully')
      } else {
        toast.error(response.message || 'Failed to create staff member')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create staff member')
    }
  }

  const handleAddStaff = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      dob: '',
      address: '',
      position: '',
      department: '',
      dateOfJoining: '',
      status: 'active',
      role: ''
    })
    setValidationErrors({})
    setIsEditMode(false)
    setEditingStaff(null)
    setIsStaffDialogOpen(true)
  }

  const handleEdit = (staffMember: Staff) => {
    setEditingStaff(staffMember)
    
    // Format date for HTML date input (YYYY-MM-DD)
    const formatDateForInput = (dateString: string) => {
      if (!dateString) return '';
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        return date.toISOString().split('T')[0];
      } catch {
        return '';
      }
    };
    
    setFormData({
      name: staffMember.name,
      email: staffMember.email,
      phone: staffMember.phone,
      dob: formatDateForInput(staffMember.dob),
      address: staffMember.address,
      position: staffMember.position,
      department: staffMember.department,
      dateOfJoining: formatDateForInput(staffMember.dateOfJoining),
      status: staffMember.status,
      role: staffMember.role
    })
    setValidationErrors({})
    setIsEditMode(true)
    setIsStaffDialogOpen(true)
  }


   const validateForm = () => {
    const errors: {[key: string]: string} = {}
    let isValid = true

    // Validate all required fields
    if (!formData.name.trim()) {
      errors.name = 'Name is required'
      isValid = false
    } else if (!/^[a-zA-Z\s]{2,}$/.test(formData.name.trim())) {
      errors.name = 'Name must be at least 2 characters and contain only letters/spaces'
      isValid = false
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required'
      isValid = false
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Invalid email address'
      isValid = false
    }

    if (!formData.phone.trim()) {
      errors.phone = 'Phone is required'
      isValid = false
    } else if (!/^\d{10}$/.test(formData.phone)) {
      errors.phone = 'Phone must be exactly 10 digits'
      isValid = false
    }

    if (!formData.dob.trim()) {
      errors.dob = 'Date of Birth is required'
      isValid = false
    }

    if (!formData.dateOfJoining.trim()) {
      errors.dateOfJoining = 'Date of Joining is required'
      isValid = false
    }

    if (!formData.role.trim()) {
      errors.role = 'Role is required'
      isValid = false
    }

    // Validate required fields
    if (!formData.position.trim()) {
      errors.position = 'Position is required'
      isValid = false
    }

    if (!formData.department.trim()) {
      errors.department = 'Department is required'
      isValid = false
    }

    // Validate optional fields if they have values
    if (formData.address.trim() && formData.address.trim().length < 5) {
      errors.address = 'Address must be at least 5 characters'
      isValid = false
    }

    setValidationErrors(errors)
    return isValid
  }

  const handleSubmit = async () => {
     if (!validateForm()) {
      return
    }
    let loadingToastId: string | number | undefined

    try {
      loadingToastId = toast.loading(isEditMode ? 'Updating staff member...' : 'Creating staff member...')

      const staffPayload = {
        full_name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.replace(/\D/g, ''), // Remove non-digits
        dob: formData.dob,
        position: formData.position.trim(),
        department: formData.department.trim(),
        date_of_joining: formData.dateOfJoining,
        address: formData.address.trim(),
        role: formData.role,
        status: formData.status,
        management_type: "staff"
      }

      console.log('Starting API call at:', new Date().toISOString())
      console.log('Payload:', staffPayload)

      let response
      if (isEditMode && editingStaff) {
        console.log('Updating staff with ID:', editingStaff.id)
        response = await apiClient.updateStaff(editingStaff.id, staffPayload)
      } else {
        console.log('Creating new staff')
        response = await apiClient.createStaff(staffPayload)
      }

      console.log('API call completed at:', new Date().toISOString())
      console.log('Response:', response)
      
      // Dismiss loading toast
      if (loadingToastId) {
        toast.dismiss(loadingToastId)
      }
      
      if (response.success) {
        // Reset form and close dialog immediately
        setFormData({
          name: '',
          email: '',
          phone: '',
          dob: '',
          address: '',
          position: '',
          department: '',
          dateOfJoining: '',
          status: 'active',
          role: ''
        })
        setValidationErrors({})
        setEditingStaff(null)
        setIsStaffDialogOpen(false)
        setIsEditMode(false)
        toast.success(isEditMode ? 'Staff member updated successfully' : 'Staff member created successfully')
        
        // Refresh staff list in background (don't await)
        fetchStaffData(currentPage, itemsPerPage)
      } else {
        toast.error(response.message || `Failed to ${isEditMode ? 'update' : 'create'} staff member`)
      }
    } catch (error) {
      // Make sure to dismiss loading toast even on error
      if (loadingToastId) {
        toast.dismiss(loadingToastId)
      }
      toast.error(error instanceof Error ? error.message : `Failed to ${isEditMode ? 'update' : 'create'} staff member`)
    }
  }

  const handleDelete = async (id: string) => {
    let loadingToastId: string | number | undefined
    
    try {
      loadingToastId = toast.loading('Deleting staff member...')
      
      const response = await apiClient.deleteStaff(id)
      
      // Dismiss loading toast
      if (loadingToastId) {
        toast.dismiss(loadingToastId)
      }
      
      if (response.success) {
        // Refresh staff list from API
        await fetchStaffData(currentPage, itemsPerPage)
    toast.success('Staff member deleted successfully')
      } else {
        toast.error(response.message || 'Failed to delete staff member')
      }
    } catch (error) {
      // Make sure to dismiss loading toast even on error
      if (loadingToastId) {
        toast.dismiss(loadingToastId)
      }
      toast.error(error instanceof Error ? error.message : 'Failed to delete staff member')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      dob: '',
      address: '',
      position: '',
      department: '',
      dateOfJoining: '',
      status: 'active',
      role: ''
    })
  }

  const handleBulkImport = async () => {
    if (!importFile) {
      toast.error('Please select a CSV file');
      return;
    }

    try {
      setIsImporting(true);

      // Get auth token
      const token = getAuthToken();
      if (!token) {
        toast.error('Authentication token not found');
        return;
      }

      // Create FormData and append CSV file
      const formData = new FormData();
      formData.append('file', importFile);

      // Call bulk import API with FormData
      const response = await fetch(`${apiBaseUrl}/staff/import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // Don't set Content-Type - browser will set it with boundary for FormData
        },
        body: formData
      });

      const responseData = await response.json();
      console.log('Bulk import response:', responseData);

      if (!response.ok) {
        // Handle token revocation
        if (response.status === 401) {
          await handleTokenRevocation();
          throw new Error('Session expired. Please login again.');
        }
        throw new Error(responseData.message || 'Failed to import staff');
      }

      if (responseData.success) {
        toast.success(responseData.message || 'Successfully imported staff!');
        setShowImportDialog(false);
        setImportFile(null);
        
        // Refresh staff list
        fetchStaffData(currentPage, itemsPerPage);
      } else {
        throw new Error(responseData.message || 'Failed to import staff');
      }
    } catch (error) {
      console.error('Error importing staff:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to import staff');
    } finally {
      setIsImporting(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
      setImportFile(file);
    } else {
      toast.error('Please select a valid CSV file');
    }
  };

  const handleExportStaff = async () => {
  // Check if any staff is selected
  if (selectedStaff.length === 0) {
    toast.error('Please select at least one staff member to export');
    return;
  }

  // Filter staff to only include selected ones
  const selectedStaffData = staff.filter(member => selectedStaff.includes(member.id));

  // Prepare CSV headers
  const headers = [
    'ID',
    'Name',
    'Email',
    'Phone',
    'Address',
    'Position',
    'Department',
    'Date of Joining',
    'Status'
  ];

  // Prepare CSV rows
  const rows = selectedStaffData.map(member => [
    member.id,
    member.name,
    member.email,
    member.phone,
    member.address,
    member.position,
    member.department,
    member.dateOfJoining,
    member.status.toUpperCase()
  ]);

  // Convert to CSV string
  let csvContent = headers.join(',') + '\n';
  rows.forEach(row => {
    csvContent += row.map(field => {
      const value = field === null || field === undefined ? '' : String(field);
      const escapedValue = value.replace(/"/g, '""');
      return `"${escapedValue}"`;
    }).join(',') + '\n';
  });

  // Create download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `staff_export_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};



const fetchBySearchStaff = async () => {
  if (!searchTerm.trim()) return;

  setIsLoadingStaff(true);

  try {
    const response = await apiClient.searchStaffByQuery(searchTerm.trim(), 1, 10);
    const staffData = response.data;
    const staffList = staffData?.staff || [];

    const transformedStaff = staffList.map((staff: any) => ({
      id: staff.id,
      userId: staff.user_id,
      name: staff.users?.full_name || 'N/A',
      email: staff.users?.email || 'N/A',
      phone: staff.users?.phone || 'N/A',
      role: staff.users?.role || 'N/A',
      status: staff.users?.status || 'N/A',
      position: staff.position || 'N/A',
      department: staff.department || 'N/A',
      dateOfJoining: staff.date_of_joining || 'N/A',
      dob: staff.dob || 'N/A',
      address: staff.address || 'N/A',
    }));

    setFilteredStaff(transformedStaff); 
    setTotalStaff(transformedStaff.length); 
  } catch (error) {
    console.error('Staff search error:', error);
    setFilteredStaff([]);
  } finally {
    setIsLoadingStaff(false);
  }
};
useEffect(() => {
  const debounceTimeout = setTimeout(() => {
    if (!searchTerm.trim()) {
      // Only fetch all when status filter is 'all'
      if (!filterStatus || filterStatus === 'all') {
        fetchStaffData(currentPage, itemsPerPage);
      }
    } else {
      fetchBySearchStaff();
    }
  }, 500);

  return () => clearTimeout(debounceTimeout);
}, [searchTerm, currentPage, itemsPerPage, filterStatus]);

// Clear selected staff when pagination, filters, or search changes
useEffect(() => {
  setSelectedStaff([]);
}, [currentPage, filterDepartment, filterStatus, searchTerm]);

useEffect(() => {
  const fetchStaffByStatus = async () => {
    // Don't fetch when 'all' is selected - let the search useEffect handle it
    if (!filterStatus || filterStatus === 'all') {
      return;
    }

    setIsLoadingStaff(true);

    try {

      const res = await apiClient.searchStaffByStatus(filterStatus, 1, 10);
      const staffList = res.data?.staff || [];

      const transformedStaff = staffList.map((staff: any) => ({
        id: staff.id,
        userId: staff.user_id,
        name: staff.users?.full_name || 'N/A',
        email: staff.users?.email || 'N/A',
        phone: staff.users?.phone || 'N/A',
        role: staff.users?.role || 'N/A',
        status: staff.users?.status || 'N/A',
        position: staff.position || 'N/A',
        department: staff.department || 'N/A',
        dateOfJoining: staff.date_of_joining || 'N/A',
        dob: staff.dob || 'N/A',
        address: staff.address || 'N/A',
      }));

      setStaff(transformedStaff);
      setFilteredStaff(transformedStaff);
      setTotalStaff(res.data?.pagination?.total ?? transformedStaff.length);

    } catch (err) {
      console.error('Staff filter error:', err);
      setStaff([]);
      setFilteredStaff([]);
      setTotalStaff(0);
    } finally {
      setIsLoadingStaff(false);
    }
  };

  fetchStaffByStatus();
}, [filterStatus]);









  // If showing details, render the details page
  if (showDetails && selectedStaffId) {
    return (
      <StaffDetailsPage 
        staffId={selectedStaffId} 
        staffDetails={staffDetails}
        isLoading={isLoadingDetails}
        onBack={handleBackToList}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-[#2b2b2b]">Staff Management</h1>
          <p className="text-sm text-[#2b2b2b]/60 mt-1">Manage your staff members and their information.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2" onClick={() => setShowImportDialog(true)}>
                <Upload className="h-4 w-4" />
                Import
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Import Staff</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="import-file">Select CSV File</Label>
                  <Input
                    id="import-file"
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="mt-2"
                  />
                  {importFile && (
                    <p className="text-sm text-gray-600 mt-2">Selected: {importFile.name}</p>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={() => {
                  setShowImportDialog(false);
                  setImportFile(null);
                }}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleBulkImport} 
                  disabled={!importFile || isImporting}
                  className="bg-primary text-white hover:bg-primary/90"
                >
                  {isImporting ? 'Importing...' : 'Import'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" className="gap-2" onClick={handleExportStaff}>
            <Download className="h-4 w-4" />
            Export
          </Button>
          {canCreateStaff && (
            <Button onClick={handleAddStaff} className="bg-primary text-white hover:bg-[#0090e6] gap-2">
              <Plus className="h-4 w-4" />
              Add Staff
            </Button>
          )}
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="bg-white shadow-md border-0">
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
              
              {/* <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by Department" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select> */}

              <Select value={filterStatus} onValueChange={(value: FilterStatus) =>setFilterStatus(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
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
      <Card className="bg-white shadow-md border-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#162f3d] hover:bg-[#162f3d]">
                <TableHead className="text-white font-medium w-12">
                  <Checkbox
                    checked={paginatedStaff.length > 0 && paginatedStaff.every(m => selectedStaff.includes(m.id))}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        const paginatedIds = paginatedStaff.map(m => m.id);
                        setSelectedStaff(prev => {
                          const newSelection = [...prev];
                          paginatedIds.forEach(id => {
                            if (!newSelection.includes(id)) {
                              newSelection.push(id);
                            }
                          });
                          return newSelection;
                        });
                      } else {
                        const paginatedIds = paginatedStaff.map(m => m.id);
                        setSelectedStaff(prev => prev.filter(id => !paginatedIds.includes(id)));
                      }
                    }}
                    className="border-white/30 data-[state=checked]:bg-white data-[state=checked]:text-[#162f3d]"
                  />
                </TableHead>
                <TableHead className="text-white font-medium">ID</TableHead>
                <TableHead className="text-white font-medium">Name</TableHead>
                <TableHead className="text-white font-medium">Phone</TableHead>
                <TableHead className="text-white font-medium">Email</TableHead>
                <TableHead className="text-white font-medium">Address</TableHead>
                <TableHead className="text-white font-medium">Position</TableHead>
                <TableHead className="text-white font-medium">Department</TableHead>
                <TableHead className="text-white font-medium">DOB</TableHead>
                <TableHead className="text-white font-medium">Date of Joining</TableHead>
                <TableHead className="text-white font-medium">Status</TableHead>
                <TableHead className="text-white font-medium">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingStaff ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <span className="ml-2 text-gray-600">Loading staff data...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedStaff.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <div className="text-lg font-medium mb-2">No data available</div>
                      <div className="text-sm">
                        {searchTerm || filterDepartment !== 'all' || filterStatus !== 'all' 
                          ? 'No staff found matching your filters' 
                          : 'No staff data found. Create your first staff member.'}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedStaff.map((member, index) => (
                <TableRow key={member.id} className={index % 2 === 1 ? "bg-[#eff4fa]" : ""}>
                  <TableCell>
                    <Checkbox
                      checked={selectedStaff.includes(member.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedStaff(prev => [...prev, member.id]);
                        } else {
                          setSelectedStaff(prev => prev.filter(id => id !== member.id));
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell className="text-sm text-[#2b2b2b]/80">#{member.id}</TableCell>
                  <TableCell className="text-sm text-[#2b2b2b]/80 font-medium">{member.name}</TableCell>
                  <TableCell className="text-sm text-[#2b2b2b]/80">{member.phone}</TableCell>
                  <TableCell className="text-sm text-gray-900">{member.email}</TableCell>
                  <TableCell className="text-sm text-gray-900 max-w-xs truncate">{member.address}</TableCell>
                  <TableCell className="text-sm text-[#2b2b2b]/80">{member.position}</TableCell>
                  <TableCell className="text-sm text-[#2b2b2b]/80">{member.department}</TableCell>
                  <TableCell className="text-sm text-gray-900">{member.dob}</TableCell>
                  <TableCell className="text-sm text-gray-900">{member.dateOfJoining}</TableCell>
                  <TableCell>{getStatusBadge(member.status)}</TableCell>
                  <TableCell>
                    <ActionButtonsPopup
                      onView={() => handleViewDetails(member.id)}
                      onEdit={() => handleEdit(member)}
                      onDelete={() => handleDelete(member.id)}
                      itemName={member.name}
                      itemType="Staff Member"
                      showView={canViewStaff}
                      showEdit={canEditStaff}
                      showDelete={canDeleteStaff}
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
              fetchStaffData(newPage, itemsPerPage);
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
                fetchStaffData(page, itemsPerPage);
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
              fetchStaffData(newPage, itemsPerPage);
            }}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Unified Staff Modal */}
      <Dialog open={isStaffDialogOpen} onOpenChange={setIsStaffDialogOpen}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit Staff Member' : 'Add New Staff Member'}</DialogTitle>
            <DialogDescription>
              {isEditMode 
                ? 'Update the information below to modify the staff member\'s details.'
                : 'Fill in the information below to add a new staff member to your organization.'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
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
              <Label htmlFor="edit-name">Full Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => {
                  // Only allow letters and spaces
                  const value = e.target.value.replace(/[^a-zA-Z\s]/g, '')
                  setFormData({...formData, name: value})
                  validateField('name', value)
                }}
                placeholder="Enter full name (letters only)"
                className={validationErrors.name ? 'border-red-500' : ''}
              />
              {validationErrors.name && (
                <p className="text-sm text-red-500 mt-1">{validationErrors.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => {
                  setFormData({...formData, email: e.target.value})
                  validateField('email', e.target.value)
                }}
                placeholder="Enter email address"
                className={validationErrors.email ? 'border-red-500' : ''}
              />
              {validationErrors.email && (
                <p className="text-sm text-red-500 mt-1">{validationErrors.email}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone Number *</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => {
                  // Only allow digits and limit to 10 characters
                  const value = e.target.value.replace(/\D/g, '').slice(0, 10)
                  setFormData({...formData, phone: value})
                  validateField('phone', value)
                }}
                placeholder="Enter 10-digit phone number"
                className={validationErrors.phone ? 'border-red-500' : ''}
              />
              {validationErrors.phone && (
                <p className="text-sm text-red-500 mt-1">{validationErrors.phone}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-dob">Date of Birth *</Label>
              <Input
                id="edit-dob"
                type="date"
                value={formData.dob}
                onChange={(e) => {
                  setFormData({...formData, dob: e.target.value})
                  validateField('dob', e.target.value)
                }}
                className={validationErrors.dob ? 'border-red-500' : ''}
                max={new Date().toISOString().split('T')[0]}
              />
              {validationErrors.dob && (
                <p className="text-sm text-red-500 mt-1">{validationErrors.dob}</p>
              )}
            </div>
            <AutoSuggestInput
              label="Position"
              value={formData.position}
              onChange={(value) => {
                setFormData({...formData, position: value})
                validateField('position', value)
              }}
              onValidate={(value) => validateField('position', value)}
              placeholder="Enter or select position"
              suggestions={positions}
              error={validationErrors.position}
              required={true}
            />
            <AutoSuggestInput
              label="Department"
              value={formData.department}
              onChange={(value) => {
                setFormData({...formData, department: value})
                validateField('department', value)
              }}
              onValidate={(value) => validateField('department', value)}
              placeholder="Enter or select department"
              suggestions={departments}
              error={validationErrors.department}
              required={true}
            />
           
            <div className="col-span-2 space-y-2">
              <Label htmlFor="edit-address">Address</Label>
              <Input
                id="edit-address"
                value={formData.address}
                onChange={(e) => {
                  setFormData({...formData, address: e.target.value})
                  validateField('address', e.target.value)
                }}
                placeholder="Enter full address"
                className={validationErrors.address ? 'border-red-500' : ''}
              />
              {validationErrors.address && (
                <p className="text-sm text-red-500 mt-1">{validationErrors.address}</p>
              )}
            </div>
             <div className="space-y-2">
              <Label htmlFor="edit-dateOfJoining">Date of Joining *</Label>
              <Input
                id="edit-dateOfJoining"
                type="date"
                value={formData.dateOfJoining}
                onChange={(e) => {
                  setFormData({...formData, dateOfJoining: e.target.value})
                  validateField('dateOfJoining', e.target.value)
                }}
                className={validationErrors.dateOfJoining ? 'border-red-500' : ''}
              />
              {validationErrors.dateOfJoining && (
                <p className="text-sm text-red-500 mt-1">{validationErrors.dateOfJoining}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select value={formData.status} onValueChange={(value: 'active' | 'inactive') => setFormData({...formData, status: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem> 
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => {
              setIsStaffDialogOpen(false)
              setIsEditMode(false)
              setEditingStaff(null)
              setValidationErrors({})
            }}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="bg-primary text-white hover:bg-[#0090e6]">
              {isEditMode ? 'Update Staff' : 'Create Staff'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}