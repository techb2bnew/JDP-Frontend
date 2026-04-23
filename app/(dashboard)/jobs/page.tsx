 'use client'

import { useSearchParams } from 'next/navigation'
import { JobManagementPage } from '../../../components/JobManagementPage'

export default function Jobs() {
  const searchParams = useSearchParams()
  const createParam = searchParams.get('create')
  const shouldShowCreate = createParam === 'true'

  // Keep generic `/jobs` disabled, but allow `/jobs?create=true`.
  if (!shouldShowCreate) {
    return null
  }

  return <JobManagementPage />
}