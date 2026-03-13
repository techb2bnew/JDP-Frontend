import React, { useState, useEffect, useMemo } from 'react'
import { Button } from './ui/button'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from './ui/alert-dialog'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Badge } from './ui/badge'
import { BlueSheetApprovalDialog, BlueSheetItem as DialogBlueSheetItem } from './invoices/BlueSheetApprovalDialog'
import { ArrowLeft, CheckSquare, X, Clock, FileText, User, Upload, Eye, Edit, RotateCcw, Building } from 'lucide-react'
import { apiClient } from '../utils/api'
import { LoadingSpinner } from './common/LoadingSpinner'
import { BlueSheetSelectionModal } from './invoices/BlueSheetSelectionModal'
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

interface ApiBlueSheetItem {
  job_id: number
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
  bluesheet_count: number
  amount: number
  total_cost: number
  latest_bluesheet_id: number
  latest_bluesheet_date: string
  submitted_by: {
    id: number
    email: string
    full_name: string
  }
  approved_by: {
    id: number
    email: string
    full_name: string
  } | null

  id?: number
  date?: string
  created_by?: number
  notes?: string
  additional_charges?: number
  status?: 'pending' | 'approved' | 'rejected'
  created_at?: string
  updated_at?: string
  created_by_user?: { id: number; email: string; full_name: string }
  labor_entries?: Array<any>
  material_entries?: Array<any>
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
  const [blueSheets, setBlueSheets] = useState<ApiBlueSheetItem[]>([])
  const [allBlueSheets, setAllBlueSheets] = useState<ApiBlueSheetItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)

  const [selectedBlueSheet, setSelectedBlueSheet] = useState<any>(null)
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [approveTarget, setApproveTarget] = useState<ApiBlueSheetItem | null>(null)
  const [isApproving, setIsApproving] = useState(false)
  const [showSelectionModal, setShowSelectionModal] = useState(false)
  const [jobSheetsForModal, setJobSheetsForModal] = useState<any[]>([])
  const [selectionTarget, setSelectionTarget] = useState<ApiBlueSheetItem | null>(null)
  const [selectedBlueSheets, setSelectedBlueSheets] = useState<any[]>([])
  console.log(blueSheets, "bluesheets");
  console.log(selectedBlueSheet, "selectedBlueSheet")
  // Fetch bluesheets from API
  const fetchBluesheets = async (page: number = 1) => {
    try {
      setIsLoading(true)
      const response = await apiClient.getBluesheets(page, 10)

      if (response.success && response.data) {
        const sheets = response.data.jobs || []

        const normalized = sheets.map((item: any) => ({
          ...item,
          id: item.latest_bluesheet_id,
          date: item.latest_bluesheet_date,
          status: item.approved_by ? 'approved' : 'pending',
          created_by_user: item.submitted_by,
          notes: '',
          additional_charges: 0,
          bluesheet_count: item.bluesheet_count || 1,
          total_cost: item.total_cost,
          labor_entries: [],
          material_entries: [],
          created_by: item.submitted_by?.id,
        }))

        setBlueSheets(normalized)
        setAllBlueSheets(normalized)
        setTotalPages(response.data.pagination?.total_pages || 1)
        setTotalRecords(response.data.pagination?.total_records || 0)
      }
    } catch (error) {
      console.error('Error fetching bluesheets:', error)
      setBlueSheets([])
      setAllBlueSheets([])
    } finally {
      setIsLoading(false)
    }
  }

  // Load data on component mount and page change
  useEffect(() => {
    fetchBluesheets(currentPage)
  }, [currentPage])



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

  const [isLoadingSheets, setIsLoadingSheets] = useState(false)

  const handleApprove = async (blueSheet: ApiBlueSheetItem) => {
    try {
      setIsLoadingSheets(true)

      const response = await apiClient.getJobBluesheets(blueSheet.job_id)
 
      const responseData = response.data || response
      const bluesheets = responseData?.bluesheets || responseData?.data || responseData || []
      const sheetsArray = Array.isArray(bluesheets) ? bluesheets : []

      const totalLaborHours = responseData?.total_labor_hours 

      const sheetsForModal = sheetsArray.map((sheet: any) => ({
        ...sheet,
        id: sheet.id ?? sheet.latest_bluesheet_id,
        date: sheet.date ?? sheet.latest_bluesheet_date ?? '',
        status: sheet.status ?? 'pending',
        notes: sheet.notes ?? '',
        additional_charges: sheet.additional_charges ?? 0,
        created_by: sheet.created_by ?? sheet.submitted_by?.id ?? 0,
        created_by_user: sheet.created_by_user ?? sheet.submitted_by ?? { id: 0, email: '', full_name: 'N/A' },
        labor_entries: sheet.labor_entries ?? [],
        material_entries: (sheet.material_entries ?? []).map((m: any) => ({
          ...m,
          // attach source bluesheet id for downstream UI
          job_bluesheet_id: m.job_bluesheet_id ?? m.bluesheet_id ?? m.bluesheetId ?? sheet.id,
        })),
        materials_invoiced: sheet.materials_invoiced,
        total_labor_hours: sheet.total_labor_hours ?? totalLaborHours ?? null, 
        created_at: sheet.created_at ?? '',
        updated_at: sheet.updated_at ?? '',
      }))

      setJobSheetsForModal(sheetsForModal)
      setShowSelectionModal(true)

    } catch (error) {
      console.error('Error fetching job bluesheets:', error)
    } finally {
      setIsLoadingSheets(false)
    }
  }

  const handleApproveClick = (blueSheet: ApiBlueSheetItem) => {
    setApproveTarget(blueSheet)
    setIsConfirmOpen(true)
  }
  const handleSelectionSubmit = (selectedSheets: any[]) => {
    setShowSelectionModal(false)
    if (selectedSheets.length === 0) return
    setSelectedBlueSheets(selectedSheets)
    const firstSheet = selectedSheets[0]

    const mergedMaterials = selectedSheets.flatMap(sheet => sheet.material_entries ?? [])
    const mergedLabor = selectedSheets.flatMap(sheet => sheet.labor_entries ?? [])
    const mergedTotalCost = selectedSheets.reduce((sum, sheet) => sum + (sheet.total_cost ?? 0), 0)
    const mergedNotes = selectedSheets.map(sheet => sheet.notes).filter(Boolean).join(' | ')

    const dialogSheet = {
      id: firstSheet.id ?? firstSheet.latest_bluesheet_id ?? 0,
      job_id: firstSheet.job_id ?? 0,
      date: firstSheet.date ?? firstSheet.latest_bluesheet_date ?? '',
      created_by: firstSheet.created_by ?? firstSheet.submitted_by?.id ?? 0,
      notes: mergedNotes || firstSheet.notes || '',
      additional_charges: selectedSheets.reduce((sum, s) => sum + (s.additional_charges ?? 0), 0),
      total_cost: mergedTotalCost,
      status: (firstSheet.status ?? 'pending') as 'pending' | 'approved' | 'rejected',
      created_at: firstSheet.created_at ?? '',
      updated_at: firstSheet.updated_at ?? '',
      job: firstSheet.job,
      created_by_user: firstSheet.created_by_user ?? firstSheet.submitted_by ?? { id: 0, email: '', full_name: 'N/A' },
      labor_entries: mergedLabor,
      material_entries: mergedMaterials,
      // total labor hours string passed directly from API (e.g. "58h34m")
      total_labor_hours: firstSheet.total_labor_hours ?? null,
    }

    setSelectedBlueSheet(dialogSheet)
    setTimeout(() => setShowApprovalDialog(true), 0)
  }

  const confirmApprove = async () => {
    if (!approveTarget) return

    const id = approveTarget.id ?? approveTarget.latest_bluesheet_id  // undefined fallback
    if (!id) return

    try {
      setIsApproving(true)
      await apiClient.approveBulkBluesheet([id], 'approved')
      setBlueSheets(blueSheets.map(item =>
        item.id === id ? {
          ...item,
          status: 'approved' as const
        } : item
      ))
      fetchBluesheets(currentPage)
    } catch (error) {
      console.error('Error approving bluesheet:', error)
    } finally {
      setIsApproving(false)
      setIsConfirmOpen(false)
      setApproveTarget(null)
    }
  }

  const handleQuickApprove = (id: number) => {
    setBlueSheets(blueSheets.map(item =>
      item.id === id ? {
        ...item,
        status: 'approved' as const
      } : item
    ))
  }

  const handleReject = (id: number) => {
    setBlueSheets(blueSheets.map(item =>
      item.id === id ? {
        ...item,
        status: 'rejected' as const
      } : item
    ))
  }

  const handleEdit = (id: number) => {
    // Edit functionality - for now just show a placeholder
    const item = blueSheets.find(sheet => sheet.id === id)
    if (item) {
      setSelectedBlueSheet(item)
      setShowApprovalDialog(true)
    }
  }

  const handleUpdate = (id: number) => {
    // Update functionality - refresh/reload the item
    console.log('Updating BlueSheet:', id)
    fetchBluesheets(currentPage)
  }

  const handleApprovalComplete = (approvedItem: any) => {
    setBlueSheets(blueSheets.map(item =>
      item.job_id === approvedItem.job_id ? {
        ...item,
        status: 'approved' as const
      } : item
    ))
    setShowApprovalDialog(false)
    setSelectedBlueSheet(null)
    fetchBluesheets(currentPage)  // refresh karo
  }

  const getStatusBadge = (blueSheet: ApiBlueSheetItem) => {
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
          </div>
        )
      case 'rejected':
        return (
          <div className="space-y-1">
            <Badge className="bg-red-50 text-red-600 border-red-200 hover:bg-red-50">
              <X className="w-3 h-3 mr-1" />
              Rejected
            </Badge>
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

  const getCustomerName = (blueSheet: ApiBlueSheetItem) => {
    // Priority: customer_name > contractor_name > 'N/A'
    if (blueSheet.job.customer?.customer_name) {
      return blueSheet.job.customer.customer_name
    }
    if (blueSheet.job.contractor?.contractor_name) {
      return blueSheet.job.contractor.contractor_name
    }
    return 'N/A'
  }

  const getContractorName = (blueSheet: ApiBlueSheetItem) => {
    return blueSheet.job.contractor?.contractor_name || 'N/A'
  }

  const getCustomerType = (blueSheet: ApiBlueSheetItem) => {
    // Show "Customer" if customer exists, otherwise "Contractor"
    if (blueSheet.job.customer?.customer_name) {
      return 'Customer'
    }
    if (blueSheet.job.contractor?.contractor_name) {
      return 'Contractor'
    }
    return 'Customer'
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
        <Card className="bg-white shadow-md border-0">
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

        <Card className="bg-white shadow-md border-0">
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

        <Card className="bg-white shadow-md border-0">
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

        <Card className="bg-white shadow-md border-0">
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

      <Card className="bg-white shadow-md border-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#162f3d] hover:bg-[#162f3d]">
                <TableHead className="text-white font-medium">Customer/Contractor</TableHead>
                <TableHead className="text-white font-medium">Job Details</TableHead>
                {/* <TableHead className="text-white font-medium">PO Number</TableHead> */}
                <TableHead className="text-white font-medium">Submitted By</TableHead>
                <TableHead className="text-white font-medium">Amount</TableHead>
                <TableHead className="text-white font-medium">Bluesheet Count</TableHead>
                {/* <TableHead className="text-white font-medium">Status</TableHead> */}
                <TableHead className="text-white font-medium">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <LoadingSpinner />
                      <span className="ml-2">Loading bluesheets...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredBlueSheets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                    No bluesheets found
                  </TableCell>
                </TableRow>
              ) : (
                filteredBlueSheets.map((blueSheet, index) => (
                  <TableRow key={blueSheet.id} className={index % 2 === 1 ? "bg-[#eff4fa]" : ""}>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-[#00A1FF]" />
                          <div>
                            <div className="font-medium text-sm text-[#00A1FF]">{getCustomerName(blueSheet)}</div>
                            <div className="text-xs text-gray-500">{getCustomerType(blueSheet)}</div>
                          </div>
                        </div>
                        {/* Only show contractor if it's different from customer */}
                        {blueSheet.job.contractor && blueSheet.job.customer && (
                          <div className="flex items-center gap-2 pl-6">
                            <User className="h-4 w-4 text-gray-400" />
                            <div>
                              <div className="font-medium text-xs text-gray-700">{getContractorName(blueSheet)}</div>
                              <div className="text-xs text-gray-400">Contractor</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-sm">{blueSheet.job.job_title}</div>
                        <div className="text-xs text-gray-500">Job #{blueSheet.job_id}</div>
                        <div className="text-xs text-gray-400 mt-1 max-w-xs truncate">{blueSheet.notes}</div>
                      </div>
                    </TableCell>
                    {/* <TableCell>
                      <div className="font-mono text-sm">BS-{blueSheet.id}</div>
                    </TableCell> */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">
                          {blueSheet.submitted_by?.full_name || blueSheet.created_by_user?.full_name || 'N/A'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{formatCurrency(blueSheet.total_cost)}</TableCell>
                    <TableCell>

                      <Badge className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-50">
                        {blueSheet.bluesheet_count} Sheets
                      </Badge>

                    </TableCell>
                    {/* <TableCell>{getStatusBadge(blueSheet)}</TableCell> */}
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(blueSheet)}
                          className="bg-primary text-white hover:bg-[#0090e6] gap-1"
                        >
                          <Eye className="h-3 w-3" />
                          Review & Approve
                        </Button>
                        {/* {blueSheet.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleApproveClick(blueSheet)}
                              className="bg-primary text-white hover:bg-[#0090e6] gap-1"
                            >
                              Approve
                            </Button>
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
                        )} */}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t">
          <div className="text-sm text-gray-500">
            Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, totalRecords)} of {totalRecords} bluesheets
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1 || isLoading}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={currentPage >= totalPages || isLoading}
            >
              Next
            </Button>
          </div>
        </div>
      )}
      <BlueSheetSelectionModal
        isOpen={showSelectionModal}
        onClose={() => {
          setShowSelectionModal(false)
          setJobSheetsForModal([])
        }}
        blueSheets={jobSheetsForModal}
        onSubmitSelected={handleSelectionSubmit}
      />
      {/* BlueSheet Approval Dialog - Commented out due to interface mismatch */}
      <BlueSheetApprovalDialog
        isOpen={showApprovalDialog}
        onClose={() => {
          setShowApprovalDialog(false)
          setSelectedBlueSheet(null)
        }}
        selectedBlueSheets={selectedBlueSheets}
        blueSheet={selectedBlueSheet}
        onApprovalComplete={handleApprovalComplete}
      />

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve this Blue Sheet?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve this bluesheet?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isApproving} onClick={() => setIsConfirmOpen(false)}>No</AlertDialogCancel>
            <AlertDialogAction disabled={isApproving} onClick={confirmApprove}>Yes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// Export function to get pending approval count for notification system
export const getPendingApprovalCount = (approvals: ApiBlueSheetItem[]): number => {
  return approvals.filter(approval => approval.status === 'pending').length
}