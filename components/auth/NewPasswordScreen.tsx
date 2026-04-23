import { useState } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { AuthStep } from '../AuthFlow'
import { toast } from 'sonner'
// import img4541 from "figma:asset/a3e40afe539df138ee43712dc0bf65b14d1b7224.png"
import { Eye, EyeOff } from 'lucide-react'
import Image from 'next/image'

interface NewPasswordScreenProps {
  email: string
  onStepChange: (step: AuthStep, userEmail?: string, userRole?: string) => void
  onAuthSuccess: (isNewUser?: boolean) => void
}

export function NewPasswordScreen({ email, onStepChange, onAuthSuccess }: NewPasswordScreenProps) {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPasswordHelp, setShowPasswordHelp] = useState(false)
  const [errors, setErrors] = useState<{ confirm?: string }>({})
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const validatePassword = (password: string) => {
    const minLength = password.length >= 8
    const hasUpper = /[A-Z]/.test(password)
    const hasLower = /[a-z]/.test(password)
    const hasNumber = /\d/.test(password)
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password)

    return {
      minLength,
      hasUpper,
      hasLower,
      hasNumber,
      hasSpecial,
      isValid: minLength && hasUpper && hasLower && hasNumber && hasSpecial
    }
  }

  const handleSave = async () => {
    const validation = validatePassword(newPassword)

    if (!validation.isValid) {
      setShowPasswordHelp(true)
      return
    }

    if (newPassword !== confirmPassword) {
      setErrors({ confirm: 'Password mismatch' })
      return
    }

    setIsLoading(true)

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL
      const response = await fetch(`${apiBaseUrl}/auth/forgot-password/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          newPassword: newPassword,
          confirmPassword: confirmPassword
        })
      })

      const responseData = await response.json()

      if (response.ok && responseData.success) {
        toast.success('Password reset successfully')
        // Navigate back to login
        onStepChange('login')
      } else {
        toast.error(responseData.message || 'Failed to reset password')
      }
    } catch (error) {
      console.error('Error resetting password:', error)
      toast.error('Failed to reset password. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const passwordValidation = validatePassword(newPassword)

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
      <div className="absolute right-[50px] top-1/2 transform -translate-y-1/2 w-[600px]">
        <div className="mb-8">
          <h2 className="text-[24px] font-extrabold text-[#00a1ff] mb-2">New Password</h2>
          <p className="text-[16px] text-gray-900 leading-[26px] opacity-99 w-[530px]">
            Creating a new password ensures your account stays secure; always
            choose something unique, strong, and hard for others to guess.
          </p>
        </div>

        <div className="space-y-6">
          {/* New Password Field */}
          <div>
            <label className="text-[18px] font-medium text-gray-900 block mb-2">
              Enter new password<span className="text-[#e02424]">*</span>
            </label>
            <div className="relative">
              <Input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                onFocus={() => setShowPasswordHelp(true)}
                placeholder="********"
                className="h-[50px] rounded-full border border-[#00a1ff] pl-4 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNewPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password Field */}
          <div>
            <label className="text-[18px] font-medium text-gray-900 block mb-2">
              Confirm password<span className="text-[#e02424]">*</span>
            </label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="********"
                className={`h-[50px] rounded-full border pl-4 pr-12 ${errors.confirm ? 'border-[#e02424] bg-[#fff3f3]' : 'border-[#00a1ff]'
                  }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirm && (
              <p className="text-[#e02424] text-[14px] mt-1">{errors.confirm}</p>
            )}
          </div>

          {/* Password Requirements */}
          {showPasswordHelp && (
            <div className="bg-[#f8fcff] border border-[#00a1ff] border-opacity-30 rounded-lg p-4 shadow-sm">
              <p className="text-[14px] font-bold text-[#e02424] mb-2">Note:</p>
              <p className="text-[12px] font-bold text-gray-900 mb-2">Your password must include:</p>
              <div className="space-y-1 text-[12px] text-gray-900">
                <p className={passwordValidation.minLength ? 'text-green-600' : ''}>
                  • Be at least 8 character long
                </p>
                <p className={passwordValidation.hasUpper && passwordValidation.hasLower ? 'text-green-600' : ''}>
                  • Include both lower and upper case characters
                </p>
                <p className={passwordValidation.hasNumber && passwordValidation.hasSpecial ? 'text-green-600' : ''}>
                  • Include at least one number or symbol
                </p>
              </div>
            </div>
          )}

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={isLoading || !newPassword.trim() || !confirmPassword.trim()}
            className="w-full h-[50px] bg-primary text-white hover:bg-[#0090e6] text-white rounded-full text-[18px] font-medium"
          >
            {isLoading ? 'Saving...' : 'Save'}
          </Button>

          {/* Back Button */}
          <Button
            onClick={() => onStepChange('forgot-password')}
            variant="outline"
            className="w-full h-[50px] border-[rgba(0,161,255,0.2)] bg-[rgba(0,161,255,0.1)] text-[#00a1ff] rounded-full text-[18px] font-medium"
          >
            Back
          </Button>
        </div>
      </div>
    </div>
  )
}