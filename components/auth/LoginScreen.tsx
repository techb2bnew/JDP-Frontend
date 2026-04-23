import { useState } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { AuthStep } from '../AuthFlow'
import svgPaths from '../../imports/svg-gg40su13b1'
import { toast } from 'sonner'
import { useAppDispatch } from '../../redux/hooks'
import { loginSuccess } from '../../redux/slices/authSlice'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import Image from 'next/image'
import { getFCMToken } from '../../lib/firebase'

interface LoginScreenProps {
  onStepChange: (step: AuthStep, email?: string) => void
  onAuthSuccess: (isNewUser?: boolean) => void
}

interface FormErrors {
  email?: string
  password?: string
}

export function LoginScreen({ onStepChange, onAuthSuccess }: LoginScreenProps) {
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const dispatch = useAppDispatch()
  const router = useRouter()
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter valid email'
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSignIn = async (): Promise<void> => {
    if (!validateForm()) return

    setIsLoading(true)

    try {
      // Get FCM push token
      let pushToken: string | null = null;
      try {
        pushToken = await getFCMToken();
        if (pushToken) {
          console.log('FCM Token retrieved successfully:', pushToken.substring(0, 20) + '...');
        } else {
          console.warn('FCM Token is null - notification permission might not be granted');
        }
      } catch (error) {
        console.error('Failed to get FCM token:', error);
        // Continue with login even if token fails
      }

      // Prepare login payload
      const loginPayload: any = {
        email,
        password,
        login_by: "admin",
        push_platform: "web"
      };

      // Add push_token only if we got one
      if (pushToken) {
        loginPayload.push_token = pushToken;
      }

      // Call external API directly
      const response = await fetch(`${apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginPayload),
      });

      if (response.ok) {
        const data = await response.json()
        console.log('Login API response:', data)
         console.log(data.data.user,"data.data.user");
         
        if (data.success && data.data?.token) {
          const defaultAvatar = '/assets/images/avatars/admin-user.jpg'
          const normalizedUser = {
            ...data.data.user,
            photo_url:
              data.data.user?.photo_url ||
              data.data.user?.profile_picture ||
              data.data.user?.profilePicture ||
              data.data.user?.avatar_url ||
              data.data.user?.avatar ||
              defaultAvatar,
          }
          // Store authentication data in localStorage
          const authData = {
            user: {
              ...normalizedUser,
              permissions: data.data.permissions || [] // Store permissions
            },
            token: data.data.token,
            expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
          }

          localStorage.setItem('jdp_auth', JSON.stringify(authData))

          // Set HTTP-only cookie for authentication
          document.cookie = `auth-token=${data.data.token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
          document.cookie = `jdp_auth=${JSON.stringify(authData)}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;

          // Dispatch custom event to notify PermissionContext to refresh
          window.dispatchEvent(new CustomEvent('userLoggedIn'));

          // Dispatch login success action
          dispatch(loginSuccess({
            user: authData.user,
            token: data.data.token
          }))

          toast.success('Logged in successfully')
          onAuthSuccess(true)

          // Redirect based on user role
          if (data.data.user.role === 'Super Admin') {
            console.log('✅ Redirecting Super Admin to /superDashboard');
            router.push('/superDashboard')
          } else {
            // Get permissions from login response
            const userPermissions: Array<{ module: string; action: string }> = data.data.permissions || []
            
            // Helper function to check if user has any required permission for a module
            const hasAnyPermission = (module: string, requiredActions: string[]): boolean => {
              return requiredActions.some(action => 
                userPermissions.some(perm => perm.module === module && perm.action === action)
              )
            }

            // Define navigation items in order (same as Sidebar.tsx)
            const navigation = [
              {
                id: "dashboard",
                href: "/dashboard",
                module: "dashboard",
                requiredActions: ["view"]
              },
              {
                id: "analytics",
                href: "/analytics",
                module: "reports",
                requiredActions: ["view"]
              },
              {
                id: "products",
                href: "/products",
                module: "products",
                requiredActions: ["view", "create", "edit", "delete"]
              },
              {
                id: "orders",
                href: "/orders",
                module: "orders",
                requiredActions: ["view", "create", "edit", "delete"]
              },
              {
                id: "invoices",
                href: "/invoices",
                module: "invoices",
                requiredActions: ["view", "create", "edit", "delete"]
              },
              {
                id: "timesheets",
                href: "/timesheets",
                module: "invoices",
                requiredActions: ["view", "create", "edit", "delete"]
              },
              {
                id: "customers",
                href: "/customers",
                module: "customers",
                requiredActions: ["view", "create", "edit", "delete"]
              },
              // `/jobs` route disabled
              // {
              //   id: "jobs",
              //   href: "/jobs",
              //   module: "jobs",
              //   requiredActions: ["view", "create", "edit", "delete"]
              // },
              // `/tracking` route disabled
              // {
              //   id: "tracking",
              //   href: "/tracking",
              //   module: "tracking",
              //   requiredActions: ["view"]
              // },
              {
                id: "contractors",
                href: "/contractors",
                module: "suppliers",
                requiredActions: ["view", "create", "edit", "delete"]
              },
              {
                id: "staff",
                href: "/staff",
                module: "staff",
                requiredActions: ["view", "create", "edit", "delete"]
              },
              {
                id: "notifications",
                href: "/notifications",
                module: "notification",
                requiredActions: ["view", "create", "edit", "delete"]
              },
              {
                id: "role",
                href: "/role",
                module: "role_permission",
                requiredActions: ["view", "create", "edit", "delete"]
              },
              {
                id: "configuration",
                href: "/configuration",
                module: "configuration",
                requiredActions: ["view", "create", "edit", "delete"]
              }
            ]

            // Find first available navigation item based on permissions
            const firstAvailableItem = navigation.find(item => 
              hasAnyPermission(item.module, item.requiredActions)
            )

            if (firstAvailableItem) {
              console.log(`✅ Redirecting user to first available page: ${firstAvailableItem.href}`);
              router.push(firstAvailableItem.href)
            } else {
              // Fallback to dashboard if no permissions match
              console.log('⚠️ No matching permissions found, redirecting to /dashboard');
              router.push('/dashboard')
            }
          }
        } else {
          toast.error(data.message || 'Login failed')
        }
      } else {
        const errorData = await response.json()
        toast.error(errorData.message || 'Login failed')
      }
    } catch (error) {
      console.error('Login error:', error)
      toast.error('Network error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
  const lowercaseEmail = e.target.value.toLowerCase();
  setEmail(lowercaseEmail);
  
  if (errors.email) {
    setErrors(prev => ({ ...prev, email: undefined }));
  }
};


  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setPassword(e.target.value)
    if (errors.password) {
      setErrors(prev => ({ ...prev, password: undefined }))
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault()
    handleSignIn()
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
          <h2 className="text-[24px] font-extrabold text-[#00a1ff] mb-2">Sign In</h2>
          <p className="text-[16px] text-gray-900 leading-[26px] opacity-99">
            To access your account and explore all features, please sign in using
            your registered email address and secure password now.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field */}
          <div>
            <label className="text-[18px] font-medium text-gray-900 block mb-2">
              Email<span className="text-[#e02424]">*</span>
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
                aria-label="Email"
                placeholder="Email"
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

          {/* Password Field */}
          <div>
            <label className="text-[18px] font-medium text-gray-900 block mb-2">
              Password<span className="text-[#e02424]">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 opacity-40">
                <svg className="w-[17px] h-[17px]" fill="none" viewBox="0 0 17 17">
                  <g opacity="0.4">
                    <path
                      d={svgPaths.p35fcbb00}
                      stroke="#111827"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.41667"
                    />
                    <path
                      d={svgPaths.p14b4e00}
                      stroke="#111827"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.41667"
                    />
                  </g>
                </svg>
              </div>
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={handlePasswordChange}
                placeholder="Enter your password"
                className={`pl-12 pr-12 h-[50px] rounded-full border ${errors.password
                    ? 'border-[#e02424] bg-[#fff3f3] text-[#e02424]'
                    : password
                      ? 'border-[#00a1ff] bg-white'
                      : 'border-[rgba(17,24,39,0.2)]'
                  }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-[#e02424] text-[14px] mt-1">{errors.password}</p>
            )}
          </div>

          {/* Remember & Forgot */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* <div className="w-5 h-5 border border-black border-opacity-30 rounded-sm" />
              <span className="text-[14px] text-gray-900 opacity-70">Remember this device</span> */}
            </div>
            <button
              type="button"
              onClick={() => onStepChange('forgot-password')}
              className="text-[#00a1ff] text-[14px] font-medium underline"
            >
              Forgot Password?
            </button>
          </div>

          {/* Sign In Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-[50px] bg-primary text-white hover:bg-[#0090e6] text-white rounded-full text-[18px] font-medium"
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </Button>

          {/* Create Account Link */}
          {/* <div className="text-center">
            <p className="text-[14px] text-gray-900">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => onStepChange('signup')}
                className="text-[#00a1ff] font-medium"
              >
                Create an account
              </button>
            </p>
          </div> */}
        </form>
      </div>
    </div>
  )
}