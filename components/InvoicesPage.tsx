'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs' // Tabs components import karein
import { usePermissions } from '../contexts/PermissionContext'
import {
  Plus,
  Search,
  Download,
  Send,
  Eye,
  Trash2,
  Receipt,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Printer,
  Mail,
  Clock, // Timesheets ke liye icon
  GitCompare, // Invoice Comparison ke liye icon
  CheckSquare // Approvals ke liye icon
} from 'lucide-react'
import { Invoice } from '../types/invoice'
import { invoicesData, customersData, jobsData } from '../data/invoiceData'
import { InvoiceTemplate } from './invoices/InvoiceTemplate'
import { NewInvoiceDialog } from './invoices/NewInvoiceDialog'
import { useRouter } from 'next/navigation';
import { TimesheetsPage } from './TimesheetsPage';
import { InvoiceComparisonPage } from './InvoiceComparisonPage';
import { ApprovalsPage } from './ApprovalsPage';
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

const mockJobs: Job[] = [
  {
    id: 'JOB-2025-001',
    title: 'Electrical Panel Installation',
    type: 'service-based',
    status: 'in-progress',
    assignedLabor: ['John Smith', 'David Wilson'],
    contractor: 'Elite Electrical Services',
    customer: 'ABC Corporation',
    description: 'Install new electrical panel and upgrade wiring system',
    createdDate: '2025-01-15',
    dueDate: '2025-01-30',
    estimatedHours: 40,
    actualHours: 25,
    estimatedCost: 5000,
    actualCost: 3200,
    materials: ['Electrical Panel', 'Copper Wire', 'Circuit Breakers'],
    location: '123 Business Ave, New York',
    priority: 'high',
    billingStatus: 'pending'
  },
  {
    id: 'JOB-2025-002',
    title: 'Office Lighting Maintenance',
    type: 'contract-based',
    status: 'pending',
    assignedLabor: ['Sarah Johnson'],
    contractor: 'Bright Solutions Ltd',
    customer: 'XYZ Office Complex',
    description: 'Monthly maintenance of office lighting systems',
    createdDate: '2025-01-18',
    dueDate: '2025-02-15',
    estimatedHours: 16,
    estimatedCost: 1200,
    materials: ['LED Bulbs', 'Ballasts'],
    location: '456 Corporate Blvd, New York',
    priority: 'medium',
    billingStatus: 'pending'
  }
]

