import { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Textarea } from './ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { toast } from 'sonner'
import { 
  ArrowLeft, 
  Edit, 
  Save,
  X,
  Calendar, 
  User, 
  MapPin, 
  Clock, 
  DollarSign, 
  FileText,
  Users,
  Package,
  Plus,
  Trash2,
  CheckSquare,
  AlertCircle,
  TrendingUp,
  Download,
  Send
} from 'lucide-react'

interface Job {
  id: string
  title: string
  type: 'service-based' | 'contract-based'
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled'
  assignedLabor: string[]
  contractor?: string
  customer: string
  description: string
  createdDate: string
  dueDate: string
  estimatedHours?: number
  actualHours?: number
  estimatedCost?: number
  actualCost?: number
  materials?: string[]
  location: string
  priority: 'low' | 'medium' | 'high'
  billingStatus?: 'pending' | 'invoiced' | 'paid'
}

interface Material {
  id: string
  name: string
  quantity: number
  unit: string
  unitCost: number
  totalCost: number
  supplier?: string
}

interface TimeLog {
  id: string
  laborName: string
  date: string
  hoursWorked: number
  description: string
  billable: boolean
}

interface JobDetailsPageProps {
  jobId: string
  onBack: () => void
  jobs: Job[]
  setJobs: (jobs: Job[]) => void
}

