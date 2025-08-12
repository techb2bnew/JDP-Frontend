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
  Wrench,
  Shield,
  MapPin
} from 'lucide-react'

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
  notes: string
}

interface LaborPageProps {
  onViewDetails?: (id: string) => void
}

const initialLaborData: Labor[] = [
  {
    id: 'LB001',
    laborId: 'LB-2025-001',
    name: 'Robert Johnson',
    email: 'robert.johnson@jdp.com',
    phone: '+61 2222 021 401',
    address: '156 Trade St, Sydney, NSW 2000, Australia',
    trade: 'Electrical Assistant',
    experience: '3 years',
    hourlyRate: 45,
    availability: 'available',
    jobsCompleted: 28,
    dateOfJoining: '2022-03-15',
    supervisor: 'Michael Rodriguez',
    certifications: ['Basic Electrical Safety', 'First Aid'],
    skills: ['Wire Installation', 'Basic Troubleshooting', 'Tool Maintenance'],
    notes: 'Reliable worker with good attention to detail.'
  },
  {
    id: 'LB002',
    laborId: 'LB-2025-002',
    name: 'Maria Santos',
    email: 'maria.santos@jdp.com',
    phone: '+61 2222 021 402',
    address: '89 Workshop Ave, Melbourne, VIC 3000, Australia',
    trade: 'Cable Technician',
    experience: '5 years',
    hourlyRate: 55,
    availability: 'assigned',
    jobsCompleted: 45,
    dateOfJoining: '2021-07-20',
    supervisor: 'Sarah Thompson',
    certifications: ['Cable Installation', 'Safety Officer', 'Equipment Operation'],
    skills: ['Cable Running', 'Conduit Installation', 'Equipment Setup'],
    notes: 'Experienced cable technician with strong technical skills.'
  }
]

const trades = [
  'Electrical Assistant',
  'Cable Technician',
  'Apprentice Electrician',
  'Maintenance Worker',
  'Installation Helper',
  'Equipment Operator'
]

