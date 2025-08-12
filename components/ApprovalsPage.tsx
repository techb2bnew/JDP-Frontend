import React, { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Badge } from './ui/badge'
import { BlueSheetApprovalDialog } from './invoices/BlueSheetApprovalDialog'
import { ArrowLeft, CheckSquare, X, Clock, FileText, User, Upload, Eye, Edit, RotateCcw, Building } from 'lucide-react'

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

interface BlueSheetItem {
  id: string
  jobId: string
  jobTitle: string
  submittedBy: string
  submittedDate: string
  status: 'pending' | 'approved' | 'rejected'
  description: string
  amount: number
  poNumber: string
  approvedBy?: string
  approvedDate?: string
  rejectedBy?: string
  rejectedDate?: string
  customer: string
  contractor?: string
  materials: Array<{
    name: string
    quantity: number
    unitPrice: number
    total: number
    supplier: string
  }>
  hasSupplierInvoice?: boolean
  supplierInvoiceAutoFetched?: boolean
}

interface JobApprovalsProps {
  onBack: () => void
  jobs: Job[]
  onApprovalCountChange?: (count: number) => void
}

// Updated approver names as requested
const approverNames = ['Jen Paidosh', 'Paul Woytcke', 'Sarah Chen', 'Mike Johnson', 'Lisa Rodriguez']

const getRandomApprover = () => {
  return approverNames[Math.floor(Math.random() * approverNames.length)]
}

