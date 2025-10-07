import { useState } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { AuthStep } from '../AuthFlow'
import svgPaths from '../../imports/svg-gg40su13b1'
import { toast } from 'sonner'
import Image from 'next/image'

interface SignupScreenProps {
  onStepChange: (step: AuthStep, email?: string, role?: string) => void
  onAuthSuccess: (isNewUser?: boolean) => void
}

interface FormErrors {
  email?: string
  role?: string
}

export function SignupScreen({ onStepChange, onAuthSuccess }: SignupScreenProps) {
  const [email, setEmail] = useState<string>('')
  const [role, setRole] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [acceptTerms, setAcceptTerms] = useState<boolean>(false)
  const [errors, setErrors] = useState<FormErrors>({})

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter valid email'
    }

    if (!role) {
      newErrors.role = 'Role is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleVerify = async (): Promise<void> => {
    if (!validateForm()) return

    setIsLoading(true)

    try {
      // For now, we'll just proceed to OTP screen
      // In a real implementation, you might want to send OTP first
      setTimeout(() => {
        setIsLoading(false)
        onStepChange('otp', email, role)
      }, 1000)
    } catch (error) {
      setIsLoading(false)
      toast.error('Something went wrong. Please try again.')
    }
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setEmail(e.target.value)
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: undefined }))
    }
  }

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    setRole(e.target.value)
    if (errors.role) {
      setErrors(prev => ({ ...prev, role: undefined }))
    }
  }

  const handleTermsToggle = (): void => {
    setAcceptTerms(prev => !prev)
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
          <h2 className="text-[24px] font-extrabold text-[#00a1ff] mb-2">Sign Up</h2>
          <p className="text-[16px] text-gray-900 leading-[26px] opacity-99">
            Verify your email and select your role to continue setting up securely.
          </p>
        </div>

        <div className="space-y-6">
          {/* Email Field */}
          <div>
            <label className="text-[18px] font-medium text-gray-900 block mb-2">
              Email/Phone Number<span className="text-[#e02424]">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 opacity-30">
                <svg className="w-[17px] h-[17px]" fill="none" viewBox="0 0 17 17">
                  <g opacity="0.3">
                    <path
                      d={svgPaths.p1e3d0680}
                      stroke="#111827"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.41667"
                    />
                    <path
                      d={svgPaths.pa86ad80}
                      stroke="#111827"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.41667"
                    />
                  </g>
                </svg>
              </div>
              <Input
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="Enter your email/ phone number"
                className={`pl-12 h-[50px] rounded-full border ${errors.email
                    ? 'border-[#e02424] bg-[#fff3f3] text-[#e02424]'
                    : email
                      ? 'border-[#00a1ff] bg-white'
                      : 'border-[rgba(17,24,39,0.2)]'
                  }`}
              />
            </div>
            {errors.email && (
              <p className="text-[#e02424] text-[14px] mt-1">{errors.email}</p>
            )}
          </div>

          {/* Role Field */}
          <div>
            <label className="text-[18px] font-medium text-gray-900 block mb-2">
              Role<span className="text-[#e02424]">*</span>
            </label>
            <select
              value={role}
              onChange={handleRoleChange}
              className={`w-full px-4 py-3 h-[50px] rounded-full border focus:outline-none focus:ring-2 focus:ring-[#00a1ff] focus:border-transparent ${errors.role
                  ? 'border-[#e02424] bg-[#fff3f3] text-[#e02424]'
                  : role
                    ? 'border-[#00a1ff] bg-white'
                    : 'border-[rgba(17,24,39,0.2)] bg-white'
                }`}
            >
              <option value="">Select your role</option>
              <option value="Staff">Staff</option>
              <option value="Admin">Admin</option>
              <option value="Labour">Labour</option>
              <option value="Lead Labour">Lead Labour</option>
            </select>
            {errors.role && (
              <p className="text-[#e02424] text-[14px] mt-1">{errors.role}</p>
            )}
          </div>

          {/* Terms & Conditions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTermsToggle}
              className="w-5 h-5 border border-black border-opacity-30 rounded-sm flex items-center justify-center"
            >
              {acceptTerms && (
                <div className="w-3 h-3 bg-[#00a1ff] rounded-sm" />
              )}
            </button>
            <span className="text-[14px] text-gray-900 opacity-70">Terms & Conditions</span>
          </div>

          {/* Verify Button */}
          <Button
            onClick={handleVerify}
            disabled={isLoading || !email.trim() || !role || !acceptTerms}
            className="w-full h-[50px] bg-primary text-white hover:bg-[#0090e6] text-white rounded-full text-[18px] font-medium"
          >
            {isLoading ? 'Verifying...' : 'Verify'}
          </Button>

          {/* Back to Login Link */}
          <div className="text-center">
            <p className="text-[14px] text-gray-900">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => onStepChange('login')}
                className="text-[#00a1ff] font-medium"
              >
                Sign In
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}