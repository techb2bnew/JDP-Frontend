'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Separator } from '../ui/separator'
import { Textarea } from '../ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { toast } from 'sonner'
import { CustomInvoiceDialog } from './CustomInvoiceDialog'
import { useRouter } from 'next/navigation'
import {
  FileText,
  CheckSquare,
  AlertCircle,
  Download,
  Eye,
  RefreshCw,
  Mail,
  DollarSign,
  Package,
  Building,
  Calendar,
  ArrowRight,
  X,
  Edit,
  RotateCcw,
  Save,
  Plus,
  Minus,
  AlertTriangle,
  Info,
  Check,
  Send,
  ArrowLeft,
  Upload
} from 'lucide-react'
import { apiClient } from '@/utils/api'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip'

export interface BlueSheetItem {
  id: number
  job_id: number
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
  created_by_user: {
    id: number
    email: string
    full_name: string
  }
  labor_entries: any[]
  material_entries: any[]
  total_labor_hours?: string | null
  total_labor_cost?: number | null
}

interface SupplierInvoice {
  id: string
  poNumber: string
  invoiceNumber: string
  supplier: string
  amount: number
  date: string
  materials: Array<{
    name: string
    quantity: number
    unitPrice: number
    jdpPrice:number
    total: number
  }>
  status: 'received' | 'matched' | 'discrepancy'
}

interface MaterialComparison {
  blueSheetItem?: any
  supplierItem?: any
  status: 'match' | 'price_diff' | 'quantity_diff' | 'missing_in_supplier' | 'missing_in_bluesheet' | 'unused'
  differences: string[]
}

interface BlueSheetApprovalDialogProps {
  isOpen: boolean
  onClose: () => void
  blueSheet: BlueSheetItem | null
  selectedBlueSheets?: BlueSheetItem[]
  onApprovalComplete: (approvedItem: BlueSheetItem) => void
  selectedBlueSheetIds?: number[]
  onBluesheetsRefresh?: () => void | Promise<void>
  onEstimatesRefresh?: () => void | Promise<void>
}

