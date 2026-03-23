'use client'

import { useState, useEffect, useRef } from 'react'
import { apiClient } from '../utils/api'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog'
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
  GitCompare, // Invoice Comparison ke liye icon
  CheckSquare // Approvals ke liye icon
} from 'lucide-react'
import { Invoice } from '../types/invoice'
import { invoicesData, customersData, jobsData } from '../data/invoiceData'
import { InvoiceTemplate } from './invoices/InvoiceTemplate'
import { NewInvoiceDialog } from './invoices/NewInvoiceDialog'
import { useRouter } from 'next/navigation';
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
  invoice_type?: 'proposal_invoice' | 'roughen' | 'progressive_invoice' | 'final_invoice' | 'estimate' | 'down_payment'
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
  const [showViewInvoiceDialog, setShowViewInvoiceDialog] = useState(false)
  const [selectedInvoiceData, setSelectedInvoiceData] = useState<any>(null)
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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | number | null>(null);

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





  const handleViewInvoice = async (invoice: any) => {
    try {
      // Fetch detailed estimate data
      const response = await apiClient.getEstimateById(invoice.id)
      if (response.success) {
        console.log('Setting customer data:', {
          customer_name: response.data?.customer?.customer_name,
          address: response.data?.customer?.address
        });

        const customerName = response.data?.customer?.customer_name || 'No customer name';
        const customerAddress = response.data?.customer?.address || 'No address available';
        const project = response.data?.estimate_title || 'No project name';


        // Set the data with processed values
        // Extract customer_id or contractor_id from API response
        const customerId = response.data.customer_id || 
                           response.data.customer?.id || 
                           (typeof response.data.customer === 'number' ? response.data.customer : null);
        const contractorId = response.data.contractor_id || 
                             response.data.contractor?.id || 
                             (typeof response.data.contractor === 'number' ? response.data.contractor : null);
        const isContractBased = response.data.service_type === 'contract_based' || 
                                response.data.job?.job_type === 'contract_based';
        
        const processedData = {
          ...response.data,
          customer_id: customerId,
          contractor_id: contractorId,
          customer: {
            ...response.data.customer,
            id: response.data.customer?.id || response.data.customer_id || (typeof response.data.customer === 'number' ? response.data.customer : null),
            customer_name: customerName,
            address: customerAddress
          },
          estimate_title: project
        };
        
        console.log('Processed invoice data with IDs:', {
          customer_id: processedData.customer_id,
          contractor_id: processedData.contractor_id,
          isContractBased: isContractBased,
          customer: processedData.customer
        });

        setSelectedInvoiceData(processedData)
        setShowViewInvoiceDialog(true)
      } else {
        toast.error('Failed to load invoice details')
      }
    } catch (error) {
      console.error('Error fetching invoice details:', error)
      toast.error('Failed to load invoice details')
    }
  }



  const handleDownloadInvoice = async (invoice: any) => {
    try {
      // Fetch detailed invoice data first
      const response = await apiClient.getEstimateById(invoice.id);
      const invoiceData = response?.data || response;
      
      // Debug: Log invoice data
      console.log('Invoice data for PDF:', invoiceData);
      console.log('Customer data:', invoiceData?.customer);
      console.log('Contractor data:', invoiceData?.contractor);
      console.log('Products data:', invoiceData?.products);
      console.log('Total amount:', invoiceData?.total_amount);
      
      // Create temp container (same as JobDetailsPage)
      const tempElement = document.createElement('div');
      tempElement.id = 'temp-invoice-preview';
      tempElement.style.position = 'absolute';
      tempElement.style.left = '-10000px';
      tempElement.style.top = '0';
      tempElement.style.width = '8.5in';
      tempElement.style.background = '#ffffff';
      tempElement.style.padding = '32px';
      tempElement.style.pointerEvents = 'none';
      tempElement.style.fontFamily = 'Arial, sans-serif';
      tempElement.style.lineHeight = '1.4';
      tempElement.style.boxSizing = 'border-box';

      // Generate HTML content (same as JobDetailsPage)
      const invoiceHtml = `
      <div style="font-family: Arial, sans-serif; page-break-inside: avoid;">
        <!-- Header (wrapped) -->
        <div id="print-header">
          <div style="display:flex;justify-content:space-between">
            <div>
              <div style="width:200px;height:60px;background:url('/assets/logos/logo-jdp.png') no-repeat center center;background-size:contain;"></div>
              <div style="margin-top:8px;font-size:14px;color:#6b7280;">952-449-1088</div>
            </div>
            <div style="display:flex;">
              <div style="background:#1f2937;color:#fff;padding:16px;text-align:center;border:2px solid #1f2937;width:150px;">
                <div style="font-size:16px;font-weight:bold;">ESTIMATE</div>
              </div>
              <div style="background:#fff;color:#374151;padding:16px;text-align:center;border:2px solid #e5e7eb;width:150px;">
                <div style="font-size:16px;font-weight:bold;">${new Date(invoiceData?.estimate_date || new Date()).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}</div>
              </div>
            </div>
          </div>
 
          <div style="display:flex;justify-content:flex-end;margin-bottom:24px;">
            <div style="display:flex;">
              <div style="background:#1f2937;color:#fff;padding:16px;text-align:center;border:2px solid #1f2937;width:150px;">
                <div style="font-size:16px;font-weight:bold;">ESTIMATE #</div>
              </div>
              <div style="background:#fff;color:#374151;padding:16px;text-align:center;border:2px solid #e5e7eb;width:150px;">
                <div style="font-size:16px;font-weight:bold;">${invoiceData?.invoice_number || 'INV-2025-029'}</div>
              </div>
            </div>
          </div>
        </div>
 
        ${(invoiceData?.bill_to_address) ? `
        <div style="background:#1f2937;color:#fff;height:36px;display:flex;align-items:center;margin-bottom:8px;">
          <div style="font-size:14px;font-weight:bold;margin-left:16px;">Bill To</div>
        </div>
        <div style="background:#fff;border:2px solid #e5e7eb;padding:12px;color:#374151;font-size:14px;margin-bottom:16px;">
          ${invoiceData.bill_to_address}
        </div>` : ''}
 
        <div style="background:#1f2937;color:#fff;height:36px;display:flex;align-items:center;margin-bottom:8px; ${(invoiceData?.bill_to_address) ? '' : 'margin-top:15px;'}">
          <div style="font-size:14px;font-weight:bold;margin-left:16px;">To</div>
        </div>
        <div style="background:#fff;border:2px solid #e5e7eb;padding:12px;margin-bottom:24px;">
          <div style="font-weight:600;font-size:16px;color:#374151;">
            ${invoiceData?.customer?.customer_name || invoiceData?.contractor?.contractor_name || invoiceData?.customer_name || 'Customer'}
          </div>
          <div style="color:#6b7280;font-size:14px;margin-top:4px;">
            ${invoiceData?.customer?.address || invoiceData?.contractor?.address || invoiceData?.customer_address || 'Address'}
          </div>
        </div>
 
        <!-- Project Details -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:32px;">
          <div>
            <div style="background:#1f2937;color:#fff;height:36px;display:flex;align-items:center;margin-bottom:8px;">
              <div style="font-size:14px;font-weight:bold;margin-left:16px;">P.O. No.</div>
            </div>
            <div style="background:#fff;border:2px solid #e5e7eb;padding:12px;color:#374151;font-size:14px;">${invoiceData?.po_number || 'N/A'}</div>
          </div>
          <div>
            <div style="background:#1f2937;color:#fff;height:36px;display:flex;align-items:center;margin-bottom:8px;">
              <div style="font-size:14px;font-weight:bold;margin-left:16px;">Project</div>
            </div>
            <div style="background:#fff;border:2px solid #e5e7eb;padding:12px;color:#374151;font-size:14px;">${invoiceData?.estimate_title || 'Project'}</div>
          </div>
        </div>
 
        <!-- Rep & Due -->
        <div style="margin-bottom:24px;">
          <table style="width:100%;border-collapse:collapse;border:1px solid #d1d5db;">
            <thead>
              <tr style="background:#f3f4f6;">
                <th style="border:1px solid #d1d5db;padding:8px 12px;text-align:left;font-size:14px;font-weight:600;color:#374151;">Rep</th>
                <th style="border:1px solid #d1d5db;padding:8px 12px;text-align:left;font-size:14px;font-weight:600;color:#374151;">Due Date</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="border:1px solid #d1d5db;padding:8px 12px;font-size:14px;color:#374151;">${invoiceData?.rep || 'JDP'}</td>
                <td style="border:1px solid #d1d5db;padding:8px 12px;font-size:14px;color:#374151;">
                  ${invoiceData?.due_date ? new Date(invoiceData.due_date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) : 'N/A'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
 
        <!-- Line Items -->
        <div style="margin-bottom:32px;page-break-inside:avoid;">
          <table style="width:100%;border-collapse:collapse;border:1px solid #d1d5db;margin-bottom:16px;page-break-inside:avoid;">
            <thead>
              <tr style="background:#1f2937;color:#fff;">
                <th style="border:1px solid #d1d5db;padding-bottom:15px;padding-left:12px;text-align:left;font-size:14px;font-weight:600;">Qty</th>
                <th style="border:1px solid #d1d5db;padding-bottom:15px;padding-left:12px;text-align:left;font-size:14px;font-weight:600;">Item</th>
                <th style="border:1px solid #d1d5db;padding-bottom:15px;padding-left:12px;text-align:left;font-size:14px;font-weight:600;">Description</th>
                <th style="border:1px solid #d1d5db;padding-bottom:15px;padding-right:12px;text-align:right;font-size:14px;font-weight:600;">Rate</th>
                <th style="border:1px solid #d1d5db;padding-bottom:15px;padding-right:12px;text-align:right;font-size:14px;font-weight:600;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${invoiceData?.products?.map((p: any) => `
                <tr style="border-bottom:1px solid #e5e7eb;">
                  <td style="border:1px solid #d1d5db;padding:12px 16px;font-size:14px;font-weight:500;">${p.stock_quantity || p.quantity || 1}</td>
                  <td style="border:1px solid #d1d5db;padding:12px 16px;font-weight:600;font-size:14px;">${p.product_name || p.name || 'Item'}</td>
                  <td style="border:1px solid #d1d5db;padding:12px 16px;font-size:13px;color:#6b7280;line-height:1.4;">${p.description || ''}</td>
                  <td style="border:1px solid #d1d5db;padding:12px 16px;text-align:right;font-size:14px;font-weight:500;">$${(p.estimated_price || p.unit_cost || p.rate || 0).toFixed(2)}</td>
                  <td style="border:1px solid #d1d5db;padding:12px 16px;text-align:right;font-weight:600;font-size:14px;">$${(p.total_cost || p.total || 0).toFixed(2)}</td>
                </tr>
              `).join('') || ''}
            </tbody>
          </table>
 
          <div style="display:flex;justify-content:end;margin-top:20px;">
            <div style="text-align:right;">
              <div style="font-weight:bold;font-size:20px;color:#1f2937;">$${(invoiceData?.total_amount || invoiceData?.total || 0).toFixed(2)}</div>
            </div>
          </div>
 
          <div style="display:flex;justify-content:end;margin-top:16px;">
            <div style="text-align:right;min-width:200px;">
              <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
                <span style="font-size:14px;color:#374151;">Payments / Credits:</span>
                <span style="font-size:14px;color:#374151;">$${(invoiceData?.payment_credits || 0).toFixed(2)}</span>
              </div>
              <div style="display:flex;justify-content:space-between;background:#f3f4f6;padding:8px 12px;border-radius:4px;">
                <span style="font-weight:bold;font-size:14px;color:#374151;">Balance Due:</span>
                <span style="font-weight:bold;font-size:14px;color:#374151;">$${(invoiceData?.balance_due || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
 
        <!-- Notes -->
        <div style="border-top:2px solid #e5e7eb;padding-top:20px;margin-bottom:32px;">
          <div style="background:#f3f4f6;padding:16px;border-radius:6px;text-align:center;border:1px solid #e5e7eb;">
            <div style="font-size:14px;font-weight:500;white-space:pre-line;color:#374151;">${invoiceData?.notes || 'Final payment to complete project billing'}</div>
          </div>
        </div>
 
        <!-- Acceptance -->
        <div style="margin-bottom:32px;page-break-inside:avoid;">
          <div style="font-size:11px;color:#6b7280;margin-bottom:32px;line-height:1.5;">
            <p style="margin:0;">
              JDP is not responsible for repair of lamps & landscaping, house owner utilities including cables,
              sprinkler systems, television or telephone cables, etc. that may be cut or damaged during installation.
              Price are subject to change prior to receipt of down payment.
            </p>
          </div>
 
          <div style="text-align:center;margin-bottom:32px;">
            <div style="font-size:28px;font-weight:bold;margin-bottom:20px;color:#1f2937;">Total $${(invoiceData?.total_amount || invoiceData?.total || 0).toFixed(2)}</div>
            <div style="font-size:14px;color:blue;font-weight:500;">EMAIL: jen@jdpelectric.us 952-449-1088</div>
          </div>
 
          <div style="border-top:1px solid #e5e7eb;margin-bottom:24px;"></div>
 
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
            <div style="display:flex;flex-direction:column;">
              <div style="font-size:14px;font-weight:500;color:#374151;margin-bottom:4px;">Customer Acceptance</div>
              <div style="font-size:14px;font-weight:500;color:#374151;">Authorized Signature</div>
            </div>
            <div style="font-size:14px;font-weight:500;color:#374151;">Date</div>
          </div>
 
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
            <div style="display:flex;flex-direction:column;width:60%;">
              <div style="border-bottom:1px solid #374151;height:2px;margin-bottom:8px;"></div>
              <div style="font-size:12px;color:#374151;text-align:center;">Signature</div>
            </div>
            <div style="display:flex;flex-direction:column;width:30%;">
              <div style="border-bottom:1px solid #374151;height:2px;margin-bottom:8px;"></div>
              <div style="font-size:12px;color:#374151;text-align:center;">Date</div>
            </div>
          </div>
 
          <div style="background:#e0f2fe;border:1px solid #81d4fa;border-radius:6px;padding:16px;margin-top:20px;">
            <div style="font-size:12px;color:#374151;line-height:1.4;">
              By signing above, you agree to the terms and pricing outlined in this estimate. This becomes a binding agreement upon signature.
            </div>
          </div>
        </div>
      </div>
    `;

      tempElement.innerHTML = invoiceHtml;
      document.body.appendChild(tempElement);

      // Header height in CSS px
      const headerEl = tempElement.querySelector('#print-header') as HTMLElement | null;
      const headerCssPx = Math.ceil(headerEl?.getBoundingClientRect().height || 0);

      // Render to canvas
      const canvas = await html2canvas(tempElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: tempElement.scrollWidth,
        height: tempElement.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        windowWidth: tempElement.scrollWidth,
        windowHeight: tempElement.scrollHeight
      });

      // ------ FIX 1: convert CSS px -> SCALED canvas px ------
      const scaleX = canvas.width / tempElement.scrollWidth;

      // page-top → header-bottom tak ka full band (CSS px)
      const rootRect = tempElement.getBoundingClientRect();
      const headRect = headerEl?.getBoundingClientRect();
      const headerBandCssPx = Math.max(
        1,
        Math.ceil(((headRect?.bottom ?? 0) - rootRect.top))   // includes top whitespace
      );

      // SCALED canvas px
      const headerPxScaled = Math.max(1, Math.round(headerBandCssPx * scaleX));

      // Slice header (use scaled px)
      let headerImgData: string | null = null;
      if (headerPxScaled > 0) {
        const headerCanvas = document.createElement('canvas');
        headerCanvas.width = canvas.width;
        headerCanvas.height = headerPxScaled;
        const hctx = headerCanvas.getContext('2d')!;
        // slice: page top (y=0) to header bottom
        hctx.drawImage(canvas, 0, 0, canvas.width, headerPxScaled, 0, 0, canvas.width, headerPxScaled);
        headerImgData = headerCanvas.toDataURL('image/png');
      }

      const imageData = canvas.toDataURL('image/png');

      // PDF sizing
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;                 // A4 width (mm)
      const footerSpace = 21;               // reserve bottom
      const pageHeight = 295 - footerSpace; // usable page height
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const pxToMm = imgWidth / canvas.width;

      // ------ FIX 2: header reserve with padding ------
      const headerHeightMM = headerPxScaled * pxToMm; // includes top whitespace
      const headerReserveMM = headerHeightMM;       // pad ki zaroorat nahi
      const pageContentHeightMM = pageHeight - headerReserveMM;

      let heightLeft = imgHeight;

      // First page (full tall image as before)
      pdf.addImage(imageData, 'PNG', 0, 0, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Next pages
      while (heightLeft > 0.1) {
        const position = heightLeft - imgHeight; // negative offset of tall image
        pdf.addPage();

        // Draw page content shifted just below headerReserve
        // content ko header band ke turant baad start karo
        const contentYOffset = headerReserveMM;
        pdf.addImage(imageData, 'PNG', 0, position + contentYOffset, imgWidth, imgHeight);

        // top band ko white mask (safety)
        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, 0, imgWidth, headerReserveMM, 'F');

        // header band (full-width) bilkul top se draw
        if (headerImgData && headerHeightMM > 0) {
          pdf.addImage(headerImgData, 'PNG', 0, 0, imgWidth, headerHeightMM);
        }

        heightLeft -= pageContentHeightMM;
      }

      // Open + print
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const printWindow = window.open(pdfUrl, '_blank');
      if (printWindow) {
        printWindow.onload = () => setTimeout(() => printWindow.print(), 1000);
      }

      // Cleanup
      document.body.removeChild(tempElement);
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 10000);
    } catch (err) {
      console.error('Print error:', err);
      toast.error('Failed to print invoice');
    }
  };

  const handleDeleteInvoice = (invoiceId: string | number) => {
    setInvoiceToDelete(invoiceId);
    setShowDeleteDialog(true);
  };

  const confirmDeleteInvoice = async () => {
    if (!invoiceToDelete) return;
    try {
      setIsDeleting(true);
      await apiClient.deleteEstimate(String(invoiceToDelete));
      console.log(invoiceToDelete, "IDD")
      dispatch(deleteInvoice(String(invoiceToDelete)));
      toast.success("Estimate deleted successfully!");
      setShowDeleteDialog(false);
      setInvoiceToDelete(null);
      
      // Refresh listing after delete (this will also fetch stats)
      await fetchEstimates();
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
    // { id: 'invoice-comparison', label: 'Invoice Comparison', icon: GitCompare },
    { id: 'approvals', label: 'Approvals', icon: CheckSquare, notification: 2 },
  ]



  const fetchEstimates = async () => {
    setIsLoadingEstimates(true);
    try {
      const response = await apiClient.getAllEstimates(currentPage, itemsPerPage);
      console.log('API Response:', response);
      setEstimates(response.data.estimates || []);
      setTotalEstimates(response.data.total || 0); 
      
      // Also fetch stats when listing is fetched
      // await fetchEstimateStats();
    } catch (error) {
      console.error('Failed to fetch estimates:', error);
    } finally {
      setIsLoadingEstimates(false);
    }
  };


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

  useEffect(() => {
    fetchEstimateStats();
  }, []);

  useEffect(() => {
    fetchEstimates();
  }, [currentPage]);


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
      console.log(estimates, 'filteressss')

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


      setEstimates(estimates);
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
          estimates = statusEstimates.filter((statusEstimate: any) =>
            typeEstimates.some((typeEstimate: any) => typeEstimate.id === statusEstimate.id)
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
  const totalPages = Math.ceil(totalEstimates / itemsPerPage) || 1;


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
        <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 h-auto">
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
                
              </TabsTrigger>
            )
          })}
        </TabsList>

        <TabsContent value="invoices" className="mt-6">

          <div className="space-y-6">
            {(isLoadingDashboard || dashboardCards) && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                {/* <Card>
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
                </Card> */}
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
                          <TableHead>Customer / Contractor</TableHead>
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
                              <TableCell>{invoice.customer?.customer_name || invoice.contractor?.contractor_name || 'N/A'}</TableCell>
                              <TableCell className="max-w-48 truncate">{invoice.job?.job_title || 'N/A'}</TableCell>
                              <TableCell>{invoice.invoice_type || 'N/A'}</TableCell>
                              <TableCell>{invoice.created_at ? new Date(invoice.created_at).toLocaleDateString() : 'N/A'}</TableCell>
                              <TableCell>{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : '-'}</TableCell>
                              <TableCell className="font-medium">
                                ${Number(invoice.total_amount || 0).toFixed(2)}
                              </TableCell>
                              <TableCell>
                                <span
                                  className={`px-2 py-1 text-xs font-medium rounded-full ${invoice.status === 'paid'
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
                                    <Button variant="outline" size="icon" onClick={() => handleViewInvoice(invoice)}>
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                  )}
                                  {hasPermission('invoices', 'view') && (
                                    <Button variant="outline" size="icon" onClick={() => handleDownloadInvoice(invoice)}>
                                      <Download className="w-4 h-4" />
                                    </Button>
                                  )}
                                  {hasPermission('invoices', 'delete') && (
                                    <Button variant="outline" size="icon" onClick={() => handleDeleteInvoice(invoice.id)}>
                                      <Trash2 className="w-4 h-4 text-red-500" />
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
                {(totalPages > 1 && estimates.length > 0 ) && (
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

      {/* View Invoice Dialog */}
      <NewInvoiceDialog
        open={showViewInvoiceDialog}
        onOpenChange={setShowViewInvoiceDialog}
        onSave={handleSaveInvoice}
        jobs={localJobs}
        isViewMode={true}
        viewInvoiceData={selectedInvoiceData}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="animate-scale-in bg-white max-w-md">
          <AlertDialogHeader className="text-center">
           
            <AlertDialogTitle className="text-xl">
              Delete Estimate
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete this estimate? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel
              onClick={() => {
                setShowDeleteDialog(false);
                setInvoiceToDelete(null);
              }}
              className="button-bounce"
              disabled={isDeleting}
            >
              No
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteInvoice}
              className="bg-red-600 hover:bg-red-700 text-white button-bounce"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Yes'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>

  )
}
