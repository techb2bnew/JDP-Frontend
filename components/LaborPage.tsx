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
import { Checkbox } from './ui/checkbox'
import { ActionButtonsPopup } from './ActionButtonsPopup'
import { usePermissions } from '../contexts/PermissionContext'
import { AutoSuggestInput } from './ui/auto-suggest-input'
import { toast } from 'sonner'
import { getAuthToken, handleTokenRevocation } from '../utils/globalApiHandler'
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye,
  Upload,
  Download,
  Wrench,
  Shield,
  MapPin
} from 'lucide-react'
import { apiClient } from '@/utils/api'
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input'
import 'react-phone-number-input/style.css'

interface Labor {
  id: string
  laborId: string
  name: string
  email: string
  phone: string
  address: string
  trade: string
  experience: string
  hourlyRate: number
  availability: 'available' | 'assigned' | 'on-leave' | 'unavailable'
  jobsCompleted: number
  dateOfJoining: string
  supervisor: string
  certifications: string[]
  skills: string[]
  notes?: string
}

interface LaborFormData {
  full_name: string
  email: string
  phone: string
  dob: string
  address: string
  date_of_joining: string
  status: 'active' | 'inactive'
  trade: string
  experience: string
  hourly_rate: number
  supervisor_id: string
  availability: string
  certifications: string[]
  skills: string[]
  notes: string
  role: string
}

interface LaborPageProps {
  onViewDetails?: (id: string) => void
}



 

const availableCertifications = [
  'Basic Electrical Safety',
  'First Aid',
  'Cable Installation',
  'Safety Officer',
  'Equipment Operation',
  'Workplace Safety',
  'Tool Operation',
  'Basic Electronics'
]

const skillOptions = [
  'Wire Installation',
  'Basic Troubleshooting',
  'Tool Maintenance',
  'Cable Running',
  'Conduit Installation',
  'Equipment Setup',
  'Material Handling',
  'Site Cleanup',
  'Basic Measurements',
  'Documentation'
]

export function LaborPage({ onViewDetails }: LaborPageProps) {
  const { hasPermission, permissions } = usePermissions()
  const [laborers, setLaborers] = useState<Labor[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingLabor, setEditingLabor] = useState<Labor | null>(null)
  const [filterTrade, setFilterTrade] = useState<string>('all')
  const [filterAvailability, setFilterAvailability] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Check if user is admin (has no specific permissions but should see all actions)
  const isAdmin = permissions.length === 0
  const [roles, setRoles] = useState<any[]>([])
  const [leadLabours, setLeadLabours] = useState<any[]>([])
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [isLoadingLabor, setIsLoadingLabor] = useState(false)
  const [trades, setTrades] = useState<string[]>([])

  // Permission checks for labour module
  const canViewLabour = isAdmin || hasPermission('labour', 'view')
  const canCreateLabour = isAdmin || hasPermission('labour', 'create')
  const canEditLabour = isAdmin || hasPermission('labour', 'edit')
  const canDeleteLabour = isAdmin || hasPermission('labour', 'delete')
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL
  const [totalLabor, setTotalLabor] = useState(0)
  const [filteredLabors, setFilteredLabors] = useState<any[]>([]);
  const [selectedLabors, setSelectedLabors] = useState<string[]>([])
  const [laborStats, setLaborStats] = useState({
    total_labor: 0,
    active_labor: 0,
    inactive_labor: 0,
    total_jobs: 0
  })
  const [isStatsLoading, setIsStatsLoading] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)

  const [formData, setFormData] = useState<LaborFormData>({
    role: '',
    full_name: '',
    email: '',
    phone: '',
    dob: '',
    address: '',
    date_of_joining: '',
    status: 'active', 
    trade: '',
    experience: '',
    hourly_rate: 0,
    supervisor_id: '',
    availability: 'Full-time',
    certifications: [],
    skills: [],
    notes: '',
  })

  const generateLaborId = () => {
    const year = new Date().getFullYear()
    const count = laborers.length + 1
    return `LB-${year}-${String(count).padStart(3, '0')}`
  }

