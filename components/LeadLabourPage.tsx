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
import { LeadLabourDetailsPage } from './LeadLabourDetailsPage'
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
  HardHat,
  Calendar,
  MapPin,
  FileText,
  Camera,
  Shield,
  X,
  Briefcase
} from 'lucide-react'
import Image from 'next/image'
import { apiClient } from '@/utils/api'
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import Autocomplete from "react-google-autocomplete";

interface LeadLabour {
  id: string | number
  leadLabourId: string
  name: string
  email: string
  phone: string
  dob: string
  address: string
  notes: string
  department: string
  dateOfJoining: string
  specialization: string
  experience: string
  trade?: string
  role?: string
  status?: string
  idProofUrl?: string
  photoUrl?: string
  resumeUrl?: string
  createdAt?: string
  agreedTerms?: boolean
  certifications: string[]
  hourly_rate: number | string
  availability: 'available' | 'assigned' | 'on-leave' | 'unavailable' | string
  jobsCompleted: number
  lastAssignment: string
  skills: string[]
  emergencyContact: string
  documents: {
    idProof: { name: string; url: string } | null
    photo: { name: string; url: string } | null
    resume: { name: string; url: string } | null
  }
  permissions: {
    createJob: boolean
    addClient: boolean
    orderInventoryPrice: boolean
    invoicePrice: boolean
    invoiceGenerate: boolean
    closeJob: boolean
    changeLaborTime: boolean
  }
  agreeToTerms: boolean
}

interface LeadLabourFormData {
  role: string
  name: string
  email: string
  phone: string
  dob: string
  address: string
  notes: string
  department: string
  dateOfJoining: string
  specialization: string
  experience: string
  hourly_rate:string | number
  status: 'active' | 'inactive'
  certifications: string[]
  availability: 'available' | 'assigned' | 'on-leave' | 'unavailable'
  jobsCompleted: number
  lastAssignment: string
  skills: string[]
  emergencyContact: string
  documents: {
    idProof: File | { name: string; url: string } | null
    photo: File | { name: string; url: string } | null
    resume: File | { name: string; url: string } | null
  }
  permissions: {
    createJob: boolean
    addClient: boolean
    orderInventoryPrice: boolean
    invoicePrice: boolean
    invoiceGenerate: boolean
    closeJob: boolean
    changeLaborTime: boolean
  }
  agreeToTerms: boolean
}


interface LeadLabourPageProps {
  onViewDetails?: (id: string) => void
}

