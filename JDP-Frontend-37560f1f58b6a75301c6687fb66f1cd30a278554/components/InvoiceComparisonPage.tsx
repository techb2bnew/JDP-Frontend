'use client'

import { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Separator } from './ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Textarea } from './ui/textarea'
import { toast } from 'sonner'
import {
  ArrowLeft,
  FileText,
  CheckSquare,
  AlertTriangle,
  Eye,
  Send,
  Edit,
  Download,
  DollarSign,
  Package,
  Building,
  Calendar,
  ArrowRight,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Zap,
  Save,
  X,
  Plus,
  Minus,
  User,
  Mail,
  Phone,
  MapPin
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
  name: string
  quantity: number
  unitPrice: number
  total: number
}

interface GeneratedInvoice {
  id: string
  invoiceNumber: string
  jobId: string
  jobTitle: string
  customer: string
  customerEmail: string
  customerPhone: string
  customerAddress: string
  amount: number
  subtotal: number
  taxRate: number
  taxAmount: number
  date: string
  dueDate: string
  status: 'draft' | 'review' | 'approved' | 'sent' | 'paid'
  materials: Material[]
  blueSheetId: string
  supplierInvoiceId: string
  notes?: string
  terms?: string
}

interface InvoiceComparisonProps {
  onBack: () => void
  jobs: Job[]
}

