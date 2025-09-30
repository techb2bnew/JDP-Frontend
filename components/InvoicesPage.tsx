'use client'

import { useState, useEffect, useRef } from 'react'
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
  CheckSquare, // Approvals ke liye icon
  Package
} from 'lucide-react'
import { Invoice } from '../types/invoice'
import { invoicesData, customersData, jobsData } from '../data/invoiceData'
import { InvoiceTemplate } from './invoices/InvoiceTemplate'
import { NewInvoiceDialog } from './invoices/NewInvoiceDialog'
import { useRouter } from 'next/navigation';
import { TimesheetsPage } from './TimesheetsPage';
import { InvoiceComparisonPage } from './InvoiceComparisonPage';
import { ApprovalsPage } from './ApprovalsPage';
import { globalApiCall } from '@/utils/globalApiHandler'
import { apiClient } from '@/utils/api'
import { toast } from 'sonner'
import { LoadingSpinner } from './common/LoadingSpinner'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

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

interface Supplier {
  id: number;
  company_name: string;
  contact_person: string;
  supplier_code: string;
  user_id: number;
}

interface Job {
  id: string
  title: string
  type: 'service-based' | 'contract-based'
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled'
  assignedLeadLabor: string[]
  assignedLabor: string[]
  contractor?: string
  customer?: string
  description: string
  createdDate: string
  dueDate: string
  estimatedHours?: number
  actualHours?: number
  estimatedCost?: number
  actualCost?: number
  materials?: string[]
  address: string
  cityZip: string
  phone?: string
  email?: string
  billToAddress?: string
  billToCityZip?: string
  billToPhone?: string
  billToEmail?: string
  sameAsAddress: boolean
  priority: 'low' | 'medium' | 'high' | 'urgent'
  billingStatus?: 'pending' | 'invoiced' | 'paid'
  // Additional fields from API
  customerName?: string
  contractorName?: string
  createdBy?: string
  assignedLeadLaborDetails?: any[]
  assignedLaborDetails?: any[]
  assignedMaterialsDetails?: any[]
  leadLabors?:any[]
}

export function InvoicesPage() {
  const { hasPermission } = usePermissions()
  const [activeTab, setActiveTab] = useState('invoices');
  const [invoices, setInvoices] = useState<Invoice[]>(invoicesData)
  const [invoice, setInvoice] = useState<Invoice[]>(invoicesData)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [pendingApprovalCount, setPendingApprovalCount] = useState(2)
  const [showNewInvoiceDialog, setShowNewInvoiceDialog] = useState(false)
  const [showInvoiceDetailDialog, setShowInvoiceDetailDialog] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([])
  const[customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalInvoices, setTotalInvoices] = useState(1);

  const fetchData = async () => {
    try {
      const response = await globalApiCall(`${apiBaseUrl}/suppliers/getAllSuppliers`, {
        method: 'GET'
      });
      
      return await response.json();
    } catch (error) {
      // Token revocation is automatically handled
      // Only handle other errors here
      if (!(error instanceof Error && error.message?.includes('Session expired'))) {
        console.error('Other error:', error);
      }
    }
  }

  useEffect( () => {
    const loadSuppliers = async () => {
      const data = await fetchData(); 
      console.log("Suppliersss", data.data, data.data.data[0]);
      if (data?.data) {
        setSuppliers(data.data.data);
      }
      console.log('suppiersSet', suppliers);
    };

   loadSuppliers();
   fetchJobs();
   fetchAllCustomers();
  
  }, []);

  useEffect(() => {
    fetchInvoices(page); // ✅ Only call this here
  }, [page]);

  const fetchAllCustomers = async() => {
    try {
      setIsLoading(true)
      const customers = await apiClient.getCustomers()
      console.log('customers', customers);
      setCustomers(customers.data);

    } catch (error) {
      console.error('Error fetching dashboard metrics:', error)
      toast.error('Failed to load Dashboard Metrics')
    }finally {
      setIsLoading(false)
    }
  }

  const fetchJobs = async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.getJobs();

      setJobs(response.data)
      console.log('fetchJobsfetchJobs', response.data);
    } catch (error) {
      console.error('Error fetching jobs:', error)
      toast.error('Failed to fetch jobs')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchInvoices = async (page: number = 1) => {
    try {
      setIsLoading(true);
      const response = await apiClient.getAllEstimates(page);
      const data = response.data;

      setInvoices(data.estimates);          // Current page's invoices
      setTotalPages(data.totalPages);       // Total number of pages
      setTotalInvoices(data.total);  

    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Failed to fetch invoices');
    } finally {
      setIsLoading(false);
    }
  };

 const fetchInvoiceById = async (id: string) => {
  try {
    const response = await apiClient.getEstimateById(id);
    const data = response.data;
    setInvoice(data); // still sets the state if you need it elsewhere
    return data;
  } catch (error) {
    console.error('Error fetching invoice:', error);
    toast.error('Failed to fetch invoice');
    return null;
  }
};


  const formattedDate = (date) =>
    new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
  });