const getAvailabilityBadge = (availability: string) => {
    const normalized = (availability || '').toLowerCase()
    switch (normalized) {
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
            {availability}
          </Badge>
        )
    }
  }

  // const filteredLaborers = laborers.filter(labor => {
  //   const matchesSearch = labor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //                        labor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //                        labor.phone.includes(searchTerm) ||
  //                        labor.laborId.includes(searchTerm) ||
  //                        labor.trade.toLowerCase().includes(searchTerm.toLowerCase())
    
  //   const matchesTrade = filterTrade === 'all' || labor.trade === filterTrade
  //   const matchesAvailability = filterAvailability === 'all' || labor.availability === filterAvailability
    
  //   return matchesSearch && matchesTrade && matchesAvailability
  // })

 
    const paginatedLaborers = filteredLabors
  const totalPages = Math.ceil(totalLabor / itemsPerPage)

  const handleCreate = async () => {
    // Validation
    if (!formData.role || !formData.full_name || !formData.email || !formData.phone || !formData.dob || 
        !formData.address || !formData.date_of_joining || !formData.trade || 
        !formData.experience || !formData.supervisor_id ) {
      const errors: Record<string, string> = {};
      if (!formData.role) errors.role = 'Role is required';
      if (!formData.full_name) errors.full_name = 'Full name is required';
      if (!formData.email) errors.email = 'Email is required';
      if (!formData.phone) errors.phone = 'Phone is required';
      if (!formData.dob) errors.dob = 'Date of Birth is required';
      if (formData.dob && new Date(formData.dob) > new Date()) {
        errors.dob = 'Date of Birth cannot be in the future';
      }
      if (!formData.address) errors.address = 'Address is required';
      if (!formData.date_of_joining) errors.date_of_joining = 'Date of Joining is required';
      if (!formData.trade) errors.trade = 'Trade is required';
      if (!formData.experience) errors.experience = 'Experience is required';
      if (!formData.supervisor_id) errors.supervisor_id = 'Supervisor is required';
      
      setValidationErrors(errors);
      toast.error('Please fill in all required fields');
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      const errors = {...validationErrors, email: 'Please enter a valid email address'};
      setValidationErrors(errors);
      toast.error('Please enter a valid email address');
      return;
    }

    // Phone number validation (country-aware)
    if (!isValidPhoneNumber(formData.phone || '')) {
      const errors = { ...validationErrors, phone: 'Please enter a valid phone number' };
      setValidationErrors(errors);
      toast.error('Please enter a valid phone number');
      return;
    }

    let loadingToastId: string | number | undefined;
    
    try {
      loadingToastId = toast.loading('Creating labor worker...');
      
      const token = localStorage.getItem('jdp_auth') ? JSON.parse(localStorage.getItem('jdp_auth')!).token : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // Prepare payload according to API requirements
      const payload = {
        full_name: formData.full_name,
        email: formData.email.toLowerCase(),
        phone: formData.phone,
        dob: formData.dob,
        address: formData.address,
        date_of_joining: formData.date_of_joining,
        status: formData.status,
        trade: formData.trade,
        experience: formData.experience,
        hourly_rate: formData.hourly_rate,
        supervisor_id: parseInt(formData.supervisor_id),
        availability: formData.availability,
        certifications: formData.certifications,
        skills: formData.skills,
        notes: formData.notes,
        role: formData.role,
        management_type: "labor"
      };

      const response = await fetch(`${apiBaseUrl}/labor/createLabor`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      toast.dismiss(loadingToastId);

      if (response.ok) {
        const responseData = await response.json();
        if (responseData.success) {
          toast.success('Labor worker created successfully!');
          setIsCreateDialogOpen(false);
          resetForm();
          setValidationErrors({});
          // Refresh the labor list and stats
          fetchLaborData(currentPage, itemsPerPage);
          fetchLaborStats();
        } else {
          toast.error(`Failed to create labor worker: ${responseData.message || 'Unknown error'}`);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(`Failed to create labor worker: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      toast.dismiss(loadingToastId);
      console.error('Error creating labor worker:', error);
      toast.error('An error occurred while creating labor worker');
    }
  }

  const handleEdit = async (labor: Labor) => {
    setEditingLabor(labor)
    setIsEditDialogOpen(true)
    
    // Fetch fresh data from API using labor ID
    await fetchLaborById(labor.id)
  }

  const handleUpdate = async () => {
    if (!editingLabor) return

    // Validation
    if (!formData.role || !formData.full_name || !formData.email || !formData.phone || !formData.dob || 
        !formData.address || !formData.date_of_joining || !formData.trade || 
        !formData.experience || !formData.supervisor_id) {
      const errors: Record<string, string> = {};
      if (!formData.role) errors.role = 'Role is required';
      if (!formData.full_name) errors.full_name = 'Full name is required';
      if (!formData.email) errors.email = 'Email is required';
      if (!formData.phone) errors.phone = 'Phone is required';
      if (!formData.dob) errors.dob = 'Date of Birth is required';
      if (formData.dob && new Date(formData.dob) > new Date()) {
        errors.dob = 'Date of Birth cannot be in the future';
      }
      if (!formData.address) errors.address = 'Address is required';
      if (!formData.date_of_joining) errors.date_of_joining = 'Date of Joining is required';
      if (!formData.trade) errors.trade = 'Trade is required';
      if (!formData.experience) errors.experience = 'Experience is required';
      if (!formData.supervisor_id) errors.supervisor_id = 'Supervisor is required';
      
      setValidationErrors(errors);
      toast.error('Please fill in all required fields');
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      const errors = {...validationErrors, email: 'Please enter a valid email address'};
      setValidationErrors(errors);
      toast.error('Please enter a valid email address');
      return;
    }

    // Phone number validation (country-aware)
    if (!isValidPhoneNumber(formData.phone || '')) {
      const errors = { ...validationErrors, phone: 'Please enter a valid phone number' };
      setValidationErrors(errors);
      toast.error('Please enter a valid phone number');
      return;
    }

    let loadingToastId: string | number | undefined;
    
    try {
      loadingToastId = toast.loading('Updating labor worker...');
      
      const token = localStorage.getItem('jdp_auth') ? JSON.parse(localStorage.getItem('jdp_auth')!).token : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // Prepare payload according to API requirements
      const payload = {
        full_name: formData.full_name,
        email: formData.email.toLowerCase(),
        phone: formData.phone,
        dob: formData.dob,
        address: formData.address,
        date_of_joining: formData.date_of_joining,
        status: formData.status,
        trade: formData.trade,
        experience: formData.experience,
        hourly_rate: formData.hourly_rate,
        supervisor_id: parseInt(formData.supervisor_id),
        availability: formData.availability,
        certifications: formData.certifications,
        skills: formData.skills,
        notes: formData.notes,
        role: formData.role,
        management_type: "labor"
      };

      const response = await fetch(`${apiBaseUrl}/labor/updateLabor/${editingLabor.id}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      toast.dismiss(loadingToastId);

      if (response.ok) {
        const responseData = await response.json();
        if (responseData.success) {
          toast.success('Labor worker updated successfully!');
          setIsEditDialogOpen(false);
          setEditingLabor(null);
          resetForm();
          setValidationErrors({});
          // Refresh the labor list and stats
          fetchLaborData(currentPage, itemsPerPage);
          fetchLaborStats();
        } else {
          toast.error(`Failed to update labor worker: ${responseData.message || 'Unknown error'}`);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(`Failed to update labor worker: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      toast.dismiss(loadingToastId);
      console.error('Error updating labor worker:', error);
      toast.error('An error occurred while updating labor worker');
    }
  }

  const handleDelete = async (id: string) => {
    let loadingToastId: string | number | undefined;

    try {
      loadingToastId = toast.loading('Deleting labor worker...');
      
      const token = localStorage.getItem('jdp_auth') ? JSON.parse(localStorage.getItem('jdp_auth')!).token : null;
      const headers: Record<string, string> = { };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${apiBaseUrl}/labor/deleteLabor/${id}`, {
        method: 'DELETE',
        headers
      });

      // Dismiss loading toast
      if (loadingToastId) {
        toast.dismiss(loadingToastId);
      }

      if (response.ok) {
        const responseData = await response.json();
        if (responseData.success) {
          toast.success('Labor worker deleted successfully');
          // Refresh the data and stats
          fetchLaborData(currentPage, itemsPerPage);
          fetchLaborStats();
        } else {
          toast.error(responseData.message || 'Failed to delete labor worker');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.message || 'Failed to delete labor worker');
      }
    } catch (error) {
      // Make sure to dismiss loading toast even on error
      if (loadingToastId) {
        toast.dismiss(loadingToastId);
      }
      console.error('Error deleting labor worker:', error);
      toast.error('Error deleting labor worker. Please try again.');
    }
  }

  const resetForm = () => {
    setFormData({
      full_name: '',
      email: '',
      phone: '',
      dob: '',
      address: '',
      date_of_joining: '',
      status: 'active',
      trade: '',
      experience: '',
      hourly_rate: 0,
      supervisor_id: '',
      availability: 'Full-time',
      certifications: [],
      skills: [],
      notes: '',
      role: ''
    })
    setValidationErrors({})
  }

  const handleCertificationChange = (certification: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        certifications: [...prev.certifications, certification]
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        certifications: prev.certifications.filter(c => c !== certification)
      }))
    }
  }

  const handleSkillChange = (skill: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skill]
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        skills: prev.skills.filter(s => s !== skill)
      }))
    }
  }

  function convertToCSV(data: Labor[]) {
  const headers = [
    'ID',
    'Labor ID',
    'Name',
    'Email',
    'Phone',
    'Address',
    'Trade',
    'Experience',
    'Hourly Rate',
    'Availability',
    'Assigned Jobs',
    'Date of Joining',
    'Supervisor',
    'Certifications',
    'Skills',
    'Notes'
  ].join(',');

  const rows = data.map(labor => [
    labor.id,
    labor.laborId,
    labor.name,
    labor.email,
    labor.phone,
    labor.address,
    labor.trade,
    labor.experience,
    labor.hourlyRate,
    labor.availability,
    labor.jobsCompleted,
    labor.dateOfJoining,
    labor.supervisor,
    labor.certifications.join('; '),
    labor.skills.join('; '),
    labor.notes || ''
  ].map(field => `"${field?.toString().replace(/"/g, '""')}"`).join(','));

  return [headers, ...rows].join('\n');
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
      const response = await fetch(`${apiBaseUrl}/labor/import`, {
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
        throw new Error(responseData.message || 'Failed to import labor');
      }

      if (responseData.success) {
        toast.success(responseData.message || 'Successfully imported labor!');
        setShowImportDialog(false);
        setImportFile(null);
        
        // Refresh labor list
        fetchLaborData(currentPage, itemsPerPage);
      } else {
        throw new Error(responseData.message || 'Failed to import labor');
      }
    } catch (error) {
      console.error('Error importing labor:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to import labor');
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

function downloadCSV(data: Labor[], filename: string) {
  const csv = convertToCSV(data);
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
  fetchLeadLabourData();
  // Don't fetch data here - let the search/pagination useEffect handle initial fetch
}, []);

// Clear selected labors when pagination, filters, or search changes
useEffect(() => {
  setSelectedLabors([]);
}, [currentPage, filterTrade, filterAvailability, searchTerm]);
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
const fetchLeadLabourData = async () => {
  try {
    const token = localStorage.getItem('jdp_auth') ? JSON.parse(localStorage.getItem('jdp_auth')!).token : null;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${apiBaseUrl}/lead-labor/getAllLeadLabor`, {
      method: 'GET',
      headers
    });

    if (response.ok) {
      const responseData = await response.json();
      
      if (responseData.success && responseData.data && responseData.data.data && Array.isArray(responseData.data.data)) {
        // Map API response to simple structure for supervisor dropdown
        const mappedData = responseData.data.data.map((item: any) => ({
          id: item.users?.id,
          full_name: item.users?.full_name || 'N/A',
          email: item.users?.email || 'N/A',
          phone: item.users?.phone || 'N/A',
          role: item.users?.role || 'Lead Labour'
        }));

        setLeadLabours(mappedData);
      } else {
        console.error('Invalid response structure:', responseData);
        setLeadLabours([]); // Set empty array as fallback
      }
    } else {
      console.error('Failed to fetch lead labour data:', response.status, response.statusText);
      setLeadLabours([]); // Set empty array as fallback
    }
  } catch (error) {
    console.error('Error fetching lead labour data:', error);
    setLeadLabours([]); // Set empty array as fallback
  }
};



const fetchLaborData = async (page: number = 1, limit: number = 10) => {
  setIsLoadingLabor(true);
  try {
    const token = localStorage.getItem('jdp_auth') ? JSON.parse(localStorage.getItem('jdp_auth')!).token : null;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${apiBaseUrl}/labor/getAllLabor?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers
    });

    if (response.ok) {
      const responseData = await response.json();
      
      if (responseData.success && responseData.data && responseData.data.data && Array.isArray(responseData.data.data)) {
        // Map API response to component data structure
        const mappedData = responseData.data.data.map((item: any) => ({
          id: item.id.toString(),
          laborId: item.labor_code,
          name: item.users?.full_name || 'N/A',
          email: item.users?.email || 'N/A',
          phone: item.users?.phone || 'N/A',
          address: item.address || '',
          trade: item.trade || '',
          experience: item.experience || '',
          hourlyRate: item.hourly_rate || 0,
          availability: item.users.status,  
          jobsCompleted: item.assigned_jobs_count, // Default value since not in API
          dateOfJoining: item.date_of_joining || '',
          supervisor: item.supervisor?.full_name || 'N/A',
          certifications: item.certifications ? [item.certifications] : [],
          skills: Array.isArray(item.skills) ? item.skills : [],
          notes: item.notes || ''
        }));

        setLaborers(mappedData);
        setFilteredLabors(mappedData);
        setTotalLabor(responseData.data.pagination.totalItems || mappedData.length);
        
        // Extract unique trades from API response
        const uniqueTrades = Array.from(new Set(responseData.data?.data?.map((item: any) => item.trade).filter(Boolean))) as string[];
        setTrades(uniqueTrades);
      } else {
        console.error('Invalid labor response structure:', responseData);
        setLaborers([]); // Set empty array as fallback
      }
    } else {
      console.error('Failed to fetch labor data:', response.status, response.statusText);
      setLaborers([]); // Set empty array as fallback
    }
  } catch (error) {
    console.error('Error fetching labor data:', error);
    setLaborers([]); // Set empty array as fallback
  } finally {
    setIsLoadingLabor(false);
  }
};

const fetchBySearchLabor = async () => {
  if (!searchTerm.trim()) return;

  setIsLoadingLabor(true);

  try {
    const response = await apiClient.searchLaborByQuery(searchTerm.trim(), 1, 10);
    const laborData = response.data;
    const laborList = laborData?.labor || [];

    const transformedData = laborList.map((labor: any) => ({
      id: labor.id,
      userId: labor.user_id,
      laborCode: labor.labor_code || 'N/A',
      name: labor.users?.full_name || 'N/A',
      email: labor.users?.email || 'N/A',
      phone: labor.users?.phone || 'N/A',
      role: labor.users?.role || 'N/A',
      status: labor.users?.status || 'N/A',
      dob: labor.dob || 'N/A',
      address: labor.address || 'N/A',
      notes: labor.notes || '',
      dateOfJoining: labor.date_of_joining || 'N/A',
      trade: labor.trade || 'N/A',
      experience: labor.experience || 'N/A',
      hourlyRate: labor.hourly_rate || 0,
      supervisorId: labor.supervisor_id || null,
      availability: labor.availability || 'N/A',
      certifications: labor.certifications || [],
      skills: labor.skills || [],
      createdAt: labor.created_at || '',
      photoUrl: labor.users?.photo_url || null,
      jobId: labor.job_id || null,
      totalCost: labor.total_cost || 0
    }));

    setFilteredLabors(transformedData);
    setTotalLabor(laborData.pagination.total || transformedData.length);
  } catch (error) {
    console.error('Labor search error:', error);
    setFilteredLabors([]);
  } finally {
    setIsLoadingLabor(false);
  }
};


useEffect(() => {
  const debounceTimeout = setTimeout(() => {
    if (!searchTerm.trim()) {
      // Only fetch all when availability filter is 'all'
      if (!filterAvailability || filterAvailability === 'all') {
        fetchLaborData(currentPage, itemsPerPage); 
      }
    } else {
      fetchBySearchLabor();
    }
  }, 500);

  return () => clearTimeout(debounceTimeout);
}, [searchTerm, currentPage, itemsPerPage, filterAvailability]);

useEffect(() => {
  const fetchLaborByStatus = async () => {
    // Don't fetch when 'all' is selected - let the search useEffect handle it
    if (!filterAvailability || filterAvailability === 'all') {
      return;
    }

    setIsLoadingLabor(true);
    try {
      const res = await apiClient.searchLaborByStatus(filterAvailability, 1, itemsPerPage);
      const laborList = res.data?.labor || []; // API returns 'labor'
      const transformed = laborList.map((item: any) => ({
        id: item.id?.toString() || '',
        laborId: item.labor_code,
        name: item.users?.full_name || 'N/A',
        email: item.users?.email || 'N/A',
        phone: item.users?.phone || 'N/A',
        address: item.address || '',
        trade: item.trade || '',
        experience: item.experience || '',
        hourlyRate: item.hourly_rate || 0,
        availability: item.users?.status || 'inactive',
        jobsCompleted: item.assigned_jobs_count,
        dateOfJoining: item.date_of_joining || '',
        supervisor: item.supervisor?.full_name || 'N/A',
        certifications: Array.isArray(item.certifications) ? item.certifications : (item.certifications ? [item.certifications] : []),
        skills: Array.isArray(item.skills) ? item.skills : (item.skills ? [item.skills] : []),
        notes: item.notes || ''
      }));
      setFilteredLabors(transformed);
      setTotalLabor(res.data?.pagination?.total ?? transformed.length ?? 0);
    } catch (err) {
      console.error('Labor filter error:', err);
      setFilteredLabors([]);
      setTotalLabor(0);
    } finally {
      setIsLoadingLabor(false);
    }
  };

  fetchLaborByStatus();
}, [filterAvailability, currentPage, itemsPerPage]);

// Fetch labor statistics
const fetchLaborStats = async () => {
  try {
    setIsStatsLoading(true);
    const response = await apiClient.getManagementStats();
    if (response.success && response.data && response.data.labor) {
      setLaborStats(response.data.labor);
    }
  } catch (error) {
    console.error('Error fetching labor stats:', error);
  } finally {
    setIsStatsLoading(false);
  }
};

useEffect(() => {
  fetchLaborStats();
}, []);



const fetchLaborById = async (id: string) => {
  try {
    const token = localStorage.getItem('jdp_auth') ? JSON.parse(localStorage.getItem('jdp_auth')!).token : null;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${apiBaseUrl}/labor/getLaborById/${id}`, {
      method: 'GET',
      headers
    });

    if (response.ok) {
      const responseData = await response.json();
      
      if (responseData.success && responseData.data) {
        const item = responseData.data;
        
        // Map API response to form data structure
        const formData = {
          full_name: item.users?.full_name || '',
          email: item.users?.email || '',
          phone: item.users?.phone || '',
          dob: item.dob || '',
          address: item.address || '',
          date_of_joining: item.date_of_joining || '',
          status: (item.users?.status === 'active' ? 'active' : 'inactive') as 'active' | 'inactive',
          trade: item.trade || '',
          experience: item.experience || '',
          hourly_rate: item.hourly_rate || 0,
          supervisor_id: item.supervisor_id?.toString() || '',
          availability: item.availability || 'Full-time',
          certifications: Array.isArray(item.certifications) ? item.certifications : 
                         item.certifications ? [item.certifications] : [],
          skills: Array.isArray(item.skills) ? item.skills : 
                 item.skills ? [item.skills] : [],
          notes: item.notes || '',
          role: item.users?.role || 'Labor'
        };

        setFormData(formData);
        return formData;
      } else {
        console.error('Invalid labor by ID response structure:', responseData);
        toast.error('Failed to load labor data');
      }
    } else {
      console.error('Failed to fetch labor by ID:', response.status, response.statusText);
      toast.error('Failed to load labor data');
    }
  } catch (error) {
    console.error('Error fetching labor by ID:', error);
    toast.error('Failed to load labor data');
  }
};
  const renderForm = () => (
    <div className="grid grid-cols-2 gap-4 py-4 max-h-[65vh] overflow-y-auto p-2">
      <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select value={formData.role} onValueChange={(value) => {
                setFormData({...formData, role: value})
                if (validationErrors.role) {
                  setValidationErrors({...validationErrors, role: ''})
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
        <Label htmlFor="full_name">Full Name *</Label>
        <Input
          id="full_name"
          value={formData.full_name}
          onChange={(e) => {
            setFormData({...formData, full_name: e.target.value})
            if (validationErrors.full_name) {
              setValidationErrors({...validationErrors, full_name: ''})
            }
          }}
          placeholder="Enter full name"
          className={validationErrors.full_name ? 'border-red-500' : ''}
        />
        {validationErrors.full_name && (
          <p className="text-sm text-red-500 mt-1">{validationErrors.full_name}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => {
            setFormData({...formData, email: e.target.value})
            if (validationErrors.email) {
              setValidationErrors({...validationErrors, email: ''})
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
        <PhoneInput
          id="phone"
          international
          defaultCountry="US"
          value={formData.phone}
          onChange={(value) => {
            const safeValue = value || ''
            setFormData({ ...formData, phone: safeValue })
            if (validationErrors.phone) {
              setValidationErrors({ ...validationErrors, phone: '' })
            }
          }}
          placeholder="Enter phone number"
          className={
            validationErrors.phone
              ? 'border border-red-500 rounded-md px-2 py-2'
              : 'border border-gray-300 rounded-md px-2 py-2'
          }
        />
        {validationErrors.phone && (
          <p className="text-sm text-red-500 mt-1">{validationErrors.phone}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="dob">Date of Birth *</Label>
        <Input
          id="dob"
          type="date"
          value={formData.dob}
          className={validationErrors.dob ? 'border-red-500' : ''}
          onChange={(e) => {
            setFormData({...formData, dob: e.target.value})
            if (validationErrors.dob) {
              setValidationErrors({...validationErrors, dob: ''})
            }
          }}
          max={new Date().toISOString().split('T')[0]}
        />
        {validationErrors.dob && (
          <p className="text-sm text-red-500 mt-1">{validationErrors.dob}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="date_of_joining">Date of Joining *</Label>
        <Input
          id="date_of_joining"
          type="date"
          className={validationErrors.date_of_joining ? 'border-red-500' : ''}
          value={formData.date_of_joining}
          onChange={(e) => {
            setFormData({...formData, date_of_joining: e.target.value})
            if (validationErrors.date_of_joining) {
              setValidationErrors({...validationErrors, date_of_joining: ''})
            }
          }}
        />
        {validationErrors.date_of_joining && (
          <p className="text-sm text-red-500 mt-1">{validationErrors.date_of_joining}</p>
        )}
      </div>
      
      <div className="col-span-2 space-y-2">
        <Label htmlFor="address">Address *</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => {
            setFormData({...formData, address: e.target.value})
            if (validationErrors.address) {
              setValidationErrors({...validationErrors, address: ''})
            }
          }}
          placeholder="Enter full address"
          className={validationErrors.address ? 'border-red-500' : ''}
        />
        {validationErrors.address && (
          <p className="text-sm text-red-500 mt-1">{validationErrors.address}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <AutoSuggestInput
          label="Trade"
          value={formData.trade}
          onChange={(value) => {
            setFormData({...formData, trade: value})
            if (validationErrors.trade) {
              setValidationErrors({...validationErrors, trade: ''})
            }
          }}
          suggestions={trades}
          placeholder="Enter trade"
          error={validationErrors.trade}
          required={true}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="experience">Experience *</Label>
        <Input
          id="experience"
          value={formData.experience}
          onChange={(e) => {
            setFormData({...formData, experience: e.target.value})
            if (validationErrors.experience) {
              setValidationErrors({...validationErrors, experience: ''})
            }
          }}
          placeholder="e.g., 3 years"
          className={validationErrors.experience ? 'border-red-500' : ''}
        />
        {validationErrors.experience && (
          <p className="text-sm text-red-500 mt-1">{validationErrors.experience}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="hourly_rate">Hourly Rate ($)</Label>
        <Input
          id="hourly_rate"
          type="number"
          step="0.01"
          value={formData.hourly_rate || ''}
          onChange={(e) => setFormData({...formData, hourly_rate: Number(e.target.value)})}
          placeholder="Enter hourly rate"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="supervisor_id">Supervisor *</Label>
        <Select value={formData.supervisor_id} onValueChange={(value) => {
          setFormData({...formData, supervisor_id: value})
          if (validationErrors.supervisor_id) {
            setValidationErrors({...validationErrors, supervisor_id: ''})
          }
        }}>
          <SelectTrigger className={validationErrors.supervisor_id ? 'border-red-500' : ''}>
            <SelectValue placeholder="Select supervisor" />
          </SelectTrigger>
          <SelectContent>
            {leadLabours.map((supervisor) => (
              <SelectItem key={supervisor.id} value={supervisor.id.toString()}>
                {supervisor.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {validationErrors.supervisor_id && (
          <p className="text-sm text-red-500 mt-1">{validationErrors.supervisor_id}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="availability">Availability</Label>
        <Select value={formData.availability} onValueChange={(value) => setFormData({...formData, availability: value})}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Full-time">Full-time</SelectItem>
            <SelectItem value="Part-time">Part-time</SelectItem>
            <SelectItem value="Contract">Contract</SelectItem>
            <SelectItem value="On-call">On-call</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
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
      
      <div className="col-span-2 space-y-2">
        <Label>Certifications</Label>
        <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded p-2">
          {availableCertifications.map((cert) => (
            <div key={cert} className="flex items-center space-x-2">
              <Checkbox
                id={`cert-${cert}`}
                checked={formData.certifications.includes(cert)}
                onCheckedChange={(checked) => handleCertificationChange(cert, checked as boolean)}
              />
              <Label htmlFor={`cert-${cert}`} className="text-sm">{cert}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="col-span-2 space-y-2">
        <Label>Skills</Label>
        <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded p-2">
          {skillOptions.map((skill) => (
            <div key={skill} className="flex items-center space-x-2">
              <Checkbox
                id={`skill-${skill}`}
                checked={formData.skills.includes(skill)}
                onCheckedChange={(checked) => handleSkillChange(skill, checked as boolean)}
              />
              <Label htmlFor={`skill-${skill}`} className="text-sm">{skill}</Label>
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
          placeholder="Enter any additional notes"
          rows={3}
        />
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-medium text-[#2b2b2b]">Labor Management</h2>
          <p className="text-sm text-[#2b2b2b]/60 mt-1">Manage your labor workforce and their assignments.</p>
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
                <DialogTitle>Import Labor</DialogTitle>
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
          <Button variant="outline" className="gap-2" onClick={() => {
            if (selectedLabors.length === 0) {
              toast.error('Please select at least one labor to export');
              return;
            }
            const selectedLaborData = filteredLabors.filter(labor => selectedLabors.includes(String(labor.id)));
            downloadCSV(selectedLaborData, `labor-export-${new Date().toISOString().split('T')[0]}.csv`);
          }}>
            <Download className="h-4 w-4" />
            Export
          </Button>
          {canCreateLabour && (
            <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
              setIsCreateDialogOpen(open);
              if (open) {
                resetForm();
                setValidationErrors({});
              }
            }}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-white hover:bg-[#0090e6] gap-2">
                  <Plus className="h-4 w-4" />
                  Add Labor Worker
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh]">
                <DialogHeader>
                  <DialogTitle>Add New Labor Worker</DialogTitle>
                </DialogHeader>
                {renderForm()}
                <div className="flex justify-end gap-3 mt-6">
                  <Button variant="outline" onClick={() => {setIsCreateDialogOpen(false); resetForm();}}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreate} className="bg-primary text-white hover:bg-[#0090e6]">
                    Create Labor Worker
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white shadow-md border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Wrench className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-medium text-[#2b2b2b]">
                  {isStatsLoading ? '...' : laborStats.active_labor}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow-md border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Inactive</p>
                <p className="text-2xl font-medium text-[#2b2b2b]">
                  {isStatsLoading ? '...' : laborStats.inactive_labor}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow-md border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#E6F6FF] rounded-lg">
                <Wrench className="h-6 w-6 text-[#00A1FF]" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Jobs</p>
                <p className="text-2xl font-medium text-[#2b2b2b]">
                  {isStatsLoading ? '...' : laborStats.total_jobs}
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
                <p className="text-sm text-gray-600">Total Workers</p>
                <p className="text-2xl font-medium text-[#2b2b2b]">
                  {isStatsLoading ? '...' : laborStats.total_labor}
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
                  placeholder="Search labor workers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {/* <Select value={filterTrade} onValueChange={setFilterTrade}>
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="Filter by Trade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Trades</SelectItem>
                  {trades.map((trade) => (
                    <SelectItem key={trade} value={trade}>{trade}</SelectItem>
                  ))}
                </SelectContent>
              </Select> */}

              <Select value={filterAvailability} onValueChange={setFilterAvailability}>
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
              <span>Total: {filteredLabors.length}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Labor Table */}
      <Card className="bg-white shadow-md border-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#162f3d] hover:bg-[#162f3d]">
                <TableHead className="text-white font-medium w-12">
                  <Checkbox
                    checked={paginatedLaborers.length > 0 && paginatedLaborers.every(l => selectedLabors.includes(String(l.id)))}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        const paginatedIds = paginatedLaborers.map(l => String(l.id));
                        setSelectedLabors(prev => {
                          const newSelection = [...prev];
                          paginatedIds.forEach(id => {
                            if (!newSelection.includes(id)) {
                              newSelection.push(id);
                            }
                          });
                          return newSelection;
                        });
                      } else {
                        const paginatedIds = paginatedLaborers.map(l => String(l.id));
                        setSelectedLabors(prev => prev.filter(id => !paginatedIds.includes(id)));
                      }
                    }}
                    className="border-white/30 data-[state=checked]:bg-white data-[state=checked]:text-[#162f3d]"
                  />
                </TableHead>
                <TableHead className="text-white font-medium">ID</TableHead>
                <TableHead className="text-white font-medium">Name</TableHead>
                <TableHead className="text-white font-medium">Contact</TableHead>
                <TableHead className="text-white font-medium">Trade</TableHead>
                <TableHead className="text-white font-medium">Experience</TableHead>
                <TableHead className="text-white font-medium">Rate/Hour</TableHead>
                <TableHead className="text-white font-medium">Jobs</TableHead>
                <TableHead className="text-white font-medium">Supervisor</TableHead>
                <TableHead className="text-white font-medium">Availability</TableHead>
                <TableHead className="text-white font-medium">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingLabor ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <span className="ml-2 text-gray-600">Loading labor data...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedLaborers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <div className="text-lg font-medium mb-2">No data available</div>
                      <div className="text-sm">
                        {searchTerm || filterTrade !== 'all' || filterAvailability !== 'all' 
                          ? 'No labor found matching your filters' 
                          : 'No labor data found. Create your first labor record.'}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedLaborers.map((labor, index) => (
                  <TableRow key={labor.id} className={index % 2 === 1 ? "bg-[#eff4fa]" : ""}>
                    <TableCell>
                      <Checkbox
                        checked={selectedLabors.includes(String(labor.id))}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedLabors(prev => [...prev, String(labor.id)]);
                          } else {
                            setSelectedLabors(prev => prev.filter(id => id !== String(labor.id)));
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell className="text-sm text-[#2b2b2b]/80">#{labor.laborId}</TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm font-medium text-[#2b2b2b]/80">{labor.name}</div>
                        <div className="text-xs text-gray-500">{labor.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm text-[#2b2b2b]/80">{labor.phone}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {labor.address.split(',')[0]}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-[#2b2b2b]/80">{labor.trade}</TableCell>
                    <TableCell className="text-sm text-[#2b2b2b]/80">{labor.experience}</TableCell>
                    <TableCell className="text-sm text-[#2b2b2b]/80">${labor.hourlyRate}</TableCell>
                    <TableCell className="text-sm text-[#2b2b2b]/80">{labor.jobsCompleted}</TableCell>
                    <TableCell className="text-sm text-[#2b2b2b]/80">{labor.supervisor}</TableCell>
                    <TableCell>{getAvailabilityBadge(labor.availability)}</TableCell>
                    <TableCell>
                      <ActionButtonsPopup
                        onView={onViewDetails ? () => onViewDetails(labor.id) : undefined}
                        onEdit={() => handleEdit(labor)}
                        onDelete={() => handleDelete(labor.id)}
                        itemName={labor.name}
                        itemType="Labor Worker"
                        showView={!!onViewDetails && canViewLabour}
                        showEdit={canEditLabour}
                        showDelete={canDeleteLabour}
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
    
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              const newPage = Math.max(currentPage - 1, 1);
              setCurrentPage(newPage);
              fetchLaborData(newPage, itemsPerPage);
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
                fetchLaborData(page, itemsPerPage);
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
              fetchLaborData(newPage, itemsPerPage);
            }}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
    

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) {
          setEditingLabor(null);
          resetForm();
          setValidationErrors({});
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Edit Labor Worker</DialogTitle>
          </DialogHeader>
          {renderForm()}
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => {
              setIsEditDialogOpen(false);
              setEditingLabor(null);
              resetForm();
              setValidationErrors({});
            }}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} className="bg-primary text-white hover:bg-[#0090e6]">
              Update Labor Worker
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}