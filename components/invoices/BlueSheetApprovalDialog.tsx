'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Separator } from '../ui/separator'
import { Textarea } from '../ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { toast } from 'sonner'
import {
  Upload,
  FileText,
  CheckSquare,
  AlertCircle,
  Download,
  Eye,
  RefreshCw,
  Mail,
  DollarSign,
  Package,
  Building,
  Calendar,
  ArrowRight,
  X,
  Edit,
  RotateCcw,
  Save,
  Plus,
  Minus,
  AlertTriangle,
  Info,
  Check,
  Send,
  ArrowLeft
} from 'lucide-react'
import { apiClient } from '@/utils/api'

export interface BlueSheetItem {
  id: number
  job_id: number
  date: string
  created_by: number
  notes: string
  additional_charges: number
  total_cost: number
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
  job: {
    id: number
    status: string
    customer?: {
      id: number
      email: string
      phone: string
      address: string
      company_name: string
      customer_name: string
    }
    job_type: string
    priority: string
    job_title: string
    contractor?: {
      id: number
      email: string
      phone: string
      address: string
      company_name: string
      contractor_name: string
    }
    description: string
    bill_to_email: string
    bill_to_phone: string
    bill_to_address: string
    bill_to_city_zip: string
  }
  created_by_user: {
    id: number
    email: string
    full_name: string
  }
  labor_entries: any[]
  material_entries: any[]
}

interface SupplierInvoice {
  id: string
  poNumber: string
  invoiceNumber: string
  supplier: string
  amount: number
  date: string
  materials: Array<{
    name: string
    quantity: number
    unitPrice: number
    total: number
  }>
  status: 'received' | 'matched' | 'discrepancy'
}

interface MaterialComparison {
  blueSheetItem?: any
  supplierItem?: any
  status: 'match' | 'price_diff' | 'quantity_diff' | 'missing_in_supplier' | 'missing_in_bluesheet' | 'unused'
  differences: string[]
}

interface BlueSheetApprovalDialogProps {
  isOpen: boolean
  onClose: () => void
  blueSheet: BlueSheetItem | null
  onApprovalComplete: (approvedItem: BlueSheetItem) => void
}

