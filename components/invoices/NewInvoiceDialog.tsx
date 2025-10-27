import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Textarea } from '../ui/textarea'
import { Card, CardContent } from '../ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Separator } from '../ui/separator'
import { Plus, Trash2, Search, PlusCircle, Receipt, Eye, X, FileText } from 'lucide-react'
import { format } from 'date-fns'
import { Invoice, InvoiceItem, LaborEntry, AdditionalCost } from '../../types/invoice'
import { customersData, jobsData } from '../../data/invoiceData'
import { toast } from "sonner"
import { addInvoice } from '@/redux/slices/jobsSlice'
import { apiClient } from '@/utils/api'
import { useDispatch } from 'react-redux'
import { motion } from 'framer-motion'
import { Logo } from '../common/Logo'
import Image from 'next/image'
// import { formatCurrency, formatDate } from '../../utils/invoiceUtils'

interface NewInvoiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (invoice: Partial<Invoice>) => void
  jobs: any[];
  jobId?: number;
onInvoiceSaved?: (invoice: any) => void;
  isViewMode?: boolean;
  viewInvoiceData?: any;
}




export interface CreateEstimatePayload {
  estimate_title: string;
  customer_id: number;
  priority: "low" | "medium" | "high";
  valid_until: string;
  location: string;
  description: string;
  service_type: string;
  email_address: string;
  estimate_date: string;

  materials_cost: number;
  labor_cost: number;
  additional_costs: number;
  subtotal: number;
  tax_percentage: number;
  tax_amount: number;
  total_amount: number;

  status: string;
  invoice_type: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;

  job_id: number;

  // additional_cost: {
  //   description: string;
  //   amount: number;
  // };

  custom_labor: {
    full_name: string;
    email: string;
    hours_worked: number;
    hourly_rate: number;
    job_id: number;
    is_custom: boolean;
  }[];

  custom_products: {
    product_name: string;
    supplier_id: number;
    supplier_sku: string;
    jdp_sku: string;
    stock_quantity: number;
    unit: string;
    job_id: number;
    is_custom: boolean;
    unit_cost: number;
  }[];
}

interface ProductFormData {
  id: number;
  product_name: string;
  name: string;          
  sku: string;           
  jdpSku: string;
  unitPrice: number;     
  unit: string;         
  stock: number;
  supplierId: number | null;
  supplierName?: string;
  description?: string;
}




export const NewInvoiceDialog = ({ open, onOpenChange, onSave, jobId, jobs, onInvoiceSaved, isViewMode = false, viewInvoiceData }: NewInvoiceDialogProps) => {
  console.log('trsting jobs', jobs);
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)
  const [sendingInvoice, setSendingInvoice] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [localJobs, setLocalJobs] = useState<any[]>(jobs || []);
  const [suppliers, setSuppliers] = useState<{
    id: number;
    company_name: string;
    users: {
      full_name: string;
    };
  }[]>([]);