export function JobDetailsPage({ jobId, onBack, jobs, setJobs }: JobDetailsPageProps) {
  const job = jobs.find(j => j.id === jobId)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isAddingMaterial, setIsAddingMaterial] = useState(false)
  const [isAddingTimeLog, setIsAddingTimeLog] = useState(false)
  
  // Sample materials and time logs (in real app, this would come from API)
  const [materials, setMaterials] = useState<Material[]>([
    {
      id: '1',
      name: 'Electrical Panel',
      quantity: 1,
      unit: 'unit',
      unitCost: 450,
      totalCost: 450,
      supplier: 'ElectroSupply Co'
    },
    {
      id: '2',
      name: 'Copper Wire (12 AWG)',
      quantity: 500,
      unit: 'ft',
      unitCost: 2.5,
      totalCost: 1250,
      supplier: 'Wire World'
    },
    {
      id: '3',
      name: 'Circuit Breakers',
      quantity: 6,
      unit: 'unit',
      unitCost: 35,
      totalCost: 210,
      supplier: 'ElectroSupply Co'
    }
  ])

  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([
    {
      id: '1',
      laborName: 'John Smith',
      date: '2025-01-20',
      hoursWorked: 8,
      description: 'Panel installation and initial wiring',
      billable: true
    },
    {
      id: '2',
      laborName: 'David Wilson',
      date: '2025-01-20',
      hoursWorked: 6,
      description: 'Assisting with panel installation',
      billable: true
    },
    {
      id: '3',
      laborName: 'John Smith',
      date: '2025-01-21',
      hoursWorked: 7,
      description: 'Circuit breaker installation',
      billable: true
    }
  ])

  const [editFormData, setEditFormData] = useState({
    title: job?.title || '',
    type: job?.type || 'service-based',
    status: job?.status || 'pending',
    assignedLabor: job?.assignedLabor || [],
    contractor: job?.contractor || '',
    customer: job?.customer || '',
    description: job?.description || '',
    dueDate: job?.dueDate || '',
    estimatedHours: job?.estimatedHours || 0,
    actualHours: job?.actualHours || 0,
    estimatedCost: job?.estimatedCost || 0,
    actualCost: job?.actualCost || 0,
    location: job?.location || '',
    priority: job?.priority || 'medium',
    billingStatus: job?.billingStatus || 'pending'
  })

  const [materialFormData, setMaterialFormData] = useState({
    name: '',
    quantity: 0,
    unit: 'unit',
    unitCost: 0,
    supplier: ''
  })

  const [timeLogFormData, setTimeLogFormData] = useState({
    laborName: '',
    date: '',
    hoursWorked: 0,
    description: '',
    billable: true
  })

  if (!job) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Jobs
          </Button>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">Job not found.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleSave = () => {
    const updatedJob = {
      ...job,
      ...editFormData
    }
    
    setJobs(jobs.map(j => j.id === jobId ? updatedJob : j))
    setIsEditMode(false)
    toast.success('Job updated successfully')
  }

  const handleAddMaterial = () => {
    if (!materialFormData.name || materialFormData.quantity <= 0 || materialFormData.unitCost <= 0) {
      toast.error('Please fill in all required fields')
      return
    }

    const newMaterial: Material = {
      id: Math.random().toString(36).substr(2, 9),
      name: materialFormData.name,
      quantity: materialFormData.quantity,
      unit: materialFormData.unit,
      unitCost: materialFormData.unitCost,
      totalCost: materialFormData.quantity * materialFormData.unitCost,
      supplier: materialFormData.supplier
    }

    setMaterials([...materials, newMaterial])
    setMaterialFormData({
      name: '',
      quantity: 0,
      unit: 'unit',
      unitCost: 0,
      supplier: ''
    })
    setIsAddingMaterial(false)
    toast.success('Material added successfully')
  }

  const handleAddTimeLog = () => {
    if (!timeLogFormData.laborName || !timeLogFormData.date || timeLogFormData.hoursWorked <= 0) {
      toast.error('Please fill in all required fields')
      return
    }

    const newTimeLog: TimeLog = {
      id: Math.random().toString(36).substr(2, 9),
      laborName: timeLogFormData.laborName,
      date: timeLogFormData.date,
      hoursWorked: timeLogFormData.hoursWorked,
      description: timeLogFormData.description,
      billable: timeLogFormData.billable
    }

    setTimeLogs([...timeLogs, newTimeLog])
    setTimeLogFormData({
      laborName: '',
      date: '',
      hoursWorked: 0,
      description: '',
      billable: true
    })
    setIsAddingTimeLog(false)
    toast.success('Time log added successfully')
  }

  const handleGenerateInvoice = () => {
    toast.success('Invoice generated successfully')
  }

  const handleSendInvoice = () => {
    toast.success('Invoice sent to customer')
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge className="bg-yellow-50 text-yellow-600 border-yellow-200 hover:bg-yellow-50">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        )
      case 'in-progress':
        return (
          <Badge className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-50">
            <Clock className="w-3 h-3 mr-1" />
            In Progress
          </Badge>
        )
      case 'completed':
        return (
          <Badge className="bg-green-50 text-green-600 border-green-200 hover:bg-green-50">
            <CheckSquare className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        )
      case 'cancelled':
        return (
          <Badge className="bg-red-50 text-red-600 border-red-200 hover:bg-red-50">
            Cancelled
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

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return (
          <Badge className="bg-red-50 text-red-600 border-red-200 hover:bg-red-50">
            <AlertCircle className="w-3 h-3 mr-1" />
            High Priority
          </Badge>
        )
      case 'medium':
        return (
          <Badge className="bg-yellow-50 text-yellow-600 border-yellow-200 hover:bg-yellow-50">
            Medium Priority
          </Badge>
        )
      case 'low':
        return (
          <Badge className="bg-green-50 text-green-600 border-green-200 hover:bg-green-50">
            Low Priority
          </Badge>
        )
      default:
        return (
          <Badge className="bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-50">
            {priority}
          </Badge>
        )
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  const totalMaterialCost = materials.reduce((sum, material) => sum + material.totalCost, 0)
  const totalBillableHours = timeLogs.filter(log => log.billable).reduce((sum, log) => sum + log.hoursWorked, 0)
  const totalHours = timeLogs.reduce((sum, log) => sum + log.hoursWorked, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Jobs
          </Button>
        </div>
        
        <div className="flex items-center gap-3">
          {isEditMode ? (
            <>
              <Button variant="outline" onClick={() => setIsEditMode(false)} className="gap-2">
                <X className="h-4 w-4" />
                Cancel
              </Button>
              <Button onClick={handleSave} className="bg-[#00A1FF] hover:bg-[#0090e6] gap-2">
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleGenerateInvoice} className="gap-2">
                <Download className="h-4 w-4" />
                Generate Invoice
              </Button>
              <Button variant="outline" onClick={handleSendInvoice} className="gap-2">
                <Send className="h-4 w-4" />
                Send Invoice
              </Button>
              <Button onClick={() => setIsEditMode(true)} className="bg-[#00A1FF] hover:bg-[#0090e6] gap-2">
                <Edit className="h-4 w-4" />
                Edit Job
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Job Header Card */}
      <Card className="bg-white shadow-sm border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-2">
              {isEditMode ? (
                <Input
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({...editFormData, title: e.target.value})}
                  className="text-2xl font-medium"
                />
              ) : (
                <h1 className="text-2xl font-medium text-[#2b2b2b]">{job.title}</h1>
              )}
              <p className="text-sm text-gray-600">#{job.id}</p>
            </div>
            
            <div className="flex items-center gap-3">
              {getStatusBadge(isEditMode ? editFormData.status : job.status)}
              {getPriorityBadge(isEditMode ? editFormData.priority : job.priority)}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Customer</p>
                  {isEditMode ? (
                    <Input
                      value={editFormData.customer}
                      onChange={(e) => setEditFormData({...editFormData, customer: e.target.value})}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm font-medium text-[#2b2b2b]">{job.customer}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Contractor</p>
                  {isEditMode ? (
                    <Input
                      value={editFormData.contractor}
                      onChange={(e) => setEditFormData({...editFormData, contractor: e.target.value})}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm font-medium text-[#2b2b2b]">{job.contractor}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Location</p>
                  {isEditMode ? (
                    <Input
                      value={editFormData.location}
                      onChange={(e) => setEditFormData({...editFormData, location: e.target.value})}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm font-medium text-[#2b2b2b]">{job.location}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Due Date</p>
                  {isEditMode ? (
                    <Input
                      type="date"
                      value={editFormData.dueDate}
                      onChange={(e) => setEditFormData({...editFormData, dueDate: e.target.value})}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm font-medium text-[#2b2b2b]">{formatDate(job.dueDate)}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Estimated Hours</p>
                  {isEditMode ? (
                    <Input
                      type="number"
                      value={editFormData.estimatedHours}
                      onChange={(e) => setEditFormData({...editFormData, estimatedHours: Number(e.target.value)})}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm font-medium text-[#2b2b2b]">{job.estimatedHours || 'N/A'}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <TrendingUp className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Actual Hours</p>
                  <p className="text-sm font-medium text-[#2b2b2b]">{totalHours}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <DollarSign className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Estimated Cost</p>
                  {isEditMode ? (
                    <Input
                      type="number"
                      value={editFormData.estimatedCost}
                      onChange={(e) => setEditFormData({...editFormData, estimatedCost: Number(e.target.value)})}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm font-medium text-[#2b2b2b]">{formatCurrency(job.estimatedCost || 0)}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <DollarSign className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Material Cost</p>
                  <p className="text-sm font-medium text-[#2b2b2b]">{formatCurrency(totalMaterialCost)}</p>
                </div>
              </div>
            </div>
          </div>

          {isEditMode && (
            <>
              <Separator className="my-6" />
              <div className="space-y-4">
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={editFormData.status} onValueChange={(value: any) => setEditFormData({...editFormData, status: value})}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={editFormData.priority} onValueChange={(value: any) => setEditFormData({...editFormData, priority: value})}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </>
          )}

          {!isEditMode && (
            <>
              <Separator className="my-6" />
              <div>
                <p className="text-sm text-gray-600 mb-2">Description</p>
                <p className="text-sm text-[#2b2b2b]">{job.description}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Materials Section */}
      <Card className="bg-white shadow-sm border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-[#00A1FF]" />
              Materials Used
            </CardTitle>
            <Button 
              onClick={() => setIsAddingMaterial(true)}
              className="bg-[#00A1FF] hover:bg-[#0090e6] gap-2"
              size="sm"
            >
              <Plus className="h-4 w-4" />
              Add Material
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit Cost</TableHead>
                <TableHead>Total Cost</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materials.map((material) => (
                <TableRow key={material.id}>
                  <TableCell className="font-medium">{material.name}</TableCell>
                  <TableCell>{material.quantity} {material.unit}</TableCell>
                  <TableCell>{formatCurrency(material.unitCost)}</TableCell>
                  <TableCell>{formatCurrency(material.totalCost)}</TableCell>
                  <TableCell>{material.supplier || 'N/A'}</TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setMaterials(materials.filter(m => m.id !== material.id))}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-end">
              <div className="text-right">
                <p className="text-sm text-gray-600">Total Material Cost</p>
                <p className="text-lg font-medium text-[#2b2b2b]">{formatCurrency(totalMaterialCost)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time Logs Section */}
      <Card className="bg-white shadow-sm border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-[#00A1FF]" />
              Time Logs
            </CardTitle>
            <Button 
              onClick={() => setIsAddingTimeLog(true)}
              className="bg-[#00A1FF] hover:bg-[#0090e6] gap-2"
              size="sm"
            >
              <Plus className="h-4 w-4" />
              Add Time Log
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Labor</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Billable</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {timeLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">{log.laborName}</TableCell>
                  <TableCell>{formatDate(log.date)}</TableCell>
                  <TableCell>{log.hoursWorked}h</TableCell>
                  <TableCell>{log.description}</TableCell>
                  <TableCell>
                    <Badge className={log.billable ? "bg-green-50 text-green-600 border-green-200" : "bg-gray-50 text-gray-600 border-gray-200"}>
                      {log.billable ? 'Yes' : 'No'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setTimeLogs(timeLogs.filter(l => l.id !== log.id))}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Total Hours Worked</p>
              <p className="text-lg font-medium text-[#2b2b2b]">{totalHours}h</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Billable Hours</p>
              <p className="text-lg font-medium text-[#2b2b2b]">{totalBillableHours}h</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Material Dialog */}
      <Dialog open={isAddingMaterial} onOpenChange={setIsAddingMaterial}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Material</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="materialName">Material Name *</Label>
              <Input
                id="materialName"
                value={materialFormData.name}
                onChange={(e) => setMaterialFormData({...materialFormData, name: e.target.value})}
                placeholder="Enter material name"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={materialFormData.quantity || ''}
                  onChange={(e) => setMaterialFormData({...materialFormData, quantity: Number(e.target.value)})}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="unit">Unit</Label>
                <Select value={materialFormData.unit} onValueChange={(value) => setMaterialFormData({...materialFormData, unit: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unit">Unit</SelectItem>
                    <SelectItem value="ft">Feet</SelectItem>
                    <SelectItem value="lb">Pounds</SelectItem>
                    <SelectItem value="box">Box</SelectItem>
                    <SelectItem value="roll">Roll</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="unitCost">Unit Cost *</Label>
              <Input
                id="unitCost"
                type="number"
                step="0.01"
                value={materialFormData.unitCost || ''}
                onChange={(e) => setMaterialFormData({...materialFormData, unitCost: Number(e.target.value)})}
                placeholder="0.00"
              />
            </div>
            
            <div>
              <Label htmlFor="supplier">Supplier</Label>
              <Input
                id="supplier"
                value={materialFormData.supplier}
                onChange={(e) => setMaterialFormData({...materialFormData, supplier: e.target.value})}
                placeholder="Enter supplier name"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setIsAddingMaterial(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddMaterial} className="bg-[#00A1FF] hover:bg-[#0090e6]">
              Add Material
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Time Log Dialog */}
      <Dialog open={isAddingTimeLog} onOpenChange={setIsAddingTimeLog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Time Log</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="laborName">Labor Name *</Label>
              <Select value={timeLogFormData.laborName} onValueChange={(value) => setTimeLogFormData({...timeLogFormData, laborName: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select labor" />
                </SelectTrigger>
                <SelectContent>
                  {job.assignedLabor.map((labor) => (
                    <SelectItem key={labor} value={labor}>{labor}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={timeLogFormData.date}
                  onChange={(e) => setTimeLogFormData({...timeLogFormData, date: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="hoursWorked">Hours Worked *</Label>
                <Input
                  id="hoursWorked"
                  type="number"
                  step="0.5"
                  value={timeLogFormData.hoursWorked || ''}
                  onChange={(e) => setTimeLogFormData({...timeLogFormData, hoursWorked: Number(e.target.value)})}
                  placeholder="0"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={timeLogFormData.description}
                onChange={(e) => setTimeLogFormData({...timeLogFormData, description: e.target.value})}
                placeholder="Describe the work performed"
                rows={3}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="billable"
                checked={timeLogFormData.billable}
                onChange={(e) => setTimeLogFormData({...timeLogFormData, billable: e.target.checked})}
                className="rounded border-gray-300"
              />
              <Label htmlFor="billable">Billable hours</Label>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setIsAddingTimeLog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTimeLog} className="bg-[#00A1FF] hover:bg-[#0090e6]">
              Add Time Log
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}