const supervisors = [
  'Michael Rodriguez',
  'Sarah Thompson',
  'James Wilson',
  'Emma Davis'
]

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
  const [laborers, setLaborers] = useState<Labor[]>(initialLaborData)
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingLabor, setEditingLabor] = useState<Labor | null>(null)
  const [filterTrade, setFilterTrade] = useState<string>('all')
  const [filterAvailability, setFilterAvailability] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const [formData, setFormData] = useState<LaborFormData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    trade: '',
    experience: '',
    hourlyRate: 0,
    availability: 'available',
    jobsCompleted: 0,
    dateOfJoining: '',
    supervisor: '',
    certifications: [],
    skills: [],
    notes: ''
  })

  const generateLaborId = () => {
    const year = new Date().getFullYear()
    const count = laborers.length + 1
    return `LB-${year}-${String(count).padStart(3, '0')}`
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

  const filteredLaborers = laborers.filter(labor => {
    const matchesSearch = labor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         labor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         labor.phone.includes(searchTerm) ||
                         labor.laborId.includes(searchTerm) ||
                         labor.trade.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesTrade = filterTrade === 'all' || labor.trade === filterTrade
    const matchesAvailability = filterAvailability === 'all' || labor.availability === filterAvailability
    
    return matchesSearch && matchesTrade && matchesAvailability
  })

  const paginatedLaborers = filteredLaborers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalPages = Math.ceil(filteredLaborers.length / itemsPerPage)

  const handleCreate = () => {
    if (!formData.name || !formData.email || !formData.phone) {
      toast.error('Please fill in all required fields')
      return
    }

    const newLabor: Labor = {
      id: `LB${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
      laborId: generateLaborId(),
      ...formData
    }

    setLaborers([...laborers, newLabor])
    resetForm()
    setIsCreateDialogOpen(false)
    toast.success('Labor worker created successfully')
  }

  const handleEdit = (labor: Labor) => {
    setEditingLabor(labor)
    setFormData({
      name: labor.name,
      email: labor.email,
      phone: labor.phone,
      address: labor.address,
      trade: labor.trade,
      experience: labor.experience,
      hourlyRate: labor.hourlyRate,
      availability: labor.availability,
      jobsCompleted: labor.jobsCompleted,
      dateOfJoining: labor.dateOfJoining,
      supervisor: labor.supervisor,
      certifications: labor.certifications,
      skills: labor.skills,
      notes: labor.notes || ''
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdate = () => {
    if (!editingLabor) return

    if (!formData.name || !formData.email || !formData.phone) {
      toast.error('Please fill in all required fields')
      return
    }

    setLaborers(laborers.map(labor => 
      labor.id === editingLabor.id 
        ? { ...labor, ...formData }
        : labor
    ))
    
    setIsEditDialogOpen(false)
    setEditingLabor(null)
    resetForm()
    toast.success('Labor worker updated successfully')
  }

  const handleDelete = (id: string) => {
    setLaborers(laborers.filter(labor => labor.id !== id))
    toast.success('Labor worker deleted successfully')
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      trade: '',
      experience: '',
      hourlyRate: 0,
      availability: 'available',
      jobsCompleted: 0,
      dateOfJoining: '',
      supervisor: '',
      certifications: [],
      skills: [],
      notes: ''
    })
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
    'Labor ID',
    'Name',
    'Email',
    'Phone',
    'Address',
    'Trade',
    'Experience',
    'Hourly Rate',
    'Availability',
    'Jobs Completed',
    'Date of Joining',
    'Supervisor',
    'Certifications',
    'Skills',
    'Notes'
  ].join(',');

  const rows = data.map(labor => [
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

  const renderForm = () => (
    <div className="grid grid-cols-2 gap-4 py-4 max-h-96 overflow-y-auto">
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
        <Label htmlFor="laborId">Labor ID (Auto generated)</Label>
        <Input
          id="laborId"
          value={generateLaborId()}
          disabled
          className="bg-gray-100"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          placeholder="Enter email address"
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
      <div className="col-span-2 space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => setFormData({...formData, address: e.target.value})}
          placeholder="Enter full address"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="trade">Trade</Label>
        <Select value={formData.trade} onValueChange={(value) => setFormData({...formData, trade: value})}>
          <SelectTrigger>
            <SelectValue placeholder="Select trade" />
          </SelectTrigger>
          <SelectContent>
            {trades.map((trade) => (
              <SelectItem key={trade} value={trade}>{trade}</SelectItem>
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
          placeholder="e.g., 3 years"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
        <Input
          id="hourlyRate"
          type="number"
          value={formData.hourlyRate || ''}
          onChange={(e) => setFormData({...formData, hourlyRate: Number(e.target.value)})}
          placeholder="Enter hourly rate"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="supervisor">Supervisor</Label>
        <Select value={formData.supervisor} onValueChange={(value) => setFormData({...formData, supervisor: value})}>
          <SelectTrigger>
            <SelectValue placeholder="Select supervisor" />
          </SelectTrigger>
          <SelectContent>
            {supervisors.map((supervisor) => (
              <SelectItem key={supervisor} value={supervisor}>{supervisor}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="availability">Availability</Label>
        <Select value={formData.availability} onValueChange={(value: 'available' | 'assigned' | 'on-leave' | 'unavailable') => setFormData({...formData, availability: value})}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="assigned">Assigned</SelectItem>
            <SelectItem value="on-leave">On Leave</SelectItem>
            <SelectItem value="unavailable">Unavailable</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="dateOfJoining">Date of Joining</Label>
        <Input
          id="dateOfJoining"
          type="date"
          value={formData.dateOfJoining}
          onChange={(e) => setFormData({...formData, dateOfJoining: e.target.value})}
        />
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
          placeholder="Additional notes..."
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
          <Button variant="outline" className="gap-2">
            <Upload className="h-4 w-4" />
            Import
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => downloadCSV(filteredLaborers, `labor-export-${new Date().toISOString().split('T')[0]}.csv`)}>
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
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
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white shadow-sm border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Wrench className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Available</p>
                <p className="text-2xl font-medium text-[#2b2b2b]">
                  {laborers.filter(l => l.availability === 'available').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow-sm border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Assigned</p>
                <p className="text-2xl font-medium text-[#2b2b2b]">
                  {laborers.filter(l => l.availability === 'assigned').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow-sm border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#E6F6FF] rounded-lg">
                <Wrench className="h-6 w-6 text-[#00A1FF]" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Jobs</p>
                <p className="text-2xl font-medium text-[#2b2b2b]">
                  {laborers.reduce((acc, l) => acc + l.jobsCompleted, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow-sm border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Shield className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Workers</p>
                <p className="text-2xl font-medium text-[#2b2b2b]">
                  {laborers.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="bg-white shadow-sm border-0">
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
              
              <Select value={filterTrade} onValueChange={setFilterTrade}>
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="Filter by Trade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Trades</SelectItem>
                  {trades.map((trade) => (
                    <SelectItem key={trade} value={trade}>{trade}</SelectItem>
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
              <span>Total: {filteredLaborers.length}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Labor Table */}
      <Card className="bg-white shadow-sm border-0">
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
              {paginatedLaborers.map((labor, index) => (
                <TableRow key={labor.id} className={index % 2 === 1 ? "bg-[#eff4fa]" : ""}>
                  <TableCell>
                    <input type="checkbox" className="rounded border-gray-300" />
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
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Edit Labor Worker</DialogTitle>
          </DialogHeader>
          {renderForm()}
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => {setIsEditDialogOpen(false); resetForm();}}>
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