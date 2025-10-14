'use client'

import { useState, useEffect, useRef } from 'react'
import { apiClient } from '../utils/api'
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
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { useDispatch } from 'react-redux'
import { deleteInvoice } from '@/redux/slices/jobsSlice'
import { toast } from 'sonner'
import { LoadingSpinner } from './common/LoadingSpinner'
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

interface Estimate {
  id: number
  invoice_number: string
  estimate_title: string
  customer_id: string
  job_id: number
  job?: {
    id: number
    job_type: string
    job_title: string
  }
  customer?: {
    customer_name: string
    id: number
  }
  items?: any[]
  labor?: any[]
  additionalCosts?: any[]
  subtotal?: number
  tax_percentage?: number
  tax_amount?: number
  total_amount?: number
  description?: string
  status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  invoice_type?: 'proposal_invoice' | 'roughen' | 'progressive_invoice' | 'final_invoice' |'estimate' |'down_payment'
  issue_date?: string
  due_date?: string
  created_by?: string
  created_at?: string
}
type DashboardCards = {
  total_invoices: { value: number }
  total_billed: { value: string | number }
  paid_invoices: { value: number }
  pending_invoices: { value: number }
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
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [pendingApprovalCount, setPendingApprovalCount] = useState(2)
  const [showNewInvoiceDialog, setShowNewInvoiceDialog] = useState(false)
  const [showInvoiceDetailDialog, setShowInvoiceDetailDialog] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [isLoadingEstimates, setIsLoadingEstimates] = useState(false);
  const [estimates, setEstimates] = useState<Estimate[]>([])
  const [localJobs, setLocalJobs] = useState([]);
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [loadingInvoice, setLoadingInvoice] = useState(false)
  const [errorInvoice, setErrorInvoice] = useState<string | null>(null)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [refreshInvoices, setRefreshInvoices] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [dashboardCards, setDashboardCards] = useState<DashboardCards | null>(null)
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
  const [detailedStats, setDetailedStats] = useState(null);
  const [totalProducts, setTotalProducts] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalEstimates, setTotalEstimates] = useState(0);
  const [invoiceTypeFilter, setInvoiceTypeFilter] = useState('');

  const dispatch = useDispatch();
  const router = useRouter();

  // const filteredInvoices = invoices.filter(invoice => {
  //   const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //     invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //     invoice.jobTitle.toLowerCase().includes(searchTerm.toLowerCase())
  //   const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter
  //   const matchesType = typeFilter === 'all' || invoice.type === typeFilter
  //   return matchesSearch && matchesStatus && matchesType
  // })

  // console.log(invoice, "newfilter")

  const handleSaveInvoice = (newInvoiceData: Partial<Invoice>) => {
    const subtotal =
      (newInvoiceData.items?.reduce((sum, item) => sum + item.total_cost, 0) || 0) +
      (newInvoiceData.labor?.reduce((sum, labor) => sum + labor.total_cost, 0) || 0) +
      (newInvoiceData.additionalCosts?.reduce((sum, cost) => sum + cost.amount, 0) || 0)
    const taxAmount = subtotal * (newInvoiceData.taxRate || 0)
    const totalAmount = subtotal + taxAmount
    const invoice: Invoice = {
      ...newInvoiceData as Invoice,
      id: `INV-${Date.now()}`,
      invoiceNumber: `INV-2025-${String(invoices.length + 1).padStart(3, '0')}`,
      customerName: customersData.find(c => c.id === newInvoiceData.customerId)?.name || '',
      jobTitle: jobsData.find(j => j.id === String(newInvoiceData.jobId))?.title || '',

      subtotal,
      taxAmount,
      totalAmount,
      status: 'draft',
      createdBy: 'Admin User',
      createdAt: new Date().toISOString()
    }
    setInvoices(prev => [invoice, ...prev])
  }

  // const handleViewInvoice = (invoice: Invoice) => {
  //   localStorage.setItem('selectedInvoice', JSON.stringify(invoice));
  //   router.push(`/invoiceDetail?id=${invoice.id}`);
  // }





  const handleViewInvoice = (invoiceId: number) => {
    router.push(`/invoiceDetail?id=${invoiceId}`)
  }



  const handleDownloadInvoice = async () => {
    console.log("1")
    if (!printRef.current) return;
    console.log("2")

    setIsGeneratingPdf(true);
    try {
      // Add temporary class to ensure proper rendering
      printRef.current.classList.add('pdf-export');

      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        logging: false,
        useCORS: true,
        backgroundColor: '#ffffff',
        ignoreElements: (element) => {
          return element.classList.contains('no-export');
        }
      });


      printRef.current.classList.remove('pdf-export');

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`invoice_${invoice?.invoiceNumber || 'unknown'}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDeleteInvoice = async (invoiceId: string | number) => {
    try {
      const confirmDelete = window.confirm("Are you sure you want to delete this estimate?");
      if (!confirmDelete) return;
      setIsDeleting(true);
      await apiClient.deleteEstimate(String(invoiceId));
      console.log(invoiceId, "IDD")
      dispatch(deleteInvoice(String(invoiceId)));
      toast.success("Estimate deleted successfully!");
      setRefreshInvoices(prev => !prev);
    } catch (error) {
      console.error("Error deleting estimate:", error);
      toast.error("Failed to delete estimate");
    } finally {
      setIsDeleting(false);
    }
  };



  const handleSendInvoice = (invoiceId: string) => {
    setInvoices(prev => prev.map(inv =>
      inv.id === invoiceId ? { ...inv, status: 'sent' as const } : inv
    ))
  }

  // const handleDeleteInvoice = (invoiceId: string) => {
  //   setInvoices(prev => prev.filter(inv => inv.id !== invoiceId))
  // }
  const handleBackToInvoices = () => {
    setActiveTab('invoices')
  }
  const handleApprovalCountChange = (count: number) => {
    setPendingApprovalCount(count)
  }
  const handlePrintInvoice = () => { window.print() }
  // const handleDownloadInvoice = () => { console.log('Downloading invoice as PDF...') }
  const handleEmailInvoice = () => { console.log('Sending invoice via email...') }

  const tabItems = [
    { id: 'invoices', label: 'Invoices', icon: Receipt },
    { id: 'timesheets', label: 'Timesheets', icon: Clock },
    { id: 'invoice-comparison', label: 'Invoice Comparison', icon: GitCompare },
    { id: 'approvals', label: 'Approvals', icon: CheckSquare, notification: 2 },
  ]

  useEffect(() => {
    fetchEstimates();
  }, [currentPage]);
  
  const fetchEstimates = async () => {
      setIsLoadingEstimates(true);
      try {
        const response = await apiClient.getAllEstimates(currentPage, itemsPerPage);
        console.log('API Response:', response);
        setEstimates(response.data.estimates || []);
        setTotalEstimates(response.data.total || 0);
        console.log("API Estimates:", response.data.estimates);
      } catch (error) {
        console.error('Failed to fetch estimates:', error);
      } finally {
        setIsLoadingEstimates(false);
      }
    };


 useEffect(() => {
  const fetchEstimateStats = async () => {
    setIsLoadingDashboard(true);
    try {
      const response = await apiClient.getEstimateStats();
      console.log('estimatestas:', response);
      const dashboardCards = response.data.dashboard_cards;
      const detailedStats = response.data.detailed_stats;
      setDashboardCards(dashboardCards);
      setDetailedStats(detailedStats);
    } catch (error) {
      console.error('Failed to fetch estimate stats:', error);
    } finally {
      setIsLoadingDashboard(false);
    }
  };
  fetchEstimateStats();
}, []);




  // const filteredEstimates = estimates.filter((invoice: Estimate) => {
  //   const term = searchTerm.toLowerCase();

  //   const matchesSearch =
  //     invoice.invoice_number?.toLowerCase().includes(term) ||
  //     invoice.customer?.customer_name?.toLowerCase().includes(term) ||
  //     invoice.job?.job_title?.toLowerCase().includes(term);

  //   const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
  //   const matchesType = typeFilter === 'all' || invoice.invoice_type === typeFilter;

  //   return matchesSearch && matchesStatus && matchesType;
  // });



  // console.log(filteredEstimates, "filterrrr")



  useEffect(() => {
    if (!showInvoiceDetailDialog || !selectedId) return

    const fetchById = async () => {
      setLoadingInvoice(true)
      try {
        const res = await apiClient.getEstimateById(selectedId)
        const data = (res?.data && (res.data.estimate || res.data)) || res
        setSelectedInvoice(data)
      } catch (e) {
        console.error('Failed to fetch estimate by id:', e)
        setErrorInvoice('Failed to load invoice')
      } finally {
        setLoadingInvoice(false)
      }
    }

    fetchById()
  }, [showInvoiceDetailDialog, selectedId])

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await apiClient.getJobs();
        setLocalJobs(res.data || []);
      } catch (err) {
        console.error("Error fetching jobs:", err);
      }
    };

    fetchJobs();
  }, []);


const fetchBySearchEstimates = async () => {
  if (!searchTerm.trim()) return;

  setIsLoadingEstimates(true);

  try {
    const response = await apiClient.searchEstimatesByQuery(searchTerm.trim(), 1, 10);
    const estimates = response.data?.estimates || [];
    console.log(estimates,'filteressss')

    const transformedEstimates = estimates.map((estimate: any) => ({
  id: estimate.id?.toString(),
  estimate_title: estimate.estimate_title || 'Untitled',
  invoice_number: estimate.invoice_number || 'N/A',
  status: estimate.status || 'N/A',
  priority: estimate.priority || 'N/A',
  issue_date: estimate.issue_date || 'N/A',
  due_date: estimate.due_date || 'N/A',
  total_amount: estimate.total_amount ?? 0,
  email_address: estimate.email_address || '',
  location: estimate.location || '',
  invoice_type: estimate.invoice_type || '',
  description: estimate.description || '',
  customer: estimate.customer
    ? {
        customer_name: estimate.customer.customer_name || 'Unknown',
        email: estimate.customer.email || '',
        phone: estimate.customer.phone || '',
        company_name: estimate.customer.company_name || '',
      }
    : {
        name: 'Unknown',
        email: '',
        phone: '',
        company: '',
      },
  job: estimate.job
    ? {
        id: estimate.job.id?.toString() || '',
        job_title: estimate.job.job_title || '',
        job_type: estimate.job.job_type || '',
        status: estimate.job.status || '',
      }
    : {
        id: '',
        title: '',
        type: '',
        status: '',
      },
}));


    setEstimates(transformedEstimates);
    setTotalEstimates(transformedEstimates.length);
  } catch (err) {
    console.error('Estimate search error:', err);
    setEstimates([]);
  } finally {
    setIsLoadingEstimates(false);
  }
};

useEffect(() => { 
  const debounceTimeout = setTimeout(() => {
    if (!searchTerm.trim()) {
      fetchEstimates();
    } else {
      setCurrentPage(1); // Reset to first page when searching
      fetchBySearchEstimates(); 
    }
  }, 500); 

  return () => clearTimeout(debounceTimeout);
}, [searchTerm]);


useEffect(() => {
  const fetchEstimatesByFilters = async () => {
    if (searchTerm.trim()) return;

    setIsLoadingEstimates(true);
    setCurrentPage(1); // Reset to first page when filters change

    try {
      let estimates: any[] = [];

      const hasStatus = statusFilter !== '';
      const hasInvoiceType = invoiceTypeFilter !== '';
      if (hasStatus && hasInvoiceType) {
        const [statusRes, typeRes] = await Promise.all([
          apiClient.searchEstimatesByStatus(statusFilter),
          apiClient.searchEstimatesByInvoiceType(invoiceTypeFilter),
        ]);

        const statusEstimates = statusRes?.data?.estimates || [];
        const typeEstimates = typeRes?.data?.estimates || [];
        estimates = statusEstimates.filter((statusEstimate:any) =>
          typeEstimates.some((typeEstimate:any) => typeEstimate.id === statusEstimate.id)
        );
      }
      else if (hasStatus) {
        const res = await apiClient.searchEstimatesByStatus(statusFilter);
        estimates = res?.data?.estimates || [];
      }
      else if (hasInvoiceType) {
        const res = await apiClient.searchEstimatesByInvoiceType(invoiceTypeFilter);
        estimates = res?.data?.estimates || [];
      }
      else {
        // No filters applied, fetch with pagination
        const res = await apiClient.getAllEstimates(1, itemsPerPage);
        estimates = res?.data?.estimates || [];
        setTotalEstimates(res?.data?.total || 0);
        setEstimates(estimates);
        setIsLoadingEstimates(false);
        return;
      }

      setEstimates(estimates);
      setTotalEstimates(estimates.length);
    } catch (error) {
      console.error("Estimate filter error:", error);
      setEstimates([]);
    } finally {
      setIsLoadingEstimates(false);
    }
  };

  fetchEstimatesByFilters();
}, [statusFilter, invoiceTypeFilter, searchTerm]);









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

        <TabsContent value="invoices" className="mt-6">

          <div className="space-y-6">
           {(isLoadingDashboard || dashboardCards) && (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
    <Card>
      <CardContent className="p-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Total Invoices</p>
          {isLoadingDashboard ? (
            <div className="flex items-center h-8">
              <LoadingSpinner />
            </div>
          ) : (
            <p className="text-2xl font-semibold">
              {dashboardCards?.total_invoices?.value ?? 0}
            </p>
          )}
        </div>
        <div className="p-3 bg-blue-100 rounded-lg">
          <Receipt className="h-6 w-6 text-blue-600" />
        </div>
      </CardContent>
    </Card>

    {/* Total Billed */}
    <Card>
      <CardContent className="p-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Total Billed</p>
          {isLoadingDashboard ? (
            <div className="flex items-center h-8">
              <LoadingSpinner />
            </div>
          ) : (
            <p className="text-2xl font-semibold text-primary">
              {typeof dashboardCards?.total_billed?.value === "number"
                ? `$${dashboardCards.total_billed.value.toFixed(2)}`
                : (dashboardCards?.total_billed?.value ?? 0)}
            </p>
          )}
        </div>
        <div className="p-3 bg-green-100 rounded-lg">
          <DollarSign className="h-6 w-6 text-green-600" />
        </div>
      </CardContent>
    </Card>

    {/* Paid Invoices */}
    <Card>
      <CardContent className="p-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Paid Invoices</p>
          {isLoadingDashboard ? (
            <div className="flex items-center h-8">
              <LoadingSpinner />
            </div>
          ) : (
            <p className="text-2xl font-semibold text-green-600">
              {dashboardCards?.paid_invoices?.value ?? 0}
            </p>
          )}
        </div>
        <div className="p-3 bg-green-100 rounded-lg">
          <CheckCircle className="h-6 w-6 text-green-600" />
        </div>
      </CardContent>
    </Card>

    {/* Pending */}
    <Card>
      <CardContent className="p-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Pending</p>
          {isLoadingDashboard ? (
            <div className="flex items-center h-8">
              <LoadingSpinner />
            </div>
          ) : (
            <p className="text-2xl font-semibold text-orange-600">
              {dashboardCards?.pending_invoices?.value ?? 0}
            </p>
          )}
        </div>
        <div className="p-3 bg-orange-100 rounded-lg">
          <AlertCircle className="h-6 w-6 text-orange-600" />
        </div>
      </CardContent>
    </Card>
  </div>
)}






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
                    <Select value={invoiceTypeFilter} onValueChange={setInvoiceTypeFilter}>
                      <SelectTrigger className="w-auto min-w-[150px]">
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="proposal_invoice">Proposed</SelectItem>
                        <SelectItem value="estimate">Estimate</SelectItem>
                        <SelectItem value="progressive_invoice">Progressive</SelectItem>
                        <SelectItem value="final_invoice">Final</SelectItem>
                        <SelectItem value="down_payment">Down Payment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Invoices Table */}
               <div className="border rounded-lg overflow-hidden">
  {isLoadingEstimates ? (
    <div className="flex justify-center items-center py-10">
      <LoadingSpinner />
    </div>
  ) : (
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
        {estimates.length > 0 ? (
          estimates.map((invoice: any) => (
            <TableRow key={invoice.id}>
              <TableCell className="font-mono">{invoice.invoice_number}</TableCell>
              <TableCell>{invoice.customer?.customer_name || 'N/A'}</TableCell>
              <TableCell className="max-w-48 truncate">{invoice.job?.job_title || 'N/A'}</TableCell>
              <TableCell>{invoice.invoice_type || 'N/A'}</TableCell>
              <TableCell>{invoice.issue_date ? new Date(invoice.issue_date).toLocaleDateString() : 'N/A'}</TableCell>
              <TableCell>{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A'}</TableCell>
              <TableCell className="font-medium">
                ${Number(invoice.total_amount || 0).toFixed(2)}
              </TableCell>
              <TableCell>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    invoice.status === 'paid'
                      ? 'bg-green-100 text-green-800'
                      : invoice.status === 'sent'
                      ? 'bg-blue-100 text-blue-800'
                      : invoice.status === 'overdue'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {invoice.status?.charAt(0).toUpperCase() + invoice.status?.slice(1)}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-2">
                  {hasPermission('invoices', 'view') && (
                    <Button variant="outline" size="icon" onClick={() => handleViewInvoice(invoice.id)}>
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
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={9} className="text-center py-6 text-muted-foreground">
              No matching invoices found.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )}
</div>
 {/* Pagination Controls */}
{totalEstimates > 0 && (
  <div className="flex items-center justify-between px-4 py-3 border-t">
    <div className="text-sm text-muted-foreground">
      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalEstimates)} of {totalEstimates} invoices
    </div>
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
        disabled={currentPage === 1 || isLoadingEstimates}
      >
        Previous
      </Button>
      <span className="text-sm">
        Page {currentPage} of {Math.ceil(totalEstimates / itemsPerPage) || 1}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setCurrentPage(prev => prev + 1)}
        disabled={currentPage >= Math.ceil(totalEstimates / itemsPerPage) || isLoadingEstimates}
      >
        Next
      </Button>
    </div>
  </div>
)}



       

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
        jobs={localJobs}
        onInvoiceSaved={() => {
          setCurrentPage(1);
          fetchEstimates();
        }}
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

          {selectedInvoice && <InvoiceTemplate />}
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
      <div
        ref={printRef}
        // className="p-6 bg-white border border-black-400 rounded print:p-0 print:bg-white"
        style={{
          margin: '0 auto',
          width: '22cm',
        }}
      ></div>
    </div>

  )
}
