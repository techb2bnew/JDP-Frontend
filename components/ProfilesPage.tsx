'use client'

import { useState } from 'react'
import { Button } from './ui/button'
import { ArrowLeft } from 'lucide-react'
import { ProfileType } from '../types/profiles'
import { profileTypeConfigs } from '../data/profilesData'
import { ProfileOverviewCard } from './profiles/ProfileOverviewCard'
import { AdminProfilePage } from './profiles/AdminProfilePage'
import { AdminStaffProfilePage } from './profiles/AdminStaffProfilePage'
import { LabourLeadDetailsPage } from './profiles/LabourLeadDetailsPage'
import { SupplierDetailsPage } from './profiles/SupplierDetailsPage'

interface ProfilesPageProps {
  onBack?: () => void
}

export function ProfilesPage({ onBack }: ProfilesPageProps) {
  const [selectedProfileType, setSelectedProfileType] = useState<ProfileType | null>(null)

  const handleProfileTypeSelect = (type: ProfileType) => {
    setSelectedProfileType(type)
  }

  const handleBackToOverview = () => {
    setSelectedProfileType(null)
  }

  const renderProfileContent = () => {
    switch (selectedProfileType) {
      case 'admin':
        return <AdminProfilePage />
      case 'staff':
        return <AdminStaffProfilePage />
      case 'labour_lead':
        return <LabourLeadDetailsPage />
      case 'supplier':
        return <SupplierDetailsPage />
      default:
        return null
    }
  }

  if (selectedProfileType) {
    return (
      <div className="space-y-6">
        {/* Back Navigation */}
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleBackToOverview}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Profiles
          </Button>
        </div>

        {/* Profile Content */}
        {renderProfileContent()}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Profile Management</h1>
          <p className="text-muted-foreground">Manage user profiles across different roles and permissions</p>
        </div>
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        )}
      </div>

      {/* Profile Type Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {profileTypeConfigs.map((config) => (
          <ProfileOverviewCard
            key={config.id}
            config={config}
            onSelect={handleProfileTypeSelect}
          />
        ))}
      </div>

      {/* Quick Stats Summary */}
      <div className="bg-muted/50 rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">System Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {profileTypeConfigs.map((config) => (
            <div key={config.id} className="text-center">
              <p className="text-2xl font-semibold text-primary">{config.stats.total}</p>
              <p className="text-sm text-muted-foreground">{config.title.replace(' Profile', '').replace(' Details', '')}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}