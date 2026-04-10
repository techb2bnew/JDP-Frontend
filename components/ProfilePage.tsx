import { useState, useEffect, useRef } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Separator } from './ui/separator'
import { Badge } from './ui/badge'
import { Textarea } from './ui/textarea'
import { toast } from 'sonner'
import { apiClient, globalApiCall } from '../utils/api'
import { getUserData, logout } from '../utils/auth'
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import Autocomplete from "react-google-autocomplete";
import { 
  User,
  Mail,
  Phone,
  MapPin,
  Lock,
  Save,
  ArrowLeft,
  Camera,
  Eye,
  EyeOff,
  Edit,
  Calendar,
  Shield,
  Clock,
  CheckCircle,
  Building,
  UserCheck,
  Key,
  AlertTriangle,
  Info,
  RefreshCw
} from 'lucide-react'

interface ProfilePageProps {
  onBack?: () => void
}

export function ProfilePage({ onBack }: ProfilePageProps) {
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [profileError, setProfileError] = useState<string | null>(null)

  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    department: '',
    role: '',
    employeeId: '',
    dateOfBirth: '',
    position: '',
    company: '',
    workLocation: 'Head Office - Building A'
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: []
  })

  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL

  // Ensure Google Autocomplete dropdown appears above UI
  useEffect(() => {
    const style = document.createElement("style");
    style.id = "google-autocomplete-styles-profile";
    style.textContent = `
      .pac-container { z-index: 999999 !important; }
    `;
    const existingStyle = document.getElementById("google-autocomplete-styles-profile");
    if (existingStyle) document.head.removeChild(existingStyle);
    document.head.appendChild(style);
    return () => {
      const s = document.getElementById("google-autocomplete-styles-profile");
      if (s) document.head.removeChild(s);
    };
  }, []);

  // Normalize phone to E.164 so react-phone-number-input can infer country/flag
  const normalizePhoneToE164 = (rawPhone: string) => {
    const raw = (rawPhone || "").trim();
    if (!raw) return "";
    if (raw.startsWith("+")) return raw;

    const digits = raw.replace(/\D/g, "");
    if (!digits) return "";
    if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
    if (digits.length === 10) return `+1${digits}`;
    return `+${digits}`;
  };

  // Helper function to get auth token
  const getAuthToken = (): string | null => {
    if (typeof window !== "undefined") {
      const savedAuth = localStorage.getItem("jdp_auth");
      if (savedAuth) {
        try {
          const authData = JSON.parse(savedAuth);
          if (authData.token && authData.expires > Date.now()) {
            return authData.token;
          }
        } catch (error) {
          console.error("Error parsing auth data:", error);
        }
      }
    }
    return null;
  };

  // Handle image upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB')
      return
    }

    try {
      setIsUploadingImage(true)
      const loadingToast = toast.loading('Uploading image...')

      // Get staff ID
      const userData = getUserData()
      if (!userData?.user?.id) {
        toast.error('User ID not found')
        return
      }

      const staffId = 
        userData.user.staff_id || 
        (userData.user.staff && Array.isArray(userData.user.staff) && userData.user.staff.length > 0 ? userData.user.staff[0].id : null) ||
        (userData.user.staff && !Array.isArray(userData.user.staff) ? userData.user.staff.id : null) ||
        userData.user.id || 
        null

      if (!staffId) {
        toast.error('Staff profile not found')
        return
      }

      // Create FormData
      const formData = new FormData()
      formData.append('profile_image', file)

      // Get auth token for manual fetch
      const token = getAuthToken()
      if (!token) {
        toast.error('Authentication token not found')
        return
      }

      // Upload image using fetch directly (FormData needs special handling)
      const response = await fetch(`${apiBaseUrl}/staff/updateProfileImage/${staffId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // Don't set Content-Type - browser will set it with boundary for FormData
        },
        body: formData
      })

      const responseData = await response.json().catch(() => ({}))
      toast.dismiss(loadingToast)

      if (response.ok && responseData.success) {
        toast.success('Profile image updated successfully!')
        // Refresh profile data to show new image
        await refreshProfileData()
      } else {
        toast.error(responseData.message || 'Failed to upload image')
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error('Failed to upload image')
    } finally {
      setIsUploadingImage(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Fetch profile data on component mount
  useEffect(() => {

    
    const fetchProfileData = async () => {
      try {
        setIsLoading(true)
        setProfileError(null)
        
        const userData = getUserData()
        if (!userData || !userData.user || !userData.user.id) {
          throw new Error('User data not found. Please login again.')
        }

        // Extract staff ID from user data - try multiple  possible locations
        const staffId = 
          userData.user.staff_id || 
          (userData.user.staff && Array.isArray(userData.user.staff) && userData.user.staff.length > 0 ? userData.user.staff[0].id : null) ||
          (userData.user.staff && !Array.isArray(userData.user.staff) ? userData.user.staff.id : null) ||
          userData.user.id || 
          null

        if (!staffId) {
          console.error('User data structure:', userData)
          throw new Error('Staff profile not found. Please contact administrator.')
        }

        const response = await apiClient.getUserProfile(staffId.toString())
        
        if (response.success && response.data) {
          const staffData = response.data
          const userData = staffData.users || {}
          console.log('Staff Data:', staffData)
          console.log('User Data:', userData)
          
          const profileDataToSet = {
            fullName: userData.full_name || '',
            email: userData.email || '',
            phone: normalizePhoneToE164(userData.phone || ''),
            address: staffData.address || '',
            department: staffData.department || '',
            role: userData.role || '',
            employeeId: staffData.id?.toString() || '',
            dateOfBirth: staffData.dob || '',
            position: staffData.position || '',
            company: 'JDP',
            workLocation: 'Head Office - Building A'
          }
          
          console.log('Profile Data to Set:', profileDataToSet)
          setProfileData(profileDataToSet)
          
          // Set profile image URL if available
          if (staffData.profile_image) {
            setProfileImageUrl(staffData.profile_image)
          } else {
            setProfileImageUrl(null)
          }
        } else {
          throw new Error(response.message || 'Failed to fetch profile data')
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
        setProfileError(error instanceof Error ? error.message : 'Failed to load profile')
        toast.error('Failed to load profile data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfileData()
  }, [])

  // Function to refresh profile data
  const refreshProfileData = async () => {
    try {
      setIsLoading(true)
      setProfileError(null)
      
      const userData = getUserData()
      if (!userData || !userData.user || !userData.user.id) {
        throw new Error('User data not found. Please login again.')
      }

      // Extract staff ID from user data - try multiple possible locations
      const staffId = 
        userData.user.staff.id || 
        (userData.user.staff && Array.isArray(userData.user.staff) && userData.user.staff.length > 0 ? userData.user.staff[0].id : null) ||
        (userData.user.staff && !Array.isArray(userData.user.staff) ? userData.user.staff.id : null) ||
        userData.user.id || 
        null

      if (!staffId) {
        console.error('User data structure:', userData)
        throw new Error('Staff profile not found. Please contact administrator.')
      }

      const response = await apiClient.getUserProfile(staffId.toString())
      
      if (response.success && response.data) {
        const staffData = response.data
        const userData = staffData.users || {}
        console.log('Refresh - Staff Data:', staffData)
        console.log('Refresh - User Data:', userData)
        
        const profileDataToSet = {
          fullName: userData.full_name || '',
          email: userData.email || '',
          phone: userData.phone || '',
          address: staffData.address || '',
          department: staffData.department || '',
          role: userData.role || '',
          employeeId: staffData.id?.toString() || '',
          dateOfBirth: staffData.dob || '',
          position: staffData.position || '',
          company: 'JDP',
          workLocation: 'Head Office - Building A'
        }
        
        console.log('Refresh - Profile Data to Set:', profileDataToSet)
        setProfileData(profileDataToSet)
        
        // Set profile image URL if available
        if (staffData.profile_image) {
          setProfileImageUrl(staffData.profile_image)
        } else {
          setProfileImageUrl(null)
        }
        // toast.success('Profile data refreshed successfully!')
      } else {
        throw new Error(response.message || 'Failed to fetch profile data')
      }
    } catch (error) {
      console.error('Error refreshing profile:', error)
      setProfileError(error instanceof Error ? error.message : 'Failed to refresh profile')
      toast.error('Failed to refresh profile data')
    } finally {
      setIsLoading(false)
    }
  }

  const checkPasswordStrength = (password: string) => {
    let score = 0
    const feedback = []

    if (password.length >= 8) score += 1
    else feedback.push('At least 8 characters')

    if (/[A-Z]/.test(password)) score += 1
    else feedback.push('At least one uppercase letter')

    if (/[a-z]/.test(password)) score += 1
    else feedback.push('At least one lowercase letter')

    if (/\d/.test(password)) score += 1
    else feedback.push('At least one number')

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1
    else feedback.push('At least one special character')

    setPasswordStrength({ score, feedback:[] })
  }

  const handleProfileUpdate = async () => {
    // Validate required fields
    if (!profileData.fullName || !profileData.email) {
      toast.error('Please fill in all required fields!')
      return
    }

    // Validate phone if present
    if (profileData.phone?.trim()) {
      const normalizedPhone = normalizePhoneToE164(profileData.phone);
      if (!normalizedPhone || !isValidPhoneNumber(normalizedPhone)) {
        toast.error('Please enter a valid phone number for the selected country.')
        return
      }
    }

    try {
      const loadingToast = toast.loading('Updating profile...')
      
      // Get user ID from auth data
      const userData = getUserData()
      if (!userData?.user?.id) {
        toast.error('User ID not found')
        return
      }
      
      // Extract staff ID from user data
      const staffId = userData.user.staff.id ? userData.user.staff.id : null
      if (!staffId) {
        throw new Error('Staff profile not found. Please contact administrator.')
      }

      const profilePayload = {
        full_name: profileData.fullName,
        email: profileData.email,
        phone: normalizePhoneToE164(profileData.phone) || "",
        position: profileData.position,
        department: profileData.department,
        address: profileData.address,
        date_of_birth: profileData.dateOfBirth,
        employee_id: "EMP-001", // This could be dynamic based on user data
        system_role: profileData.position // Using position as system_role for now
      }

      const response = await apiClient.updateUserProfile(staffId.toString(), profilePayload)

      toast.dismiss(loadingToast)

      if (response.success) {
        // Update localStorage with updated profile data
        const userData = getUserData()
        if (userData) {
          const updatedUserData = {
            ...userData,
            user: {
              ...userData.user,
              full_name: profileData.fullName
            }
          }
          localStorage.setItem('jdp_auth', JSON.stringify(updatedUserData))
        }

        toast.success('Profile updated successfully!', {
          description: 'Your changes have been saved and are now active.',
        })
        setIsEditingProfile(false)
        // Refresh profile data
        await refreshProfileData()
      } else {
        toast.error(response.message || 'Failed to update profile')
      }
    } catch (error) {
      toast.dismiss()
      toast.error(error instanceof Error ? error.message : 'Failed to update profile')
    }
  }

  const handlePasswordChange = async () => {
    if (!passwordData.currentPassword) {
      toast.error('Current password is required!')
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match!')
      return
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long!')
      return
    }

    if (passwordStrength.score < 3) {
      toast.error('Password is too weak! Please use a stronger password.')
      return
    }

    // Get current user data
    const userData = getUserData()
    if (!userData || !userData.user || !userData.user.id) {
      toast.error('User data not found. Please login again.')
      return
    }

    const loadingToast = toast.loading('Changing password...')
    
    try {
      await apiClient.changePassword(
        userData.user.id,
        passwordData.currentPassword,
        passwordData.newPassword
      )
      
      toast.dismiss(loadingToast)
      toast.success('Password changed successfully!', {
        description: 'For security, you will be logged out in 30 seconds.',
      })
      
      setIsChangingPassword(false)
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      setPasswordStrength({ score: 0, feedback: [] })
      
      // Auto logout after 30 seconds for security
      setTimeout(async () => {
        await logout()
        window.location.href = '/login'
      }, 30000)
      
    } catch (error) {
      toast.dismiss(loadingToast)
      toast.error(error instanceof Error ? error.message : 'Failed to change password')
    }
  }

  const cancelPasswordChange = () => {
    setIsChangingPassword(false)
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
    setPasswordStrength({ score: 0, feedback: [] })
  }

  const cancelProfileEdit = () => {
    setIsEditingProfile(false)
    // Reset to original data if needed
  }

  const getPasswordStrengthColor = () => {
    if (passwordStrength.score <= 2) return 'bg-red-500'
    if (passwordStrength.score <= 3) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getPasswordStrengthText = () => {
    if (passwordStrength.score <= 2) return 'Weak'
    if (passwordStrength.score <= 3) return 'Medium'
    return 'Strong'
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </div>
    )
  }

  // Show error state
  if (profileError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Failed to Load Profile</h3>
            <p className="text-muted-foreground mb-4">{profileError}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* {onBack && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onBack}
              className="gap-2 hover:bg-gray-100"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          )} */}
          <div>
            <h1 className="text-2xl font-medium text-gray-900">Profile</h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage your personal information, account settings, and security preferences
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshProfileData}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Badge className="bg-green-50 text-green-600 border-green-200 hover:bg-green-50">
            <CheckCircle className="h-3 w-3 mr-1" />
            Account Active
          </Badge>
          <Badge className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-50">
            <Shield className="h-3 w-3 mr-1" />
            Admin Access
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Profile Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information Card */}
          <Card className="bg-white shadow-sm border border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between border-b border-gray-200 pb-3">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Personal Information
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                className="gap-2"
                disabled={isChangingPassword}
              >
                <Edit className="h-4 w-4" />
                {isEditingProfile ? 'Cancel Edit' : 'Edit Profile'}
              </Button>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">
                    Full Name *
                  </Label>
                  <Input
                    id="fullName"
                    value={profileData.fullName}
                    onChange={(e) => setProfileData(prev => ({
                      ...prev,
                      fullName: e.target.value
                    }))}
                    disabled={!isEditingProfile}
                    className={`${!isEditingProfile ? 'bg-gray-50 text-gray-600' : 'bg-white'}`}
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email Address *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    disabled={true}
                    className="bg-gray-50 text-gray-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                    Phone Number
                  </Label>
                  <PhoneInput
                    id="phone"
                    value={profileData.phone}
                    onChange={(value) =>
                      setProfileData((prev) => ({
                        ...prev,
                        phone: value || "",
                      }))
                    }
                    international
                    defaultCountry="US"
                    disabled={!isEditingProfile}
                    className={`${!isEditingProfile ? 'bg-gray-50 text-gray-600 rounded-md px-3 py-2' : 'bg-white border border-gray-300 rounded-md px-3 py-2'}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="position" className="text-sm font-medium text-gray-700">
                    Position
                  </Label>
                  <Input
                    id="position"
                    value={profileData.position}
                    onChange={(e) => setProfileData(prev => ({
                      ...prev,
                      position: e.target.value
                    }))}
                    disabled={!isEditingProfile}
                    className={`${!isEditingProfile ? 'bg-gray-50 text-gray-600' : 'bg-white'}`}
                    placeholder="Enter your position"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department" className="text-sm font-medium text-gray-700">
                    Department
                  </Label>
                  <Input
                    id="department"
                    value={profileData.department}
                    onChange={(e) => setProfileData(prev => ({
                      ...prev,
                      department: e.target.value
                    }))}
                    disabled={!isEditingProfile}
                    className={`${!isEditingProfile ? 'bg-gray-50 text-gray-600' : 'bg-white'}`}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-medium text-gray-700">
                  Address
                </Label>
                <Autocomplete
                  id="address"
                  apiKey={
                    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
                    "AIzaSyBEQp-ZFMYZjsTNyximu2pAifQ9EWA4W3M"
                  }
                  options={{
                    types: ["address"],
                    componentRestrictions: { country: "us" },
                  }}
                  value={profileData.address}
                  onPlaceSelected={(place: any) => {
                    const address = place?.formatted_address || place?.name || "";
                    if (!address) return;
                    setProfileData((prev) => ({ ...prev, address }));
                  }}
                  onChange={(e: any) => {
                    const value = e.target.value;
                    setProfileData((prev) => ({ ...prev, address: value }));
                  }}
                  disabled={!isEditingProfile}
                  className={`w-full h-10 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                    !isEditingProfile ? "bg-gray-50 text-gray-600" : "bg-white"
                  }`}
                />
              </div>


              <div className="space-y-2">
                <Label htmlFor="dateOfBirth" className="text-sm font-medium text-gray-700">
                  Date of Birth
                </Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={profileData.dateOfBirth}
                  onChange={(e) => setProfileData(prev => ({
                    ...prev,
                    dateOfBirth: e.target.value
                  }))}
                  disabled={!isEditingProfile}
                  className={`${!isEditingProfile ? 'bg-gray-50 text-gray-600' : 'bg-white'}`}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employeeId" className="text-sm font-medium text-gray-700">
                    Employee ID
                  </Label>
                  <Input
                    id="employeeId"
                    value={profileData.employeeId}
                    disabled={true}
                    className="bg-gray-50 text-gray-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-sm font-medium text-gray-700">
                    System Role
                  </Label>
                  <Input
                    id="role"
                    value={profileData.role}
                    disabled={true}
                    className="bg-gray-50 text-gray-600"
                  />
                </div>
              </div>

              {isEditingProfile && (
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <Button 
                    onClick={handleProfileUpdate}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={cancelProfileEdit}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Password Change Card */}
          <Card className="bg-white shadow-sm border border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between border-b border-gray-200 pb-3">
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                Security & Password
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsChangingPassword(!isChangingPassword)}
                className="gap-2"
                disabled={isEditingProfile}
              >
                <Key className="h-4 w-4" />
                {isChangingPassword ? 'Cancel' : 'Change Password'}
              </Button>
            </CardHeader>
            
            {isChangingPassword && (
              <CardContent className="space-y-6 pt-6">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Security Notice</p>
                      <p>For your security, you&apos;ll be automatically logged out after changing your password. Please save any unsaved work before proceeding.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currentPassword" className="text-sm font-medium text-gray-700">
                    Current Password *
                  </Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({
                        ...prev,
                        currentPassword: e.target.value
                      }))}
                      className="bg-white pr-10"
                      placeholder="Enter your current password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
                    New Password *
                  </Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(e) => {
                        const newPassword = e.target.value
                        setPasswordData(prev => ({
                          ...prev,
                          newPassword
                        }))
                        checkPasswordStrength(newPassword)
                      }}
                      className="bg-white pr-10"
                      placeholder="Enter new password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                  
                  {/* Password Strength Indicator */}
                  {passwordData.newPassword && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                            style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                          />
                        </div>
                        <span className={`text-sm font-medium ${
                          passwordStrength.score <= 2 ? 'text-red-600' :
                          passwordStrength.score <= 3 ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {getPasswordStrengthText()}
                        </span>
                      </div>
                      {passwordStrength.feedback.length > 0 && (
                        <div className="text-xs text-gray-600">
                          <p className="mb-1">Requirements:</p>
                          <ul className="list-disc list-inside space-y-1">
                            {passwordStrength.feedback.map((item, index) => (
                              <li key={index}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                    Confirm New Password *
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({
                        ...prev,
                        confirmPassword: e.target.value
                      }))}
                      className="bg-white pr-10"
                      placeholder="Confirm your new password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                  {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                    <p className="text-xs text-red-600">Passwords do not match</p>
                  )}
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <Button 
                    onClick={handlePasswordChange}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    disabled={passwordStrength.score < 3 || passwordData.newPassword !== passwordData.confirmPassword}
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    Update Password
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={cancelPasswordChange}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            )}
            
            {!isChangingPassword && (
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Password Status</p>
                        <p className="text-sm text-gray-600">Last updated 30 days ago</p>
                      </div>
                    </div>
                    <Badge className="bg-green-50 text-green-600 border-green-200 hover:bg-green-50">
                      Strong
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Shield className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">Two-Factor Auth</span>
                      </div>
                      <p className="text-xs text-blue-700">Enabled</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-900">Session Timeout</span>
                      </div>
                      <p className="text-xs text-green-700">8 hours</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        {/* Profile Summary Sidebar */}
        <div className="space-y-6">
          {/* Avatar Card */}
          <Card className="bg-white shadow-sm border border-gray-200">
            <CardContent className="p-6 text-center">
              <div className="relative inline-block mb-4">
                <Avatar className="w-24 h-24 mx-auto">
                  {profileImageUrl && (
                    <AvatarImage src={profileImageUrl} alt={profileData.fullName} />
                  )}
                  <AvatarFallback className="bg-primary text-white text-2xl font-medium">
                    {profileData.fullName.split(' ').map(name => name.charAt(0)).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="sm"
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full p-0 bg-primary hover:bg-primary/90"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingImage}
                >
                  {isUploadingImage ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
              
              <h3 className="font-medium text-gray-900 mb-1">
                {profileData.fullName}
              </h3>
              <p className="text-sm text-gray-600">{profileData.position}</p>
              <p className="text-sm text-gray-600">{profileData.department}</p>
              
              <Separator className="my-4" />
              
              <div className="flex justify-center gap-2">
                <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
                  <Shield className="w-3 h-3 mr-1" />
                  {profileData.role}
                </Badge>
                <Badge className="bg-green-50 text-green-600 border-green-200 hover:bg-green-50">
                  <UserCheck className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Quick Contact Info */}
          <Card className="bg-white shadow-sm border border-gray-200">
            <CardHeader className="border-b border-gray-200">
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-primary flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-gray-600 mb-1">Email</p>
                  <p className="font-medium text-gray-900 break-all">{profileData.email}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-primary flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-gray-600 mb-1">Phone</p>
                  <p className="font-medium text-gray-900">{profileData.phone}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 text-sm">
                <MapPin className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-gray-600 mb-1">Address</p>
                  <p className="font-medium text-gray-900 leading-relaxed">{profileData.address}</p>
                </div>
              </div>

              {/* <div className="flex items-center gap-3 text-sm">
                <Building className="h-4 w-4 text-primary flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-gray-600 mb-1">Work Location</p>
                  <p className="font-medium text-gray-900">{profileData.workLocation}</p>
                </div>
              </div> */}
            </CardContent>
          </Card>

          {/* Account Activity & Security */}
          {/* <Card className="bg-white shadow-sm border border-gray-200">
            <CardHeader className="border-b border-gray-200">
              <CardTitle className="text-lg">Account Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Last Login</p>
                    <p className="text-xs text-gray-600">Today at 9:30 AM</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Member Since</p>
                    <p className="text-xs text-gray-600">January 2024</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Account Status</p>
                    <p className="text-xs text-green-600">Active & Verified</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Security Score</p>
                    <p className="text-xs text-blue-600">95% - Excellent</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card> */}
        </div>
      </div>
    </div>
  )
}