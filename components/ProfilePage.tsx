import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Avatar, AvatarFallback } from './ui/avatar'
import { Separator } from './ui/separator'
import { Badge } from './ui/badge'
import { Textarea } from './ui/textarea'
import { toast } from 'sonner'
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
  Info
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

  const [profileData, setProfileData] = useState({
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@jdp.com',
    phone: '+1 (555) 123-4567',
    address: '123 Main Street, City, State 12345',
    department: 'Administration',
    role: 'System Administrator',
    employeeId: 'EMP-001',
    dateOfBirth: '1990-01-15',
    emergencyContact: '+1 (555) 987-6543',
    bio: 'Experienced system administrator with expertise in managing enterprise-level applications and ensuring optimal system performance.',
    jobTitle: 'Senior System Administrator',
    company: 'JDP',
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

  const handleProfileUpdate = () => {
    // Validate required fields
    if (!profileData.firstName || !profileData.lastName || !profileData.email) {
      toast.error('Please fill in all required fields!')
      return
    }

    // Simulate API call with loading state
    const loadingToast = toast.loading('Updating profile...')
    
    setTimeout(() => {
      toast.dismiss(loadingToast)
      toast.success('Profile updated successfully!', {
        description: 'Your changes have been saved and are now active.',
      })
      setIsEditingProfile(false)
    }, 1500)
  }

  const handlePasswordChange = () => {
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

    // Simulate API call with loading state
    const loadingToast = toast.loading('Changing password...')
    
    setTimeout(() => {
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
    }, 1500)
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onBack}
              className="gap-2 hover:bg-gray-100"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-medium text-gray-900">Admin Profile</h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage your personal information, account settings, and security preferences
            </p>
          </div>
        </div>
        <div className="flex gap-3">
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
            <CardHeader className="flex flex-row items-center justify-between border-b border-gray-200">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                    First Name *
                  </Label>
                  <Input
                    id="firstName"
                    value={profileData.firstName}
                    onChange={(e) => setProfileData(prev => ({
                      ...prev,
                      firstName: e.target.value
                    }))}
                    disabled={!isEditingProfile}
                    className={`${!isEditingProfile ? 'bg-gray-50 text-gray-600' : 'bg-white'}`}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                    Last Name *
                  </Label>
                  <Input
                    id="lastName"
                    value={profileData.lastName}
                    onChange={(e) => setProfileData(prev => ({
                      ...prev,
                      lastName: e.target.value
                    }))}
                    disabled={!isEditingProfile}
                    className={`${!isEditingProfile ? 'bg-gray-50 text-gray-600' : 'bg-white'}`}
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
                    onChange={(e) => setProfileData(prev => ({
                      ...prev,
                      email: e.target.value
                    }))}
                    disabled={!isEditingProfile}
                    className={`${!isEditingProfile ? 'bg-gray-50 text-gray-600' : 'bg-white'}`}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    value={profileData.phone}
                    onChange={(e) => setProfileData(prev => ({
                      ...prev,
                      phone: e.target.value
                    }))}
                    disabled={!isEditingProfile}
                    className={`${!isEditingProfile ? 'bg-gray-50 text-gray-600' : 'bg-white'}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="jobTitle" className="text-sm font-medium text-gray-700">
                    Job Title
                  </Label>
                  <Input
                    id="jobTitle"
                    value={profileData.jobTitle}
                    onChange={(e) => setProfileData(prev => ({
                      ...prev,
                      jobTitle: e.target.value
                    }))}
                    disabled={!isEditingProfile}
                    className={`${!isEditingProfile ? 'bg-gray-50 text-gray-600' : 'bg-white'}`}
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
                <Input
                  id="address"
                  value={profileData.address}
                  onChange={(e) => setProfileData(prev => ({
                    ...prev,
                    address: e.target.value
                  }))}
                  disabled={!isEditingProfile}
                  className={`${!isEditingProfile ? 'bg-gray-50 text-gray-600' : 'bg-white'}`}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio" className="text-sm font-medium text-gray-700">
                  Bio
                </Label>
                <Textarea
                  id="bio"
                  value={profileData.bio}
                  onChange={(e) => setProfileData(prev => ({
                    ...prev,
                    bio: e.target.value
                  }))}
                  disabled={!isEditingProfile}
                  className={`${!isEditingProfile ? 'bg-gray-50 text-gray-600' : 'bg-white'} min-h-[100px]`}
                  placeholder="Tell us about yourself..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergencyContact" className="text-sm font-medium text-gray-700">
                    Emergency Contact
                  </Label>
                  <Input
                    id="emergencyContact"
                    value={profileData.emergencyContact}
                    onChange={(e) => setProfileData(prev => ({
                      ...prev,
                      emergencyContact: e.target.value
                    }))}
                    disabled={!isEditingProfile}
                    className={`${!isEditingProfile ? 'bg-gray-50 text-gray-600' : 'bg-white'}`}
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
                    className="bg-primary hover:bg-primary/90"
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
            <CardHeader className="flex flex-row items-center justify-between border-b border-gray-200">
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
                      <p>For your security, you'll be automatically logged out after changing your password. Please save any unsaved work before proceeding.</p>
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
                    className="bg-primary hover:bg-primary/90"
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
                  <AvatarFallback className="bg-primary text-white text-2xl font-medium">
                    {profileData.firstName.charAt(0)}{profileData.lastName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="sm"
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full p-0 bg-primary hover:bg-primary/90"
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              
              <h3 className="font-medium text-gray-900 mb-1">
                {profileData.firstName} {profileData.lastName}
              </h3>
              <p className="text-sm text-gray-600">{profileData.jobTitle}</p>
              <p className="text-sm text-gray-600">{profileData.department}</p>
              
              <Separator className="my-4" />
              
              <div className="flex justify-center gap-2">
                <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
                  <Shield className="w-3 h-3 mr-1" />
                  Admin
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

              <div className="flex items-center gap-3 text-sm">
                <Building className="h-4 w-4 text-primary flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-gray-600 mb-1">Work Location</p>
                  <p className="font-medium text-gray-900">{profileData.workLocation}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Activity & Security */}
          <Card className="bg-white shadow-sm border border-gray-200">
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
          </Card>
        </div>
      </div>
    </div>
  )
}