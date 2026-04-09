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
import Image from 'next/image';
import InvoiceLineItemsManager from '../common/invoice-line-items/InvoiceLineItemsManager'
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
  onLineItemsSync?: (lineItems: any[]) => void
  invalidHeaderKeys?:string[]
  setInvalidHeaderKeys?: () => void;
  validateHeaderGroupsBeforeSubmit? :()=>void
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
  onLineItemsSync,
  invalidHeaderKeys,
  setInvalidHeaderKeys,
  validateHeaderGroupsBeforeSubmit
}: CustomInvoiceDialogProps) => {
  // Derive viewInvoiceData and job list from blueSheet (custom invoice from bluesheet)
  const viewInvoiceData = useMemo(() => {
    if (!blueSheet) return null
    const job = blueSheet.job || {};    
    console.log(blueSheet.material_entries,"blueSheet.material_entries");
    
    const products = (blueSheet.material_entries || []).map((item: any, index: number) => ({
      id: item.product?.product_id || index,
      materialEntryId: item?.id ?? null,
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
  const [totalProductAmount, settotalProductAmount] = useState(0);
  

  // Refs to ensure we always read the latest typed values from the inputs
  const dueDateRef = useRef<HTMLInputElement | null>(null)
  const balanceDueRef = useRef<HTMLInputElement | null>(null)
  const repRef = useRef<HTMLInputElement | null>(null)
  const paymentCreditsRef = useRef<HTMLInputElement | null>(null)
  // If user edits/adds/removes line items, don't let viewInvoiceData effect overwrite them
  const hasUserTouchedLineItemsRef = useRef(false)
  // Always keep latest line items (avoid stale state at send-time)
  const lineItemsRef = useRef<any[]>([]);
  

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
  });
   const [invalidLineItemIds, setInvalidLineItemIds] = useState<string[]>([]);
  


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
                : ((((viewInvoiceData as any).custom_products) ?? viewInvoiceData.products) || []).map(
                    (product: any, index: number) => {
                      const qty = Number(product.stock_quantity) || 1
                      const rate = Number(product.jdp_price || product.unit_cost || 0)
                      const estimatedPrice = Number(product.estimated_price || 0)
                      const total = Number(product.total_cost || qty * (estimatedPrice > 0 ? estimatedPrice : rate) || 0)
                      console.log(product,"product");
                      
                      return {
                        id: `item-${index}-${product.product_id ?? product.id ?? Math.random().toString(36).slice(2, 8)}`,
                        type: "item",
                        headerKey: null,
                        headerName: "",
                        // parentHeaderKey: product.parent_header_key || null,
                        parentHeaderName: product.parent_header_name || null,
                        productId: product.product_id ?? product.id ?? null,
                        qty,
                        item: product.product_name || product.name || "",
                        description: product.description || "",
                        rate,
                        estimatedPrice,
                        total,
                        searchQuery: "",
                        showSearchResults: false,
                        supplierId: product.supplier_id || 1,
                        isCustomProduct: product.is_custom === true,
                        material_used: product.material_used,
                        total_ordered: product.total_ordered,
                      }
                    }
                  )
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
    if (!query?.trim()) return [];

    const q = query.toLowerCase().trim();

    return productsList.filter((product: any) => {
      return (
        (product.name || "").toLowerCase().includes(q) ||
        (product.jdpSKU || "").toLowerCase().includes(q) ||
        (product.description || "").toLowerCase().includes(q)
      );
    });
  };

  // const selectProduct = (itemId: string, product: any) => {
  //   hasUserTouchedLineItemsRef.current = true
  //   setInlineInvoiceData(prev => ({
  //     ...prev,
  //     lineItems: prev.lineItems.map(item => {
  //       if (item.id === itemId) {
  //         const rate = product.jdpPrice || 0
  //         const estimatedPrice = product.estimatedPrice || 0
  //         // Use estimated price if available, otherwise use rate
  //         const priceToUse = estimatedPrice > 0 ? estimatedPrice : rate

  //         return {
  //           ...item,
  //           item: product.name,
  //           // Selected from search -> not custom and keep product reference
  //           productId: product.id,
  //           description: product.description || '',
  //           rate: rate,
  //           estimatedPrice: estimatedPrice,
  //           total: (item.qty || 1) * priceToUse,
  //           showSearchResults: false,
  //           searchQuery: '',
  //           supplierId: product.supplierId || selectedSupplierId || 1,
  //           isCustomProduct: false,
  //         }
  //       }
  //       return item
  //     })
  //   }))
  // }

  const selectProduct = (itemId: string, product: any) => {
  hasUserTouchedLineItemsRef.current = true;

  const currentItem = inlineInvoiceData.lineItems.find(
    (item: any) => item.id === itemId,
  );

  if (!currentItem) return;

  const currentHeaderKey = currentItem.parentHeaderKey || null;

  // duplicate check only inside same header group and by jdpSKU
  const isDuplicateInSameGroup = inlineInvoiceData.lineItems.some(
      (item: any) => {
        if (item.id === itemId) return false;
        if (item.type === "header") return false;

        return (
          item.parentHeaderKey === currentHeaderKey &&
          item.productId === product.id
        );
      },
    );

  if (isDuplicateInSameGroup) {
    toast(
      "This product is already added in this section. You can increase its quantity instead.",
      {
        duration: 3000,
      },
    );
    return;
  }

  setInlineInvoiceData((prev) => ({
    ...prev,
    lineItems: prev.lineItems.map((item: any) => {
      if (item.id === itemId) {
        const rate = Number(product.jdpPrice || 0);
        const estimatedPrice = Number(
          product.estimatedPrice || product.jdpPrice || 0,
        );
        const priceToUse = estimatedPrice > 0 ? estimatedPrice : rate;

        return {
          ...item,
          item: product.name || "",
          productId: product.id,
          estimate_product_id: product.id,
          description: product.description || "",
          rate,
          estimatedPrice,
          total: (item.qty || 1) * priceToUse,
          showSearchResults: false,
          searchQuery: "",
          supplierId: product.supplierId || selectedSupplierId || 1,
          isCustomProduct: false,
        };
      }
      return item;
    }),
  }));
};

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
    const setManagedLineItems = (updater: React.SetStateAction<any[]>) => {
      hasUserTouchedLineItemsRef.current = true;

      setInlineInvoiceData((prev) => {
        const nextLineItems =
          typeof updater === "function"
            ? (updater as (prevItems: any[]) => any[])(prev.lineItems)
            : updater;

        lineItemsRef.current = nextLineItems;

        if (onLineItemsSync) {
          onLineItemsSync(nextLineItems);
        }

        return {
          ...prev,
          lineItems: nextLineItems,
        };
      });
    };
    const fetchProductsList = async (searchQuery: string = "") => {
      try {
        const response = searchQuery
          ? await apiClient.searchProductsByQuery(searchQuery)
          : await apiClient.getAllProducts();

        const productsData = response.data?.products || response.data?.data || [];
        console.log(productsData,"productsData");
        
        const normalizedProducts = productsData.map((p: any) => ({
          id: p.id,
          productId: p.product_id ?? p.id,
          name: p.product_name || p.name || "",
          product_name: p.product_name || p.name || "",
          description: p.description || "",
          jdpSKU: p.jdp_sku || p.jdpSKU || "",
          jdp_sku: p.jdp_sku || p.jdpSKU || "",
          jdpPrice: Number(p.jdp_price || p.jdpPrice || p.unit_cost || 0),
          rate: Number(p.jdp_price || p.jdpPrice || p.unit_cost || 0),
          estimatedPrice: Number(p.estimated_price || p.estimatedPrice || 0),
          supplierId: p.supplier_id || p.supplierId || 1,
          supplier_id: p.supplier_id || p.supplierId || 1,
          unit_cost: Number(p.unit_cost || p.jdp_price || 0),
          raw: p,
          material_used: p.material_used,
          total_ordered: p.total_ordered,
        }));

        const finalProducts = searchQuery?.trim()
          ? normalizedProducts.filter((product: any) => {
              const q = searchQuery.toLowerCase();
              return (
                (product.name || "").toLowerCase().includes(q) ||
                (product.jdpSKU || "").toLowerCase().includes(q) ||
                (product.description || "").toLowerCase().includes(q)
              );
            })
          : normalizedProducts;

        setProductsList(finalProducts);
      } catch (error) {
        console.error("Error fetching products:", error);
        setProductsList([]);
      }
    };

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

  const validateLineItems = (lineItems: any[] = []) => {
    const invalidItems = lineItems.filter((row) => {
      if (row.type !== "item") return false;
  
      const name = String(row.item || row.product_name || "").trim();
      return !name;
    });
  
    if (invalidItems.length > 0) {
      setInvalidLineItemIds(invalidItems.map((row) => row.id));
      toast.error("Item's product_name is not allowed to be empty");
      return false;
    }
  
    setInvalidLineItemIds([]);
    return true;
  };

   

  const handlePreviewAndSend = async () => {
    const errors: Record<string, string> = {};

    const effectiveProject =
      inlineInvoiceData.project || blueSheet?.job?.job_title || "";

    if (!effectiveProject) {
      errors.project = "Project field is required";
    }

    const latestDueDate = dueDateRef.current?.value ?? inlineInvoiceData.dueDate;
    const latestBalanceDue =
      balanceDueRef.current?.value ?? inlineInvoiceData.balanceDue;
    const latestRep = repRef.current?.value ?? inlineInvoiceData.rep;
    const latestPaymentCreditsRaw = paymentCreditsRef.current?.value;
    const latestPaymentCredits =
      latestPaymentCreditsRaw !== undefined &&
      latestPaymentCreditsRaw !== null &&
      latestPaymentCreditsRaw !== ""
        ? parseFloat(latestPaymentCreditsRaw) || 0
        : inlineInvoiceData.paymentCredits;

    const latestLineItems =
      lineItemsRef.current?.length > 0
        ? lineItemsRef.current
        : inlineInvoiceData.lineItems;

    const effectiveInlineInvoiceData = {
      ...inlineInvoiceData,
      project: effectiveProject,
      dueDate: latestDueDate,
      balanceDue: latestBalanceDue,
      rep: latestRep,
      paymentCredits: latestPaymentCredits,
      lineItems: latestLineItems,
    };

    const validLineItems = latestLineItems.filter((item: any) => {
      return (
        item?.type !== "header" &&
        String(item?.item || "").trim() !== ""
      );
    });

    const hasBlueSheetMaterials =
      Array.isArray(blueSheet?.material_entries) &&
      blueSheet.material_entries.length > 0;

    if (validLineItems.length === 0 && !hasBlueSheetMaterials) {
      errors.lineItems = "Please add at least one product item with name";
    }
       
    if (!validateHeaderGroupsBeforeSubmit(inlineInvoiceData.lineItems)) {
      return;
    }
      if (!validateLineItems(inlineInvoiceData.lineItems)) return;

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast.error("Please fix the validation errors");
      return;
    }

 

    setValidationErrors({});
    setSendingInvoice(true);

    try {
      const customProducts: any[] = [];

      if (validLineItems.length > 0) {
        for (const item of validLineItems) {
          const treatedAsCustom =
            item.isCustomProduct === true || !item.productId;

          const sectionName =
            item.parentHeaderName || item.headerName || null;

          const base: any = {
            ...(item.productId && {
              product_id: item.productId,
            }),
            product_name: item.item,
            description: item.description || "",
            supplier_id: item.supplierId || selectedSupplierId || 1,
            supplier_sku: String(item.item || "").substring(0, 50),
            jdp_sku:
              item.jdpSKU ||
              `JDP-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            stock_quantity: Number(item.qty) || 1,
            unit: item.unit || "unit",
            job_id: Number(effectiveInlineInvoiceData.jobId),
            unit_cost: Number(item.unit_cost || item.rate || 0),
            jdp_price: Number(item.rate || 0),
            estimated_price: Number(item.estimatedPrice || 0),
            total_cost:
              Number(item.total || 0) ||
              (Number(item.qty) || 1) *
                Number(
                  item.estimatedPrice && Number(item.estimatedPrice) > 0
                    ? item.estimatedPrice
                    : item.rate || 0,
                ),
            is_custom: treatedAsCustom,

            // group/header support
            section_name: sectionName,
            section_type: sectionName ? "room_header" : null,
            // parent_header_key: item.parentHeaderKey || null,
            parent_header_name: item.parentHeaderName || null,

            material_used: item.material_used,
            total_ordered: item.total_ordered,
          };

          if (!treatedAsCustom && item.productId) {
            base.id = item.productId;
          }

          customProducts.push(base);
        }
      } else {
        const materials = Array.isArray(blueSheet?.material_entries)
          ? blueSheet.material_entries
          : [];

        for (const m of materials) {
          const sectionName =
            m.parent_header_name || m.section_name || null;

          const base: any = {
            product_name: m.material_name,
            description: m.product?.description || m.material_name || "",
            supplier_id: m.product?.supplier_id ?? m.product?.suppliers?.id ?? 1,
            supplier_sku: m.product?.supplier_sku || "",
            jdp_sku:
              m.product?.jdp_sku ||
              `JDP-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            stock_quantity: m.material_used || m.total_ordered || 1,
            unit: m.unit || "unit",
            job_id: Number(effectiveInlineInvoiceData.jobId),
            unit_cost: Number(m.unit_cost || 0),
            jdp_price: Number(m.jdp_price || 0),
            estimated_price: Number(m.estimated_price || m.unit_cost || 0),
            total_cost:
              Number(m.total_cost || 0) ||
              (Number(m.material_used || m.total_ordered || 1) *
                Number(m.unit_cost || 0)),
            is_custom: false,

            // group/header support
            section_name: sectionName,
            section_type: sectionName ? "room_header" : null,
            // parent_header_key: m.parent_header_key || null,
            parent_header_name: m.parent_header_name || null,
          };

          if (m.product?.id) {
            base.id = m.product.id;
            base.product_id = m.product.id;
          }

          customProducts.push(base);
        }
      }

      let customerId: number | null = null;
      let contractorId: number | null = null;
      let isContractBased = false;

      if (viewInvoiceData) {
        isContractBased =
          viewInvoiceData.service_type === "contract_based" ||
          viewInvoiceData.job?.job_type === "contract_based" ||
          viewInvoiceData.contractor_id != null;

        customerId =
          viewInvoiceData.customer_id != null
            ? Number(viewInvoiceData.customer_id)
            : viewInvoiceData.customer?.id != null
              ? Number(viewInvoiceData.customer.id)
              : null;

        contractorId =
          viewInvoiceData.contractor_id != null
            ? Number(viewInvoiceData.contractor_id)
            : viewInvoiceData.contractor?.id != null
              ? Number(viewInvoiceData.contractor.id)
              : null;
      }

      const bluesheetIds = Array.isArray(blueSheet)
        ? blueSheet.map(
            (bs: any) =>
              bs.job_bluesheet_id || bs.bluesheet_id || bs.bluesheetId || bs.id,
          )
        : [
            blueSheet.job_bluesheet_id ||
              blueSheet.bluesheet_id ||
              blueSheet.bluesheetId ||
              blueSheet.id,
          ];

      const emailAddress =
        viewInvoiceData?.contractor?.email ||
        viewInvoiceData?.customer?.email ||
        viewInvoiceData?.email_address ||
        currentJob?.email ||
        "";

      if (!emailAddress) {
        toast.error("Customer/Contractor email is missing.");
        setSendingInvoice(false);
        return;
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
          effectiveInlineInvoiceData.invoiceType === "Custom"
            ? effectiveInlineInvoiceData.customInvoiceType
            : effectiveInlineInvoiceData.invoiceType,
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

      const response = await apiClient.createEstimate(payload as any);
      toast.success("Invoice created successfully!");

      const emailLineItems = customProducts.map((p) => ({
        qty: p.stock_quantity || 1,
        item: p.product_name || "",
        description: p.description || "",
        rate: p.jdp_price || p.unit_cost || 0,
        total: p.total_cost || 0,
      }));

      await sendInvoiceToCustomer(
        response.data.id,
        emailLineItems,
        effectiveInlineInvoiceData,
      );

      if (onInvoiceSaved) {
        onInvoiceSaved(payload);
      }

      onOpenChange(false);
      if (onDone) {
        onDone();
      }

      setSelectedJob(null);
      setValidationErrors({});
    } catch (error) {
      console.error("Error sending invoice:", error);
      toast.error("Failed to send invoice");
    } finally {
      setSendingInvoice(false);
    }
  };

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

    const fetchProducts = async (searchQuery: string = "") => {
      await fetchProductsList(searchQuery);
    };
  useEffect(() => {
 

    fetchProducts();
    fetchProductsList();
    fetchSuppliersList();
    fetchJobsList();
  }, []);
 
  if (!blueSheet || !viewInvoiceData) return null;

  return (
    <div key={viewInvoiceData?.id || "new-invoice"} className="w-full">
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className="mb-4"
  >
    <Card className="bg-white shadow-lg border-2 border-primary/20 overflow-hidden">
      {/* Invoice Type Selector */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-3 flex-wrap">
          <Label className="text-primary font-semibold text-sm">
            Invoice Type:
          </Label>

          <div className="relative w-[220px]">
            <Select
              value={inlineInvoiceData.invoiceType}
              onValueChange={(value) =>
                setInlineInvoiceData((prev) => ({
                  ...prev,
                  invoiceType: value,
                }))
              }
            >
              <SelectTrigger className="h-9 border-primary/30 focus:border-primary">
                <SelectValue placeholder="Select invoice type..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Estimate">Estimate</SelectItem>
                <SelectItem value="Downpayment Invoice">
                  Downpayment Invoice
                </SelectItem>
                <SelectItem value="Rough Invoice">Rough Invoice</SelectItem>
                <SelectItem value="Progressive Invoice">
                  Progressive Invoice
                </SelectItem>
                <SelectItem value="Final Invoice">Final Invoice</SelectItem>
                <SelectItem value="Custom">+ Add Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {inlineInvoiceData.invoiceType === "Custom" && (
            <div className="relative w-[260px]">
              <Input
                value={inlineInvoiceData.customInvoiceType}
                onChange={(e) =>
                  setInlineInvoiceData((prev) => ({
                    ...prev,
                    customInvoiceType: e.target.value,
                  }))
                }
                placeholder="Enter custom invoice type name..."
                className="h-9 border-primary/30 focus:border-primary"
              />
            </div>
          )}
        </div>
      </div>

      <div className="max-h-[calc(90vh-132px)] overflow-y-auto">
        <div className="p-5">
          {/* Header */}
          <div className="flex justify-between items-end gap-4 mb-5">
            <div className="flex-shrink-0">
              <Image
                src="/assets/logos/logo-jdp.png"
                alt="logo"
                width={168}
                height={63}
                className="w-[120px]"
              />
            </div>

            <div className="text-right">
              <h1 className="text-xl font-bold mb-2">
                {inlineInvoiceData.invoiceType === "Custom"
                  ? inlineInvoiceData.customInvoiceType
                  : inlineInvoiceData.invoiceType}
              </h1>

              <div className="grid grid-cols-2">
                <Label className="text-right bg-gray-600 text-white px-3 py-2 text-xs font-semibold">
                  Date
                </Label>
                <Input
                  value={inlineInvoiceData.date}
                  onChange={(e) =>
                    setInlineInvoiceData((prev) => ({
                      ...prev,
                      date: e.target.value,
                    }))
                  }
                  className="h-9 px-3 py-2 text-sm rounded-none"
                  readOnly={isViewMode}
                />
              </div>

              {isViewMode && (
                <div className="grid grid-cols-2">
                  <Label className="text-right bg-gray-600 text-white px-3 py-2 text-xs font-semibold">
                    {inlineInvoiceData.invoiceType === "Estimate"
                      ? "Estimate #"
                      : "Invoice #"}
                  </Label>
                  <div>
                    <Input
                      value={
                        inlineInvoiceData.estimateNumber ||
                        viewInvoiceData?.invoice_number ||
                        ""
                      }
                      className="h-9 px-3 py-2 text-sm rounded-none"
                      disabled={true}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Job Selection - auto-selected from blueSheet, disabled */}
          <div className="mb-4">
            <Label className="block bg-gray-600 text-white px-3 py-2 text-xs font-semibold">
              Job
            </Label>
            <div className="border border-gray-300 p-3">
              <Select
                value={String(blueSheet?.job_id || "job")}
                onValueChange={() => {}}
                disabled={true}
              >
                <SelectTrigger className="h-9 border-primary/30 focus:border-primary bg-gray-50 cursor-not-allowed opacity-90">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={String(blueSheet?.job_id || "job")}>
                    {blueSheet
                      ? `#${blueSheet.job_id} - ${blueSheet.job?.job_title || "Job"}`
                      : "Job"}
                  </SelectItem>
                </SelectContent>
              </Select>

              {validationErrors.jobId && (
                <p className="text-red-500 text-xs mt-1">
                  {validationErrors.jobId}
                </p>
              )}
            </div>
          </div>

          {/* Bill To Section */}
          <div className="mb-4">
            <div className="flex items-center justify-between bg-gray-600 text-white px-3 py-2">
              <div className="flex items-center">
                <svg
                  className="w-4 h-4 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-6a1 1 0 00-1-1H9a1 1 0 00-1 1v6a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z"
                    clipRule="evenodd"
                  />
                </svg>
                <Label className="text-xs font-semibold">
                  Bill To (Billing Address)
                </Label>
              </div>

              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() =>
                    setInlineInvoiceData((prev) => ({
                      ...prev,
                      billToAddressEnabled: !prev.billToAddressEnabled,
                    }))
                  }
                  className={`mr-1 px-3 py-1 rounded text-xs font-medium transition-colors ${
                    inlineInvoiceData.billToAddressEnabled
                      ? "bg-red-100 text-red-700 hover:bg-red-200"
                      : "bg-green-100 text-green-700 hover:bg-green-200"
                  }`}
                >
                  {inlineInvoiceData.billToAddressEnabled ? (
                    <>
                      <svg
                        className="w-3 h-3 inline mr-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Disable
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-3 h-3 inline mr-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Enable
                    </>
                  )}
                </button>
              </div>
            </div>

            {inlineInvoiceData.billToAddressEnabled && (
              <Textarea
                value={inlineInvoiceData.billToAddress || ""}
                onChange={(e) =>
                  setInlineInvoiceData({
                    ...inlineInvoiceData,
                    billToAddress: e.target.value,
                  })
                }
                className="mt-0 border-0 rounded-none min-h-[76px]"
                placeholder="Enter billing address (defaults to customer/supplier address, can be edited)"
                rows={3}
                readOnly={isViewMode}
              />
            )}

            {!inlineInvoiceData.billToAddressEnabled && (
              <div className="bg-gray-50 px-3 py-2 text-xs text-gray-600">
                <div className="flex items-center">
                  <svg
                    className="w-4 h-4 mr-2 text-yellow-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  This address defaults to the customer/supplier address but can
                  be changed if billing address differs from job location
                </div>
              </div>
            )}
          </div>

          {/* Customer Information */}
          <div className="mb-4">
            <Label className="block bg-gray-600 text-white px-3 py-2 text-xs font-semibold">
              Customer Name / Address
            </Label>
            <div className="border border-gray-300 p-3 min-h-[92px]">
              {(() => {
                const jobType =
                  selectedJob?.type ||
                  selectedJob?.job_type ||
                  selectedJob?.jobType;
                const isContractBased =
                  jobType === "contract_based" ||
                  jobType === "contract-based" ||
                  viewInvoiceData?.service_type === "contract_based" ||
                  viewInvoiceData?.job?.job_type === "contract_based" ||
                  viewInvoiceData?.contractor_id != null;

                const contractorName =
                  selectedJob?.contractorName ||
                  selectedJob?.contractor?.contractor_name ||
                  selectedJob?.contractor?.contractorName ||
                  selectedJob?.contractor?.name ||
                  selectedJob?.contractor?.full_name ||
                  viewInvoiceData?.contractor?.contractor_name ||
                  viewInvoiceData?.contractor?.company_name ||
                  "";

                const contractorAddress =
                  selectedJob?.contractorAddress ||
                  selectedJob?.contractor?.address ||
                  viewInvoiceData?.contractor?.address ||
                  "";

                const customerName =
                  inlineInvoiceData.customerName ||
                  viewInvoiceData?.customer?.customer_name ||
                  "";
                const customerAddress =
                  inlineInvoiceData.customerAddress ||
                  viewInvoiceData?.customer?.address ||
                  "";

                const displayName = isContractBased
                  ? contractorName || customerName
                  : customerName;
                const displayAddress = isContractBased
                  ? contractorAddress || customerAddress
                  : customerAddress;

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
                      className="mb-1 h-8 border-0 p-0 focus-visible:ring-0"
                      placeholder={
                        isContractBased ? "Contractor Name" : "Customer Name"
                      }
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
                      className="border-0 p-0 resize-none focus-visible:ring-0 min-h-[64px]"
                      rows={3}
                      placeholder={
                        isContractBased
                          ? "Contractor Address"
                          : "Customer Address"
                      }
                      readOnly
                    />
                  </>
                );
              })()}
            </div>
          </div>

          {/* PO and Project */}
          <div className="mb-4">
            <div className="grid grid-cols-3 gap-0">
              <Label className="bg-white border border-gray-300 px-3 py-2 text-center text-xs font-semibold">
                P.O. No.
              </Label>
              <Label className="bg-gray-600 text-white px-3 py-2 text-center text-xs font-semibold">
                Project
              </Label>
              <Label className="bg-white border border-gray-300 px-3 py-2 text-center text-xs font-semibold">
                Rep
              </Label>
            </div>

            <div className="grid grid-cols-3 gap-0">
              <div>
                <Input
                  value={inlineInvoiceData.poNumber}
                  onChange={(e) =>
                    setInlineInvoiceData((prev) => ({
                      ...prev,
                      poNumber: e.target.value,
                    }))
                  }
                  className="h-9 px-3 py-2 text-sm rounded-none border-t-0"
                  placeholder="PO Number"
                  readOnly={isViewMode}
                />
              </div>

              <div>
                <Input
                  value={
                    inlineInvoiceData.project || blueSheet?.job?.job_title || ""
                  }
                  onChange={(e) =>
                    setInlineInvoiceData((prev) => ({
                      ...prev,
                      project: e.target.value,
                    }))
                  }
                  className={`h-9 px-3 py-2 text-sm rounded-none border-t-0 ${validationErrors.project ? "border-red-500" : ""}`}
                  placeholder="Project"
                  readOnly={isViewMode}
                />
                {validationErrors.project && (
                  <p className="text-xs text-red-500 mt-1">
                    {validationErrors.project}
                  </p>
                )}
              </div>

              <Input
                ref={repRef}
                value={inlineInvoiceData.rep}
                onChange={(e) =>
                  setInlineInvoiceData((prev) => ({
                    ...prev,
                    rep: e.target.value,
                  }))
                }
                className="h-9 px-3 py-2 text-sm rounded-none border-t-0"
                placeholder="Rep"
                readOnly={isViewMode}
              />
            </div>
          </div>

          <div className="mb-4">
            <div className="grid grid-cols-3 gap-0">
              <Label className="bg-white border border-gray-300 px-3 py-2 text-center text-xs font-semibold">
                Due Date
              </Label>
              <Label className="bg-gray-600 text-white px-3 py-2 text-center text-xs font-semibold">
                Payment / Credits
              </Label>
              <Label className="bg-white border border-gray-300 px-3 py-2 text-center text-xs font-semibold">
                Balance Due
              </Label>
            </div>

            <div className="grid grid-cols-3 gap-0">
              <div>
                <Input
                  type="date"
                  ref={dueDateRef}
                  value={inlineInvoiceData.dueDate}
                  onChange={(e) =>
                    setInlineInvoiceData((prev) => ({
                      ...prev,
                      dueDate: e.target.value,
                    }))
                  }
                  className="h-9 px-3 py-2 text-sm rounded-none border-t-0"
                  readOnly={isViewMode}
                />
              </div>

              <Input
                ref={paymentCreditsRef}
                value={inlineInvoiceData.paymentCredits}
                onChange={(e) =>
                  setInlineInvoiceData((prev) => ({
                    ...prev,
                    paymentCredits: parseFloat(e.target.value) || 0,
                  }))
                }
                className="h-9 px-3 py-2 text-sm rounded-none border-t-0"
                placeholder="Payment / Credits"
                readOnly={isViewMode}
              />

              <Input
                ref={balanceDueRef}
                value={inlineInvoiceData.balanceDue}
                onChange={(e) =>
                  setInlineInvoiceData((prev) => ({
                    ...prev,
                    balanceDue: e.target.value,
                  }))
                }
                className="h-9 px-3 py-2 text-sm rounded-none border-t-0"
                placeholder="Balance Due"
                readOnly={isViewMode}
              />
            </div>
          </div>

          {/* Line Items */}
          <div className="mb-4">
            <InvoiceLineItemsManager
              lineItems={inlineInvoiceData.lineItems}
              invalidHeaderKeys={invalidHeaderKeys}
              invalidLineItemIds={invalidLineItemIds}
              setInvalidLineItemIds={setInvalidLineItemIds}
              setInvalidHeaderKeys={setInvalidHeaderKeys}
              setLineItems={setManagedLineItems}
              selectedSupplierId={selectedSupplierId}
              fetchProducts={fetchProducts}
              getFilteredProducts={getFilteredProducts}
              onSelectProductData={(rowId, product) => {
                selectProduct(rowId, product);
              }}
            />
          </div>

          {/* Notes Section */}
          <div className="mb-4 overflow-x-auto">
            <table className="w-full border-collapse">
              <tbody>
                <tr>
                  <td
                    className="border border-gray-300 p-3 bg-white text-sm"
                    style={{ minHeight: "96px" }}
                  >
                    <Textarea
                      value={inlineInvoiceData.notes}
                      onChange={(e) => {
                        setInlineInvoiceData((prev) => ({
                          ...prev,
                          notes: e.target.value,
                        }));
                      }}
                      className="w-full min-h-[84px] border-0 p-0 focus-visible:ring-0 resize-none"
                      placeholder="NOTES&#10;JDP WILL REQUIRE HALF DOWN UPON SIGNED ESTIMATE"
                      readOnly={isViewMode}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Footer disclaimer and Total */}
          <div className="mb-4">
            <div className="border border-gray-300 px-3 py-2.5 text-xs text-center bg-white leading-5">
              <p>
                JDP is not responsible for repair of lamps & landscaping, house
                owner utilities including cables, sprinkler systems, television
                or telephone cables, etc. that may be cut or damaged during
                installation. Price are subject to change prior to receipt of
                down payment.
              </p>
            </div>

            <div className="text-center text-sm text-blue-500 font-bold mt-3">
              <p>
                1432 Oakpointe Drive Waconia, MN 55387 paul@jdpelectric.us
              </p>
            </div>
          </div>

          <div className="secnacher">
            <div className="mt-5">
              <div className="border-t border-gray-300 mb-4"></div>

              <div className="flex justify-between items-center mb-3">
                <div className="flex flex-col">
                  <div className="text-sm font-medium text-gray-700">
                    Customer Acceptance
                  </div>
                  <div className="text-sm font-medium text-gray-700">
                    Authorized Signature
                  </div>
                </div>
                <div className="text-sm font-medium text-gray-700">Date</div>
              </div>

              <div className="flex justify-between items-center mb-3">
                <div className="flex flex-col w-3/5">
                  <div className="border-b border-gray-800 h-0.5 mb-1.5"></div>
                  <div className="text-xs text-gray-700 text-center">
                    Signature
                  </div>
                </div>
                <div className="flex flex-col w-1/3">
                  <div className="border-b border-gray-800 h-0.5 mb-1.5"></div>
                  <div className="text-xs text-gray-700 text-center">Date</div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md px-3 py-2.5 mt-3">
                <div className="text-xs text-gray-700 leading-5">
                  By signing above, you agree to the terms and pricing outlined
                  in this estimate. This becomes a binding agreement upon
                  signature.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {!isViewMode && (
        <div className="sticky bottom-0 z-20 border-t bg-gray-50 px-5 py-3">
          <div className="flex items-center justify-end">
            <div className="flex gap-3">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Send button moved to BlueSheetApprovalDialog */}
              </motion.div>
            </div>
          </div>
        </div>
      )}
    </Card>
  </motion.div>
    </div>
  );
}