export function LeadLabourPage({ onViewDetails }: LeadLabourPageProps) {
  const { hasPermission, permissions } = usePermissions()
  const [leadLabours, setLeadLabours] = useState<LeadLabour[]>([])
  const [isLoadingLeadLabour, setIsLoadingLeadLabour] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingLeadLabour, setEditingLeadLabour] = useState<LeadLabour | null>(null)
  const [filterSpecialization, setFilterSpecialization] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [roles, setRoles] = useState<any[]>([])
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [departments, setDepartments] = useState<string[]>([])
  const [specializations, setSpecializations] = useState<string[]>([])
  const [totalLead, setTotalLead] = useState(0)
  const [showDetails, setShowDetails] = useState(false)
  const [selectedLeadLabourId, setSelectedLeadLabourId] = useState<number | null>(null)
  const [selectedLeadLabours, setSelectedLeadLabours] = useState<string[]>([])
  const [leadLabourDetails, setLeadLabourDetails] = useState<any>(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [leadLaborStats, setLeadLaborStats] = useState({
    total_lead_labor: 0,
    active_lead_labor: 0,
    inactive_lead_labor: 0,
    total_jobs: 0
  })
  const [isStatsLoading, setIsStatsLoading] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL

  // Fix Google Autocomplete dropdown z-index and pointer events for Dialog
  useEffect(() => {
    if (!isCreateDialogOpen && !isEditDialogOpen) return;

    const style = document.createElement("style");
    style.id = "google-autocomplete-styles-leadlabour";
    style.textContent = `
      .pac-container {
        z-index: 999999 !important;
        border-radius: 8px !important;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
        margin-top: 4px !important;
        position: absolute !important;
      }
      .pac-item {
        padding: 8px 12px !important;
        cursor: pointer !important;
        pointer-events: auto !important;
      }
      .pac-item:hover { background-color: #f3f4f6 !important; }
      .pac-item-selected { background-color: #e5e7eb !important; }
      /* Disable DialogOverlay when pac-container is visible */
      .pac-container:not([style*="display: none"]) ~ * [data-radix-dialog-overlay],
      body:has(.pac-container:not([style*="display: none"])) [data-radix-dialog-overlay] {
        pointer-events: none !important;
      }
      /* Re-enable DialogContent */
      [data-radix-dialog-content] { pointer-events: auto !important; }
    `;

    const existingStyle = document.getElementById("google-autocomplete-styles-leadlabour");
    if (existingStyle) document.head.removeChild(existingStyle);
    document.head.appendChild(style);

    // Prevent dialog close when clicking autocomplete dropdown
    const handleOverlayClick = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.closest(".pac-container")) {
        e.stopPropagation();
        e.preventDefault();
      }
    };

    const observer = new MutationObserver(() => {
      const pacContainer = document.querySelector(".pac-container");
      const overlay = document.querySelector("[data-radix-dialog-overlay]");
      if (pacContainer && overlay) {
        const isVisible = window.getComputedStyle(pacContainer).display !== "none";
        (overlay as HTMLElement).style.pointerEvents = isVisible ? "none" : "auto";
      }
    });

    document.addEventListener("click", handleOverlayClick, true);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      document.removeEventListener("click", handleOverlayClick, true);
      observer.disconnect();
      const s = document.getElementById("google-autocomplete-styles-leadlabour");
      if (s) document.head.removeChild(s);
    };
  }, [isCreateDialogOpen, isEditDialogOpen]);

  // Check if user is admin (has no specific permissions but should see all actions)
  const isAdmin = permissions.length === 0

  // Permission checks for lead labour module
  const canViewLeadLabour = isAdmin || hasPermission('lead_labour', 'view')
  const canCreateLeadLabour = isAdmin || hasPermission('lead_labour', 'create')
  const canEditLeadLabour = isAdmin || hasPermission('lead_labour', 'edit')
  const canDeleteLeadLabour = isAdmin || hasPermission('lead_labour', 'delete')
  const [filteredLeadLabours, setFilteredLeadLabours] = useState<any[]>([]);

  const [formData, setFormData] = useState<LeadLabourFormData>({
    role: '',
    name: '',
    email: '',
    phone: '',
    dob: '',
    address: '',
    notes: '',
    department: '',
    dateOfJoining: '',
    specialization: '',
    experience: '',
    status: 'active',
    certifications: [],
    hourly_rate: 0,
    availability: 'available',
    jobsCompleted: 0,
    lastAssignment: '',
    skills: [],
    emergencyContact: '',
    documents: {
      idProof: null,
      photo: null,
      resume: null
    },
    permissions: {
      createJob: false,
      addClient: false,
      orderInventoryPrice: false,
      invoicePrice: false,
      invoiceGenerate: false,
      closeJob: false,
      changeLaborTime: false
    },
    agreeToTerms: false
  })

  const generateLeadLabourId = () => {
    const year = new Date().getFullYear()
    const count = leadLabours.length + 1
    return `LL-${year}-${String(count).padStart(3, '0')}`
  }

  const handleBackToList = () => {
    setShowDetails(false)
    setSelectedLeadLabourId(null)
    setLeadLabourDetails(null)
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
      default:
        return (
          <Badge className="bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-50">
            {status}
          </Badge>
        )
    }
  }

  // const filteredLeadLabours = leadLabours.filter(labour => {
  //   const matchesSearch = labour.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //     labour.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //     labour.phone.includes(searchTerm) ||
  //     labour.leadLabourId.includes(searchTerm) ||
  //     labour.specialization.toLowerCase().includes(searchTerm.toLowerCase())

  //   const matchesSpecialization = filterSpecialization === 'all' || labour.specialization === filterSpecialization
  //   const matchesStatus = filterStatus === 'all' || labour.status === filterStatus

  //   return matchesSearch && matchesSpecialization && matchesStatus
  // })


  const paginatedLeadLabours = filteredLeadLabours
  const totalPages = Math.ceil(totalLead / itemsPerPage)

  const handleCreate = async () => {
    // Validation
    if (!formData.role || !formData.name || !formData.email || !formData.phone || !formData.dob || !formData.address || !formData.department || !formData.dateOfJoining || !formData.specialization || !formData.experience || !formData.agreeToTerms) {
      const errors: Record<string, string> = {};
      if (!formData.role) errors.role = 'Role is required';
      if (!formData.name) errors.name = 'Name is required';
      if (!formData.email) errors.email = 'Email is required';
      if (!formData.phone) errors.phone = 'Phone is required';
      if (!formData.dob) errors.dob = 'Date of Birth is required';
      if (formData.dob && new Date(formData.dob) > new Date()) {
        errors.dob = 'Date of Birth cannot be in the future';
      }
      if (!formData.address) errors.address = 'Address is required';
      if (!formData.department) errors.department = 'Department is required';
      if (!formData.dateOfJoining) errors.dateOfJoining = 'Date of Joining is required';
      if (!formData.specialization) errors.specialization = 'Specialization is required';
      if (!formData.experience) errors.experience = 'Experience is required';
      if (!formData.agreeToTerms) errors.agreeToTerms = 'Please agree to terms';

      setValidationErrors(errors);
      toast.error('Please fill in all required fields and agree to terms');
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

    let loadingToastId: string | number | undefined;

    try {
      loadingToastId = toast.loading('Creating lead labour...');
      const token = localStorage.getItem('jdp_auth') ? JSON.parse(localStorage.getItem('jdp_auth')!).token : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // Normalize phone with "-" after country code for payload
      const normalizePhoneForPayload = (raw: string): string => {
        if (!raw) return ''
        const digits = raw.replace(/[^\d+]/g, '')
        if (!digits.startsWith('+')) return raw

        // Special-case North America: +1XXXXXXXXXX -> +1-XXXXXXXXXX
        if (digits.startsWith('+1') && digits.length > 2) {
          const country = '1'
          const rest = digits.slice(2)
          return rest ? `+${country}-${rest}` : `+${country}`
        }

        // Other countries: treat 2–3 digits after "+" as country code (e.g. +91, +213)
        const match = digits.match(/^\+(\d{2,3})(\d*)$/)
        if (!match) return raw
        const country = match[1]
        const rest = match[2]
        return rest ? `+${country}-${rest}` : `+${country}`
      }

      // Prepare FormData payload
      const formDataPayload = new FormData();
      formDataPayload.append('full_name', formData.name);
      formDataPayload.append('email', formData.email.toLowerCase());
      formDataPayload.append('phone', normalizePhoneForPayload(formData.phone));
      formDataPayload.append('status', formData.status);
      formDataPayload.append('labor_code', generateLeadLabourId());
      formDataPayload.append('dob', formData.dob);
      formDataPayload.append('address', formData.address);
      formDataPayload.append('notes', formData.notes);
      formDataPayload.append('department', formData.department);
      formDataPayload.append('date_of_joining', formData.dateOfJoining);
      formDataPayload.append('specialization', formData.specialization);
      formDataPayload.append('trade', formData.experience);
      formDataPayload.append('experience', formData.experience);
      formDataPayload.append('agreed_terms', formData.agreeToTerms.toString());
      formDataPayload.append('role', formData.role);
      formDataPayload.append('hourly_rate', String(formData.hourly_rate || 0));
      formDataPayload.append('management_type', 'lead_labor');

      // Append file uploads if they exist
      if (formData.documents.idProof && formData.documents.idProof instanceof File) {
        formDataPayload.append('id_proof', formData.documents.idProof as File);
      }
      if (formData.documents.photo && formData.documents.photo instanceof File) {
        formDataPayload.append('photo_url', formData.documents.photo as File);
      }
      if (formData.documents.resume && formData.documents.resume instanceof File) {
        formDataPayload.append('resume_url', formData.documents.resume as File);
      }

      const response = await fetch(`${apiBaseUrl}/lead-labor/createLeadLabor`, {
        method: 'POST',
        headers,
        body: formDataPayload
      });

      // Dismiss loading toast
      if (loadingToastId) {
        toast.dismiss(loadingToastId);
      }

      if (response.ok) {
        const responseData = await response.json();
        if (responseData.success) {
          toast.success('Lead Labour created successfully');
          resetForm();
          setIsCreateDialogOpen(false);
          // Refresh the data
          fetchLeadLabourData(currentPage, itemsPerPage);
          // Refresh management stats
          const statsResponse = await apiClient.getManagementStats();
          if (statsResponse.success && statsResponse.data && statsResponse.data.lead_labor) {
            setLeadLaborStats(statsResponse.data.lead_labor);
          }
        } else {
          toast.error(responseData.message || 'Failed to create lead labour');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.message || 'Failed to create lead labour');
      }
    } catch (error) {
      // Make sure to dismiss loading toast even on error
      if (loadingToastId) {
        toast.dismiss(loadingToastId);
      }
      console.error('Error creating lead labour:', error);
      toast.error('Error creating lead labour. Please try again.');
    }
  }

  const handleView = (id: string | number) => {
    if (onViewDetails) {
      onViewDetails(String(id))
      return
    }
    const numericId = Number(id)
    setSelectedLeadLabourId(numericId)
    setShowDetails(true)
    fetchLeadLabourById(numericId)
  }

  const handleEdit = (leadLabour: LeadLabour) => {
    setEditingLeadLabour(leadLabour)
    console.log('sadas', leadLabour);
    
    // Find matching role from roles array
    // The Select component expects role.roleName, so we need to match leadLabour.role with role.roleName
    // Handle cases like "lead_labor" from API matching "Lead Labor" in roles array
    let matchedRole = ''
    if (leadLabour.role) {
      // Normalize function to compare strings (remove spaces, underscores, convert to lowercase)
      const normalize = (str: string) => str?.toLowerCase().replace(/[\s_-]/g, '') || ''
      
      const apiRoleNormalized = normalize(leadLabour.role) 
      
      const foundRole = roles.find(role => {
        // Exact match
        if (role.roleName === leadLabour.role) return true
        // Case-insensitive match
        if (role.roleName?.toLowerCase() === leadLabour.role?.toLowerCase()) return true
        // Normalized match (handles underscores, spaces, case)
        if (normalize(role.roleName || '') === apiRoleNormalized) return true
        return false
      })
      
      matchedRole = foundRole?.roleName || leadLabour.role
      console.log('Matched role:', matchedRole, 'Found:', !!foundRole)
    }
    
    setFormData({
      role: matchedRole, // Use matched roleName from roles array
      name: leadLabour.name,
      email: leadLabour.email,
      phone: leadLabour.phone,
      dob: leadLabour.dob,
      address: leadLabour.address,
      notes: leadLabour.notes,
      department: leadLabour.department,
      dateOfJoining: leadLabour.dateOfJoining,
      specialization: leadLabour.specialization,
      experience: leadLabour.experience,
      status: (leadLabour.status as 'active' | 'inactive') || 'active',
      certifications: leadLabour.certifications,
      hourly_rate: Number(leadLabour.hourly_rate) || 0, 
      availability: leadLabour.availability as 'available' | 'assigned' | 'on-leave' | 'unavailable',
      jobsCompleted: leadLabour.jobsCompleted,
      lastAssignment: leadLabour.lastAssignment,
      skills: leadLabour.skills,
      emergencyContact: leadLabour.emergencyContact,
      documents: {
        idProof: leadLabour.documents?.idProof || null,
        photo: leadLabour.documents?.photo || null,
        resume: leadLabour.documents?.resume || null
      },
      permissions: leadLabour.permissions,
      agreeToTerms: leadLabour.agreeToTerms
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdate = async () => {
    if (!editingLeadLabour) return

    // Validation
    if (!formData.role || !formData.name || !formData.email || !formData.phone || !formData.dob || !formData.address || !formData.department || !formData.dateOfJoining || !formData.specialization || !formData.experience || !formData.agreeToTerms) {
      const errors: Record<string, string> = {};
      if (!formData.role) errors.role = 'Role is required';
      if (!formData.name) errors.name = 'Name is required';
      if (!formData.email) errors.email = 'Email is required';
      if (!formData.phone) errors.phone = 'Phone is required';
      if (!formData.dob) errors.dob = 'Date of Birth is required';
      if (formData.dob && new Date(formData.dob) > new Date()) {
        errors.dob = 'Date of Birth cannot be in the future';
      }
      if (!formData.address) errors.address = 'Address is required';
      if (!formData.department) errors.department = 'Department is required';
      if (!formData.dateOfJoining) errors.dateOfJoining = 'Date of Joining is required';
      if (!formData.specialization) errors.specialization = 'Specialization is required';
      if (!formData.experience) errors.experience = 'Experience is required';
      if (!formData.agreeToTerms) errors.agreeToTerms = 'Please agree to terms';

      setValidationErrors(errors);
      toast.error('Please fill in all required fields and agree to terms');
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

    let loadingToastId: string | number | undefined;

    try {
      loadingToastId = toast.loading('Updating lead labour...');
      const token = localStorage.getItem('jdp_auth') ? JSON.parse(localStorage.getItem('jdp_auth')!).token : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // Normalize phone with "-" after country code for payload
      const normalizePhoneForPayload = (raw: string): string => {
        if (!raw) return ''
        const digits = raw.replace(/[^\d+]/g, '')
        if (!digits.startsWith('+')) return raw

        // Special-case North America: +1XXXXXXXXXX -> +1-XXXXXXXXXX
        if (digits.startsWith('+1') && digits.length > 2) {
          const country = '1'
          const rest = digits.slice(2)
          return rest ? `+${country}-${rest}` : `+${country}`
        }

        // Other countries: treat 2–3 digits after "+" as country code (e.g. +91, +213)
        const match = digits.match(/^\+(\d{2,3})(\d*)$/)
        if (!match) return raw
        const country = match[1]
        const rest = match[2]
        return rest ? `+${country}-${rest}` : `+${country}`
      }

      // Prepare FormData payload
      const formDataPayload = new FormData();
      formDataPayload.append('full_name', formData.name);
      formDataPayload.append('email', formData.email.toLowerCase());
      formDataPayload.append('phone', normalizePhoneForPayload(formData.phone));
      formDataPayload.append('status', formData.status);
      formDataPayload.append('dob', formData.dob);
      formDataPayload.append('address', formData.address);
      formDataPayload.append('notes', formData.notes);
      formDataPayload.append('department', formData.department);
      formDataPayload.append('date_of_joining', formData.dateOfJoining);
      formDataPayload.append('specialization', formData.specialization);
      formDataPayload.append('trade', formData.experience);
      formDataPayload.append('experience', formData.experience);
      formDataPayload.append('agreed_terms', formData.agreeToTerms.toString());
      formDataPayload.append('role', formData.role);
      formDataPayload.append('management_type', 'lead_labour');
      formDataPayload.append('hourly_rate', String(formData.hourly_rate || 0));

      // Append file uploads if they exist
      if (formData.documents.idProof && formData.documents.idProof instanceof File) {
        formDataPayload.append('id_proof', formData.documents.idProof as File);
      }
      if (formData.documents.photo && formData.documents.photo instanceof File) {
        formDataPayload.append('photo_url', formData.documents.photo as File);
      }
      if (formData.documents.resume && formData.documents.resume instanceof File) {
        formDataPayload.append('resume_url', formData.documents.resume as File);
      }

      const response = await fetch(`${apiBaseUrl}/lead-labor/updateLeadLabor/${editingLeadLabour.id}`, {
        method: 'POST',
        headers,
        body: formDataPayload
      });

      // Dismiss loading toast
      if (loadingToastId) {
        toast.dismiss(loadingToastId);
      }

      if (response.ok) {
        const responseData = await response.json();
        if (responseData.success) {
          toast.success('Lead Labour updated successfully');
          resetForm();
          setIsEditDialogOpen(false);
          setEditingLeadLabour(null);
          // Refresh the data
          fetchLeadLabourData(currentPage, itemsPerPage);
          // Refresh management stats
          const statsResponse = await apiClient.getManagementStats();
          if (statsResponse.success && statsResponse.data && statsResponse.data.lead_labor) {
            setLeadLaborStats(statsResponse.data.lead_labor);
          }
        } else {
          toast.error(responseData.message || 'Failed to update lead labour');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.message || 'Failed to update lead labour');
      }
    } catch (error) {
      // Make sure to dismiss loading toast even on error
      if (loadingToastId) {
        toast.dismiss(loadingToastId);
      }
      console.error('Error updating lead labour:', error);
      toast.error('Error updating lead labour. Please try again.');
    }
  }

  const handleDelete = async (id: string | number) => {
    let loadingToastId: string | number | undefined;

    try {
      loadingToastId = toast.loading('Deleting lead labour...');

      const token = localStorage.getItem('jdp_auth') ? JSON.parse(localStorage.getItem('jdp_auth')!).token : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${apiBaseUrl}/lead-labor/deleteLeadLabor/${id}`, {
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
          toast.success('Lead Labour deleted successfully');
          // Refresh the data
          fetchLeadLabourData(currentPage, itemsPerPage);
        } else {
          toast.error(responseData.message || 'Failed to delete lead labour');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.message || 'Failed to delete lead labour');
      }
    } catch (error) {
      // Make sure to dismiss loading toast even on error
      if (loadingToastId) {
        toast.dismiss(loadingToastId);
      }
      console.error('Error deleting lead labour:', error);
      toast.error('Error deleting lead labour. Please try again.');
    }
  }

    const resetForm = () => {
    setFormData({
      role: '',
      name: '',
      email: '',
      phone: '',
      dob: '',
      address: '',
      notes: '',
      department: '',
      dateOfJoining: '',
      specialization: '',
      experience: '',
      status: 'active',
      certifications: [],
      hourly_rate: 0,
      availability: 'available',
      jobsCompleted: 0,
      lastAssignment: '',
      skills: [],
      emergencyContact: '',
      documents: {
        idProof: null,
        photo: null,
        resume: null
      },
      permissions: {
        createJob: false,
        addClient: false,
        orderInventoryPrice: false,
        invoicePrice: false,
        invoiceGenerate: false,
        closeJob: false,
        changeLaborTime: false
      },
      agreeToTerms: false
    })
    setValidationErrors({})
    setEditingLeadLabour(null)
  }

  const handleFileUpload = (type: 'idProof' | 'photo' | 'resume', file: File | { name: string; url: string } | null) => {
    setFormData(prev => ({
      ...prev,
      documents: {
        ...prev.documents,
        [type]: file
      }
    }))

    // Clear validation error for the specific file type
    if (type === 'idProof' && validationErrors.idProof) {
      setValidationErrors({ ...validationErrors, idProof: '' })
    }
  }

  const FileUploadArea = ({ type, label, accept, error }: { type: 'idProof' | 'photo' | 'resume', label: string, accept: string, error?: string }) => {
    const currentFile = formData.documents[type]
    const isImageFile = currentFile && (
      (currentFile instanceof File && currentFile.type.startsWith('image/')) ||
      (!(currentFile instanceof File) && currentFile && (currentFile as any).name && /\.(jpg|jpeg|png|gif)$/i.test((currentFile as any).name))
    )

    return (
      <div className="space-y-2">
        <Label>{label}</Label>

        {currentFile ? (
          <div className="relative border-2 border-dashed rounded-lg p-4">
            {isImageFile ? (
              <div className="relative">
                <Image
                  src={currentFile instanceof File ? URL.createObjectURL(currentFile) : (currentFile as any).url}
                  alt="Preview"
                  className="w-full h-32 object-cover rounded-lg"
                  width={168}
                  height={63}


                />
                {/* <img 
                  src={currentFile instanceof File ? URL.createObjectURL(currentFile) : (currentFile as any).url} 
                  alt="Preview" 
                  className="w-full h-32 object-cover rounded-lg"
                /> */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleFileUpload(type, null)
                  }}
                  className="absolute  top-0 right-0   bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="relative p-2 bg-gray-50 rounded flex items-center justify-center gap-3">
                <div className="flex items-center justify-center">
                  <FileText className="h-6 w-6 text-gray-400" />
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleFileUpload(type, null)
                  }}
                  className="  bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center hover:border-[#00A1FF] transition-colors cursor-pointer ${error ? 'border-red-300' : 'border-gray-300'
              }`}
            onClick={() => document.getElementById(`file-${type}`)?.click()}
          >
            <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-600">Upload file here</p>
            <p className="text-xs text-gray-500 mt-1">or click to browse</p>
            <input
              id={`file-${type}`}
              type="file"
              accept={accept}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileUpload(type, file)
              }}
            />
          </div>
        )}

        {editingLeadLabour && editingLeadLabour.documents?.[type] && 
         (!formData.documents[type] || (formData.documents[type] && !(formData.documents[type] instanceof File))) && (
          <div className="mt-2">
            
            {editingLeadLabour.documents[type]!.name && !/\.(jpg|jpeg|png|gif)$/i.test(editingLeadLabour.documents[type]!.name) && (
              <div className="p-4 bg-gray-50 rounded-lg border flex items-center gap-2">
                <FileText className="h-6 w-6 text-gray-400" />
                <a 
                  href={editingLeadLabour.documents[type]!.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  {editingLeadLabour.documents[type]!.name}
                </a>
              </div>
            )}
          </div>
        )}
        {error && (
          <p className="text-sm text-red-500 mt-1">{error}</p>
        )}
      </div>
    )
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
      const response = await fetch(`${apiBaseUrl}/lead-labor/import`, {
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
        throw new Error(responseData.message || 'Failed to import lead labour');
      }

      if (responseData.success) {
        toast.success(responseData.message || 'Successfully imported lead labour!');
        setShowImportDialog(false);
        setImportFile(null);
        
        // Refresh lead labour list
        fetchLeadLabourData(currentPage, itemsPerPage);
      } else {
        throw new Error(responseData.message || 'Failed to import lead labour');
      }
    } catch (error) {
      console.error('Error importing lead labour:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to import lead labour');
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

  const exportToCSV = () => {
    // Check if any lead labour is selected
    if (selectedLeadLabours.length === 0) {
      toast.error('Please select at least one lead labour to export');
      return;
    }

    // Filter lead labours to only include selected ones
    const selectedLeadLabourData = leadLabours.filter(labour => selectedLeadLabours.includes(String(labour.id)));

    // CSV header
    const headers = [
      "ID",
      "Lead Labour ID",
      "Name",
      "Email",
      "Phone",
      "DOB",
      "Address",
      "Department",
      "Date of Joining",
      "Specialization",
      "Experience", 
      "Hourly Rate",
      "Availability",
      "Assigned Jobs", 
    ];

    // CSV rows
    const rows = selectedLeadLabourData.map(labour => [
      labour.id,
      labour.leadLabourId,
      labour.name,
      labour.email,
      labour.phone,
      labour.dob,
      labour.address,
      labour.department,
      labour.dateOfJoining,
      labour.specialization,
      labour.experience,  
      labour.hourly_rate,  
      labour.availability,
      labour.jobsCompleted, 
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(field => {
        const value = field === null || field === undefined ? '' : String(field);
        const escapedValue = value.replace(/"/g, '""');
        return `"${escapedValue}"`;
      }).join(","))
    ].join("\n");

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `lead_labour_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  useEffect(() => {
    fetchRoles();
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

  const fetchLeadLabourData = async (page: number, limit: number) => {
    setIsLoadingLeadLabour(true);
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
        if (responseData.success && responseData.data) {
          // Map API response to component data structure
          const mappedData = responseData.data.data.map((item: any) => ({
            id: item.id,
            leadLabourId: item.labor_code,
            name: item.users?.full_name || 'N/A',
            email: item.users?.email || 'N/A',
            phone: item.users?.phone || 'N/A',
            dob: item.dob,
            address: item.address,
            notes: item.notes,
            department: item.department,
            dateOfJoining: item.date_of_joining,
            specialization: item.specialization,
            experience: item.experience,
            trade: item.trade,
            idProofUrl: item.id_proof_url,
            photoUrl: item.photo_url,
            resumeUrl: item.resume_url,
            agreedTerms: item.agreed_terms,
            status: item.users?.status || 'active',
            role: item.users?.role || 'Lead labor',
            createdAt: item.created_at,
            jobsCompleted: item.assigned_jobs_count || 0, // Default value
            hourly_rate: item.hourly_rate || 0, // Default value
            availability: 'available', // Default value
            certifications: [], // Default value
            lastAssignment: '', // Default value
            skills: [], // Default value
            emergencyContact: '', // Default value
            documents: {
              idProof: item.id_proof_url ? { name: item.id_proof_url.split('/').pop() || 'ID Proof', url: item.id_proof_url } : null,
              photo: item.photo_url ? { name: item.photo_url.split('/').pop() || 'Photo', url: item.photo_url } : null,
              resume: item.resume_url ? { name: item.resume_url.split('/').pop() || 'Resume', url: item.resume_url } : null
            },
            permissions: {
              createJob: false,
              addClient: false,
              orderInventoryPrice: false,
              invoicePrice: false,
              invoiceGenerate: false,
              closeJob: false,
              changeLaborTime: false
            },
            agreeToTerms: item.agreed_terms
          }));          

          setLeadLabours(mappedData);
          setFilteredLeadLabours(mappedData); 
          setTotalLead(responseData.data.pagination.totalItems || mappedData.length);

          // Extract unique departments and specializations
          const uniqueDepartments = Array.from(new Set(responseData.data?.data?.map((item: any) => item.department).filter(Boolean))) as string[];
          const uniqueSpecializations = Array.from(new Set(responseData.data?.data?.map((item: any) => item.specialization).filter(Boolean))) as string[];

          setDepartments(uniqueDepartments);
          setSpecializations(uniqueSpecializations);
        }
      } else {
        console.error('Failed to fetch lead labour data:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching lead labour data:', error);
    } finally {
      setIsLoadingLeadLabour(false);
    }
  };

  const fetchBySearchLeadLabor = async () => {
  if (!searchTerm.trim()) return;

  setIsLoadingLeadLabour(true);

  try {
    const response = await apiClient.searchLeadLaborByQuery(searchTerm.trim(), 1, 10);
    const leadLaborData = response.data;
    const leadLaborList = leadLaborData?.leadLabor || [];

    const transformedData = leadLaborList.map((labor: any) => ({
      id: labor.id,
      userId: labor.user_id,
      name: labor.users?.full_name || 'N/A',
      email: labor.users?.email || 'N/A',
      phone: labor.users?.phone || 'N/A',
      role: labor.users?.role || 'N/A',
      status: labor.users?.status || 'N/A',
      dob: labor.dob || 'N/A',
      address: labor.address || 'N/A',
      department: labor.department || 'N/A',
      hourly_rate: labor.hourly_rate,
      dateOfJoining: labor.date_of_joining || 'N/A',
      specialization: labor.specialization || 'N/A',
      trade: labor.trade || 'N/A',
      experience: labor.experience || 'N/A',
      laborCode: labor.labor_code || 'N/A',
      idProofUrl: labor.id_proof_url || null,
      resumeUrl: labor.resume_url || null,
      photoUrl: labor.photo_url || null,
      notes: labor.notes || '',
    }));

   setFilteredLeadLabours(transformedData); 
setTotalLead(transformedData.length);  
  } catch (error) {
    console.error('Lead labor search error:', error);
    setFilteredLeadLabours([]);
  } finally {
    setIsLoadingLeadLabour(false);
  }
};

useEffect(() => {
  const debounceTimeout = setTimeout(() => {
    if (!searchTerm.trim()) {
      fetchLeadLabourData(currentPage, itemsPerPage); 
    } else {
      fetchBySearchLeadLabor();
    }
  }, 500);

  return () => clearTimeout(debounceTimeout);
}, [searchTerm, currentPage, itemsPerPage]);

// Clear selected lead labours when pagination, filters, or search changes
useEffect(() => {
  setSelectedLeadLabours([]);
}, [currentPage, filterSpecialization, filterStatus, searchTerm]);


useEffect(() => {
  const fetchLeadLaborsByStatus = async () => {
    setIsLoadingLeadLabour(true);
    try {
      let res;
      if (!filterStatus || filterStatus === 'all') {
        // Call searchLeadLabor API without status filter when 'all' is selected
        res = await apiClient.searchLeadLaborByQuery('', currentPage, itemsPerPage);
      } else {
        res = await apiClient.searchLeadLaborByStatus(filterStatus, currentPage, itemsPerPage); 
      }
      
      const laborList = res.data?.leadLabor || []; // API returns 'leadLabor'
      const transformed = laborList.map((item: any) => ({
        id: item.id,
        leadLabourId: item.labor_code || item.lead_labour_code || 'N/A',
        name: item.users?.full_name || 'N/A',
        email: item.users?.email || 'N/A',
        phone: item.users?.phone || 'N/A',
        dob: item.dob || '',
        address: item.address || '',
        notes: item.notes || '',
        department: item.department || '',
        dateOfJoining: item.date_of_joining || '',
        specialization: item.specialization || '',
        experience: item.experience || '',
        status: item.users?.status || 'inactive',
        certifications: Array.isArray(item.certifications) ? item.certifications : (item.certifications ? [item.certifications] : []),
        hourly_rate: item.hourly_rate || 0,
        availability: item.availability || 'available',
        jobsCompleted: item.assigned_jobs_count || 0,
        lastAssignment: item.last_assignment || '',
        skills: Array.isArray(item.skills) ? item.skills : (item.skills ? [item.skills] : []),
        emergencyContact: item.emergency_contact || ''
      }));
      setLeadLabours(transformed);
      setFilteredLeadLabours(transformed);
      setTotalLead(res.data?.pagination?.total ?? transformed.length ?? 0);
    } catch (err) {
      console.error("Lead Labor filter error:", err);
      setLeadLabours([]);
      setFilteredLeadLabours([]);
      setTotalLead(0);
    } finally {
      setIsLoadingLeadLabour(false);
    }
  };

  fetchLeadLaborsByStatus();
}, [filterStatus, currentPage, itemsPerPage]);

// Fetch lead labor statistics
useEffect(() => {
  const fetchStats = async () => {
    try {
      setIsStatsLoading(true);
      const response = await apiClient.getManagementStats();
      if (response.success && response.data && response.data.lead_labor) {
        setLeadLaborStats(response.data.lead_labor);
      }
    } catch (error) {
      console.error('Error fetching lead labor stats:', error);
    } finally {
      setIsStatsLoading(false);
    }
  };
  fetchStats();
}, []);




  const fetchLeadLabourById = async (id: number) => {
    setIsLoadingDetails(true)
    try {
      const token = localStorage.getItem('jdp_auth') ? JSON.parse(localStorage.getItem('jdp_auth')!).token : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${apiBaseUrl}/lead-labor/getLeadLaborById/${id}`, {
        method: 'GET',
        headers
      });

      if (response.ok) {
        const responseData = await response.json();
        if (responseData.success && responseData.data) {
          const item = responseData.data;
          const jobHistory = Array.isArray(item.job_history)
            ? item.job_history
            : []

          const documentsList = Array.isArray(item.documents)
            ? item.documents
            : [
                item.id_proof_url
                  ? {
                      label: 'ID Proof',
                      file_name: item.id_proof_url.split('/').pop() || 'ID Proof',
                      url: item.id_proof_url
                    }
                  : null,
                item.photo_url
                  ? {
                      label: 'Photo',
                      file_name: item.photo_url.split('/').pop() || 'Photo',
                      url: item.photo_url
                    }
                  : null,
                item.resume_url
                  ? {
                      label: 'Resume',
                      file_name: item.resume_url.split('/').pop() || 'Resume',
                      url: item.resume_url
                    }
                  : null
              ].filter(Boolean) as any[]

          const jobStats = item.job_statistics || {}
          
          const detailPayload = {
            id: item.id,
            labor_code: item.labor_code,
            full_name: item.users?.full_name || 'N/A',
            email: item.users?.email || 'N/A',
            phone: item.users?.phone || 'N/A',
            dob: item.dob,
            address: item.address,
            date_of_joining: item.date_of_joining,
            status: item.users?.status || 'active',
            role: item.users?.role || 'Lead labor',
            availability: item.availability || 'Available',
            hourly_rate: item.hourly_rate || 0,
            total_jobs: jobStats.total_jobs ?? jobHistory.length ?? 0,
            total_hours: jobStats.total_hours ?? item.timesheet_stats?.total_hours ?? 0,
            completed_jobs: jobStats.completed_jobs ?? jobHistory.filter((job: any) => (job.status || '').toLowerCase() === 'completed').length,
            documentsList,
            job_history: jobHistory,
            about: item.about || item.notes,
          };

          console.log(detailPayload,"detailPayload");


          setLeadLabourDetails(detailPayload)
        } else {
          toast.error('Failed to load lead labour details')
          setShowDetails(false)
        }
      } else {
        console.error('Failed to fetch lead labour details:', response.status, response.statusText);
        toast.error('Failed to fetch lead labour details');
        setShowDetails(false)
      }
    } catch (error) {
      console.error('Error fetching lead labour details:', error);
      toast.error('Error fetching lead labour details');
      setShowDetails(false)
    } finally {
      setIsLoadingDetails(false)
    }
  };

  if (showDetails && selectedLeadLabourId !== null) {
    return (
      <LeadLabourDetailsPage
        leadLabourId={selectedLeadLabourId}
        leadLabourData={leadLabourDetails}
        isLoading={isLoadingDetails}
        onBack={handleBackToList}
      />
    )
  }

  const renderForm = () => (
    <div className="max-h-[65vh] overflow-y-auto space-y-6 p-2">
      {/* Personal Details Section */}
      <div>
        <h3 className="text-lg font-medium text-[#2b2b2b] mb-4">Personal Details</h3>
        <div className="grid grid-cols-2 gap-4">
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
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={formData.name}
              className={validationErrors.name ? 'border-red-500' : ''}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value })
                if (validationErrors.name) {
                  setValidationErrors({ ...validationErrors, name: '' })
                }
              }}
              placeholder="Enter full name"
            />
            {validationErrors.name && (
              <p className="text-sm text-red-500 mt-1">{validationErrors.name}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <PhoneInput
              id="phone"
              international
              withCountryCallingCode
              defaultCountry="US"
              countryCallingCodeEditable={false}
              limitMaxLength
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
              placeholder="Enter your email address"
              className={validationErrors.email ? 'border-red-500' : ''}
            />
            {validationErrors.email && (
              <p className="text-sm text-red-500 mt-1">{validationErrors.email}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="dob">DOB *</Label>
            <Input
              id="dob"
              type="date"
              value={formData.dob}
              className={validationErrors.dob ? 'border-red-500' : ''}
              onChange={(e) => {
                setFormData({ ...formData, dob: e.target.value })
                if (validationErrors.dob) {
                  setValidationErrors({ ...validationErrors, dob: '' })
                }
              }}
              max={new Date().toISOString().split('T')[0]}
            />
            {validationErrors.dob && (
              <p className="text-sm text-red-500 mt-1">{validationErrors.dob}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-status">Status</Label>
            <Select value={formData.status} onValueChange={(value: 'active' | 'inactive') => setFormData({ ...formData, status: value })}>
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
            <Label htmlFor="address">Address *</Label>
            <Autocomplete 
              apiKey={
                process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
                "AIzaSyBtb6hSmwJ9_OznDC5e8BcZM90ms4WD_DE"
              }
              onPlaceSelected={(place: any) => {
                const address = place?.formatted_address || place?.name || "";
                if (address) {
                  setFormData({ ...formData, address });
                  if (validationErrors.address) {
                    setValidationErrors({ ...validationErrors, address: "" });
                  }
                }
              }}
              options={{
                types: ["address"],
                componentRestrictions: { country: "us" },
              }}
              value={formData.address}
              onChange={(e: any) => {
                const value = e.target.value;
                setFormData({ ...formData, address: value });
                if (validationErrors.address) {
                  setValidationErrors({ ...validationErrors, address: "" });
                }
              }}
              className={`w-full h-10 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                validationErrors.address ? "border-red-500" : ""
              }`}
              placeholder="Enter address"
            />
            {validationErrors.address && (
              <p className="text-sm text-red-500 mt-1">{validationErrors.address}</p>
            )}
          </div>
          <div className="col-span-2 space-y-2">
            <Label htmlFor="hourly_rate">Hourly Rate ($)</Label>
            <Input
              id="hourly_rate"
              type="number"
              step="0.01"
              value={formData.hourly_rate}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  hourly_rate: e.target.value === '' ? '' : Number(e.target.value)
                })
              }
              placeholder="Enter hourly rate"
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
      </div>

      {/* Job Details Section */}
      <div>
        <h3 className="text-lg font-medium text-[#2b2b2b] mb-4">Job Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="department">Department *</Label>
            <AutoSuggestInput
              label=""
              value={formData.department}
              onChange={(value) => {
                setFormData({ ...formData, department: value })
                if (validationErrors.department) {
                  setValidationErrors({ ...validationErrors, department: '' })
                }
              }}
              suggestions={departments}
              placeholder="Enter department"
              error={validationErrors.department}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="specialization">Specialization *</Label>
            <AutoSuggestInput
              label=""
              value={formData.specialization}
              onChange={(value) => {
                setFormData({ ...formData, specialization: value })
                if (validationErrors.specialization) {
                  setValidationErrors({ ...validationErrors, specialization: '' })
                }
              }}
              suggestions={specializations}
              placeholder="Enter specialization"
              error={validationErrors.specialization}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dateOfJoining">Date of Joining *</Label>
            <Input
              id="dateOfJoining"
              type="date"
              value={formData.dateOfJoining}
              onChange={(e) => {
                setFormData({ ...formData, dateOfJoining: e.target.value })
                if (validationErrors.dateOfJoining) {
                  setValidationErrors({ ...validationErrors, dateOfJoining: '' })
                }
              }}
              className={validationErrors.dateOfJoining ? 'border-red-500' : ''}
            />
            {validationErrors.dateOfJoining && (
              <p className="text-sm text-red-500 mt-1">{validationErrors.dateOfJoining}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="experience">Experience *</Label>
            <Input
              id="experience"
              value={formData.experience}
              className={validationErrors.experience ? 'border-red-500' : ''}

              onChange={(e) => {
                setFormData({ ...formData, experience: e.target.value })
                if (validationErrors.experience) {
                  setValidationErrors({ ...validationErrors, experience: '' })
                }
              }}
              placeholder="e.g., 5 years"
            />
            {validationErrors.experience && (
              <p className="text-sm text-red-500 mt-1">{validationErrors.experience}</p>
            )}
          </div>
        </div>
      </div>

      {/* Document Upload Section */}
      <div>
        <h3 className="text-lg font-medium text-[#2b2b2b] mb-4">Document Upload</h3>
        <div className="grid grid-cols-3 gap-4">
          <FileUploadArea type="idProof" label="Select ID Proof" accept=".pdf,.jpg,.jpeg,.png" error={validationErrors.idProof} />
          <FileUploadArea type="photo" label="Photo Upload" accept=".jpg,.jpeg,.png" />
          <FileUploadArea type="resume" label="Resume Upload" accept=".pdf,.doc,.docx" />
        </div>
      </div>

      {/* Agreement */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="agreeToTerms"
          checked={formData.agreeToTerms}
          onCheckedChange={(checked) => {
            setFormData({ ...formData, agreeToTerms: checked as boolean })
            if (validationErrors.agreeToTerms) {
              setValidationErrors({ ...validationErrors, agreeToTerms: '' })
            }
          }}
        />
        <Label htmlFor="agreeToTerms" className="text-sm">
          Agreement to terms and conditions
        </Label>
        {validationErrors.agreeToTerms && (
          <p className="text-sm text-red-500 mt-1">{validationErrors.agreeToTerms}</p>
        )}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-[#2b2b2b]">Lead Labor Management</h1>
          <p className="text-sm text-[#2b2b2b]/60 mt-1">Manage your lead labour workforce and their assignments.</p>
        </div>

        <div className="flex items-center gap-3">
          <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2" onClick={() => setShowImportDialog(true)}>
                <Download className="h-4 w-4" />
                Import
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Import Lead Labour</DialogTitle>
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
                  className="bg-primary text-white hover:bg-[#0090e6]"
                >
                  {isImporting ? 'Importing...' : 'Import'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" className="gap-2" onClick={exportToCSV}>
            <Upload className="h-4 w-4" />
            Export
          </Button>
          {canCreateLeadLabour && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-white hover:bg-[#0090e6] gap-2">
                  <Plus className="h-4 w-4" />
                  Add Lead Labour
                </Button>
              </DialogTrigger>
              <DialogContent
                className="max-w-4xl max-h-[90vh]"
                onInteractOutside={(e) => {
                  const target = e.target as HTMLElement | null;
                  if (target?.closest?.(".pac-container")) e.preventDefault();
                }}
                onPointerDownOutside={(e) => {
                  const target = e.target as HTMLElement | null;
                  if (target?.closest?.(".pac-container")) e.preventDefault();
                }}
                onFocusOutside={(e) => {
                  const target = e.target as HTMLElement | null;
                  if (target?.closest?.(".pac-container")) e.preventDefault();
                }}
              >
                <DialogHeader>
                  <DialogTitle>Lead Labour Creation Form</DialogTitle>
                </DialogHeader>
                {renderForm()}
                <div className="flex justify-end gap-3 mt-6">
                  <Button variant="outline" onClick={() => {
                    setIsCreateDialogOpen(false);
                    resetForm();
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreate} className="bg-primary text-white hover:bg-[#0090e6]">
                    Submit
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
                <HardHat className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-medium text-[#2b2b2b]">
                  {isStatsLoading ? '...' : leadLaborStats.active_lead_labor}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Calendar className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Inactive</p>
                <p className="text-2xl font-medium text-[#2b2b2b]">
                  {isStatsLoading ? '...' : leadLaborStats.inactive_lead_labor}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#E6F6FF] rounded-lg">
                <Briefcase className="h-6 w-6 text-[#00A1FF]" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Jobs</p>
                <p className="text-2xl font-medium text-[#2b2b2b]">
                  {isStatsLoading ? '...' : leadLaborStats.total_jobs}
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
                <p className="text-sm text-gray-600">Total Lead Labour</p>
                <p className="text-2xl font-medium text-[#2b2b2b]">
                  {isStatsLoading ? '...' : leadLaborStats.total_lead_labor}
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
                  placeholder="Search lead labour..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* <Select value={filterSpecialization} onValueChange={setFilterSpecialization}>
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="Filter by Specialization" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Specializations</SelectItem>
                  {specializations.map((spec) => (
                    <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                  ))}
                </SelectContent>
              </Select> */}

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
              <span>Total: {filteredLeadLabours.length}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lead Labour Table */}
      <Card className="bg-white shadow-md border-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#162f3d] hover:bg-[#162f3d]">
                <TableHead className="text-white font-medium w-12">
                  <Checkbox
                    checked={paginatedLeadLabours.length > 0 && paginatedLeadLabours.every(l => selectedLeadLabours.includes(String(l.id)))}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        const paginatedIds = paginatedLeadLabours.map(l => String(l.id));
                        setSelectedLeadLabours(prev => {
                          const newSelection = [...prev];
                          paginatedIds.forEach(id => {
                            if (!newSelection.includes(id)) {
                              newSelection.push(id);
                            }
                          });
                          return newSelection;
                        });
                      } else {
                        const paginatedIds = paginatedLeadLabours.map(l => String(l.id));
                        setSelectedLeadLabours(prev => prev.filter(id => !paginatedIds.includes(id)));
                      }
                    }}
                    className="border-white/30 data-[state=checked]:bg-white data-[state=checked]:text-[#162f3d]"
                  />
                </TableHead>
                <TableHead className="text-white font-medium">ID</TableHead>
                <TableHead className="text-white font-medium">Name</TableHead>
                <TableHead className="text-white font-medium">Contact</TableHead>
                <TableHead className="text-white font-medium">Department</TableHead>
                <TableHead className="text-white font-medium">Specialization</TableHead>
                <TableHead className="text-white font-medium">Experience</TableHead>
                 <TableHead className="text-white font-medium">Hourly Rate</TableHead>
                {/* <TableHead className="text-white font-medium">Total Jobs</TableHead> */}
                <TableHead className="text-white font-medium">Status</TableHead>
                <TableHead className="text-white font-medium">Date Joined</TableHead>
                <TableHead className="text-white font-medium">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingLeadLabour ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <span className="ml-2 text-gray-600">Loading lead labour data...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedLeadLabours.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <div className="text-lg font-medium mb-2">No data available</div>
                      <div className="text-sm">
                        {searchTerm || filterSpecialization !== 'all' || filterStatus !== 'all'
                          ? 'No lead labour found matching your filters'
                          : 'No lead labour data found. Create your first lead labour record.'}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedLeadLabours.map((labour, index) => {
                  console.log(labour,"labourlabour");
                  return (
                    <TableRow key={labour.id} className={index % 2 === 1 ? "bg-[#eff4fa]" : ""}>
                    <TableCell>
                      <Checkbox
                        checked={selectedLeadLabours.includes(String(labour.id))}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedLeadLabours(prev => [...prev, String(labour.id)]);
                          } else {
                            setSelectedLeadLabours(prev => prev.filter(id => id !== String(labour.id)));
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell className="text-sm text-[#2b2b2b]/80">{labour.id}</TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm font-medium text-[#2b2b2b]/80">{labour.name}</div>
                        <div className="text-xs text-gray-500">{labour.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm text-[#2b2b2b]/80">{labour.phone}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {labour.address.split(',')[0]}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-[#2b2b2b]/80">{labour.department}</TableCell>
                    <TableCell className="text-sm text-[#2b2b2b]/80">{labour.specialization}</TableCell>
                    <TableCell className="text-sm text-[#2b2b2b]/80">{labour.experience}</TableCell>
                    <TableCell className="text-sm text-[#2b2b2b]/80">
                      {labour.hourly_rate ? `$${Number(labour.hourly_rate)}` : '$0'}
                    </TableCell>                    {/* <TableCell className="text-sm text-[#2b2b2b]/80">{labour.jobsCompleted}</TableCell> */}
                    <TableCell>{getStatusBadge(labour.status || 'active')}</TableCell>
                    <TableCell className="text-sm text-gray-900">{labour.dateOfJoining}</TableCell>
                    <TableCell>
                      <ActionButtonsPopup
                        onView={() => handleView(labour.id)}
                        onEdit={() => handleEdit(labour)}
                        onDelete={() => handleDelete(labour.id)}
                        itemName={labour.name}
                        itemType="Lead Labour"
                        showView={canViewLeadLabour}
                        showEdit={canEditLeadLabour}
                        showDelete={canDeleteLeadLabour}
                      />
                    </TableCell>
                  </TableRow>
                  )
})
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {(totalLead > itemsPerPage)  && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              const newPage = Math.max(currentPage - 1, 1);
              setCurrentPage(newPage);
              fetchLeadLabourData(newPage, itemsPerPage);
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
                fetchLeadLabourData(page, itemsPerPage);
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
              fetchLeadLabourData(newPage, itemsPerPage);
            }}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent
          className="max-w-4xl sm:max-w-[700px] max-h-[90vh]"
          onInteractOutside={(e) => {
            const target = e.target as HTMLElement | null;
            if (target?.closest?.(".pac-container")) e.preventDefault();
          }}
          onPointerDownOutside={(e) => {
            const target = e.target as HTMLElement | null;
            if (target?.closest?.(".pac-container")) e.preventDefault();
          }}
          onFocusOutside={(e) => {
            const target = e.target as HTMLElement | null;
            if (target?.closest?.(".pac-container")) e.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle>Edit Lead Labour</DialogTitle>
          </DialogHeader>
          {renderForm()}
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => {
              setIsEditDialogOpen(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} className="bg-primary text-white hover:bg-[#0090e6]">
              Update Lead Labour
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}