'use client'

import { useState } from 'react'
import { useAppDispatch } from '../redux/hooks'
import { loginSuccess } from '../redux/slices/authSlice'
import { LoginScreen } from './auth/LoginScreen'
import { SignupScreen } from './auth/SignupScreen'
import { OTPScreen } from './auth/OTPScreen'
import { ForgotPasswordScreen } from './auth/ForgotPasswordScreen'
import { NewPasswordScreen } from './auth/NewPasswordScreen'
import { QuickBooksIntegration } from './auth/QuickBooksIntegration'

export type AuthStep =
  | 'login'
  | 'signup'
  | 'otp'
  | 'forgot-password'
  | 'new-password'
  | 'quickbooks'

interface AuthFlowProps {
  onAuthSuccess?: (isNewUser?: boolean) => void
}

export function AuthFlow({ onAuthSuccess }: AuthFlowProps) {
  const dispatch = useAppDispatch()
  const [currentStep, setCurrentStep] = useState<AuthStep>('login')
  const [email, setEmail] = useState<string>('')
  const [role, setRole] = useState<string>('')

  const handleStepChange = (step: AuthStep, userEmail?: string, userRole?: string) => {
    setCurrentStep(step)
    if (userEmail) {
      setEmail(userEmail)
    }
    if (userRole) {
      setRole(userRole)
    }
  }

  const handleAuthSuccess = (isNewUser: boolean = false) => {
    // Mock user data - in real app this would come from API
    const mockUser = {
      id: '1',
      name: 'Admin User',
      email: email || 'admin@jdp.com',
      role: 'admin' as const,
      avatar: '/assets/images/avatars/admin-user.jpg'
    }

    const mockToken = 'mock-jwt-token'

    dispatch(loginSuccess({ user: mockUser, token: mockToken }))

    if (onAuthSuccess) {
      onAuthSuccess(isNewUser)
    }
  }

  switch (currentStep) {
    case 'login':
      return (
        <LoginScreen
          onStepChange={handleStepChange}
          onAuthSuccess={handleAuthSuccess}
        />
      )
    case 'signup':
      return (
        <SignupScreen
          onStepChange={handleStepChange}
          onAuthSuccess={handleAuthSuccess}
        />
      )
    case 'otp':
      return (
        <OTPScreen
          email={email}
          role={role}
          onStepChange={handleStepChange}
          onAuthSuccess={handleAuthSuccess}
          isForgotPassword={currentStep === 'otp' && !!email && !role}
        />
      )
    case 'forgot-password':
      return (
        <ForgotPasswordScreen
          onStepChange={handleStepChange}
        />
      )
    case 'new-password':
      return (
        <NewPasswordScreen
          email={email}
          onStepChange={handleStepChange}
          onAuthSuccess={handleAuthSuccess}
        />

      )
    case 'quickbooks':
      return (
        <QuickBooksIntegration
          onComplete={() => handleAuthSuccess()}
          onSkip={() => handleStepChange('login')}
        />
      )
    default:
      return (
        <LoginScreen
          onStepChange={handleStepChange}
          onAuthSuccess={handleAuthSuccess}
        />
      )
  }
}