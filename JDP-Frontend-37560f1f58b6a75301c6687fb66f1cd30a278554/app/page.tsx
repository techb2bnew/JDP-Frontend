import { Metadata } from 'next'
import { AuthPageClient } from '@/components/auth/AuthPageClient'

export const metadata: Metadata = {
  title: 'Login - JDP Admin Dashboard',
  description: 'Sign in to access the JDP Admin Dashboard',
}

export default function HomePage() {
  return <AuthPageClient />
}