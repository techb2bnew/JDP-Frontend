'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAppDispatch } from '../../redux/hooks'
import { logout } from '../../redux/slices/authSlice'
import { clearAuthData, checkAuthStatus } from '../../utils/auth'
import { Sidebar } from '../../components/layout/Sidebar'
import { Header } from '../../components/layout/Header'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState(true)
  const [authCheckTimeout, setAuthCheckTimeout] = useState<NodeJS.Timeout | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const dispatch = useAppDispatch()

  useEffect(() => {
    const checkAuth = async () => {
      // Ensure we're in browser environment
      if (typeof window === 'undefined') {
        setIsLoading(false)
        return
      }
      
      // Prevent redirect loop - if we're already on login page, don't redirect again
      if (pathname === '/') {
        setIsLoading(false)
        return
      }
      
      // Quick check from localStorage first (synchronous)
      const authData = localStorage.getItem('jdp_auth');
      if (authData) {
        try {
          const parsed = JSON.parse(authData);
          if (parsed.token && parsed.expires > Date.now()) {
            // Token is valid, set authenticated immediately
            setIsAuthenticated(true);
            setIsLoading(false);
            return; // Skip async check if token is valid
          }
        } catch (error) {
          // Invalid data, continue to async check
        }
      }
      
      try {
        const authResult = await checkAuthStatus();
        
        if (authResult.isAuthenticated) {
          setIsAuthenticated(true);
          setIsLoading(false);
        } else {
          setIsAuthenticated(false);
          setIsLoading(false);
          
          if (authResult.shouldRedirect) {
            router.push('/');
          }
        }
        
      } catch (error) {
        console.error('Error during authentication check:', error);
        await clearAuthData();
        setIsLoading(false);
        router.push('/');
      }
    }

    // Check auth only on mount, not on every pathname change
    const timer = setTimeout(checkAuth, 50);
    
    return () => {
      clearTimeout(timer);
    }
  }, [router]) // Removed pathname from dependencies to prevent re-checking on every route change

  const handleLogout = async () => {
    try {
      console.log('Logout initiated...');
      
      // Clear all authentication data using utility function
      await clearAuthData()
      
      // Dispatch logout action to clear Redux state
      dispatch(logout())
      
      // Update local state
      setIsAuthenticated(false)
      
      console.log('Logout completed, redirecting to login...');
      
    // Redirect to login page
    setTimeout(() => {
      router.push('/')
    }, 100)
    } catch (error) {
      console.error('Error during logout:', error);
      // Force redirect even if logout fails
      setTimeout(() => {
        router.push('/')
      }, 100)
    }
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
  let authData = null;
  let isSuperAdmin = false;
  
  if (typeof window !== 'undefined') {
    try {
      authData = localStorage.getItem('jdp_auth');
      isSuperAdmin = authData ? JSON.parse(authData).user?.role === 'Super Admin' : false;
    } catch (error) {
      console.error('Error accessing localStorage for super admin check:', error);
      authData = null;
      isSuperAdmin = false;
    }
  }
  const isSuperDashboardPage = pathname === '/superDashboard';

  // console.log('=== DASHBOARD LAYOUT DEBUG ===');
  // console.log('Pathname:', pathname);
  // console.log('Auth data:', authData);
  // console.log('Is super admin:', isSuperAdmin);
  // console.log('Is superDashboard page:', isSuperDashboardPage);

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
    // console.log('❌ User not authenticated, redirecting to login');
    // console.log('isAuthenticated state:', isAuthenticated);
    // console.log('isLoading state:', isLoading);
    
    // If we're still loading, show loading spinner
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )
    }
    
    return null // Will redirect to login
  }

  return (
    <div className="flex bg-background transition-colors duration-300">
      <Sidebar currentPath={pathname} onLogout={handleLogout} />
      <div className="flex-1 flex flex-col w-[80%]">
        <Header
          currentPath={pathname}
          onLogout={handleLogout}
          onNotificationViewAll={handleNotificationViewAll}
          onProfileClick={handleProfileClick}
        />
        <main className="flex-1">
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