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
        alert(savedAuth)
        if (savedAuth) {
          try {
            const authData = JSON.parse(savedAuth)
            if (authData.user && authData.expires > Date.now()) {
              dispatch(loginSuccess({
                user: authData.user,
                token: authData.token
              }))
              return
            }
            localStorage.removeItem('jdp_auth')
          } catch (error) {
            localStorage.removeItem('jdp_auth')
          }
        }
      }
    }

    checkAuth()
  }, [dispatch])

  const handleAuthSuccess = (isNewUser?: boolean) => {
    const mockToken = 'mock_jwt_token_here'
    const mockUser = {
      id: '1',
      email: 'admin@jdp.com',
      name: 'Admin User',
      role: 'admin' as const,
    }
    alert('asdasdllllllllllllll')
    dispatch(loginSuccess({
      user: mockUser,
      token: mockToken
    }))

    if (typeof window !== 'undefined') {
      localStorage.setItem('jdp_auth', JSON.stringify({
        user: mockUser,
        token: mockToken,
        expires: Date.now() + (24 * 60 * 60 * 1000)
      }))
    }

    router.push('/dashboard')
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