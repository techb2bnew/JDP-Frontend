import { useState, useEffect, useMemo, useRef } from 'react'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { StaffPage } from './StaffPage'
import { LeadLabourPage } from './LeadLabourPage'
import { LaborPage } from './LaborPage'
import { SupplierPage } from './SupplierPage'
import { UserPage } from './UserPage'
import { LaborDetailsPage } from './LaborDetailsPage'
import { SupplierDetailsPage } from './SupplierDetailsPage'
import { StaffDetailsPage } from './StaffDetailsPage'
import { LeadLabourDetailsPage } from './LeadLabourDetailsPage'
import { UserDetailsPage } from './UserDetailsPage'
import { usePermissions } from '../contexts/PermissionContext'
import { apiClient } from '@/utils/api'
import { toast } from 'sonner'
import {
  Users,
  HardHat,
  Wrench,
  Building2,
  User,
  UserCog,
  ArrowLeft
} from 'lucide-react'
import { SupplierFormData, SupplierFormDialog } from './common/SupplierFormDialog'

interface StaffManagementPageProps {
  onViewLeadLabourDetails?: (id: string) => void
  onBackToLeadLabour?: () => void
  selectedLeadLabourId?: string | null
  showLeadLabourDetails?: boolean
}

export function StaffManagementPage({
  onViewLeadLabourDetails,
  onBackToLeadLabour,
  selectedLeadLabourId,
  showLeadLabourDetails
}: StaffManagementPageProps) {
  const { hasPermission, isLoading: permissionsLoading, permissions } = usePermissions()
  const [activeTab, setActiveTab] = useState<string>('')
  const hasInitializedTab = useRef(false)

  const [viewState, setViewState] = useState<{
    type: 'list' | 'detail'
    category: 'staff' | 'lead-labour' | 'labor' | 'supplier' | null
    selectedId: string | null
  }>({
    type: 'list',
    category: null,
    selectedId: null
  })

  const [staffDetailData, setStaffDetailData] = useState<any>(null)
  const [isStaffDetailLoading, setIsStaffDetailLoading] = useState(false)

  const [leadLabourDetailData, setLeadLabourDetailData] = useState<any>(null)
  const [isLeadLabourDetailLoading, setIsLeadLabourDetailLoading] = useState(false)

  const [supplierDetailData, setSupplierDetailData] = useState<any>(null)
  const [isSupplierDetailLoading, setIsSupplierDetailLoading] = useState(false)

  const [staffStats, setStaffStats] = useState({
    total_staff: 0,
    staff: 0,
    lead_labor: 0,
    labor: 0,
    suppliers: 0
  })
  const [isStatsLoading, setIsStatsLoading] = useState(false)

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL

  const [roles, setRoles] = useState<any[]>([])
  const [isEditSupplierDialogOpen, setIsEditSupplierDialogOpen] = useState(false)
  const [isSupplierEditLoading, setIsSupplierEditLoading] = useState(false)
  const [supplierValidationErrors, setSupplierValidationErrors] = useState<Record<string, string>>({})
  const [supplierFormData, setSupplierFormData] = useState<SupplierFormData>({
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

  const resetSupplierForm = () => {
    setSupplierFormData({
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
    setSupplierValidationErrors({})
  }

  useEffect(() => {
    const fetchStaffStats = async () => {
      try {
        setIsStatsLoading(true)
        const response = await apiClient.getStaffStats()
        if (response.success && response.data) {
          setStaffStats(response.data)
        }
      } catch (error) {
        console.error('Error fetching staff stats:', error)
      } finally {
        setIsStatsLoading(false)
      }
    }
    fetchStaffStats()
  }, [])

  useEffect(() => {
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

    if (apiBaseUrl) {
      fetchRoles()
    }
  }, [apiBaseUrl])

  const isAdmin = !permissionsLoading && permissions.length === 0

  const hasStaffPermissions = !permissionsLoading && (
    isAdmin ||
    hasPermission('staff', 'view') ||
    hasPermission('staff', 'create') ||
    hasPermission('staff', 'edit') ||
    hasPermission('staff', 'delete')
  )

  const hasLeadLabourPermissions = !permissionsLoading && (
    isAdmin ||
    hasPermission('lead_labour', 'view') ||
    hasPermission('lead_labour', 'create') ||
    hasPermission('lead_labour', 'edit') ||
    hasPermission('lead_labour', 'delete')
  )

  const hasLaborPermissions = !permissionsLoading && (
    isAdmin ||
    hasPermission('labour', 'view') ||
    hasPermission('labour', 'create') ||
    hasPermission('labour', 'edit') ||
    hasPermission('labour', 'delete')
  )

  const hasSupplierPermissions = !permissionsLoading && (
    isAdmin ||
    hasPermission('suppliers', 'view') ||
    hasPermission('suppliers', 'create') ||
    hasPermission('suppliers', 'edit') ||
    hasPermission('suppliers', 'delete')
  )

  const canEditSupplier = !permissionsLoading && (
    isAdmin || hasPermission('suppliers', 'edit')
  )

  const allTabItems = useMemo(() => [
    { id: 'staff', label: 'Staff', icon: UserCog, show: hasStaffPermissions },
    { id: 'lead-labour', label: 'Lead Labor', icon: HardHat, show: hasLeadLabourPermissions },
    { id: 'labor', label: 'Labor', icon: Wrench, show: hasLaborPermissions },
    { id: 'supplier', label: 'Supplier', icon: Building2, show: hasSupplierPermissions },
    // { id: 'user', label: 'User', icon: User, show: false },
  ], [hasStaffPermissions, hasLeadLabourPermissions, hasLaborPermissions, hasSupplierPermissions])

  const tabItems = useMemo(() => allTabItems.filter(item => item.show), [allTabItems])

  useEffect(() => {
    if (!permissionsLoading && viewState.type === 'list' && !hasInitializedTab.current) {
      if (tabItems.length > 0) {
        const currentTabExists = tabItems.find(item => item.id === activeTab)
        if (!activeTab || !currentTabExists) {
          setActiveTab(tabItems[0].id)
          hasInitializedTab.current = true
        } else {
          hasInitializedTab.current = true
        }
      }
    }
  }, [permissionsLoading, viewState.type, tabItems, activeTab])

  const fetchLeadLabourDetails = async (id: string) => {
    if (!apiBaseUrl) return
    setIsLeadLabourDetailLoading(true)
    try {
      const token = localStorage.getItem('jdp_auth')
        ? JSON.parse(localStorage.getItem('jdp_auth')!).token
        : null
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const response = await fetch(`${apiBaseUrl}/lead-labor/getLeadLaborById/${id}`, {
        method: 'GET',
        headers
      })

      if (response.ok) {
        const responseData = await response.json()
        if (responseData.success && responseData.data) {
          setLeadLabourDetailData(responseData.data)
        } else {
          toast.error('Failed to load lead labour details')
          setLeadLabourDetailData(null)
        }
      } else {
        toast.error('Failed to load lead labour details')
        setLeadLabourDetailData(null)
      }
    } catch (error) {
      console.error('Error fetching lead labour details:', error)
      toast.error('Failed to load lead labour details')
      setLeadLabourDetailData(null)
    } finally {
      setIsLeadLabourDetailLoading(false)
    }
  }

  const fetchSupplierDetails = async (id: string) => {
    if (!apiBaseUrl) return
    setIsSupplierDetailLoading(true)
    try {
      const token = localStorage.getItem('jdp_auth')
        ? JSON.parse(localStorage.getItem('jdp_auth')!).token
        : null
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const response = await fetch(`${apiBaseUrl}/suppliers/getSupplierById/${id}`, {
        method: 'GET',
        headers
      })

      if (response.ok) {
        const responseData = await response.json()
        if (responseData.success && responseData.data) {
          setSupplierDetailData(responseData.data)
        } else {
          toast.error('Failed to load supplier details')
          setSupplierDetailData(null)
        }
      } else {
        toast.error('Failed to load supplier details')
        setSupplierDetailData(null)
      }
    } catch (error) {
      console.error('Error fetching supplier details:', error)
      toast.error('Failed to load supplier details')
      setSupplierDetailData(null)
    } finally {
      setIsSupplierDetailLoading(false)
    }
  }

  const handleEditSupplierFromDetails = () => {
    if (!supplierDetailData) return

    const userData = supplierDetailData.users || {}

    setSupplierFormData({
      fullName: userData.full_name || userData.name || '',
      role: userData.role || '',
      companyName: supplierDetailData.company_name || '',
      contactPerson: supplierDetailData.contact_person || '',
      email: userData.email || '',
      phone: normalizePhoneToE164(userData.phone || ''),
      address: supplierDetailData.address || '',
      status: userData.status?.toLowerCase() || 'active',
      contractStart: supplierDetailData.contract_start || '',
      contractEnd: supplierDetailData.contract_end || '',
      totalOrders: supplierDetailData.total_orders || 0,
      notes: supplierDetailData.notes || '',
    })

    setSupplierValidationErrors({})
    setIsEditSupplierDialogOpen(true)
  }

  const handleUpdateSupplierFromDetails = async () => {
    if (!viewState.selectedId) return

    const errors: Record<string, string> = {}
    if (!supplierFormData.fullName) errors.fullName = 'Full Name is required'
    if (!supplierFormData.role) errors.role = 'Role is required'
    if (!supplierFormData.companyName) errors.companyName = 'Company Name is required'
    if (!supplierFormData.contactPerson) errors.contactPerson = 'Contact Person is required'
    if (!supplierFormData.email) errors.email = 'Email is required'
    if (!supplierFormData.phone) errors.phone = 'Phone is required'

    if (Object.keys(errors).length > 0) {
      setSupplierValidationErrors(errors)
      toast.error('Please fill in all required fields')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(supplierFormData.email)) {
      setSupplierValidationErrors((prev) => ({
        ...prev,
        email: 'Please enter a valid email address'
      }))
      toast.error('Please enter a valid email address')
      return
    }

    let loadingToastId: string | number | undefined

    try {
      setIsSupplierEditLoading(true)
      loadingToastId = toast.loading('Updating supplier...')

      const token = localStorage.getItem('jdp_auth')
        ? JSON.parse(localStorage.getItem('jdp_auth')!).token
        : null

      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const payload = {
        full_name: supplierFormData.fullName,
        email: supplierFormData.email.toLowerCase(),
        phone: formatPhoneForPayload(supplierFormData.phone) || '',
        role: supplierFormData.role,
        status: supplierFormData.status,
        company_name: supplierFormData.companyName,
        contact_person: supplierFormData.contactPerson,
        address: supplierFormData.address,
        contract_start: supplierFormData.contractStart,
        contract_end: supplierFormData.contractEnd,
        notes: supplierFormData.notes
      }

      const response = await fetch(`${apiBaseUrl}/suppliers/updateSupplier/${viewState.selectedId}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      })

      if (loadingToastId) toast.dismiss(loadingToastId)

      if (response.ok) {
        const responseData = await response.json()
        if (responseData.success) {
          toast.success('Supplier updated successfully!')
          setIsEditSupplierDialogOpen(false)
          await fetchSupplierDetails(viewState.selectedId)
          const statsResponse = await apiClient.getStaffStats()
          if (statsResponse.success && statsResponse.data) {
            setStaffStats(statsResponse.data)
          }
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
    } finally {
      setIsSupplierEditLoading(false)
    }
  }

  const handleViewDetails = async (category: 'staff' | 'lead-labour' | 'labor' | 'supplier', id: string) => {
    if (category === 'staff') {
      setIsStaffDetailLoading(true)
      setViewState({ type: 'detail', category, selectedId: id })
      try {
        const response = await apiClient.getStaffById(id)
        if (response.success && response.data) {
          setStaffDetailData(response.data)
        } else {
          toast.error(response.message || 'Failed to load staff details')
          setStaffDetailData(null)
        }
      } catch (error) {
        console.error('Error fetching staff details:', error)
        toast.error('Failed to load staff details')
        setStaffDetailData(null)
      } finally {
        setIsStaffDetailLoading(false)
      }
      return
    }

    if (category === 'lead-labour') {
      setViewState({ type: 'detail', category, selectedId: id })
      fetchLeadLabourDetails(id)
      return
    }

    if (category === 'supplier') {
      setViewState({ type: 'detail', category, selectedId: id })
      fetchSupplierDetails(id)
      return
    }

    setViewState({
      type: 'detail',
      category,
      selectedId: id
    })
  }

  const handleBackToList = () => {
    setViewState({
      type: 'list',
      category: null,
      selectedId: null
    })
    setStaffDetailData(null)
    setIsStaffDetailLoading(false)
    setLeadLabourDetailData(null)
    setIsLeadLabourDetailLoading(false)
    setSupplierDetailData(null)
    setIsSupplierDetailLoading(false)
    setIsEditSupplierDialogOpen(false)
    setIsSupplierEditLoading(false)
    resetSupplierForm()
  }

  if (showLeadLabourDetails && selectedLeadLabourId) {
    return (
      <LeadLabourDetailsPage
        leadLabourId={selectedLeadLabourId}
        onBack={onBackToLeadLabour || (() => {})}
      />
    )
  }

  if (viewState.type === 'detail' && viewState.selectedId) {
    switch (viewState.category) {
      case 'staff':
        return (
          <StaffDetailsPage
            staffId={viewState.selectedId}
            staffDetails={staffDetailData}
            isLoading={isStaffDetailLoading}
            onBack={handleBackToList}
          />
        )

      case 'lead-labour':
        return (
          <LeadLabourDetailsPage
            leadLabourId={viewState.selectedId || ''}
            leadLabourData={leadLabourDetailData}
            isLoading={isLeadLabourDetailLoading}
            onBack={handleBackToList}
          />
        )

      case 'labor':
        return (
          <LaborDetailsPage
            laborId={viewState.selectedId}
            onBack={handleBackToList}
          />
        )

      case 'supplier':
        if (isSupplierDetailLoading) {
          return (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={handleBackToList} className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              </div>

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
            </div>
          )
        }

        return (
          <>
            <SupplierDetailsPage
              supplierId={viewState.selectedId || ''}
              supplierData={supplierDetailData}
              onBack={handleBackToList}
              onEdit={canEditSupplier ? handleEditSupplierFromDetails : undefined}
            />

            <SupplierFormDialog
              open={isEditSupplierDialogOpen}
              onOpenChange={setIsEditSupplierDialogOpen}
              title="Edit Supplier"
              submitLabel="Update Supplier"
              formData={supplierFormData}
              setFormData={setSupplierFormData}
              validationErrors={supplierValidationErrors}
              setValidationErrors={setSupplierValidationErrors}
              roles={roles}
              isLoading={isSupplierEditLoading}
              onSubmit={handleUpdateSupplierFromDetails}
              onCancel={() => {
                setIsEditSupplierDialogOpen(false)
                resetSupplierForm()
              }}
            />
          </>
        )

      // case 'user':
      //   return (
      //     <UserDetailsPage
      //       userId={viewState.selectedId}
      //       onBack={handleBackToList}
      //     />
      //   )
    }
  }

  const gridCols = tabItems.length <= 2 ? 'grid-cols-2'
    : tabItems.length <= 3 ? 'grid-cols-3'
    : tabItems.length <= 4 ? 'grid-cols-4'
    : tabItems.length <= 5 ? 'grid-cols-5'
    : 'grid-cols-6'

  const renderTabContent = () => {
    switch (activeTab) {
      case 'staff':
        return <StaffPage onViewDetails={(id) => handleViewDetails('staff', id)} />
      case 'lead-labour':
        return (
          <LeadLabourPage
            onViewDetails={(id) => handleViewDetails('lead-labour', id)}
          />
        )
      case 'labor':
        return (
          <LaborPage
            onViewDetails={(id) => handleViewDetails('labor', id)}
          />
        )
      case 'supplier':
        return (
          <SupplierPage
            onViewDetails={(id) => handleViewDetails('supplier', id)}
          />
        )
      // case 'user':
      //   return (
      //     <UserPage
      //       onViewDetails={(id) => handleViewDetails('user', id)}
      //     />
      //   )
      default:
        return <StaffPage onViewDetails={(id) => handleViewDetails('staff', id)} />
    }
  }

  if (permissionsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-medium text-[#2b2b2b]">Staff Management</h1>
            <p className="text-sm text-[#2b2b2b]/60 mt-1">Loading permissions...</p>
          </div>
        </div>
        <Card className="bg-white shadow-md border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2 text-gray-600">Loading...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-[#2b2b2b]">Staff Management</h1>
          <p className="text-sm text-[#2b2b2b]/60 mt-1">Manage all your workforce across different categories.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card className="bg-white shadow-md border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Staff</p>
                <p className="text-2xl font-medium text-[#2b2b2b]">{isStatsLoading ? '...' : staffStats.total_staff}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#E6F6FF] rounded-lg">
                <UserCog className="h-6 w-6 text-[#00A1FF]" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Staff</p>
                <p className="text-2xl font-medium text-[#2b2b2b]">{isStatsLoading ? '...' : staffStats.staff}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <HardHat className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Lead Labour</p>
                <p className="text-2xl font-medium text-[#2b2b2b]">{isStatsLoading ? '...' : staffStats.lead_labor}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Wrench className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Labor</p>
                <p className="text-2xl font-medium text-[#2b2b2b]">{isStatsLoading ? '...' : staffStats.labor}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Building2 className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Suppliers</p>
                <p className="text-2xl font-medium text-[#2b2b2b]">{isStatsLoading ? '...' : staffStats.suppliers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white shadow-md border-0">
        <CardContent className="p-0">
          <Tabs value={activeTab || (tabItems.length > 0 ? tabItems[0].id : '')} onValueChange={setActiveTab} className="w-full">
            <div className="border-b border-gray-200 px-6 pt-6">
              <TabsList className={`grid w-full ${gridCols} bg-gray-50`}>
                {tabItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <TabsTrigger
                      key={item.id}
                      value={item.id}
                      className="flex items-center gap-2 data-[state=active]:bg-[#00A1FF] data-[state=active]:text-white"
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </TabsTrigger>
                  )
                })}
              </TabsList>
            </div>

            <div className="p-6">
              {activeTab && (
                <TabsContent value={activeTab} className="mt-0">
                  {renderTabContent()}
                </TabsContent>
              )}
              {!activeTab && tabItems.length === 0 && (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-[#2b2b2b] mb-2">No Permissions</h3>
                  <p className="text-sm text-gray-600">You don't have permissions to view any staff categories.</p>
                </div>
              )}
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

function AllStaffPage() {
  const [staffStats, setStaffStats] = useState({
    total_staff: 0,
    staff: 0,
    lead_labor: 0,
    labor: 0,
    suppliers: 0
  })
  const [isStatsLoading, setIsStatsLoading] = useState(false)

  useEffect(() => {
    const fetchStaffStats = async () => {
      try {
        setIsStatsLoading(true)
        const response = await apiClient.getStaffStats()
        if (response.success && response.data) {
          setStaffStats(response.data)
        }
      } catch (error) {
        console.error('Error fetching staff stats:', error)
      } finally {
        setIsStatsLoading(false)
      }
    }
    fetchStaffStats()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-medium text-[#2b2b2b]">All Staff Members</h2>
          <p className="text-sm text-[#2b2b2b]/60 mt-1">Overview of all staff across different categories.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card className="bg-white shadow-md border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Staff</p>
                <p className="text-2xl font-medium text-[#2b2b2b]">{isStatsLoading ? '...' : staffStats.total_staff}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#E6F6FF] rounded-lg">
                <UserCog className="h-6 w-6 text-[#00A1FF]" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Staff</p>
                <p className="text-2xl font-medium text-[#2b2b2b]">{isStatsLoading ? '...' : staffStats.staff}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <HardHat className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Lead Labour</p>
                <p className="text-2xl font-medium text-[#2b2b2b]">{isStatsLoading ? '...' : staffStats.lead_labor}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Wrench className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Labor</p>
                <p className="text-2xl font-medium text-[#2b2b2b]">{isStatsLoading ? '...' : staffStats.labor}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Building2 className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Suppliers</p>
                <p className="text-2xl font-medium text-[#2b2b2b]">{isStatsLoading ? '...' : staffStats.suppliers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="text-center py-12">
        <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-[#2b2b2b] mb-2">Select a Category</h3>
        <p className="text-sm text-gray-600">Choose a specific category from the tabs above to view and manage staff members.</p>
      </div>
    </div>
  )
}