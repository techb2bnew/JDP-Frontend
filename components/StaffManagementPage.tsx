import { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { StaffPage } from './StaffPage'
import { LeadLabourPage } from './LeadLabourPage'
import { LaborPage } from './LaborPage'
import { SupplierPage } from './SupplierPage'
import { UserPage } from './UserPage'
import { EnhancedLeadLabourDetailsPage } from './EnhancedLeadLabourDetailsPage'
import { LaborDetailsPage } from './LaborDetailsPage'
import { SupplierDetailsPage } from './SupplierDetailsPage'
import { StaffDetailsPage } from './StaffDetailsPage'
import { UserDetailsPage } from './UserDetailsPage'
import { 
  Users, 
  HardHat, 
  Wrench, 
  Building2, 
  User,
  UserCog
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
  const [activeTab, setActiveTab] = useState('all')
  const [viewState, setViewState] = useState<{
    type: 'list' | 'detail'
    category: 'staff' | 'lead-labour' | 'labor' | 'supplier' | 'user' | null
    selectedId: string | null
  }>({
    type: 'list',
    category: null,
    selectedId: null
  })

  const handleViewDetails = (category: 'staff' | 'lead-labour' | 'labor' | 'supplier' | 'user', id: string) => {
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
  }

  // Handle legacy lead labour details view
  if (showLeadLabourDetails && selectedLeadLabourId) {
    return (
      <EnhancedLeadLabourDetailsPage 
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
            onBack={handleBackToList}
          />
        )
      case 'lead-labour':
        return (
          <EnhancedLeadLabourDetailsPage 
            leadLabourId={viewState.selectedId} 
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
        return (
          <SupplierDetailsPage 
            supplierId={viewState.selectedId} 
            onBack={handleBackToList}
          />
        )
      case 'user':
        return (
          <UserDetailsPage 
            userId={viewState.selectedId} 
            onBack={handleBackToList}
          />
        )
    }
  }

  const tabItems = [
    { id: 'all', label: 'All', icon: Users },
    { id: 'staff', label: 'Staff', icon: UserCog },
    { id: 'lead-labour', label: 'Lead Labour', icon: HardHat },
    { id: 'labor', label: 'Labor', icon: Wrench },
    { id: 'supplier', label: 'Supplier', icon: Building2 },
    { id: 'user', label: 'User', icon: User },
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'all':
        return <AllStaffPage />
      case 'staff':
        return (
          <StaffPage 
            onViewDetails={(id) => handleViewDetails('staff', id)} 
          />
        )
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
      case 'user':
        return (
          <UserPage 
            onViewDetails={(id) => handleViewDetails('user', id)} 
          />
        )
      default:
        return <AllStaffPage />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-[#2b2b2b]">Staff Management</h1>
          <p className="text-sm text-[#2b2b2b]/60 mt-1">Manage all your workforce across different categories.</p>
        </div>
      </div>

      <Card className="bg-white shadow-sm border-0">
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b border-gray-200 px-6 pt-6">
              <TabsList className="grid w-full grid-cols-6 bg-gray-50">
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
        <Card className="bg-white shadow-sm border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Staff</p>
                <p className="text-2xl font-medium text-[#2b2b2b]">145</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow-sm border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#E6F6FF] rounded-lg">
                <UserCog className="h-6 w-6 text-[#00A1FF]" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Staff</p>
                <p className="text-2xl font-medium text-[#2b2b2b]">42</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow-sm border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <HardHat className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Lead Labour</p>
                <p className="text-2xl font-medium text-[#2b2b2b]">12</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow-sm border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Wrench className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Labor</p>
                <p className="text-2xl font-medium text-[#2b2b2b]">68</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Building2 className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Suppliers</p>
                <p className="text-2xl font-medium text-[#2b2b2b]">23</p>
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