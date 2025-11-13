'use client'

import { ProfilePage } from '../../../components/ProfilePage'
import { useRouter } from 'next/navigation'

export default function Profile() {
  const router = useRouter()

  const handleBack = () => {
    router.push('/dashboard')
  }

  return <ProfilePage onBack={handleBack} />
}