export function InvoicesPage() {
  const { hasPermission } = usePermissions()
  const [activeTab, setActiveTab] = useState('invoices');
  const [invoices, setInvoices] = useState<Invoice[]>(invoicesData)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [pendingApprovalCount, setPendingApprovalCount] = useState(2)
  const [showNewInvoiceDialog, setShowNewInvoiceDialog] = useState(false)
  const [showInvoiceDetailDialog, setShowInvoiceDetailDialog] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const router = useRouter();

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.jobTitle.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter
    const matchesType = typeFilter === 'all' || invoice.type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  const handleSaveInvoice = (newInvoiceData: Partial<Invoice>) => {
    const subtotal =
      (newInvoiceData.items?.reduce((sum, item) => sum + item.total, 0) || 0) +
      (newInvoiceData.labor?.reduce((sum, labor) => sum + labor.total, 0) || 0) +
      (newInvoiceData.additionalCosts?.reduce((sum, cost) => sum + cost.amount, 0) || 0)
    const taxAmount = subtotal * (newInvoiceData.taxRate || 0)
    const totalAmount = subtotal + taxAmount
    const invoice: Invoice = {
      ...newInvoiceData as Invoice,
      id: `INV-${Date.now()}`,
      invoiceNumber: `INV-2025-${String(invoices.length + 1).padStart(3, '0')}`,
      customerName: customersData.find(c => c.id === newInvoiceData.customerId)?.name || '',
      jobTitle: jobsData.find(j => j.id === newInvoiceData.jobId)?.title || '',
      subtotal,
      taxAmount,
      totalAmount,
      status: 'draft',
      createdBy: 'Admin User',
      createdAt: new Date().toISOString()
    }
    setInvoices(prev => [invoice, ...prev])
  }

  const handleViewInvoice = (invoice: Invoice) => {
    localStorage.setItem('selectedInvoice', JSON.stringify(invoice));
    router.push(`/invoiceDetail?id=${invoice.id}`);
  }

  const handleSendInvoice = (invoiceId: string) => {
    setInvoices(prev => prev.map(inv =>
      inv.id === invoiceId ? { ...inv, status: 'sent' as const } : inv
    ))
  }

  const handleDeleteInvoice = (invoiceId: string) => {
    setInvoices(prev => prev.filter(inv => inv.id !== invoiceId))
  }
  const handleBackToInvoices = () => {
    setActiveTab('invoices')
  }
  const handleApprovalCountChange = (count: number) => {
    setPendingApprovalCount(count)
  }
  const handlePrintInvoice = () => { window.print() }
  const handleDownloadInvoice = () => { console.log('Downloading invoice as PDF...') }
  const handleEmailInvoice = () => { console.log('Sending invoice via email...') }

  const tabItems = [
    { id: 'invoices', label: 'Invoices', icon: Receipt },
    { id: 'timesheets', label: 'Timesheets', icon: Clock },
    { id: 'invoice-comparison', label: 'Invoice Comparison', icon: GitCompare },
    { id: 'approvals', label: 'Approvals', icon: CheckSquare, notification: 2 },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Invoices & Billing</h1>
          <p className="text-muted-foreground">Manage invoices, track timesheets, compare estimates, and handle approvals</p>
        </div>
        {hasPermission('invoices', 'create') && (
          <Button
            onClick={() => setShowNewInvoiceDialog(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Invoice
          </Button>
        )}
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-gray-100 p-1 h-auto">
          {tabItems.map((item) => {
            const Icon = item.icon
            return (
              <TabsTrigger
                key={item.id}
                value={item.id}
                className="flex items-center justify-center gap-2 text-muted-foreground data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-md px-3 py-2"
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
                {item.notification && (
                  <span className="bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {item.notification}
                  </span>
                )}
              </TabsTrigger>
            )
          })}
        </TabsList>

        {/* Invoices Tab Content */}
        <TabsContent value="invoices" className="mt-6">
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Invoices</p>
                    <p className="text-2xl font-semibold">{invoices.length}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Receipt className="h-6 w-6 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Billed</p>
                    <p className="text-2xl font-semibold text-primary">$4,480.92</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Paid Invoices</p>
                    <p className="text-2xl font-semibold text-green-600">{invoices.filter(inv => inv.status === 'paid').length}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending</p>
                    <p className="text-2xl font-semibold text-orange-600">{invoices.filter(inv => inv.status === 'sent' || inv.status === 'overdue').length}</p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <AlertCircle className="h-6 w-6 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters and Search */}
            <Card>
              <CardHeader>
                <CardTitle>Invoice Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex-1 min-w-[300px]">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Search by invoice #, customer, or job..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-auto min-w-[150px]">
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger className="w-auto min-w-[150px]">
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="proposed">Proposed</SelectItem>
                        <SelectItem value="roughen">Roughen</SelectItem>
                        <SelectItem value="progressive">Progressive</SelectItem>
                        <SelectItem value="final">Final</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Invoices Table */}
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Job</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Issue Date</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInvoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-mono">{invoice.invoiceNumber}</TableCell>
                          <TableCell>{invoice.customerName}</TableCell>
                          <TableCell className="max-w-48 truncate">{invoice.jobTitle}</TableCell>
                          <TableCell>{invoice.type}</TableCell>
                          <TableCell>{new Date(invoice.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>{new Date(invoice.dueDate).toLocaleDateString()}</TableCell>
                          <TableCell className="font-medium">${invoice.totalAmount.toFixed(2)}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                                invoice.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                                  invoice.status === 'overdue' ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'
                              }`}>
                              {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-2">
                              {hasPermission('invoices', 'view') && (
                                <Button variant="outline" size="icon" onClick={() => handleViewInvoice(invoice)}>
                                  <Eye className="w-4 h-4" />
                                </Button>
                              )}
                              {hasPermission('invoices', 'view') && (
                                <Button variant="outline" size="icon" onClick={() => handleDownloadInvoice()}>
                                  <Download className="w-4 h-4" />
                                </Button>
                              )}
                              {hasPermission('invoices', 'delete') && (
                                <Button variant="outline" size="icon" onClick={() => handleDeleteInvoice(invoice.id)}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Other Tabs Content */}
        <TabsContent value="timesheets"><TimesheetsPage /></TabsContent>
        <TabsContent value="invoice-comparison"><InvoiceComparisonPage
          onBack={handleBackToInvoices}
          jobs={mockJobs} /></TabsContent>
        <TabsContent value="approvals">
          <ApprovalsPage
            onBack={handleBackToInvoices}
            jobs={mockJobs}
            onApprovalCountChange={handleApprovalCountChange}
          /></TabsContent>
      </Tabs>

      {/* Dialogs */}
      <NewInvoiceDialog
        open={showNewInvoiceDialog}
        onOpenChange={setShowNewInvoiceDialog}
        onSave={handleSaveInvoice}
      />
      <Dialog open={showInvoiceDetailDialog} onOpenChange={setShowInvoiceDetailDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              Invoice Preview
            </DialogTitle>
            <DialogDescription>
              Invoice details for {selectedInvoice?.invoiceNumber}
            </DialogDescription>
          </DialogHeader>
          {selectedInvoice && <InvoiceTemplate invoice={selectedInvoice} />}
          <DialogFooter className="flex gap-2">
            {hasPermission('invoices', 'view') && (
              <Button variant="outline" onClick={handlePrintInvoice}><Printer className="h-4 w-4 mr-2" />Print</Button>
            )}
            {hasPermission('invoices', 'view') && (
              <Button variant="outline" onClick={handleDownloadInvoice}><Download className="h-4 w-4 mr-2" />Download PDF</Button>
            )}
            {hasPermission('invoices', 'edit') && (
              <Button onClick={handleEmailInvoice} className="bg-primary text-primary-foreground hover:bg-primary/90"><Mail className="h-4 w-4 mr-2" />Send to Customer</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