const [products, setProducts] = useState<ProductFormData[]>([]);






  const [customers, setCustomers] = useState<any[]>([])
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  const dispatch = useDispatch();
  const [newInvoice, setNewInvoice] = useState<Partial<Invoice>>({
    customerId: "",
    jobId: jobId || undefined,
    type: "proposal_invoice",
    issueDate: format(new Date(), "yyyy-MM-dd"),
    dueDate: format(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
    items: [],
    labor: [],
    additionalCosts: [],
    notes: "",
    taxRate: 0.08,
    priority: "medium",
  });

  const [suppliersList, setSuppliersList] = useState<any[]>([])
  const [selectedSupplierId, setSelectedSupplierId] = useState<number>(1)
  const [showInlineInvoiceForm, setShowInlineInvoiceForm] = useState(true)
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null)
  const [selectedEstimateId, setSelectedEstimateId] = useState<string | null>(null)
  const [productsList, setProductsList] = useState<any[]>([])
  const [jobsList, setJobsList] = useState<any[]>([])
  const [selectedJob, setSelectedJob] = useState<any>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const currentJob = selectedJob || jobs?.find((j: any) => j.id === jobId)

  // Inline Invoice Data State
  const [inlineInvoiceData, setInlineInvoiceData] = useState({
    date: new Date().toISOString().split('T')[0],
    estimateNumber: '',
    customerName: '',
    customerAddress: '',
    billToAddress: '',
    billToAddressEnabled: true,
    poNumber: '',
    project: '',
    jobId: jobId || '',
    rep: '',
    dueDate: '',
    paymentCredits: 0,
    balanceDue: '',
    lineItems: [{
      id: Math.random().toString(36).substring(2, 9),
      productId: null,
      qty: 1,
      item: '',
      description: '',
      rate: 0,
      estimatedPrice: 0,
      total: 0,
      searchQuery: '',
      showSearchResults: false,
      supplierId: 1,
      isCustomProduct: false
    }],
    notes: 'NOTES\nJDP WILL REQUIRE HALF DOWN UPON SIGNED ESTIMATE',
    signatureText: 'ACCEPTED BY________________DATE_____',
    invoiceType: 'Estimate',
    customInvoiceType: '',
    paymentPercentage: 0,
    estimateTotal: 0,
    paymentHistory: [] as any[]
  })

  // Update form when job is provided
  useEffect(() => {
    if (currentJob) {
      setInlineInvoiceData(prev => ({
        ...prev,
        customerName: currentJob.customerName || '',
        customerAddress: currentJob.location || currentJob.address || '',
        project: currentJob.title || '',
        jobId: currentJob.id || jobId
      }))
    }
  }, [currentJob, jobId])

  // Populate data from viewInvoiceData when in view mode
  useEffect(() => {
    if (isViewMode && viewInvoiceData) {
      console.log('Setting customer data:', {
        customer_name: viewInvoiceData?.contractor?.contractor_name,
        address: viewInvoiceData?.contractor?.address
      });

      const customerName = viewInvoiceData?.contractor?.contractor_name ?? viewInvoiceData?.customer?.customer_name;
      const customerAddress = viewInvoiceData?.contractor?.address ??viewInvoiceData?.customer?.address;
      const project = viewInvoiceData?.estimate_title || 'No project name';

      console.log('Processed customer data:', { customerName, customerAddress, project });

      // Force update with multiple approaches
      const updateData = () => {
        console.log('Updating inlineInvoiceData with:', { customerName, customerAddress, project });

        setInlineInvoiceData(prev => {
          const newData = {
            ...prev,
            date: viewInvoiceData.estimate_date || new Date().toISOString().split('T')[0],
            estimateNumber: viewInvoiceData.invoice_number || '',
            customerName: customerName,
            customerAddress: customerAddress,
            billToAddress: viewInvoiceData.bill_to_address || '',
            billToAddressEnabled: !!viewInvoiceData.bill_to_address,
            poNumber: viewInvoiceData.po_number || '',
            project: project,
            jobId: viewInvoiceData.job_id || '',
            rep: viewInvoiceData.rep || '',
            dueDate: viewInvoiceData.due_date || '',
            paymentCredits: viewInvoiceData.payment_credits || 0,
            balanceDue: viewInvoiceData.balance_due || '',
            notes: viewInvoiceData.notes || 'NOTES\nJDP WILL REQUIRE HALF DOWN UPON SIGNED ESTIMATE',
            invoiceType: viewInvoiceData.invoice_type === 'estimate' ? 'Estimate' :
              viewInvoiceData.invoice_type === 'down_payment' ? 'Downpayment Invoice' :
                viewInvoiceData.invoice_type === 'proposal_invoice' ? 'Rough Invoice' :
                  viewInvoiceData.invoice_type === 'progressive_invoice' ? 'Progressive Invoice' :
                    viewInvoiceData.invoice_type === 'final_invoice' ? 'Final Invoice' : 'Estimate',
            lineItems: viewInvoiceData.products?.map((product: any, index: number) => ({
              id: `item-${index}`,
              productId: product.id,
              qty: product.stock_quantity || 1,
              item: product.product_name || '',
              description: product.description,
              rate: product.jdp_price || product.unit_cost || 0,
              estimatedPrice: product.estimated_price || 0,
              total: product.total_cost || 0,
              searchQuery: '',
              showSearchResults: false,
              supplierId: product.supplier_id || 1,
              isCustomProduct: true
            })) || [{
              id: Math.random().toString(36).substring(2, 9),
              productId: null,
              qty: 1,
              item: '',
              description: '',
              rate: 0,
              estimatedPrice: 0,
              total: 0,
              searchQuery: '',
              showSearchResults: false,
              supplierId: 1,
              isCustomProduct: false
            }]
          };

          console.log('New data being set:', newData);
          return newData;
        });

        // Set selected job for proper display
        if (viewInvoiceData.job) {
          setSelectedJob(viewInvoiceData.job)
        }
      };

      // Try multiple approaches
      updateData();

      // Force update after a delay
      setTimeout(() => {
        console.log('Force updating after timeout...');
        updateData();
      }, 100);

      // Another force update
      setTimeout(() => {
        console.log('Second force update...');
        setInlineInvoiceData(prev => ({
          ...prev,
          customerName: customerName,
          customerAddress: customerAddress,
          project: project
        }));
      }, 200);
    }
  }, [isViewMode, viewInvoiceData])




  const itemsTotal = newInvoice.items?.reduce((sum, i) => sum + i.total_cost, 0) || 0
  const laborTotal = newInvoice.labor?.reduce((sum, l) => sum + l.total_cost, 0) || 0
  const additionalTotal = newInvoice.additionalCosts?.reduce((sum, c) => sum + c.amount, 0) || 0

  const subtotal = itemsTotal + laborTotal + additionalTotal;
  const taxAmount = subtotal * (newInvoice.taxRate || 0);
  const totalAmount = subtotal + taxAmount;

  // Invoice Helper Functions
  const calculateInvoiceSubtotal = () => {
    return inlineInvoiceData.lineItems.reduce((sum, item) => sum + item.total, 0)
  }

  // Send invoice to customer function
  const sendInvoiceToCustomer = async (invoiceId: number) => {
    try {
      const currentJob = jobsList.find((j: any) => j.id === inlineInvoiceData.jobId)
      if (!currentJob) {
        throw new Error('Job not found')
      }

      // Get token properly
      const getAuthToken = (): string | null => {
        if (typeof window !== "undefined") {
          const savedAuth = localStorage.getItem("jdp_auth");
          if (savedAuth) {
            try {
              const authData = JSON.parse(savedAuth);
              if (authData.token && authData.expires > Date.now()) {
                return authData.token;
              }
            } catch (error) {
              console.error("Error parsing auth data:", error);
            }
          }
        }
        return null;
      };

      const token = getAuthToken()
      if (!token) {
        throw new Error('No authentication token found')
      }

      const payload = {
        estimateNumber: inlineInvoiceData.estimateNumber || 'Draft',
        estimateDate: new Date(inlineInvoiceData.date).toLocaleDateString('en-US', {
          month: '2-digit',
          day: '2-digit',
          year: 'numeric'
        }),
        customerName: inlineInvoiceData.customerName || 'Customer',
        customerEmail: currentJob.email || 'customer@example.com',
        customerAddress: inlineInvoiceData.customerAddress || '',
        billToAddress: inlineInvoiceData.billToAddressEnabled ? inlineInvoiceData.billToAddress || '' : '',
        poNumber: inlineInvoiceData.poNumber || '',
        project: inlineInvoiceData.project || '',
        rep: inlineInvoiceData.rep || '',
        dueDate: inlineInvoiceData.dueDate || '',
        paymentCredits: inlineInvoiceData.paymentCredits || 0,
        balanceDue: inlineInvoiceData.balanceDue || '',
        lineItems: inlineInvoiceData.lineItems.map(item => ({
          qty: item.qty,
          item: item.item,
          description: item.description,
          rate: item.rate,
          total: item.total
        })),
        notes: inlineInvoiceData.notes || '',
        signatureText: inlineInvoiceData.signatureText || '',
        invoiceType: inlineInvoiceData.invoiceType === 'Custom' ? inlineInvoiceData.customInvoiceType : inlineInvoiceData.invoiceType,
        subtotal: calculateInvoiceSubtotal(),
        total: calculateInvoiceSubtotal()
      }

      console.log('Sending invoice to customer with ID:', invoiceId)
      console.log('Payload:', payload)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoices/sendInvoiceToCustomer/${invoiceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      console.log('Response status:', response.status)
      console.log('Response:', response)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Error response:', errorText)
        throw new Error(`Failed to send invoice to customer: ${response.status}`)
      }

      toast.success('Invoice sent successfully to customer!')
    } catch (error) {
      console.error('Error sending invoice to customer:', error)
      toast.error(`Failed to send invoice to customer: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const updateInvoiceLineItem = (itemId: string, field: string, value: any) => {
    setInlineInvoiceData(prev => ({
      ...prev,
      lineItems: prev.lineItems.map(item => {
        if (item.id === itemId) {
          const updated = { ...item, [field]: value }
          if (field === 'qty' || field === 'estimatedPrice' || field === 'rate') {
            // Use estimated price if available, otherwise use rate
            const priceToUse = updated.estimatedPrice && updated.estimatedPrice > 0
              ? updated.estimatedPrice
              : updated.rate
            updated.total = (updated.qty || 0) * priceToUse
          }
          return updated
        }
        return item
      })
    }))
  }

  const addInvoiceLineItem = () => {
    setInlineInvoiceData(prev => ({
      ...prev,
      lineItems: [...prev.lineItems, {
        id: Math.random().toString(36).substring(2, 9),
        productId: null,
        qty: 1,
        item: '',
        description: '',
        rate: 0,
        estimatedPrice: 0,
        total: 0,
        searchQuery: '',
        showSearchResults: false,
        supplierId: selectedSupplierId || 1,
        isCustomProduct: false
      }]
    }))
  }

  const removeInvoiceLineItem = (itemId: string) => {
    setInlineInvoiceData(prev => ({
      ...prev,
      lineItems: prev.lineItems.filter(item => item.id !== itemId)
    }))
  }

  const getFilteredProducts = (query: string) => {
    if (!query) return []
    return productsList.filter(product =>
      product.name?.toLowerCase().includes(query.toLowerCase()) ||
      product.jdpSKU?.toLowerCase().includes(query.toLowerCase())
    )
  }

  const selectProduct = (itemId: string, product: any) => {
    setInlineInvoiceData(prev => ({
      ...prev,
      lineItems: prev.lineItems.map(item => {
        if (item.id === itemId) {
          const rate = product.jdpPrice || 0
          const estimatedPrice = product.estimatedPrice || 0
          // Use estimated price if available, otherwise use rate
          const priceToUse = estimatedPrice > 0 ? estimatedPrice : rate

          return {
            ...item,
            item: product.name,
            description: product.description || '',
            rate: rate,
            estimatedPrice: estimatedPrice,
            total: (item.qty || 1) * priceToUse,
            showSearchResults: false,
            searchQuery: '',
            supplierId: product.supplierId || selectedSupplierId || 1
          }
        }
        return item
      })
    }))
  }

  const addCustomProduct = (itemId: string, productName: string) => {
    setInlineInvoiceData(prev => ({
      ...prev,
      lineItems: prev.lineItems.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            item: productName,
            isCustomProduct: true,
            showSearchResults: false,
            searchQuery: ''
          }
        }
        return item
      })
    }))
  }

  const addCustomLineItem = () => {
    setInlineInvoiceData(prev => ({
      ...prev,
      lineItems: [...prev.lineItems, {
        id: Math.random().toString(36).substring(2, 9),
        productId: null,
        qty: 1,
        item: '',
        description: '',
        rate: 0,
        estimatedPrice: 0,
        total: 0,
        searchQuery: '',
        showSearchResults: false,
        supplierId: selectedSupplierId || 1,
        isCustomProduct: true
      }]
    }))
  }

  const mapInvoiceTypeToAPI = (uiType: string): string => {
    const mapping: Record<string, string> = {
      'Estimate': 'estimate',
      'Downpayment Invoice': 'down_payment',
      'Rough Invoice': 'proposal_invoice',
      'Progressive Invoice': 'progressive_invoice',
      'Final Invoice': 'final_invoice'
    }
    return mapping[uiType] || 'estimate'
  }

  const getAvailableEstimates = () => {
    return []
  }

  const handleEstimateSelection = (estimateId: string) => {
    setSelectedEstimateId(estimateId)
  }

  const fetchSuppliersList = async (searchQuery: string = '') => {
    try {
      const response = searchQuery 
        ? await apiClient.searchSuppliersByQuery(searchQuery)
        : await apiClient.getAllSuppliers()
      
      const suppliersData = response.data?.suppliers || response.data?.data || []
      setSuppliersList(suppliersData.map((s: any) => ({
        id: s.id,
        name: s.company_name || s.users?.full_name || 'Unknown',
        fullName: s.users?.full_name || '',
        companyName: s.company_name || ''
      })))
    } catch (error) {
      console.error('Error fetching suppliers:', error)
    }
  }

  const fetchProductsList = async (searchQuery: string = '') => {
    try {
      const response = searchQuery 
        ? await apiClient.searchProductsByQuery(searchQuery)
        : await apiClient.getAllProducts()
      
      const productsData = response.data?.products || response.data?.data || []
      setProductsList(productsData.map((p: any) => ({
        id: p.id,
        name: p.product_name,
        description: p.description || '',
        jdpSKU: p.jdp_sku,
        jdpPrice: p.jdp_price || p.unit_cost || 0,
        estimatedPrice: p.estimated_price || 0,
        supplierId: p.supplier_id || 1
      })))
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const fetchJobsList = async (searchQuery: string = '') => {
    try {
      const response = searchQuery 
        ? await apiClient.searchJobsByQuery(searchQuery, 1, 10)
        : await apiClient.getJobs(1, 10)
      
      const jobsData = response.data || []
      console.log(jobsData, 'jobsData')
      setJobsList(jobsData)
    } catch (error) {
      console.error('Error fetching jobs:', error)
    }
  }

  const handleJobSelection = (jobId: string) => {
    const job = jobsList.find((j: any) => j.id === jobId)
    if (job) {
      setSelectedJob(job)
      setInlineInvoiceData(prev => ({
        ...prev,
        jobId: job.id,
        customerName: job.type === 'contract-based' ? (job.contractorName || job.contractor?.name || '') : (job.customerName || ''),
        customerAddress: job.type === 'contract-based' ? (job.contractorAddress || job.contractor?.address || job.location || job.address || '') : (job.location || job.address || ''),
        billToAddress: job.billToAddress || '',
        project: job.title || ''
      }))
    }
    console.log(selectedJob, 'selectedJob');
    console.log(inlineInvoiceData, 'setInlineInvoiceData');
  }

  const handleSaveInvoiceAsDraft = async () => {
    // Validation
    const errors: Record<string, string> = {}
    
    if (!inlineInvoiceData.jobId) {
      errors.jobId = 'Please select a job first'
    }

    if (!inlineInvoiceData.project) {
      errors.project = 'Project field is required'
    }



    if (inlineInvoiceData.lineItems.length === 0 || !inlineInvoiceData.lineItems[0].item) {
      errors.lineItems = 'Please add at least one product item'
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      toast.error('Please fix the validation errors')
      return
    }

    setValidationErrors({})
    setSavingDraft(true)
    try {
      const subtotal = calculateInvoiceSubtotal()
      
      const customProducts = inlineInvoiceData.lineItems.map(item => ({
        product_name: item.item,
        description: item.description || '',
        supplier_id: item.supplierId || selectedSupplierId || 1,
        supplier_sku: item.item.substring(0, 10),
        jdp_sku: `JDP-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        stock_quantity: item.qty,
        unit: 'unit',
        job_id: Number(inlineInvoiceData.jobId),
        unit_cost: item.rate,
        jdp_price: item.rate,
        estimated_price: item.estimatedPrice || 0,
        total_cost: item.total 
      }))

      const payload = {
        job_id: Number(inlineInvoiceData.jobId),
        estimate_title: inlineInvoiceData.project || currentJob?.title,
        ...(currentJob?.type === 'contract-based'
          ? { contractor_id: Number(currentJob?.contractor) || 0 }
          : { customer_id: Number(currentJob?.customer) || 0 }
        ),
        priority: 'medium' as 'low' | 'medium' | 'high',
        service_type: currentJob?.type === 'contract-based' ? 'contract_based' : 'service_based',
        email_address: currentJob?.email || 'customer@example.com',
        estimate_date: inlineInvoiceData.date,
        po_number: inlineInvoiceData.poNumber || '',
        rep: inlineInvoiceData.rep || '',
        due_date: inlineInvoiceData.dueDate || '',
        payment_credits: inlineInvoiceData.paymentCredits || 0,
        balance_due: inlineInvoiceData.balanceDue || '',
        bill_to_address: inlineInvoiceData.billToAddressEnabled ? inlineInvoiceData.billToAddress || '' : '',
        notes: inlineInvoiceData.notes || '',
        status: 'draft',
        invoice_type: mapInvoiceTypeToAPI(inlineInvoiceData.invoiceType),
        custom_products: customProducts
      }

      await apiClient.createEstimate(payload as any)
      toast.success('Invoice saved as draft!')
      
      // Refresh the estimates list
      if (onInvoiceSaved) {
        onInvoiceSaved(payload)
      }
      
      onOpenChange(false)
      
      // Reset form
      setInlineInvoiceData({
        date: new Date().toISOString().split('T')[0],
        estimateNumber: '',
        customerName: '',
        customerAddress: '',
        billToAddress: '',
        billToAddressEnabled: true,
        poNumber: '',
        project: '',
        jobId: jobId || '',
        rep: '',
        dueDate: '',
        paymentCredits: 0,
        balanceDue: '',
        lineItems: [{
          id: Math.random().toString(36).substring(2, 9),
          productId: null,
          qty: 1,
          item: '',
          description: '',
          rate: 0,
          estimatedPrice: 0,
          total: 0,
          searchQuery: '',
          showSearchResults: false,
          supplierId: 1,
          isCustomProduct: false
        }],
        notes: 'NOTES\nJDP WILL REQUIRE HALF DOWN UPON SIGNED ESTIMATE',
        signatureText: 'ACCEPTED BY________________DATE_____',
        invoiceType: 'Estimate',
        customInvoiceType: '',
        paymentPercentage: 0,
        estimateTotal: 0,
        paymentHistory: []
      })
      setSelectedJob(null)
      setValidationErrors({})
    } catch (error) {
      console.error('Error saving invoice:', error)
      toast.error('Failed to save invoice')
    } finally {
      setSavingDraft(false)
    }
  }

  const handlePreviewAndSend = async () => {
    // Validation
    const errors: Record<string, string> = {}
    
    if (!inlineInvoiceData.jobId) {
      errors.jobId = 'Please select a job first'
    }

    if (!inlineInvoiceData.project) {
      errors.project = 'Project field is required'
    }



    if (inlineInvoiceData.lineItems.length === 0 || !inlineInvoiceData.lineItems[0].item) {
      errors.lineItems = 'Please add at least one product item'
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      toast.error('Please fix the validation errors')
      return
    }

    setValidationErrors({})
    setSendingInvoice(true)
    try {
      const subtotal = calculateInvoiceSubtotal()
      
      const customProducts = inlineInvoiceData.lineItems.map(item => ({
        product_name: item.item,
        description: item.description || '',
        supplier_id: item.supplierId || selectedSupplierId || 1,
        supplier_sku: item.item.substring(0, 10),
        jdp_sku: `JDP-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        stock_quantity: item.qty,
        unit: 'unit',
        job_id: Number(inlineInvoiceData.jobId),
        unit_cost: item.rate,
        jdp_price: item.rate,
        estimated_price: item.estimatedPrice || 0,
        total_cost: item.total
      }))

      const payload = {
        job_id: Number(inlineInvoiceData.jobId),
        estimate_title: inlineInvoiceData.project || currentJob?.title,
        ...(currentJob?.type === 'contract-based'
          ? { contractor_id: Number(currentJob?.contractor) || 0 }
          : { customer_id: Number(currentJob?.customer) || 0 }
        ),
        priority: 'medium' as 'low' | 'medium' | 'high',
        service_type: currentJob?.type === 'contract-based' ? 'contract_based' : 'service_based',
        email_address: currentJob?.email || 'customer@example.com',
        estimate_date: inlineInvoiceData.date,
        po_number: inlineInvoiceData.poNumber || '',
        rep: inlineInvoiceData.rep || '',
        due_date: inlineInvoiceData.dueDate || '',
        payment_credits: inlineInvoiceData.paymentCredits || 0,
        balance_due: inlineInvoiceData.balanceDue || '',
        bill_to_address: inlineInvoiceData.billToAddressEnabled ? inlineInvoiceData.billToAddress || '' : '',
        notes: inlineInvoiceData.notes || '',
        status: 'sent',
        invoice_type: mapInvoiceTypeToAPI(inlineInvoiceData.invoiceType),
        custom_products: customProducts
      }

      const response = await apiClient.createEstimate(payload as any)
      toast.success('Invoice created successfully!')

      // Send invoice to customer using estimate ID
      await sendInvoiceToCustomer(response.data.id)
      
      // Refresh the estimates list
      if (onInvoiceSaved) {
        onInvoiceSaved(payload)
      }
      
      onOpenChange(false)
      
      // Reset form
      setInlineInvoiceData({
        date: new Date().toISOString().split('T')[0],
        estimateNumber: '',
        customerName: '',
        customerAddress: '',
        billToAddress: '',
        billToAddressEnabled: true,
        poNumber: '',
        project: '',
        jobId: jobId || '',
        rep: '',
        dueDate: '',
        paymentCredits: 0,
        balanceDue: '',
        lineItems: [{
          id: Math.random().toString(36).substring(2, 9),
          productId: null,
          qty: 1,
          item: '',
          description: '',
          rate: 0,
          estimatedPrice: 0,
          total: 0,
          searchQuery: '',
          showSearchResults: false,
          supplierId: 1,
          isCustomProduct: false
        }],
        notes: 'NOTES\nJDP WILL REQUIRE HALF DOWN UPON SIGNED ESTIMATE',
        signatureText: 'ACCEPTED BY________________DATE_____',
        invoiceType: 'Estimate',
        customInvoiceType: '',
        paymentPercentage: 0,
        estimateTotal: 0,
        paymentHistory: []
      })
      setSelectedJob(null)
      setValidationErrors({})
    } catch (error) {
      console.error('Error sending invoice:', error)
      toast.error('Failed to send invoice')
    } finally {
      setSendingInvoice(false)
    }
  }





  const addInvoiceItem = () => {
    const newItem: InvoiceItem = {
      id: `ITEM-${Date.now()}`,
      sku: "",
      description: "",
      quantity: 1,
      unitPrice: 0,
      total_cost: 0,
      supplierId: 1,
      productId: 0,
    }
    setNewInvoice((prev) => ({
      ...prev,
      items: [...(prev.items || []), newItem],
    }))
  }

  const updateInvoiceItem = (
    index: number,
    field: keyof InvoiceItem,
    value: any
  ) => {
    const updatedItems = [...(newInvoice.items || [])];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    if (field === "quantity" || field === "unitPrice") {
      updatedItems[index].total_cost =
        updatedItems[index].quantity * updatedItems[index].unitPrice;
    }

    if (field === "total_cost") {
      updatedItems[index].total_cost = value;
    }

    setNewInvoice((prev) => ({ ...prev, items: updatedItems }));
  };

  const removeInvoiceItem = (index: number) => {
    setNewInvoice((prev) => ({
      ...prev,
      items: prev.items?.filter((_, i) => i !== index),
    }));
  };

  const addLaborEntry = () => {
    const newLabor: LaborEntry = {
      id: `LAB-${Date.now()}`,
      laborName: "",
      hours: 0,
      hourlyRate: 0,
      total_cost: 0,
      description: "",
    }
    setNewInvoice((prev) => ({
      ...prev,
      labor: [...(prev.labor || []), newLabor],
    }))
  }

  const updateLaborEntry = (
    index: number,
    field: keyof LaborEntry,
    value: any
  ) => {
    const updatedLabor = [...(newInvoice.labor || [])];
    updatedLabor[index] = { ...updatedLabor[index], [field]: value };

    if (field === "hours" || field === "hourlyRate") {
      updatedLabor[index].total_cost =
        updatedLabor[index].hours * updatedLabor[index].hourlyRate;
    }

    if (field === "total_cost") {
      updatedLabor[index].total_cost = value;
    }

    setNewInvoice((prev) => ({ ...prev, labor: updatedLabor }));
  };

  const removeLaborEntry = (index: number) => {
    setNewInvoice((prev) => ({
      ...prev,
      labor: prev.labor?.filter((_, i) => i !== index),
    }));
  };

  const addAdditionalCost = () => {
    setNewInvoice((prev) => ({
      ...prev,
      additionalCosts: [
        ...(prev.additionalCosts || []),
        { description: "", amount: 0 },
      ],
    }))
  }

  const updateAdditionalCost = (
    index: number,
    field: "description" | "amount",
    value: any
  ) => {
    const updatedCosts = [...(newInvoice.additionalCosts || [])]
    updatedCosts[index] = { ...updatedCosts[index], [field]: value }
    setNewInvoice((prev) => ({ ...prev, additionalCosts: updatedCosts }))
  }

  const removeAdditionalCost = (index: number) => {
    setNewInvoice((prev) => ({
      ...prev,
      additionalCosts: prev.additionalCosts?.filter((_, i) => i !== index),
    }))
  }

  const handleNext = () => {
    if (!validateStep(currentStep)) return
    setCurrentStep(prev => prev + 1)
  }


  const validateStep = (step: number) => {
    let stepErrors: Record<string, string> = {}

    if (step === 1) {
      if (!newInvoice.customerId) stepErrors.customerId = "Customer is required"
      if (!newInvoice.jobId) stepErrors.jobId = "Job is required"
      if (!newInvoice.type) stepErrors.type = "Invoice type is required"
      if (!newInvoice.issueDate) stepErrors.issueDate = "Issue date is required"
      if (!newInvoice.dueDate) stepErrors.dueDate = "Due date is required"
    }

    if (step === 2 && (newInvoice.items?.length || 0) > 0) {
      newInvoice.items!.forEach((item, i) => {
        if (!item.sku) stepErrors[`item_${i}_sku`] = `Item ${i + 1}: SKU required`
        if (!item.description) stepErrors[`item_${i}_desc`] = `Item ${i + 1}: Description required`
        if (item.quantity <= 0) stepErrors[`item_${i}_qty`] = `Item ${i + 1}: Quantity must be > 0`
        if (item.unitPrice <= 0) stepErrors[`item_${i}_price`] = `Item ${i + 1}: Unit price must be > 0`
      })
    }

    if (step === 3 && (newInvoice.labor?.length || 0) > 0) {
      newInvoice.labor!.forEach((labor, i) => {
        if (!labor.laborName) stepErrors[`labor_${i}_name`] = `Labor ${i + 1}: Name required`
        if (labor.hours <= 0) stepErrors[`labor_${i}_hours`] = `Labor ${i + 1}: Hours must be > 0`
        if (labor.hourlyRate <= 0) stepErrors[`labor_${i}_rate`] = `Labor ${i + 1}: Hourly rate must be > 0`
      })
    }

    // if (step === 4 && (newInvoice.additionalCosts?.length || 0) > 0) {
    //   newInvoice.additionalCosts!.forEach((cost, i) => {
    //     if (!cost.description) stepErrors[`cost_${i}_desc`] = `Cost ${i + 1}: Description required`
    //     if (cost.amount <= 0) stepErrors[`cost_${i}_amt`] = `Cost ${i + 1}: Amount must be > 0`
    //   })
    // }


    setErrors(stepErrors)
    return Object.keys(stepErrors).length === 0
  }

    const isPriority = (value: any): value is "low" | "medium" | "high" =>
  ["low", "medium", "high"].includes(value);


  const handleSave = async () => {
  setLoading(true);
  try {
    const laborPayload =
      newInvoice.labor?.map((l) => ({
        full_name: l.laborName,
        email: l.email || "customer@example.com",
        hours_worked: l.hours,
        hourly_rate: l.hourlyRate,
        job_id: Number(newInvoice.jobId),
        is_custom: true,
      })) || [];

    const productsPayload =
      newInvoice.items?.map((i) => ({
        product_name: i.description,
        supplier_id: i.supplierId && i.supplierId > 0 ? i.supplierId : 1,
        supplier_sku: i.sku || "",
        jdp_sku: i.jdp_sku || "SKU-DEFAULT",
        stock_quantity: i.quantity,
       job_id: Number(newInvoice.jobId),
        unit: i.unit ? i.unit.toString() : "1",
        is_custom: true,
        unit_cost: i.unitPrice,
      })) || [];

    const payload: CreateEstimatePayload = {
      estimate_title: "New Estimate",
      customer_id: Number(newInvoice.customerId),

      priority: isPriority(newInvoice.priority) ? newInvoice.priority : "medium",
      valid_until: newInvoice.dueDate || "",
      location: newInvoice.location || "N/A",
      description: newInvoice.notes || "",
      service_type: "service_based",
      email_address: newInvoice.emailAddress || "customer@example.com",
      estimate_date: newInvoice.issueDate || "",

      materials_cost: itemsTotal,
      labor_cost: laborTotal,
      additional_costs: additionalTotal,
      subtotal,
      tax_percentage: (newInvoice.taxRate || 0) * 100,
      tax_amount: taxAmount,
      total_amount: totalAmount,

      status: "draft",
      invoice_type: newInvoice.type || "proposal_invoice",
      invoice_number: `INV-${Date.now()}`,
      issue_date: newInvoice.issueDate || "",
      due_date: newInvoice.dueDate || "",

      job_id: Number(newInvoice.jobId),

      // additional_cost: newInvoice.additionalCosts?.length
      //   ? {
      //       description: newInvoice.additionalCosts[0].description || "",
      //       amount: newInvoice.additionalCosts.reduce((sum, c) => sum + c.amount, 0),
      //     }
      //   : { description: "", amount: 0 },

      custom_labor: laborPayload,
      custom_products: productsPayload,
    };

    const createdInvoice = await apiClient.createEstimate(payload);
    dispatch(addInvoice(createdInvoice));
    toast.success("Invoice created successfully!");
    onOpenChange(false);

    onInvoiceSaved?.(createdInvoice);

    setNewInvoice({
      customerId: "",
      jobId: undefined,
      type: "proposal_invoice",
      issueDate: format(new Date(), "yyyy-MM-dd"),
      dueDate: format(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
      items: [],
      labor: [],
      additionalCosts: [],
      notes: "",
      taxRate: 0.08,
      priority: "medium",
    });

    setCurrentStep(1);
  } catch (error) {
    console.error("Error creating invoice:", error);
    toast.error("Failed to create invoice");
  } finally {
    setLoading(false);
  }
};




  useEffect(() => {
    setNewInvoice(prev => ({ ...prev, jobId }))
  }, [jobId])

  useEffect(() => {
    const fetchCustomers = async () => {
      setLoadingCustomers(true)
      try {
        const res = await apiClient.getAllCustomers()
        setCustomers(res.data.customers || [])
      } catch (err) {
        console.error("Error fetching customers:", err)
      } finally {
        setLoadingCustomers(false)
      }
    }
    fetchCustomers()
  }, [])


  console.log(suppliers, "supp")
    useEffect(() => {
      const fetchSuppliers = async () => {
        try {
          const response = await apiClient.getAllSuppliers();       
          setSuppliers(response.data.data);
        } catch (error) {
          console.error('Error fetching suppliers:', error);
        }
      };
  
      fetchSuppliers();
    }, []);

    console.log(products, "products");

useEffect(() => {
  const fetchProducts = async () => {
    try {
      const response = await apiClient.getAllProducts();
      setProducts(response.data.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  fetchProducts();
  fetchProductsList();
  fetchSuppliersList();
  fetchJobsList();
}, []);





  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent key={viewInvoiceData?.id || 'new-invoice'} className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Create New Invoice</DialogTitle>
          <DialogDescription>
            Create a comprehensive invoice for your project
          </DialogDescription>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6"
        >
        <Card className="bg-white shadow-lg border-2 border-primary/20">
                      {/* Invoice Type Selector */}
                      <div className="p-6 border-b border-gray-200 bg-gray-50">
                        <div className="flex items-center gap-4">
                          <Label className="text-primary font-semibold">Invoice Type:</Label>
                <div className="relative w-[250px]">
                          <Select 
                            value={inlineInvoiceData.invoiceType} 
                    onValueChange={(value) => setInlineInvoiceData(prev => ({ ...prev, invoiceType: value }))}
                          >
                    <SelectTrigger className="border-primary/30 focus:border-primary">
                      <SelectValue placeholder="Select invoice type..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Estimate">Estimate</SelectItem>
                              <SelectItem value="Downpayment Invoice">Downpayment Invoice</SelectItem>
                              <SelectItem value="Rough Invoice">Rough Invoice</SelectItem>
                              <SelectItem value="Progressive Invoice">Progressive Invoice</SelectItem>
                              <SelectItem value="Final Invoice">Final Invoice</SelectItem>
                      <SelectItem value="Custom">+ Add Custom</SelectItem>
                            </SelectContent>
                          </Select>
                </div>
                {inlineInvoiceData.invoiceType === 'Custom' && (
                  <div className="relative w-[300px]">
                    <Input
                      value={inlineInvoiceData.customInvoiceType}
                      onChange={(e) => setInlineInvoiceData(prev => ({ ...prev, customInvoiceType: e.target.value }))}
                      placeholder="Enter custom invoice type name..."
                      className="border-primary/30 focus:border-primary"
                    />
                  </div>
                )}
                        </div>
                      </div>

                      <div className="p-8">
                        {/* Header */}
              <div className="flex justify-between items-end mb-8">
                          <div className="flex-shrink-0">
                  <Image
                    src='/assets/logos/logo-jdp.png'
                    alt="logo"
                    width={168}
                    height={63}
                    className='w-[140px] '
                  />
                          </div>

                          <div className="text-right">
                  <h1 className="text-2xl font-bold mb-4">{inlineInvoiceData.invoiceType === 'Custom' ? inlineInvoiceData.customInvoiceType : inlineInvoiceData.invoiceType}</h1>
                            <div className="grid grid-cols-2">
                              <Label className="text-right bg-gray-600 text-white px-3 py-2 text-sm font-semibold">Date</Label>
                              <Input
                                value={inlineInvoiceData.date}
                                onChange={(e) => setInlineInvoiceData(prev => ({ ...prev, date: e.target.value }))}
                                className="px-3 py-2 text-sm"
                      readOnly={isViewMode}
                              />
                  </div>
                  {/* Show Estimate Number only in view mode */}
                  {isViewMode && (
                    <div className="grid grid-cols-2">
                              <Label className="text-right bg-gray-600 text-white px-3 py-2 text-sm font-semibold">
                                {inlineInvoiceData.invoiceType === 'Estimate' ? 'Estimate #' : 'Invoice #'}
                              </Label>
                              <div>
                                <Input
                          value={inlineInvoiceData.estimateNumber || viewInvoiceData?.invoice_number || ''}
                          className="px-3 py-2 text-sm"
                          disabled={true}
                        />
                      </div>
                    </div>
                  )}
                          </div>
                        </div>

                        {/* Job Selection */}
                        <div className="mb-6">
                          <Label className="block bg-gray-600 text-white px-3 py-2 mb-0 text-sm font-semibold">Select Job</Label>
                          <div className="border border-gray-300 p-4">
                            <Select 
                              value={inlineInvoiceData.jobId?.toString() || ''} 
                              onValueChange={(value) => {
                      if (!isViewMode) {
                                handleJobSelection(value)
                                setValidationErrors(prev => ({ ...prev, jobId: '' }))
                      }
                              }}
                    disabled={isViewMode}
                            >
                    <SelectTrigger className={`border-primary/30 focus:border-primary bg-white ${validationErrors.jobId ? 'border-red-500' : ''} ${isViewMode ? 'opacity-50' : ''}`}>
                                <SelectValue placeholder="Select a job..." />
                              </SelectTrigger>
                              <SelectContent>
                                {jobsList.length > 0 ? (
                                  jobsList.map((job: any) => (
                                    <SelectItem key={job.id} value={job.id.toString()}>
                                      #{job.id} - {job.title}
                                    </SelectItem>
                                  ))
                                ) : (
                                  <SelectItem value="none" disabled>No jobs available</SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                            {validationErrors.jobId && (
                              <p className="text-red-500 text-xs mt-1">{validationErrors.jobId}</p>
                            )}
                          </div>
                        </div>

              {/* Bill To Section */}
              <div className="mb-6">
                <div className="flex items-center justify-between bg-gray-600 text-white px-3 py-2 mb-0">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-6a1 1 0 00-1-1H9a1 1 0 00-1 1v6a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                    </svg>
                    <Label className="text-sm font-semibold">Bill To (Billing Address)</Label>
                  </div>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => setInlineInvoiceData(prev => ({ ...prev, billToAddressEnabled: !prev.billToAddressEnabled }))}
                      className={`mr-2 px-3 py-1 rounded text-xs font-medium transition-colors ${inlineInvoiceData.billToAddressEnabled
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                    >
                      {inlineInvoiceData.billToAddressEnabled ? (
                        <>
                          <svg className="w-3 h-3 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                          Disable
                        </>
                      ) : (
                        <>
                          <svg className="w-3 h-3 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                          </svg>
                          Enable
                        </>
                      )}
                    </button>
                  </div>
                </div>
                {inlineInvoiceData.billToAddressEnabled && (
                  <Textarea
                    value={inlineInvoiceData.billToAddress || ''}
                    onChange={(e) => setInlineInvoiceData({ ...inlineInvoiceData, billToAddress: e.target.value })}
                    className="mt-0 border-0 rounded-none"
                    placeholder="Enter billing address (defaults to customer/supplier address, can be edited)"
                    rows={3}
                    readOnly={isViewMode}
                  />
                )}
                {!inlineInvoiceData.billToAddressEnabled && (
                  <div className="bg-gray-50 p-3 text-sm text-gray-600">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      This address defaults to the customer/supplier address but can be changed if billing address differs from job location
                    </div>
                  </div>
                )}
              </div>

                        {/* Customer Information */}
                        <div className="mb-6">
                <Label className="block bg-gray-600 text-white px-3 py-2 mb-0 text-sm font-semibold">Customer Name / Address</Label>
                          <div className="border border-gray-300 p-4 min-h-[120px]">

                            <Input
                    value={selectedJob?.type === 'contract-based' ? (selectedJob?.contractorName || selectedJob?.contractor?.name || inlineInvoiceData.customerName) : inlineInvoiceData.customerName}
                              onChange={(e) => setInlineInvoiceData(prev => ({ ...prev, customerName: e.target.value }))}
                              className="mb-2 border-0 p-0 focus-visible:ring-0"
                    placeholder={selectedJob?.type === 'contract-based' ? 'Contractor Name' : 'Customer Name'}
                              readOnly
                            />
                  <Textarea
                    value={selectedJob?.type === 'contract-based' ? (selectedJob?.contractorAddress || selectedJob?.contractor?.address || inlineInvoiceData.customerAddress) : inlineInvoiceData.customerAddress}
                    onChange={(e) => setInlineInvoiceData(prev => ({ ...prev, customerAddress: e.target.value }))}
                    className="border-0 p-0 resize-none focus-visible:ring-0"
                    rows={3}
                    placeholder={selectedJob?.type === 'contract-based' ? 'Contractor Address' : 'Customer Address'}
                    readOnly
                  />
                          </div>
                        </div>

                        {/* PO and Project */}
              <div className="mb-6">
                <div className="grid grid-cols-3 gap-0">
                            <Label className="bg-white border border-gray-300 px-3 py-2 text-center text-sm font-semibold">P.O. No.</Label>
                  <Label className="bg-gray-600 text-white px-3 py-2 text-center text-sm font-semibold">Project</Label>
                  <Label className="bg-white border border-gray-300 px-3 py-2 text-center text-sm font-semibold">Rep</Label>
                           </div>
                <div className="grid grid-cols-3 gap-0">
                            <div>
                              <Input
                                value={inlineInvoiceData.poNumber}
                      onChange={(e) => setInlineInvoiceData(prev => ({ ...prev, poNumber: e.target.value }))}
                      className="px-3 py-2 text-sm rounded-none border-t-0"
                                placeholder="PO Number"
                      readOnly={isViewMode}
                              />
                            </div>
                              <Input
                    value={inlineInvoiceData.project || ''}
                    onChange={(e) => setInlineInvoiceData(prev => ({ ...prev, project: e.target.value }))}
                    className="px-3 py-2 text-sm rounded-none border-t-0"
                    placeholder="Project"
                    readOnly={isViewMode}
                  />
                  <Input
                    value={inlineInvoiceData.rep}
                    onChange={(e) => setInlineInvoiceData(prev => ({ ...prev, rep: e.target.value }))}
                    className="px-3 py-2 text-sm rounded-none border-t-0"
                    placeholder="Rep"
                    readOnly={isViewMode}
                  />
                            </div>
                          </div>

              <div className="mb-6">
                <div className="grid grid-cols-3 gap-0">
                  <Label className="bg-white border border-gray-300 px-3 py-2 text-center text-sm font-semibold">Due Date</Label>
                  <Label className="bg-gray-600 text-white px-3 py-2 text-center text-sm font-semibold">Payment / Credits</Label>
                  <Label className="bg-white border border-gray-300 px-3 py-2 text-center text-sm font-semibold">Balance Due</Label>
                        </div>
                <div className="grid grid-cols-3 gap-0">
                  <div>
                            <Input
                      type="date"
                      value={inlineInvoiceData.dueDate}
                      onChange={(e) => setInlineInvoiceData(prev => ({ ...prev, dueDate: e.target.value }))}
                      className="px-3 py-2 text-sm rounded-none border-t-0"
                      readOnly={isViewMode}
                    />
                          </div>
                          <Input
                    value={inlineInvoiceData.paymentCredits}
                    onChange={(e) => setInlineInvoiceData(prev => ({ ...prev, paymentCredits: parseFloat(e.target.value) || 0 }))}
                    className="px-3 py-2 text-sm rounded-none border-t-0"
                    placeholder="Payment / Credits"
                    readOnly={isViewMode}
                  />
                          <Input
                    value={inlineInvoiceData.balanceDue}
                    onChange={(e) => setInlineInvoiceData(prev => ({ ...prev, balanceDue: e.target.value }))}
                    className="px-3 py-2 text-sm rounded-none border-t-0"
                    placeholder="Balance Due"
                    readOnly={isViewMode}
                          />
                        </div>
                      </div>

                        {/* Line Items Table */}
              <div className="mb-6 overflow-x-auto mt-4">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="bg-gray-600 text-white">
                                <th className="border border-gray-300 px-3 py-2 w-16 text-sm font-semibold">Qty</th>
                                <th className="border border-gray-300 px-3 py-2 w-48 text-sm font-semibold">Item</th>
                                <th className="border border-gray-300 px-3 py-2 text-sm font-semibold">Description</th>
                                <th className="border border-gray-300 px-3 py-2 w-28 text-sm font-semibold">Rate</th>
                                <th className="border border-gray-300 px-3 py-2 w-32 text-sm font-semibold">Estimated Price</th>
                                <th className="border border-gray-300 px-3 py-2 w-28 text-sm font-semibold">Total</th>
                                <th className="border border-gray-300 px-3 py-2 w-16"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {inlineInvoiceData.lineItems.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                  <td className="border border-gray-300 p-1">
                                    <Input
                                      type="number"
                                      value={item.qty}
                                      onChange={(e) => updateInvoiceLineItem(item.id, 'qty', parseFloat(e.target.value) || 0)}
                                      className="text-center border-0 p-2"
                                      min="0"
                            readOnly={isViewMode}
                                    />
                                  </td>
                                  <td className="border border-gray-300 p-1 relative">
                          {item.isCustomProduct ? (
                            <Input
                              value={item.item}
                              onChange={(e) => updateInvoiceLineItem(item.id, 'item', e.target.value)}
                              className="border-0 p-2"
                              placeholder="Enter custom item name..."
                              readOnly={isViewMode}
                            />
                          ) : (
                                    <div className="relative product-search-container">
                                      <Input
                                        value={item.item}
                                        onChange={(e) => {
                                  const value = e.target.value
                                  updateInvoiceLineItem(item.id, 'item', value)
                                  updateInvoiceLineItem(item.id, 'searchQuery', value)
                                          updateInvoiceLineItem(item.id, 'showSearchResults', true)
                                  // Direct API call on input change
                                  if (value && value.length > 2) {
                                    fetchProductsList(value)
                                  }
                                        }}
                                        onFocus={() => {
                                          if (item.item) {
                                            updateInvoiceLineItem(item.id, 'searchQuery', item.item)
                                            updateInvoiceLineItem(item.id, 'showSearchResults', true)
                                          }
                                        }}
                                        className="border-0 p-2 pr-8"
                                        placeholder="Search or enter product name..."
                                readOnly={isViewMode}
                                      />
                                      <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    </div>
                          )}
                          {!item.isCustomProduct && item.showSearchResults && item.searchQuery && (
                                      <div className="absolute z-50 w-full bg-white border border-gray-300 shadow-lg max-h-60 overflow-y-auto mt-1">
                                        {(() => {
                                          const filtered = getFilteredProducts(item.searchQuery || '')

                                          return (
                                            <>
                                              {filtered.length > 0 ? (
                                                filtered.map(product => (
                                                  <div
                                                    key={product.id}
                                                    onMouseDown={(e) => {
                                                      e.preventDefault()
                                                      selectProduct(item.id, product)
                                                    }}
                                                    className="p-3 hover:bg-primary/5 cursor-pointer border-b border-gray-100 transition-colors"
                                                  >
                                                    <div className="font-medium text-sm mb-1">{product.name}</div>
                                                    <div className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                                                      {product.description}
                                                    </div>
                                                    <div className="text-xs text-primary mt-2">
                                                      {product.jdpSKU} • ${product.jdpPrice.toFixed(2)}
                                                      {product.estimatedPrice && product.estimatedPrice > 0 && ` • Est: $${product.estimatedPrice.toFixed(2)}`}
                                                    </div>
                                                  </div>
                                                ))
                                              ) : (
                                                <div className="p-3">
                                                  <div className="text-sm text-muted-foreground mb-2">No products found</div>
                                                  <Button
                                                    size="sm"
                                                    onMouseDown={(e) => {
                                                      e.preventDefault()
                                                      addCustomProduct(item.id, item.searchQuery || '')
                                                    }}
                                                    className="w-full bg-primary hover:bg-primary/90"
                                                  >
                                                    <Plus className="h-3 w-3 mr-1" />
                                                    Add "{item.searchQuery}"
                                                  </Button>
                                                </div>
                                              )}
                                            </>
                                          )
                                        })()}
                                      </div>
                                    )}
                                  </td>
                                  <td className="border border-gray-300 p-1">
                                    <Textarea
                                      value={item.description}
                            onChange={(e) => {
                              const value = e.target.value
                              const words = value.trim().split(/\s+/).filter(word => word.length > 0)
                              if (words.length <= 200) {
                                updateInvoiceLineItem(item.id, 'description', value)
                              }
                            }}
                                      className="border-0 p-2 min-h-[80px] resize-none leading-relaxed"
                            placeholder="Enter product description (max 200 words)"
                                      rows={4}
                            readOnly={isViewMode}
                                    />
                          <div className="text-xs text-gray-500 mt-1 text-right">
                            {item.description ? item.description.trim().split(/\s+/).filter(word => word.length > 0).length : 0}/200 words
                          </div>
                                  </td>

                                  <td className="border border-gray-300 p-1">
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                                    <Input
                                      type="number"
                                      value={item.rate}
                                      onChange={(e) => updateInvoiceLineItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                              className="text-right border-0 p-2 pl-6"
                                      min="0"
                                      step="0.01"
                              readOnly={isViewMode}
                                    />
                          </div>
                                  </td>
                                  <td className="border border-gray-300 p-1">
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                                    <Input
                                      type="number"
                                      value={item.estimatedPrice || ""}
                                      onChange={(e) => updateInvoiceLineItem(item.id, 'estimatedPrice', parseFloat(e.target.value) || 0)}
                              className="text-right border-0 p-2 pl-6"
                                      min="0"
                                      step="0.01"
                                      placeholder="0.00"
                              readOnly={isViewMode}
                                    />
                          </div>
                                  </td>
                                  <td className="border border-gray-300 p-2 text-right">
                                    ${item.total.toFixed(2)}
                                  </td>
                                  <td className="border border-gray-300 p-1 text-center">
                                    {inlineInvoiceData.lineItems.length > 1 && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeInvoiceLineItem(item.id)}
                                        className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                              {/* Subtotal Row */}
                              <tr>
                      <td colSpan={5} className="border border-gray-300 p-2"></td>
                                <td className="border border-gray-300 p-2 text-right font-bold">
                                  ${calculateInvoiceSubtotal().toFixed(2)}
                                </td>
                                <td className="border border-gray-300 p-1"></td>
                              </tr>
                            </tbody>
                          </table>
                         <div className="flex justify-end mt-4">
                            <div className="text-right min-w-[200px]">
                              <div className="flex justify-between mb-2">
                                <span className="text-sm text-gray-700">Payments / Credits:</span>
                                <span className="text-sm text-gray-700">
                                  ${(inlineInvoiceData.paymentCredits || 0).toFixed(2)}
                                </span>
                              </div>
                              <div className="flex justify-between bg-gray-100 px-3 py-2 rounded">
                                <span className="font-bold text-sm text-gray-700">Balance Due:</span>
                                <span className="font-bold text-sm text-gray-700">
                                  ${parseFloat((inlineInvoiceData.balanceDue||0 ).toString()).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>


                {/* Add Buttons */}
                <div className="mt-4 flex gap-3">
                          <Button
                            onClick={addInvoiceLineItem}
                            variant="outline"
                    className="border-dashed border-2 border-primary text-primary hover:bg-primary/5"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Line Item
                          </Button>
                  <Button
                    onClick={addCustomLineItem}
                    variant="outline"
                    className="border-dashed border-2 border-green-500 text-green-600 hover:bg-green-50"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Custom
                  </Button>
                </div>
                          {validationErrors.lineItems && (
                            <p className="text-red-500 text-xs mt-2">{validationErrors.lineItems}</p>
                          )}
                        </div>

                        {/* Notes Section */}
                        <div className="mb-6 overflow-x-auto">
                          <table className="w-full border-collapse">
                            <tbody>
                              <tr>
                                <td className="border border-gray-300 p-3 bg-white text-sm" style={{ minHeight: '120px' }}>
                                  <Textarea
                                    value={inlineInvoiceData.notes}
                          onChange={(e) => {
                            const value = e.target.value
                            const words = value.trim().split(/\s+/).filter(word => word.length > 0)
                            if (words.length <= 200) {
                              setInlineInvoiceData(prev => ({ ...prev, notes: value }))
                            }
                          }}
                                    className="w-full min-h-[100px] border-0 p-0 focus-visible:ring-0 resize-none"
                                    placeholder="NOTES&#10;JDP WILL REQUIRE HALF DOWN UPON SIGNED ESTIMATE"
                          readOnly={isViewMode}
                                  />
                        <div className="text-xs text-gray-500 mt-1 text-right">
                          {inlineInvoiceData.notes ? inlineInvoiceData.notes.trim().split(/\s+/).filter(word => word.length > 0).length : 0}/200 words
                        </div>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {/* Footer disclaimer and Total */}
                        <div className="mb-6">
                          <div className="border border-gray-300 p-3 text-xs text-center bg-white">
                            <p>
                              JDP is not responsible for repair of lamps & landscaping, house owner utilities including
                              cables, sprinkler systems, television or telephone cables, etc. that may be cut or damaged
                              during installation. Price are subject to change prior to receipt of down payment.
                            </p>
                          </div>
                          <div className="flex justify-end mt-4">
                            <div className="text-right">
                              <div className="flex items-center gap-4">
                                <span className="text-xl font-bold">Total</span>
                                <span className="text-2xl font-bold">
                                  ${calculateInvoiceSubtotal().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>
                            </div>
                          </div>
                <div className='text-center text-sm text-blue-500 font-bold'>
                  <p>1432 Oakpointe Drive Waconia, MN 55387 paul@jdpelectric.us</p>
                        </div>
              </div>
              <div className="secnacher">
                {/* Customer Acceptance Section */}
                <div className="mt-8">
                  {/* Top separator line */}
                  <div className="border-t border-gray-300 mb-6"></div>

                  {/* Customer Acceptance Header */}
                  <div className="flex justify-between items-center mb-5">
                    <div className="flex flex-col">
                      <div className="text-sm font-medium text-gray-700 mb-1">Customer Acceptance</div>
                      <div className="text-sm font-medium text-gray-700">Authorized Signature</div>
                    </div>
                    <div className="text-sm font-medium text-gray-700">Date</div>
                  </div>

                  {/* Signature Fields */}
                  <div className="flex justify-between items-center mb-5">
                    <div className="flex flex-col w-3/5">
                      <div className="border-b border-gray-800 h-0.5 mb-2"></div>
                      <div className="text-xs text-gray-700 text-center">Signature</div>
                    </div>
                    <div className="flex flex-col w-1/3">
                      <div className="border-b border-gray-800 h-0.5 mb-2"></div>
                      <div className="text-xs text-gray-700 text-center">Date</div>
                    </div>
                  </div>

                  {/* Disclaimer Box */}
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mt-5">
                    <div className="text-xs text-gray-700 leading-relaxed">
                      By signing above, you agree to the terms and pricing outlined in this estimate. This becomes a binding agreement upon signature.
                    </div>
                  </div>
                </div>
              </div>

                      </div>

                      {/* Action Buttons */}
            {!isViewMode && (
                      <div className="border-t bg-gray-50 px-8 py-6">
                        <div className="flex items-center justify-between">
                          <Button
                            variant="outline"
                            onClick={() => {
                              onOpenChange(false)
                              setValidationErrors({})
                            }}
                            className="border-gray-300"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                          <div className="flex gap-3">
                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                              <Button
                                onClick={handleSaveInvoiceAsDraft}
                                variant="outline"
                                size="lg"
                                className="border-primary text-primary hover:bg-primary/5"
                        disabled={savingDraft || sendingInvoice}
                              >
                                <FileText className="h-5 w-5 mr-2" />
                        {savingDraft ? 'Saving...' : 'Save as Draft'}
                              </Button>
                            </motion.div>

                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                              <Button
                                onClick={handlePreviewAndSend}
                                size="lg"
                                className="bg-primary hover:bg-primary/90 text-white"
                        disabled={savingDraft || sendingInvoice}
                              >
                                <Eye className="h-5 w-5 mr-2" />
                        {sendingInvoice ? 'Sending...' : 'Preview & Send to Customer'}
                              </Button>
                            </motion.div>
                          </div>
                        </div>
                      </div>
            )}

            {/* View Mode - Only Close Button */}
            {isViewMode && (
              <div className="border-t bg-gray-50 px-8 py-6">
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    className="border-gray-300"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Close
                  </Button>
                  <div className="flex gap-3">
                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                              <Button
                                onClick={handleSaveInvoiceAsDraft}
                                variant="outline"
                                size="lg"
                                className="border-primary text-primary hover:bg-primary/5"
                        disabled={savingDraft || sendingInvoice}
                              >
                                <FileText className="h-5 w-5 mr-2" />
                        {savingDraft ? 'Saving...' : 'Save as Draft'}
                              </Button>
                            </motion.div>

                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                              <Button
                                onClick={handlePreviewAndSend}
                                size="lg"
                                className="bg-primary hover:bg-primary/90 text-white"
                        disabled={savingDraft || sendingInvoice}
                              >
                                <Eye className="h-5 w-5 mr-2" />
                        {sendingInvoice ? 'Sending...' : 'Preview & Send to Customer'}
                              </Button>
                            </motion.div>
                          </div>
                </div>
              </div>
            )}
                    </Card>
        </motion.div>
        {/* <div className="mb-6">
                          <div className="grid grid-cols-2 gap-0">
                            <Label className="bg-white border border-gray-300 px-3 py-2 text-center text-sm font-semibold">P.O. No.</Label>
                           </div>
                          <div className="grid grid-cols-2 gap-0">
                            <div>
                              <Input
                                value={inlineInvoiceData.poNumber}
                                onChange={(e) => {
                                  setInlineInvoiceData(prev => ({ ...prev, poNumber: e.target.value }))
                                  setValidationErrors(prev => ({ ...prev, poNumber: '' }))
                                }}
                                className={`px-3 py-2 text-sm rounded-none border-t-0 ${validationErrors.poNumber ? 'border-red-500' : ''}`}
                                placeholder="PO Number"
                              />
                              {validationErrors.poNumber && (
                                <p className="text-red-500 text-xs mt-1 px-2">{validationErrors.poNumber}</p>
                              )}
                            </div>
                            <div>
                              <Input
                                value={inlineInvoiceData.project}
                                onChange={(e) => {
                                  setInlineInvoiceData(prev => ({ ...prev, project: e.target.value }))
                                  setValidationErrors(prev => ({ ...prev, project: '' }))
                                }}
                                className={`px-3 py-2 text-sm rounded-none border-t-0 ${validationErrors.project ? 'border-red-500' : ''}`}
                                readOnly
                              />
                              {validationErrors.project && (
                                <p className="text-red-500 text-xs mt-1 px-2">{validationErrors.project}</p>
                              )}
                            </div>
                          </div>
                        </div> */}
        {/* Estimate Selection - Only show for payment invoices */}
        {/* {inlineInvoiceData.invoiceType !== 'Estimate' && (
                        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <Label className="text-primary font-semibold mb-2 block">Select Estimate</Label>
                          <Select 
                            value={selectedEstimateId || ''} 
                            onValueChange={(value) => handleEstimateSelection(value)}
                          >
                            <SelectTrigger className="border-primary/30 focus:border-primary bg-white">
                              <SelectValue placeholder="Select an estimate to link..." />
                            </SelectTrigger>
                            <SelectContent>
                              {getAvailableEstimates().map((estimate: any) => (
                                <SelectItem key={estimate.id} value={estimate.id}>
                                  {estimate.invoice_number} - {estimate.estimate_title} (${(estimate.total_amount || 0).toLocaleString()})
                                </SelectItem>
                              ))}
                              {getAvailableEstimates().length === 0 && (
                                <SelectItem value="none" disabled>No estimates available</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          {selectedEstimateId && (
                            <p className="text-sm text-muted-foreground mt-2">
                              Estimate Total: ${inlineInvoiceData.estimateTotal?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              {inlineInvoiceData.paymentHistory && inlineInvoiceData.paymentHistory.length > 0 && (
                                <> • Previous Payments: ${inlineInvoiceData.paymentHistory.reduce((sum, p) => sum + p.amount, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</>
                              )}
                            </p>
                          )}
                        </div>
                      )} */}


      </DialogContent>
    </Dialog>
  )
}