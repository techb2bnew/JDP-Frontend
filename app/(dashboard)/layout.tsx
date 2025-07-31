'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Sidebar } from '../../components/layout/Sidebar'
import { Header } from '../../components/layout/Header'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const authStatus = localStorage.getItem('isAuthenticated')
    if (authStatus !== 'true') {
      router.push('/')
      return
    }
    setIsAuthenticated(true)
    setIsLoading(false)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated')
    setIsAuthenticated(false)
    router.push('/')
  }

  const handleNotificationViewAll = () => {
    router.push('/notifications')
  }

  const handleProfileClick = () => {
    router.push('/profile')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect to login
  }

  return (
    <div className="flex h-screen bg-background transition-colors duration-300">
      <Sidebar currentPath={pathname} onLogout={handleLogout} />
      <div className="flex-1 flex flex-col">
        <Header
          currentPath={pathname}
          onLogout={handleLogout}
          onNotificationViewAll={handleNotificationViewAll}
          onProfileClick={handleProfileClick}
        />
        <main className="flex-1 overflow-auto">
          <div className={
            pathname === '/contractor-listing' || pathname === '/tracking' 
              ? '' 
              : 'p-6'
          }>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}