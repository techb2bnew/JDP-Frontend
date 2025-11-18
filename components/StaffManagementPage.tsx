import { useState, useEffect } from 'react'
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
  const [activeTab, setActiveTab] = useState('staff')
  
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

  // Fetch staff statistics on mount
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

  // Check if user is admin (has no specific permissions but should see all tabs)
  const isAdmin = !permissionsLoading && permissions.length === 0

  // Permission checks for each module
  // Show tab if user has ANY permission for that module OR if user is admin
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
  }

  // Handle legacy lead labour details view
  if (showLeadLabourDetails && selectedLeadLabourId) {
    return (
      <LeadLabourDetailsPage 
        leadLabourId={selectedLeadLabourId} 
        onBack={onBackToLeadLabour || (() => {})}
      />
    )
  }

  // Handle new detail views
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

                <Card className="border-0 shadow-sm">
              <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2 text-gray-600">Loading supplier details...</span>
            </div>
        </Card>
            </div>
          )
        }
        return (
          <SupplierDetailsPage 
            supplierId={viewState.selectedId || ''} 
            supplierData={supplierDetailData}
            onBack={handleBackToList}
          />
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

  // Filter tabs based on permissions
  const allTabItems = [
    { id: 'staff', label: 'Staff', icon: UserCog, show: hasStaffPermissions },
    { id: 'lead-labour', label: 'Lead Labor', icon: HardHat, show: hasLeadLabourPermissions },
    { id: 'labor', label: 'Labor', icon: Wrench, show: hasLaborPermissions },
    { id: 'supplier', label: 'Supplier', icon: Building2, show: hasSupplierPermissions },
    // { id: 'user', label: 'User', icon: User, show: false },
  ]

  const tabItems = allTabItems.filter(item => item.show)
  const gridCols = tabItems.length <= 2 ? 'grid-cols-2' : 
                   tabItems.length <= 3 ? 'grid-cols-3' : 
                   tabItems.length <= 4 ? 'grid-cols-4' : 
                   tabItems.length <= 5 ? 'grid-cols-5' : 'grid-cols-6'

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

  // Show loading state while permissions are being loaded
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

      {/* Summary Cards */}
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
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
              <TabsContent value={activeTab} className="mt-0">
                {renderTabContent()}
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

// All Staff Page that shows combined data from all categories
function AllStaffPage() {
  const [staffStats, setStaffStats] = useState({
    total_staff: 0,
    staff: 0,
    lead_labor: 0,
    labor: 0,
    suppliers: 0
  })
  const [isStatsLoading, setIsStatsLoading] = useState(false)

  // Fetch staff statistics on mount
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

      {/* Summary Cards */}
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