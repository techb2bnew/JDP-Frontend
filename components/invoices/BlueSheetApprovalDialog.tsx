'use client'

import React, { useState, useRef, useEffect } from 'react'
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
import {
  Upload,
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
  ArrowLeft
} from 'lucide-react'
import { apiClient } from '@/utils/api'

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
  onApprovalComplete: (approvedItem: BlueSheetItem) => void
}

export function BlueSheetApprovalDialog({
  isOpen,
  onClose,
  blueSheet,
  onApprovalComplete
}: BlueSheetApprovalDialogProps) {
  console.log('Dialog render', { isOpen, blueSheet })
  const [supplierInvoice, setSupplierInvoice] = useState<SupplierInvoice | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isAutoFetching, setIsAutoFetching] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [currentStep, setCurrentStep] = useState<'upload' | 'comparison' | 'review'>('upload')
  const [isBlueSheetEditMode, setIsBlueSheetEditMode] = useState(false)
  const [isSupplierEditMode, setIsSupplierEditMode] = useState(false)
  const [editedBlueSheet, setEditedBlueSheet] = useState<BlueSheetItem | null>(null)
  const [editedSupplierInvoice, setEditedSupplierInvoice] = useState<SupplierInvoice | null>(null)
  const [isApproving, setIsApproving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [filteredProducts, setFilteredProducts] = useState<any[]>([])
  const [activeRow, setActiveRow] = useState<number | null>(null)
  const searchDebounceRef = useRef<NodeJS.Timeout>()

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
      setEditedBlueSheet(JSON.parse(JSON.stringify(blueSheet))) // deep copy
      setEditedSupplierInvoice(null)
      setFilteredProducts([])
      setActiveRow(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }, [isOpen, blueSheet])

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

  if (!blueSheet) return null

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

    const totalOrdered = currentMaterial.total_ordered || 1
    const unitCost = product.jdp_price || product.unit_cost || 0
    const totalCost = totalOrdered * unitCost
 
    newMaterials[index] = {
      ...currentMaterial,
      material_name: product.product_name,
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

  // ─── handleBlueSheetMaterialChange ────────────────────────────────────────
  // Sirf ek field update — product_id ko KABHI reset mat karo
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
      console.log('=== SAVE DEBUG ===')

      const materialsForAPI = editedBlueSheet.material_entries.map((item: any) => {
        // ── product_id: item.product_id > item.product.id > null ──
        const resolvedProductId =
          item.product_id != null ? Number(item.product_id) :
          item.product?.id != null ? Number(item.product.id) :
          null

        // ── materialId: sirf existing (non-new) rows ke liye ──
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
      const newMaterials = editedBlueSheet.material_entries.map((item: any, index: number) => {
        const apiMaterial = updatedMaterials[index]
        console.log('apiMaterial', apiMaterial)
        return {
          ...item,
          ...(apiMaterial?.id ? { id: apiMaterial.id } : {}),
          product_id: item.product_id,  // preserve — API might not return it
          _isNew: false,
          job_bluesheet_id: apiMaterial?.job_bluesheet_id || item.job_bluesheet_id,
        }
      })

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
      setCurrentStep('comparison')
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
          return {
            name: item.name || item.description || `Item ${index + 1}`,
            quantity,
            unitPrice,
            total: Number(item.total ?? item.line_total ?? item.amount ?? quantity * unitPrice),
          }
        }),
        status: 'received',
      }

      if (!mappedInvoice.materials.length) throw new Error('No materials found in fetched supplier invoice')
      setSupplierInvoice(mappedInvoice)
      setEditedSupplierInvoice(null)
      setCurrentStep('comparison')
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
    }
    setEditedBlueSheet({ ...editedBlueSheet, material_entries: [...editedBlueSheet.material_entries, newMaterial] })
    toast.info('New material row added')
  }

  const addSupplierMaterial = () => {
    if (!editedSupplierInvoice) return
    setEditedSupplierInvoice({
      ...editedSupplierInvoice,
      materials: [...editedSupplierInvoice.materials, { name: 'New Supplier Item', quantity: 1, unitPrice: 0, total: 0 }],
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

  // ─── Proceed / Final Approval ──────────────────────────────────────────────
  const handleProceedToReview = () => {
    if (isBlueSheetEditMode || isSupplierEditMode) {
      toast.error('Please save your changes before proceeding')
      return
    }
    setCurrentStep('review')
  }

  const handleFinalApproval = async () => {
    const finalBlueSheet = editedBlueSheet || blueSheet
    if (!finalBlueSheet) return
    try {
      setIsApproving(true)

      const customProducts = finalBlueSheet.material_entries.map((item: any) => ({
        ...(item.product?.id ? { id: item.product.id } : {}),
        job_id: finalBlueSheet.job_id,
        product_name: item.material_name,
        description: item.product?.description || item.material_name,
        supplier_id: item.product?.supplier_id ?? item.product?.suppliers?.id ?? 1,
        supplier_sku: item.product?.supplier_sku || '',
        jdp_sku: item.product?.jdp_sku || item.jdp_sku || '',
        unit: item.unit || 'piece',
        stock_quantity: item.total_ordered || 0,
        unit_cost: item.unit_cost || 0,
        estimated_price: item.unit_cost || 0,
        total_cost: item.total_cost ?? (item.total_ordered || 0) * (item.unit_cost || 0),
        jdp_price: item.unit_cost || 0,
        is_custom: false,
      }))

      const today = new Date().toISOString().split('T')[0]
      const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      const estimatePayload = {
        job_id: finalBlueSheet.job_id,
        estimate_title: `BlueSheet #${finalBlueSheet.id} — ${finalBlueSheet.job.job_title}`,
        priority: (finalBlueSheet.job.priority as 'low' | 'medium' | 'high') || 'medium',
        service_type: finalBlueSheet.job.job_type === 'contract_based' ? 'contract_based' : 'service_based',
        invoice_type: 'estimate',
        status: 'draft',
        estimate_date: today,
        due_date: thirtyDaysLater,
        invoice_number: `INV-BS-${finalBlueSheet.id}-${Date.now().toString().slice(-6)}`,
        issue_date: today,
        email_address: finalBlueSheet.job.customer?.email || finalBlueSheet.job.bill_to_email || '',
        bill_to_address: finalBlueSheet.job.bill_to_address || finalBlueSheet.job.customer?.address || '',
        customer_id: finalBlueSheet.job.customer?.id ?? 0,
        po_number: `BS-${finalBlueSheet.id}`,
        rep: finalBlueSheet.created_by_user?.full_name || '',
        notes: finalBlueSheet.notes || '',
        total_amount: finalBlueSheet.total_cost + (finalBlueSheet.additional_charges ?? 0),
        location: finalBlueSheet.job.bill_to_address || '',
        valid_until: thirtyDaysLater,
        description: finalBlueSheet.notes || '',
        custom_products: customProducts,
        invoice_source: "quickbook",  
      }

      await apiClient.createEstimate(estimatePayload)
      await apiClient.approveBluesheet(finalBlueSheet.id, 'approved')
      onApprovalComplete(finalBlueSheet)
      toast.success('BlueSheet approved & estimate created!')
      onClose()
    } catch (error: any) {
      toast.error(error?.message || 'Failed to create estimate.')
    } finally {
      setIsApproving(false)
    }
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(amount)

  const currentBlueSheet = editedBlueSheet || blueSheet
  const currentSupplierInvoice = editedSupplierInvoice || supplierInvoice
  const comparisons = generateComparison()
  const totalDiscrepancyAmount = comparisons.reduce((sum, comp) => {
    if (comp.blueSheetItem && comp.supplierItem)
      return sum + Math.abs((comp.blueSheetItem.total_cost || 0) - comp.supplierItem.total)
    return sum
  }, 0)

  // ──────────────────────────────────────────────────────────────────────────
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-screen h-screen max-w-full max-h-full min-w-full min-h-full overflow-hidden p-0 rounded-none border-0">
        <DialogHeader className="p-8 pb-6 border-b bg-white">
          <DialogTitle className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-[#00A1FF]" />
            <span className="text-xl">BlueSheet Review & Approve</span>
            <Badge className="ml-3 bg-blue-50 text-blue-600 border-blue-200 px-3 py-1">
              BS-{blueSheet.id}
            </Badge>
            {(isBlueSheetEditMode || isSupplierEditMode) && (
              <Badge className="ml-2 bg-orange-50 text-orange-600 border-orange-200 animate-pulse px-3 py-1">
                <Edit className="w-4 h-4 mr-2" />Edit Mode Active
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription className="text-base mt-2">
            Upload supplier invoice, compare side-by-side, edit as needed, then approve.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden bg-gray-50">
          <Tabs value={currentStep} onValueChange={setCurrentStep as any} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3 mx-8 mt-6 h-12">
              <TabsTrigger value="upload" className={`gap-2 text-base ${currentStep === 'upload' ? 'bg-white' : ''}`}>
                <Upload className="h-5 w-5" />Upload & Fetch
              </TabsTrigger>
              <TabsTrigger value="comparison" disabled={!supplierInvoice} className={`gap-2 text-base ${currentStep === 'comparison' ? 'bg-white' : ''}`}>
                <Eye className="h-5 w-5" />Compare & Edit
              </TabsTrigger>
              <TabsTrigger value="review" disabled={!supplierInvoice} className={`gap-2 text-base ${currentStep === 'review' ? 'bg-white' : ''}`}>
                <CheckSquare className="h-5 w-5" />Final Review
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-hidden">
              {/* ── Upload Tab ────────────────────────────────────────────── */}
              <TabsContent value="upload" className="h-full overflow-y-auto p-8 mt-0">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 max-w-7xl mx-auto">
                  <div className="space-y-8">
                    <h3 className="text-2xl font-medium text-[#2b2b2b]">Supplier Invoice Upload</h3>
                    {!supplierInvoice ? (
                      <div className="space-y-8">
                        <Card className="bg-blue-50 border-blue-200">
                          <CardContent className="p-8 space-y-6">
                            <div>
                              <h4 className="text-lg font-medium text-blue-900">Auto-fetch from Email</h4>
                              <p className="text-base text-blue-700 mt-2">PO: BS-{blueSheet.id}</p>
                            </div>
                            <Button onClick={handleAutoFetch} disabled={isAutoFetching} className="w-full bg-primary text-white h-14 text-lg gap-3" size="lg">
                              {isAutoFetching ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Mail className="h-5 w-5" />}
                              {isAutoFetching ? 'Fetching...' : 'Auto-fetch Invoice'}
                            </Button>
                          </CardContent>
                        </Card>

                        <div className="flex items-center gap-6">
                          <div className="flex-1 h-px bg-gray-300" />
                          <span className="text-base text-gray-500 px-4 py-2 rounded-full bg-gray-100">OR</span>
                          <div className="flex-1 h-px bg-gray-300" />
                        </div>

                        <Card className="border-dashed border-2 border-gray-300 hover:border-[#00A1FF] transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                          <CardContent className="p-12 text-center space-y-6">
                            <div className="w-24 h-24 bg-gray-100 rounded-xl flex items-center justify-center mx-auto">
                              <Upload className="h-12 w-12 text-gray-400" />
                            </div>
                            <div>
                              <h4 className="text-lg font-medium">Upload Supplier Invoice</h4>
                              <p className="text-base text-gray-600 mt-2">PDF, JPG, PNG, or Excel — max 10MB</p>
                            </div>
                            <Button onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }} disabled={isUploading} className="gap-3 h-14 text-lg px-8 bg-primary text-white" size="lg">
                              {isUploading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                              {isUploading ? 'Processing...' : 'Choose File'}
                            </Button>
                            <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls" onChange={handleFileUpload} />
                            {uploadedFile && (
                              <div className="flex items-center justify-center gap-3 text-green-600">
                                <CheckSquare className="h-5 w-5" /><span>{uploadedFile.name}</span>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    ) : (
                      <Card className="bg-green-50 border-green-200">
                        <CardContent className="p-8">
                          <div className="flex items-center gap-3 mb-6">
                            <CheckSquare className="h-6 w-6 text-green-600" />
                            <h4 className="text-lg font-medium text-green-900">Supplier Invoice Loaded</h4>
                          </div>
                          <div className="grid grid-cols-2 gap-6 text-base mb-6">
                            <div>
                              <p><strong>Invoice #:</strong> {supplierInvoice.invoiceNumber}</p>
                              <p><strong>Supplier:</strong> {supplierInvoice.supplier}</p>
                            </div>
                            <div>
                              <p><strong>Amount:</strong> {formatCurrency(supplierInvoice.amount)}</p>
                              <p><strong>Items:</strong> {supplierInvoice.materials.length}</p>
                            </div>
                          </div>
                          <Button onClick={() => setCurrentStep('comparison')} className="w-full bg-[#00A1FF] text-white h-14 text-lg gap-3" size="lg">
                            <ArrowRight className="h-5 w-5" />Proceed to Comparison
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  <div className="space-y-8">
                    <h3 className="text-2xl font-medium text-[#2b2b2b]">BlueSheet Overview</h3>
                    <Card className="bg-white shadow-md border-0">
                      <CardHeader className="pb-4"><CardTitle className="text-lg">Material Request Summary</CardTitle></CardHeader>
                      <CardContent className="space-y-6">
                        <div className="space-y-4 p-6 bg-blue-50 rounded-xl">
                          <div className="flex items-center gap-3">
                            <Building className="h-6 w-6 text-[#00A1FF]" />
                            <div>
                              <Label className="text-sm text-gray-600">Customer</Label>
                              <p className="text-lg font-medium text-[#00A1FF]">{blueSheet.job.customer?.customer_name || 'N/A'}</p>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <Label className="text-sm text-gray-600">Job</Label>
                            <p className="text-lg font-medium">{blueSheet.job.job_title}</p>
                          </div>
                          <div>
                            <Label className="text-sm text-gray-600">PO Number</Label>
                            <p className="text-lg font-mono">BS-{blueSheet.id}</p>
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm text-gray-600">Materials ({blueSheet.material_entries.length})</Label>
                          <div className="mt-3 space-y-3">
                            {blueSheet.material_entries.slice(0).map((item: any, index: number) => (
                              <div key={index} className="flex justify-between text-base p-4 bg-gray-50 rounded-lg">
                                <div>
                                  <span className="font-medium">{item.material_name}</span>
                                  <p className="text-sm text-gray-500">Used Material: {item.material_used} × {formatCurrency(item.unit_cost)}</p>
                                </div>
                                <span className="text-lg font-medium">{formatCurrency(item.total_cost || item.material_used * item.unit_cost)}</span>
                              </div>
                            ))}
                             
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xl font-medium pt-6 border-t">
                          <span>Total:</span>
                          <span className="text-[#00A1FF]">{formatCurrency(blueSheet.total_cost)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              {/* ── Comparison Tab ────────────────────────────────────────── */}
              <TabsContent value="comparison" className="h-full overflow-y-auto p-6 mt-0">
                <div className="space-y-6 max-w-[1600px] mx-auto">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-[#1a1a2e]">Material Comparison & Editing</h3>
                    <div className="flex gap-2">
                      <Button onClick={handleBlueSheetEdit} variant={isBlueSheetEditMode ? 'default' : 'outline'} size="sm"
                        className={isBlueSheetEditMode ? 'bg-orange-500 hover:bg-orange-600 h-9 text-sm' : 'h-9 text-sm border-gray-300'}>
                        <Edit className="h-3.5 w-3.5 mr-1.5" />{isBlueSheetEditMode ? 'Exit BS Edit' : 'Edit BlueSheet'}
                      </Button>
                      <Button onClick={handleSupplierEdit} variant={isSupplierEditMode ? 'default' : 'outline'} size="sm"
                        className={isSupplierEditMode ? 'bg-orange-500 hover:bg-orange-600 h-9 text-sm' : 'h-9 text-sm border-gray-300'}>
                        <Edit className="h-3.5 w-3.5 mr-1.5" />{isSupplierEditMode ? 'Exit Supplier Edit' : 'Edit Supplier'}
                      </Button>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-5 gap-3">
                    {[
                      { label: 'Perfect Matches', value: comparisons.filter(c => c.status === 'match').length, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
                      { label: 'With Differences', value: comparisons.filter(c => c.status === 'price_diff' || c.status === 'quantity_diff').length, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
                      { label: 'Missing in Supplier', value: comparisons.filter(c => c.status === 'missing_in_supplier').length, color: 'text-red-600', bg: 'bg-red-50 border-red-100' },
                      { label: 'Extra in Supplier', value: comparisons.filter(c => c.status === 'missing_in_bluesheet').length, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
                      { label: 'Total Discrepancy', value: formatCurrency(totalDiscrepancyAmount), color: 'text-violet-600', bg: 'bg-violet-50 border-violet-100' },
                    ].map((stat, i) => (
                      <div key={i} className={`${stat.bg} border rounded-lg px-4 py-3 text-center`}>
                        <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Comparison Table */}
                  <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-[#1a1a2e] text-white">
                          <th className="px-3 py-3 text-center font-medium w-10">Qty</th>
                          <th className="px-3 py-3 text-left font-medium">
                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#00A1FF]" />BlueSheet Item</div>
                          </th>
                          <th className="px-3 py-3 text-right font-medium w-24">Unit Price</th>
                          <th className="px-3 py-3 text-right font-medium w-20">Total</th>
                          <th className="px-2 py-3 text-center font-medium w-28 bg-gray-800">Match</th>
                          <th className="px-3 py-3 text-center font-medium w-10">Qty</th>
                          <th className="px-3 py-3 text-left font-medium">
                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-400" />Supplier Item</div>
                          </th>
                          <th className="px-3 py-3 text-right font-medium w-24">Unit Price</th>
                          <th className="px-3 py-3 text-right font-medium w-20">Total</th>
                          {(isBlueSheetEditMode || isSupplierEditMode) && <th className="w-8" />}
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const bsItems = currentBlueSheet.material_entries
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

                          return pairs.map((pair, rowIdx) => {
                            const { bs, bsIdx, sup, supIdx } = pair
                            const hasBS = !!bs, hasSup = !!sup
                            const nameMatch = hasBS && hasSup && (
                              bs.material_name?.toLowerCase() === sup.name?.toLowerCase() ||
                              bs.material_name?.toLowerCase().includes(sup.name?.toLowerCase()) ||
                              sup.name?.toLowerCase().includes(bs.material_name?.toLowerCase())
                            )
                            const qtyMatch = hasBS && hasSup && bs.total_ordered === sup.quantity
                            const fullMatch = nameMatch && qtyMatch
                            const rowBg = !hasSup ? 'bg-red-50/50' : !hasBS ? 'bg-blue-50/50' : fullMatch ? 'bg-emerald-50/30' : 'bg-amber-50/40'

                            return (
                              <tr key={rowIdx} className={`border-t border-gray-100 ${rowBg} transition-colors`}>
                                {/* BS Qty */}
                                <td className="px-3 py-2.5 text-center">
                                  {bs ? (
                                    isBlueSheetEditMode ? (
                                      <Input type="number" value={bs.material_used}
                                        onChange={(e) => handleBlueSheetMaterialChange(bsIdx!, 'material_used', parseFloat(e.target.value) || 0)}
                                        className="h-7 text-center text-xs w-12 mx-auto px-1" min="0" />
                                    ) : (
                                      <span className={`font-semibold ${!qtyMatch && hasSup ? 'text-amber-600' : 'text-gray-700'}`}>{bs.material_used}</span>
                                    )
                                  ) : <span className="text-gray-300">—</span>}
                                </td>

                                {/* BS Item Name — with product search dropdown */}
                                <td className="px-3 py-2.5">
                                  {bs ? (
                                    isBlueSheetEditMode ? (
                                      <div className="relative">
                                        <Input
                                          value={editedBlueSheet?.material_entries[bsIdx!]?.material_name || ''}
                                          onChange={(e) => {
                                            handleBlueSheetMaterialChange(bsIdx!, 'material_name', e.target.value)
                                            handleProductSearch(e.target.value, bsIdx!)
                                          }}
                                          onBlur={() => setTimeout(() => { setActiveRow(null); setFilteredProducts([]) }, 200)}
                                          onFocus={() => {
                                            const name = editedBlueSheet?.material_entries[bsIdx!]?.material_name
                                            if (name && name.length >= 2) handleProductSearch(name, bsIdx!)
                                          }}
                                          className="h-8 text-xs"
                                          placeholder="Search product..."
                                        />
                                        {activeRow === bsIdx && filteredProducts.length > 0 && (
                                          <div className="absolute z-50 bg-white border w-full max-h-40 overflow-y-auto shadow-md rounded-md"
                                            onMouseDown={(e) => e.preventDefault()}>
                                            {filteredProducts.map((product: any) => (
                                              <div key={product.id}
                                                className="px-2 py-1.5 text-xs hover:bg-blue-50 cursor-pointer border-b border-gray-50"
                                                onMouseDown={(e) => {
                                                  e.preventDefault()
                                                  handleBlueSheetMaterialUpdateAll(bsIdx!, product)
                                                }}>
                                                <div className="font-medium">{product.product_name}</div>
                                                <div className="text-gray-400 text-[10px]">{product.jdp_sku} · {formatCurrency(product.jdp_price || 0)}</div>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                        {/* Show linked product badge */}
                                        {editedBlueSheet?.material_entries[bsIdx!]?.product_id && (
                                          <div className="mt-0.5 flex items-center gap-1">
                                            <span className="text-[9px] text-emerald-600 bg-emerald-50 px-1 rounded">
                                              ID: {editedBlueSheet.material_entries[bsIdx!].product_id}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="font-medium text-[#1a1a2e]">{bs.material_name}</span>
                                    )
                                  ) : <span className="text-blue-400 italic text-[10px]">Not in BlueSheet</span>}
                                </td>

                                {/* BS Unit Price */}
                                <td className="px-3 py-2.5 text-right">
                                  {bs ? (
                                    isBlueSheetEditMode ? (
                                      <Input type="number" step="0.01" value={bs.unit_cost}
                                        onChange={(e) => handleBlueSheetMaterialChange(bsIdx!, 'unit_cost', parseFloat(e.target.value) || 0)}
                                        className="h-7 text-xs text-right" min="0" />
                                    ) : <span className="text-gray-600">{formatCurrency(bs.unit_cost)}</span>
                                  ) : <span className="text-gray-300">—</span>}
                                </td>

                                {/* BS Total */}
                                <td className="px-3 py-2.5 text-right">
                                  {bs ? (
                                    <span className="font-bold text-[#00A1FF]">
                                      {formatCurrency(bs.total_cost || bs.material_used * bs.unit_cost)}
                                    </span>
                                  ) : <span className="text-gray-300">—</span>}
                                </td>

                                {/* Match Status */}
                                <td className="px-2 py-2.5 text-center bg-white/70 border-x border-gray-200">
                                  {!hasBS ? (
                                    <div className="flex flex-col items-center gap-0.5">
                                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center"><Plus className="w-3 h-3 text-blue-600" /></div>
                                      <span className="text-[9px] text-blue-600 font-semibold leading-tight text-center">Extra in<br />Supplier</span>
                                    </div>
                                  ) : !hasSup ? (
                                    <div className="flex flex-col items-center gap-0.5">
                                      <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center"><X className="w-3 h-3 text-red-600" /></div>
                                      <span className="text-[9px] text-red-600 font-semibold leading-tight text-center">Missing in<br />Supplier</span>
                                    </div>
                                  ) : fullMatch ? (
                                    <div className="flex flex-col items-center gap-0.5">
                                      <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center"><Check className="w-3 h-3 text-emerald-600" /></div>
                                      <span className="text-[9px] text-emerald-600 font-semibold">Match</span>
                                    </div>
                                  ) : (
                                    <div className="flex flex-col items-center gap-0.5">
                                      <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center"><AlertTriangle className="w-3 h-3 text-amber-600" /></div>
                                      {!nameMatch && <span className="text-[9px] text-amber-700 font-semibold leading-tight text-center">Name<br />differs</span>}
                                      {!qtyMatch && <span className="text-[9px] text-amber-700 font-semibold leading-tight text-center">Qty<br />{bs?.material_used}≠{sup?.quantity}</span>}
                                    </div>
                                  )}
                                </td>

                                {/* Sup Qty */}
                                <td className="px-3 py-2.5 text-center">
                                  {sup ? (
                                    isSupplierEditMode ? (
                                      <Input type="number" value={sup.quantity}
                                        onChange={(e) => handleSupplierMaterialChange(supIdx!, 'quantity', parseFloat(e.target.value) || 0)}
                                        className="h-7 text-center text-xs w-12 mx-auto px-1" min="0" />
                                    ) : <span className={`font-semibold ${!qtyMatch && hasBS ? 'text-amber-600' : 'text-gray-700'}`}>{sup.quantity}</span>
                                  ) : <span className="text-gray-300">—</span>}
                                </td>

                                {/* Sup Item */}
                                <td className="px-3 py-2.5">
                                  {sup ? (
                                    isSupplierEditMode ? (
                                      <Input value={sup.name} onChange={(e) => handleSupplierMaterialChange(supIdx!, 'name', e.target.value)} className="h-7 text-xs" />
                                    ) : <span className="font-medium text-[#1a1a2e]">{sup.name}</span>
                                  ) : <span className="text-red-400 italic text-[10px]">Not in Supplier</span>}
                                </td>

                                {/* Sup Unit Price */}
                                <td className="px-3 py-2.5 text-right">
                                  {sup ? (
                                    isSupplierEditMode ? (
                                      <Input type="number" step="0.01" value={sup.unitPrice}
                                        onChange={(e) => handleSupplierMaterialChange(supIdx!, 'unitPrice', parseFloat(e.target.value) || 0)}
                                        className="h-7 text-xs text-right" min="0" />
                                    ) : <span className="text-gray-600">{formatCurrency(sup.unitPrice)}</span>
                                  ) : <span className="text-gray-300">—</span>}
                                </td>

                                {/* Sup Total */}
                                <td className="px-3 py-2.5 text-right">
                                  {sup ? <span className="font-bold text-emerald-600">{formatCurrency(sup.total)}</span> : <span className="text-gray-300">—</span>}
                                </td>

                                {/* Delete buttons */}
                                {(isBlueSheetEditMode || isSupplierEditMode) && (
                                  <td className="px-1 py-2 text-center">
                                    <div className="flex flex-col gap-1 items-center">
                                      {isBlueSheetEditMode && bs && currentBlueSheet.material_entries.length > 1 && (
                                        <button onClick={() => removeBlueSheetMaterial(bsIdx!)} className="text-red-400 hover:text-red-600 hover:bg-red-50 rounded p-0.5" title="Remove from BlueSheet">
                                          <X className="h-3 w-3" />
                                        </button>
                                      )}
                                      {isSupplierEditMode && sup && currentSupplierInvoice && currentSupplierInvoice.materials.length > 1 && (
                                        <button onClick={() => removeSupplierMaterial(supIdx!)} className="text-red-400 hover:text-red-600 hover:bg-red-50 rounded p-0.5" title="Remove from Supplier">
                                          <X className="h-3 w-3" />
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                )}
                              </tr>
                            )
                          })
                        })()}

                        {/* Totals Row */}
                        <tr className="border-t-2 border-gray-300 bg-gray-50">
                          <td colSpan={3} className="px-3 py-3 text-right text-xs font-semibold text-gray-600">BlueSheet Total:</td>
                          <td className="px-3 py-3 text-right font-bold text-[#00A1FF] text-sm">{formatCurrency(currentBlueSheet.total_cost)}</td>
                          <td className="px-2 py-3 bg-white/70 border-x border-gray-200" />
                          <td colSpan={3} className="px-3 py-3 text-right text-xs font-semibold text-gray-600">Supplier Total:</td>
                          <td className="px-3 py-3 text-right font-bold text-emerald-600 text-sm">
                            {currentSupplierInvoice ? formatCurrency(currentSupplierInvoice.amount) : '—'}
                          </td>
                          {(isBlueSheetEditMode || isSupplierEditMode) && <td />}
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Add/Save buttons */}
                  {(isBlueSheetEditMode || isSupplierEditMode) && (
                    <div className="flex gap-2 flex-wrap items-center">
                      {isBlueSheetEditMode && (
                        <Button size="sm" onClick={addBlueSheetMaterial} variant="outline" className="h-7 text-xs px-3 border-dashed border-[#00A1FF] text-[#00A1FF]">
                          <Plus className="h-3 w-3 mr-1" />Add BlueSheet Row
                        </Button>
                      )}
                      {isSupplierEditMode && (
                        <Button size="sm" onClick={addSupplierMaterial} variant="outline" className="h-7 text-xs px-3 border-dashed border-emerald-500 text-emerald-600">
                          <Plus className="h-3 w-3 mr-1" />Add Supplier Row
                        </Button>
                      )}
                      <div className="ml-auto flex gap-2">
                        {isBlueSheetEditMode && (
                          <Button size="sm" onClick={handleBlueSheetSave} className="h-7 text-xs px-3 bg-emerald-600 hover:bg-emerald-700 text-white">
                            <Save className="h-3 w-3 mr-1" />Save BlueSheet
                          </Button>
                        )}
                        {isSupplierEditMode && (
                          <Button size="sm" onClick={handleSupplierSave} className="h-7 text-xs px-3 bg-emerald-600 hover:bg-emerald-700 text-white">
                            <Save className="h-3 w-3 mr-1" />Save Supplier
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <Button onClick={handleProceedToReview} disabled={isBlueSheetEditMode || isSupplierEditMode}
                      className="bg-[#00A1FF] text-white hover:bg-[#0090e6] gap-2 h-10 text-sm px-6">
                      <ArrowRight className="h-4 w-4" />Proceed to Final Review
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* ── Final Review Tab ──────────────────────────────────────── */}
              <TabsContent value="review" className="h-full overflow-y-auto p-8 mt-0">
                <div className="space-y-8 max-w-7xl mx-auto">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-medium text-[#2b2b2b]">Final Review & Approval</h3>
                    <Badge className="bg-blue-50 text-blue-600 border-blue-200 px-4 py-2 text-base">
                      <CheckSquare className="w-5 h-5 mr-2" />Ready for Approval
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="p-8 text-center">
                        <FileText className="h-10 w-10 text-blue-600 mx-auto mb-3" />
                        <h4 className="text-lg font-medium text-blue-900">BlueSheet</h4>
                        <p className="text-3xl font-medium text-blue-600">{formatCurrency(currentBlueSheet.total_cost)}</p>
                        <p className="text-base text-blue-700">{currentBlueSheet.material_entries.length} materials</p>
                      </CardContent>
                    </Card>
                    {currentSupplierInvoice && (
                      <Card className="bg-green-50 border-green-200">
                        <CardContent className="p-8 text-center">
                          <CheckSquare className="h-10 w-10 text-green-600 mx-auto mb-3" />
                          <h4 className="text-lg font-medium text-green-900">Supplier Invoice</h4>
                          <p className="text-3xl font-medium text-green-600">{formatCurrency(currentSupplierInvoice.amount)}</p>
                          <p className="text-base text-green-700">{currentSupplierInvoice.materials.length} materials</p>
                        </CardContent>
                      </Card>
                    )}
                    <Card className="bg-purple-50 border-purple-200">
                      <CardContent className="p-8 text-center">
                        <DollarSign className="h-10 w-10 text-purple-600 mx-auto mb-3" />
                        <h4 className="text-lg font-medium text-purple-900">Difference</h4>
                        <p className="text-3xl font-medium text-purple-600">
                          {formatCurrency(currentSupplierInvoice ? Math.abs(currentBlueSheet.total_cost - currentSupplierInvoice.amount) : 0)}
                        </p>
                        <p className="text-base text-purple-700">
                          {currentSupplierInvoice ? `${((Math.abs(currentBlueSheet.total_cost - currentSupplierInvoice.amount) / currentBlueSheet.total_cost) * 100).toFixed(1)}% variance` : 'N/A'}
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="bg-orange-50 border-orange-200">
                      <CardContent className="p-8 text-center">
                        <AlertTriangle className="h-10 w-10 text-orange-600 mx-auto mb-3" />
                        <h4 className="text-lg font-medium text-orange-900">Discrepancies</h4>
                        <p className="text-3xl font-medium text-orange-600">{comparisons.filter(c => c.differences.length > 0).length}</p>
                        <p className="text-base text-orange-700">items with differences</p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="bg-white shadow-md border-0">
                    <CardHeader><CardTitle className="text-xl">Review Summary</CardTitle></CardHeader>
                    <CardContent className="space-y-8">
                      <div className="grid grid-cols-2 gap-8">
                        <div>
                          <Label className="text-base text-gray-600">Customer</Label>
                          <p className="text-xl font-medium text-[#00A1FF]">{currentBlueSheet.job.customer?.customer_name || 'N/A'}</p>
                        </div>
                        <div>
                          <Label className="text-base text-gray-600">Job</Label>
                          <p className="text-xl font-medium">{currentBlueSheet.job.job_title}</p>
                        </div>
                        <div>
                          <Label className="text-base text-gray-600">PO Number</Label>
                          <p className="text-xl font-mono">BS-{currentBlueSheet.id}</p>
                        </div>
                        <div>
                          <Label className="text-base text-gray-600">Submitted By</Label>
                          <p className="text-xl font-medium">{currentBlueSheet.created_by_user.full_name}</p>
                        </div>
                      </div>
                      <Separator />
                      <div>
                        <Label className="text-base text-gray-600">Notes</Label>
                        <Textarea placeholder="Add final notes or instructions..." className="mt-3 h-24 text-base" rows={5} />
                      </div>
                      <div className="bg-gray-50 p-6 rounded-xl">
                        <h5 className="text-lg font-medium mb-4">Last Minute Edits</h5>
                        <div className="flex gap-4">
                          <Button variant="outline" size="lg" onClick={() => setCurrentStep('comparison')} className="gap-2 h-12">
                            <Edit className="h-4 w-4" />Edit Materials
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex items-center justify-between">
                    <Button variant="outline" onClick={() => setCurrentStep('comparison')} className="gap-2 h-14 text-lg px-6" size="lg">
                      <ArrowLeft className="h-5 w-5" />Back
                    </Button>
                    <div className="flex gap-6">
                      <Button variant="outline" onClick={onClose} className="h-14 text-lg px-6" size="lg">Cancel</Button>
                      <Button onClick={handleFinalApproval} disabled={isApproving} className="bg-primary text-white hover:bg-green-700 gap-3 h-14 text-lg px-8" size="lg">
                        <Send className="h-5 w-5" />
                        {isApproving ? 'Approving...' : 'Final Approval & Generate Invoice'}
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