export function BlueSheetApprovalDialog({
  isOpen,
  onClose,
  blueSheet,
  selectedBlueSheets = [],
  onApprovalComplete,
  selectedBlueSheetIds,
  onBluesheetsRefresh,
  onEstimatesRefresh,
}: BlueSheetApprovalDialogProps) {
  console.log('Dialog render', { isOpen, blueSheet })
  const [supplierInvoice, setSupplierInvoice] = useState<SupplierInvoice | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isAutoFetching, setIsAutoFetching] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [currentStep, setCurrentStep] = useState<'upload' | 'review'>('upload')
  const [isBlueSheetEditMode, setIsBlueSheetEditMode] = useState(false)
  const [isSupplierEditMode, setIsSupplierEditMode] = useState(false)
  const [editedBlueSheet, setEditedBlueSheet] = useState<BlueSheetItem | null>(null)
  const [editedSupplierInvoice, setEditedSupplierInvoice] = useState<SupplierInvoice | null>(null)
  const [isApproving, setIsApproving] = useState(false)
  const [isApprovingCustomer, setIsApprovingCustomer] = useState(false)
  const [isProceedingToReview, setIsProceedingToReview] = useState(false)
  const [isCustomInvoiceOpen, setIsCustomInvoiceOpen] = useState(true)
  const [isReviewSummaryOpen, setIsReviewSummaryOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [filteredProducts, setFilteredProducts] = useState<any[]>([])
  const [activeRow, setActiveRow] = useState<number | null>(null)
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null)
  // Reference to CustomInvoiceDialog's "preview & send" handler
  const previewAndSendRef = useRef<(() => Promise<void>) | null>(null);
  const registerPreviewAndSendStable = useCallback((fn: () => Promise<void>) => {
    previewAndSendRef.current = fn;
  }, []);
  const [invalidHeaderKeys, setInvalidHeaderKeys] = useState<string[]>([]);
  const clearInvalidHeaderKeys = () => setInvalidHeaderKeys([]);
  const [isSaving, setIsSaving] = useState(false);
  const [customInvoiceProcessing, setCustomInvoiceProcessing] = useState(false);
  const [selectedInvoiceType, setSelectedInvoiceType] = useState<string>("progressive_invoice");
  /** Review-step estimate notes (controlled); sent on QuickBooks save/send via handleFinalApproval. */
  const [invoiceApprovalNotes, setInvoiceApprovalNotes] = useState("");
  const invoiceApprovalNotesRef = useRef("");
  
  const estimateActionsDisabled =
    isSaving || isApproving || isApprovingCustomer || customInvoiceProcessing;
  const router = useRouter();
  console.log(invoiceApprovalNotesRef,"invoiceApprovalNotesRef");
  

  const getBlueSheetId = (bs: any): number | null => {
    const raw =
      bs?.id ??
      bs?.blueSheetId ??
      bs?.bluesheet_id ??
      bs?.blue_sheet_id ??
      null;
    const n = raw == null ? null : Number(raw);
    return n == null || Number.isNaN(n) ? null : n;
  };

  const getSelectedBlueSheetIds = (): number[] => {
    // Priority 1: explicit IDs array passed by caller (e.g. JobDetailsPage)
    if (Array.isArray(selectedBlueSheetIds) && selectedBlueSheetIds.length > 0) {
      return Array.from(new Set(selectedBlueSheetIds));
    }

    // Priority 2: extract IDs from selectedBlueSheets objects (e.g. ApprovalsPage)
    const idsFromSelection = Array.isArray(selectedBlueSheets)
      ? selectedBlueSheets
          .map((bs) => getBlueSheetId(bs))
          .filter((id): id is number => typeof id === "number")
      : [];

    const uniqueFromSelection = Array.from(new Set(idsFromSelection));
    if (uniqueFromSelection.length > 0) return uniqueFromSelection;

    // Fallback: single blueSheet prop
    const fallbackId = getBlueSheetId(blueSheet);
    return fallbackId != null ? Array.from(new Set([fallbackId])) : [];
  };

  console.log(getSelectedBlueSheetIds(),selectedBlueSheetIds,"getSelectedBlueSheetIds");
  

  // ─── Reset when dialog opens ───────────────────────────────────────────────
  useEffect(() => {
    if (isOpen && blueSheet) {
      setSupplierInvoice(null)
      setIsUploading(false)
      setIsAutoFetching(false)
      setUploadedFile(null)
      setCurrentStep('upload')
      setIsBlueSheetEditMode(false)
      setIsSupplierEditMode(false)
      setIsProceedingToReview(false)
      setEditedBlueSheet(JSON.parse(JSON.stringify(blueSheet))) // deep copy
      setEditedSupplierInvoice(null)
      setFilteredProducts([])
      setActiveRow(null)
      setCustomInvoiceProcessing(false)
      setSelectedInvoiceType("progressive_invoice")
      const seedNotes = String(blueSheet?.notes ?? "");
      setInvoiceApprovalNotes(seedNotes)
      invoiceApprovalNotesRef.current = seedNotes
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }, [isOpen, blueSheet]);

  useEffect(() => {
    invoiceApprovalNotesRef.current = String(invoiceApprovalNotes ?? "");
  }, [invoiceApprovalNotes]);

  const handleBackClick = () => {
  onClose();
};

const syncCustomInvoiceLineItemsToBlueSheet = (lineItems: any[]) => {
  setEditedBlueSheet((prev: any) => {
    if (!prev) return prev;

    const syncedMaterials = lineItems
      .filter(
        (item: any) =>
          item?.type !== "header" && String(item?.item || "").trim() !== ""
      )
      .map((item: any, index: number) => {
        // const parentHeaderKey =
        //   item.parentHeaderKey ??
        //   item.parent_header_key ??
        //   null;

        const parentHeaderName =
          item.parentHeaderName ??
          item.parent_header_name ??
          item.section_name ??
          item.headerName ??
          null;

        const existingMaterial =
          prev.material_entries?.find(
            (m: any) =>
              String(m.id) === String(item.materialEntryId) ||
              String(m.id) === String(item.id)
          ) || null;

        return {
          ...existingMaterial,

          id:
            item.materialEntryId ||
            (typeof item.id === "number" ? item.id : undefined) ||
            existingMaterial?.id ||
            `temp-material-${index}-${Math.random().toString(36).slice(2, 8)}`,

          material_name: item.item,
          unit: item.unit || existingMaterial?.unit || "piece",
          total_ordered: Number(
            item.total_ordered ??
              item.totalOrdered ??
              item.qty ??
              existingMaterial?.total_ordered ??
              1
          ),
          material_used: Number(
            item.material_used ??
              item.materialUsed ??
              item.qty ??
              existingMaterial?.material_used ??
              1
          ),
          unit_cost: Number(
            item.unit_cost ??
              item.unitCost ??
              item.rate ??
              existingMaterial?.unit_cost ??
              0
          ),
          total_cost:
            Number(item.total ?? existingMaterial?.total_cost ?? 0) ||
            Number(item.qty || 1) *
              Number(
                item.estimatedPrice && Number(item.estimatedPrice) > 0
                  ? item.estimatedPrice
                  : item.rate ??
                      item.unit_cost ??
                      existingMaterial?.unit_cost ??
                      0
              ),

          supplier_order_id:
            item.supplier_order_id || existingMaterial?.supplier_order_id || "",
          return_to_warehouse:
            item.return_to_warehouse ??
            existingMaterial?.return_to_warehouse ??
            false,
          date:
            item.date ||
            existingMaterial?.date ||
            new Date().toISOString().split("T")[0],

          product_id:
            item.productId ??
            item.product_id ??
            existingMaterial?.product_id ??
            null,

          supplier_id:
            item.supplierId ??
            item.supplier_id ??
            existingMaterial?.supplier_id ??
            null,

          jdp_sku:
            item.jdpSKU ||
            item.jdp_sku ||
            existingMaterial?.jdp_sku ||
            "",

          section_name: parentHeaderName || null,
          section_type: parentHeaderName ? "room_header" : null,
          // parent_header_key: parentHeaderKey,
          parent_header_name: parentHeaderName,

          is_custom:
            item.isCustomProduct === true ||
            item.is_custom === true ||
            !(item.productId ?? item.product_id),

          product:
            item.productId || item.product_id
              ? {
                  ...(existingMaterial?.product || {}),
                  id: item.productId ?? item.product_id,
                  supplier_id:
                    item.supplierId ??
                    item.supplier_id ??
                    existingMaterial?.product?.supplier_id ??
                    null,
                  jdp_sku:
                    item.jdpSKU ||
                    item.jdp_sku ||
                    existingMaterial?.product?.jdp_sku ||
                    "",
                  description:
                    item.description ||
                    existingMaterial?.product?.description ||
                    "",
                }
              : existingMaterial?.product || null,
        };
      });

    const newTotal = syncedMaterials.reduce(
      (sum: number, item: any) => sum + Number(item.total_cost || 0),
      0
    );

    return {
      ...prev,
      material_entries: syncedMaterials,
      total_cost: newTotal,
    };
  });
};

  useEffect(() => {
    if (blueSheet && !editedBlueSheet) {
      setEditedBlueSheet(JSON.parse(JSON.stringify(blueSheet)))
    }
  }, [blueSheet, editedBlueSheet])

  useEffect(() => {
    if (supplierInvoice && !editedSupplierInvoice) {
      setEditedSupplierInvoice({ ...supplierInvoice })
    }
  }, [supplierInvoice, editedSupplierInvoice])

  // Must be before early return so hooks order is stable
  const currentBlueSheet = editedBlueSheet || blueSheet
  const currentSupplierInvoice = editedSupplierInvoice || supplierInvoice
  const comparisonPairs = React.useMemo(() => {
    if (!currentBlueSheet?.material_entries) return []
    const bsItems = currentBlueSheet.material_entries || []
    const supItems = currentSupplierInvoice?.materials || []
    const usedSupIdx = new Set<number>()
    const pairs: Array<{ bs?: any; bsIdx?: number; sup?: any; supIdx?: number }> = []
    bsItems.forEach((bsItem: any, bsIdx: number) => {
      let matchedSupIdx = -1, score = 0
      supItems.forEach((supItem: any, supIdx: number) => {
        if (usedSupIdx.has(supIdx)) return
        const exact = bsItem.material_name?.toLowerCase() === supItem.name?.toLowerCase()
        const partial =
          bsItem.material_name?.toLowerCase().includes(supItem.name?.toLowerCase()) ||
          supItem.name?.toLowerCase().includes(bsItem.material_name?.toLowerCase())
        if (exact && score < 100) { matchedSupIdx = supIdx; score = 100 }
        else if (partial && score < 80) { matchedSupIdx = supIdx; score = 80 }
      })
      if (matchedSupIdx >= 0) {
        usedSupIdx.add(matchedSupIdx)
        pairs.push({ bs: bsItem, bsIdx, sup: supItems[matchedSupIdx], supIdx: matchedSupIdx })
      } else {
        pairs.push({ bs: bsItem, bsIdx })
      }
    })
    supItems.forEach((sup: any, supIdx: number) => {
      if (!usedSupIdx.has(supIdx)) pairs.push({ sup, supIdx })
    })
    return pairs
  }, [currentBlueSheet?.material_entries, currentSupplierInvoice?.materials])

  if (!blueSheet || !currentBlueSheet) return null

  // ─── Product Search ────────────────────────────────────────────────────────
  const handleProductSearch = async (query: string, rowIndex: number) => {
    setActiveRow(rowIndex)
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)

    if (!query || query.length < 2) {
      setFilteredProducts([])
      return
    }

    searchDebounceRef.current = setTimeout(async () => {
      try {
        const response = await apiClient.searchProductsByQuery(query)
        const productsData = response.data?.products || response.data?.data || []

        // ── KEY FIX: Jo products already BlueSheet mein hain unhe filter karo ──
        const currentMaterials = editedBlueSheet?.material_entries || []
        const alreadyAddedProductIds = new Set(
          currentMaterials
            .map((m: any) => m.product_id || m.product?.id)
            .filter(Boolean)
            .map(Number)
        )

        const filtered = productsData.filter(
          (p: any) => !alreadyAddedProductIds.has(Number(p.id))
        )

        setFilteredProducts(filtered)
      } catch (error) {
        console.error('Search error:', error)
        setFilteredProducts([])
      }
    }, 300)
  }

  // ─── handleBlueSheetMaterialUpdateAll  
  const handleBlueSheetMaterialUpdateAll = (index: number, product: any) => {
    if (!editedBlueSheet) return

    // ── Duplicate check: kya yeh product_id already kisi aur row mein hai? ──
    const isDuplicate = editedBlueSheet.material_entries.some(
      (m: any, i: number) =>
        i !== index && (Number(m.product_id) === Number(product.id) || Number(m.product?.id) === Number(product.id))
    )
    if (isDuplicate) {
      toast.error(`"${product.product_name}" already added in BlueSheet`)
      setFilteredProducts([])
      setActiveRow(null)
      return
    }

    const newMaterials = [...editedBlueSheet.material_entries]
    const currentMaterial = newMaterials[index]

    // Default quantity to 1 when selecting a product if it's missing or zero.
    // The UI quantity column uses material_used, so make sure that is set.
    const qty =
      (currentMaterial.material_used && currentMaterial.material_used > 0
        ? currentMaterial.material_used
        : null) ??
      (currentMaterial.total_ordered && currentMaterial.total_ordered > 0
        ? currentMaterial.total_ordered
        : 1)

    const unitCost = product.jdp_price || product.unit_cost || 0
    const totalCost = qty * unitCost

    newMaterials[index] = {
      ...currentMaterial,
      material_name: product.product_name,
      material_used: qty,
      total_ordered: qty,
      unit_cost: unitCost,
      total_cost: totalCost,
      product_id: Number(product.id),                          // ✅ primary field
      supplier_id: product.supplier_id ? Number(product.supplier_id) : null,
      jdp_sku: product.jdp_sku || '',
      id: currentMaterial.id,                                  // existing DB row id preserve
      product: { ...product, id: Number(product.id) },
    }

    console.log(`[ProductSelect] index=${index} product_id=${newMaterials[index].product_id}`)

    const newAmount = newMaterials.reduce(
      (sum: number, item: any) => sum + (item.total_cost || item.total_ordered * item.unit_cost),
      0
    )

    setEditedBlueSheet({ ...editedBlueSheet, material_entries: newMaterials, total_cost: newAmount })
    setFilteredProducts([])
    setActiveRow(null)
    toast.success(`Product "${product.product_name}" selected`)
  }

  const handleBlueSheetMaterialChange = (index: number, field: string, value: any) => {
    if (!editedBlueSheet) return

    const newMaterials = [...editedBlueSheet.material_entries]
    const current = newMaterials[index]

    newMaterials[index] = {
      ...current,
      [field]: value,
    }

    if (field === 'material_used' || field === 'unit_cost') {
      newMaterials[index].total_cost = newMaterials[index].material_used * newMaterials[index].unit_cost
    }

    const newAmount = newMaterials.reduce((sum, item) => sum + (item.total_cost || 0), 0)
    setEditedBlueSheet({ ...editedBlueSheet, material_entries: newMaterials, total_cost: newAmount })
  }

  // ─── handleBlueSheetSave ───────────────────────────────────────────────────
  const handleBlueSheetSave = async () => {
    if (!editedBlueSheet) return

    try {
      setIsApproving(true)
      console.log('=== SAVE DEBUG ===')

      const materialsForAPI = editedBlueSheet.material_entries.map((item: any) => {
        const resolvedProductId =
          item.product_id != null ? Number(item.product_id) :
            item.product?.id != null ? Number(item.product.id) :
              null

        const materialId = (item.id) ? item.id : undefined

        console.log(
          `[Save] "${item.material_name}" | materialId=${materialId} | product_id=${resolvedProductId} | _isNew=${item._isNew}`
        )

        return {
          ...(materialId !== undefined ? { id: materialId } : {}),
          material_name: item.material_name,
          unit: item.unit || 'pieces',
          total_ordered: item.total_ordered,
          material_used: item.material_used || 0,
          unit_cost: item.unit_cost,
          total_cost: item.total_cost || item.total_ordered * item.unit_cost,
          product_id: resolvedProductId,   // ✅ always present (null if not linked)
          supplier_id: item.supplier_id
            ? Number(item.supplier_id)
            : item.product?.supplier_id
              ? Number(item.product.supplier_id)
              : null,
          jdp_sku: item.jdp_sku || item.product?.jdp_sku || '',
          supplier_order_id: item.supplier_order_id || '',
          return_to_warehouse: item.return_to_warehouse || false,
          date: item.date || new Date().toISOString().split('T')[0],
          section_name: item.parent_header_name || item.section_name || null,
          section_type:
            item.parent_header_name || item.section_name ? "room_header" : null,
          // parent_header_key: item.parent_header_key || null,
          parent_header_name: item.parent_header_name || null,
        }
      })

      console.log('Sending to API:', materialsForAPI)

      const result = await apiClient.updateBluesheetMaterials(editedBlueSheet.id, materialsForAPI)
      console.log('API Response:', result)

      const updatedMaterials =
        result?.data?.materials || result?.materials || result?.data?.results || []

      if (updatedMaterials.length === 0) {
        console.warn('No updated materials returned from API')
        // Still exit edit mode — API succeeded
        setIsBlueSheetEditMode(false)
        toast.success('BlueSheet saved!')
        return
      }

      // ── Local state update: API se returned IDs sync karo ──
   const newMaterials = editedBlueSheet.material_entries.map(
     (item: any, index: number) => {
       const apiMaterial = updatedMaterials[index];
       return {
         ...item,
         ...(apiMaterial?.id ? { id: apiMaterial.id } : {}),
         product_id: item.product_id,
         parent_header_name:
           apiMaterial?.parent_header_name ?? item.parent_header_name ?? null,
         section_name:
           apiMaterial?.section_name ??
           item.section_name ??
           item.parent_header_name ??
           null,
         _isNew: false,
         job_bluesheet_id:
           apiMaterial?.job_bluesheet_id || item.job_bluesheet_id,
       };
     },
   );

      const newTotal = newMaterials.reduce(
        (sum: number, item: any) => sum + (item.total_cost || item.total_ordered * item.unit_cost),
        0
      )

      setEditedBlueSheet({ ...editedBlueSheet, material_entries: newMaterials, total_cost: newTotal })
      setIsBlueSheetEditMode(false)
      toast.success('BlueSheet changes saved successfully!')
    } catch (error: any) {
      console.error('BlueSheet save error:', error)
      toast.error(error?.message || 'Failed to save BlueSheet changes')
    } finally {
      setIsApproving(false)
    }
  }

  // ─── File Upload ───────────────────────────────────────────────────────────
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setUploadedFile(file)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/supplier-invoices/parse-uploaded-invoice', {
        method: 'POST',
        body: formData,
      })
      const result = await response.json()
      if (!result.success) throw new Error(result.message || 'Failed to parse invoice')

      const rawInvoice = result.data
      if (rawInvoice.totalPages > 1) {
        toast.info(`${rawInvoice.totalPages} pages — ${rawInvoice.invoiceCount} invoice(s) — ${rawInvoice.materials.length} materials`)
      }

      const mappedInvoice: SupplierInvoice = {
        id: rawInvoice.id,
        poNumber: rawInvoice.poNumber || `BS-${blueSheet.id}`,
        invoiceNumber: rawInvoice.invoiceNumber,
        supplier: rawInvoice.supplier,
        amount: Number(rawInvoice.amount || 0),
        date: rawInvoice.date || new Date().toISOString(),
        materials: (rawInvoice.materials || []).map((item: any) => ({
          name: item.name,
          quantity: Number(item.quantity || 1),
          unitPrice: Number(item.unitPrice || 0),
          total: Number(item.total || 0),
          invoiceNumber: item.invoiceNumber,
          poNumber: item.poNumber,
          page: item.page,
        })),
        status: 'received',
      }

      if (!mappedInvoice.materials.length) throw new Error('No materials found in uploaded invoice')

      setSupplierInvoice(mappedInvoice)
      setEditedSupplierInvoice(null)
      toast.success(`Invoice parsed: ${mappedInvoice.materials.length} materials`)
    } catch (error: any) {
      toast.error(error?.message || 'Failed to process invoice.')
      setUploadedFile(null)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // ─── Auto Fetch ────────────────────────────────────────────────────────────
  const handleAutoFetch = async () => {
    if (!blueSheet) return
    setIsAutoFetching(true)
    try {
      const poNumber = `BS-${blueSheet.id}`
      const response = await apiClient.autoFetchSupplierInvoiceFromEmail({ poNumber })
      const rawInvoice: any = (response && (response.data || response.invoice || response)) || {}
      const materialsSource: any[] = rawInvoice.materials || rawInvoice.items || rawInvoice.lines || []

      const mappedInvoice: SupplierInvoice = {
        id: (rawInvoice.id ?? rawInvoice.invoice_id ?? poNumber).toString(),
        poNumber: rawInvoice.poNumber || rawInvoice.po_number || poNumber,
        invoiceNumber: rawInvoice.invoiceNumber || rawInvoice.invoice_number || `INV-${blueSheet.id.toString().slice(-3)}`,
        supplier: rawInvoice.supplier || rawInvoice.supplier_name || rawInvoice.vendor || 'Unknown Supplier',
        amount: Number(rawInvoice.amount ?? rawInvoice.total ?? 0),
        date: rawInvoice.date || rawInvoice.invoice_date || new Date().toISOString(),
        materials: materialsSource.map((item: any, index: number) => {
          const quantity = Number(item.quantity ?? item.qty ?? 0)
          const unitPrice = Number(item.unitPrice ?? item.unit_price ?? item.price ?? item.rate ?? 0)
          const jdpPrice = Number(item.jdp_price  ?? 0)

          return {
            name: item.name || item.description || `Item ${index + 1}`,
            quantity,
            unitPrice,
            jdpPrice,
            total: Number(item.total ?? item.line_total ?? item.amount ?? quantity * unitPrice),
          }
        }),
        status: 'received',
      }

      if (!mappedInvoice.materials.length) throw new Error('No materials found in fetched supplier invoice')
      setSupplierInvoice(mappedInvoice)
      setEditedSupplierInvoice(null)
      toast.success(`Supplier invoice auto-fetched for PO: ${poNumber}`)
    } catch (error: any) {
      toast.error(error?.message || 'Failed to auto-fetch supplier invoice.')
    } finally {
      setIsAutoFetching(false)
    }
  }

  // ─── Edit mode toggles ─────────────────────────────────────────────────────
  const handleBlueSheetEdit = () => {
    setIsBlueSheetEditMode(prev => {
      const next = !prev
      toast.info(next ? 'BlueSheet edit mode enabled' : 'BlueSheet edit mode disabled')
      return next
    })
  }

  const handleSupplierEdit = () => {
    setIsSupplierEditMode(prev => {
      const next = !prev
      toast.info(next ? 'Supplier invoice edit mode enabled' : 'Supplier invoice edit mode disabled')
      return next
    })
  }

  // ─── Supplier Save ─────────────────────────────────────────────────────────
  const handleSupplierSave = () => {
    if (!editedSupplierInvoice) return
    const newTotal = editedSupplierInvoice.materials.reduce((sum, item) => sum + item.total, 0)
    const updated = { ...editedSupplierInvoice, amount: newTotal }
    setSupplierInvoice(updated)
    setEditedSupplierInvoice(updated)
    setIsSupplierEditMode(false)
    toast.success('Supplier invoice saved!')
  }

  // ─── Supplier material change ──────────────────────────────────────────────
  const handleSupplierMaterialChange = (index: number, field: string, value: any) => {
    if (!editedSupplierInvoice) return
    const newMaterials = [...editedSupplierInvoice.materials]
    newMaterials[index] = { ...newMaterials[index], [field]: value }
    if (field === 'quantity' || field === 'unitPrice') {
      newMaterials[index].total = newMaterials[index].quantity * newMaterials[index].unitPrice
    }
    const newAmount = newMaterials.reduce((sum, item) => sum + item.total, 0)
    setEditedSupplierInvoice({ ...editedSupplierInvoice, materials: newMaterials, amount: newAmount })
  }

  // ─── Add / Remove rows ─────────────────────────────────────────────────────
  const addBlueSheetMaterial = () => {
    if (!editedBlueSheet) return
    const newMaterial = {
      _isNew: true,
      material_name: '',
      unit: 'pieces',
      total_ordered: 1,
      material_used: 0,
      unit_cost: 0,
      total_cost: 0,
      supplier_order_id: '',
      return_to_warehouse: false,
      date: new Date().toISOString().split('T')[0],
      product: null,
      product_id: null,
      supplier_id: null,
      jdp_sku: '',
      section_name: null,
      section_type: null,
      // parent_header_key: null,
      parent_header_name: null,
    }
    setEditedBlueSheet({ ...editedBlueSheet, material_entries: [...editedBlueSheet.material_entries, newMaterial] })
    toast.info('New material row added')
  }

  const addSupplierMaterial = () => {
    if (!editedSupplierInvoice) return
    setEditedSupplierInvoice({
      ...editedSupplierInvoice,
      materials: [...editedSupplierInvoice.materials, { name: 'New Supplier Item', quantity: 1, unitPrice: 0, jdpPrice:0,total: 0 }],
    })
  }

  const removeBlueSheetMaterial = (index: number) => {
    if (!editedBlueSheet || editedBlueSheet.material_entries.length <= 1) return
    const newMaterials = editedBlueSheet.material_entries.filter((_: any, i: number) => i !== index)
    const newAmount = newMaterials.reduce((sum: number, item: any) => sum + (item.total_cost || 0), 0)
    setEditedBlueSheet({ ...editedBlueSheet, material_entries: newMaterials, total_cost: newAmount })
    toast.info('Material removed')
  }

  const removeSupplierMaterial = (index: number) => {
    if (!editedSupplierInvoice || editedSupplierInvoice.materials.length <= 1) return
    const newMaterials = editedSupplierInvoice.materials.filter((_, i) => i !== index)
    setEditedSupplierInvoice({
      ...editedSupplierInvoice,
      materials: newMaterials,
      amount: newMaterials.reduce((sum, item) => sum + item.total, 0),
    })
  }

  // ─── Comparison ────────────────────────────────────────────────────────────
  const generateComparison = (): MaterialComparison[] => {
    if (!supplierInvoice || !blueSheet) return []
    const bsData = editedBlueSheet || blueSheet
    const supData = editedSupplierInvoice || supplierInvoice
    const comparisons: MaterialComparison[] = []
    const used = new Set<number>()

    bsData.material_entries.forEach((bsItem: any) => {
      let bestMatch = -1, bestScore = 0
      supData.materials.forEach((supItem, si) => {
        if (used.has(si)) return
        const exact = bsItem.material_name?.toLowerCase() === supItem.name?.toLowerCase()
        const partial =
          bsItem.material_name?.toLowerCase().includes(supItem.name?.toLowerCase()) ||
          supItem.name?.toLowerCase().includes(bsItem.material_name?.toLowerCase())
        if (exact && bestScore < 100) { bestMatch = si; bestScore = 100 }
        else if (partial && bestScore < 80) { bestMatch = si; bestScore = 80 }
      })

      if (bestMatch >= 0) {
        used.add(bestMatch)
        const supItem = supData.materials[bestMatch]
        const differences: string[] = []
        let status: MaterialComparison['status'] = 'match'
        const priceDiff = Math.abs(bsItem.unit_cost - supItem.unitPrice)
        if (priceDiff > 0.01) {
          differences.push(`Price: ${formatCurrency(bsItem.unit_cost)} vs ${formatCurrency(supItem.unitPrice)}`)
          status = 'price_diff'
        }
        if (bsItem.total_ordered !== supItem.quantity) {
          differences.push(`Qty: ${bsItem.total_ordered} vs ${supItem.quantity}`)
          status = 'quantity_diff'
        }
        comparisons.push({ blueSheetItem: bsItem, supplierItem: supItem, status, differences })
      } else {
        comparisons.push({ blueSheetItem: bsItem, status: 'missing_in_supplier', differences: ['Not in supplier invoice'] })
      }
    })

    supData.materials.forEach((supItem, i) => {
      if (!used.has(i)) {
        comparisons.push({ supplierItem: supItem, status: 'missing_in_bluesheet', differences: ['Extra in supplier invoice'] })
      }
    })
    return comparisons
  }

   const validateHeaderGroupsBeforeSubmit = (lineItems: any[] = []) => {
   const invalidHeaders = lineItems.filter(
     (item: any) =>
       item?.type === "header" &&
       item?.headerKey !== "standalone_header_key" &&
       !String(item?.headerName || "").trim(),
   );
 
   if (invalidHeaders.length > 0) {
     const invalidKeys = invalidHeaders
       .map((item: any) => item.headerKey)
       .filter(Boolean);
 
     setInvalidHeaderKeys(invalidKeys);
 
     toast.error("Please fill in all header group names before submitting");
     return false;
   }
 
   setInvalidHeaderKeys([]);
   return true;
 };

  // ─── Proceed / Final Approval ──────────────────────────────────────────────
  const handleProceedToReview = async () => {
    if (isBlueSheetEditMode || isSupplierEditMode) {
      toast.error('Please save your changes before proceeding')
      return
    }
    const ids = getSelectedBlueSheetIds()
    try {
      setIsProceedingToReview(true)
      await apiClient.approveBulkBluesheet(ids, 'approved')
      toast.success('BlueSheet(s) approved')
      await onBluesheetsRefresh?.()
      setCurrentStep('review')
      const nextNotes = String((editedBlueSheet ?? blueSheet)?.notes ?? "");
      setInvoiceApprovalNotes(nextNotes)
      invoiceApprovalNotesRef.current = nextNotes
    } catch (error: any) {
      toast.error(error?.message || 'Failed to approve BlueSheet(s)')
    } finally {
      setIsProceedingToReview(false)
    }
  }

  
 const handleFinalApproval = async (action: "send" | "save") => {
  const finalBlueSheet = editedBlueSheet || blueSheet;
  if (!finalBlueSheet) return;

  try {
    if (action === "send") {
      setIsApproving(true);
    } else {
      setIsSaving(true);
    }
    const isContractBased = finalBlueSheet.job.job_type === "contract_based";

    const customProducts = finalBlueSheet.material_entries.map((item: any) => {
      const parentHeaderName =
        item.parent_header_name ??
        item.parentHeaderName ??
        item.section_name ??
        null;

      const sectionName = parentHeaderName;

      const resolvedProductId = item.product_id ?? item.product?.id ?? null;

      const qty = Number(item.total_ordered ?? item.material_used ?? 0);

      const estimateUnitPrice = Number(item.jdp_price ?? 0);
      const internalUnitCost = Number(item.unit_cost ?? 0);

      // ✅ ROUNDING FIX
      const roundedEstimateUnitPrice = Number(estimateUnitPrice.toFixed(2));
      const roundedInternalUnitCost = Number(internalUnitCost.toFixed(2));
      const roundedRowTotal = Number(
        (qty * roundedEstimateUnitPrice).toFixed(2),
      );

      return {
        ...(resolvedProductId ? { id: resolvedProductId } : {}),
        ...(resolvedProductId ? { product_id: resolvedProductId } : {}),
        job_id: finalBlueSheet.job_id,
        product_name: item.material_name,
        description:
          item.product?.description || item.description || item.material_name,
        supplier_id:
          item.supplier_id ??
          item.product?.supplier_id ??
          item.product?.suppliers?.id ??
          1,
        supplier_sku: item.product?.supplier_sku || item.supplier_sku || "",
        jdp_sku: item.product?.jdp_sku || item.jdp_sku || "",
        unit: item.unit || "piece",
        stock_quantity: qty,

        // internal
        unit_cost: roundedInternalUnitCost,

        // ✅ estimate (FIXED)
        estimated_price: roundedEstimateUnitPrice,
        total_cost: roundedRowTotal,
        jdp_price: roundedEstimateUnitPrice,

        total_ordered: qty,
        material_used: Number(item.material_used ?? qty),
        is_custom: item.is_custom === true || !resolvedProductId,

        section_name: sectionName,
        section_type: sectionName ? "room_header" : null,
        parent_header_name: parentHeaderName,
      };
    });

    const laborEntriesTotalCost = (finalBlueSheet.labor_entries ?? []).reduce(
      (sum: number, entry: any) => sum + Number(entry.total_cost || 0),
      0,
    );
    const totalLaborCost = Number(laborEntriesTotalCost.toFixed(2));
    if (laborEntriesTotalCost > 0) {
      customProducts.push({
        job_id: finalBlueSheet.job_id,
        product_name: "Labor total cost",
        description: "Total labor cost from BlueSheet labor entries",
        supplier_id: 1,
        supplier_sku: "LABOR_TOTAL",
        jdp_sku: `LABOR-TOTAL-${Date.now().toString(36)}`,
        unit: "unit",
        stock_quantity: 1,

        unit_cost: laborEntriesTotalCost,
        estimated_price: laborEntriesTotalCost,
        total_cost: laborEntriesTotalCost,
        jdp_price: laborEntriesTotalCost,

        total_ordered: 1,
        material_used: 0,
        is_custom: true,
        section_name: null,
        section_type: null,
        parent_header_name: null,
      });
    }

    // ✅ FIX: total_amount now follows the same JDP pricing shown in listing
    const materialTotalForEstimate = (finalBlueSheet.material_entries ?? []).reduce(
      (sum: number, item: any) => {
        const qty = Number(item.total_ordered ?? item.material_used ?? 0);
        const estimateUnitPrice = Number(item.jdp_price ?? 0);
        return sum + qty * estimateUnitPrice;
      },
      0,
    );

    const totalAmountForEstimate = Number(
      (
        materialTotalForEstimate +
        laborEntriesTotalCost +
        Number(finalBlueSheet.additional_charges ?? 0)
      ).toFixed(2),
    );

    const bluesheetIds = getSelectedBlueSheetIds();

    const estimateNotesPayload =
      String(invoiceApprovalNotesRef.current ?? "") ||
      String(editedBlueSheet?.notes ?? "") ||
      String(blueSheet?.notes ?? "") ||
      "";

    const today = new Date().toISOString().split("T")[0];
    const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const estimatePayload = {
      job_id: finalBlueSheet.job_id,
      estimate_title: `BlueSheet #${finalBlueSheet.id} — ${finalBlueSheet.job.job_title}`,
      priority:
        (finalBlueSheet.job.priority as "low" | "medium" | "high") ||
        "medium",
      service_type: isContractBased ? "contract_based" : "service_based",
      invoice_type: selectedInvoiceType || "progressive_invoice",
      status: "draft",
      estimate_date: today,
      due_date: thirtyDaysLater,
      invoice_number: `INV-BS-${finalBlueSheet.id}-${Date.now()
        .toString()
        .slice(-6)}`,
      issue_date: today,

      email_address: isContractBased
        ? finalBlueSheet.job.contractor?.email ||
          finalBlueSheet.job.bill_to_email ||
          ""
        : finalBlueSheet.job.customer?.email ||
          finalBlueSheet.job.bill_to_email ||
          "",

      bill_to_address: isContractBased
        ? finalBlueSheet.job.contractor?.address ||
          finalBlueSheet.job.bill_to_address ||
          ""
        : finalBlueSheet.job.bill_to_address ||
          finalBlueSheet.job.customer?.address ||
          "",

      ...(isContractBased
        ? { contractor_id: finalBlueSheet.job.contractor?.id ?? 0 }
        : { customer_id: finalBlueSheet.job.customer?.id ?? 0 }),

      po_number: `BS-${finalBlueSheet.id}`,
      rep: finalBlueSheet.created_by_user?.full_name || "",
      notes: estimateNotesPayload,
      // total_labor_hours: totalLaborHours,
      total_labor_cost: totalLaborCost,
      total_amount: totalAmountForEstimate,

      location: isContractBased
        ? finalBlueSheet.job.contractor?.address ||
          finalBlueSheet.job.bill_to_address ||
          ""
        : finalBlueSheet.job.bill_to_address ||
          finalBlueSheet.job.customer?.address ||
          "",

      bluesheet_ids: bluesheetIds,
      valid_until: thirtyDaysLater,
      custom_products: customProducts,
      invoice_source: "quickbook",
      quickbook_action:
        action === "send" ? "sendtoquickbook" : "sevetoquickbook",
    };

    await apiClient.createEstimate(estimatePayload);
    await apiClient.approveBluesheet(finalBlueSheet.id, "approved");
    await onEstimatesRefresh?.();
    onApprovalComplete(finalBlueSheet);
    if(action === "send"){
     toast.success("Invoice Sent from Quickbook Successfullly");
    }else{
      toast.success("Invoice Save to Quickbook Successfullly");
    }
    onClose();
  } catch (error: any) {
    toast.error(error?.message || "Failed to create estimate.");
  } finally {
    setIsSaving(false);
    setIsApproving(false);
  }
};

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(amount)

  const comparisons = generateComparison()
  const totalDiscrepancyAmount = comparisons.reduce((sum, comp) => {
    if (comp.blueSheetItem && comp.supplierItem)
      return sum + Math.abs((comp.blueSheetItem.total_cost || 0) - comp.supplierItem.total)
    return sum
  }, 0)


  // Labour, material and overall totals
  const totalLaborLabel = currentBlueSheet.total_labor_hours || null
  const materialTotal = currentBlueSheet.material_entries.reduce(
    (s: number, i: any) => s + (i.total_cost || i.material_used * i.jdp_price || 0),
    0,
  )
  // Derive total labor cost from labor_entries so it reflects merged selections
  const laborEntriesTotalCost = (currentBlueSheet.labor_entries ?? []).reduce(
    (sum: number, entry: any) => sum + (entry.total_cost || 0),
    0,
  )
  // ──────────────────────────────────────────────────────────────────────────


  const handleSendCustomInvoice = () => {
    setIsCustomInvoiceOpen(true)
  }
  console.log(blueSheet,"blueeeee");
  
  const hasComparisonInvoice =
  !!currentSupplierInvoice &&
  Array.isArray(currentSupplierInvoice.materials) &&
  currentSupplierInvoice.materials.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent showCloseButton={false} className="w-screen h-screen max-w-full max-h-full min-w-full min-h-full overflow-hidden p-0 rounded-none border-0">
        <DialogHeader className="p-8 pt-3 pb-3 border-b bg-white">
          <DialogTitle className="flex items-center gap-3">
            {/* Back Button */}
            <Button
              type="button"
              variant="outline"
              onClick={handleBackClick}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md bg-white hover:bg-gray-50 transition cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>

            {/* Divider (optional but pro look) */}
            <div className="h-5 w-px bg-gray-300 mx-1" />

            {/* Title */}
            <FileText className="h-6 w-6 text-[#00A1FF]" />

            <span className="text-xl font-semibold text-[#1a1a2e]">
              BlueSheet Review & Approve
            </span>

            {/* Badge */}
            <Badge className="ml-2 bg-blue-50 text-blue-600 border-blue-200 px-3 py-1">
              BS-{blueSheet.id}
            </Badge>

            {(isBlueSheetEditMode || isSupplierEditMode) && (
              <Badge className="ml-2 bg-orange-50 text-orange-600 border-orange-200 animate-pulse px-3 py-1">
                <Edit className="w-4 h-4 mr-1" />
                Edit Mode Active
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription className="text-base mt-1">
            Upload supplier invoice, compare side-by-side, edit as needed, then
            approve.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden bg-gray-50">
          <Tabs
            value={currentStep}
            onValueChange={setCurrentStep as any}
            className="h-full flex flex-col"
          >
            <TabsList className="grid w-full grid-cols-2 mx-8 h-12 max-w-md">
              <TabsTrigger
                value="upload"
                className={`gap-2 text-base ${currentStep === "upload" ? "bg-white" : ""}`}
              >
                {/* <Download className="h-5 w-5" /> */}
                 <Upload className="h-4 w-4 mr-2" />
                Upload & Compare
              </TabsTrigger>
              <TabsTrigger
                value="review"
                className={`gap-2 text-base ${currentStep === "review" ? "bg-white" : ""}`}
              >
                <CheckSquare className="h-5 w-5" />
                Final Review
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-hidden">
              {/* ── Upload & Compare Tab ───────────────────────────────────── */}
              <TabsContent
                value="upload"
                className="h-full overflow-y-auto p-8 mt-0"
              >
                <div className="max-w-[1800px] mx-auto space-y-8">
                  {/* Supplier Invoice: compact auto-fetch + upload */}
                  <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
                    <div className="flex flex-wrap items-center gap-4 px-4 py-3 bg-[#f8fafc] border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-[#00A1FF]" />
                        <span className="text-sm font-semibold text-[#1a1a2e]">
                          Supplier Invoice
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        Compare with BlueSheet — fetch by PO or upload file
                      </span>
                    </div>
                    <div className="p-4 space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <Button
                          onClick={handleAutoFetch}
                          disabled={isAutoFetching}
                          size="sm"
                          className="h-9 px-4 gap-2 bg-[#00A1FF] hover:bg-[#0090e6] text-white text-sm cursor-pointer"
                        >
                          {isAutoFetching ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Mail className="h-4 w-4" />
                          )}
                          {isAutoFetching
                            ? "Fetching..."
                            : "Auto-fetch (PO: BS-" + blueSheet.id + ")"}
                        </Button>
                        <span className="text-xs text-gray-400 font-medium">
                          or
                        </span>
                        <Button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading}
                          variant="outline"
                          size="sm"
                          className="h-9 px-4 gap-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-[#00A1FF] hover:text-[#00A1FF] cursor-pointer"
                        >
                          {isUploading ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                          {isUploading ? "Processing..." : "Choose File"}
                        </Button>
                        <span className="text-xs text-gray-400">
                          PDF only — max 10MB
                        </span>
                        <input
                          ref={fileInputRef}
                          type="file"
                          className="hidden"
                          accept=".pdf"
                          onChange={handleFileUpload}
                          multiple
                        />
                        {uploadedFile && (
                          <span className="text-xs text-emerald-600 flex items-center gap-1">
                            <CheckSquare className="h-3.5 w-3.5" />{" "}
                            {uploadedFile.name}
                          </span>
                        )}
                      </div>
                      {supplierInvoice && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-emerald-50 border border-emerald-100">
                          <CheckSquare className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                          <span className="text-sm font-medium text-emerald-800">
                            Loaded
                          </span>
                          <span className="text-xs text-emerald-600">
                            {supplierInvoice.invoiceNumber} ·{" "}
                            {supplierInvoice.supplier} ·{" "}
                            {formatCurrency(supplierInvoice.amount)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* When no supplier: section title */}
                  {!supplierInvoice && (
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <h3 className="text-xl font-semibold text-[#1a1a2e]">
                        BlueSheet Materials
                      </h3>
                      <Button
                        onClick={handleBlueSheetEdit}
                        variant={isBlueSheetEditMode ? "default" : "outline"}
                        size="sm"
                        className={
                          (isBlueSheetEditMode
                            ? "bg-orange-500 hover:bg-orange-600"
                            : "border-gray-300") + " cursor-pointer"
                        }
                      >
                        <Edit className="h-3.5 w-3.5 mr-1.5" />
                        {isBlueSheetEditMode
                          ? "Exit BS Edit"
                          : "Edit BlueSheet"}
                      </Button>
                    </div>
                  )}

                  {/* Tables: left table | Reconciliation Status (center) | right table when supplier exists */}
                  {supplierInvoice ? (
                    <Card className="border border-gray-200 bg-gray-100/80 shadow-none overflow-hidden rounded-xl">
                      <CardContent className="p-0">
                        {/* Dashboard section on top of tables (same card like invoice) */}
                        <div className="p-4 bg-gray-100/60 border-b border-gray-200">
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="min-w-[280px]">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700">
                                    Comparison Dashboard
                                  </h2>
                                  <p className="text-[10px] text-gray-500 mt-0.5">
                                    Invoice Reconciliation · INVREC-
                                    {blueSheet.id}
                                  </p>
                                </div>
                                {/* Only BlueSheet is editable from here */}
                                <div className="flex gap-2">
                                  <Button
                                    onClick={handleBlueSheetEdit}
                                    variant={
                                      isBlueSheetEditMode
                                        ? "default"
                                        : "outline"
                                    }
                                    size="sm"
                                    className={
                                      (isBlueSheetEditMode
                                        ? "bg-orange-500 hover:bg-orange-600"
                                        : "border-gray-300 bg-white") + " cursor-pointer h-8"
                                    }
                                  >
                                    <Edit className="h-3.5 w-3.5 mr-1.5" />
                                    Edit BlueSheet
                                  </Button>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 text-sm">
                                <div className="p-2.5 rounded-lg bg-white border border-gray-200">
                                  <p className="text-[10px] font-semibold uppercase text-gray-400 mb-0.5">
                                    From
                                  </p>
                                  <p className="text-xs font-medium text-[#1a1a2e]">
                                    Supplier Invoice:{" "}
                                    {currentSupplierInvoice?.invoiceNumber}
                                  </p>
                                  <p className="text-[11px] text-gray-600">
                                    ({currentSupplierInvoice?.supplier || "—"})
                                  </p>
                                </div>
                                <div className="p-2.5 rounded-lg bg-white border border-gray-200">
                                  <p className="text-[10px] font-semibold uppercase text-gray-400 mb-0.5">
                                    Bill To
                                  </p>
                                  <p className="text-xs font-medium text-[#1a1a2e]">
                                    BlueSheet: PO{" "}
                                    {(() => {
                                      const ids = getSelectedBlueSheetIds();
                                      return getSelectedBlueSheetIds().length > 0
                                        ? getSelectedBlueSheetIds().map((id) => `BS-${id}`).join(", ")
                                        : `BS-${blueSheet.id}`;
                                    })()}
                                  </p>
                                  <p className="text-[11px] text-gray-600">
                                    (
                                    {blueSheet.job.customer?.customer_name ||
                                      blueSheet.job.contractor
                                        ?.contractor_name ||
                                      "N/A"}
                                    )
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Right side removed: Total Reconciliation Discrepancy box */}
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-4">
                            {[
                              {
                                label: "Matches",
                                value: comparisons.filter(
                                  (c) => c.status === "match",
                                ).length,
                                color: "text-emerald-600",
                                bg: "bg-emerald-50 border-emerald-100",
                              },
                              {
                                label: "Differences",
                                value: comparisons.filter(
                                  (c) =>
                                    c.status === "price_diff" ||
                                    c.status === "quantity_diff",
                                ).length,
                                color: "text-amber-600",
                                bg: "bg-amber-50 border-amber-100",
                              },
                              {
                                label: "Missing in Supplier",
                                value: comparisons.filter(
                                  (c) => c.status === "missing_in_supplier",
                                ).length,
                                color: "text-red-600",
                                bg: "bg-red-50 border-red-100",
                              },
                              {
                                label: "Extra in Supplier",
                                value: comparisons.filter(
                                  (c) => c.status === "missing_in_bluesheet",
                                ).length,
                                color: "text-blue-600",
                                bg: "bg-blue-50 border-blue-100",
                              },
                              {
                                label: "Discrepancy",
                                value: formatCurrency(totalDiscrepancyAmount),
                                color: "text-violet-600",
                                bg: "bg-violet-50 border-violet-100",
                              },
                            ].map((stat, i) => (
                              <div
                                key={i}
                                className={`${stat.bg} border rounded-lg px-2 py-1.5 text-center`}
                              >
                                <p
                                  className={`text-base font-bold ${stat.color}`}
                                >
                                  {stat.value}
                                </p>
                                <p className="text-[10px] text-gray-500">
                                  {stat.label}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Tables inside same invoice card */}
                        <div className="grid grid-cols-1 xl:grid-cols-[1fr_auto_1fr] gap-0 bg-gray-100/80 p-2">
                          <Card className="border-0 rounded-none shadow-none">
                            <CardHeader className="bg-[#0f2d1f] text-white py-2 px-4 rounded-none">
                              <CardTitle className="text-xs font-semibold flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />{" "}
                                Supplier Materials
                              </CardTitle>
                              {/* <p className="text-xs text-white/80 mt-0.5">{currentSupplierInvoice?.invoiceNumber} · {currentSupplierInvoice?.supplier}</p> */}
                            </CardHeader>
                            <CardContent className="p-0">
                              <div className="overflow-x-auto">
                                <table className="w-full text-[13px] border-collapse">
                                  <thead>
                                    <tr className="bg-[#134422] text-white text-[11px]">
                                      <th className="text-left py-2 px-3 font-medium border-r border-white/20">
                                        #
                                      </th>
                                      <th className="text-left py-2 px-3 font-medium border-r border-white/20">
                                        Description
                                      </th>
                                      <th className="text-center py-2 px-2 w-12 border-r border-white/20">
                                        Qty
                                      </th>
                                      <th className="text-right py-2 px-3 w-24 border-r border-white/20">
                                        Supplier Price
                                      </th>
                                      <th className="text-right py-2 px-3 w-24 border-r border-white/20">
                                        Total Amount
                                      </th>
                                      {isSupplierEditMode &&
                                        currentSupplierInvoice &&
                                        currentSupplierInvoice.materials
                                          .length > 1 && <th className="w-6" />}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {comparisonPairs.map((pair, rowIdx) => {
                                      const { sup, supIdx, bs, bsIdx } = pair;
                                      const bsSourceId =
                                        bs?.job_bluesheet_id ||
                                        bs?.bluesheet_id ||
                                        bs?.bluesheetId ||
                                        blueSheet.id;
                                      if (!sup)
                                        return (
                                          <tr
                                            key={rowIdx}
                                            className="border-t border-gray-200 bg-gray-50 h-10"
                                          >
                                            <td className="py-1.5 px-3 text-gray-400 border-r border-gray-200 align-middle">
                                              —
                                            </td>
                                            <td className="py-1.5 px-3 text-gray-400 border-r border-gray-200 align-middle">
                                              No Data in Supplier
                                            </td>
                                            <td className="py-1.5 px-2 text-center border-r border-gray-200 align-middle">
                                              —
                                            </td>
                                            <td className="py-2 px-3 text-right border-r border-gray-200 align-middle">
                                              —
                                            </td>
                                            <td className="py-2 px-3 text-right border-r border-gray-200 align-middle">
                                              —
                                            </td>
                                            {isSupplierEditMode &&
                                              currentSupplierInvoice &&
                                              currentSupplierInvoice.materials
                                                .length > 1 && (
                                                <td className="border-r border-gray-200 align-middle" />
                                              )}
                                          </tr>
                                        );
                                      return (
                                        <tr
                                          key={rowIdx}
                                          className="border-t border-gray-200 hover:bg-gray-50/50 h-11"
                                        >
                                          <td className="py-2 px-3 text-gray-500 border-r border-gray-200 align-middle">
                                            {rowIdx + 1}
                                          </td>
                                          <td className="py-2 px-3 border-r border-gray-200 align-middle">
                                            {isSupplierEditMode ? (
                                              <Input
                                                value={sup.name}
                                                onChange={(e) =>
                                                  handleSupplierMaterialChange(
                                                    supIdx!,
                                                    "name",
                                                    e.target.value,
                                                  )
                                                }
                                                className="h-8 text-xs"
                                              />
                                            ) : (
                                              <div className="flex items-center justify-between gap-2">
                                                <span className="font-small text-[#1a1a2e]">
                                                  {sup.name}
                                                </span>
                                              </div>
                                            )}
                                          </td>
                                          <td className="py-2 px-2 text-center border-r border-gray-200 align-middle">
                                            {isSupplierEditMode ? (
                                              <Input
                                                type="number"
                                                value={sup.quantity}
                                                onChange={(e) =>
                                                  handleSupplierMaterialChange(
                                                    supIdx!,
                                                    "quantity",
                                                    parseFloat(
                                                      e.target.value,
                                                    ) || 0,
                                                  )
                                                }
                                                className="h-7 text-center text-xs w-12 mx-auto"
                                                min="0"
                                              />
                                            ) : (
                                              <span className="font-medium">
                                                {sup.quantity}
                                              </span>
                                            )}
                                          </td>
                                          <td className="py-2 px-3 text-right border-r border-gray-200 align-middle">
                                            {isSupplierEditMode ? (
                                              <Input
                                                type="number"
                                                step="0.01"
                                                value={sup.unitPrice}
                                                onChange={(e) =>
                                                  handleSupplierMaterialChange(
                                                    supIdx!,
                                                    "unitPrice",
                                                    parseFloat(
                                                      e.target.value,
                                                    ) || 0,
                                                  )
                                                }
                                                className="h-7 text-xs text-right"
                                                min="0"
                                              />
                                            ) : (
                                              formatCurrency(sup.unitPrice)
                                            )}
                                          </td>
                                          <td className="py-2 px-3 text-right font-semibold text-emerald-600 border-r border-gray-200 align-middle">
                                            {formatCurrency(sup.total)}
                                          </td>
                                          {isSupplierEditMode &&
                                            currentSupplierInvoice &&
                                            currentSupplierInvoice.materials
                                              .length > 1 && (
                                              <td className="py-1 border-r border-gray-200 align-middle">
                                                <button
                                                  onClick={() =>
                                                    removeSupplierMaterial(
                                                      supIdx!,
                                                    )
                                                  }
                                                  className="text-red-400 hover:text-red-600 hover:bg-red-50 rounded p-0.5"
                                                  title="Remove"
                                                >
                                                  <X className="h-3 w-3" />
                                                </button>
                                              </td>
                                            )}
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                  <tfoot>
                                    <tr className="border-t-2 border-gray-200 bg-gray-50 font-semibold h-[44px]">
                                      <td
                                        colSpan={2}
                                        className="py-3 px-3 text-right border-r border-gray-200"
                                      >
                                        Total
                                      </td>
                                      <td className="py-3 px-2 border-r border-gray-200" />
                                      <td className="py-3 px-3 border-r border-gray-200" />
                                      <td className="py-3 px-3 text-right text-emerald-600 border-r border-gray-200">
                                        {currentSupplierInvoice
                                          ? formatCurrency(
                                              currentSupplierInvoice.amount,
                                            )
                                          : "—"}
                                      </td>
                                      {isSupplierEditMode &&
                                        currentSupplierInvoice &&
                                        currentSupplierInvoice.materials
                                          .length > 1 && (
                                          <td className="border-r border-gray-200" />
                                        )}
                                    </tr>
                                  </tfoot>
                                </table>
                              </div>
                            </CardContent>
                          </Card>
                          {/* Center: Reconciliation Status column */}
                          <div className="min-w-[160px]   flex flex-col border-x border-gray-200">
                            {/* Spacer to match table CardHeader height */}
                            <div className="bg-[#2d3748] text-white px-3 text-sm font-semibold border-b border-white/10 h-[55px] flex items-center justify-center">
                              Reconciliation
                            </div>
                            {/* Header to match table THEAD height */}
                            <div className="bg-gray-700 text-white text-xs font-semibold px-3 text-center border-b border-white/10 h-[55px] flex items-center justify-center">
                              Reconciliation Status
                            </div>
                            <div className="flex-1 bg-gray-100/80">
                              {comparisonPairs.map((pair, rowIdx) => {
                                const { bs, sup } = pair;
                                const hasBS = !!bs;
                                const hasSup = !!sup;
                                let status:
                                  | "match"
                                  | "price_diff"
                                  | "quantity_diff"
                                  | "missing_in_supplier"
                                  | "missing_in_bluesheet" = "match";
                                if (!hasSup) status = "missing_in_supplier";
                                else if (!hasBS)
                                  status = "missing_in_bluesheet";
                                else {
                                  const priceDiff =
                                    Math.abs(
                                      (bs!.unit_cost || 0) -
                                        (sup!.unitPrice || 0),
                                    ) > 0.01;
                                  const qtyDiff =
                                    (bs!.total_ordered ?? bs!.material_used) !==
                                    (sup!.quantity ?? 0);
                                  if (priceDiff) status = "price_diff";
                                  else if (qtyDiff) status = "quantity_diff";
                                }
                                const rowBg = !hasSup
                                  ? "bg-red-50"
                                  : !hasBS
                                    ? "bg-blue-50"
                                    : status === "match"
                                      ? "bg-emerald-50"
                                      : "bg-amber-50";
                                return (
                                  <div
                                    key={rowIdx}
                                    className={`px-2 border-b border-gray-200 h-11 flex items-center justify-center ${rowBg}`}
                                  >
                                    {status === "match" && (
                                      <div className="flex flex-col items-center gap-0.5">
                                        <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                                        </div>
                                        <span className="text-[10px] font-medium text-emerald-700">
                                          Match
                                        </span>
                                      </div>
                                    )}
                                    {status === "price_diff" && (
                                      <div className="flex flex-col items-center gap-0.5">
                                        <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
                                          <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                                        </div>
                                        <span className="text-[10px] font-medium text-amber-700 text-center leading-tight">
                                          Rate Discrepancy
                                        </span>
                                      </div>
                                    )}
                                    {status === "quantity_diff" && (
                                      <div className="flex flex-col items-center gap-0.5">
                                        <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
                                          <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                                        </div>
                                        <span className="text-[10px] font-medium text-amber-700 text-center leading-tight">
                                          Qty diff
                                        </span>
                                      </div>
                                    )}
                                    {status === "missing_in_supplier" && (
                                      <div className="flex flex-col items-center gap-0.5">
                                        <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                                          <X className="h-3.5 w-3.5 text-red-600" />
                                        </div>
                                        <span className="text-[10px] font-medium text-red-700 text-center leading-tight">
                                          No Data
                                        </span>
                                      </div>
                                    )}
                                    {status === "missing_in_bluesheet" && (
                                      <div className="flex flex-col items-center gap-0.5">
                                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                                          <Plus className="h-3.5 w-3.5 text-blue-600" />
                                        </div>
                                        <span className="text-[10px] font-medium text-blue-700 text-center leading-tight">
                                          Extra in Supplier
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                            {/* Footer spacer to match table footer row */}
                            {/* <div className="bg-gray-100 border-t border-gray-200 h-[44px]" /> */}
                          </div>

                          <Card className="border-0 rounded-none border-r border-gray-200 shadow-none">
                            <CardHeader className="bg-[#1a2f3d] text-white py-3 px-4 rounded-none">
                              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-[#00A1FF]" />{" "}
                                BlueSheet Materials
                              </CardTitle>
                              {/* <p className="text-xs text-white/80 mt-0.5">PO: BS-{blueSheet.id} · {blueSheet.job.job_title}</p>
                          <p className="text-xs text-white/70">{blueSheet.job.customer?.customer_name || 'N/A'}</p> */}
                            </CardHeader>
                            <CardContent className="p-0">
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm border-collapse">
                                  <thead>
                                    <tr className="bg-[#162f3d] text-white text-xs">
                                      <th className="text-left py-2.5 px-3 font-medium border-r-2 border-gray-400">
                                        BlueSheet
                                      </th>
                                      <th className="text-left py-2.5 px-3 font-medium border-r border-white/20">
                                        Description
                                      </th>
                                      <th className="text-center py-2.5 px-2 w-14 border-r border-white/20">
                                        Qty
                                      </th>
                                      <th className="text-right py-2.5 px-3 w-24 border-r border-white/20">
                                        JDP Price
                                      </th>
                                      <th className="text-right py-2.5 px-3 w-28 border-r border-white/20">
                                        Total Amount
                                      </th>
                                      {isBlueSheetEditMode &&
                                        currentBlueSheet.material_entries
                                          .length > 1 && (
                                          <th className="w-8 border-r border-white/20" />
                                        )}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {comparisonPairs.map((pair, rowIdx) => {
                                      const { bs, bsIdx } = pair;

                                      // Rows without BlueSheet data – simple fallback row
                                      if (!bs) {
                                        return (
                                          <tr
                                            key={rowIdx}
                                            className="border-t border-gray-200 bg-blue-50/30 h-11"
                                          >
                                            <td
                                              colSpan={
                                                isBlueSheetEditMode &&
                                                currentBlueSheet
                                                  .material_entries.length > 1
                                                  ? 6
                                                  : 5
                                              }
                                              className="py-2 px-3 text-gray-400 text-center border-r border-gray-200 align-middle"
                                            >
                                              —
                                            </td>
                                          </tr>
                                        );
                                      }

                                      const bsSourceId =
                                        bs.job_bluesheet_id ||
                                        bs.bluesheet_id ||
                                        bs.bluesheetId ||
                                        blueSheet.id;

                                      // Rowspan grouping: first row of each BS group gets a cell with rowSpan
                                      const prevPair =
                                        rowIdx > 0
                                          ? comparisonPairs[rowIdx - 1]
                                          : null;
                                      const prevSourceId = prevPair?.bs
                                        ? prevPair.bs.job_bluesheet_id ||
                                          prevPair.bs.bluesheet_id ||
                                          prevPair.bs.bluesheetId ||
                                          blueSheet.id
                                        : null;
                                      const isFirstOfGroup =
                                        !prevPair ||
                                        !prevPair.bs ||
                                        bsSourceId !== prevSourceId;

                                      let rowSpan = 1;
                                      if (isFirstOfGroup) {
                                        for (
                                          let i = rowIdx + 1;
                                          i < comparisonPairs.length;
                                          i++
                                        ) {
                                          const next = comparisonPairs[i];
                                          if (!next.bs) break;
                                          const nextSourceId =
                                            next.bs.job_bluesheet_id ||
                                            next.bs.bluesheet_id ||
                                            next.bs.bluesheetId ||
                                            blueSheet.id;
                                          if (nextSourceId !== bsSourceId)
                                            break;
                                          rowSpan++;
                                        }
                                      }

                                      const nextPair =
                                        rowIdx < comparisonPairs.length - 1
                                          ? comparisonPairs[rowIdx + 1]
                                          : null;
                                      const nextSourceId = nextPair?.bs
                                        ? nextPair.bs.job_bluesheet_id ||
                                          nextPair.bs.bluesheet_id ||
                                          nextPair.bs.bluesheetId ||
                                          blueSheet.id
                                        : null;
                                      const isLastOfGroup =
                                        nextPair &&
                                        (!nextPair.bs ||
                                          bsSourceId !== nextSourceId);

                                      return (
                                        <tr
                                          key={rowIdx}
                                          className="border-t border-gray-200 hover:bg-gray-50/50 h-11"
                                        >
                                          {isFirstOfGroup && (
                                            <td
                                              rowSpan={rowSpan}
                                              className={`py-2 px-3 border-r-2 border-gray-400 align-middle text-[11px] font-bold text-black w-10 bg-gray-50 ${rowIdx + rowSpan < comparisonPairs.length ? "border-b-2 border-gray-400" : "border-b border-gray-200"}`}
                                            >
                                              BS-{bsSourceId}
                                            </td>
                                          )}
                                          <td className={`py-2 px-3 border-r border-gray-200 align-middle ${rowIdx < comparisonPairs.length - 1 && nextSourceId && bsSourceId !== nextSourceId ? "border-b-2 border-gray-400" : ""}`}>
                                            {isBlueSheetEditMode ? (
                                              <div className="relative">
                                                <Input
                                                  value={
                                                    editedBlueSheet
                                                      ?.material_entries[bsIdx!]
                                                      ?.material_name || ""
                                                  }
                                                  onChange={(e) => {
                                                    handleBlueSheetMaterialChange(
                                                      bsIdx!,
                                                      "material_name",
                                                      e.target.value,
                                                    );
                                                    handleProductSearch(
                                                      e.target.value,
                                                      bsIdx!,
                                                    );
                                                  }}
                                                  onBlur={() =>
                                                    setTimeout(() => {
                                                      setActiveRow(null);
                                                      setFilteredProducts([]);
                                                    }, 200)
                                                  }
                                                  onFocus={() => {
                                                    const n =
                                                      editedBlueSheet
                                                        ?.material_entries[
                                                        bsIdx!
                                                      ]?.material_name;
                                                    if (n && n.length >= 2)
                                                      handleProductSearch(
                                                        n,
                                                        bsIdx!,
                                                      );
                                                  }}
                                                  className="h-8 text-xs"
                                                  placeholder="Search product..."
                                                />
                                                {activeRow === bsIdx &&
                                                  filteredProducts.length >
                                                    0 && (
                                                    <div
                                                      className="absolute z-50 bg-white border w-full max-h-36 overflow-y-auto shadow-lg rounded-md mt-0.5"
                                                      onMouseDown={(e) =>
                                                        e.preventDefault()
                                                      }
                                                    >
                                                      {filteredProducts.map(
                                                        (product: any) => (
                                                          <div
                                                            key={product.id}
                                                            className="px-2 py-1.5 text-xs hover:bg-blue-50 cursor-pointer border-b border-gray-50"
                                                            onMouseDown={(
                                                              e,
                                                            ) => {
                                                              e.preventDefault();
                                                              handleBlueSheetMaterialUpdateAll(
                                                                bsIdx!,
                                                                product,
                                                              );
                                                            }}
                                                          >
                                                            <div className="font-medium">
                                                              {
                                                                product.product_name
                                                              }
                                                            </div>
                                                            <div className="text-gray-400 text-[10px]">
                                                              {product.jdp_sku}{" "}
                                                              ·{" "}
                                                              {formatCurrency(
                                                                product.jdp_price ||
                                                                  0,
                                                              )}
                                                            </div>
                                                          </div>
                                                        ),
                                                      )}
                                                    </div>
                                                  )}
                                              </div>
                                            ) : (
                                              <span className="font-small text-[#1a1a2e]">
                                                {bs.material_name}
                                              </span>
                                            )}
                                          </td>
                                          <td className={`py-2 px-2 text-center border-r border-gray-200 align-middle ${rowIdx < comparisonPairs.length - 1 && nextSourceId && bsSourceId !== nextSourceId ? "border-b-2 border-gray-400" : ""}`}>
                                            {isBlueSheetEditMode ? (
                                              <Input
                                                type="number"
                                                value={bs.material_used}
                                                onChange={(e) =>
                                                  handleBlueSheetMaterialChange(
                                                    bsIdx!,
                                                    "material_used",
                                                    parseFloat(
                                                      e.target.value,
                                                    ) || 0,
                                                  )
                                                }
                                                className="h-7 text-center text-xs w-12 mx-auto"
                                                min="0"
                                              />
                                            ) : (
                                              <span className="font-medium">
                                                {bs.material_used}
                                              </span>
                                            )}
                                          </td>
                                          <td className={`py-2 px-3 text-right border-r border-gray-200 align-middle ${rowIdx < comparisonPairs.length - 1 && nextSourceId && bsSourceId !== nextSourceId ? "border-b-2 border-gray-400" : ""}`}>
                                            {isBlueSheetEditMode ? (
                                              <Input
                                                type="number"
                                                step="0.01"
                                                value={bs.unit_cost}
                                                onChange={(e) =>
                                                  handleBlueSheetMaterialChange(
                                                    bsIdx!,
                                                    "unit_cost",
                                                    parseFloat(
                                                      e.target.value,
                                                    ) || 0,
                                                  )
                                                }
                                                className="h-7 text-xs text-right"
                                                min="0"
                                              />
                                            ) : (
                                              formatCurrency(bs.unit_cost)
                                            )}
                                          </td>
                                          <td className={`py-2 px-3 text-right font-semibold text-[#00A1FF] border-r border-gray-200 align-middle ${rowIdx < comparisonPairs.length - 1 && nextSourceId && bsSourceId !== nextSourceId ? "border-b-2 border-gray-400" : ""}`}>
                                            {formatCurrency(
                                              bs.total_cost ||
                                                bs.material_used * bs.unit_cost,
                                            )}
                                          </td>
                                          {isBlueSheetEditMode &&
                                            currentBlueSheet.material_entries
                                              .length > 1 && (
                                              <td className={`py-1 border-r border-gray-200 align-middle ${rowIdx < comparisonPairs.length - 1 && nextSourceId && bsSourceId !== nextSourceId ? "border-b-2 border-gray-400" : ""}`}>
                                                <button
                                                  onClick={() =>
                                                    removeBlueSheetMaterial(
                                                      bsIdx!,
                                                    )
                                                  }
                                                  className="text-red-400 hover:text-red-600 hover:bg-red-50 rounded p-0.5"
                                                  title="Remove"
                                                >
                                                  <X className="h-3 w-3" />
                                                </button>
                                              </td>
                                            )}
                                        </tr>
                                      );
                                    })}

                                    {/* Labor entries grouped by BlueSheet */}
                                    {(() => {
                                      const sources =
                                        selectedBlueSheets &&
                                        selectedBlueSheets.length > 0
                                          ? selectedBlueSheets
                                          : blueSheet
                                          ? [blueSheet]
                                          : [];

                                      const laborRows: Array<{
                                        bsId: any;
                                        entry: any;
                                        isFirst: boolean;
                                        groupSize: number;
                                      }> = [];
                                      sources.forEach((bs: any) => {
                                        const bsId =
                                          bs.id ??
                                          bs.blueSheetId ??
                                          bs.bluesheet_id;
                                        const labors = Array.isArray(
                                          bs.labor_entries,
                                        )
                                          ? bs.labor_entries
                                          : [];
                                        labors.forEach(
                                          (l: any, i: number) => {
                                            laborRows.push({
                                              bsId,
                                              entry: l,
                                              isFirst: i === 0,
                                              groupSize: labors.length,
                                            });
                                          },
                                        );
                                      });

                                      if (laborRows.length === 0) return null;

                                      const colSpanAll =
                                        isBlueSheetEditMode &&
                                        currentBlueSheet.material_entries
                                          .length > 1
                                          ? 6
                                          : 5;

                                      return (
                                        <>
                                          <thead>
                              <tr className="bg-[#162f3d] text-white text-xs">
                                <th className="text-left py-2.5 px-3 font-medium border-r-2 border-gray-400">
                                  
                                </th>
                                <th className="text-left py-2.5 px-3 font-medium border-r border-white/20">
                                  Description
                                </th>
                                <th className="text-center py-2.5 px-2 w-14">
                                  total hours
                                </th>
                                <th className="text-right py-2.5 px-3 w-24">
                                  total cost
                                </th>
                                {/* <th className="text-right py-2.5 px-3 w-24">
                                  Amount
                                </th> */}
                                </tr>
                                </thead>
                                          {/* <tr>
                                            <td
                                              colSpan={colSpanAll}
                                              className="px-3 py-1.5 bg-amber-50 text-[10px] font-semibold uppercase text-amber-700 tracking-wide border-t-2 border-gray-400"
                                            >
                                              Labor Entries
                                            </td>
                                          </tr> */}
                                          {laborRows.map(
                                            (
                                              { bsId, entry: l, isFirst, groupSize },
                                              i,
                                            ) => (
                                              <tr
                                                key={l.id ?? i}
                                                className="border-t border-gray-200 hover:bg-amber-50/30 h-11"
                                              >
                                                {isFirst && (
                                                  <td
                                                    rowSpan={groupSize}
                                                    className="py-2 px-3 border-r-2 border-gray-400 align-middle text-[11px] font-bold text-black w-10 bg-gray-50"
                                                  >
                                                    BS-{bsId}
                                                  </td>
                                                )}
                                                <td className="py-2 px-3 border-r border-gray-200 align-middle">
                                                  {l.description ||
                                                    l.employee_name ||
                                                    l.role ||
                                                    "Labor"}
                                                </td>
                                                <td className="py-2 px-3 text-center border-r border-gray-200 align-middle">
                                                  {l.total_hours || "—"}
                                                </td>
                                                <td className="py-2 px-3 text-right border-r border-gray-200 align-middle text-gray-400">
                                                  —
                                                </td>
                                                <td className="py-2 px-3 text-right font-semibold text-[#00A1FF] border-r border-gray-200 align-middle">
                                                  {formatCurrency(
                                                    l.total_cost ?? 0,
                                                  )}
                                                </td>
                                                {isBlueSheetEditMode &&
                                                  currentBlueSheet
                                                    .material_entries.length >
                                                    1 && <td />}
                                              </tr>
                                            ),
                                          )}
                                        </>
                                      );
                                    })()}
                                  </tbody>
                                <tfoot>
  <tr className="border-t-2 border-gray-200 bg-gray-50 font-semibold">
    <td
      colSpan={3}
      className="py-2 px-3 text-right text-black font-bold text-[15px]"
    >
      Material total
    </td>
    <td
      colSpan={2}
      className="py-2 px-3 text-right text-black font-bold text-[15px]"
    >
      {formatCurrency(materialTotal)}
    </td>
    {isBlueSheetEditMode &&
      currentBlueSheet.material_entries.length > 1 && <td />}
  </tr>

  {laborEntriesTotalCost > 0 && (
    <tr className="text-xs text-black">
      <td
        colSpan={3}
        className="py-2 px-3 text-right font-bold text-[15px]"
      >
        Labor Total Cost
      </td>
      <td
        colSpan={2}
        className="py-2 px-3 text-right font-bold text-[15px]"
      >
        {formatCurrency(laborEntriesTotalCost)}
      </td>
      {isBlueSheetEditMode &&
        currentBlueSheet.material_entries.length > 1 && <td />}
    </tr>
  )}

  {laborEntriesTotalCost > 0 && (
    <tr className="text-xs text-black">
      <td
        colSpan={3}
        className="py-2 px-3 text-right font-bold text-[16px]"
      >
        Total
      </td>
      <td
        colSpan={2}
        className="py-2 px-3 text-right font-bold text-[16px]"
      >
        {formatCurrency(materialTotal + laborEntriesTotalCost)}
      </td>
      {isBlueSheetEditMode &&
        currentBlueSheet.material_entries.length > 1 && <td />}
    </tr>
  )}
</tfoot>
                                </table>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    /* Full-width BlueSheet when no supplier invoice */
                    <Card className="border border-[#00A1FF]/30 shadow-md overflow-hidden">
                      <CardHeader className="bg-[#1a2f3d] text-white py-4 px-5">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-[#00A1FF]" />{" "}
                          BlueSheet Materials
                        </CardTitle>
                        <p className="text-xs text-white/80 mt-1 capitalize">
                          PO: BS-{blueSheet.id} · {blueSheet.job.job_title} ·{" "}
                          {blueSheet.job.customer?.customer_name || "N/A"}
                        </p>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm border-collapse">
                            <thead>
                              <tr className="bg-[#162f3d] text-white text-xs">
                                <th className="text-left py-2.5 px-3 font-medium border-r-2 border-gray-400">
                                  BlueSheet
                                </th>
                                <th className="text-left py-2.5 px-3 font-medium border-r border-white/20">
                                  Description
                                </th>
                                <th className="text-center py-2.5 px-2 w-14">
                                  Qty
                                </th>
                                <th className="text-right py-2.5 px-3 w-24">
                                  Rate
                                </th>
                                <th className="text-right py-2.5 px-3 w-24">
                                  Amount
                                </th>
                                {isBlueSheetEditMode &&
                                  currentBlueSheet.material_entries.length >
                                    1 && <th className="w-8" />}
                              </tr>
                            </thead>
                            <tbody>
                              {currentBlueSheet.material_entries.length ===
                              0 ? (
                                <tr className="border-t border-gray-100 bg-white">
                                  <td
                                    colSpan={5}
                                    className="py-4 px-3 text-center text-sm text-gray-500"
                                  >
                                    No material data in this BlueSheet
                                  </td>
                                  {isBlueSheetEditMode &&
                                    currentBlueSheet.material_entries.length >
                                      1 && <td />}
                                </tr>
                              ) : (
                                currentBlueSheet.material_entries.map(
                                  (item: any, idx: number) => {
                                    const bsSourceId =
                                      item.job_bluesheet_id ||
                                      item.bluesheet_id ||
                                      item.bluesheetId ||
                                      currentBlueSheet.id;
                                    const prevItem =
                                      idx > 0
                                        ? currentBlueSheet.material_entries[
                                            idx - 1
                                          ]
                                        : null;
                                    const prevSourceId = prevItem
                                      ? prevItem.job_bluesheet_id ||
                                        prevItem.bluesheet_id ||
                                        prevItem.bluesheetId ||
                                        currentBlueSheet.id
                                      : null;
                                    const nextItem =
                                      idx <
                                      currentBlueSheet.material_entries.length -
                                        1
                                        ? currentBlueSheet.material_entries[
                                            idx + 1
                                          ]
                                        : null;
                                    const nextSourceId = nextItem
                                      ? nextItem.job_bluesheet_id ||
                                        nextItem.bluesheet_id ||
                                        nextItem.bluesheetId ||
                                        currentBlueSheet.id
                                      : null;
                                    const isLastOfGroup =
                                      nextItem && bsSourceId !== nextSourceId;

                                    const isFirstOfGroup =
                                      !prevItem || bsSourceId !== prevSourceId;

                                    // inject labor entries after the last material row of each BS group
                                    const isEndOfBsGroup =
                                      !nextItem || bsSourceId !== nextSourceId;

                                    const laborSources =
                                      selectedBlueSheets &&
                                      selectedBlueSheets.length > 0
                                        ? selectedBlueSheets
                                        : blueSheet
                                        ? [blueSheet]
                                        : [];

                                    const laborForGroup: any[] = isEndOfBsGroup
                                      ? (Array.isArray(
                                          laborSources.find(
                                            (bs: any) =>
                                              String(
                                                bs.id ??
                                                  bs.blueSheetId ??
                                                  bs.bluesheet_id,
                                              ) === String(bsSourceId),
                                          )?.labor_entries,
                                        )
                                          ? laborSources.find(
                                              (bs: any) =>
                                                String(
                                                  bs.id ??
                                                    bs.blueSheetId ??
                                                    bs.bluesheet_id,
                                                ) === String(bsSourceId),
                                            )!.labor_entries
                                          : [])
                                      : [];

                                    // rowSpan: BS-xxx cell spans all material rows of this group
                                    let rowSpan = 1;
                                    if (isFirstOfGroup) {
                                      for (
                                        let i = idx + 1;
                                        i < currentBlueSheet.material_entries.length;
                                        i++
                                      ) {
                                        const next = currentBlueSheet.material_entries[i];
                                        const nId =
                                          next.job_bluesheet_id ||
                                          next.bluesheet_id ||
                                          next.bluesheetId ||
                                          currentBlueSheet.id;
                                        if (nId !== bsSourceId) break;
                                        rowSpan++;
                                      }
                                    }

                                    return (
                                      <React.Fragment key={idx}>
                                        {/* Material data row */}
                                        <tr className="border-t border-gray-100 hover:bg-gray-50/50">
                                          {isFirstOfGroup && (
                                            <td
                                              className="py-2 px-3 border-r-2 border-gray-400 w-10 bg-gray-50"
                                              rowSpan={rowSpan}
                                            >
                                              <span className="text-[11px] font-bold text-black">
                                                BS-{bsSourceId}
                                              </span>
                                            </td>
                                          )}
                                          <td className="py-2 px-3">
                                            {isBlueSheetEditMode ? (
                                              <div className="relative">
                                                <Input
                                                  value={
                                                    editedBlueSheet
                                                      ?.material_entries[idx]
                                                      ?.material_name || ""
                                                  }
                                                  onChange={(e) => {
                                                    handleBlueSheetMaterialChange(
                                                      idx,
                                                      "material_name",
                                                      e.target.value,
                                                    );
                                                    handleProductSearch(
                                                      e.target.value,
                                                      idx,
                                                    );
                                                  }}
                                                  onBlur={() =>
                                                    setTimeout(() => {
                                                      setActiveRow(null);
                                                      setFilteredProducts([]);
                                                    }, 200)
                                                  }
                                                  onFocus={() => {
                                                    const n =
                                                      editedBlueSheet
                                                        ?.material_entries[idx]
                                                        ?.material_name;
                                                    if (n && n.length >= 2)
                                                      handleProductSearch(
                                                        n,
                                                        idx,
                                                      );
                                                  }}
                                                  className="h-8 text-xs"
                                                  placeholder="Search product..."
                                                />
                                                {activeRow === idx &&
                                                  filteredProducts.length >
                                                    0 && (
                                                    <div
                                                      className="absolute z-50 bg-white border w-full max-h-36 overflow-y-auto shadow-lg rounded-md mt-0.5"
                                                      onMouseDown={(e) =>
                                                        e.preventDefault()
                                                      }
                                                    >
                                                      {filteredProducts.map(
                                                        (product: any) => (
                                                          <div
                                                            key={product.id}
                                                            className="px-2 py-1.5 text-xs hover:bg-blue-50 cursor-pointer border-b border-gray-50"
                                                            onMouseDown={(
                                                              e,
                                                            ) => {
                                                              e.preventDefault();
                                                              handleBlueSheetMaterialUpdateAll(
                                                                idx,
                                                                product,
                                                              );
                                                            }}
                                                          >
                                                            <div className="font-medium">
                                                              {
                                                                product.product_name
                                                              }
                                                            </div>
                                                            <div className="text-gray-400 text-[10px]">
                                                              {product.jdp_sku}{" "}
                                                              ·{" "}
                                                              {formatCurrency(
                                                                product.jdp_price ||
                                                                  0,
                                                              )}
                                                            </div>
                                                          </div>
                                                        ),
                                                      )}
                                                    </div>
                                                  )}
                                              </div>
                                            ) : (
                                              <span className="font-small text-[#1a1a2e]">
                                                {item.material_name}
                                              </span>
                                            )}
                                          </td>
                                          <td className="py-2 px-2 text-center">
                                            {isBlueSheetEditMode ? (
                                              <Input
                                                type="number"
                                                value={item.material_used}
                                                onChange={(e) =>
                                                  handleBlueSheetMaterialChange(
                                                    idx,
                                                    "material_used",
                                                    parseFloat(
                                                      e.target.value,
                                                    ) || 0,
                                                  )
                                                }
                                                className="h-7 text-center text-xs w-12 mx-auto"
                                                min="0"
                                              />
                                            ) : (
                                              <span className="font-medium">
                                                {item.material_used}
                                              </span>
                                            )}
                                          </td>
                                          <td className="py-2 px-3 text-right">
                                            {isBlueSheetEditMode ? (
                                              <Input
                                                type="number"
                                                step="0.01"
                                                value={item.jdp_price}
                                                onChange={(e) =>
                                                  handleBlueSheetMaterialChange(
                                                    idx,
                                                    "jdp_price",
                                                    parseFloat(
                                                      e.target.value,
                                                    ) || 0,
                                                  )
                                                }
                                                className="h-7 text-xs text-right w-[100px] min-w-[100px]"
                                                min="0"
                                              />
                                            ) : (
                                              formatCurrency(item.jdp_price)
                                            )}
                                          </td>
                                          <td className="py-2 px-3 text-right font-semibold text-[#00A1FF]">
                                            {formatCurrency(
                                              item.total_cost ||
                                                item.material_used *
                                                  item.jdp_price,
                                            )}
                                          </td>
                                          {isBlueSheetEditMode &&
                                            currentBlueSheet.material_entries
                                              .length > 1 && (
                                              <td className="py-1">
                                                <button
                                                  onClick={() =>
                                                    removeBlueSheetMaterial(idx)
                                                  }
                                                  className="text-red-400 hover:text-red-600 hover:bg-red-50 rounded p-0.5"
                                                  title="Remove"
                                                >
                                                  <X className="h-3 w-3" />
                                                </button>
                                              </td>
                                            )}
                                        </tr>

                                        {/* Labor rows: same style as material rows, injected after last material of each group */}
                                        {laborForGroup.map(
                                          (l: any, i: number) => (
                                            <tr
                                              key={l.id ?? i}
                                              className="border-t border-gray-100 hover:bg-gray-50/50"
                                            >
                                              {i === 0 && (
                                                <td
                                                  className="py-2 px-3 border-r-2 border-gray-400 w-10 bg-gray-50"
                                                  rowSpan={laborForGroup.length}
                                                />
                                              )}
                                              <td className="py-2 px-3">
                                                <span className="font-small text-[#1a1a2e]">
                                                  {(() => {
                                                    const name = (l.employee_name || l.role || "Labor")
                                                      .split(" ")
                                                      .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
                                                      .join(" ");

                                                    const formatTime = (t: string) => {
                                                      const m = t.match(/^(\d+)h(\d+)m$/);
                                                      if (!m) return t;
                                                      const h = parseInt(m[1]);
                                                      const min = parseInt(m[2]);
                                                      if (h === 0 && min === 0) return "0 min";
                                                      if (h === 0) return `${min} min`;
                                                      if (min === 0) return `${h} hr`;
                                                      return `${h} hr ${min} min`;
                                                    };

                                                    const formatDate = (d: string) => {
                                                      try {
                                                        return new Date(d).toLocaleDateString("en-GB", {
                                                          day: "numeric",
                                                          month: "short",
                                                          year: "numeric",
                                                        });
                                                      } catch {
                                                        return d;
                                                      }
                                                    };

                                                    const time = l.total_hours ? formatTime(l.total_hours) : null;
                                                    const date = l.updated_at ? formatDate(l.updated_at) : null;

                                                    const timeLabel = time ? `${time} worked` : null;
                                                    return [name, timeLabel, date].filter(Boolean).join(" • ");
                                                  })()}
                                                </span>
                                              </td>
                                              <td className="py-2 px-2 text-center">
                                                <span className="font-medium">1</span>
                                              </td>
                                              <td className="py-2 px-3 text-right">
                                                {formatCurrency(l.hourly_rate ?? 0)}
                                              </td>
                                              <td className="py-2 px-3 text-right font-semibold text-[#00A1FF]">
                                                {formatCurrency(l.total_cost ?? 0)}
                                              </td>
                                              {isBlueSheetEditMode &&
                                                currentBlueSheet.material_entries
                                                  .length > 1 && <td />}
                                            </tr>
                                          ),
                                        )}

                                        {/* Bottom border after each BlueSheet group (after last material or last labor row) */}
                                        {isEndOfBsGroup && (
                                          <tr>
                                            <td
                                              colSpan={99}
                                              className="p-0 border-b-2 border-gray-400"
                                            />
                                          </tr>
                                        )}
                                      </React.Fragment>
                                    );
                                  },
                                )
                              )}
                            </tbody>
                            <tfoot>
                              <tr className="border-t-2 border-gray-200 bg-gray-50 font-semibold">
                                <td
                                  colSpan={3}
                                  className="py-2 px-3 text-right text-black-600 font-bold text-[15px]"
                                >
                                   Material total
                                </td>
                                <td
                                  colSpan={2}
                                  className="py-2 px-3 text-right text-black-600 font-bold text-[15px]"
                                >
                                  {formatCurrency(materialTotal)}
                                </td>
                                {isBlueSheetEditMode &&
                                  currentBlueSheet.material_entries.length >
                                    1 && <td />}
                              </tr>
                              {laborEntriesTotalCost > 0 && (
                                <tr className="text-xs text-black-700">
                                  <td
                                    colSpan={3}
                                    className="py-2 px-3 text-right font-bold text-[15px]"
                                  >
                                    Labor Total Cost
                                  </td>
                                  <td
                                    colSpan={2}
                                    className="py-2 px-3 text-right font-bold text-[15px]"
                                  >
                                    {formatCurrency(laborEntriesTotalCost)}
                                  </td>
                                </tr>
                              )}
                              {laborEntriesTotalCost > 0 && (
                                <tr className=" text-xs text-black-800">
                                  <td
                                    colSpan={3}
                                    className="py-2 px-3 text-right font-bold text-[16px] "
                                  >
                                    Total
                                  </td>
                                  <td
                                    colSpan={2}
                                    className="py-2 px-3 text-right font-bold text-[16px]"
                                  >
                                    {formatCurrency(
                                      materialTotal + laborEntriesTotalCost,
                                    )}
                                  </td>
                                  {isBlueSheetEditMode &&
                                    currentBlueSheet.material_entries.length >
                                      1 && <td />}
                                </tr>
                              )}
                            </tfoot>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Add row / Save / Proceed */}
                  {(isBlueSheetEditMode || isSupplierEditMode) && (
                    <div className="flex flex-wrap gap-2 items-center">
                      {isBlueSheetEditMode && (
                        <Button
                          size="sm"
                          onClick={addBlueSheetMaterial}
                          variant="outline"
                          className="border-dashed border-[#00A1FF] text-[#00A1FF] hover:bg-[#E6F6FF]"
                          disabled={isApproving}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add BlueSheet Row
                        </Button>
                      )}
                      {isSupplierEditMode && (
                        <Button
                          size="sm"
                          onClick={addSupplierMaterial}
                          variant="outline"
                          className="border-dashed border-emerald-500 text-emerald-600 hover:bg-emerald-50"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Supplier Row
                        </Button>
                      )}
                      {isBlueSheetEditMode && (
                        <Button
                          size="sm"
                          onClick={handleBlueSheetSave}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1"
                          disabled={isApproving}
                        >
                          {isApproving ? (
                            <>
                              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="h-3 w-3 mr-1" />
                              Save BlueSheet
                            </>
                          )}
                        </Button>
                      )}
                      {isSupplierEditMode && (
                        <Button
                          size="sm"
                          onClick={handleSupplierSave}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <Save className="h-3 w-3 mr-1" />
                          Save Supplier
                        </Button>
                      )}
                    </div>
                  )}
                  <div className="flex justify-end pt-2">
                    {/* <Button onClick={handleProceedToReview} disabled={isBlueSheetEditMode || isSupplierEditMode || isProceedingToReview} className="bg-[#00A1FF] hover:bg-[#0090e6] text-white gap-2 h-10 text-sm px-6">
                      {isProceedingToReview ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                      {isProceedingToReview ? 'Approving...' : 'Proceed to Final Review'}
                    </Button> */}
                    <div className="flex justify-end pt-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>
                              <Button
                                onClick={() => {
                                  if (isBlueSheetEditMode) return;
                                  handleProceedToReview();
                                }}
                                disabled={
                                  isSupplierEditMode || isProceedingToReview
                                }
                                className="bg-[#00A1FF] hover:bg-[#0090e6] text-white gap-2 h-10 text-sm px-6"
                              >
                                {isProceedingToReview ? (
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                  <ArrowRight className="h-4 w-4" />
                                )}
                                {isProceedingToReview
                                  ? "Approving..."
                                  : "Proceed to Final Review"}
                              </Button>
                            </span>
                          </TooltipTrigger>

                          {isBlueSheetEditMode && (
                            <TooltipContent>
                              <p>
                                Save the BlueSheet before proceeding to final
                                review.
                              </p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* ── Final Review Tab ──────────────────────────────────────── */}
              <TabsContent
                value="review"
                className="h-full overflow-y-auto p-4 md:p-6 mt-0 bg-slate-50/60"
              >
                <div className="space-y-4 w-full px-2">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900">
                        Final Review &amp; Approval
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Double‑check BlueSheet vs Supplier totals before sending
                        the invoice.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col xl:flex-row items-start gap-6">
                    {/* KPI cards - Stacked vertically on the far left */}
                    <div className="flex flex-col gap-3 w-full xl:w-[280px] shrink-0">
                      <Card className="bg-blue-50/80 border border-blue-200 shadow-sm">
                        <CardContent className="p-4 text-left">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <FileText className="h-6 w-6 text-blue-600" />
                              <h4 className="text-xs font-semibold text-blue-900 tracking-wide uppercase">
                                BlueSheet
                              </h4>
                            </div>
                            <span className="text-xs font-medium text-blue-700 bg-white/70 px-1.5 py-0.5 rounded-full">
                              BS-{currentBlueSheet.id}
                            </span>
                          </div>
                          <p className="text-xl font-semibold text-blue-700">
                            {formatCurrency(currentBlueSheet.total_cost)}
                          </p>
                          <p className="text-xs text-blue-800 mt-0.5">
                            {currentBlueSheet.material_entries.length} materials
                            {totalLaborLabel && (
                              <span className="ml-1.5">
                                · Labor {totalLaborLabel}
                              </span>
                            )}
                          </p>
                        </CardContent>
                      </Card>

                      {currentSupplierInvoice && (
                        <Card className="bg-emerald-50/80 border border-emerald-200 shadow-sm">
                          <CardContent className="p-4 text-left">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                              <CheckSquare className="h-6 w-6 text-emerald-600" />
                              <h4 className="text-xs font-semibold text-emerald-900 tracking-wide uppercase">
                                Supplier Materials
                              </h4>
                            </div>
                          </div>
                          <p className="text-xl font-semibold text-emerald-700">
                            {formatCurrency(currentSupplierInvoice.amount)}
                          </p>
                          <p className="text-xs text-emerald-800 mt-0.5">
                            {currentSupplierInvoice.materials.length} materials
                            from supplier
                          </p>
                          </CardContent>
                        </Card>
                      )}

                      {hasComparisonInvoice && (
                        <>
                          <Card className="bg-violet-50/80 border border-violet-200 shadow-sm">
                            <CardContent className="p-4 text-left">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <DollarSign className="h-6 w-6 text-violet-600" />
                                  <h4 className="text-xs font-semibold text-violet-900 tracking-wide uppercase">
                                    Difference
                                  </h4>
                                </div>
                              </div>
                              <p className="text-xl font-semibold text-violet-700">
                                {formatCurrency(
                                  currentSupplierInvoice
                                    ? Math.abs(
                                        currentBlueSheet.total_cost -
                                          currentSupplierInvoice.amount,
                                      )
                                    : 0,
                                )}
                              </p>
                              <p className="text-xs text-violet-800 mt-0.5">
                                {currentSupplierInvoice &&
                                currentBlueSheet.total_cost
                                  ? `${(
                                      (Math.abs(
                                        currentBlueSheet.total_cost -
                                          currentSupplierInvoice.amount,
                                      ) /
                                        (currentBlueSheet.total_cost || 1)) *
                                      100
                                    ).toFixed(1)}% variance`
                                  : "No supplier invoice"}
                              </p>
                            </CardContent>
                          </Card>

                          <Card className="bg-amber-50/80 border border-amber-200 shadow-sm">
                            <CardContent className="p-4 text-left">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <AlertTriangle className="h-6 w-6 text-amber-600" />
                                  <h4 className="text-xs font-semibold text-amber-900 tracking-wide uppercase">
                                    Discrepancies
                                  </h4>
                                </div>
                              </div>
                              <p className="text-xl font-semibold text-amber-700">
                                {
                                  comparisons.filter(
                                    (c) => c.differences.length > 0,
                                  ).length
                                }
                              </p>
                              <p className="text-xs text-amber-800 mt-0.5">
                                items with price / qty differences
                              </p>
                            </CardContent>
                          </Card>
                        </>
                      )}
                    </div>

                    {/* Review Summary & Custom Invoice Content - Now expanded to the right */}
                    <div className="flex-1 flex flex-col gap-6">
                      <Card className="bg-white shadow-sm border border-slate-200/80">
                        <CardHeader className="flex items-center justify-between py-3 px-4">
                          <CardTitle className="text-base font-semibold text-slate-900">
                            Review Summary
                          </CardTitle>
                          <button
                            type="button"
                            onClick={() =>
                              setIsReviewSummaryOpen((prev: any) => !prev)
                            }
                            className={`
                              relative inline-flex h-4 w-8 items-center rounded-full
                              transition-colors duration-200
                              ${isReviewSummaryOpen ? "bg-blue-500" : "bg-gray-300"}
                            `}
                          >
                            <span
                              className={`
                                inline-block h-3 w-3 transform rounded-full bg-white shadow
                                transition-transform duration-200
                                ${isReviewSummaryOpen ? "translate-x-4" : "translate-x-1"}
                              `}
                            />
                          </button>
                        </CardHeader>
                        {isReviewSummaryOpen && (
                          <CardContent className="space-y-6 pb-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <Label className="text-xs font-semibold uppercase text-slate-500">
                                  Customer
                                </Label>
                                <p className="text-sm font-medium text-[#00A1FF] mt-0.5">
                                  {currentBlueSheet.job.customer?.customer_name ||
                                    currentBlueSheet.job.contractor
                                      ?.contractor_name ||
                                    "N/A"}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {currentBlueSheet.job.customer?.email ||
                                    currentBlueSheet.job.contractor?.email ||
                                    currentBlueSheet.job.bill_to_email ||
                                    "—"}
                                </p>
                              </div>
                              <div>
                                <Label className="text-xs font-semibold uppercase text-slate-500">
                                  Job
                                </Label>
                                <p className="text-sm font-medium mt-0.5">
                                  {currentBlueSheet.job.job_title}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {currentBlueSheet.job.job_type ===
                                  "contract_based"
                                    ? "Contract Based"
                                    : "Service Based"}{" "}
                                  · {currentBlueSheet.job.status}
                                </p>
                              </div>
                              <div>
                                <Label className="text-xs font-semibold uppercase text-slate-500">
                                  PO / BlueSheet
                                </Label>
                                <p className="text-sm font-mono mt-0.5">
                                  {/* BS-{currentBlueSheet.id} */}
                                  {(() => {
                                      const ids = getSelectedBlueSheetIds();
                                      return getSelectedBlueSheetIds().length > 0
                                        ? getSelectedBlueSheetIds().map((id) => `BS-${id}`).join(", ")
                                        : `BS-${currentBlueSheet.id}`;
                                    })()}
                                </p>
                                <p className="text-xs text-slate-500">
                                  Created on{" "}
                                  {new Date(
                                    currentBlueSheet.created_at,
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                              <div>
                                <Label className="text-xs font-semibold uppercase text-slate-500">
                                  Submitted By
                                </Label>
                                <p className="text-sm font-medium mt-0.5">
                                  {currentBlueSheet.created_by_user.full_name}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {currentBlueSheet.created_by_user.email}
                                </p>
                              </div>
                              <div>
                                <Label className="text-xs font-semibold uppercase text-slate-500">
                                  Bill To
                                </Label>
                                <p className="text-xs mt-0.5 text-slate-800">
                                  {currentBlueSheet.job.bill_to_address ||
                                    currentBlueSheet.job.customer?.address ||
                                    currentBlueSheet.job.contractor?.address ||
                                    "—"}
                                </p>
                                {currentBlueSheet.job.bill_to_city_zip && (
                                  <p className="text-xs text-slate-500">
                                    {currentBlueSheet.job.bill_to_city_zip}
                                  </p>
                                )}
                              </div>
                              <div>
                                <Label className="text-xs font-semibold uppercase text-slate-500">
                                  Labor
                                </Label>
                                <p className="text-sm font-medium mt-0.5">
                                  {totalLaborLabel || "No labor hours"}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {currentBlueSheet.labor_entries?.length || 0}{" "}
                                  labor entries
                                </p>
                              </div>
                            </div>

                            <Separator />

                            {/* BlueSheet uploaded images */}
                            {(() => {
                              const sources =
                                selectedBlueSheets && selectedBlueSheets.length > 0
                                  ? selectedBlueSheets
                                  : blueSheet
                                  ? [blueSheet]
                                  : [];
                              const sheetsWithImages = sources
                                .map((bs: any) => ({
                                  id: bs.id ?? bs.blueSheetId ?? bs.bluesheet_id,
                                  images: Array.isArray(bs.images)
                                    ? (bs.images as string[]).filter(Boolean)
                                    : bs.images
                                    ? [bs.images as string]
                                    : [],
                                }))
                                .filter((bs) => bs.images.length > 0);

                              if (sheetsWithImages.length === 0) return null;

                              const isMultiple = sheetsWithImages.length > 1;
                              return (
                                <div>
                                  <Label className="text-xs font-semibold uppercase text-slate-500 mb-3 block">
                                    Uploaded Images
                                  </Label>
                                  <div
                                    className="space-y-4 overflow-y-auto pr-1"
                                    style={{ maxHeight: 250 }}
                                  >
                                    {sheetsWithImages.map((bs) => (
                                      <div key={bs.id}>
                                        {isMultiple && (
                                          <p className="text-xs font-semibold text-slate-600 mb-2">
                                            BlueSheet #{bs.id} Images
                                          </p>
                                        )}
                                        <div className="flex flex-wrap gap-2">
                                          {bs.images.map((url, idx) => (
                                            <a
                                              key={idx}
                                              href={url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              title={`BlueSheet #${bs.id} — image ${idx + 1}`}
                                            >
                                              <img
                                                src={url}
                                                alt={`BlueSheet #${bs.id} image ${idx + 1}`}
                                                className="w-20 h-20 object-cover rounded-lg border border-slate-200 hover:opacity-75 transition-opacity cursor-pointer"
                                              />
                                            </a>
                                          ))}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })()}

                            <Separator />

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              <div>
                                <Label className="text-xs font-semibold uppercase text-slate-500">
                                  Notes
                                </Label>
                                <Textarea
                                  value={invoiceApprovalNotes}
                                  onChange={(e) => {
                                    const nextNotes = e.target.value;
                                    invoiceApprovalNotesRef.current = nextNotes;
                                    setInvoiceApprovalNotes(nextNotes);
                                    setEditedBlueSheet((prev) =>
                                      prev
                                        ? {
                                            ...prev,
                                            notes: nextNotes,
                                          }
                                        : prev,
                                    );
                                  }}
                                  placeholder="Add any final notes or internal instructions for this approval..."
                                  className="mt-2 h-20 text-sm"
                                  rows={3}
                                />
                              </div>
                              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
                                <div>
                                  <h5 className="text-sm font-semibold text-slate-800 mb-1">
                                    Last Minute Edits
                                  </h5>
                                  <p className="text-xs text-slate-500 mb-3">
                                    Need to tweak materials before sending the
                                    invoice? Jump back to comparison view.
                                  </p>
                                </div>
                                <div className="flex gap-3">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentStep("upload")}
                                    className="gap-2 h-8 text-sm border-slate-300"
                                  >
                                    <Edit className="h-3 w-3" />
                                    Edit Materials
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        )}
                      </Card>

                      {/* Custom Invoice Dialog content below Review Summary */}
                      <div className="mt-0">
                        <CustomInvoiceDialog
                          invoiceNotesRef={invoiceApprovalNotesRef}
                          open={true}
                          invalidHeaderKeys={invalidHeaderKeys}
                          setInvalidHeaderKeys={clearInvalidHeaderKeys}
                          validateHeaderGroupsBeforeSubmit={
                            validateHeaderGroupsBeforeSubmit
                          }
                          onOpenChange={() => setIsCustomInvoiceOpen(false)}
                          blueSheet={currentBlueSheet}
                          registerPreviewAndSend={registerPreviewAndSendStable}
                          selectedBluesheetIds={getSelectedBlueSheetIds()}
                          onProcessingChange={setCustomInvoiceProcessing}
                          onInvoiceTypeChange={setSelectedInvoiceType}
                          defaultInvoiceType="Progressive Invoice"
                          onDone={onClose}
                          onInvoiceSaved={() => {
                            void onEstimatesRefresh?.();
                          }}
                          onLineItemsSync={syncCustomInvoiceLineItemsToBlueSheet}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Footer actions */}
                  <div className="flex items-center justify-between pt-2">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep("upload")}
                      className="gap-2 h-11 text-sm px-5 border-slate-300"
                      size="lg"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back to Comparison
                    </Button>
                    <div className="flex gap-4 items-center">
                      <Button
                        variant="outline"
                        onClick={onClose}
                        className="h-11 text-sm px-5 border-slate-300"
                        size="lg"
                      >
                        Cancel
                      </Button>
                      <div className="flex gap-3">
                        {/* <Button
                          onClick={handleSendCustomInvoice}
                          disabled={isApprovingCustomer || isApproving}
                          className="bg-[#00A1FF] text-white hover:bg-[#0089d4] gap-2 h-11 text-sm px-6 rounded-lg shadow-sm"
                          size="lg"
                        >
                          <Send className="h-4 w-4" />
                          {isApprovingCustomer ? 'Approving...' : 'Review Custom Invoice'}
                        </Button> */}
                        <Button
                          onClick={() => handleFinalApproval("save")}
                          disabled={estimateActionsDisabled}
                          className="bg-emerald-600 text-white hover:bg-emerald-700 gap-2 h-11 text-sm px-6 rounded-lg shadow-sm"
                          size="lg"
                        >
                          <Save className="h-4 w-4" />
                          {isSaving ? "Saving..." : "Save Invoice to Quickbook"}
                        </Button>
                        <Button
                          onClick={() => handleFinalApproval("send")}
                          disabled={estimateActionsDisabled}
                          className="bg-emerald-600 text-white hover:bg-emerald-700 gap-2 h-11 text-sm px-6 rounded-lg shadow-sm"
                          size="lg"
                        >
                          <Send className="h-4 w-4" />
                          {isApproving
                            ? "Sending..."
                            : "Send Invoice From Quickbook"}
                        </Button>

                        <Button
                          onClick={async () => {
                            if (!previewAndSendRef.current) return;
                            try {
                              setIsApprovingCustomer(true);
                              await previewAndSendRef.current();
                            } finally {
                              setIsApprovingCustomer(false);
                            }
                          }}
                          disabled={estimateActionsDisabled}
                          className="bg-emerald-600 text-white hover:bg-emerald-700 gap-2 h-11 text-sm px-6 rounded-lg shadow-sm"
                          size="lg"
                        >
                          <Send className="h-4 w-4" />
                          {isApprovingCustomer || customInvoiceProcessing
                            ? "Sending..."
                            : "Send Invoice Directly"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