export function InvoiceComparisonPage({ onBack }: InvoiceComparisonProps) {
  const [selectedJob, setSelectedJob] = useState<string>('')
  const [generatedInvoice, setGeneratedInvoice] = useState<GeneratedInvoice | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showReviewDialog, setShowReviewDialog] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editedInvoice, setEditedInvoice] = useState<GeneratedInvoice | null>(null)
  const [comparisonResults, setComparisonResults] = useState<any>(null)

  // Mock data for approved BlueSheets with supplier invoices
  const approvedComparisons = [
    {
      id: '1',
      jobId: 'JOB-2025-001',
      jobTitle: 'Electrical Panel Installation',
      customer: 'ABC Corporation',
      customerEmail: 'billing@abccorp.com',
      customerPhone: '+1 (555) 123-4567',
      customerAddress: '123 Business Ave, New York, NY 10001',
      poNumber: 'PO-2025-001-EP',
      blueSheet: {
        id: 'BS-001',
        amount: 1910,
        materials: [
          { name: 'Main Electrical Panel', quantity: 1, unitPrice: 450, total: 450 },
          { name: 'Circuit Breakers (20A)', quantity: 8, unitPrice: 35, total: 280 },
          { name: 'Copper Wire (12 AWG)', quantity: 500, unitPrice: 2.4, total: 1200 }
        ],
        submittedBy: 'John Smith',
        submittedDate: '2025-01-20'
      },
      supplierInvoice: {
        id: 'SUP-001',
        invoiceNumber: 'INV-ES-2025-001',
        supplier: 'ElectroSupply Co',
        amount: 1885,
        date: '2025-01-22',
        materials: [
          { name: 'Main Electrical Panel', quantity: 1, unitPrice: 445, total: 445 },
          { name: 'Circuit Breakers (20A)', quantity: 8, unitPrice: 35, total: 280 },
          { name: 'Copper Wire (12 AWG)', quantity: 500, unitPrice: 2.32, total: 1160 }
        ]
      },
      discrepancy: {
        amount: 25,
        percentage: 1.3,
        items: [
          { item: 'Main Electrical Panel', difference: -5, type: 'price' },
          { item: 'Copper Wire (12 AWG)', difference: -40, type: 'price' }
        ]
      },
      generatedInvoice: null as GeneratedInvoice | null,
      status: 'ready_for_approval',
      lastUpdated: '2025-01-23'
    },
    {
      id: '2',
      jobId: 'JOB-2025-003',
      jobTitle: 'Emergency Generator Setup',
      customer: 'Healthcare Center',
      customerEmail: 'finance@healthcenter.com',
      customerPhone: '+1 (555) 987-6543',
      customerAddress: '789 Medical Drive, New York, NY 10002',
      poNumber: 'PO-2025-003-GEN',
      blueSheet: {
        id: 'BS-002',
        amount: 8200,
        materials: [
          { name: 'Emergency Generator (50kW)', quantity: 1, unitPrice: 6500, total: 6500 },
          { name: 'Transfer Switch', quantity: 1, unitPrice: 1200, total: 1200 },
          { name: 'Installation Kit', quantity: 1, unitPrice: 500, total: 500 }
        ],
        submittedBy: 'Mike Rodriguez',
        submittedDate: '2025-01-19'
      },
      supplierInvoice: {
        id: 'SUP-002',
        invoiceNumber: 'INV-PG-2025-003',
        supplier: 'PowerGen Solutions',
        amount: 8200,
        date: '2025-01-21',
        materials: [
          { name: 'Emergency Generator (50kW)', quantity: 1, unitPrice: 6500, total: 6500 },
          { name: 'Transfer Switch', quantity: 1, unitPrice: 1200, total: 1200 },
          { name: 'Installation Kit', quantity: 1, unitPrice: 500, total: 500 }
        ]
      },
      discrepancy: {
        amount: 0,
        percentage: 0,
        items: []
      },
      generatedInvoice: null as GeneratedInvoice | null,
      status: 'ready_for_approval',
      lastUpdated: '2025-01-22'
    }
  ]

  const [comparisons, setComparisons] = useState(approvedComparisons)
  const [selectedComparison, setSelectedComparison] = useState<any>(null)

  const handleSelectComparison = (comparison: any) => {
    setSelectedComparison(comparison)
    setComparisonResults(comparison.discrepancy)
  }

  const handleApproval = async (comparison: any) => {
    setIsGenerating(true)
    
    try {
      // Simulate invoice generation process
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const taxRate = 0.08 // 8% tax
      const subtotal = comparison.supplierInvoice.amount
      const taxAmount = subtotal * taxRate
      const totalAmount = subtotal + taxAmount
      
      const newInvoice: GeneratedInvoice = {
        id: `GEN-INV-${Date.now()}`,
        invoiceNumber: `INV-${comparison.jobId.slice(-3)}-${Date.now().toString().slice(-3)}`,
        jobId: comparison.jobId,
        jobTitle: comparison.jobTitle,
        customer: comparison.customer,
        customerEmail: comparison.customerEmail,
        customerPhone: comparison.customerPhone,
        customerAddress: comparison.customerAddress,
        amount: totalAmount,
        subtotal: subtotal,
        taxRate: taxRate,
        taxAmount: taxAmount,
        date: new Date().toISOString(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        status: 'draft',
        materials: comparison.supplierInvoice.materials,
        blueSheetId: comparison.blueSheet.id,
        supplierInvoiceId: comparison.supplierInvoice.id,
        notes: 'Materials and services as per approved BlueSheet and supplier invoice.',
        terms: 'Payment due within 30 days. Late payments subject to 1.5% monthly service charge.'
      }
      
      setGeneratedInvoice(newInvoice)
      setEditedInvoice({ ...newInvoice })
      setShowReviewDialog(true)
      
      // Update comparison status
      setComparisons(prev => prev.map(comp => 
        comp.id === comparison.id 
          ? { ...comp, status: 'in_review', generatedInvoice: newInvoice }
          : comp
      ))
      
      toast.success('Invoice generated and ready for review!')
    } catch (error) {
      toast.error('Failed to generate invoice')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleEditToggle = () => {
    setIsEditMode(!isEditMode)
    if (!isEditMode && editedInvoice) {
      setEditedInvoice({ ...editedInvoice })
    }
  }

  const handleSaveEdit = () => {
    if (editedInvoice) {
      // Recalculate totals
      const subtotal = editedInvoice.materials.reduce((sum, item) => sum + item.total, 0)
      const taxAmount = subtotal * editedInvoice.taxRate
      const totalAmount = subtotal + taxAmount

      const updatedInvoice = {
        ...editedInvoice,
        subtotal,
        taxAmount,
        amount: totalAmount
      }

      setGeneratedInvoice(updatedInvoice)
      setEditedInvoice(updatedInvoice)
      setIsEditMode(false)
      toast.success('Invoice updated successfully!')
    }
  }

  const handleMaterialChange = (index: number, field: keyof Material, value: string | number) => {
    if (editedInvoice) {
      const newMaterials = [...editedInvoice.materials]
      newMaterials[index] = {
        ...newMaterials[index],
        [field]: value
      }
      
      // Recalculate total for this item
      if (field === 'quantity' || field === 'unitPrice') {
        newMaterials[index].total = newMaterials[index].quantity * newMaterials[index].unitPrice
      }

      setEditedInvoice({
        ...editedInvoice,
        materials: newMaterials
      })
    }
  }

  const handleAddMaterial = () => {
    if (editedInvoice) {
      const newMaterial: Material = {
        name: 'New Item',
        quantity: 1,
        unitPrice: 0,
        total: 0
      }
      
      setEditedInvoice({
        ...editedInvoice,
        materials: [...editedInvoice.materials, newMaterial]
      })
    }
  }

  const handleRemoveMaterial = (index: number) => {
    if (editedInvoice && editedInvoice.materials.length > 1) {
      const newMaterials = editedInvoice.materials.filter((_, i) => i !== index)
      setEditedInvoice({
        ...editedInvoice,
        materials: newMaterials
      })
    }
  }

  const handleReview = () => {
    if (editedInvoice) {
      setGeneratedInvoice({ ...editedInvoice, status: 'review' })
      setIsEditMode(false)
      toast.success('Invoice marked for review!')
    }
  }

  const handleSendInvoice = () => {
    if (editedInvoice) {
      setGeneratedInvoice({ ...editedInvoice, status: 'sent' })
      setShowReviewDialog(false)
      // Update comparison status
      if (selectedComparison) {
        setComparisons(prev => prev.map(comp => 
          comp.id === selectedComparison.id 
            ? { ...comp, status: 'invoice_sent' }
            : comp
        ))
      }
      
      toast.success('Invoice sent to customer!')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ready_for_approval':
        return (
          <Badge className="bg-yellow-50 text-yellow-600 border-yellow-200">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Ready for Approval
          </Badge>
        )
      case 'in_review':
        return (
          <Badge className="bg-blue-50 text-blue-600 border-blue-200">
            <Eye className="w-3 h-3 mr-1" />
            In Review
          </Badge>
        )
      case 'invoice_sent':
        return (
          <Badge className="bg-green-50 text-green-600 border-green-200">
            <Send className="w-3 h-3 mr-1" />
            Invoice Sent
          </Badge>
        )
      default:
        return (
          <Badge className="bg-gray-50 text-gray-600 border-gray-200">
            {status}
          </Badge>
        )
    }
  }

  const getDiscrepancyBadge = (discrepancy: any) => {
    if (discrepancy.percentage === 0) {
      return (
        <Badge className="bg-green-50 text-green-600 border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Perfect Match
        </Badge>
      )
    } else if (discrepancy.percentage < 2) {
      return (
        <Badge className="bg-yellow-50 text-yellow-600 border-yellow-200">
          <AlertCircle className="w-3 h-3 mr-1" />
          Minor Discrepancy ({discrepancy.percentage.toFixed(1)}%)
        </Badge>
      )
    } else {
      return (
        <Badge className="bg-red-50 text-red-600 border-red-200">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Major Discrepancy ({discrepancy.percentage.toFixed(1)}%)
        </Badge>
      )
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Invoices
        </Button>
        <div>
          <h1 className="text-2xl font-medium text-[#2b2b2b]">Invoice Approval & Review</h1>
          <p className="text-sm text-[#2b2b2b]/60 mt-1">Review, edit, and approve customer invoices</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white shadow-md border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ready for Approval</p>
                <p className="text-2xl font-medium text-[#2b2b2b]">{comparisons.filter(c => c.status === 'ready_for_approval').length}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Review</p>
                <p className="text-2xl font-medium text-blue-600">
                  {comparisons.filter(c => c.status === 'in_review').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <Eye className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Sent to Customers</p>
                <p className="text-2xl font-medium text-green-600">
                  {comparisons.filter(c => c.status === 'invoice_sent').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <Send className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-2xl font-medium text-[#2b2b2b]">
                  {formatCurrency(comparisons.reduce((sum, c) => sum + c.supplierInvoice.amount, 0))}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comparison List */}
      <Card className="bg-white shadow-md border-0">
        <CardHeader>
          <CardTitle>Invoice Approvals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {comparisons.map((comparison) => (
              <div 
                key={comparison.id}
                className={`border rounded-lg p-6 cursor-pointer transition-all ${
                  selectedComparison?.id === comparison.id ? 'border-[#00A1FF] bg-blue-50' : 'hover:border-gray-300'
                }`}
                onClick={() => handleSelectComparison(comparison)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-medium text-[#2b2b2b]">{comparison.jobTitle}</h3>
                    <p className="text-sm text-gray-600">{comparison.customer} • {comparison.poNumber}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {getDiscrepancyBadge(comparison.discrepancy)}
                    {getStatusBadge(comparison.status)}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* BlueSheet Info */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-gray-700">BlueSheet</h4>
                    <div className="space-y-1">
                      <p className="text-sm">Amount: <span className="font-medium">{formatCurrency(comparison.blueSheet.amount)}</span></p>
                      <p className="text-sm">Items: {comparison.blueSheet.materials.length}</p>
                      <p className="text-sm">By: {comparison.blueSheet.submittedBy}</p>
                    </div>
                  </div>

                  {/* Supplier Invoice Info */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-gray-700">Supplier Invoice</h4>
                    <div className="space-y-1">
                      <p className="text-sm">Amount: <span className="font-medium">{formatCurrency(comparison.supplierInvoice.amount)}</span></p>
                      <p className="text-sm">Items: {comparison.supplierInvoice.materials.length}</p>
                      <p className="text-sm">From: {comparison.supplierInvoice.supplier}</p>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-gray-700">Customer Details</h4>
                    <div className="space-y-1">
                      <p className="text-sm">Email: {comparison.customerEmail}</p>
                      <p className="text-sm">Phone: {comparison.customerPhone}</p>
                      <p className="text-sm">Updated: {formatDate(comparison.lastUpdated)}</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSelectComparison(comparison)
                    }}
                    className="gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    View Details
                  </Button>
                  
                  {comparison.status === 'ready_for_approval' && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleApproval(comparison)
                      }}
                      disabled={isGenerating}
                      className="bg-primary text-white hover:bg-[#0090e6] gap-2"
                    >
                      {isGenerating ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckSquare className="h-4 w-4" />
                      )}
                      {isGenerating ? 'Processing...' : 'Approval'}
                    </Button>
                  )}
                  
                  {comparison.status === 'in_review' && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (comparison.generatedInvoice) {
                          setGeneratedInvoice(comparison.generatedInvoice)
                          setEditedInvoice(comparison.generatedInvoice)
                          setShowReviewDialog(true)
                        }
                      }}
                      className="bg-primary text-white hover:bg-blue-700 gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      Review Invoice
                    </Button>
                  )}
                  
                  {comparison.status === 'invoice_sent' && (
                    <Badge className="bg-green-50 text-green-600 border-green-200">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Invoice Sent
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Invoice Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-[800px] w-[95vw] h-[90vh] max-h-[90vh] overflow-hidden p-0">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#00A1FF]" />
              Invoice Review & Edit
              {editedInvoice && (
                <Badge className="ml-2 bg-blue-50 text-blue-600 border-blue-200">
                  {editedInvoice.invoiceNumber}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Review and edit the generated invoice before sending to the customer. You can modify all fields, add or remove items, and update customer information.
            </DialogDescription>
          </DialogHeader>

          {editedInvoice && (
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Invoice Header */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium text-[#2b2b2b] mb-4">Invoice Information</h3>
                    <div className="space-y-3">
                      <div>
                        <Label>Invoice Number</Label>
                        {isEditMode ? (
                          <Input
                            value={editedInvoice.invoiceNumber}
                            onChange={(e) => setEditedInvoice({...editedInvoice, invoiceNumber: e.target.value})}
                          />
                        ) : (
                          <p className="font-mono">{editedInvoice.invoiceNumber}</p>
                        )}
                      </div>
                      <div>
                        <Label>Issue Date</Label>
                        <p>{formatDate(editedInvoice.date)}</p>
                      </div>
                      <div>
                        <Label>Due Date</Label>
                        {isEditMode ? (
                          <Input
                            type="date"
                            value={editedInvoice.dueDate.split('T')[0]}
                            onChange={(e) => setEditedInvoice({...editedInvoice, dueDate: e.target.value + 'T00:00:00.000Z'})}
                          />
                        ) : (
                          <p>{formatDate(editedInvoice.dueDate)}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-[#2b2b2b] mb-4">Customer Information</h3>
                    <div className="space-y-3">
                      <div>
                        <Label>Company</Label>
                        {isEditMode ? (
                          <Input
                            value={editedInvoice.customer}
                            onChange={(e) => setEditedInvoice({...editedInvoice, customer: e.target.value})}
                          />
                        ) : (
                          <p className="font-medium">{editedInvoice.customer}</p>
                        )}
                      </div>
                      <div>
                        <Label>Email</Label>
                        {isEditMode ? (
                          <Input
                            value={editedInvoice.customerEmail}
                            onChange={(e) => setEditedInvoice({...editedInvoice, customerEmail: e.target.value})}
                          />
                        ) : (
                          <p>{editedInvoice.customerEmail}</p>
                        )}
                      </div>
                      <div>
                        <Label>Phone</Label>
                        {isEditMode ? (
                          <Input
                            value={editedInvoice.customerPhone}
                            onChange={(e) => setEditedInvoice({...editedInvoice, customerPhone: e.target.value})}
                          />
                        ) : (
                          <p>{editedInvoice.customerPhone}</p>
                        )}
                      </div>
                      <div>
                        <Label>Address</Label>
                        {isEditMode ? (
                          <Textarea
                            value={editedInvoice.customerAddress}
                            onChange={(e) => setEditedInvoice({...editedInvoice, customerAddress: e.target.value})}
                            rows={2}
                          />
                        ) : (
                          <p>{editedInvoice.customerAddress}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Materials Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-[#2b2b2b]">Materials & Services</h3>
                    {isEditMode && (
                      <Button
                        onClick={handleAddMaterial}
                        size="sm"
                        variant="outline"
                        className="gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add Item
                      </Button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {editedInvoice.materials.map((material, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                          <div className="md:col-span-2">
                            <Label className="text-xs">Item Name</Label>
                            {isEditMode ? (
                              <Input
                                value={material.name}
                                onChange={(e) => handleMaterialChange(index, 'name', e.target.value)}
                                placeholder="Item name"
                              />
                            ) : (
                              <p className="font-medium">{material.name}</p>
                            )}
                          </div>
                          <div>
                            <Label className="text-xs">Quantity</Label>
                            {isEditMode ? (
                              <Input
                                type="number"
                                value={material.quantity}
                                onChange={(e) => handleMaterialChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                                min="0"
                                step="0.01"
                              />
                            ) : (
                              <p>{material.quantity}</p>
                            )}
                          </div>
                          <div>
                            <Label className="text-xs">Unit Price</Label>
                            {isEditMode ? (
                              <Input
                                type="number"
                                value={material.unitPrice}
                                onChange={(e) => handleMaterialChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                min="0"
                                step="0.01"
                              />
                            ) : (
                              <p>{formatCurrency(material.unitPrice)}</p>
                            )}
                          </div>
                          <div>
                            <Label className="text-xs">Total</Label>
                            <p className="font-medium">{formatCurrency(material.total)}</p>
                          </div>
                          <div>
                            {isEditMode && editedInvoice.materials.length > 1 && (
                              <Button
                                onClick={() => handleRemoveMaterial(index)}
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Totals Section */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-medium text-[#2b2b2b] mb-4">Additional Information</h3>
                      <div className="space-y-3">
                        <div>
                          <Label className='mb-2'>Notes</Label>
                          {isEditMode ? (
                            <Textarea
                              value={editedInvoice.notes || ''}
                              onChange={(e) => setEditedInvoice({...editedInvoice, notes: e.target.value})}
                              rows={3}
                              placeholder="Additional notes for the customer..."
                            />
                          ) : (
                            <p className="text-sm">{editedInvoice.notes || 'No additional notes'}</p>
                          )}
                        </div>
                        <div>
                          <Label className='mb-2'>Terms & Conditions</Label>
                          {isEditMode ? (
                            <Textarea
                              value={editedInvoice.terms || ''}
                              onChange={(e) => setEditedInvoice({...editedInvoice, terms: e.target.value})}
                              rows={3}
                              placeholder="Payment terms and conditions..."
                            />
                          ) : (
                            <p className="text-sm">{editedInvoice.terms || 'Standard terms apply'}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium text-[#2b2b2b] mb-4">Invoice Totals</h3>
                      <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between">
                          <span>Subtotal:</span>
                          <span className="font-medium">{formatCurrency(editedInvoice.subtotal)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tax ({(editedInvoice.taxRate * 100).toFixed(1)}%):</span>
                          <span className="font-medium">{formatCurrency(editedInvoice.taxAmount)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between text-lg">
                          <span className="font-medium">Total Amount:</span>
                          <span className="font-medium text-[#00A1FF]">{formatCurrency(editedInvoice.amount)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="border-t p-6 bg-gray-50">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                {editedInvoice && (
                  <Badge className={
                    editedInvoice.status === 'draft' ? "bg-yellow-50 text-yellow-600 border-yellow-200" :
                    editedInvoice.status === 'review' ? "bg-blue-50 text-blue-600 border-blue-200" :
                    "bg-green-50 text-green-600 border-green-200"
                  }>
                    {editedInvoice.status.toUpperCase()}
                  </Badge>
                )}
              </div>
              
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
                  Close
                </Button>
                
                {isEditMode ? (
                  <>
                    <Button variant="outline" onClick={() => setIsEditMode(false)}>
                      <X className="h-4 w-4 mr-2" />
                      Cancel Edit
                    </Button>
                    <Button onClick={handleSaveEdit} className="bg-primary text-white hover:bg-green-700">
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" onClick={handleEditToggle}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Invoice
                    </Button>
                    <Button variant="outline" onClick={() => window.print()}>
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                    <Button onClick={handleReview} className="bg-blue-600 text-white hover:bg-blue-700">
                      <Eye className="h-4 w-4 mr-2" />
                      Review
                    </Button>
                    <Button onClick={handleSendInvoice} className="bg-primary text-white hover:bg-[#0090e6]">
                      <Send className="h-4 w-4 mr-2" />
                      Send to Customer
                    </Button>
                  </>
                )}
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}