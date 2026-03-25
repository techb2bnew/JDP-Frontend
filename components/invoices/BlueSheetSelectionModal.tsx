import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Checkbox } from '../ui/checkbox'
import {
    Clock, CheckSquare, X, Building, User,
    ChevronLeft, ChevronRight, Eye, FileText, Upload
} from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog'

interface ApiBlueSheetItem {
    id: number
    job_id: number
    materials_invoiced: boolean
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
        customer?: { id: number; email: string; phone: string; address: string; company_name: string; customer_name: string }
        job_type: string
        priority: string
        job_title: string
        contractor?: { id: number; email: string; phone: string; address: string; company_name: string; contractor_name: string }
        description: string
        bill_to_email: string
        bill_to_phone: string
        bill_to_address: string
        bill_to_city_zip: string
    }
    created_by_user: { id: number; email: string; full_name: string }
    labor_entries: Array<any>
    material_entries: Array<any>
    total_labor_hours: number
    invoice_submitted_at?: string | null
}

interface BlueSheetSelectionModalProps {
    isOpen: boolean
    onClose: () => void
    blueSheets: ApiBlueSheetItem[]
    selectedBlueSheets?: ApiBlueSheetItem[]
    onSubmitSelected: (selectedBlueSheets: ApiBlueSheetItem[]) => void
}

const PAGE_SIZE = 8

