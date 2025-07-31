import { useState } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { AuthStep } from '../AuthFlow'
import svgPaths from '../../imports/svg-gg40su13b1'
// import img4541 from "figma:asset/a3e40afe539df138ee43712dc0bf65b14d1b7224.png"

interface ForgotPasswordScreenProps {
  onStepChange: (step: AuthStep) => void
}

export function ForgotPasswordScreen({ onStepChange }: ForgotPasswordScreenProps) {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleVerify = () => {
    if (!email.trim()) return
    
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      onStepChange('new-password')
    }, 1000)
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
      <div className="absolute bg-[#111c2d] h-full w-[546px] left-0 top-0" />
      
      {/* White right section */}
      <div className="absolute bg-white h-full w-[894px] right-0 top-0" />
      
      {/* Left content */}
      <div className="absolute left-[72px] top-1/2 transform -translate-y-1/2">
        <div className="mb-8">
          {/* <img 
            src={img4541} 
            alt="JDP Logo" 
            className="w-[168px] h-[63px] object-contain opacity-99"
          /> */}
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
          <h2 className="text-[24px] font-extrabold text-[#00a1ff] mb-2">Forgot Password</h2>
          <p className="text-[16px] text-gray-900 leading-[26px] opacity-99">
            Type in your email or phone and we'll help you reset your password.
          </p>
        </div>
        
        <div className="space-y-6">
          {/* Email Field */}
          <div>
            <label className="text-[18px] font-medium text-gray-900 block mb-2">
              Email or Phone<span className="text-[#e02424]">*</span>
            </label>
            <div className="relative">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email/ phone number"
                className="h-[50px] rounded-full border border-[#00a1ff] text-center"
              />
            </div>
          </div>
          
          {/* Verify Button */}
          <Button
            onClick={handleVerify}
            disabled={isLoading || !email.trim()}
            className="w-full h-[50px] bg-[#00a1ff] hover:bg-[#0090e6] text-white rounded-full text-[18px] font-medium"
          >
            {isLoading ? 'Verifying...' : 'Verify'}
          </Button>
          
          {/* Back Button */}
          <Button
            onClick={() => onStepChange('login')}
            variant="outline"
            className="w-full h-[50px] border-[rgba(0,161,255,0.2)] bg-[rgba(0,161,255,0.1)] text-[#00a1ff] rounded-full text-[18px] font-medium"
          >
            Back to Login
          </Button>
        </div>
      </div>
    </div>
  )
}