export function ApprovalsPage({ onBack, onApprovalCountChange }: JobApprovalsProps) {
  const [blueSheets, setBlueSheets] = useState<BlueSheetItem[]>([
    {
      id: '1',
      jobId: 'JOB-2025-001',
      jobTitle: 'Electrical Panel Installation',
      customer: 'ABC Corporation',
      contractor: 'Elite Electrical Services',
      submittedBy: 'John Smith',
      submittedDate: '2025-01-20',
      status: 'pending',
      description: 'Material list and quantities for electrical panel installation',
      amount: 1910,
      poNumber: 'PO-2025-001-EP',
      materials: [
        { name: 'Main Electrical Panel', quantity: 1, unitPrice: 450, total: 450, supplier: 'ElectroSupply Co' },
        { name: 'Circuit Breakers (20A)', quantity: 8, unitPrice: 35, total: 280, supplier: 'ElectroSupply Co' },
        { name: 'Copper Wire (12 AWG)', quantity: 500, unitPrice: 2.4, total: 1200, supplier: 'WirePlus Inc' },
        { name: 'Conduit Fittings', quantity: 12, unitPrice: 15, total: 180, supplier: 'ElectroSupply Co' }
      ],
      hasSupplierInvoice: false,
      supplierInvoiceAutoFetched: false
    },
    {
      id: '2',
      jobId: 'JOB-2025-002',
      jobTitle: 'Office Lighting Maintenance',
      customer: 'XYZ Office Complex',
      contractor: 'Bright Solutions Ltd',
      submittedBy: 'Sarah Johnson',
      submittedDate: '2025-01-21',
      status: 'pending',
      description: 'LED bulbs and ballasts for monthly maintenance',
      amount: 680,
      poNumber: 'PO-2025-002-LM',
      materials: [
        { name: 'LED Bulbs (40W)', quantity: 24, unitPrice: 18, total: 432, supplier: 'LightSource Pro' },
        { name: 'Electronic Ballasts', quantity: 8, unitPrice: 31, total: 248, supplier: 'LightSource Pro' }
      ],
      hasSupplierInvoice: true,
      supplierInvoiceAutoFetched: true
    },
    {
      id: '3',
      jobId: 'JOB-2025-003',
      jobTitle: 'Emergency Generator Setup',
      customer: 'Healthcare Center',
      contractor: 'PowerGen Solutions',
      submittedBy: 'Mike Rodriguez',
      submittedDate: '2025-01-19',
      status: 'approved',
      description: 'Generator unit and installation materials',
      amount: 8200,
      poNumber: 'PO-2025-003-GEN',
      approvedBy: 'Jen Paidosh',
      approvedDate: '2025-01-20',
      materials: [
        { name: 'Emergency Generator (50kW)', quantity: 1, unitPrice: 6500, total: 6500, supplier: 'PowerGen Solutions' },
        { name: 'Transfer Switch', quantity: 1, unitPrice: 1200, total: 1200, supplier: 'PowerGen Solutions' },
        { name: 'Installation Kit', quantity: 1, unitPrice: 500, total: 500, supplier: 'PowerGen Solutions' }
      ],
      hasSupplierInvoice: true,
      supplierInvoiceAutoFetched: true
    },
    {
      id: '4',
      jobId: 'JOB-2025-004',
      jobTitle: 'HVAC System Repair',
      customer: 'Metro Shopping Center',
      contractor: 'ClimateControl Inc',
      submittedBy: 'Lisa Chen',
      submittedDate: '2025-01-22',
      status: 'approved',
      description: 'HVAC parts and filters for system repair',
      amount: 960,
      poNumber: 'PO-2025-004-HVAC',
      approvedBy: 'Paul Woytcke',
      approvedDate: '2025-01-23',
      materials: [
        { name: 'HVAC Compressor Parts', quantity: 3, unitPrice: 180, total: 540, supplier: 'ClimateControl Inc' },
        { name: 'Air Filters (HEPA)', quantity: 6, unitPrice: 45, total: 270, supplier: 'ClimateControl Inc' },
        { name: 'Refrigerant R-410A', quantity: 2, unitPrice: 75, total: 150, supplier: 'ClimateControl Inc' }
      ],
      hasSupplierInvoice: true,
      supplierInvoiceAutoFetched: false
    },
    {
      id: '5',
      jobId: 'JOB-2025-005',
      jobTitle: 'Plumbing System Upgrade',
      customer: 'Downtown Office Building',
      contractor: 'PlumbPro Supply',
      submittedBy: 'Robert Taylor',
      submittedDate: '2025-01-24',
      status: 'rejected',
      description: 'Copper pipes and fittings for plumbing upgrade',
      amount: 1450,
      poNumber: 'PO-2025-005-PLUMB',
      rejectedBy: 'Sarah Chen',
      rejectedDate: '2025-01-25',
      materials: [
        { name: 'Copper Pipes (3/4")', quantity: 50, unitPrice: 18, total: 900, supplier: 'PlumbPro Supply' },
        { name: 'Pipe Fittings', quantity: 25, unitPrice: 22, total: 550, supplier: 'PlumbPro Supply' }
      ],
      hasSupplierInvoice: false,
      supplierInvoiceAutoFetched: false
    }
  ])

  const [selectedBlueSheet, setSelectedBlueSheet] = useState<BlueSheetItem | null>(null)
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)

  // Only show BlueSheet items for the main listing
  const filteredBlueSheets = blueSheets

  // Calculate pending count and notify parent component
  const pendingCount = blueSheets.filter(item => item.status === 'pending').length
  
  // Notify parent component of approval count changes
  React.useEffect(() => {
    if (onApprovalCountChange) {
      onApprovalCountChange(pendingCount)
    }
  }, [pendingCount, onApprovalCountChange])

  const handleApprove = (blueSheet: BlueSheetItem) => {
    setSelectedBlueSheet(blueSheet)
    setShowApprovalDialog(true)
  }

  const handleQuickApprove = (id: string) => {
    setBlueSheets(blueSheets.map(item => 
      item.id === id ? { 
        ...item, 
        status: 'approved' as const,
        approvedBy: getRandomApprover(),
        approvedDate: new Date().toISOString()
      } : item
    ))
  }

  const handleReject = (id: string) => {
    setBlueSheets(blueSheets.map(item => 
      item.id === id ? { 
        ...item, 
        status: 'rejected' as const,
        rejectedBy: getRandomApprover(),
        rejectedDate: new Date().toISOString()
      } : item
    ))
  }

  const handleEdit = (id: string) => {
    // Edit functionality - for now just show a placeholder
    const item = blueSheets.find(sheet => sheet.id === id)
    if (item) {
      setSelectedBlueSheet(item)
      setShowApprovalDialog(true)
    }
  }

  const handleUpdate = (id: string) => {
    // Update functionality - refresh/reload the item
    console.log('Updating BlueSheet:', id)
    // In a real app, this would refetch the data
  }

  const handleApprovalComplete = (approvedItem: BlueSheetItem) => {
    setBlueSheets(blueSheets.map(item => 
      item.id === approvedItem.id ? {
        ...approvedItem,
        status: 'approved' as const,
        approvedBy: getRandomApprover(),
        approvedDate: new Date().toISOString()
      } : item
    ))
    setShowApprovalDialog(false)
    setSelectedBlueSheet(null)
  }

  const getStatusBadge = (blueSheet: BlueSheetItem) => {
    switch (blueSheet.status) {
      case 'pending':
        return (
          <Badge className="bg-yellow-50 text-yellow-600 border-yellow-200 hover:bg-yellow-50">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        )
      case 'approved':
        return (
          <div className="space-y-1">
            <Badge className="bg-green-50 text-green-600 border-green-200 hover:bg-green-50">
              <CheckSquare className="w-3 h-3 mr-1" />
              Approved
            </Badge>
            {blueSheet.approvedBy && (
              <div className="text-xs text-green-600">
                Approved by {blueSheet.approvedBy}
              </div>
            )}
            {blueSheet.approvedDate && (
              <div className="text-xs text-gray-500">
                {formatDate(blueSheet.approvedDate)}
              </div>
            )}
          </div>
        )
      case 'rejected':
        return (
          <div className="space-y-1">
            <Badge className="bg-red-50 text-red-600 border-red-200 hover:bg-red-50">
              <X className="w-3 h-3 mr-1" />
              Rejected
            </Badge>
            {blueSheet.rejectedBy && (
              <div className="text-xs text-red-600">
                Rejected by {blueSheet.rejectedBy}
              </div>
            )}
            {blueSheet.rejectedDate && (
              <div className="text-xs text-gray-500">
                {formatDate(blueSheet.rejectedDate)}
              </div>
            )}
          </div>
        )
      default:
        return (
          <Badge className="bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-50">
            {blueSheet.status}
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

  const approvedCount = blueSheets.filter(item => item.status === 'approved').length
  const rejectedCount = blueSheets.filter(item => item.status === 'rejected').length

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Invoices
        </Button>
        <div>
          <h1 className="text-2xl font-medium text-[#2b2b2b]">BlueSheet Approvals</h1>
          <p className="text-sm text-[#2b2b2b]/60 mt-1">Review and approve material lists for invoice generation</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white shadow-sm border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total BlueSheets</p>
                <p className="text-2xl font-medium text-[#2b2b2b]">{blueSheets.length}</p>
              </div>
              <div className="w-12 h-12 bg-[#E6F6FF] rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-[#00A1FF]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Approval</p>
                <p className="text-2xl font-medium text-yellow-600">{pendingCount}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-medium text-green-600">{approvedCount}</p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <CheckSquare className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rejected</p>
                <p className="text-2xl font-medium text-red-600">{rejectedCount}</p>
              </div>
              <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
                <X className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white shadow-sm border-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#162f3d] hover:bg-[#162f3d]">
                <TableHead className="text-white font-medium">Customer/Contractor</TableHead>
                <TableHead className="text-white font-medium">Job Details</TableHead>
                <TableHead className="text-white font-medium">PO Number</TableHead>
                <TableHead className="text-white font-medium">Submitted By</TableHead>
                <TableHead className="text-white font-medium">Date</TableHead>
                <TableHead className="text-white font-medium">Amount</TableHead>
                <TableHead className="text-white font-medium">Supplier Invoice</TableHead>
                <TableHead className="text-white font-medium">Status</TableHead>
                <TableHead className="text-white font-medium">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBlueSheets.map((blueSheet, index) => (
                <TableRow key={blueSheet.id} className={index % 2 === 1 ? "bg-[#eff4fa]" : ""}>
                  <TableCell>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-[#00A1FF]" />
                        <div>
                          <div className="font-medium text-sm text-[#00A1FF]">{blueSheet.customer}</div>
                          <div className="text-xs text-gray-500">Customer</div>
                        </div>
                      </div>
                      {blueSheet.contractor && (
                        <div className="flex items-center gap-2 pl-6">
                          <User className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="font-medium text-xs text-gray-700">{blueSheet.contractor}</div>
                            <div className="text-xs text-gray-400">Contractor</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium text-sm">{blueSheet.jobTitle}</div>
                      <div className="text-xs text-gray-500">{blueSheet.jobId}</div>
                      <div className="text-xs text-gray-400 mt-1 max-w-xs truncate">{blueSheet.description}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-mono text-sm">{blueSheet.poNumber}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{blueSheet.submittedBy}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{formatDate(blueSheet.submittedDate)}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(blueSheet.amount)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {blueSheet.hasSupplierInvoice ? (
                        <Badge className="bg-green-50 text-green-600 border-green-200">
                          <CheckSquare className="w-3 h-3 mr-1" />
                          Available
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-50 text-gray-600 border-gray-200">
                          <Upload className="w-3 h-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                      {blueSheet.supplierInvoiceAutoFetched && (
                        <Badge className="bg-blue-50 text-blue-600 border-blue-200">
                          Auto-fetched
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(blueSheet)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {blueSheet.status === 'pending' && (
                        <>
                          <Button 
                            size="sm" 
                            onClick={() => handleApprove(blueSheet)}
                            className="bg-primary text-white hover:bg-[#0090e6] gap-1"
                          >
                            <Eye className="h-3 w-3" />
                            Review & Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleReject(blueSheet.id)}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                      {blueSheet.status !== 'pending' && (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setSelectedBlueSheet(blueSheet)
                              setShowApprovalDialog(true)
                            }}
                            className="gap-1"
                          >
                            <Eye className="h-3 w-3" />
                            View
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleEdit(blueSheet.id)}
                            className="gap-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                          >
                            <Edit className="h-3 w-3" />
                            Edit
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleUpdate(blueSheet.id)}
                            className="gap-1 text-green-600 border-green-200 hover:bg-green-50"
                          >
                            <RotateCcw className="h-3 w-3" />
                            Update
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* BlueSheet Approval Dialog */}
      <BlueSheetApprovalDialog
        isOpen={showApprovalDialog}
        onClose={() => {
          setShowApprovalDialog(false)
          setSelectedBlueSheet(null)
        }}
        blueSheet={selectedBlueSheet}
        onApprovalComplete={handleApprovalComplete}
      />
    </div>
  )
}

// Export function to get pending approval count for notification system
export const getPendingApprovalCount = (approvals: BlueSheetItem[]): number => {
  return approvals.filter(approval => approval.status === 'pending').length
}