export function BlueSheetSelectionModal({
    isOpen,
    onClose,
    blueSheets,
    selectedBlueSheets = [],
    onSubmitSelected,
}: BlueSheetSelectionModalProps) {
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
    const [currentPage, setCurrentPage] = useState(1)
    const [showReinvoiceAlert, setShowReinvoiceAlert] = useState(false)
    const [pendingSubmitSheets, setPendingSubmitSheets] = useState<ApiBlueSheetItem[] | null>(null)
    React.useEffect(() => {
        if (isOpen) { setSelectedIds(new Set()); setCurrentPage(1) } 
    }, [isOpen])
    const totalPages = Math.max(1, Math.ceil(blueSheets.length / PAGE_SIZE))
    const paginated = blueSheets.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
    const allOnPageSelected = paginated.length > 0 && paginated.every(b => selectedIds.has(b.id))
    const someOnPageSelected = paginated.some(b => selectedIds.has(b.id))
    console.log(blueSheets, "blueSheets")
    const toggleItem = (id: number) => setSelectedIds(prev => {
        const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next
    })

    const togglePageAll = () => setSelectedIds(prev => {
        const next = new Set(prev)
        const allSelected = paginated.every(b => next.has(b.id))
        allSelected ? paginated.forEach(b => next.delete(b.id)) : paginated.forEach(b => next.add(b.id))
        return next
    })

    const selectAll = () => setSelectedIds(new Set(blueSheets.map(b => b.id)))
    const clearAll = () => setSelectedIds(new Set())

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount)

    const formatDate = (d: string) => {
        try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }
        catch { return d }
    }

    const getCustomerName = (b: ApiBlueSheetItem) =>
        b.job.customer?.customer_name || b.job.contractor?.contractor_name || 'N/A'

    const getCustomerType = (b: ApiBlueSheetItem) =>
        b.job.customer?.customer_name ? 'Customer' : b.job.contractor?.contractor_name ? 'Contractor' : 'Customer'

    const getStatusBadge = (b: ApiBlueSheetItem) => {
        if (b.materials_invoiced) {
            return <Badge className="bg-purple-50 text-purple-600 border-purple-200 text-xs">
                <CheckSquare className="w-3 h-3 mr-1" />Invoiced
            </Badge>
        }
        const map = {
            pending: <Badge className="bg-yellow-50 text-yellow-600 border-yellow-200 hover:bg-yellow-50 text-xs"><Clock className="w-3 h-3 mr-1" />Pending</Badge>,
            approved: <Badge className="bg-green-50 text-green-600 border-green-200 hover:bg-green-50 text-xs"><CheckSquare className="w-3 h-3 mr-1" />Approved</Badge>,
            rejected: <Badge className="bg-red-50 text-red-600 border-red-200 hover:bg-red-50 text-xs"><X className="w-3 h-3 mr-1" />Rejected</Badge>,
        }
        return map[b.status] ?? <Badge className="text-xs">{b.status}</Badge>
    }

    const selectedTotal = blueSheets.filter(b => selectedIds.has(b.id)).reduce((s, b) => s + b.total_cost, 0)
    const firstSheet = blueSheets[0] ?? null

    const handleSubmit = () => {
        if (selectedIds.size === 0) return
        const selectedSheets = blueSheets.filter(b => selectedIds.has(b.id))
        const hasInvoiced = selectedSheets.some(b => b.materials_invoiced)

        if (hasInvoiced) {
            setPendingSubmitSheets(selectedSheets)
            setShowReinvoiceAlert(true)
            return
        }

        onSubmitSelected(selectedSheets)
    };

    

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-full sm:max-w-[70%] w-full p-0 gap-0 overflow-hidden rounded-xl">

                {/* Header */}
                <DialogHeader className="bg-[#00A1FF] px-6 py-4 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-[#fff]  flex items-center justify-center">
                                <FileText className="h-5 w-5 text-[#000]" />
                            </div>
                            <div>
                                <DialogTitle className="text-white text-lg font-semibold">
                                    {firstSheet ? `BluSheets — ${firstSheet.job.job_title}` : 'Select BluSheets'}
                                </DialogTitle>
                                <div className="flex items-center gap-3 mt-0.5">
                                    {firstSheet && (
                                        <>
                                            <span className="text-white text-xs">Job #{firstSheet.job_id}</span>
                                            <span className="text-white text-xs">•</span>
                                            <span className="text-white text-xs">
                                                {firstSheet.job.customer?.customer_name || firstSheet.job.contractor?.contractor_name || ''}
                                            </span>
                                            <span className="text-white/30 text-xs">•</span>
                                        </>
                                    )}
                                    <span className="text-white  text-xs">{blueSheets.length} bluesheet{blueSheets.length !== 1 ? 's' : ''}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                {/* Toolbar */}
                <div className="px-6 py-3 flex items-center justify-between border-b bg-white flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500">
                            {selectedIds.size} of {blueSheets.length} selected
                        </span>
                        {selectedIds.size > 0 && (
                            <>
                                <Badge className="bg-[#E6F6FF] text-[#00A1FF] border-[#00A1FF]/20 text-xs">
                                    {selectedIds.size} selected
                                </Badge>
                                <span className="text-sm font-semibold text-[#00A1FF]">
                                    Total: {formatCurrency(selectedTotal)}
                                </span>
                            </>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={selectAll}
                            className="text-xs h-7 px-3 text-[#00A1FF] border-[#00A1FF]/30 hover:bg-[#E6F6FF]">
                            Select All
                        </Button>
                        {selectedIds.size > 0 && (
                            <Button size="sm" variant="outline" onClick={clearAll}
                                className="text-xs h-7 px-3 text-gray-500 hover:bg-gray-50">
                                Clear
                            </Button>
                        )}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-auto" style={{ maxHeight: '440px' }}>
                    {blueSheets.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                            <FileText className="h-10 w-10 mb-3 opacity-30" />
                            <p className="text-sm">No bluesheets found</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-[#162f3d] hover:bg-[#162f3d] sticky top-0 z-10">
                                    <TableHead className="w-12 pl-5">
                                        <Checkbox
                                            checked={allOnPageSelected}
                                            ref={(el) => { if (el) (el as any).indeterminate = someOnPageSelected && !allOnPageSelected }}
                                            onCheckedChange={togglePageAll}
                                            className="border-white/40 data-[state=checked]:bg-[#00A1FF] data-[state=checked]:border-[#00A1FF]"
                                        />
                                    </TableHead>
                                    <TableHead className="text-white font-medium">Customer/Contractor</TableHead>
                                    <TableHead className="text-white font-medium">Job Details</TableHead>
                                    <TableHead className="text-white font-medium">Submitted By</TableHead>
                                    <TableHead className="text-white font-medium">Date</TableHead>
                                    <TableHead className="text-white font-medium">Amount</TableHead>
                                    <TableHead className="text-white font-medium">Invoice Submitted</TableHead>
                                    <TableHead className="text-white font-medium">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginated.map((blueSheet, index) => {
                                    const isSelected = selectedIds.has(blueSheet.id)
                                    return (
                                        <TableRow
                                            key={blueSheet.id}
                                            onClick={() => toggleItem(blueSheet.id)}
                                            className={`transition-colors ${isSelected
                                                ? 'bg-[#E6F6FF] hover:bg-[#d4eeff] cursor-pointer'
                                                : index % 2 === 1
                                                    ? 'bg-[#eff4fa] hover:bg-[#e2ecf7] cursor-pointer'
                                                    : 'hover:bg-[#f8fafc] cursor-pointer'
                                            }`}
                                        >
                                            <TableCell className="pl-5" onClick={e => e.stopPropagation()}>
                                                <Checkbox
                                                    checked={isSelected}
                                                    onCheckedChange={() => toggleItem(blueSheet.id)}
                                                    className="border-gray-300 data-[state=checked]:bg-[#00A1FF] data-[state=checked]:border-[#00A1FF]"
                                                />
                                            </TableCell>

                                            <TableCell>
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <Building className="h-4 w-4 text-[#00A1FF] flex-shrink-0" />
                                                        <div>
                                                            <div className="font-medium text-sm text-[#00A1FF]">{getCustomerName(blueSheet)}</div>
                                                            <div className="text-xs text-gray-500">{getCustomerType(blueSheet)}</div>
                                                        </div>
                                                    </div>
                                                    {blueSheet.job.contractor && blueSheet.job.customer && (
                                                        <div className="flex items-center gap-2 pl-6">
                                                            <User className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                                                            <div>
                                                                <div className="font-medium text-xs text-gray-700">{blueSheet.job.contractor.contractor_name}</div>
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
                                                    {blueSheet.notes && (
                                                        <div className="text-xs text-gray-400 mt-1 max-w-[180px] truncate">{blueSheet.notes}</div>
                                                    )}
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                                    <span className="font-medium text-sm">{blueSheet.created_by_user.full_name}</span>
                                                </div>
                                            </TableCell>

                                            <TableCell className="text-sm text-gray-600">{formatDate(blueSheet.date)}</TableCell>

                                            <TableCell>
                                                <span className={`font-semibold text-sm ${isSelected ? 'text-[#00A1FF]' : ''}`}>
                                                    {formatCurrency(blueSheet.total_cost)}
                                                </span>
                                            </TableCell>

                                            <TableCell>
                                            {blueSheet.invoice_submitted_at ? formatDate(blueSheet.invoice_submitted_at) : 'N/A'}
                                            </TableCell>

                                            <TableCell className="pr-5">{getStatusBadge(blueSheet)}</TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-6 py-3 border-t bg-white flex items-center justify-between flex-shrink-0">
                        <span className="text-gray-500 text-xs">
                            Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, blueSheets.length)} of {blueSheets.length}
                        </span>
                        <div className="flex items-center gap-1.5">
                            <Button size="sm" variant="outline" onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1} className="h-7 w-7 p-0">
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pg => (
                                <button key={pg} onClick={() => setCurrentPage(pg)}
                                    className={`h-7 w-7 rounded text-xs font-medium transition-colors ${pg === currentPage ? 'bg-[#00A1FF] text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                                    {pg}
                                </button>
                            ))}
                            <Button size="sm" variant="outline" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages} className="h-7 w-7 p-0">
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Selected Summary Strip */}
                {selectedIds.size > 0 && (
                    <div className="px-6 py-2 bg-[#E6F6FF] border-t border-[#00A1FF]/20 flex-shrink-0">
                        <div className="flex flex-wrap gap-x-4 gap-y-1">
                            {blueSheets.filter(b => selectedIds.has(b.id)).map(b => (
                                <span key={b.id} className="text-[#00A1FF] text-xs flex items-center gap-1">
                                    <CheckSquare className="h-3 w-3" />
                                    {b.job.job_title} — BS-{b.id}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="px-6 py-4 border-t bg-white flex items-center justify-between flex-shrink-0">
                    <Button variant="outline" onClick={onClose} className="gap-2">
                        <X className="h-4 w-4" />Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={selectedIds.size === 0}
                        className="bg-[#00A1FF] hover:bg-[#0090e6] text-white gap-2 min-w-[180px]"
                    >
                        <CheckSquare className="h-4 w-4" />
                          Submit
                        {selectedIds.size > 0 && (
                            <Badge className="bg-white/20 text-white border-0 text-xs ml-1 h-5 px-1.5">
                                {selectedIds.size}
                            </Badge>
                        )}
                    </Button>
                </div>

                <AlertDialog open={showReinvoiceAlert} onOpenChange={setShowReinvoiceAlert}>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Invoice already submitted</AlertDialogTitle>
                      <AlertDialogDescription>
                      One or more selected BlueSheets are already marked as invoiced. Are you sure you
                      want to review and invoice these BlueSheets again?
                        {pendingSubmitSheets && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {pendingSubmitSheets
                              .filter(b => b.materials_invoiced)
                              .map(b => (
                                <Badge
                                  key={b.id}
                                  variant="outline"
                                  className="text-xs bg-purple-50 text-purple-700 border-purple-200"
                                >
                                  BS-{b.id} — {b.job.job_title}
                                </Badge>
                              ))}
                          </div>
                        )}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel
                        onClick={() => {
                          setShowReinvoiceAlert(false)
                          setPendingSubmitSheets(null)
                        }}
                      >
                        No
                      </AlertDialogCancel>
                      <AlertDialogAction
                      className="bg-primary text-white hover:bg-primary/90"
                        onClick={() => {
                          if (pendingSubmitSheets && pendingSubmitSheets.length > 0) {
                            onSubmitSelected(pendingSubmitSheets)
                          }
                          setShowReinvoiceAlert(false)
                          setPendingSubmitSheets(null)
                        }}
                      >
                        Yes
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

            </DialogContent>
        </Dialog>


    )
}
