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
  const [authCheckTimeout, setAuthCheckTimeout] = useState<NodeJS.Timeout | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const dispatch = useAppDispatch()

  useEffect(() => {
    const checkAuth = () => {
      // Ensure we're in browser environment
      if (typeof window === 'undefined') {
        console.log('⚠️ Not in browser environment, skipping auth check');
        setIsLoading(false)
        return
      }
      
      // Prevent redirect loop - if we're already on login page, don't redirect again
      if (pathname === '/') {
        console.log('Already on login page, skipping redirect');
        setIsLoading(false)
        return
      }
      
      try {
        const authData = typeof window !== 'undefined' ? localStorage.getItem('jdp_auth') : null
        // console.log('Auth data from localStorage:', authData);
        
        // If we're on dashboard and no auth data, redirect to login
        if (pathname === '/dashboard' && !authData) {
          // console.log('On dashboard but no auth data, redirecting to login');
          setIsLoading(false)
          setTimeout(() => {
            router.push('/')
          }, 100)
          return
        }
        
        if (authData) {
          const parsed = JSON.parse(authData)
          // console.log('Parsed auth data:', parsed);
          
          // Check if all required fields exist and token is not expired
          if (parsed.user && parsed.token && parsed.expires && parsed.expires > Date.now()) {
            // console.log('✅ Valid authentication found');
            setIsAuthenticated(true)
            setIsLoading(false)
            return
          } else {
            // console.log('❌ Invalid or expired authentication data');
            // console.log('User:', parsed.user);
            // console.log('Token:', parsed.token ? 'Present' : 'Missing');
            // console.log('Expires:', parsed.expires);
            // console.log('Current time:', Date.now());
            // console.log('Is expired:', parsed.expires ? parsed.expires <= Date.now() : 'No expiry');
            
            // Clear invalid data
            if (typeof window !== 'undefined') {
              localStorage.removeItem('jdp_auth')
            }
          }
        } else {
          // console.log('❌ No authentication data found');
          // console.log('localStorage keys:', typeof window !== 'undefined' ? Object.keys(localStorage) : 'Not available');
          
          // Clear all cookies when no auth data found
          if (typeof window !== 'undefined') {
            // console.log('Clearing all cookies...');
            // Clear auth-related cookies
            document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            document.cookie = 'jdp_auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            document.cookie = 'redirect-url=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            
            // Clear all cookies with auth-related names
            const cookies = document.cookie.split(';');
            cookies.forEach(cookie => {
              const eqPos = cookie.indexOf('=');
              const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
              if (name && (name.includes('auth') || name.includes('token') || name.includes('session'))) {
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`;
              }
            });
            
            console.log('Cookies cleared. Current cookies:', document.cookie);
          }
        }
        
        // If no valid auth data, redirect to login
        console.log('Redirecting to login page...');
        setIsLoading(false)
        
        // Only redirect if we're not already on login page and not on dashboard
        if (pathname !== '/' && pathname !== '/dashboard') {
          console.log('Redirecting to login page from:', pathname);
          setTimeout(() => {
            router.push('/')
          }, 100)
        } else {
          console.log('Already on login page or dashboard, no redirect needed');
        }
      } catch (error) {
        console.error('Error during authentication check:', error)
        // Clear corrupted data
        if (typeof window !== 'undefined') {
          localStorage.removeItem('jdp_auth')
        }
        setIsLoading(false)
        
        // Only redirect if we're not already on login page and not on dashboard
        if (pathname !== '/' && pathname !== '/dashboard') {
          console.log('Redirecting to login page from error:', pathname);
          setTimeout(() => {
            router.push('/')
          }, 100)
        } else {
          console.log('Already on login page or dashboard, no redirect needed from error');
        }
      }
    }

    // Add a small delay to ensure localStorage is available
    const timer = setTimeout(checkAuth, 100)
    setAuthCheckTimeout(timer)
    
    // Remove timeout mechanism as it's causing unwanted redirects
    // The authentication check will handle redirects properly
    
    return () => {
      clearTimeout(timer)
    }
  }, [router, pathname])

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
    console.log('❌ User not authenticated, redirecting to login');
    console.log('isAuthenticated state:', isAuthenticated);
    console.log('isLoading state:', isLoading);
    
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