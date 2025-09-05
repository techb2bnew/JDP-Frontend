'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAppDispatch } from '../../redux/hooks'
import { logout } from '../../redux/slices/authSlice'
import { clearAuthData } from '../../utils/auth'
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
  const dispatch = useAppDispatch()

  useEffect(() => {
    const checkAuth = () => {
      const authData = localStorage.getItem('jdp_auth')
      if (authData) {
        try {
          const parsed = JSON.parse(authData)
          if (parsed.user && parsed.token && parsed.expires > Date.now()) {
            setIsAuthenticated(true)
            setIsLoading(false)
            return
          }
        } catch (error) {
          console.error('Error parsing auth data:', error)
        }
      }
      // If no valid auth data, redirect to login
      router.push('/')
    }

    checkAuth()
  }, [router])

  const handleLogout = async () => {
    // Clear all authentication data using utility function
    await clearAuthData()
    
    // Dispatch logout action to clear Redux state
    dispatch(logout())
    
    // Update local state
    setIsAuthenticated(false)
    
    // Redirect to login page
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

  // Check if user is super admin and on superDashboard page FIRST - before any other checks
  const authData = localStorage.getItem('jdp_auth');
  const isSuperAdmin = authData ? JSON.parse(authData).user?.role === 'Super Admin' : false;
  const isSuperDashboardPage = pathname === '/superDashboard';

  console.log('=== DASHBOARD LAYOUT DEBUG ===');
  console.log('Pathname:', pathname);
  console.log('Auth data:', authData);
  console.log('Is super admin:', isSuperAdmin);
  console.log('Is superDashboard page:', isSuperDashboardPage);

  // For super admin on superDashboard page, show only the content without sidebar/header
  if (isSuperAdmin && isSuperDashboardPage) {
    console.log('✅ Rendering SuperAdminDashboard without layout');
    return (
      <div className="min-h-screen bg-background">
        {children}
      </div>
    );
  }

  // Only check authentication for non-super admin users
  if (!isAuthenticated) {
    console.log('❌ User not authenticated, redirecting to login');
    return null // Will redirect to login
  }

  return (
    <div className="flex h-screen bg-background transition-colors duration-300">
      <Sidebar currentPath={pathname} onLogout={handleLogout} />
      <div className="flex-1 flex flex-col w-[80%]">
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