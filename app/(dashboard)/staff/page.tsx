'use client'

import { StaffManagementPage } from '../../../components/StaffManagementPage'
import { useState } from 'react'

export default function Staff() {
  const [selectedLeadLabourId, setSelectedLeadLabourId] = useState<string | null>(null)
  const [showLeadLabourDetails, setShowLeadLabourDetails] = useState<boolean>(false)

  const handleLeadLabourView = (id: string): void => {
    setSelectedLeadLabourId(id)
    setShowLeadLabourDetails(true)
  }

  const handleBackToLeadLabour = (): void => {
    setSelectedLeadLabourId(null)
    setShowLeadLabourDetails(false)
  }

  return (
    <StaffManagementPage
      onViewLeadLabourDetails={handleLeadLabourView}
      onBackToLeadLabour={handleBackToLeadLabour}
      selectedLeadLabourId={selectedLeadLabourId}
      showLeadLabourDetails={showLeadLabourDetails}
    />
  )
}