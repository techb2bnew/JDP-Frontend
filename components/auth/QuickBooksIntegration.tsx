import { useState } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
// import imgIntuitQuickBooksLogoSvg2 from "figma:asset/484a089cb028470777f5818c5d8f1decabe921dd.png"
import { CheckCircle, ArrowRight, Shield, Zap, BarChart3 } from 'lucide-react'

interface QuickBooksIntegrationProps {
  onComplete: () => void
  onSkip: () => void
}

export function QuickBooksIntegration({ onComplete, onSkip }: QuickBooksIntegrationProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isConnecting, setIsConnecting] = useState(false)

  const handleConnect = () => {
    setIsConnecting(true)
    // Simulate QuickBooks OAuth flow
    setTimeout(() => {
      setCurrentStep(2)
      setIsConnecting(false)
    }, 2000)
  }

  const handleComplete = () => {
    setCurrentStep(3)
    setTimeout(() => {
      onComplete()
    }, 2000)
  }

  const steps = [
    { number: 1, title: 'Connect QuickBooks', completed: currentStep > 1 },
    { number: 2, title: 'Sync Data', completed: currentStep > 2 },
    { number: 3, title: 'Complete Setup', completed: currentStep >= 3 },
  ]

  return (
    <div className="min-h-screen bg-[#f8fafd] flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mb-4">
            {/* <img 
              src={imgIntuitQuickBooksLogoSvg2} 
              alt="QuickBooks" 
              className="h-12 mx-auto object-contain"
            /> */}
          </div>
          <h1 className="text-3xl font-bold text-[#2b2b2b] mb-2">
            Welcome to JDP Dashboard
          </h1>
          <p className="text-lg text-[#2b2b2b]/60">
            Let's integrate QuickBooks to supercharge your business management
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-8">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    step.completed 
                      ? 'bg-green-500 text-white' 
                      : currentStep === step.number
                      ? 'bg-[#00a1ff] text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {step.completed ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      step.number
                    )}
                  </div>
                  <span className={`ml-2 text-sm font-medium ${
                    step.completed || currentStep === step.number
                      ? 'text-[#2b2b2b]'
                      : 'text-gray-500'
                  }`}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <ArrowRight className="w-5 h-5 text-gray-400 ml-4" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Benefits Card */}
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl text-[#2b2b2b]">
                Why Connect QuickBooks?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Shield className="w-6 h-6 text-[#00a1ff] mt-1" />
                <div>
                  <h4 className="font-medium text-[#2b2b2b]">Secure Integration</h4>
                  <p className="text-sm text-[#2b2b2b]/60">
                    Bank-level security with encrypted data transmission
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Zap className="w-6 h-6 text-[#00a1ff] mt-1" />
                <div>
                  <h4 className="font-medium text-[#2b2b2b]">Automated Sync</h4>
                  <p className="text-sm text-[#2b2b2b]/60">
                    Real-time synchronization of financial data and invoices
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <BarChart3 className="w-6 h-6 text-[#00a1ff] mt-1" />
                <div>
                  <h4 className="font-medium text-[#2b2b2b]">Smart Analytics</h4>
                  <p className="text-sm text-[#2b2b2b]/60">
                    Advanced reporting and business insights
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Card */}
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl text-[#2b2b2b]">
                {currentStep === 1 && 'Connect Your QuickBooks Account'}
                {currentStep === 2 && 'Syncing Your Data'}
                {currentStep === 3 && 'Setup Complete!'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentStep === 1 && (
                <div className="space-y-4">
                  <p className="text-[#2b2b2b]/60">
                    Click below to securely connect your QuickBooks account. 
                    You'll be redirected to QuickBooks to authorize the connection.
                  </p>
                  <div className="space-y-3">
                    <Button
                      onClick={handleConnect}
                      disabled={isConnecting}
                      className="w-full h-12 bg-[#00a1ff] hover:bg-[#0090e6] text-white"
                    >
                      {isConnecting ? 'Connecting...' : 'Connect QuickBooks'}
                    </Button>
                    <Button
                      onClick={onSkip}
                      variant="outline"
                      className="w-full h-12"
                    >
                      Skip for Now
                    </Button>
                  </div>
                  <p className="text-xs text-[#2b2b2b]/40">
                    You can always connect QuickBooks later from your dashboard settings.
                  </p>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Badge className="bg-green-100 text-green-600 border-green-200">
                      Connected
                    </Badge>
                  </div>
                  <p className="text-[#2b2b2b]/60">
                    Great! We're now syncing your QuickBooks data. This may take a few moments.
                  </p>
                  <div className="bg-[#f8fafd] p-4 rounded-lg">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Importing customers...</span>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Importing invoices...</span>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Setting up analytics...</span>
                        <div className="w-4 h-4 border-2 border-[#00a1ff] border-t-transparent rounded-full animate-spin" />
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={handleComplete}
                    className="w-full h-12 bg-[#00a1ff] hover:bg-[#0090e6] text-white"
                  >
                    Continue
                  </Button>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-4 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                  <p className="text-[#2b2b2b]/60">
                    Perfect! Your QuickBooks integration is complete. 
                    You're all set to manage your business efficiently.
                  </p>
                  <div className="bg-[#f8fafd] p-4 rounded-lg">
                    <p className="text-sm text-[#2b2b2b]/80">
                      🎉 Welcome to your enhanced dashboard experience!
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-[#2b2b2b]/40">
            Need help? Contact our support team at support@jdpelectrical.com
          </p>
        </div>
      </div>
    </div>
  )
}