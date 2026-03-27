import { useEffect, useMemo, useRef, useState } from 'react'
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

interface CustomInvoiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  blueSheet: any
  // Optional explicit labor cost from caller (e.g. JobDetails)
  totalLaborCost?: number | null
  onInvoiceSaved?: (invoice: any) => void
  // Allow parent (BlueSheetApprovalDialog) to trigger "preview & send" flow
  registerPreviewAndSend?: (fn: () => Promise<void>) => void
  // Optional callback when preview+send completes successfully
  onDone?: () => void
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
  estimate_source_type:string

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

export const CustomInvoiceDialog = ({
  open,
  onOpenChange,
  blueSheet,
  totalLaborCost,
  onInvoiceSaved,
  registerPreviewAndSend,
  onDone,
}: CustomInvoiceDialogProps) => {
  // Derive viewInvoiceData and job list from blueSheet (custom invoice from bluesheet)
  const viewInvoiceData = useMemo(() => {
    if (!blueSheet) return null
    const job = blueSheet.job || {};    
    console.log(blueSheet.material_entries,"blueSheet.material_entries");
    
    const products = (blueSheet.material_entries || []).map((item: any, index: number) => ({
      id: item.product?.product_id || index,
      product_id: item?.product_id,
      product_name: item.material_name,
      description: item.product?.description || item.material_name,
      jdp_price: item.jdp_price || 0,
      unit_cost: item.unit_cost || 0,
      total_cost: item.total_cost ?? (item.material_used || 0) * (item.jdp_price || 0),
      stock_quantity: item.material_used || 0,
      supplier_id: item.product?.supplier_id ?? item.product?.suppliers?.id ?? 1,
      material_used:item.material_used,
      total_ordered:item.total_ordered
    }))
    const laborLabel = (blueSheet.total_labor_hours || '').toString().trim()
    // Derive labor cost from labor_entries so it reflects merged selections
    const laborEntriesTotalCost = (blueSheet.labor_entries ?? []).reduce(
      (sum: number, entry: any) => sum + (entry.total_cost || 0),
      0,
    )
    const laborCost = Number(totalLaborCost ?? laborEntriesTotalCost ?? blueSheet.total_labor_cost ?? 0)
    const normalizedLabor = laborLabel.toLowerCase()
    const isZeroLabor =
      !normalizedLabor ||
      /^0+$/.test(normalizedLabor) ||
      /^0+h0*m*$/.test(normalizedLabor) ||
      /^0+m$/.test(normalizedLabor)

    // NOTE: Labor total cost is handled separately for payloads and
    // the "Total Material + Labor" display. We deliberately do NOT
    // push a "Labor total cost" product into the products list here
    // so that the main material line items and subtotal only reflect
    // material items, not labor.
    const customerId = job.customer?.id ?? job.customer_id ?? (blueSheet as any).customer_id ?? null
    const contractorId = job.contractor?.id ?? job.contractor_id ?? (blueSheet as any).contractor_id ?? null
    return {
      id: blueSheet.id,
      job_id: blueSheet.job_id,
      job,
      customer: job.customer,
      contractor: job.contractor,
      estimate_title: job.job_title || '',
      invoice_number: `BS-${blueSheet.id}`,
      bill_to_address: job.bill_to_address || job.customer?.address || job.contractor?.address || '',
      po_number: `BS-${blueSheet.id}`,
      notes: blueSheet.notes || '',
      service_type: job.job_type,
      products,
      // allow upstream caller to pass custom_products (e.g. parsed from email)
      custom_products: (blueSheet as any).custom_products ?? undefined,
      estimate_date: new Date().toISOString().split('T')[0],
      customer_id: customerId != null ? Number(customerId) : undefined,
      contractor_id: contractorId != null ? Number(contractorId) : undefined,
      rep: (job as any).rep ?? '',
      due_date: (job as any).due_date ?? '',
      payment_credits: (job as any).payment_credits ?? 0,
      balance_due: (job as any).balance_due ?? '',
      labor_total_cost: laborCost,
      invoice_type: job.job_type === 'contract_based' ? 'contract_based' : 'service_based',
      email_address: job.customer?.email || job.bill_to_email || (job as any).email || '',
    }
  }, [blueSheet, totalLaborCost])

  // Reuse computed labor total from BlueSheet labor_entries outside the memo
  const laborEntriesTotalFromBlueSheet = useMemo(
    () =>
      (blueSheet?.labor_entries ?? []).reduce(
        (sum: number, entry: any) => sum + (entry.total_cost || 0),
        0,
      ),
    [blueSheet],
  )

  const jobId = blueSheet?.job_id
  const jobs = useMemo(() => {
    if (!viewInvoiceData) return []
    const j = blueSheet?.job || {}
    return [{
      ...j,
      id: blueSheet.job_id,
      title: j.job_title,
      customer_id: viewInvoiceData.customer_id ?? j.customer?.id ?? j.customer_id,
      contractor_id: viewInvoiceData.contractor_id ?? j.contractor?.id ?? j.contractor_id,
      type: j.job_type || j.type,
      email: j.customer?.email || j.bill_to_email || j.email,
    }]
  }, [blueSheet, viewInvoiceData])

  const isViewMode = false

  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)
  const [sendingInvoice, setSendingInvoice] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [localJobs, setLocalJobs] = useState<any[]>([]);
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
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [totalProductAmount, settotalProductAmount] = useState(0)

  // Refs to ensure we always read the latest typed values from the inputs
  const dueDateRef = useRef<HTMLInputElement | null>(null)
  const balanceDueRef = useRef<HTMLInputElement | null>(null)
  const repRef = useRef<HTMLInputElement | null>(null)
  const paymentCreditsRef = useRef<HTMLInputElement | null>(null)
  // If user edits/adds/removes line items, don't let viewInvoiceData effect overwrite them
  const hasUserTouchedLineItemsRef = useRef(false)
  // Always keep latest line items (avoid stale state at send-time)
  const lineItemsRef = useRef<any[]>([])

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
    // Pre-fill project with job name from BlueSheet
    project: blueSheet?.job?.job_title || '',
    jobId: jobId || blueSheet?.job_id || '',
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
      isCustomProduct: false,
      unit_cost:""
    }],
    notes: 'NOTES\nJDP WILL REQUIRE HALF DOWN UPON SIGNED ESTIMATE',
    signatureText: 'ACCEPTED BY________________DATE_____',
    invoiceType: 'Estimate',
    customInvoiceType: '',
    paymentPercentage: 0,
    estimateTotal: 0,
    paymentHistory: [] as any[]
  }) 

 useEffect(() => {
  console.log('inlineInvoiceData:11111111111', inlineInvoiceData)
 }, [inlineInvoiceData])

  useEffect(() => {
    lineItemsRef.current = inlineInvoiceData.lineItems
  }, [inlineInvoiceData.lineItems])
  // Update form when job is provided
  useEffect(() => {
    if (currentJob) {
      // Determine if it's contract-based
      const isContractBased = currentJob.type === 'contract_based' || currentJob.type === 'contract-based';

      // Get customer/contractor name and address
      let customerName = '';
      let customerAddress = '';

      if (isContractBased) {
        customerName = currentJob.contractorName ||
          currentJob.contractor?.contractor_name ||
          currentJob.contractor?.name ||
          currentJob.contractor?.full_name ||
          '';
        customerAddress = currentJob.contractorAddress ||
          currentJob.contractor?.address ||
          currentJob.location ||
          currentJob.address ||
          '';
      } else {
        customerName = currentJob.customerName ||
          currentJob.customer?.customer_name ||
          currentJob.customer?.name ||
          '';
        customerAddress = currentJob.location ||
          currentJob.address ||
          currentJob.customer?.address ||
          '';
      }

      setInlineInvoiceData(prev => ({
        ...prev,
        customerName: customerName,
        customerAddress: customerAddress,
        project: currentJob.title || '',
        jobId: currentJob.id || jobId
      }))
    }
  }, [currentJob, jobId])

  // Populate data from viewInvoiceData (used for preview/custom flows)
  useEffect(() => {
    if (viewInvoiceData) {
      console.log('Setting customer data:', {
        customer_name: viewInvoiceData?.contractor?.contractor_name,
        address: viewInvoiceData?.contractor?.address
      });

      const customerName = viewInvoiceData?.contractor?.contractor_name ?? viewInvoiceData?.customer?.customer_name;
      const customerAddress = viewInvoiceData?.contractor?.address ?? viewInvoiceData?.customer?.address;
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
            // Preserve user-edited values; only fall back to viewInvoiceData/defaults
            dueDate: prev.dueDate ||
              viewInvoiceData.due_date ||
              '',
            paymentCredits:
              prev.paymentCredits !== undefined && prev.paymentCredits !== null
                ? prev.paymentCredits
                : (viewInvoiceData.payment_credits || 0),
            balanceDue:
              prev.balanceDue !== '' && prev.balanceDue != null
                ? prev.balanceDue
                : (viewInvoiceData.balance_due || ''),
            notes: viewInvoiceData.notes || 'NOTES\nJDP WILL REQUIRE HALF DOWN UPON SIGNED ESTIMATE',
            invoiceType: viewInvoiceData.invoice_type === 'estimate' ? 'Estimate' :
              viewInvoiceData.invoice_type === 'down_payment' ? 'Downpayment Invoice' :
                viewInvoiceData.invoice_type === 'proposal_invoice' ? 'Rough Invoice' :
                  viewInvoiceData.invoice_type === 'progressive_invoice' ? 'Progressive Invoice' :
                    viewInvoiceData.invoice_type === 'final_invoice' ? 'Final Invoice' : 'Estimate',
            // Prefer custom_products (new API, not typed) and fall back to products (old API).
            // IMPORTANT: don't overwrite user-added/edited line items.
            lineItems: hasUserTouchedLineItemsRef.current
              ? prev.lineItems
              : (((viewInvoiceData as any).custom_products) ?? viewInvoiceData.products)?.map((product: any, index: number) => {
                
                  const qty = Number(product.stock_quantity) || 1
                  const rate = Number(product.jdp_price || 0);
                  const unit_cost = Number(product.unit_cost || 0);
                  const total = Number(product.total_cost || rate * qty || 0);
                  console.log(product,"productttt");
                  return {
                    id: `item-${index}`,
                    productId: product.product_id,
                    qty,
                    item: product.product_name || product.name || '',
                    description: product.description || '',
                    rate,
                    unit_cost,
                    estimatedPrice: Number(product.estimated_price || 0),
                    total,
                    searchQuery: '',
                    showSearchResults: false,
                    supplierId: product.supplier_id || 1,
                    // backend flag is is_custom; keep boolean and map to frontend key
                    isCustomProduct: product.is_custom === true,
                    material_used:product.material_used,
                    total_ordered:product.total_ordered
                  }
                }) || [{
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
                  isCustomProduct: false,
                  uni_cost :0,
                  material_used:"",
                  total_ordered:""
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
  }, [viewInvoiceData])

  // Seed jobsList and auto-select the only job (CustomInvoice: single job from blueSheet, keep disabled)
  useEffect(() => {
    if (jobs && jobs.length > 0) {
      setJobsList(jobs)
      setSelectedJob(jobs[0])
      setInlineInvoiceData(prev => ({ ...prev, jobId: jobs[0].id ?? blueSheet?.job_id }))
    }
  }, [jobs, blueSheet?.job_id])




  const itemsTotal = newInvoice.items?.reduce((sum, i) => sum + i.total_cost, 0) || 0
  const laborTotal = newInvoice.labor?.reduce((sum, l) => sum + l.total_cost, 0) || 0
  const additionalTotal = newInvoice.additionalCosts?.reduce((sum, c) => sum + c.amount, 0) || 0

  const subtotal = itemsTotal + laborTotal + additionalTotal;
  const taxAmount = subtotal * (newInvoice.taxRate || 0);
  const totalAmount = subtotal + taxAmount;
console.log(totalAmount,"amounttt");

  // Invoice Helper Functions
  const calculateInvoiceSubtotal = () => {
    return inlineInvoiceData.lineItems.reduce((sum, item) => sum + item.total, 0)
  }

  

  const updateInvoiceLineItem = (itemId: string, field: string, value: any) => {
    hasUserTouchedLineItemsRef.current = true
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
    hasUserTouchedLineItemsRef.current = true
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
        isCustomProduct: false,
        unit_cost:''
      }]
    }))
  }

  const removeInvoiceLineItem = (itemId: string) => {
    hasUserTouchedLineItemsRef.current = true
    setInlineInvoiceData(prev => ({
      ...prev,
      lineItems: prev.lineItems.filter(item => item.id !== itemId)
    }))
  }

   const getFilteredProducts = (query: string) => {
  if (!query) return []
  return productsList   
}

  const selectProduct = (itemId: string, product: any) => {
    hasUserTouchedLineItemsRef.current = true
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
            // Selected from search -> not custom and keep product reference
            productId: product.id,
            description: product.description || '',
            rate: rate,
            estimatedPrice: estimatedPrice,
            total: (item.qty || 1) * priceToUse,
            showSearchResults: false,
            searchQuery: '',
            supplierId: product.supplierId || selectedSupplierId || 1,
            isCustomProduct: false,
          }
        }
        return item
      })
    }))
  }

  const addCustomProduct = (itemId: string, productName: string) => {
    hasUserTouchedLineItemsRef.current = true
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
    hasUserTouchedLineItemsRef.current = true
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
        isCustomProduct: true,
        unit_cost:''
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

   

  const handlePreviewAndSend = async () => {
    // Validation
    const errors: Record<string, string> = {}
    
    // Ensure project uses job title as fallback
    const effectiveProject = inlineInvoiceData.project || blueSheet?.job?.job_title || ''
    if (!effectiveProject) {
      errors.project = 'Project field is required'
    }

    // Read the very latest values from inputs (in case state is slightly behind)
    const latestDueDate = dueDateRef.current?.value ?? inlineInvoiceData.dueDate
    const latestBalanceDue = balanceDueRef.current?.value ?? inlineInvoiceData.balanceDue
    const latestRep = repRef.current?.value ?? inlineInvoiceData.rep
    const latestPaymentCreditsRaw = paymentCreditsRef.current?.value
    const latestPaymentCredits =
      latestPaymentCreditsRaw !== undefined && latestPaymentCreditsRaw !== null && latestPaymentCreditsRaw !== ''
        ? parseFloat(latestPaymentCreditsRaw) || 0
        : inlineInvoiceData.paymentCredits
    const latestLineItems = lineItemsRef.current?.length
      ? lineItemsRef.current
      : inlineInvoiceData.lineItems

    // Use an "effective" invoice data snapshot so we don't depend on async state updates
    const effectiveInlineInvoiceData = {
      ...inlineInvoiceData,
      project: effectiveProject || inlineInvoiceData.project || '',
      dueDate: latestDueDate,
      balanceDue: latestBalanceDue,
      rep: latestRep,
      paymentCredits: latestPaymentCredits,
      lineItems: latestLineItems,
    }


    // Consider either explicit invoice line items OR existing BlueSheet materials as valid "items"
    const hasInvoiceLineItems =
      latestLineItems.length > 0 &&
      latestLineItems.some(item => !!item.item)

    const hasBlueSheetMaterials =
      Array.isArray(blueSheet?.material_entries) &&
      blueSheet.material_entries.length > 0

    if (!hasInvoiceLineItems && !hasBlueSheetMaterials) {
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
      const subtotal = calculateInvoiceSubtotal();
      console.log(subtotal,"subtotalsubtotalsubtotal");
      

      // Build customProducts primarily from dialog line items.
      // If no line items are present, fall back to BlueSheet material_entries.
      const nonEmptyLineItems = effectiveInlineInvoiceData.lineItems.filter(
        (item) => String(item.item || "").trim().length > 0,
      )

      const customProducts: any[] = []

      if (nonEmptyLineItems.length > 0) {
        // Use line items (these already include the BlueSheet items + any user-added rows)
        for (const item of nonEmptyLineItems) {
          
          const treatedAsCustom =
            item.isCustomProduct === true || !item.productId
         const base: any = {
           ...(item.productId && {
             product_id: item.productId,
           }),

           product_name: item.item,
           description: item.description || "",
           supplier_id: item.supplierId || selectedSupplierId || 1,
           supplier_sku: String(item.item).substring(0, 10),
           jdp_sku: `JDP-${Date.now()}-${Math.random()
             .toString(36)
             .substring(2, 9)}`,
           stock_quantity: item.qty,
           unit: "unit",
           job_id: Number(effectiveInlineInvoiceData.jobId),
           unit_cost: item.unit_cost || 0,
           jdp_price: item.rate,
           estimated_price: item.estimatedPrice || 0,
           total_cost: item.total,
           is_custom: treatedAsCustom,
           material_used:item.material_used,
           total_ordered:item.total_ordered
         };

          // Include product id only for searched/selected products
          if (!treatedAsCustom && item.productId) {
            base.id = item.productId
          }

          customProducts.push(base)
        }
      } else {
        // Fallback: map from BlueSheet material_entries
        const materials = Array.isArray(blueSheet?.material_entries)
          ? blueSheet.material_entries
          : []
        for (const m of materials) {
          const base: any = {
            product_name: m.material_name,
            description: m.product?.description || m.material_name || "",
            supplier_id:
              m.product?.supplier_id ?? m.product?.suppliers?.id ?? 1,
            supplier_sku: m.product?.supplier_sku || "",
            jdp_sku:
              m.product?.jdp_sku ||
              `JDP-${Date.now()}-${Math.random()
                .toString(36)
                .substring(2, 9)}`,
            stock_quantity: m.material_used || m.total_ordered || 1,
            unit: m.unit || "unit",
            job_id: Number(effectiveInlineInvoiceData.jobId),
            unit_cost: m.unit_cost || 0,
            jdp_price: m.jdp_price || 0,
            estimated_price: m.unit_cost || 0,
            total_cost:
              m.total_cost ?? (m.material_used || 0) * (m.unit_cost || 0),
            is_custom: false,
          }

          if (m.product?.id) {
            base.id = m.product.id
          }

          customProducts.push(base)
        }
      }

      // // Also add a dedicated custom product for total labor cost (from BlueSheet labor entries)
      // if (laborEntriesTotalFromBlueSheet > 0) {
      //   customProducts.push({
      //     product_name: 'Labor total cost',
      //     description: 'Total labor cost from BlueSheet labor entries',
      //     supplier_id: selectedSupplierId || 1,
      //     supplier_sku: 'LABOR_TOTAL',
      //     jdp_sku: `JDP-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      //     stock_quantity: 1,
      //     unit: 'unit',
      //     job_id: Number(effectiveInlineInvoiceData.jobId),
      //     unit_cost: laborEntriesTotalFromBlueSheet,
      //     jdp_price: laborEntriesTotalFromBlueSheet,
      //     estimated_price: laborEntriesTotalFromBlueSheet,
      //     total_cost: laborEntriesTotalFromBlueSheet,
      //     is_custom: true,
      //   })
      // }

      // CustomInvoiceDialog: always use viewInvoiceData (from blueSheet) for customer_id/contractor_id
      let customerId: number | null = null;
      let contractorId: number | null = null;
      let isContractBased = false;
      if (viewInvoiceData) {
        isContractBased = viewInvoiceData.service_type === 'contract_based' ||
          viewInvoiceData.job?.job_type === 'contract_based' || (viewInvoiceData.contractor_id != null);
        customerId = viewInvoiceData.customer_id != null ? Number(viewInvoiceData.customer_id) : viewInvoiceData.customer?.id != null ? Number(viewInvoiceData.customer.id) : null;
        contractorId = viewInvoiceData.contractor_id != null ? Number(viewInvoiceData.contractor_id) : viewInvoiceData.contractor?.id != null ? Number(viewInvoiceData.contractor.id) : null;
      }
      const bluesheetIds = blueSheet.length > 0
        ? blueSheet.map((bs: any) => bs.job_bluesheet_id || bs.bluesheet_id || bs.bluesheetId || bs.id)
        : [blueSheet.job_bluesheet_id || blueSheet.bluesheet_id || blueSheet.bluesheetId || blueSheet.id]
      const emailAddress =
        viewInvoiceData?.contractor?.email ||
        viewInvoiceData?.customer?.email ||
        viewInvoiceData?.email_address ||
        currentJob?.email ||
        ""

      if (!emailAddress) {
        toast.error("Customer/Contractor email is missing.")
        setSendingInvoice(false)
        return
      }

     const materialTotal = customProducts.reduce(
       (sum, product) => sum + Number(product.total_cost || 0),
       0,
     );

     const laborTotal = Number(laborEntriesTotalFromBlueSheet || 0);

     const payload: any = {
       job_id: Number(effectiveInlineInvoiceData.jobId),
       estimate_title:
         effectiveInlineInvoiceData.project ||
         currentJob?.title ||
         blueSheet?.job?.job_title ||
         "",
       priority: "medium",
       service_type: isContractBased ? "contract_based" : "service_based",
       email_address: emailAddress,
       estimate_date: effectiveInlineInvoiceData.date,
       bluesheet_ids: bluesheetIds,
       po_number: effectiveInlineInvoiceData.poNumber || "",
       rep: effectiveInlineInvoiceData.rep || "",
       due_date: effectiveInlineInvoiceData.dueDate || "",
       payment_credits: effectiveInlineInvoiceData.paymentCredits || 0,
       balance_due: effectiveInlineInvoiceData.balanceDue || "",
       bill_to_address: effectiveInlineInvoiceData.billToAddressEnabled
         ? effectiveInlineInvoiceData.billToAddress ||
           viewInvoiceData?.contractor?.address ||
           viewInvoiceData?.customer?.address ||
           ""
         : "",
       notes: effectiveInlineInvoiceData.notes || "",
       status: "sent",
       invoice_type: mapInvoiceTypeToAPI(
         effectiveInlineInvoiceData.invoiceType,
       ),
       invoice_source: "custom",
       custom_products: customProducts,
       estimate_source_type: blueSheet?.job?.estimated_cost
         ? "estimate_job"
         : "time_material_job",
       total_labor_cost: laborTotal,
       total_amount: materialTotal + laborTotal,
     };
      
      if (isContractBased && contractorId) payload.contractor_id = contractorId;
      if (customerId) payload.customer_id = customerId;

      console.log('Send invoice payload with IDs:', {
        customer_id: payload.customer_id,
        contractor_id: payload.contractor_id,
        isContractBased: isContractBased
      });

      const response = await apiClient.createEstimate(payload as any)
      toast.success('Invoice created successfully!')

      // Build line items for email from the same customProducts we just sent to backend
      const emailLineItems = customProducts.map(p => ({
        qty: p.stock_quantity || 1,
        item: p.product_name || '',
        description: p.description || '',
        rate: p.jdp_price || p.unit_cost || 0,
        total: p.total_cost || 0,
      }))
      console.log('3444444', inlineInvoiceData)
      // Send invoice to customer using estimate ID, with full material lines and the same inline snapshot
      await sendInvoiceToCustomer(response.data.id, emailLineItems, effectiveInlineInvoiceData)

      // Refresh the estimates list
      if (onInvoiceSaved) {
        onInvoiceSaved(payload)
      }

      // Close this dialog and parent (BlueSheetApprovalDialog) via onDone
      onOpenChange(false)
      if (onDone) {
        onDone()
      }

     
      setSelectedJob(null)
      setValidationErrors({})
    } catch (error) {
      console.error('Error sending invoice:', error)
      toast.error('Failed to send invoice')
    } finally {
      setSendingInvoice(false)
    }
  }


  // Send invoice to customer function
  const sendInvoiceToCustomer = async (
    invoiceId: number,
    lineItemsOverride?: { qty: number; item: string; description: string; rate: number; total: number }[],
    inlineInvoiceOverride?: any
  ) => {
    try {
      // CustomInvoiceDialog: always use viewInvoiceData (from blueSheet) for customer_id/contractor_id
      let customerId: number | null = null;
      let contractorId: number | null = null;
      let isContractBased = false;
      if (viewInvoiceData) {
        isContractBased = viewInvoiceData.service_type === 'contract_based' ||
          viewInvoiceData.job?.job_type === 'contract_based' ||
          (viewInvoiceData.contractor_id != null);
        customerId = viewInvoiceData.customer_id != null ? Number(viewInvoiceData.customer_id) : viewInvoiceData.customer?.id != null ? Number(viewInvoiceData.customer.id) : null;
        contractorId = viewInvoiceData.contractor_id != null ? Number(viewInvoiceData.contractor_id) : viewInvoiceData.contractor?.id != null ? Number(viewInvoiceData.contractor.id) : null;
      }
      if (!customerId && !contractorId) {
        toast.error('Customer/Contractor ID is missing. Cannot send invoice.');
        return;
      }
      
      // Prefer the latest snapshot passed from caller; otherwise derive from current state
      const baseInline = inlineInvoiceOverride || inlineInvoiceData;
      const effectiveInlineInvoiceData = {
        ...baseInline,
        project:
          baseInline.project ||
          viewInvoiceData?.estimate_title ||
          currentJob?.title ||
          blueSheet?.job?.job_title ||
          '',
      };

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
      let customerEmail =
        viewInvoiceData?.contractor?.email ||
        viewInvoiceData?.customer?.email ||
        viewInvoiceData?.email_address ||
        currentJob?.email ||
        'customer@example.com';
 
      let lineItemsSource: { qty: number; item: string; description: string; rate: number; total: number }[] = []
      if (lineItemsOverride && lineItemsOverride.length > 0) {
        lineItemsSource = lineItemsOverride
      } else {
        const customProducts = (viewInvoiceData as any)?.custom_products as any[] | undefined
        if (customProducts && customProducts.length > 0) {          
          lineItemsSource = customProducts.map((p: any) => {
            const qty = Number(p.stock_quantity) || 1
            const rate = Number(p.jdp_price || p.unit_cost || p.estimated_price || p.total_cost || 0)
            const total = Number(p.total_cost || rate * qty || 0)
            return {
              qty,
              item: p.product_name || p.name || '',
              description: p.description || '',
              rate,
              total,
            }
          })
        } else {
          lineItemsSource = effectiveInlineInvoiceData.lineItems.map((item: any) => ({
            qty: item.qty,
            item: item.item || '',
            description: item.description || '',
            rate: item.rate || 0,
            total: item.total || 0,
          }))
        }
      }

      const payload: any = {
        // Header details
        estimateNumber: effectiveInlineInvoiceData.estimateNumber || viewInvoiceData?.invoice_number || 'Draft',
        estimateDate: new Date(effectiveInlineInvoiceData.date || viewInvoiceData?.estimate_date || new Date().toISOString())
          .toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric',
          }),
        customerName:
          effectiveInlineInvoiceData.customerName ||
          viewInvoiceData?.contractor?.contractor_name ||
          viewInvoiceData?.customer?.customer_name ||
          'Customer',
        customerEmail: customerEmail,
        customerAddress:
          effectiveInlineInvoiceData.customerAddress ||
          viewInvoiceData?.contractor?.address ||
          viewInvoiceData?.customer?.address ||
          '',
        billToAddress: effectiveInlineInvoiceData.billToAddressEnabled
          ? (effectiveInlineInvoiceData.billToAddress ||
            viewInvoiceData?.bill_to_address ||
            effectiveInlineInvoiceData.customerAddress ||
            viewInvoiceData?.contractor?.address ||
            viewInvoiceData?.customer?.address ||
            '') 
          : '',
        poNumber: effectiveInlineInvoiceData.poNumber || viewInvoiceData?.po_number || '',
        project:
          effectiveInlineInvoiceData.project ||
          viewInvoiceData?.estimate_title ||
          currentJob?.title ||
          blueSheet?.job?.job_title ||
          '',
        rep: effectiveInlineInvoiceData.rep || viewInvoiceData?.rep || '',

        // ✅ Always use current inlineInvoiceData values
        dueDate: effectiveInlineInvoiceData.dueDate,
        paymentCredits: effectiveInlineInvoiceData.paymentCredits,
        balanceDue: effectiveInlineInvoiceData.balanceDue,

        lineItems: lineItemsSource.map((item) => ({
          qty: item.qty,
          item: item.item,
          description: item.description,
          rate: item.rate,
          total: item.total,
        })),
        notes: effectiveInlineInvoiceData.notes || '',
        signatureText: effectiveInlineInvoiceData.signatureText || '',
        invoiceType:
          effectiveInlineInvoiceData.invoiceType === 'Custom'
            ? effectiveInlineInvoiceData.customInvoiceType
            : effectiveInlineInvoiceData.invoiceType,
      
        // Summary numbers backend ko handle karne do
        subtotal: 0,
        total: 0,
      }

      // Add customer_id or contractor_id based on job type
      if (isContractBased && contractorId) {
        payload.contractor_id = contractorId;
      } else if (customerId) {
        payload.customer_id = customerId;
      }

      console.log('Sending invoice to customer with ID:', invoiceId)
      console.log('Payload:11111111111', payload)
      console.log('isContractBased:', isContractBased, 'customerId:', customerId, 'contractorId:', contractorId)

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
  // Expose handlePreviewAndSend to parent (e.g. BlueSheetApprovalDialog)
  useEffect(() => {
    if (registerPreviewAndSend) {
      registerPreviewAndSend(handlePreviewAndSend)
    }
  }, [registerPreviewAndSend])

 

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
 
  if (!blueSheet || !viewInvoiceData) return null;

  return (
    <div key={viewInvoiceData?.id || 'new-invoice'} className="w-full">
      {/* <DialogHeader>
          <DialogTitle>Create New Invoice</DialogTitle>
          <DialogDescription>
            Create a comprehensive invoice for your project
          </DialogDescription>
        </DialogHeader> */}

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

              {/* Job Selection - auto-selected from blueSheet, disabled */}
              <div className="mb-6">
                <Label className="block bg-gray-600 text-white px-3 py-2 mb-0 text-sm font-semibold">Job</Label>
                <div className="border border-gray-300 p-4">
                  <Select
                    value={String(blueSheet?.job_id || 'job')}
                    onValueChange={() => {}}
                    disabled={true}
                  >
                    <SelectTrigger className="border-primary/30 focus:border-primary bg-gray-50 cursor-not-allowed opacity-90">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={String(blueSheet?.job_id || 'job')}>
                        {blueSheet
                          ? `#${blueSheet.job_id} - ${blueSheet.job?.job_title || 'Job'}`
                          : 'Job'}
                      </SelectItem>
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

                  {(() => {
                    const jobType = selectedJob?.type || selectedJob?.job_type || selectedJob?.jobType
                    const isContractBased =
                      jobType === "contract_based" ||
                      jobType === "contract-based" ||
                      viewInvoiceData?.service_type === "contract_based" ||
                      viewInvoiceData?.job?.job_type === "contract_based" ||
                      viewInvoiceData?.contractor_id != null

                    const contractorName =
                      selectedJob?.contractorName ||
                      selectedJob?.contractor?.contractor_name ||
                      selectedJob?.contractor?.contractorName ||
                      selectedJob?.contractor?.name ||
                      selectedJob?.contractor?.full_name ||
                      viewInvoiceData?.contractor?.contractor_name ||
                      viewInvoiceData?.contractor?.company_name ||
                      ""

                    const contractorAddress =
                      selectedJob?.contractorAddress ||
                      selectedJob?.contractor?.address ||
                      viewInvoiceData?.contractor?.address ||
                      ""

                    const customerName =
                      inlineInvoiceData.customerName ||
                      viewInvoiceData?.customer?.customer_name ||
                      ""
                    const customerAddress =
                      inlineInvoiceData.customerAddress ||
                      viewInvoiceData?.customer?.address ||
                      ""

                    const displayName = isContractBased
                      ? (contractorName || customerName)
                      : customerName
                    const displayAddress = isContractBased
                      ? (contractorAddress || customerAddress)
                      : customerAddress

                    return (
                      <>
                        <Input
                          value={displayName}
                          onChange={(e) =>
                            setInlineInvoiceData((prev) => ({
                              ...prev,
                              customerName: e.target.value,
                            }))
                          }
                          className="mb-2 border-0 p-0 focus-visible:ring-0"
                          placeholder={isContractBased ? "Contractor Name" : "Customer Name"}
                          readOnly
                        />
                        <Textarea
                          value={displayAddress}
                          onChange={(e) =>
                            setInlineInvoiceData((prev) => ({
                              ...prev,
                              customerAddress: e.target.value,
                            }))
                          }
                          className="border-0 p-0 resize-none focus-visible:ring-0"
                          rows={3}
                          placeholder={isContractBased ? "Contractor Address" : "Customer Address"}
                          readOnly
                        />
                      </>
                    )
                  })()}
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
                  <div>
                    <Input
                      value={inlineInvoiceData.project || blueSheet?.job?.job_title || ''}
                      onChange={(e) => setInlineInvoiceData(prev => ({ ...prev, project: e.target.value }))}
                      className={`px-3 py-2 text-sm rounded-none border-t-0 ${validationErrors.project ? 'border-red-500' : ''}`}
                      placeholder="Project"
                      readOnly={isViewMode}
                    />
                    {validationErrors.project && (
                      <p className="text-xs text-red-500 mt-1">{validationErrors.project}</p>
                    )}
                  </div>
                  <Input
                    ref={repRef}
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
                      ref={dueDateRef}
                      value={inlineInvoiceData.dueDate}
                      onChange={(e) => setInlineInvoiceData(prev => ({ ...prev, dueDate: e.target.value }))}
                      className="px-3 py-2 text-sm rounded-none border-t-0"
                      readOnly={isViewMode}
                    />
                  </div>
                  <Input
                    ref={paymentCreditsRef}
                    value={inlineInvoiceData.paymentCredits}
                    onChange={(e) => setInlineInvoiceData(prev => ({ ...prev, paymentCredits: parseFloat(e.target.value) || 0 }))}
                    className="px-3 py-2 text-sm rounded-none border-t-0"
                    placeholder="Payment / Credits"
                    readOnly={isViewMode}
                  />
                  <Input
                    ref={balanceDueRef}
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
                                            {product.jdpSKU} â€¢ ${product.jdpPrice.toFixed(2)}
                                            {product.estimatedPrice && product.estimatedPrice > 0 && ` â€¢ Est: $${product.estimatedPrice.toFixed(2)}`}
                                          </div>
                                        </div>
                                      ))
                                    ) : (
                                      <div className="p-3">
                                        <div className="text-sm text-muted-foreground mb-2">No products found</div>
                                       <Button
                                          size="sm"
                                          onMouseDown={(e) => {
                                            e.preventDefault();
                                            addCustomProduct(item.id, item.searchQuery || "");
                                          }}
                                          className="w-full bg-white hover:bg-primary/90 flex items-start gap-2 text-left whitespace-normal break-words"
                                        >
                                          <Plus className="h-3 w-3 mt-[2px] shrink-0" />
                                          <span className="break-all">
                                            Add "{item.searchQuery}"
                                          </span>
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
                          <textarea
                            value={item.description}
                            onChange={(e) => {
                              updateInvoiceLineItem(item.id, 'description', e.target.value)
                            }}
                            className="border-0 p-2   w-full"
                            placeholder="Enter product description"
                            rows={4}
                            readOnly={isViewMode}
                          />
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
                    {/* Subtotal / Labor / Combined totals */}
                    <tr>
                      <td colSpan={5} className="border border-gray-300 p-2"></td>
                      <td className="border border-gray-300 p-2 text-right font-bold">
                        ${calculateInvoiceSubtotal().toFixed(2)}
                      </td>
                      <td className="border border-gray-300 p-1"></td>
                    </tr>
                    {typeof (viewInvoiceData as any).labor_total_cost === 'number' &&
                      (viewInvoiceData as any).labor_total_cost > 0 && (
                      <>
                        <tr>
                          <td colSpan={5} className="border border-gray-300 p-2 text-right font-medium text-sm text-gray-700">
                            Labor total cost:
                          </td>
                          <td className="border border-gray-300 p-2 text-right font-medium text-sm text-gray-700">
                            ${(viewInvoiceData as any).labor_total_cost.toFixed(2)}
                          </td>
                          <td className="border border-gray-300 p-1"></td>
                        </tr>
                        <tr>
                            <td colSpan={5} className="border border-gray-300 p-2 text-right font-bold text-sm text-emerald-700">
                              Total Material + Labor:
                            </td>
                            <td className="border border-gray-300 p-2 text-right font-bold text-sm text-emerald-700">
                              ${(calculateInvoiceSubtotal() + (viewInvoiceData as any).labor_total_cost).toFixed(2)}
                            </td>
                          <td className="border border-gray-300 p-1"></td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
                <div className="flex justify-end mt-4">
                  <div className="text-right min-w-[220px] space-y-1">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-700">Payments / Credits:</span>
                      <span className="text-sm text-gray-700">
                        ${(inlineInvoiceData.paymentCredits || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between bg-gray-100 px-3 py-2 rounded">
                      <span className="font-bold text-sm text-gray-700">Balance Due:</span>
                      <span className="font-bold text-sm text-gray-700">
                        ${parseFloat((inlineInvoiceData.balanceDue || 0).toString()).toFixed(2)}
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
                            setInlineInvoiceData(prev => ({ ...prev, notes: e.target.value }))
                          }}
                          className="w-full min-h-[100px] border-0 p-0 focus-visible:ring-0 resize-none"
                          placeholder="NOTES&#10;JDP WILL REQUIRE HALF DOWN UPON SIGNED ESTIMATE"
                          readOnly={isViewMode}
                        />
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
                  {/* <div className="text-right">
                    <div className="flex items-center gap-4">
                      <span className="text-xl font-bold">Total</span>
                      <span className="text-2xl font-bold">
                        ${calculateInvoiceSubtotal().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div> */}
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
                  {/* <Button
                    variant="outline"
                    onClick={() => {
                      onOpenChange(false)
                      setValidationErrors({})
                    }}
                    className="border-gray-300"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button> */}
                  <div className="flex gap-3">
                    {/* <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
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
                    </motion.div> */}

      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      {/* Send button moved to BlueSheetApprovalDialog */}
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
                                <> â€¢ Previous Payments: ${inlineInvoiceData.paymentHistory.reduce((sum, p) => sum + p.amount, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</>
                              )}
                            </p>
                          )}
                        </div>
                      )} */}
    </div>
  )
}
