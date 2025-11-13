import { useState, useRef, useEffect } from 'react'
import { Button } from '../ui/button'
import { AuthStep } from '../AuthFlow'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { apiClient } from '../../utils/api'
import Image from 'next/image'
// import img4541 from "figma:asset/a3e40afe539df138ee43712dc0bf65b14d1b7224.png"

interface OTPScreenProps {
  email: string
  role?: string
  onStepChange: (step: AuthStep, userEmail?: string, userRole?: string) => void
  onAuthSuccess: (isNewUser?: boolean) => void
  isForgotPassword?: boolean
}

export function OTPScreen({ email, role, onStepChange, onAuthSuccess, isForgotPassword = false }: OTPScreenProps) {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [isLoading, setIsLoading] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const router = useRouter()

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleSubmit = async () => {
    const otpString = otp.join('')
    if (otpString.length !== 6) return

    setIsLoading(true)

    try {
      if (isForgotPassword) {
        // Forgot password flow - verify OTP
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL
        const response = await fetch(`${apiBaseUrl}/auth/forgot-password/verify-otp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email,
            otp: otpString
          })
        })

        const responseData = await response.json()

        if (response.ok && responseData.success) {
          toast.success('OTP verified successfully')
          // Navigate to new password screen
          onStepChange('new-password', email)
        } else {
          toast.error(responseData.message || 'Invalid OTP')
        }
      } else {
        // Signup flow - call the signup API using the utility function
        const data = await apiClient.signup(
          email,
          role || 'Staff', // Default to Staff if no role provided
          otpString
        )

        toast.success(data.message || 'Registration successful!')

        // For signup flow, mark as new user
        onAuthSuccess(true)

        // Redirect to login page after successful registration
        setTimeout(() => {
          router.push('/login')
        }, 1500)
      }

    } catch (error) {
      console.error('OTP verification error:', error)
      toast.error(error instanceof Error ? error.message : 'OTP verification failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL
      const response = await fetch(`${apiBaseUrl}/auth/forgot-password/resend-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email
        })
      })

      const responseData = await response.json()

      if (response.ok && responseData.success) {
        toast.success('OTP resent successfully')
      } else {
        toast.error(responseData.message || 'Failed to resend OTP')
      }
    } catch (error) {
      console.error('Error resending OTP:', error)
      toast.error('Failed to resend OTP. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-[#f6f8fb] overflow-hidden relative">
      {/* Background circles */}
      <div className="absolute left-[-275px] top-[-220px] w-[653px] h-[653px]">
        <div className="w-full h-full rounded-full bg-[#00A1FF] opacity-10" />
      </div>
      <div className="absolute left-[-10px] top-[-318px] w-[561px] h-[561px]">
        <div className="w-full h-full rounded-full bg-[#00A1FF] opacity-10" />
      </div>

      {/* Dark left section */}
      <div className="absolute bg-[#111c2d] h-full w-[50%] left-0 top-0" />

      {/* White right section */}
      <div className="absolute bg-white h-full w-[50%] right-0 top-0" />

      {/* Left content */}
      <div className="absolute left-[72px] top-1/2 transform -translate-y-1/2">
        <div className="mb-8">
          <Image
            src="/assets/logos/logo-jdp.png"
            alt="JDP Logo"
            className="w-[168px] h-[63px] object-contain opacity-99"
            width={168}
            height={63}

          />
        </div>
        <div className="text-white">
          <h1 className="text-[32px] font-extrabold mb-4">Welcome to JDP</h1>
          <p className="text-[16px] leading-[30px] w-[401px]">
            Joined forces in 2012 to form JDP Electrical Services bringing
            together 90 years of outstanding electrical experience. Their
            dedication to providing custom work has earned them and outstanding
            reputation in the construction community.
          </p>
        </div>
      </div>

      {/* Right content */}
      <div className="absolute right-[150px] top-1/2 transform -translate-y-1/2 w-[507px]">
        <div className="mb-8">
          <h2 className="text-[24px] font-extrabold text-[#00a1ff] mb-2">OTP Verification</h2>
          <p className="text-[16px] text-gray-900 leading-[26px] opacity-99 w-[464px]">
            OTP verification is required to proceed, enter the code sent to your
            registered phone/Email now.
          </p>
          {role && (
            <p className="text-[14px] text-gray-600 mt-2">
              Registering as: <span className="font-medium text-[#00a1ff]">{role}</span>
            </p>
          )}
        </div>

        <div className="space-y-6">
          {/* OTP Input Fields */}
          <div className="flex gap-4 justify-center">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el
                }}
                type="text"
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={`w-16 h-[60px] text-center text-[32px] font-medium border rounded-[10px] ${digit ? 'border-gray-900' : 'border-[rgba(17,24,39,0.2)]'
                  } focus:outline-none focus:border-[#00a1ff]`}
                maxLength={1}
              />
            ))}
          </div>

          {/* Resend Link */}
          <div className="text-center">
            <p className="text-[14px] text-gray-900">
              OTP not received?{' '}
              <button
                type="button"
                onClick={handleResend}
                className="text-[#00a1ff] font-medium"
              >
                Resend
              </button>
            </p>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={isLoading || otp.join('').length !== 6}
            className="w-full h-[50px] bg-primary text-white hover:bg-[#0090e6] text-white rounded-full text-[18px] font-medium"
          >
            {isLoading ? 'Verifying...' : 'Submit'}
          </Button>

          {/* Back Button */}
          <Button
            onClick={() => onStepChange('forgot-password')}
            variant="outline"
            className="w-full h-[50px] border-[rgba(0,161,255,0.2)] bg-[rgba(0,161,255,0.1)] text-[#00a1ff] rounded-full text-[18px] font-medium"
          >
            Back to Verification
          </Button>
        </div>
      </div>
    </div>
  )
}