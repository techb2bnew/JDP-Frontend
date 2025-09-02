import { useState } from 'react'
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
  Briefcase
} from 'lucide-react'

interface LeadLabour {
  id: string
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
  certifications: string[]
  hourlyRate: number
  availability: 'available' | 'assigned' | 'on-leave' | 'unavailable'
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
  certifications: string[]
  hourlyRate: number
  availability: 'available' | 'assigned' | 'on-leave' | 'unavailable'
  jobsCompleted: number
  lastAssignment: string
  skills: string[]
  emergencyContact: string
  documents: {
    idProof: File | null
    photo: File | null
    resume: File | null
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

const initialLeadLabourData: LeadLabour[] = [
  {
    id: 'LL001',
    leadLabourId: 'LL-2025-001',
    name: 'Michael Rodriguez',
    email: 'michael.rodriguez@jdp.com',
    phone: '+61 2222 021 301',
    dob: '1985-05-15',
    address: '142 Electric Ave, Sydney, NSW 2000, Australia',
    notes: 'Experienced in high voltage systems with excellent safety record.',
    department: 'Engineering',
    dateOfJoining: '2020-01-15',
    specialization: 'High Voltage Systems',
    experience: '8 years',
    certifications: ['Licensed Electrician', 'High Voltage Certificate', 'Safety Officer'],
    hourlyRate: 85,
    availability: 'available',
    jobsCompleted: 67,
    lastAssignment: '2025-01-20',
    skills: ['High Voltage', 'Industrial Wiring', 'Safety Management', 'Team Leadership'],
    emergencyContact: '+61 2222 021 302',
    documents: {
      idProof: { name: 'driving_license.pdf', url: '/documents/driving_license.pdf' },
      photo: { name: 'profile_photo.jpg', url: '/photos/michael_photo.jpg' },
      resume: { name: 'michael_resume.pdf', url: '/resumes/michael_resume.pdf' }
    },
    permissions: {
      createJob: true,
      addClient: true,
      orderInventoryPrice: false,
      invoicePrice: true,
      invoiceGenerate: false,
      closeJob: true,
      changeLaborTime: true
    },
    agreeToTerms: true
  },
  {
    id: 'LL002',
    leadLabourId: 'LL-2025-002',
    name: 'Sarah Thompson',
    email: 'sarah.thompson@jdp.com',
    phone: '+61 2222 021 303',
    dob: '1982-03-22',
    address: '78 Power St, Melbourne, VIC 3000, Australia',
    notes: 'Expert in commercial electrical systems and team management.',
    department: 'Operations',
    dateOfJoining: '2018-03-10',
    specialization: 'Commercial Electrical',
    experience: '12 years',
    certifications: ['Master Electrician', 'Commercial License', 'Team Management'],
    hourlyRate: 95,
    availability: 'assigned',
    jobsCompleted: 103,
    lastAssignment: '2025-01-22',
    skills: ['Commercial Systems', 'Team Leadership', 'Code Compliance', 'Quality Control'],
    emergencyContact: '+61 2222 021 304',
    documents: {
      idProof: { name: 'passport.pdf', url: '/documents/passport.pdf' },
      photo: { name: 'sarah_photo.jpg', url: '/photos/sarah_photo.jpg' },
      resume: { name: 'sarah_resume.pdf', url: '/resumes/sarah_resume.pdf' }
    },
    permissions: {
      createJob: true,
      addClient: true,
      orderInventoryPrice: true,
      invoicePrice: true,
      invoiceGenerate: true,
      closeJob: true,
      changeLaborTime: true
    },
    agreeToTerms: true
  }
]

const departments = ['Engineering', 'Operations', 'Management', 'Sales', 'HR', 'Finance']
const specializations = [
  'High Voltage Systems',
  'Commercial Electrical',
  'Industrial Automation',
  'Residential & Solar',
  'Data & Communications',
  'Emergency Services',
  'Maintenance & Repair'
]

const availableCertifications = [
  'Licensed Electrician',
  'Master Electrician',
  'High Voltage Certificate',
  'Commercial License',
  'Industrial Electrician',
  'Solar Installation',
  'Safety Officer',
  'Team Management',
  'PLC Programming',
  'Automation Systems',
  'Energy Efficiency'
]

const skillOptions = [
  'High Voltage',
  'Industrial Wiring',
  'Safety Management',
  'Team Leadership',
  'Commercial Systems',
  'Code Compliance',
  'Quality Control',
  'PLC Systems',
  'Motor Controls',
  'Automation',
  'Troubleshooting',
  'Solar Systems',
  'Residential Wiring',
  'Energy Solutions',
  'Customer Service'
]

interface LeadLabourPageProps {
  onViewDetails?: (id: string) => void
}

export function LeadLabourPage({ onViewDetails }: LeadLabourPageProps) {
  const [leadLabours, setLeadLabours] = useState<LeadLabour[]>(initialLeadLabourData)
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingLeadLabour, setEditingLeadLabour] = useState<LeadLabour | null>(null)
  const [filterSpecialization, setFilterSpecialization] = useState<string>('all')
  const [filterAvailability, setFilterAvailability] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const [formData, setFormData] = useState<LeadLabourFormData>({
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

  const getAvailabilityBadge = (availability: string) => {
    switch (availability) {
      case 'available':
        return (
          <Badge className="bg-green-50 text-green-600 border-green-200 hover:bg-green-50">
            Available
          </Badge>
        )
      case 'assigned':
        return (
          <Badge className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-50">
            Assigned
          </Badge>
        )
      case 'on-leave':
        return (
          <Badge className="bg-yellow-50 text-yellow-600 border-yellow-200 hover:bg-yellow-50">
            On Leave
          </Badge>
        )
      case 'unavailable':
        return (
          <Badge className="bg-red-50 text-red-600 border-red-200 hover:bg-red-50">
            Unavailable
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

  const filteredLeadLabours = leadLabours.filter(labour => {
    const matchesSearch = labour.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         labour.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         labour.phone.includes(searchTerm) ||
                         labour.leadLabourId.includes(searchTerm) ||
                         labour.specialization.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesSpecialization = filterSpecialization === 'all' || labour.specialization === filterSpecialization
    const matchesAvailability = filterAvailability === 'all' || labour.availability === filterAvailability
    
    return matchesSearch && matchesSpecialization && matchesAvailability
  })

  const paginatedLeadLabours = filteredLeadLabours.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalPages = Math.ceil(filteredLeadLabours.length / itemsPerPage)

  const handleCreate = () => {
    if (!formData.name || !formData.email || !formData.phone || !formData.agreeToTerms) {
      toast.error('Please fill in all required fields and agree to terms')
      return
    }

    const newLeadLabour: LeadLabour = {
      id: `LL${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
      leadLabourId: generateLeadLabourId(),
      ...formData,
      documents: {
        idProof: formData.documents.idProof ? { name: formData.documents.idProof.name, url: `/documents/${formData.documents.idProof.name}` } : null,
        photo: formData.documents.photo ? { name: formData.documents.photo.name, url: `/photos/${formData.documents.photo.name}` } : null,
        resume: formData.documents.resume ? { name: formData.documents.resume.name, url: `/resumes/${formData.documents.resume.name}` } : null
      }
    }

    setLeadLabours([...leadLabours, newLeadLabour])
    resetForm()
    setIsCreateDialogOpen(false)
    toast.success('Lead Labour created successfully')
  }

  const handleEdit = (leadLabour: LeadLabour) => {
    setEditingLeadLabour(leadLabour)
    setFormData({
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
      certifications: leadLabour.certifications,
      hourlyRate: leadLabour.hourlyRate,
      availability: leadLabour.availability,
      jobsCompleted: leadLabour.jobsCompleted,
      lastAssignment: leadLabour.lastAssignment,
      skills: leadLabour.skills,
      emergencyContact: leadLabour.emergencyContact,
      documents: {
        idProof: null,
        photo: null,
        resume: null
      },
      permissions: leadLabour.permissions,
      agreeToTerms: leadLabour.agreeToTerms
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdate = () => {
    if (!editingLeadLabour) return

    if (!formData.name || !formData.email || !formData.phone) {
      toast.error('Please fill in all required fields')
      return
    }

    setLeadLabours(leadLabours.map(labour => 
      labour.id === editingLeadLabour.id 
        ? { 
            ...labour, 
            ...formData,
            documents: {
              idProof: formData.documents.idProof ? { name: formData.documents.idProof.name, url: `/documents/${formData.documents.idProof.name}` } : labour.documents.idProof,
              photo: formData.documents.photo ? { name: formData.documents.photo.name, url: `/photos/${formData.documents.photo.name}` } : labour.documents.photo,
              resume: formData.documents.resume ? { name: formData.documents.resume.name, url: `/resumes/${formData.documents.resume.name}` } : labour.documents.resume
            }
          }
        : labour
    ))
    
    setIsEditDialogOpen(false)
    setEditingLeadLabour(null)
    resetForm()
    toast.success('Lead Labour updated successfully')
  }

  const handleDelete = (id: string) => {
    setLeadLabours(leadLabours.filter(labour => labour.id !== id))
    toast.success('Lead Labour deleted successfully')
  }

  const resetForm = () => {
    setFormData({
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
  }

  const handleFileUpload = (type: 'idProof' | 'photo' | 'resume', file: File) => {
    setFormData(prev => ({
      ...prev,
      documents: {
        ...prev.documents,
        [type]: file
      }
    }))
  }

  const FileUploadArea = ({ type, label, accept }: { type: 'idProof' | 'photo' | 'resume', label: string, accept: string }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div 
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#00A1FF] transition-colors cursor-pointer"
        onClick={() => document.getElementById(`file-${type}`)?.click()}
      >
        <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
        <p className="text-sm text-gray-600">Drag and drop files here</p>
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
      {formData.documents[type] && (
        <p className="text-sm text-green-600">✓ {formData.documents[type]!.name}</p>
      )}
    </div>
  )

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

  const renderForm = () => (
    <div className="max-h-96 overflow-y-auto space-y-6">
      {/* Personal Details Section */}
      <div>
        <h3 className="text-lg font-medium text-[#2b2b2b] mb-4">Personal Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Enter full name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="leadLabourId">Lead Labour ID (Auto generated)</Label>
            <Input
              id="leadLabourId"
              value={generateLeadLabourId()}
              disabled
              className="bg-gray-100"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              placeholder="Enter phone number"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              placeholder="Enter your email address"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dob">DOB *</Label>
            <Input
              id="dob"
              type="date"
              value={formData.dob}
              onChange={(e) => setFormData({...formData, dob: e.target.value})}
            />
          </div>
          <div className="col-span-2 space-y-2">
            <Label htmlFor="address">Address *</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              placeholder="Enter address"
            />
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
      </div>

      {/* Job Details Section */}
      <div>
        <h3 className="text-lg font-medium text-[#2b2b2b] mb-4">Job Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="department">Department *</Label>
            <Select value={formData.department} onValueChange={(value) => setFormData({...formData, department: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Enter department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="dateOfJoining">Date of Joining *</Label>
            <Input
              id="dateOfJoining"
              type="date"
              value={formData.dateOfJoining}
              onChange={(e) => setFormData({...formData, dateOfJoining: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="specialization">Specialization</Label>
            <Select value={formData.specialization} onValueChange={(value) => setFormData({...formData, specialization: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Select specialization" />
              </SelectTrigger>
              <SelectContent>
                {specializations.map((spec) => (
                  <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="experience">Experience</Label>
            <Input
              id="experience"
              value={formData.experience}
              onChange={(e) => setFormData({...formData, experience: e.target.value})}
              placeholder="e.g., 5 years"
            />
          </div>
        </div>
      </div>

      {/* Document Upload Section */}
      <div>
        <h3 className="text-lg font-medium text-[#2b2b2b] mb-4">Document Upload</h3>
        <div className="grid grid-cols-3 gap-4">
          <FileUploadArea type="idProof" label="Select ID Proof *" accept=".pdf,.jpg,.jpeg,.png" />
          <FileUploadArea type="photo" label="Photo Upload *" accept=".jpg,.jpeg,.png" />
          <FileUploadArea type="resume" label="Resume Upload (Optional)" accept=".pdf,.doc,.docx" />
        </div>
      </div>

      {/* Agreement */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="agreeToTerms"
          checked={formData.agreeToTerms}
          onCheckedChange={(checked) => setFormData({...formData, agreeToTerms: checked as boolean})}
        />
        <Label htmlFor="agreeToTerms" className="text-sm">
          Agreement to terms and conditions
        </Label>
      </div>

      {/* Permissions Section */}
      <div>
        <h3 className="text-lg font-medium text-[#2b2b2b] mb-4">Permissions</h3>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(formData.permissions).map(([key, value]) => (
            <div key={key} className="flex items-center space-x-2">
              <Checkbox
                id={key}
                checked={value}
                onCheckedChange={(checked) => setFormData({
                  ...formData,
                  permissions: {
                    ...formData.permissions,
                    [key]: checked as boolean
                  }
                })}
              />
              <Label htmlFor={key} className="text-sm">
                {key === 'createJob' && 'Create Job'}
                {key === 'addClient' && 'Add Client/Customer'}
                {key === 'orderInventoryPrice' && 'Order Inventory Price'}
                {key === 'invoicePrice' && 'Invoice Price'}
                {key === 'invoiceGenerate' && 'Invoice Generate'}
                {key === 'closeJob' && 'Close Job'}
                {key === 'changeLaborTime' && 'Change Labor Time'}
              </Label>
            </div>
          ))}
        </div>
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
                <Button variant="outline" onClick={() => {setIsCreateDialogOpen(false); resetForm();}}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} className="bg-primary text-white hover:bg-[#0090e6]">
                  Submit
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
                <HardHat className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Available</p>
                <p className="text-2xl font-medium text-[#2b2b2b]">
                  {leadLabours.filter(l => l.availability === 'available').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow-md border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Assigned</p>
                <p className="text-2xl font-medium text-[#2b2b2b]">
                  {leadLabours.filter(l => l.availability === 'assigned').length}
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
              
              <Select value={filterSpecialization} onValueChange={setFilterSpecialization}>
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="Filter by Specialization" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Specializations</SelectItem>
                  {specializations.map((spec) => (
                    <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterAvailability} onValueChange={setFilterAvailability}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by Availability" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="on-leave">On Leave</SelectItem>
                  <SelectItem value="unavailable">Unavailable</SelectItem>
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
                <TableHead className="text-white font-medium">Availability</TableHead>
                <TableHead className="text-white font-medium">Date Joined</TableHead>
                <TableHead className="text-white font-medium">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedLeadLabours.map((labour, index) => (
                <TableRow key={labour.id} className={index % 2 === 1 ? "bg-[#eff4fa]" : ""}>
                  <TableCell>
                    <input type="checkbox" className="rounded border-gray-300" />
                  </TableCell>
                  <TableCell className="text-sm text-[#2b2b2b]/80">#{labour.leadLabourId}</TableCell>
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
                  <TableCell>{getAvailabilityBadge(labour.availability)}</TableCell>
                  <TableCell className="text-sm text-gray-900">{labour.dateOfJoining}</TableCell>
                  <TableCell>
                    <ActionButtonsPopup
                      onView={onViewDetails ? () => onViewDetails(labour.id) : undefined}
                      onEdit={() => handleEdit(labour)}
                      onDelete={() => handleDelete(labour.id)}
                      itemName={labour.name}
                      itemType="Lead Labour"
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
              className={currentPage === page ? "bg-primary text-white hover:bg-[#0090e6]" : ""}
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
        <DialogContent className="max-w-4xl sm:max-w-[700px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Edit Lead Labour</DialogTitle>
          </DialogHeader>
          {renderForm()}
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => {setIsEditDialogOpen(false); resetForm();}}>
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