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
          console.log(isAuthenticated, 'isAuthenticatedisAuthenticated');
          
          if (authenticated) {
            setIsAuthenticated(true)
          console.log(authenticated, 'authtruetrue');

            router.push('/dashboard')
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
    alert(isAuthenticated)
    // Check for redirect URL
    const response = await fetch('/api/auth/redirect-url', {
      credentials: 'include',
    })
    
    if (response) {
      const { redirectUrl } = await response.json()
      localStorage.setItem('isAuthenticated', 'true') 
      router.push( '/dashboard')
    } else {
      router.push('/dashboard')
    }
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