'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAppSelector, useAppDispatch } from '../../redux/hooks'
import { loginSuccess } from '../../redux/slices/authSlice'
import { AuthFlow } from '../AuthFlow'
import { AppLayout } from '../layout/AppLayout'
import { LoadingSpinner } from '../common/LoadingSpinner'

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const dispatch = useAppDispatch()
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth)

  useEffect(() => {
    const checkAuth = () => {
      if (typeof window !== 'undefined') {
        const savedAuth = localStorage.getItem('jdp_auth')
        if (savedAuth) {
          try {
            const authData = JSON.parse(savedAuth)
            if (authData.user && authData.token && authData.expires > Date.now()) {
              dispatch(loginSuccess({
                user: authData.user,
                token: authData.token
              }))
              return
            }
            // Clear expired or invalid auth data
            localStorage.removeItem('jdp_auth')
          } catch (error) {
            console.error('Error parsing auth data:', error)
            localStorage.removeItem('jdp_auth')
          }
        }
      }
    }

    checkAuth()
  }, [dispatch])

  const handleAuthSuccess = (isNewUser?: boolean) => {
    // This function will be called by the AuthFlow component
    // The actual authentication logic is now handled in LoginScreen
    // This is just a callback to notify the parent component
    console.log('Authentication successful', { isNewUser })
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner  />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <AuthFlow onAuthSuccess={handleAuthSuccess} />
  }

  return (
    <AppLayout>
      {children}
    </AppLayout>
  )
}