// Result: "Sep 30, 2025"

  const totalBilled = invoices.reduce((sum, invoice) => sum + invoice.total_amount, 0);


  const filteredInvoices = invoices.filter(invoice => {
    const search = searchTerm.toLowerCase();

    const matchesSearch =
      invoice.invoice_number?.toLowerCase().includes(search) ||
      invoice.customer?.customer_name?.toLowerCase().includes(search) ||
      invoice.job?.job_title?.toLowerCase().includes(search);

    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    const matchesType = typeFilter === 'all' || invoice.invoice_type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const invoicesToRender = (
    searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
  ) ? filteredInvoices : invoices;

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

 const handleViewInvoice = async (inv: Invoice) => {
  const data = await fetchInvoiceById(inv.id);
  if (data) {
    setSelectedInvoice(data);
    setIsModalOpen(true);
  }
};


  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedInvoice(null);
  };

  const handleSendInvoice = (invoiceId: string) => {
    setInvoices(prev => prev.map(inv =>
      inv.id === invoiceId ? { ...inv, status: 'sent' as const } : inv
    ))
  }

 const handleDeleteInvoice = async (invoiceId: string) => {
  try {
    setIsLoading(true);

    const response = await apiClient.deleteEstimate(invoiceId); 
    console.log('Invoice delete response:', response);
    toast.success('Invoice deleted successfully');
    fetchInvoices();

  } catch (error) {
    console.error('Error deleting invoice:', error);
    toast.error('Failed to delete invoice');
  } finally {
    setIsLoading(false);
  }
};


  const handleBackToInvoices = () => {
    setActiveTab('invoices')
  }
  const handleApprovalCountChange = (count: number) => {
    setPendingApprovalCount(count)
  }
  const handlePrintInvoice = () => { window.print() }

  const handleDownloadInvoice = (invoice: Invoice) => {
    const doc = new jsPDF();

    // Example: add text to PDF
    doc.text(`Invoice #${invoice.id}`, 10, 10);
    doc.text(`Customer: ${invoice.customerName}`, 10, 20);
    // Add more invoice details here...

    doc.save(`invoice_${invoice.id}.pdf`);
  };

  // const handleDownloadInvoice = async () => {
  //   if (!invoiceRef.current) return;

  //   const element = invoiceRef.current;

  //   // Convert HTML to canvas
  //   const canvas = await html2canvas(element, { scale: 2 });

  //   const imgData = canvas.toDataURL('image/png');

  //   const pdf = new jsPDF('p', 'mm', 'a4');

  //   const imgProps = pdf.getImageProperties(imgData);
  //   const pdfWidth = pdf.internal.pageSize.getWidth();
  //   const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

  //   pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
  //   pdf.save(`invoice_${selectedInvoice?.id || 'download'}.pdf`);
  // };

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
                    {/* <p className="text-2xl font-semibold">{invoices.length}</p> */}
                    <p className="text-2xl font-semibold">{totalInvoices}</p>
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
                    <p className="text-2xl font-semibold text-primary">${totalBilled.toFixed(2)}</p>
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
                        <SelectItem value="proposal_invoice">Proposed</SelectItem>
                        <SelectItem value="estimate">Estimate</SelectItem>
                        <SelectItem value="progressive_invoice">Progressive</SelectItem>
                        <SelectItem value="final_invoice">Final</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Invoices Table */}
                {
                  isLoading ? (
                    <div className="flex justify-center items-center py-12">
                      <LoadingSpinner />
                    </div>
                  ) : invoices.length === 0 ? (
                        // Empty state
                        <div className="text-center py-8">
                          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600 mb-2">No invoices found</p>
                          <Button 
                            variant="outline" 
                            // onClick={() => {setOpen(true); fetchAllCustomers();}}
                            className="gap-2"
                          >
                            <Plus className="h-4 w-4" />
                            Add First Invoice
                          </Button>
                        </div>
                      ) 
                  : <div className="border rounded-lg overflow-hidden">
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
                          {invoicesToRender.map((invoice) => (
                            <TableRow key={invoice.id}>
                              <TableCell className="font-mono">{invoice.invoice_number}</TableCell>
                              <TableCell>{invoice.customer?.customer_name}</TableCell>
                              <TableCell className="max-w-48 truncate">{invoice.job?.job_title}</TableCell>
                              {/* <TableCell >{invoice?.invoice_type}</TableCell> */}
                                <TableCell>
                                <div>
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${invoice.invoice_type === 'estimate' ? 'bg-blue-100 text-blue-800' :
                                    invoice.invoice_type === 'proposal_invoice' ? 'bg-purple-100 text-purple-800' :
                                      invoice.invoice_type === 'progressive_invoice' ? 'bg-orange-100 text-orange-800' :
                                        'bg-green-100 text-green-800'
                                    }`}>
                                    {invoice.invoice_type === 'progressive_invoice'
                                      ? 'Progressive'
                                      : invoice.invoice_type === 'proposal_invoice'
                                      ? 'Proposed'
                                      : invoice.invoice_type === 'final_invoice'
                                      ? 'Final'
                                      : invoice.invoice_type === 'estimate'
                                      ? 'Estimate'
                                      : invoice.invoice_type
                                    }
                                  </span>
                                </div>
                                </TableCell>
                              <TableCell>{formattedDate(invoice?.issue_date)}</TableCell>
                              <TableCell>{formattedDate(invoice?.due_date)}</TableCell>
                              <TableCell className="font-medium">${invoice?.total_amount?.toFixed(2)}</TableCell>
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

                                  {/* Modal */}
                                  <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Invoice Preview</DialogTitle>
                                      </DialogHeader>
                                      {selectedInvoice && <InvoiceTemplate invoice={selectedInvoice} />}
                                    </DialogContent>
                                  </Dialog>

                                  {hasPermission('invoices', 'view') && (
                                    <Button variant="outline" size="icon" onClick={() => handleDownloadInvoice(invoice)}>
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
                   
                }
               
              </CardContent>
               <div className="flex gap-2 mt-4">
                  <Button
                    disabled={page <= 1}
                    onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                  >
                    Previous
                  </Button>

                  <span>Page {page} of {totalPages}</span>

                  <Button
                    disabled={page >= totalPages}
                    onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                  >
                    Next
                  </Button>
                </div>
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
        customers={customers}       
        jobs={jobs}
        suppliers={suppliers}
        onSave={handleSaveInvoice}
        onReload={fetchInvoices}
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
