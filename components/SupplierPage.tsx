import { useState, useEffect, ChangeEvent } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent } from './ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Badge } from './ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { ActionButtonsPopup } from './ActionButtonsPopup'
import { SupplierDetailsPage } from './SupplierDetailsPage'
import { toast } from 'sonner'
import { globalApiCall, getAuthToken, handleTokenRevocation } from '../utils/globalApiHandler'
import {
  Plus,
  Search,
  Upload,
  Download,
  Building2,
  MapPin,
  Package,
  Shield
} from 'lucide-react'
import { apiClient } from '@/utils/api'
import { usePermissions } from '../contexts/PermissionContext'
import { SupplierFormData, SupplierFormDialog } from './common/SupplierFormDialog'

interface Supplier {
  id: string
  supplierId: string
  fullName: string
  role?: string
  companyName: string
  contactPerson: string
  email: string
  phone: string
  address: string
  status: 'active' | 'inactive' | 'pending' | 'suspended'
  contractStart: string
  contractEnd: string
  totalOrders: number
  notes?: string
  supplier:string
}

interface SupplierPageProps {
  onViewDetails?: (id: string) => void
  onDetailViewChange?: (isDetailView: boolean) => void
}

export function SupplierPage({ onViewDetails, onDetailViewChange }: SupplierPageProps) {
  const { hasPermission } = usePermissions()

  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [filteredSuppliers, setFilteredSuppliers] = useState<any[]>([])

  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingEdit, setIsLoadingEdit] = useState(false)
  const [totalSuppliers, setTotalSuppliers] = useState(0)

  const [viewingSupplier, setViewingSupplier] = useState<Supplier | null>(null)
  const [supplierDetails, setSupplierDetails] = useState<any>(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)

  const [showImportDialog, setShowImportDialog] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)

  const [roles, setRoles] = useState<any[]>([])
  const [supplierStats, setSupplierStats] = useState({
    total_suppliers: 0,
    active_suppliers: 0,
    inactive_suppliers: 0,
    total_orders: 0
  })
  const [isStatsLoading, setIsStatsLoading] = useState(false)

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL

  const [formData, setFormData] = useState<SupplierFormData>({
    fullName: '',
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    status: 'active',
    contractStart: '',
    contractEnd: '',
    totalOrders: 0,
    notes: '',
    role:'supplier'
  })

  const normalizePhoneToE164 = (rawPhone: string) => {
    const raw = (rawPhone || '').trim()
    if (!raw) return ''
    if (raw.startsWith('+')) return raw.replace(/[^\d+]/g, '')

    const digits = raw.replace(/\D/g, '')
    if (!digits) return ''
    if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
    if (digits.length === 10) return `+1${digits}`
    return `+${digits}`
  }

  const formatPhoneForPayload = (rawPhone: string): string => {
    const e164 = normalizePhoneToE164(rawPhone)
    if (!e164) return ''
    const digits = e164.replace(/[^\d+]/g, '')
    if (!digits.startsWith('+')) return e164

    if (digits.startsWith('+1') && digits.length > 2) {
      const rest = digits.slice(2)
      return rest ? `+1-${rest}` : '+1'
    }

    const match = digits.match(/^\+(\d{2,3})(\d*)$/)
    if (!match) return e164
    const country = match[1]
    const rest = match[2]
    return rest ? `+${country}-${rest}` : `+${country}`
  }

  const resetForm = () => {
    setFormData({
      fullName: '',
      role: 'supplier',
      companyName: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      status: 'active',
      contractStart: '',
      contractEnd: '',
      totalOrders: 0,
      notes: '',
    })
    setValidationErrors({})
    setEditingSupplier(null)
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.fullName) errors.fullName = 'Full Name is required'
    if (!formData.role) errors.role = 'Role is required'
    if (!formData.companyName) errors.companyName = 'Company Name is required'
    if (!formData.contactPerson) errors.contactPerson = 'Contact Person is required'
    if (!formData.email) errors.email = 'Email is required'
    if (!formData.phone) errors.phone = 'Phone is required'

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      toast.error('Please fill in all required fields')
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setValidationErrors((prev) => ({
        ...prev,
        email: 'Please enter a valid email address'
      }))
      toast.error('Please enter a valid email address')
      return false
    }

    return true
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-50 text-green-600 border-green-200 hover:bg-green-50">Active</Badge>
      case 'inactive':
        return <Badge className="bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-50">Inactive</Badge>
      case 'pending':
        return <Badge className="bg-yellow-50 text-yellow-600 border-yellow-200 hover:bg-yellow-50">Pending</Badge>
      case 'suspended':
        return <Badge className="bg-red-50 text-red-600 border-red-200 hover:bg-red-50">Suspended</Badge>
      default:
        return <Badge className="bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-50">{status}</Badge>
    }
  }

  const paginatedSuppliers = filteredSuppliers
  const totalPages = Math.ceil(totalSuppliers / itemsPerPage)

  const handleCreate = async () => {
    if (!validateForm()) return

    let loadingToastId: string | number | undefined

    try {
      loadingToastId = toast.loading('Creating supplier...')

      const token = localStorage.getItem('jdp_auth')
        ? JSON.parse(localStorage.getItem('jdp_auth')!).token
        : null

      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const payload = {
        full_name: formData.fullName,
        email: formData.email.toLowerCase(),
        phone: formatPhoneForPayload(formData.phone) || '',
        role: formData.role,
        status: formData.status,
        company_name: formData.companyName,
        contact_person: formData.contactPerson,
        address: formData.address,
        contract_start: formData.contractStart,
        contract_end: formData.contractEnd,
        notes: formData.notes,
      }

      const response = await fetch(`${apiBaseUrl}/suppliers/createSupplier`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      })

      toast.dismiss(loadingToastId)

      if (response.ok) {
        const responseData = await response.json()
        if (responseData.success) {
          toast.success('Supplier created successfully!')
          setIsCreateDialogOpen(false)
          resetForm()
          fetchSuppliersData(currentPage, itemsPerPage)
          fetchSupplierStats()
        } else {
          toast.error(responseData.message || 'Failed to create supplier')
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        toast.error(errorData.message || 'Failed to create supplier')
      }
    } catch (error) {
      if (loadingToastId) toast.dismiss(loadingToastId)
      console.error('Error creating supplier:', error)
      toast.error('An error occurred while creating supplier')
    }
  }

  const handleEdit = async (supplier: Supplier) => {
    setViewingSupplier(null)
    setEditingSupplier(supplier)
    setIsEditDialogOpen(true)
    setIsLoadingEdit(true)

    try {
      const token = localStorage.getItem('jdp_auth')
        ? JSON.parse(localStorage.getItem('jdp_auth')!).token
        : null

      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const response = await fetch(`${apiBaseUrl}/suppliers/getSupplierById/${supplier.id}`, {
        method: 'GET',
        headers
      })

      if (response.ok) {
        const responseData = await response.json()

        if (responseData.success && responseData.data) {
          const apiData = responseData.data
          const userData = apiData.users || {}

          setFormData({
            fullName: userData.full_name || userData.name || '',
            role: userData.role || '',
            companyName: apiData.company_name || '',
            contactPerson: apiData.contact_person || '',
            email: userData.email || '',
            phone: normalizePhoneToE164(userData.phone || ''),
            address: apiData.address || '',
            status: userData.status?.toLowerCase() || 'active',
            contractStart: apiData.contract_start || '',
            contractEnd: apiData.contract_end || '',
            totalOrders: apiData.total_orders || 0,
            notes: apiData.notes || ''
          })
        } else {
          toast.error('Failed to load supplier details for editing')
          setFormData({
            fullName: supplier.fullName,
            role: supplier.role || '',
            companyName: supplier.companyName,
            contactPerson: supplier.contactPerson,
            email: supplier.email,
            phone: normalizePhoneToE164(supplier.phone || ''),
            address: supplier.address,
            status: supplier.status,
            contractStart: supplier.contractStart,
            contractEnd: supplier.contractEnd,
            totalOrders: supplier.totalOrders,
            notes: supplier.notes || ''
          })
        }
      } else {
        toast.error('Failed to load supplier details for editing')
        setFormData({
          fullName: supplier.fullName,
          role: supplier.role || '',
          companyName: supplier.companyName,
          contactPerson: supplier.contactPerson,
          email: supplier.email,
          phone: normalizePhoneToE164(supplier.phone || ''),
          address: supplier.address,
          status: supplier.status,
          contractStart: supplier.contractStart,
          contractEnd: supplier.contractEnd,
          totalOrders: supplier.totalOrders,
          notes: supplier.notes || ''
        })
      }
    } catch (error) {
      console.error('Error fetching supplier details for editing:', error)
      toast.error('An error occurred while loading supplier details')
      setFormData({
        fullName: supplier.fullName,
        role: supplier.role || '',
        companyName: supplier.companyName,
        contactPerson: supplier.contactPerson,
        email: supplier.email,
        phone: normalizePhoneToE164(supplier.phone || ''),
        address: supplier.address,
        status: supplier.status,
        contractStart: supplier.contractStart,
        contractEnd: supplier.contractEnd,
        totalOrders: supplier.totalOrders,
        notes: supplier.notes || ''
      })
    } finally {
      setIsLoadingEdit(false)
    }
  }

  const handleUpdate = async () => {
    if (!editingSupplier) return
    if (!validateForm()) return

    let loadingToastId: string | number | undefined

    try {
      loadingToastId = toast.loading('Updating supplier...')

      const token = localStorage.getItem('jdp_auth')
        ? JSON.parse(localStorage.getItem('jdp_auth')!).token
        : null

      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const payload = {
        full_name: formData.fullName,
        email: formData.email.toLowerCase(),
        phone: formatPhoneForPayload(formData.phone) || '',
        role: formData.role,
        status: formData.status,
        company_name: formData.companyName,
        contact_person: formData.contactPerson,
        address: formData.address,
        contract_start: formData.contractStart,
        contract_end: formData.contractEnd,
        notes: formData.notes
      }

      const response = await fetch(`${apiBaseUrl}/suppliers/updateSupplier/${editingSupplier.id}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      })

      toast.dismiss(loadingToastId)

      if (response.ok) {
        const responseData = await response.json()
        if (responseData.success) {
          toast.success('Supplier updated successfully!')
          setIsEditDialogOpen(false)
          resetForm()
          fetchSuppliersData(currentPage, itemsPerPage)
          fetchSupplierStats()
        } else {
          toast.error(responseData.message || 'Failed to update supplier')
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        toast.error(errorData.message || 'Failed to update supplier')
      }
    } catch (error) {
      if (loadingToastId) toast.dismiss(loadingToastId)
      console.error('Error updating supplier:', error)
      toast.error('An error occurred while updating supplier')
    }
  }

  const handleView = async (supplier: Supplier) => {
    if (onViewDetails) {
      onViewDetails(supplier.id)
      return
    }

    setIsLoadingDetails(true)
    setViewingSupplier(supplier)
    await fetchSupplierDetails(supplier.id)
  }

  const handleBackToList = () => {
    setViewingSupplier(null)
    setSupplierDetails(null)
    setIsLoadingDetails(false)
  }

  const handleDelete = async (id: string) => {
    let loadingToastId: string | number | undefined

    try {
      loadingToastId = toast.loading('Deleting supplier...')

      const token = localStorage.getItem('jdp_auth')
        ? JSON.parse(localStorage.getItem('jdp_auth')!).token
        : null

      const headers: Record<string, string> = {}
      if (token) headers['Authorization'] = `Bearer ${token}`

      const response = await fetch(`${apiBaseUrl}/suppliers/deleteSupplier/${id}`, {
        method: 'DELETE',
        headers
      })

      toast.dismiss(loadingToastId)

      if (response.ok) {
        const responseData = await response.json()
        if (responseData.success) {
          toast.success('Supplier deleted successfully!')
          fetchSuppliersData(currentPage, itemsPerPage)
          fetchSupplierStats()
        } else {
          toast.error(responseData.message || 'Failed to delete supplier')
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        toast.error(errorData.message || 'Failed to delete supplier')
      }
    } catch (error) {
      if (loadingToastId) toast.dismiss(loadingToastId)
      console.error('Error deleting supplier:', error)
      toast.error('An error occurred while deleting supplier')
    }
  }

  function convertSuppliersToCSV(data: Supplier[]) {
    const headers = [
      'ID',
      'Supplier ID',
      'Full Name',
      'Company Name',
      'Contact Person',
      'Email',
      'Phone',
      'Address',
      'Status',
      'Contract Start',
      'Contract End',
      'Total Orders',
      'Notes'
    ].join(',')

    const rows = data.map(supplier =>
      [
        supplier.id,
        supplier.supplierId,
        supplier.fullName,
        supplier.companyName,
        supplier.contactPerson,
        supplier.email,
        supplier.phone,
        supplier.address,
        supplier.status,
        supplier.contractStart,
        supplier.contractEnd,
        supplier.totalOrders,
        supplier.notes || ''
      ]
        .map(field => `"${field?.toString().replace(/"/g, '""')}"`)
        .join(',')
    )

    return [headers, ...rows].join('\n')
  }

  const handleBulkImport = async () => {
    if (!importFile) {
      toast.error('Please select a CSV file')
      return
    }

    try {
      setIsImporting(true)

      const token = getAuthToken()
      if (!token) {
        toast.error('Authentication token not found')
        return
      }

      const importFormData = new FormData()
      importFormData.append('file', importFile)
      // Keep existing suppliers and append imported ones.
      // Backend may use one of these flags depending on implementation.
      importFormData.append('mode', 'append')
      importFormData.append('append', 'true')
      importFormData.append('replace_existing', 'false')
      importFormData.append('replaceExisting', 'false')

      const response = await fetch(`${apiBaseUrl}/suppliers/import`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: importFormData
      })

      const responseData = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          await handleTokenRevocation()
          throw new Error('Session expired. Please login again.')
        }
        throw new Error(responseData.message || 'Failed to import suppliers')
      }

      if (responseData.success) {
        toast.success(responseData.message || 'Successfully imported suppliers!')
        setShowImportDialog(false)
        setImportFile(null)
        fetchSuppliersData(currentPage, itemsPerPage)
      } else {
        throw new Error(responseData.message || 'Failed to import suppliers')
      }
    } catch (error) {
      console.error('Error importing suppliers:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to import suppliers')
    } finally {
      setIsImporting(false)
    }
  }

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
      setImportFile(file)
    } else {
      toast.error('Please select a valid CSV file')
    }
  }

  function downloadCSV(data: Supplier[], filename: string) {
    const csv = convertSuppliersToCSV(data)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  useEffect(() => {
    fetchRoles()
  }, [])

  const fetchRoles = async () => {
    try {
      const token = localStorage.getItem('jdp_auth')
        ? JSON.parse(localStorage.getItem('jdp_auth')!).token
        : null

      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const response = await fetch(`${apiBaseUrl}/permissions/roles-with-permissions`, {
        method: 'GET',
        headers
      })

      if (response.ok) {
        const responseData = await response.json()

        if (responseData.success && responseData.data) {
          const transformedRoles = responseData.data.map((apiRole: any) => ({
            id: apiRole.id.toString(),
            roleName: apiRole.role_name || '',
            roleType: apiRole.role_type || '',
            permissions: apiRole.permissions || []
          }))

          setRoles(transformedRoles)
        }
      }
    } catch (error) {
      console.error('Error fetching roles:', error)
    }
  }

  const fetchSuppliersData = async (page: number, limit: number) => {
    try {
      setIsLoading(true)

      const response = await globalApiCall(`${apiBaseUrl}/suppliers/getAllSuppliers?page=${page}&limit=${limit}`, {
        method: 'GET'
      })

      const responseData = await response.json()

      if (responseData.success && responseData.data) {
        const transformedSuppliers = responseData.data?.data.map((apiSupplier: any) => ({
          id: apiSupplier.id.toString(),
          supplierId: apiSupplier.supplier_code || '',
          fullName: apiSupplier.users.full_name || '',
          role: apiSupplier.role || '',
          companyName: apiSupplier.company_name || '',
          contactPerson: apiSupplier.contact_person || '',
          email: apiSupplier.users.email || '',
          phone: apiSupplier.users.phone || '',
          address: apiSupplier.address || '',
          status: apiSupplier.users.status?.toLowerCase() || '',
          contractStart: apiSupplier.contract_start || '',
          contractEnd: apiSupplier.contract_end || '',
          totalOrders: apiSupplier.total_orders || 0,
          notes: apiSupplier.notes || ''
        }))

        setSuppliers(transformedSuppliers)
        setFilteredSuppliers(transformedSuppliers)
        setTotalSuppliers(responseData.data.pagination.totalItems || transformedSuppliers.length)
      } else {
        setSuppliers([])
        setFilteredSuppliers([])
        setTotalSuppliers(0)
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error)
      if (!(error instanceof Error && error.message?.includes('Session expired'))) {
        setSuppliers([])
        setFilteredSuppliers([])
        setTotalSuppliers(0)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const fetchBySearchSuppliers = async () => {
    if (!searchTerm.trim()) return

    setIsLoading(true)

    try {
      const response = await apiClient.searchSuppliersByQuery(searchTerm.trim(), 1, 10)
      const suppliersData = response.data
      const suppliersList = suppliersData?.suppliers || []

      const transformedData = suppliersList.map((supplier: any) => ({
        id: supplier.id.toString(),
        supplierId: supplier.supplier_code || 'N/A',
        companyName: supplier.company_name || 'N/A',
        contactPerson: supplier.contact_person || 'N/A',
        address: supplier.address || 'N/A',
        contractStart: supplier.contract_start || 'N/A',
        contractEnd: supplier.contract_end || 'N/A',
        notes: supplier.notes || '',
        createdAt: supplier.created_at || '',
        email: supplier.users?.email || 'N/A',
        phone: supplier.users?.phone || 'N/A',
        status: supplier.users?.status?.toLowerCase() || 'N/A',
        fullName: supplier.users?.full_name || 'N/A',
        role: supplier.users?.role || 'N/A',
        totalOrders: supplier.total_orders || 0
      }))

      setFilteredSuppliers(transformedData)
      setTotalSuppliers(suppliersData.pagination.total || transformedData.length)
    } catch (error) {
      console.error('Suppliers search error:', error)
      setFilteredSuppliers([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      if (!searchTerm.trim()) {
        if (!filterStatus || filterStatus === 'all') {
          fetchSuppliersData(currentPage, itemsPerPage)
        }
      } else {
        fetchBySearchSuppliers()
      }
    }, 500)

    return () => clearTimeout(debounceTimeout)
  }, [searchTerm, currentPage, itemsPerPage, filterStatus])

  useEffect(() => {
    const fetchSuppliersByStatus = async () => {
      if (!filterStatus || filterStatus === 'all') return

      setIsLoading(true)
      try {
        const res = await apiClient.searchSuppliersByStatus(filterStatus, 1, itemsPerPage)
        const supplierList = res.data?.suppliers || []
        const transformed = supplierList.map((apiSupplier: any) => ({
          id: apiSupplier.id.toString(),
          supplierId: apiSupplier.supplier_code || '',
          fullName: apiSupplier.users?.full_name || '',
          role: apiSupplier.role || '',
          companyName: apiSupplier.company_name || '',
          contactPerson: apiSupplier.contact_person || '',
          email: apiSupplier.users?.email || '',
          phone: apiSupplier.users?.phone || '',
          address: apiSupplier.address || '',
          status: (apiSupplier.users?.status || '').toLowerCase(),
          contractStart: apiSupplier.contract_start || '',
          contractEnd: apiSupplier.contract_end || '',
          totalOrders: apiSupplier.total_orders || 0,
          notes: apiSupplier.notes || ''
        }))
        setSuppliers(transformed)
        setFilteredSuppliers(transformed)
        setTotalSuppliers(res.data?.pagination?.total ?? transformed.length ?? 0)
      } catch (err) {
        console.error('Supplier filter error:', err)
        setSuppliers([])
        setFilteredSuppliers([])
        setTotalSuppliers(0)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSuppliersByStatus()
  }, [filterStatus, currentPage, itemsPerPage])

  const fetchSupplierStats = async () => {
    try {
      setIsStatsLoading(true)
      const response = await apiClient.getManagementStats()
      if (response.success && response.data && response.data.suppliers) {
        setSupplierStats(response.data.suppliers)
      }
    } catch (error) {
      console.error('Error fetching supplier stats:', error)
    } finally {
      setIsStatsLoading(false)
    }
  }

  useEffect(() => {
    fetchSupplierStats()
  }, [])

  const fetchSupplierDetails = async (supplierId: string) => {
    try {
      setIsLoadingDetails(true)
      const token = localStorage.getItem('jdp_auth')
        ? JSON.parse(localStorage.getItem('jdp_auth')!).token
        : null

      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const response = await fetch(`${apiBaseUrl}/suppliers/getSupplierById/${supplierId}`, {
        method: 'GET',
        headers
      })

      if (response.ok) {
        const responseData = await response.json()
        if (responseData.success && responseData.data) {
          setSupplierDetails(responseData.data)
        } else {
          toast.error('Failed to load supplier details')
        }
      } else {
        toast.error('Failed to load supplier details')
      }
    } catch (error) {
      toast.error('An error occurred while loading supplier details')
    } finally {
      setIsLoadingDetails(false)
    }
  }

  if (viewingSupplier) {
    return (
      isLoadingDetails || !supplierDetails ? (
        <Card className="bg-white shadow-md border-0">
          <CardContent className="p-8">
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="text-gray-600">Loading supplier details...</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <SupplierDetailsPage
          supplierId={viewingSupplier.id}
          onBack={handleBackToList}
          supplierData={supplierDetails}
          onEdit={() => handleEdit(viewingSupplier)}
        />
      )
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-medium text-[#2b2b2b]">Supplier Management</h2>
          <p className="text-sm text-[#2b2b2b]/60 mt-1">Manage your suppliers and vendor relationships.</p>
        </div>

        <div className="flex items-center gap-3">
          <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2" onClick={() => setShowImportDialog(true)}>
                <Download className="h-4 w-4" />
                Import
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Import Suppliers</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="import-file">Select CSV File</Label>
                  <Input
                    id="import-file"
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="mt-2"
                  />
                  {importFile && (
                    <p className="text-sm text-gray-600 mt-2">Selected: {importFile.name}</p>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowImportDialog(false)
                    setImportFile(null)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleBulkImport}
                  disabled={!importFile || isImporting}
                  className="bg-primary text-white hover:bg-primary/90"
                >
                  {isImporting ? 'Importing...' : 'Import'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              if (filteredSuppliers.length === 0) {
                toast.error('No suppliers available to export')
                return
              }
              downloadCSV(filteredSuppliers, `suppliers-export-${new Date().toISOString().split('T')[0]}.csv`)
              toast.success('CSV export started')
            }}
          >
            <Upload className="h-4 w-4" />
            Export
          </Button>

          {hasPermission('suppliers', 'create') && (
            <Button
              className="bg-primary text-white hover:bg-[#0090e6] gap-2"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Add Supplier
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white shadow-md border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Building2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-medium text-[#2b2b2b]">
                  {isStatsLoading ? '...' : supplierStats.active_suppliers}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Package className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Inactive</p>
                <p className="text-2xl font-medium text-[#2b2b2b]">
                  {isStatsLoading ? '...' : supplierStats.inactive_suppliers}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-2xl font-medium text-[#2b2b2b]">
                  {isStatsLoading ? '...' : supplierStats.total_orders}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Shield className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Supplier</p>
                <p className="text-2xl font-medium text-[#2b2b2b]">
                  {isStatsLoading ? '...' : supplierStats.total_suppliers}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white shadow-md border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search suppliers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Total: {filteredSuppliers.length}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-md border-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#162f3d] hover:bg-[#162f3d]">
                <TableHead className="text-white font-medium pl-6">ID</TableHead>
                <TableHead className="text-white font-medium">Name</TableHead>
                <TableHead className="text-white font-medium">Company</TableHead>
                <TableHead className="text-white font-medium">Contact Person</TableHead>
                <TableHead className="text-white font-medium">Orders</TableHead>
                <TableHead className="text-white font-medium">Status</TableHead>
                <TableHead className="text-white font-medium">Action</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      <span className="ml-2 text-gray-600">Loading suppliers...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedSuppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="text-gray-500">No suppliers found</div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedSuppliers.map((supplier, index) => {
                  const addressFirstLine = supplier.address?.split(',')[0]?.trim() ?? ''
                  const hasAddress = addressFirstLine.length > 0
                  return (
                  <TableRow key={supplier.id} className={index % 2 === 1 ? 'bg-[#eff4fa]' : ''}>
                    <TableCell className="text-sm text-[#2b2b2b]/80 pl-6">#{supplier.supplierId}</TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm text-[#2b2b2b]/80">{supplier.fullName}</div>
                        <div className="text-xs text-gray-500">{supplier.email}</div>
                        <div className="text-xs text-gray-500">{supplier.phone}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm font-medium text-[#2b2b2b]/80">{supplier.companyName}</div>
                        {hasAddress && (
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <MapPin className="h-3 w-3 shrink-0" />
                            {addressFirstLine}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-[#2b2b2b]/80">{supplier.contactPerson}</div>
                    </TableCell>
                    <TableCell className="text-sm text-[#2b2b2b]/80">{supplier.totalOrders}</TableCell>
                    <TableCell>{getStatusBadge(supplier.status)}</TableCell>
                    <TableCell>
                      <ActionButtonsPopup
                        onView={() => handleView(supplier)}
                        onEdit={() => handleEdit(supplier)}
                        onDelete={() => handleDelete(supplier.id)}
                        itemName={supplier.companyName}
                        itemType="Supplier"
                        showView={true}
                        showEdit={hasPermission('suppliers', 'edit')}
                        showDelete={hasPermission('suppliers', 'delete')}
                      />
                    </TableCell>
                  </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalSuppliers > itemsPerPage && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              const newPage = Math.max(currentPage - 1, 1)
              setCurrentPage(newPage)
              fetchSuppliersData(newPage, itemsPerPage)
            }}
            disabled={currentPage === 1}
          >
            Previous
          </Button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? 'default' : 'outline'}
              onClick={() => {
                setCurrentPage(page)
                fetchSuppliersData(page, itemsPerPage)
              }}
              className={currentPage === page ? 'bg-primary text-white hover:bg-[#0090e6]' : ''}
            >
              {page}
            </Button>
          ))}

          <Button
            variant="outline"
            onClick={() => {
              const newPage = Math.min(currentPage + 1, totalPages)
              setCurrentPage(newPage)
              fetchSuppliersData(newPage, itemsPerPage)
            }}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      <SupplierFormDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        title="Add New Supplier"
        submitLabel="Create Supplier"
        formData={formData}
        setFormData={setFormData}
        validationErrors={validationErrors}
        setValidationErrors={setValidationErrors}
        roles={roles}
        onSubmit={handleCreate}
        onCancel={() => {
          setIsCreateDialogOpen(false)
          resetForm()
        }}
      />

      <SupplierFormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        title="Edit Supplier"
        submitLabel="Update Supplier"
        formData={formData}
        setFormData={setFormData}
        validationErrors={validationErrors}
        setValidationErrors={setValidationErrors}
        roles={roles}
        isLoading={isLoadingEdit}
        onSubmit={handleUpdate}
        onCancel={() => {
          setIsEditDialogOpen(false)
          resetForm()
        }}
      />
    </div>
  )
}