export function BlueSheetApprovalDialog({ 
  isOpen, 
  onClose, 
  blueSheet, 
  onApprovalComplete 
}: BlueSheetApprovalDialogProps) {
  // All hooks must be called before any conditional returns
  const [supplierInvoice, setSupplierInvoice] = useState<SupplierInvoice | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isAutoFetching, setIsAutoFetching] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [currentStep, setCurrentStep] = useState<'upload' | 'comparison' | 'review'>('upload')
  
  // Edit states
  const [isBlueSheetEditMode, setIsBlueSheetEditMode] = useState(false)
  const [isSupplierEditMode, setIsSupplierEditMode] = useState(false)
  const [editedBlueSheet, setEditedBlueSheet] = useState<BlueSheetItem | null>(null)
  const [editedSupplierInvoice, setEditedSupplierInvoice] = useState<SupplierInvoice | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Initialize edited states - useEffect hooks must be called consistently
  useEffect(() => {
    if (blueSheet && !editedBlueSheet) {
      setEditedBlueSheet({ ...blueSheet })
    }
  }, [blueSheet, editedBlueSheet])

  useEffect(() => {
    if (supplierInvoice && !editedSupplierInvoice) {
      setEditedSupplierInvoice({ ...supplierInvoice })
    }
  }, [supplierInvoice, editedSupplierInvoice])

  // Now we can do conditional returns after all hooks are called
  if (!blueSheet) return null

  // Mock supplier invoice data with realistic variations for demonstration
  const mockSupplierInvoice: SupplierInvoice = {
    id: 'SUP-INV-001',
    poNumber: `BS-${blueSheet.id}`,
    invoiceNumber: 'INV-SUPPLIER-' + blueSheet.id.toString().slice(-3),
    supplier: blueSheet.material_entries[0]?.product?.suppliers?.company_name || 'Unknown Supplier',
    amount: blueSheet.total_cost * 0.96, // 4% difference to show discrepancy
    date: new Date().toISOString(),
    materials: [
      // First two materials match closely
      ...blueSheet.material_entries.slice(0, 2).map(item => ({
        name: item.material_name,
        quantity: item.total_ordered,
        unitPrice: item.unit_cost * 0.97, // 3% price difference
        total: item.total_ordered * (item.unit_cost * 0.97)
      })),
      // Third material has quantity difference
      ...(blueSheet.material_entries.length > 2 ? [{
        name: blueSheet.material_entries[2].material_name,
        quantity: blueSheet.material_entries[2].total_ordered + 2, // Quantity difference
        unitPrice: blueSheet.material_entries[2].unit_cost,
        total: (blueSheet.material_entries[2].total_ordered + 2) * blueSheet.material_entries[2].unit_cost
      }] : []),
      // Skip fourth material (missing in supplier)
      // Add extra material not in BlueSheet
      {
        name: 'Installation Labor & Setup Fee',
        quantity: 1,
        unitPrice: 150,
        total: 150
      },
      {
        name: 'Equipment Delivery Charge',
        quantity: 1,
        unitPrice: 85,
        total: 85
      }
    ],
    status: 'received'
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setIsUploading(true)
      setUploadedFile(file)
      
      // Simulate file processing
      setTimeout(() => {
        setSupplierInvoice(mockSupplierInvoice)
        setIsUploading(false)
        setCurrentStep('comparison')
        toast.success('Supplier invoice uploaded and processed successfully')
      }, 2500)
    }
  }

  const handleAutoFetch = async () => {
    if (!blueSheet) return

    setIsAutoFetching(true)

    try {
      const poNumber = `BS-${blueSheet.id}`

      // Call Next.js server API to auto-fetch supplier invoice from email for this PO
      const response = await apiClient.autoFetchSupplierInvoiceFromEmail({
        poNumber
      })

      const rawInvoice: any = (response && (response.data || response.invoice || response)) || {}

      const materialsSource: any[] =
        rawInvoice.materials || rawInvoice.items || rawInvoice.lines || []

      const mappedInvoice: SupplierInvoice = {
        id: (rawInvoice.id ?? rawInvoice.invoice_id ?? poNumber).toString(),
        poNumber: rawInvoice.poNumber || rawInvoice.po_number || poNumber,
        invoiceNumber:
          rawInvoice.invoiceNumber ||
          rawInvoice.invoice_number ||
          `INV-${blueSheet.id.toString().slice(-3)}`,
        supplier:
          rawInvoice.supplier ||
          rawInvoice.supplier_name ||
          rawInvoice.vendor ||
          currentBlueSheet.material_entries[0]?.product?.suppliers?.company_name ||
          'Unknown Supplier',
        amount: Number(rawInvoice.amount ?? rawInvoice.total ?? 0),
        date: rawInvoice.date || rawInvoice.invoice_date || new Date().toISOString(),
        materials: materialsSource.map((item: any, index: number) => {
          const quantity = Number(item.quantity ?? item.qty ?? 0)
          const unitPrice = Number(
            item.unitPrice ?? item.unit_price ?? item.price ?? item.rate ?? 0
          )

          return {
            name: item.name || item.description || `Item ${index + 1}`,
            quantity,
            unitPrice,
            total: Number(
              item.total ??
                item.line_total ??
                item.amount ??
                item.extended_price ??
                quantity * unitPrice
            )
          }
        }),
        status: 'received'
      }

      if (!mappedInvoice.materials.length) {
        throw new Error('No materials found in fetched supplier invoice')
      }

      setSupplierInvoice(mappedInvoice)
      setEditedSupplierInvoice(null)
      setCurrentStep('comparison')

      toast.success(`Supplier invoice auto-fetched for PO: ${poNumber}`)
    } catch (error: any) {
      console.error('Error auto-fetching supplier invoice from email:', error)
      toast.error(
        error?.message || 'Failed to auto-fetch supplier invoice from email. Please try again.'
      )
    } finally {
      setIsAutoFetching(false)
    }
  }

  const handleBlueSheetEdit = () => {
    setIsBlueSheetEditMode(!isBlueSheetEditMode)
    if (!isBlueSheetEditMode) {
      toast.info('BlueSheet edit mode enabled - you can now modify materials, quantities, and pricing')
    } else {
      toast.info('BlueSheet edit mode disabled')
    }
  }

  const handleSupplierEdit = () => {
    setIsSupplierEditMode(!isSupplierEditMode)
    if (!isSupplierEditMode) {
      toast.info('Supplier invoice edit mode enabled - you can now modify all supplier details')
    } else {
      toast.info('Supplier invoice edit mode disabled')
    }
  }

  const handleBlueSheetSave = () => {
    if (editedBlueSheet) {
      // Recalculate total amount
      const newTotal = editedBlueSheet.material_entries.reduce((sum, item) => sum + (item.total_cost || 0), 0)
      setEditedBlueSheet({
        ...editedBlueSheet,
        total_cost: newTotal
      })
      setIsBlueSheetEditMode(false)
      toast.success('BlueSheet changes saved successfully!')
    }
  }

  const handleSupplierSave = () => {
    if (editedSupplierInvoice) {
      // Recalculate total amount
      const newTotal = editedSupplierInvoice.materials.reduce((sum, item) => sum + item.total, 0)
      const updatedInvoice = {
        ...editedSupplierInvoice,
        amount: newTotal
      }
      setSupplierInvoice(updatedInvoice)
      setEditedSupplierInvoice(updatedInvoice)
      setIsSupplierEditMode(false)
      toast.success('Supplier invoice changes saved successfully!')
    }
  }

  const handleBlueSheetMaterialChange = (index: number, field: string, value: any) => {
    if (editedBlueSheet) {
      const newMaterials = [...editedBlueSheet.material_entries]
      newMaterials[index] = {
        ...newMaterials[index],
        [field]: value
      }
      
      // Recalculate total for this item
      if (field === 'total_ordered' || field === 'unit_cost') {
        newMaterials[index].total_cost = newMaterials[index].total_ordered * newMaterials[index].unit_cost
      }

      const newAmount = newMaterials.reduce((sum, item) => sum + (item.total_cost || 0), 0)
      setEditedBlueSheet({
        ...editedBlueSheet,
        material_entries: newMaterials,
        total_cost: newAmount
      })
    }
  }

  const handleSupplierMaterialChange = (index: number, field: string, value: any) => {
    if (editedSupplierInvoice) {
      const newMaterials = [...editedSupplierInvoice.materials]
      newMaterials[index] = {
        ...newMaterials[index],
        [field]: value
      }
      
      // Recalculate total for this item
      if (field === 'quantity' || field === 'unitPrice') {
        newMaterials[index].total = newMaterials[index].quantity * newMaterials[index].unitPrice
      }

      const newAmount = newMaterials.reduce((sum, item) => sum + item.total, 0)
      setEditedSupplierInvoice({
        ...editedSupplierInvoice,
        materials: newMaterials,
        amount: newAmount
      })
    }
  }

  const addBlueSheetMaterial = () => {
    if (editedBlueSheet) {
      const newMaterial = {
        id: Date.now(),
        material_name: 'New Material Item',
        total_ordered: 1,
        unit_cost: 0,
        total_cost: 0,
        product: {
          suppliers: {
            company_name: 'New Supplier'
          }
        }
      }
      setEditedBlueSheet({
        ...editedBlueSheet,
        material_entries: [...editedBlueSheet.material_entries, newMaterial]
      })
      toast.info('New material added to BlueSheet')
    }
  }

  const addSupplierMaterial = () => {
    if (editedSupplierInvoice) {
      const newMaterial = {
        name: 'New Supplier Item',
        quantity: 1,
        unitPrice: 0,
        total: 0
      }
      setEditedSupplierInvoice({
        ...editedSupplierInvoice,
        materials: [...editedSupplierInvoice.materials, newMaterial]
      })
      toast.info('New material added to Supplier Invoice')
    }
  }

  const removeBlueSheetMaterial = (index: number) => {
    if (editedBlueSheet && editedBlueSheet.material_entries.length > 1) {
      const newMaterials = editedBlueSheet.material_entries.filter((_, i) => i !== index)
      const newAmount = newMaterials.reduce((sum, item) => sum + (item.total_cost || 0), 0)
      setEditedBlueSheet({
        ...editedBlueSheet,
        material_entries: newMaterials,
        total_cost: newAmount
      })
      toast.info('Material removed from BlueSheet')
    }
  }

  const removeSupplierMaterial = (index: number) => {
    if (editedSupplierInvoice && editedSupplierInvoice.materials.length > 1) {
      const newMaterials = editedSupplierInvoice.materials.filter((_, i) => i !== index)
      const newAmount = newMaterials.reduce((sum, item) => sum + item.total, 0)
      setEditedSupplierInvoice({
        ...editedSupplierInvoice,
        materials: newMaterials,
        amount: newAmount
      })
      toast.info('Material removed from Supplier Invoice')
    }
  }

  const generateComparison = (): MaterialComparison[] => {
    if (!supplierInvoice || !blueSheet) return []

    const currentBlueSheetData = editedBlueSheet || blueSheet
    const currentSupplierData = editedSupplierInvoice || supplierInvoice

    const comparisons: MaterialComparison[] = []
    const supplierMaterialsUsed = new Set<number>()

    // Compare BlueSheet materials with Supplier materials
    currentBlueSheetData.material_entries.forEach(blueSheetItem => {
      let bestMatch = -1
      let bestMatchScore = 0

      currentSupplierData.materials.forEach((supplierItem, supplierIndex) => {
        if (supplierMaterialsUsed.has(supplierIndex)) return

        const nameMatch = blueSheetItem.material_name.toLowerCase() === supplierItem.name.toLowerCase()
        const partialNameMatch = blueSheetItem.material_name.toLowerCase().includes(supplierItem.name.toLowerCase()) ||
                                supplierItem.name.toLowerCase().includes(blueSheetItem.material_name.toLowerCase())

        if (nameMatch) {
          bestMatch = supplierIndex
          bestMatchScore = 100
        } else if (partialNameMatch && bestMatchScore < 80) {
          bestMatch = supplierIndex
          bestMatchScore = 80
        }
      })

      if (bestMatch >= 0) {
        supplierMaterialsUsed.add(bestMatch)
        const supplierItem = currentSupplierData.materials[bestMatch]
        const differences = []

        let status: MaterialComparison['status'] = 'match'

        const priceDiff = Math.abs(blueSheetItem.unit_cost - supplierItem.unitPrice)
        const pricePercent = (priceDiff / blueSheetItem.unit_cost) * 100

        if (priceDiff > 0.01) {
          differences.push(`Price difference: ${formatCurrency(blueSheetItem.unit_cost)} vs ${formatCurrency(supplierItem.unitPrice)} (${pricePercent.toFixed(1)}%)`)
          status = 'price_diff'
        }

        if (blueSheetItem.total_ordered !== supplierItem.quantity) {
          differences.push(`Quantity difference: ${blueSheetItem.total_ordered} vs ${supplierItem.quantity}`)
          status = 'quantity_diff'
        }

        const totalDiff = Math.abs((blueSheetItem.total_cost || 0) - supplierItem.total)
        if (totalDiff > 0.01) {
          differences.push(`Total amount difference: ${formatCurrency(totalDiff)}`)
        }

        comparisons.push({
          blueSheetItem,
          supplierItem,
          status,
          differences
        })
      } else {
        comparisons.push({
          blueSheetItem,
          status: 'missing_in_supplier',
          differences: ['Material not found in supplier invoice - may need to be sourced separately']
        })
      }
    })

    // Add supplier materials not found in BlueSheet
    currentSupplierData.materials.forEach((supplierItem, index) => {
      if (!supplierMaterialsUsed.has(index)) {
        comparisons.push({
          supplierItem,
          status: 'missing_in_bluesheet',
          differences: ['Additional supplier item - may be extra service, delivery charge, or labor cost']
        })
      }
    })

    return comparisons
  }

  const getComparisonStatusBadge = (status: MaterialComparison['status']) => {
    switch (status) {
      case 'match':
        return <Badge className="bg-green-50 text-green-600 border-green-200"><Check className="w-3 h-3 mr-1" />Perfect Match</Badge>
      case 'price_diff':
        return <Badge className="bg-yellow-50 text-yellow-600 border-yellow-200"><AlertTriangle className="w-3 h-3 mr-1" />Price Difference</Badge>
      case 'quantity_diff':
        return <Badge className="bg-orange-50 text-orange-600 border-orange-200"><AlertTriangle className="w-3 h-3 mr-1" />Quantity Difference</Badge>
      case 'missing_in_supplier':
        return <Badge className="bg-red-50 text-red-600 border-red-200"><X className="w-3 h-3 mr-1" />Missing in Supplier</Badge>
      case 'missing_in_bluesheet':
        return <Badge className="bg-blue-50 text-blue-600 border-blue-200"><Plus className="w-3 h-3 mr-1" />Additional in Supplier</Badge>
      case 'unused':
        return <Badge className="bg-gray-50 text-gray-600 border-gray-200"><Minus className="w-3 h-3 mr-1" />Unused</Badge>
    }
  }

  const handleProceedToReview = () => {
    if (isBlueSheetEditMode || isSupplierEditMode) {
      toast.error('Please save your changes before proceeding to review')
      return
    }
    setCurrentStep('review')
    toast.info('Proceeding to final review. You can still make changes before final approval.')
  }

  const handleFinalApproval = () => {
    const finalBlueSheet = editedBlueSheet || blueSheet
    onApprovalComplete(finalBlueSheet)
    toast.success('BlueSheet approved and ready for invoice generation!')
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

  const currentBlueSheet = editedBlueSheet || blueSheet
  const currentSupplierInvoice = editedSupplierInvoice || supplierInvoice
  const comparisons = generateComparison()

  // Calculate comprehensive stats
  const totalDiscrepancyAmount = comparisons.reduce((sum, comp) => {
    if (comp.blueSheetItem && comp.supplierItem) {
      return sum + Math.abs((comp.blueSheetItem.total_cost || 0) - comp.supplierItem.total)
    }
    return sum
  }, 0)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-screen h-screen max-w-full max-h-full min-w-full min-h-full overflow-hidden p-0 rounded-none border-0">
        <DialogHeader className="p-8 pb-6 border-b bg-white">
          <DialogTitle className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-[#00A1FF]" />
            <span className="text-xl">BlueSheet Review & Approve</span>
            <Badge className="ml-3 bg-blue-50 text-blue-600 border-blue-200 px-3 py-1">
              BS-{blueSheet.id}
            </Badge>
            {(isBlueSheetEditMode || isSupplierEditMode) && (
              <Badge className="ml-2 bg-orange-50 text-orange-600 border-orange-200 animate-pulse px-3 py-1">
                <Edit className="w-4 h-4 mr-2" />
                Edit Mode Active
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription className="text-base mt-2">
            Comprehensive review and approval workflow for BlueSheet materials. Upload supplier invoice, 
            compare documents side-by-side, edit both sections as needed, and complete final review before approval.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden bg-gray-50">
          <Tabs value={currentStep} onValueChange={setCurrentStep as any} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3 mx-8 mt-6 h-12">
              <TabsTrigger value="upload" className={`gap-2 text-base ${currentStep === 'upload' ? 'bg-white' : ''}`}>
                <Upload className="h-5 w-5" />
                Upload & Fetch
              </TabsTrigger>
              <TabsTrigger value="comparison" className={`gap-2 text-base ${currentStep === 'comparison' ? 'bg-white' : ''}`} disabled={!supplierInvoice}>
                <Eye className="h-5 w-5" />
                Compare & Edit
              </TabsTrigger>
              <TabsTrigger value="review" className={`gap-2 text-base ${currentStep === 'review' ? 'bg-white' : ''}`} disabled={!supplierInvoice}>
                <CheckSquare className="h-5 w-5" />
                Final Review
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-hidden">
              {/* Upload & Fetch Tab */}
              <TabsContent value="upload" className="h-full overflow-y-auto p-8 mt-0">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 h-full max-w-7xl mx-auto">
                  {/* Left Side - Supplier Invoice Upload */}
                  <div className="space-y-8">
                    <h3 className="text-2xl font-medium text-[#2b2b2b]">Supplier Invoice Upload</h3>
                    
                    {!supplierInvoice && (
                      <div className="space-y-8">
                        {/* Auto-fetch Option */}
                        <Card className="bg-blue-50 border-blue-200">
                          <CardContent className="p-8">
                            <div className="space-y-6">
                              <div>
                                <h4 className="text-lg font-medium text-blue-900">Auto-fetch from Email</h4>
                                <p className="text-base text-blue-700 mt-2">
                                  Automatically retrieve supplier invoice for PO: BS-{blueSheet.id}
                                </p>
                                <p className="text-sm text-blue-600 mt-2">
                                  System will search email for matching PO number and extract invoice data
                                </p>
                              </div>
                              <Button
                                onClick={handleAutoFetch}
                                disabled={isAutoFetching}
                                className="w-full bg-primary text-white hover:bg-blue-700 gap-3 h-14 text-lg"
                                size="lg"
                              >
                                {isAutoFetching ? (
                                  <RefreshCw className="h-5 w-5 animate-spin" />
                                ) : (
                                  <Mail className="h-5 w-5" />
                                )}
                                {isAutoFetching ? 'Fetching from Email...' : 'Auto-fetch Invoice'}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>

                        <div className="flex items-center gap-6">
                          <div className="flex-1 h-px bg-gray-300"></div>
                          <span className="text-base text-gray-500 px-4 py-2 rounded-full bg-gray-100">OR</span>
                          <div className="flex-1 h-px bg-gray-300"></div>
                        </div>

                        {/* Manual Upload Option */}
                        <Card className="border-dashed border-2 border-gray-300 hover:border-[#00A1FF] transition-colors cursor-pointer"
                              onClick={() => fileInputRef.current?.click()}>
                          <CardContent className="p-12">
                            <div className="text-center space-y-6">
                              <div className="w-24 h-24 bg-gray-100 rounded-xl flex items-center justify-center mx-auto">
                                <Upload className="h-12 w-12 text-gray-400" />
                              </div>
                              <div>
                                <h4 className="text-lg font-medium text-[#2b2b2b]">Upload Supplier Invoice</h4>
                                <p className="text-base text-gray-600 mt-2">
                                  Drag and drop or click to upload PDF, JPG, PNG, or Excel files
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                  Maximum file size: 10MB
                                </p>
                              </div>
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  fileInputRef.current?.click()
                                }}
                                disabled={isUploading}
                                className="gap-3 h-14 text-lg px-8 bg-primary text-white"
                                size="lg"
                              >
                                {isUploading ? (
                                  <RefreshCw className="h-5 w-5 animate-spin" />
                                ) : (
                                  <Upload className="h-5 w-5" />
                                )}
                                {isUploading ? 'Processing File...' : 'Choose File to Upload'}
                              </Button>
                              <input
                                ref={fileInputRef}
                                type="file"
                                className="hidden"
                                accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls"
                                onChange={handleFileUpload}
                              />
                              {uploadedFile && (
                                <div className="flex items-center justify-center gap-3 text-base text-green-600">
                                  <CheckSquare className="h-5 w-5" />
                                  <span>Uploaded: {uploadedFile.name}</span>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}

                    {supplierInvoice && (
                      <Card className="bg-green-50 border-green-200">
                        <CardContent className="p-8">
                          <div className="flex items-center gap-3 mb-6">
                            <CheckSquare className="h-6 w-6 text-green-600" />
                            <h4 className="text-lg font-medium text-green-900">Supplier Invoice Loaded Successfully</h4>
                          </div>
                          <div className="grid grid-cols-2 gap-6 text-base mb-6">
                            <div>
                              <p><strong>Invoice #:</strong> {supplierInvoice.invoiceNumber}</p>
                              <p><strong>Supplier:</strong> {supplierInvoice.supplier}</p>
                            </div>
                            <div>
                              <p><strong>Amount:</strong> {formatCurrency(supplierInvoice.amount)}</p>
                              <p><strong>Items:</strong> {supplierInvoice.materials.length} materials</p>
                            </div>
                          </div>
                          <Button
                            onClick={() => setCurrentStep('comparison')}
                            className="w-full bg-[#00A1FF] text-white hover:bg-[#0090e6] gap-3 h-14 text-lg"
                            size="lg"
                          >
                            <ArrowRight className="h-5 w-5" />
                            Proceed to Comparison & Review
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Right Side - BlueSheet Preview */}
                  <div className="space-y-8">
                    <h3 className="text-2xl font-medium text-[#2b2b2b]">BlueSheet Overview</h3>
                    
                    <Card className="bg-white shadow-md border-0">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-lg">Material Request Summary</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Customer/Contractor Info */}
                        <div className="space-y-4 p-6 bg-blue-50 rounded-xl">
                          <div className="flex items-center gap-3">
                            <Building className="h-6 w-6 text-[#00A1FF]" />
                            <div>
                              <Label className="text-sm text-gray-600">Customer</Label>
                              <p className="text-lg font-medium text-[#00A1FF]">{blueSheet.job.customer?.customer_name || 'N/A'}</p>
                            </div>
                          </div>
                          {blueSheet.job.contractor && (
                            <div className="flex items-center gap-3 ml-9">
                              <div>
                                <Label className="text-sm text-gray-600">Contractor</Label>
                                <p className="text-lg font-medium text-gray-700">{blueSheet.job.contractor.contractor_name}</p>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <Label className="text-sm text-gray-600">Job</Label>
                            <p className="text-lg font-medium">{blueSheet.job.job_title}</p>
                            <p className="text-base text-gray-500">{blueSheet.job_id}</p>
                          </div>
                          <div>
                            <Label className="text-sm text-gray-600">PO Number</Label>
                            <p className="text-lg font-mono">BS-{blueSheet.id}</p>
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm text-gray-600">Materials Preview ({blueSheet.material_entries.length} items)</Label>
                          <div className="mt-3 space-y-3">
                            {blueSheet.material_entries.slice(0, 4).map((item, index) => (
                              <div key={index} className="flex justify-between text-base p-4 bg-gray-50 rounded-lg">
                                <div>
                                  <span className="font-medium">{item.material_name}</span>
                                  <p className="text-sm text-gray-500">Qty: {item.total_ordered} × {formatCurrency(item.unit_cost)}</p>
                                </div>
                                <span className="text-lg font-medium">{formatCurrency(item.total_cost || (item.total_ordered || 0) * (item.unit_cost || 0))}</span>
                              </div>
                            ))}
                            {blueSheet.material_entries.length > 4 && (
                              <p className="text-sm text-gray-500 text-center py-3">
                                +{blueSheet.material_entries.length - 4} more items...
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xl font-medium pt-6 border-t">
                          <span>Total Amount:</span>
                          <span className="text-[#00A1FF]">{formatCurrency(blueSheet.total_cost)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              {/* Comparison & Edit Tab */}
              <TabsContent value="comparison" className="h-full overflow-y-auto p-8 mt-0">
                <div className="space-y-8 max-w-7xl mx-auto">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-medium text-[#2b2b2b]">Material Comparison & Editing</h3>
                    <div className="flex gap-3">
                      <Button
                        onClick={handleBlueSheetEdit}
                        variant={isBlueSheetEditMode ? "default" : "outline"}
                        size="lg"
                        className={isBlueSheetEditMode ? "bg-orange-500 hover:bg-orange-600 h-12" : "h-12"}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        {isBlueSheetEditMode ? 'Exit BlueSheet Edit' : 'Edit BlueSheet'}
                      </Button>
                      <Button
                        onClick={handleSupplierEdit}
                        variant={isSupplierEditMode ? "default" : "outline"}
                        size="lg"
                        className={isSupplierEditMode ? "bg-orange-500 hover:bg-orange-600 h-12" : "h-12"}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        {isSupplierEditMode ? 'Exit Supplier Edit' : 'Edit Supplier'}
                      </Button>
                    </div>
                  </div>

                  {/* Enhanced Comparison Summary */}
                  <Card className="bg-gradient-to-r from-gray-50 to-blue-50 border-0">
                    <CardContent className="p-8">
                      <div className="grid grid-cols-5 gap-6 text-center">
                        <div>
                          <p className="text-3xl font-medium text-green-600">{comparisons.filter(c => c.status === 'match').length}</p>
                          <p className="text-base text-gray-600">Perfect Matches</p>
                        </div>
                        <div>
                          <p className="text-3xl font-medium text-yellow-600">{comparisons.filter(c => c.status === 'price_diff' || c.status === 'quantity_diff').length}</p>
                          <p className="text-base text-gray-600">With Differences</p>
                        </div>
                        <div>
                          <p className="text-3xl font-medium text-red-600">{comparisons.filter(c => c.status === 'missing_in_supplier').length}</p>
                          <p className="text-base text-gray-600">Missing in Supplier</p>
                        </div>
                        <div>
                          <p className="text-3xl font-medium text-blue-600">{comparisons.filter(c => c.status === 'missing_in_bluesheet').length}</p>
                          <p className="text-base text-gray-600">Additional in Supplier</p>
                        </div>
                        <div>
                          <p className="text-3xl font-medium text-purple-600">{formatCurrency(totalDiscrepancyAmount)}</p>
                          <p className="text-base text-gray-600">Total Discrepancy</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Side by Side Comparison */}
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                    {/* BlueSheet Section */}
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xl font-medium text-[#2b2b2b]">BlueSheet Materials</h4>
                        {isBlueSheetEditMode && (
                          <div className="flex gap-3">
                            <Button size="lg" onClick={addBlueSheetMaterial} variant="outline" className="h-12">
                              <Plus className="h-4 w-4 mr-2" />Add Material
                            </Button>
                            <Button size="lg" onClick={handleBlueSheetSave} className="bg-primary text-white hover:bg-green-700 h-12">
                              <Save className="h-4 w-4 mr-2" />Save Changes
                            </Button>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-4">
                        {currentBlueSheet.material_entries.map((item, index) => (
                          <Card key={index} className={`${isBlueSheetEditMode ? 'border-orange-200 bg-orange-50' : ''} transition-all duration-200`}>
                            <CardContent className="p-6">
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    {isBlueSheetEditMode ? (
                                      <Input
                                        value={item.material_name}
                                        onChange={(e) => handleBlueSheetMaterialChange(index, 'material_name', e.target.value)}
                                        className="font-medium text-lg h-12"
                                        placeholder="Material name"
                                      />
                                    ) : (
                                      <h5 className="text-lg font-medium">{item.material_name}</h5>
                                    )}
                                  </div>
                                  {isBlueSheetEditMode && currentBlueSheet.material_entries.length > 1 && (
                                    <Button
                                      size="lg"
                                      variant="outline"
                                      onClick={() => removeBlueSheetMaterial(index)}
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-3 h-12 w-12 p-0"
                                    >
                                      <Minus className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                                
                                <div className="grid grid-cols-3 gap-6">
                                  <div>
                                    <Label className="text-sm text-gray-600">Quantity</Label>
                                    {isBlueSheetEditMode ? (
                                      <Input
                                        type="number"
                                        value={item.total_ordered}
                                        onChange={(e) => handleBlueSheetMaterialChange(index, 'total_ordered', parseFloat(e.target.value) || 0)}
                                        className="mt-2 h-12"
                                        min="0"
                                        step="0.01"
                                      />
                                    ) : (
                                      <p className="text-lg font-medium mt-2">{item.total_ordered}</p>
                                    )}
                                  </div>
                                  <div>
                                    <Label className="text-sm text-gray-600">Unit Price</Label>
                                    {isBlueSheetEditMode ? (
                                      <Input
                                        type="number"
                                        step="0.01"
                                        value={item.unit_cost}
                                        onChange={(e) => handleBlueSheetMaterialChange(index, 'unit_cost', parseFloat(e.target.value) || 0)}
                                        className="mt-2 h-12"
                                        min="0"
                                      />
                                    ) : (
                                      <p className="text-lg font-medium mt-2">{formatCurrency(item.unit_cost)}</p>
                                    )}
                                  </div>
                                  <div>
                                    <Label className="text-sm text-gray-600">Total</Label>
                                    <p className="text-lg font-medium text-[#00A1FF] mt-2">{formatCurrency(item.total_cost || (item.total_ordered || 0) * (item.unit_cost || 0))}</p>
                                  </div>
                                </div>
                                
                                <div>
                                  <Label className="text-sm text-gray-600">Supplier</Label>
                                  {isBlueSheetEditMode ? (
                                    <Input
                                      value={item.product?.suppliers?.company_name || ''}
                                      onChange={(e) => handleBlueSheetMaterialChange(index, 'supplier', e.target.value)}
                                      className="mt-2 h-12"
                                      placeholder="Supplier name"
                                    />
                                  ) : (
                                    <Badge className="bg-gray-50 text-gray-700 border-gray-200 mt-2 text-base px-3 py-1">
                                      {item.product?.suppliers?.company_name || 'N/A'}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                        
                        <div className="border-t pt-6">
                          <div className="flex justify-between items-center text-xl font-medium">
                            <span>BlueSheet Total:</span>
                            <span className="text-[#00A1FF]">{formatCurrency(currentBlueSheet.total_cost)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Supplier Invoice Section */}
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xl font-medium text-[#2b2b2b]">Supplier Invoice Materials</h4>
                        {isSupplierEditMode && (
                          <div className="flex gap-3">
                            <Button size="lg" onClick={addSupplierMaterial} variant="outline" className="h-12">
                              <Plus className="h-4 w-4 mr-2" />Add Material
                            </Button>
                            <Button size="lg" onClick={handleSupplierSave} className="bg-primary text-white hover:bg-green-700 h-12">
                              <Save className="h-4 w-4 mr-2" />Save Changes
                            </Button>
                          </div>
                        )}
                      </div>
                      
                      {currentSupplierInvoice && (
                        <div className="space-y-4">
                          {currentSupplierInvoice.materials.map((item, index) => (
                            <Card key={index} className={`${isSupplierEditMode ? 'border-orange-200 bg-orange-50' : ''} transition-all duration-200`}>
                              <CardContent className="p-6">
                                <div className="space-y-4">
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      {isSupplierEditMode ? (
                                        <Input
                                          value={item.name}
                                          onChange={(e) => handleSupplierMaterialChange(index, 'name', e.target.value)}
                                          className="font-medium text-lg h-12"
                                          placeholder="Material name"
                                        />
                                      ) : (
                                        <h5 className="text-lg font-medium">{item.name}</h5>
                                      )}
                                    </div>
                                    {isSupplierEditMode && currentSupplierInvoice.materials.length > 1 && (
                                      <Button
                                        size="lg"
                                        variant="outline"
                                        onClick={() => removeSupplierMaterial(index)}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-3 h-12 w-12 p-0"
                                      >
                                        <Minus className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                  
                                  <div className="grid grid-cols-3 gap-6">
                                    <div>
                                      <Label className="text-sm text-gray-600">Quantity</Label>
                                      {isSupplierEditMode ? (
                                        <Input
                                          type="number"
                                          value={item.quantity}
                                          onChange={(e) => handleSupplierMaterialChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                                          className="mt-2 h-12"
                                          min="0"
                                          step="0.01"
                                        />
                                      ) : (
                                        <p className="text-lg font-medium mt-2">{item.quantity}</p>
                                      )}
                                    </div>
                                    <div>
                                      <Label className="text-sm text-gray-600">Unit Price</Label>
                                      {isSupplierEditMode ? (
                                        <Input
                                          type="number"
                                          step="0.01"
                                          value={item.unitPrice}
                                          onChange={(e) => handleSupplierMaterialChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                          className="mt-2 h-12"
                                          min="0"
                                        />
                                      ) : (
                                        <p className="text-lg font-medium mt-2">{formatCurrency(item.unitPrice)}</p>
                                      )}
                                    </div>
                                    <div>
                                      <Label className="text-sm text-gray-600">Total</Label>
                                      <p className="text-lg font-medium text-green-600 mt-2">{formatCurrency(item.total)}</p>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                          
                          <div className="border-t pt-6">
                            <div className="flex justify-between items-center text-xl font-medium">
                              <span>Supplier Total:</span>
                              <span className="text-green-600">{formatCurrency(currentSupplierInvoice.amount)}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Enhanced Detailed Comparison Table */}
                  <Card className="bg-white shadow-md border-0">
                    <CardHeader>
                      <CardTitle className="text-xl flex items-center gap-3">
                        <AlertTriangle className="h-6 w-6 text-[#00A1FF]" />
                        Detailed Material Comparison Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {comparisons.map((comparison, index) => (
                          <div key={index} className="border rounded-xl p-6 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-6">
                            <h5 className="text-xl font-medium">
                              {comparison.blueSheetItem?.material_name || comparison.supplierItem?.name}
                            </h5>
                              {getComparisonStatusBadge(comparison.status)}
                            </div>
                            
                            {comparison.differences.length > 0 && (
                              <div className="space-y-3 mb-6">
                                {comparison.differences.map((diff, diffIndex) => (
                                  <div key={diffIndex} className="flex items-start gap-3 text-base bg-yellow-50 p-4 rounded-lg">
                                    <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                                    <span>{diff}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            <div className="grid grid-cols-2 gap-8">
                              <div className="bg-blue-50 p-6 rounded-xl">
                                <Label className="text-sm text-gray-600 font-medium">BlueSheet Details</Label>
                                {comparison.blueSheetItem ? (
                                  <div className="mt-3 space-y-2 text-base">
                                    <p><strong>Qty:</strong> {comparison.blueSheetItem.total_ordered}</p>
                                    <p><strong>Unit Price:</strong> {formatCurrency(comparison.blueSheetItem.unit_cost)}</p>
                                    <p><strong>Total:</strong> {formatCurrency(comparison.blueSheetItem.total_cost || (comparison.blueSheetItem.total_ordered || 0) * (comparison.blueSheetItem.unit_cost || 0))}</p>
                                    <p><strong>Supplier:</strong> {comparison.blueSheetItem.product?.suppliers?.company_name || 'N/A'}</p>
                                  </div>
                                ) : (
                                  <p className="text-gray-400 italic mt-3 text-base">Not found in BlueSheet</p>
                                )}
                              </div>
                              <div className="bg-green-50 p-6 rounded-xl">
                                <Label className="text-sm text-gray-600 font-medium">Supplier Invoice Details</Label>
                                {comparison.supplierItem ? (
                                  <div className="mt-3 space-y-2 text-base">
                                    <p><strong>Qty:</strong> {comparison.supplierItem.quantity}</p>
                                    <p><strong>Unit Price:</strong> {formatCurrency(comparison.supplierItem.unitPrice)}</p>
                                    <p><strong>Total:</strong> {formatCurrency(comparison.supplierItem.total)}</p>
                                  </div>
                                ) : (
                                  <p className="text-gray-400 italic mt-3 text-base">Not found in Supplier Invoice</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex justify-end">
                    <Button
                      onClick={handleProceedToReview}
                      disabled={isBlueSheetEditMode || isSupplierEditMode}
                      className="bg-primary text-white hover:bg-[#0090e6] gap-3 h-14 text-lg px-8"
                      size="lg"
                    >
                      <ArrowRight className="h-5 w-5" />
                      Proceed to Final Review
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Enhanced Final Review Tab */}
              <TabsContent value="review" className="h-full overflow-y-auto p-8 mt-0">
                <div className="space-y-8 max-w-7xl mx-auto">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-medium text-[#2b2b2b]">Final Review & Approval</h3>
                    <Badge className="bg-blue-50 text-blue-600 border-blue-200 px-4 py-2 text-base">
                      <CheckSquare className="w-5 h-5 mr-2" />
                      Ready for Final Approval
                    </Badge>
                  </div>

                  {/* Enhanced Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="p-8">
                        <div className="text-center">
                          <FileText className="h-10 w-10 text-blue-600 mx-auto mb-3" />
                          <h4 className="text-lg font-medium text-blue-900">BlueSheet</h4>
                          <p className="text-3xl font-medium text-blue-600">{formatCurrency(currentBlueSheet.total_cost)}</p>
                          <p className="text-base text-blue-700">{currentBlueSheet.material_entries.length} materials</p>
                        </div>
                      </CardContent>
                    </Card>

                    {currentSupplierInvoice && (
                      <Card className="bg-green-50 border-green-200">
                        <CardContent className="p-8">
                          <div className="text-center">
                            <CheckSquare className="h-10 w-10 text-green-600 mx-auto mb-3" />
                            <h4 className="text-lg font-medium text-green-900">Supplier Invoice</h4>
                            <p className="text-3xl font-medium text-green-600">{formatCurrency(currentSupplierInvoice.amount)}</p>
                            <p className="text-base text-green-700">{currentSupplierInvoice.materials.length} materials</p>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    <Card className="bg-purple-50 border-purple-200">
                      <CardContent className="p-8">
                        <div className="text-center">
                          <DollarSign className="h-10 w-10 text-purple-600 mx-auto mb-3" />
                          <h4 className="text-lg font-medium text-purple-900">Amount Difference</h4>
                          <p className="text-3xl font-medium text-purple-600">
                            {currentSupplierInvoice ? 
                              formatCurrency(Math.abs(currentBlueSheet.total_cost - currentSupplierInvoice.amount)) : 
                              formatCurrency(0)
                            }
                          </p>
                          <p className="text-base text-purple-700">
                            {currentSupplierInvoice ?
                              `${((Math.abs(currentBlueSheet.total_cost - currentSupplierInvoice.amount) / currentBlueSheet.total_cost) * 100).toFixed(1)}% variance` :
                              'N/A'
                            }
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-orange-50 border-orange-200">
                      <CardContent className="p-8">
                        <div className="text-center">
                          <AlertTriangle className="h-10 w-10 text-orange-600 mx-auto mb-3" />
                          <h4 className="text-lg font-medium text-orange-900">Discrepancies</h4>
                          <p className="text-3xl font-medium text-orange-600">
                            {comparisons.filter(c => c.differences.length > 0).length}
                          </p>
                          <p className="text-base text-orange-700">items with differences</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Enhanced Final Review Summary */}
                  <Card className="bg-white shadow-md border-0">
                    <CardHeader>
                      <CardTitle className="text-xl">Comprehensive Review Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-8">
                        <div className="grid grid-cols-2 gap-8">
                          <div>
                            <Label className="text-base text-gray-600">Customer</Label>
                            <p className="text-xl font-medium text-[#00A1FF]">{currentBlueSheet.job.customer?.customer_name || 'N/A'}</p>
                          </div>
                          <div>
                            <Label className="text-base text-gray-600">Job</Label>
                            <p className="text-xl font-medium">{currentBlueSheet.job.job_title}</p>
                          </div>
                          <div>
                            <Label className="text-base text-gray-600">PO Number</Label>
                            <p className="text-xl font-mono">BS-{currentBlueSheet.id}</p>
                          </div>
                          <div>
                            <Label className="text-base text-gray-600">Submitted By</Label>
                            <p className="text-xl font-medium">{currentBlueSheet.created_by_user.full_name}</p>
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <Label className="text-base text-gray-600">Comparison Analysis Results</Label>
                          <div className="mt-4 flex flex-wrap gap-3">
                            {comparisons.filter(c => c.status === 'match').length > 0 && (
                              <Badge className="bg-green-50 text-green-600 border-green-200 text-base px-3 py-1">
                                <Check className="w-4 h-4 mr-2" />
                                {comparisons.filter(c => c.status === 'match').length} Perfect Matches
                              </Badge>
                            )}
                            {comparisons.filter(c => c.status === 'price_diff' || c.status === 'quantity_diff').length > 0 && (
                              <Badge className="bg-yellow-50 text-yellow-600 border-yellow-200 text-base px-3 py-1">
                                <AlertTriangle className="w-4 h-4 mr-2" />
                                {comparisons.filter(c => c.status === 'price_diff' || c.status === 'quantity_diff').length} With Differences
                              </Badge>
                            )}
                            {comparisons.filter(c => c.status === 'missing_in_supplier').length > 0 && (
                              <Badge className="bg-red-50 text-red-600 border-red-200 text-base px-3 py-1">
                                <X className="w-4 h-4 mr-2" />
                                {comparisons.filter(c => c.status === 'missing_in_supplier').length} Missing in Supplier
                              </Badge>
                            )}
                            {comparisons.filter(c => c.status === 'missing_in_bluesheet').length > 0 && (
                              <Badge className="bg-blue-50 text-blue-600 border-blue-200 text-base px-3 py-1">
                                <Plus className="w-4 h-4 mr-2" />
                                {comparisons.filter(c => c.status === 'missing_in_bluesheet').length} Additional in Supplier
                              </Badge>
                            )}
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <Label className="text-base text-gray-600">Final Approval Notes</Label>
                          <Textarea
                            placeholder="Add any final notes, comments, or special instructions for this approval..."
                            className="mt-3 h-24 text-base"
                            rows={5}
                          />
                        </div>

                        {/* Edit Options in Review */}
                        <div className="bg-gray-50 p-6 rounded-xl">
                          <h5 className="text-lg font-medium text-[#2b2b2b] mb-4">Last Minute Edits (Optional)</h5>
                          <div className="flex gap-4">
                            <Button
                              variant="outline"
                              size="lg"
                              onClick={() => setCurrentStep('comparison')}
                              className="gap-2 h-12"
                            >
                              <Edit className="h-4 w-4" />
                              Edit Materials
                            </Button>
                            <Button
                              variant="outline"
                              size="lg"
                              onClick={() => {
                                setCurrentStep('comparison')
                                setTimeout(() => handleBlueSheetEdit(), 100)
                              }}
                              className="gap-2 h-12"
                            >
                              <FileText className="h-4 w-4" />
                              Edit BlueSheet
                            </Button>
                            <Button
                              variant="outline"
                              size="lg"
                              onClick={() => {
                                setCurrentStep('comparison')
                                setTimeout(() => handleSupplierEdit(), 100)
                              }}
                              className="gap-2 h-12"
                            >
                              <Package className="h-4 w-4" />
                              Edit Supplier Invoice
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep('comparison')}
                      className="gap-2 h-14 text-lg px-6"
                      size="lg"
                    >
                      <ArrowLeft className="h-5 w-5" />
                      Back to Edit & Compare
                    </Button>
                    
                    <div className="flex gap-6">
                      <Button
                        variant="outline"
                        onClick={onClose}
                        className="h-14 text-lg px-6"
                        size="lg"
                      >
                        Cancel Review
                      </Button>
                      
                      <Button
                        onClick={handleFinalApproval}
                        className="bg-primary text-white hover:bg-green-700 gap-3 h-14 text-lg px-8"
                        size="lg"
                      >
                        <Send className="h-5 w-5" />
                        Final Approval & Generate Invoice
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}