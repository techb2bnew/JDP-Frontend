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
  hourlyRate: number | string
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
  status: 'active' | 'inactive'
  certifications: string[]
  hourlyRate: number
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
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [editingLeadLabour, setEditingLeadLabour] = useState<LeadLabour | null>(null)
  const [viewingLeadLabour, setViewingLeadLabour] = useState<LeadLabour | null>(null)
  const [filterSpecialization, setFilterSpecialization] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [roles, setRoles] = useState<any[]>([])
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [departments, setDepartments] = useState<string[]>([])
  const [specializations, setSpecializations] = useState<string[]>([])
  const [totalLead, setTotalLead] = useState(0)

  // Check if user is admin (has no specific permissions but should see all actions)
  const isAdmin = permissions.length === 0

  // Permission checks for lead labour module
  const canViewLeadLabour = isAdmin || hasPermission('lead_labour', 'view')
  const canCreateLeadLabour = isAdmin || hasPermission('lead_labour', 'create')
  const canEditLeadLabour = isAdmin || hasPermission('lead_labour', 'edit')
  const canDeleteLeadLabour = isAdmin || hasPermission('lead_labour', 'delete')
  const [filteredLeadLabours, setFilteredLeadLabours] = useState<any[]>([]);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL

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
    hourlyRate: 0,
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
    if (!formData.role || !formData.name || !formData.email || !formData.phone || !formData.dob || !formData.address || !formData.department || !formData.dateOfJoining || !formData.specialization || !formData.experience || !formData.documents.idProof || !formData.agreeToTerms) {
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
      if (!formData.documents.idProof) errors.idProof = 'ID Proof is required';
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
      loadingToastId = toast.loading('Creating lead labour...');
      const token = localStorage.getItem('jdp_auth') ? JSON.parse(localStorage.getItem('jdp_auth')!).token : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // Prepare FormData payload
      const formDataPayload = new FormData();
      formDataPayload.append('full_name', formData.name);
      formDataPayload.append('email', formData.email.toLowerCase());
      formDataPayload.append('phone', formData.phone);
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
    fetchLeadLabourById(Number(id));
  }

  const handleEdit = (leadLabour: LeadLabour) => {
    setEditingLeadLabour(leadLabour)
    setFormData({
      role: leadLabour.role || '', // Use the role from leadLabour
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
      hourlyRate: typeof leadLabour.hourlyRate === 'string' ? 0 : leadLabour.hourlyRate,
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
      loadingToastId = toast.loading('Updating lead labour...');
      const token = localStorage.getItem('jdp_auth') ? JSON.parse(localStorage.getItem('jdp_auth')!).token : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // Prepare FormData payload
      const formDataPayload = new FormData();
      formDataPayload.append('full_name', formData.name);
      formDataPayload.append('email', formData.email.toLowerCase());
      formDataPayload.append('phone', formData.phone);
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
      hourlyRate: 0,
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

        {editingLeadLabour && editingLeadLabour.documents?.[type] && !formData.documents[type] && (
          <div className="mt-2">
            <p className="text-sm text-blue-600 mb-2">📄 Current: {editingLeadLabour.documents[type]!.name}</p>
            {editingLeadLabour.documents[type]!.name && /\.(jpg|jpeg|png|gif)$/i.test(editingLeadLabour.documents[type]!.name) && (
              <Image
                src={editingLeadLabour.documents[type]!.url}
                alt="Current Preview"
                className="w-full h-32 object-cover rounded-lg border"
                width={168}
                height={63}


              />
              // <img 
              //   src={editingLeadLabour.documents[type]!.url} 
              //   alt="Current Preview" 
              //   className="w-full h-32 object-cover rounded-lg border"
              // />
            )}
          </div>
        )}
        {error && (
          <p className="text-sm text-red-500 mt-1">{error}</p>
        )}
      </div>
    )
  }

  const exportToCSV = () => {
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
      "Certifications",
      "Hourly Rate",
      "Availability",
      "Jobs Completed",
      "Last Assignment",
      "Skills",
      "Emergency Contact"
    ];

    // CSV rows
    const rows = leadLabours.map(labour => [
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
      labour.certifications.join(", "),
      labour.hourlyRate,
      labour.availability,
      labour.jobsCompleted,
      labour.lastAssignment,
      labour.skills.join(", "),
      labour.emergencyContact
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(field => `"${field}"`).join(","))
    ].join("\n");

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `lead_labour_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  useEffect(() => {
    fetchRoles();
    fetchLeadLabourData(currentPage, itemsPerPage);
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
            jobsCompleted: 0, // Default value
            hourlyRate: 0, // Default value
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


useEffect(() => {
  const fetchLeadLaborsByStatus = async () => {
    if (!filterStatus || filterStatus === 'all') {
      // If "all" selected, clear the list or fetch all, depending on your logic
      setLeadLabours([]);
      setTotalLead(0);
      return;
    }

    setIsLoadingLeadLabour(true);
    try {
      const res = await apiClient.searchLeadLaborByStatus(filterStatus, 1, 10); 
      const laborList = res.data?.leadLabors || []; 
      setLeadLabours(laborList);
      setTotalLead(laborList.length);
    } catch (err) {
      console.error("Lead Labor filter error:", err);
      setLeadLabours([]);
      setTotalLead(0);
    } finally {
      setIsLoadingLeadLabour(false);
    }
  };

  fetchLeadLaborsByStatus();
}, [filterStatus]);




  const fetchLeadLabourById = async (id: number) => {
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
          // Map API response to component data structure
          const mappedData: LeadLabour = {
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
            jobsCompleted: 0, // Default value
            hourlyRate: 0, // Default value
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
          };

          setViewingLeadLabour(mappedData);
          setIsViewDialogOpen(true);
        }
      } else {
        console.error('Failed to fetch lead labour details:', response.status, response.statusText);
        toast.error('Failed to fetch lead labour details');
      }
    } catch (error) {
      console.error('Error fetching lead labour details:', error);
      toast.error('Error fetching lead labour details');
    }
  };


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
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => {
                // Only allow digits and limit to 10 characters
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
            <Input
              id="address"
              value={formData.address}
              className={validationErrors.address ? 'border-red-500' : ''}
              onChange={(e) => {
                setFormData({ ...formData, address: e.target.value })
                if (validationErrors.address) {
                  setValidationErrors({ ...validationErrors, address: '' })
                }
              }}
              placeholder="Enter address"
            />
            {validationErrors.address && (
              <p className="text-sm text-red-500 mt-1">{validationErrors.address}</p>
            )}
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
            <Label htmlFor="specialization">Specialization</Label>
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
            <Label htmlFor="experience">Experience</Label>
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
          <FileUploadArea type="idProof" label="Select ID Proof *" accept=".pdf,.jpg,.jpeg,.png" error={validationErrors.idProof} />
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
          <h1 className="text-2xl font-medium text-[#2b2b2b]">Lead Labour Management</h1>
          <p className="text-sm text-[#2b2b2b]/60 mt-1">Manage your lead labour workforce and their assignments.</p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Upload className="h-4 w-4" />
            Import
          </Button>
          <Button variant="outline" className="gap-2" onClick={exportToCSV}>
            <Download className="h-4 w-4" />
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
              <DialogContent className="max-w-4xl max-h-[90vh]">
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
                  {leadLabours.filter(l => l.status === 'active').length}
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
                  {leadLabours.filter(l => l.status === 'inactive').length}
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
                  {leadLabours.reduce((acc, l) => acc + l.jobsCompleted, 0)}
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
                <p className="text-sm text-gray-600">Total Staff</p>
                <p className="text-2xl font-medium text-[#2b2b2b]">
                  {leadLabours.length}
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
                <TableHead className="text-white font-medium">
                  <input type="checkbox" className="rounded border-white/30" />
                </TableHead>
                <TableHead className="text-white font-medium">ID</TableHead>
                <TableHead className="text-white font-medium">Name</TableHead>
                <TableHead className="text-white font-medium">Contact</TableHead>
                <TableHead className="text-white font-medium">Department</TableHead>
                <TableHead className="text-white font-medium">Specialization</TableHead>
                <TableHead className="text-white font-medium">Experience</TableHead>
                <TableHead className="text-white font-medium">Jobs Completed</TableHead>
                <TableHead className="text-white font-medium">Status</TableHead>
                <TableHead className="text-white font-medium">Date Joined</TableHead>
                <TableHead className="text-white font-medium">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingLeadLabour ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <span className="ml-2 text-gray-600">Loading lead labour data...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedLeadLabours.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8">
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
                paginatedLeadLabours.map((labour, index) => (
                  <TableRow key={labour.id} className={index % 2 === 1 ? "bg-[#eff4fa]" : ""}>
                    <TableCell>
                      <input type="checkbox" className="rounded border-gray-300" />
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
                    <TableCell className="text-sm text-[#2b2b2b]/80">{labour.jobsCompleted}</TableCell>
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
        <DialogContent className="max-w-4xl sm:max-w-[700px] max-h-[90vh]">
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

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl sm:max-w-[700px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Lead Labour Details</DialogTitle>
          </DialogHeader>
          {viewingLeadLabour && (
            <div className="max-h-[70vh] overflow-y-auto space-y-6 p-2">
              {/* Personal Details Section */}
              <div>
                <h3 className="text-lg font-medium text-[#2b2b2b] mb-4">Personal Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <div className="p-2 bg-gray-50 rounded border">{viewingLeadLabour.role}</div>
                  </div>
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <div className="p-2 bg-gray-50 rounded border">{viewingLeadLabour.name}</div>
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <div className="p-2 bg-gray-50 rounded border">{viewingLeadLabour.phone}</div>
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <div className="p-2 bg-gray-50 rounded border">{viewingLeadLabour.email}</div>
                  </div>
                  <div className="space-y-2">
                    <Label>Date of Birth</Label>
                    <div className="p-2 bg-gray-50 rounded border">{viewingLeadLabour.dob}</div>
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Address</Label>
                    <div className="p-2 bg-gray-50 rounded border">{viewingLeadLabour.address}</div>
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Notes</Label>
                    <div className="p-2 bg-gray-50 rounded border">{viewingLeadLabour.notes}</div>
                  </div>
                </div>
              </div>

              {/* Job Details Section */}
              <div>
                <h3 className="text-lg font-medium text-[#2b2b2b] mb-4">Job Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <div className="p-2 bg-gray-50 rounded border">{viewingLeadLabour.department}</div>
                  </div>
                  <div className="space-y-2">
                    <Label>Date of Joining</Label>
                    <div className="p-2 bg-gray-50 rounded border">{viewingLeadLabour.dateOfJoining}</div>
                  </div>
                  <div className="space-y-2">
                    <Label>Specialization</Label>
                    <div className="p-2 bg-gray-50 rounded border">{viewingLeadLabour.specialization}</div>
                  </div>
                  <div className="space-y-2">
                    <Label>Experience</Label>
                    <div className="p-2 bg-gray-50 rounded border">{viewingLeadLabour.experience}</div>
                  </div>
                  <div className="space-y-2">
                    <Label>Trade</Label>
                    <div className="p-2 bg-gray-50 rounded border">{viewingLeadLabour.trade}</div>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <div className="p-2 bg-gray-50 rounded border">{viewingLeadLabour.status}</div>
                  </div>
                </div>
              </div>

              {/* Document Links Section */}
              <div>
                <h3 className="text-lg font-medium text-[#2b2b2b] mb-4">Documents</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>ID Proof</Label>
                    {viewingLeadLabour.idProofUrl ? (
                      <a href={viewingLeadLabour.idProofUrl} target="_blank" rel="noopener noreferrer" className="relative top-[10px] text-blue-600 hover:underline">
                        View ID Proof
                      </a>
                    ) : (
                      <div className="p-2 bg-gray-50 rounded border text-gray-500">No document</div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Photo</Label>
                    {viewingLeadLabour.photoUrl ? (
                      <a href={viewingLeadLabour.photoUrl} target="_blank" rel="noopener noreferrer" className="relative top-[10px] text-blue-600 hover:underline">
                        View Photo
                      </a>
                    ) : (
                      <div className="p-2 bg-gray-50 rounded border text-gray-500">No document</div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Resume</Label>
                    {viewingLeadLabour.resumeUrl ? (
                      <a href={viewingLeadLabour.resumeUrl} target="_blank" rel="noopener noreferrer" className="relative top-[10px] text-blue-600 hover:underline">
                        View Resume
                      </a>
                    ) : (
                      <div className="p-2 bg-gray-50 rounded border text-gray-500">No document</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div>
                <h3 className="text-lg font-medium text-[#2b2b2b] mb-4">Additional Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Labor Code</Label>
                    <div className="p-2 bg-gray-50 rounded border">{viewingLeadLabour.leadLabourId}</div>
                  </div>
                  <div className="space-y-2">
                    <Label>Created At</Label>
                    <div className="p-2 bg-gray-50 rounded border">{viewingLeadLabour.createdAt ? new Date(viewingLeadLabour.createdAt).toLocaleDateString() : 'N/A'}</div>
                  </div>
                  <div className="space-y-2">
                    <Label>Agreed to Terms</Label>
                    <div className="p-2 bg-gray-50 rounded border">{viewingLeadLabour.agreeToTerms ? 'Yes' : 'No'}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}