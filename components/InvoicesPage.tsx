'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'
import { 
  Plus,
  Search,
  Download,
  Send,
  Eye,
  Edit,
  Trash2,
  Receipt,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Printer,
  Mail
} from 'lucide-react'
import { Invoice } from '../types/invoice'
import { invoicesData, customersData, jobsData } from '../data/invoiceData' 
import { InvoiceTemplate } from './invoices/InvoiceTemplate'
import { NewInvoiceDialog } from './invoices/NewInvoiceDialog'

export function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>(invoicesData)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [showNewInvoiceDialog, setShowNewInvoiceDialog] = useState(false)
  const [showInvoiceDetailDialog, setShowInvoiceDetailDialog] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)

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
    setSelectedInvoice(invoice)
    setShowInvoiceDetailDialog(true)
  }

  const handleSendInvoice = (invoiceId: string) => {
    setInvoices(prev => prev.map(inv => 
      inv.id === invoiceId ? { ...inv, status: 'sent' as const } : inv
    ))
  }

  const handleDeleteInvoice = (invoiceId: string) => {
    setInvoices(prev => prev.filter(inv => inv.id !== invoiceId))
  }

  const handlePrintInvoice = () => {
    window.print()
  }

  const handleDownloadInvoice = () => {
    console.log('Downloading invoice as PDF...')
  }

  const handleEmailInvoice = () => {
    console.log('Sending invoice via email...')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Invoices</h1>
          <p className="text-muted-foreground">Manage and track all project invoices</p>
        </div>
        <Button 
          onClick={() => setShowNewInvoiceDialog(true)}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Invoice
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Invoices</p>
                <p className="text-2xl font-semibold">{invoices.length}</p>
              </div>
              <Receipt className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Billed</p>
                <p className="text-2xl font-semibold text-primary">
                  {/* {formatCurrency(invoices.reduce((sum, inv) => sum + inv.totalAmount, 0))} */}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Paid Invoices</p>
                <p className="text-2xl font-semibold text-green-600">{invoices.filter(inv => inv.status === 'paid').length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-semibold text-orange-600">{invoices.filter(inv => inv.status === 'sent' || inv.status === 'overdue').length}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-600" />
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
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
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
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Type" />
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

          {/* Invoices Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Job</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-mono">{invoice.invoiceNumber}</TableCell>
                    <TableCell>{invoice.customerName}</TableCell>
                    <TableCell className="max-w-48 truncate">{invoice.jobTitle}</TableCell>
                    <TableCell>sdf</TableCell>
                    <TableCell>435</TableCell>
                    <TableCell>435</TableCell>
                    <TableCell className="font-medium">43543</TableCell>
                    <TableCell>paid</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleViewInvoice(invoice)}>
                          <Eye className="w-3 h-3" />
                        </Button>
                        {invoice.status === 'draft' && (
                          <Button variant="outline" size="sm" onClick={() => handleSendInvoice(invoice.id)}>
                            <Send className="w-3 h-3" />
                          </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={() => handleDownloadInvoice()}>
                          <Download className="w-3 h-3" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteInvoice(invoice.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* New Invoice Dialog */}
      <NewInvoiceDialog 
        open={showNewInvoiceDialog}
        onOpenChange={setShowNewInvoiceDialog}
        onSave={handleSaveInvoice}
      />

      {/* Invoice Detail Dialog */}
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
            <Button variant="outline" onClick={handlePrintInvoice}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" onClick={handleDownloadInvoice}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button onClick={handleEmailInvoice} className="bg-primary hover:bg-primary/90">
              <Mail className="h-4 w-4 mr-2" />
              Send to Customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}