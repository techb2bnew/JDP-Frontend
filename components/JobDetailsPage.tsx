import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  ArrowLeft,
  Edit,
  FileText,
  Send,
  Printer,
  Clock,
  Package,
  Users,
  TrendingUp,
  Plus,
  Eye,
  Trash2,
  Building,
  ClockIcon,
  X,
  Check,
  MapPin
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// Sample data structure - replace with your actual data
const sampleJobData = {
  "job": {
    "id": "JOB-2025-001",
    "title": "Electrical Panel Installation",
    "type": "service-based",
    "status": "in-progress",
    "assignedLabor": [],
    "contractor": "ABC Corporation",
    "customer": "ABC Corporation",
    "description": "Install new electrical panel and upgrade wiring system",
    "createdDate": "2025-01-10",
    "dueDate": "2025-01-30",
    "estimatedHours": 40,
    "actualHours": 32,
    "estimatedCost": 5000,
    "actualCost": 5330,
    "location": "123 Business Ave, New York",
    "priority": "high",
    "billingStatus": "invoiced"
  },
  "materials": [
    {
      "id": "1",
      "name": "Electrical Panel",
      "quantity": 1,
      "unit": "unit",
      "unitCost": 450,
      "totalCost": 450,
      "supplier": "ElectroSupply Co"
    },
    {
      "id": "2",
      "name": "Copper Wire - 12 AWG",
      "quantity": 500,
      "unit": "feet",
      "unitCost": 2.5,
      "totalCost": 1250,
      "supplier": "Wire World"
    },
    {
      "id": "3",
      "name": "Circuit Breakers - 20A",
      "quantity": 6,
      "unit": "unit",
      "unitCost": 35,
      "totalCost": 210,
      "supplier": "ElectroSupply Co"
    }
  ],
  "timeLogs": [
    {
      "id": "1",
      "laborName": "Mike Johnson",
      "date": "2025-01-18",
      "hoursWorked": 8,
      "description": "Panel installation and wiring",
      "billable": true
    },
    {
      "id": "2",
      "laborName": "David Wilson",
      "date": "2025-01-20",
      "hoursWorked": 6,
      "description": "Assisted with panel installation",
      "billable": true
    },
    {
      "id": "3",
      "laborName": "Mike Johnson",
      "date": "2025-01-21",
      "hoursWorked": 10,
      "description": "Circuit breaker installation",
      "billable": true
    },
    {
      "id": "4",
      "laborName": "Sarah Davis",
      "date": "2025-01-22",
      "hoursWorked": 6,
      "description": "Final connections and cleanup",
      "billable": false
    }
  ],
  "invoices": [
    {
      "id": "INV-2025-001",
      "type": "Estimate",
      "description": "Initial project estimate with detailed breakdown",
      "amount": 15000,
      "status": "Sent",
      "createdDate": "2025-01-14",
      "dueDate": "2025-01-28"
    },
    {
      "id": "INV-2025-002",
      "type": "Proposal Invoice",
      "description": "Project proposal accepted by client",
      "amount": 15000,
      "status": "Paid",
      "createdDate": "2025-01-16",
      "dueDate": "2025-01-30"
    },
    {
      "id": "INV-2025-003",
      "type": "Progressive Invoice",
      "description": "50% completion milestone payment",
      "amount": 7500,
      "status": "Paid",
      "createdDate": "2025-01-30",
      "dueDate": "2025-02-13"
    },
    {
      "id": "INV-2025-004",
      "type": "Final Invoice",
      "description": "Project completion final payment",
      "amount": 7500,
      "status": "Paid",
      "createdDate": "2025-02-15",
      "dueDate": "2025-03-01"
    }
  ]
}

interface JobDetailsPageProps {
  jobId: string
  onBack: () => void
  jobs: any[]
  setJobs: (jobs: any[]) => void
}

