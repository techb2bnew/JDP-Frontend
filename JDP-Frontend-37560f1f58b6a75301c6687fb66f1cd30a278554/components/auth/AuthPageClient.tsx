'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AuthFlow } from '@/components/AuthFlow'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

export function AuthPageClient() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check', {
          method: 'GET',
          credentials: 'include',
        })
        
        if (response.ok) {
          const { authenticated } = await response.json()
          // console.log(isAuthenticated, 'isAuthenticatedisAuthenticated');
          
          if (authenticated) {
            setIsAuthenticated(true)
          // console.log(authenticated, 'authtruetrue');

            // Don't redirect here - let LoginScreen handle role-based redirection
            return
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error)
      }
      
      setIsLoading(false)
    }

    checkAuth()
  }, [router])

  const handleAuthSuccess = async () => {
    setIsAuthenticated(true)
    // alert(isAuthenticated)
    // Don't redirect here - let LoginScreen handle role-based redirection
    // The LoginScreen will check the user's role and redirect accordingly
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner  />
      </div>
    )
  }

  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="min-h-screen animate-fade-in">
      <AuthFlow onAuthSuccess={handleAuthSuccess} />
    </div>
  )
}