export function JobDetailsPage({ jobId, onBack, jobs, setJobs }: JobDetailsPageProps) {
  // Find the job from your jobs array or use sample data
  const job = jobs.find(j => j.id === jobId) || sampleJobData.job
  const materials = sampleJobData.materials // Replace with actual materials data
  const timeLogs = sampleJobData.timeLogs // Replace with actual time logs data
  const invoices = sampleJobData.invoices // Replace with actual invoices data

  // Calculate totals
  const totalMaterialCost = materials.reduce((sum, material) => sum + material.totalCost, 0)
  const totalLaborCost = 1550 // Based on the design
  const totalHours = timeLogs.reduce((sum, log) => sum + log.hoursWorked, 0)
  const totalMaterialItems = materials.reduce((sum, material) => sum + material.quantity, 0)
  const totalLaborEntries = timeLogs.length;
  const totalInvoices = invoices.length;
  const [showEditJobModal, setShowEditJobModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showAddInvoiceModal, setShowAddInvoiceModal] = useState(false);
  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);
  const [showAddTimeLogModal, setShowAddTimeLogModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedJob, setEditedJob] = useState({
    title: job.title,
    type: job.type,
    location: job.location,
    description: job.description,
    contractor: job.contractor || job.customer,
    startDate: '01/15/2025',
    priority: 'High'
  });
  const handleSave = () => {
    // Save logic here
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedJob({
      title: job.title,
      type: job.type,
      location: job.location,
      description: job.description,
      contractor: job.contractor || job.customer,
      startDate: '01/15/2025',
      priority: 'High'
    });
    setIsEditing(false);
  };
  const [jobFormData, setJobFormData] = useState({
    title: job.title,
    type: job.type,
    location: job.location,
    description: job.description
  });

  const [invoiceFormData, setInvoiceFormData] = useState({
    type: 'Estimate',
    dueDate: '',
    description: '',
    amount: 0
  });

  const [materialFormData, setMaterialFormData] = useState({
    name: '',
    quantity: 0,
    unitCost: 0,
    sku: '',
    unit: 'Pieces',
    supplier: ''
  });

  const [timeLogFormData, setTimeLogFormData] = useState({
    workerName: '',
    role: 'Lead Electrician',
    hoursWorked: 0,
    hourlyRate: 0,
    description: ''
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  type StatusType = 'in-progress' | 'sent' | 'paid' | 'approved' | 'pending';

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<StatusType, { color: string; text: string }> = {
      'in-progress': { color: 'bg-blue-100 text-blue-800', text: 'In Progress' },
      'sent': { color: 'bg-gray-100 text-gray-800', text: 'Sent' },
      'paid': { color: 'bg-green-100 text-green-800', text: 'Paid' },
      'approved': { color: 'bg-green-100 text-green-800', text: 'Approved' },
      'pending': { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' }
    };

    // Type assertion for known status values
    const normalizedStatus = status.toLowerCase() as StatusType;
    const config = statusConfig[normalizedStatus] || { color: 'bg-gray-100 text-gray-800', text: status };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    return (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
        High Priority
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onBack} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Jobs
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2">
              <FileText className="h-4 w-4" />
              Generate Invoice
            </Button>
            <Button variant="outline" className="gap-2">
              <Send className="h-4 w-4" />
              Send Invoice
            </Button>
            <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4" />
              Edit Job
            </Button>
            <Button variant="outline" className="gap-2">
              <Printer className="h-4 w-4" />
              Print
            </Button>
          </div>
        </div>

        {/* Job Title and Status */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{job.title}</h1>
            <p className="text-sm text-gray-600">#{job.id}</p>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(job.status)}
            {getPriorityBadge(job.priority)}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total Hours Worked</p>
                  <p className="text-2xl font-bold text-blue-900">{totalHours}</p>
                  <p className="text-xs text-blue-600">hours</p>
                </div>
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Total Material Used</p>
                  <p className="text-2xl font-bold text-green-900">{totalMaterialItems}</p>
                  <p className="text-xs text-green-600">items</p>
                </div>
                <Package className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Total Labour Entries</p>
                  <p className="text-2xl font-bold text-purple-900">{totalLaborEntries}</p>
                  <p className="text-xs text-purple-600">entries</p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">Number of Invoices</p>
                  <p className="text-2xl font-bold text-orange-900">{totalInvoices}</p>
                  <p className="text-xs text-orange-600">invoices</p>
                </div>
                <FileText className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Job Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Details Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between bg-gray-100 pb-5 rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Job Details
                </CardTitle>
                {!isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className={`flex items-center gap-3 ${!isEditing ? 'bg-[#f2f0f0] p-3 rounded-md' : ''}`}>
                      {!isEditing && (
                        <Users className="h-4 w-4 text-black-600" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm text-gray-600"> {isEditing ? "Job Title" : "Customer/Contractor"}</p>
                        {isEditing ? (
                          <Input
                            value={editedJob.contractor}
                            onChange={(e) => setEditedJob({ ...editedJob, contractor: e.target.value })}
                          />
                        ) : (
                          <p className="font-medium">{editedJob.contractor}</p>
                        )}
                      </div>
                    </div>
                    {!isEditing && (
                      <div className={`flex items-center gap-3 ${!isEditing ? 'bg-[#dae8ff80] p-3 rounded-md' : ''}`}>
                        <Clock className="h-4 w-4 text-black-600" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-600">Start Date</p>
                          {isEditing ? (
                            <Input
                              value={editedJob.startDate}
                              onChange={(e) => setEditedJob({ ...editedJob, startDate: e.target.value })}
                            />
                          ) : (
                            <p className="font-medium">{editedJob.startDate}</p>
                          )}
                        </div>
                      </div>
                    )}
                    {!isEditing && (
                      <div className={`flex items-center gap-3 ${!isEditing ? 'bg-[#bbf7d021] p-3 rounded-md' : ''}`}>
                        <MapPin className="h-4 w-4 text-black-600" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-600">Location</p>
                          <p className="font-medium">{editedJob.location}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className={`flex-1 ${!isEditing ? 'bg-[#dbdaff30] p-3 rounded-md' : ''}`}>
                      <p className="text-sm text-gray-600">Job Type</p>
                      {isEditing ? (
                        <Select
                          value={editedJob.priority}
                          onValueChange={(value) => setEditedJob({ ...editedJob, priority: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="High">Service-based</SelectItem>
                            <SelectItem value="Medium">Contract-based</SelectItem>
                            <SelectItem value="Low">Maintenance</SelectItem>
                          </SelectContent>
                        </Select>

                        // <Input
                        //   value={editedJob.type}
                        //   onChange={(e) => setEditedJob({ ...editedJob, type: e.target.value })}
                        // />
                      ) : (
                        <p className="font-medium">{editedJob.type}</p>
                      )}
                    </div>
                    {!isEditing && (
                      <div className={`flex-1 ${!isEditing ? 'bg-[#fff7ed8c] p-3 rounded-md' : ''}`}>
                        <p className="text-sm text-gray-600">Job Estimate</p>
                        <p className="font-medium">{formatCurrency(job.estimatedCost)}</p>
                      </div>
                    )}
                    {!isEditing && (

                      <div className={`flex-1 ${!isEditing ? 'bg-[#9f6b290d] p-3 rounded-md' : ''}`}>
                        <p className="text-sm text-gray-600">Priority</p>
                        <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {editedJob.priority}
                        </span>
                      </div>
                    )}

                  </div>
                </div>
                {isEditing && (
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">Location</p>
                      <Input
                        value={editedJob.location}
                        onChange={(e) => setEditedJob({ ...editedJob, location: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-sm text-gray-600 mb-2">Description</p>
                  {isEditing ? (
                    <Textarea
                      value={editedJob.description}
                      onChange={(e) => setEditedJob({ ...editedJob, description: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm bg-gray-100 p-3 rounded-md">{editedJob.description}</p>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                {isEditing && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-1" onClick={handleCancel}>
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                    <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleSave}>
                      <Check className="h-4 w-4" />
                      Save
                    </Button>
                  </div>
                )}
              </CardFooter>
            </Card>

            {/* Transaction History */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between bg-gray-100 pb-5 rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Transaction History
                </CardTitle>
                <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowAddInvoiceModal(true)}>
                  <Plus className="h-4 w-4" />
                  Add Invoice
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {invoices.map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-gray-200 rounded-lg flex items-center justify-center">
                          <FileText className="h-5 w-5 text-gray-700" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{invoice.type}</h4>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${invoice.type === 'Estimate' ? 'bg-blue-100 text-blue-800' :
                              invoice.type === 'Proposal Invoice' ? 'bg-purple-100 text-purple-800' :
                                invoice.type === 'Progressive Invoice' ? 'bg-orange-100 text-orange-800' :
                                  'bg-green-100 text-green-800'
                              }`}>
                              {invoice.type}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{invoice.description}</p>
                          <p className="text-xs text-gray-500">
                            #{invoice.id} • Created: {invoice.createdDate} • Due: {invoice.dueDate}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-semibold mb-1">{formatCurrency(invoice.amount)}</p>
                          <span>
                            {getStatusBadge(job.status)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" className="gap-1"
                            onClick={() => {
                              setSelectedInvoice(invoice);
                              setShowInvoiceModal(true);
                            }}>
                            <Eye className="h-3 w-3" />
                            View
                          </Button>
                          <Button variant="outline" size="sm" className="gap-1">
                            <Printer className="h-3 w-3" />
                            Print
                          </Button>
                          <Button variant="outline" size="sm" className="gap-1">
                            <Trash2 className="h-3 w-3 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Material Usage */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between bg-gray-100 pb-5 rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Material Usage
                </CardTitle>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">
                    Total Cost: <span className="font-semibold">{formatCurrency(totalMaterialCost)}</span>
                  </span>
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowAddMaterialModal(true)}>
                    <Plus className="h-4 w-4" />
                    Add Material
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {materials.map((material) => (
                    <div key={material.id} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-blue-200 rounded-lg flex items-center justify-center">
                          <Package className="h-5 w-5 text-blue-700" />
                        </div>
                        <div>
                          <h4 className="font-medium">{material.name}</h4>
                          <p className="text-xs text-gray-600">
                            {material.supplier} • SKU: {material.name.includes('Wire') ? 'CW-12AWG-CU' : 'CB-20A-SP'} • 01/22/2025
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(material.totalCost)}</p>
                          <p className="text-sm text-gray-600">{material.quantity} {material.unit}</p>
                        </div>
                        <Button variant="outline" size="sm" className="gap-1">
                          <Trash2 className="h-3 w-3 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Labour & Time Logs */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between bg-gray-100 pb-5 rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Labour & Time Logs
                </CardTitle>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">
                    Total Cost: <span className="font-semibold">{formatCurrency(totalLaborCost)}</span>
                  </span>
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowAddTimeLogModal(true)}>
                    <Plus className="h-4 w-4" />
                    Add Time Log
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {timeLogs.map((log, index) => (
                    <div key={log.id} className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-green-200 rounded-lg flex items-center justify-center">
                          <Users className="h-5 w-5 text-green-700" />
                        </div>
                        <div>
                          <h4 className="font-medium">{log.laborName}</h4>
                          <p className="text-xs text-gray-600">
                            {log.laborName === 'Mike Johnson' ? 'Lead Electrician' :
                              log.laborName === 'David Wilson' ? 'Electrician' :
                                log.laborName === 'Sarah Davis' ? 'Electrician' : 'Electrician'} • {log.date} • {log.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-semibold">
                            {log.laborName === 'Mike Johnson' && index === 0 ? '$440.00' :
                              log.laborName === 'David Wilson' ? '$320.00' :
                                log.laborName === 'Mike Johnson' && index === 2 ? '$550.00' :
                                  '$240.00'}
                          </p>
                          <p className="text-sm text-gray-600">
                            {log.hoursWorked} hrs @ {
                              log.laborName === 'Mike Johnson' ? '$55.00/hr' :
                                log.laborName === 'David Wilson' ? '$40.00/hr' :
                                  '$40.00/hr'
                            }
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {log.billable ? (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Approved
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Pending
                            </span>
                          )}
                          <Button variant="outline" size="sm" className="gap-1">
                            <Trash2 className="h-3 w-3 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Project Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Project Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Job Estimate</span>
                    <span className="font-medium">{formatCurrency(job.estimatedCost)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Materials Cost</span>
                    <span className="font-medium">{formatCurrency(totalMaterialCost)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Labor Cost</span>
                    <span className="font-medium">{formatCurrency(totalLaborCost)}</span>
                  </div>

                  <hr />

                  <div className="flex justify-between">
                    <span className="font-medium">Actual Project Cost</span>
                    <span className="font-bold text-lg">{formatCurrency(job.actualCost)}</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Project Progress</span>
                    <span className="text-sm font-medium">50%</span>
                  </div>
                  <Progress value={50} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                  <FileText className="h-4 w-4" />
                  Generate Invoice
                </Button>
                <Button variant="outline" className="w-full gap-2">
                  <Send className="h-4 w-4" />
                  Send to Customer
                </Button>
                <Button variant="outline" className="w-full gap-2">
                  <Printer className="h-4 w-4" />
                  Print Report
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>


      {/* Add Invoice Modal */}
      <Dialog open={showAddInvoiceModal} onOpenChange={setShowAddInvoiceModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Invoice</DialogTitle>
            <DialogDescription>Create a new invoice for this job</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className='mb-2'>Invoice Type</Label>
                <Select
                  value={invoiceFormData.type}
                  onValueChange={(value) => setInvoiceFormData({ ...invoiceFormData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Estimate">Estimate</SelectItem>
                    <SelectItem value="Proposal Invoice">Proposal Invoice</SelectItem>
                    <SelectItem value="Progressive Invoice">Progressive Invoice</SelectItem>
                    <SelectItem value="Final Invoice">Final Invoice</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className='mb-2'>Amount</Label>
                <Input
                  type="number"
                  value={invoiceFormData.amount}
                  onChange={(e) => setInvoiceFormData({ ...invoiceFormData, amount: Number(e.target.value) })}
                />
              </div>
            </div>
            <div>
              <Label className='mb-2'>Due Date</Label>
              <Input
                type="date"
                value={invoiceFormData.dueDate}
                onChange={(e) => setInvoiceFormData({ ...invoiceFormData, dueDate: e.target.value })}
              />
            </div>

            <div>
              <Label className='mb-2'>Description</Label>
              <Textarea
                value={invoiceFormData.description}
                onChange={(e) => setInvoiceFormData({ ...invoiceFormData, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddInvoiceModal(false)}>
              Cancel
            </Button>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => {
              // Save logic here
              setShowAddInvoiceModal(false);
            }}>
              Add Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Material Modal */}
      <Dialog open={showAddMaterialModal} onOpenChange={setShowAddMaterialModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Material</DialogTitle>
            <DialogDescription>Add a new material to this job</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className='grid grid-cols-2 gap-2'>
              <div>
                <Label className="mb-2">Material Name</Label>
                <Input
                  value={materialFormData.name}
                  onChange={(e) => setMaterialFormData({ ...materialFormData, name: e.target.value })}
                />
              </div>
              <div>
                <Label className="mb-2">SKU</Label>
                <Input
                  value={materialFormData.sku}
                  onChange={(e) => setMaterialFormData({ ...materialFormData, sku: e.target.value })}
                />
              </div>

            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="mb-2">Quantity</Label>
                <Input
                  type="number"
                  value={materialFormData.quantity}
                  onChange={(e) => setMaterialFormData({ ...materialFormData, quantity: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label className="mb-2">Unit</Label>
                <Select
                  value={materialFormData.unit}
                  onValueChange={(value) => setMaterialFormData({ ...materialFormData, unit: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pieces">Pieces</SelectItem>
                    <SelectItem value="Feet">Feet</SelectItem>
                    <SelectItem value="Box">Box</SelectItem>
                    <SelectItem value="Roll">Roll</SelectItem>
                  </SelectContent>
                </Select>
              </div>


            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="mb-2">Unit Cost</Label>
                <Input
                  type="number"
                  value={materialFormData.unitCost}
                  onChange={(e) => setMaterialFormData({ ...materialFormData, unitCost: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label className="mb-2">Supplier</Label>
                <Input
                  value={materialFormData.supplier}
                  onChange={(e) => setMaterialFormData({ ...materialFormData, supplier: e.target.value })}
                />
              </div>
            </div>
            <div className='bg-blue-100 p-3 border border-blue-300 rounded flex items-center gap-2'>
              <Building className='w-4 h-4' />
              <Label>Total Cost: ${(materialFormData.quantity * materialFormData.unitCost).toFixed(2)}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddMaterialModal(false)}>
              Cancel
            </Button>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => {
              // Save logic here
              setShowAddMaterialModal(false);
            }}>
              Add Material
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Time Log Modal */}
      <Dialog open={showAddTimeLogModal} onOpenChange={setShowAddTimeLogModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Labor Time Log</DialogTitle>
            <DialogDescription>Add a new labor time entry for this job</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">

              <div>
                <Label className="mb-2">Worker Name</Label>
                <Input
                  value={timeLogFormData.workerName}
                  onChange={(e) => setTimeLogFormData({ ...timeLogFormData, workerName: e.target.value })}
                />
              </div>
              <div>
                <Label className="mb-2">Role</Label>
                <Input
                  value={timeLogFormData.role}
                  onChange={(e) => setTimeLogFormData({ ...timeLogFormData, role: e.target.value })}
                  placeholder="e.g., Lead Electrician"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="mb-2">Hours Worked</Label>
                <Input
                  type="number"
                  value={timeLogFormData.hoursWorked}
                  onChange={(e) => setTimeLogFormData({ ...timeLogFormData, hoursWorked: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label className="mb-2">Hourly Rate</Label>
                <Input
                  type="number"
                  value={timeLogFormData.hourlyRate}
                  onChange={(e) => setTimeLogFormData({ ...timeLogFormData, hourlyRate: Number(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <Label className="mb-2">Description</Label>
              <Textarea
                value={timeLogFormData.description}
                onChange={(e) => setTimeLogFormData({ ...timeLogFormData, description: e.target.value })}
                placeholder="Describe the work performed"
              />
            </div>
            <div className='bg-blue-100 p-3 border border-blue-300 rounded flex items-center gap-2'>
              <ClockIcon className='w-4 h-4' />
              <Label>Total Cost: ${(timeLogFormData.hoursWorked * timeLogFormData.hourlyRate).toFixed(2)}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddTimeLogModal(false)}>
              Cancel
            </Button>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => {
              // Save logic here
              setShowAddTimeLogModal(false);
            }}>
              Add Time Log
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={showInvoiceModal} onOpenChange={setShowInvoiceModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Invoice Details
            </DialogTitle>
            <DialogDescription className="text-sm font-semibold">
              {selectedInvoice?.type} - {selectedInvoice?.id}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Invoice Information */}
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Invoice Information</h3>
            <div className="border-t border-gray-200 my-4"></div> 
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Type</p>
                  <p className="font-medium">{selectedInvoice?.type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Number</p>
                  <p className="font-medium">{selectedInvoice?.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Amount</p>
                  <p className="font-medium">{formatCurrency(selectedInvoice?.amount || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  {selectedInvoice && getStatusBadge(selectedInvoice.status)}
                </div>
              </div>
            </div>
            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Created Date</p>
                <p className="font-medium">{selectedInvoice?.createdDate}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Due Date</p>
                <p className="font-medium">{selectedInvoice?.dueDate}</p>
              </div>
            </div>
            {/* Description */}
            <div>
              <h3 className="font-semibold text-lg">Description</h3>
              <p className="text-sm mt-2">{selectedInvoice?.description}</p>
            </div>


            {/* Divider */}
            <div className="border-t border-gray-200 my-4"></div>
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="outline" className="gap-2" onClick={() => setShowInvoiceModal(false)}>
                <X className="h-4 w-4" />
                Close
              </Button>
              <Button variant="outline" className="gap-2 bg-primary text-primary-foreground">
                <Printer className="h-4 w-4" />
                Print Invoice
              </Button>
            </div>

          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default JobDetailsPage

