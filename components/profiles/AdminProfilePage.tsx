'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Badge } from '../ui/badge'
import { Separator } from '../ui/separator'
import { toast } from 'sonner'
import { apiClient } from '../../utils/api'
import { getUserData, logout } from '../../utils/auth'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Shield, 
  Camera, 
  Edit, 
  Save, 
  X,
  Eye,
  EyeOff
} from 'lucide-react'
import { AdminProfile } from '../../types/profiles'

// Mock data
const adminProfileData: AdminProfile = {
  id: 'ADMIN-001',
  fullName: 'John Administrator',
  email: 'john.admin@jdpcorp.com',
  phone: '+1 (555) 123-4567',
  city: 'New York',
  state: 'NY',
  address: '1234 Admin Street, Suite 100',
  profilePicture: '',
  joinDate: '2023-01-15',
  lastLogin: '2025-01-23T09:30:00Z',
  role: 'super_admin',
  status: 'active'
}

export function AdminProfilePage() {
  const [profile, setProfile] = useState<AdminProfile>(adminProfileData)
  const [isEditing, setIsEditing] = useState(false)
  const [editedProfile, setEditedProfile] = useState<AdminProfile>(profile)
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null)

  const handleEdit = () => {
    setEditedProfile(profile)
    setIsEditing(true)
  }

  const handleCancel = () => {
    setEditedProfile(profile)
    setIsEditing(false)
    setProfilePicturePreview(null)
  }

  const handleSave = () => {
    setProfile(editedProfile)
    setIsEditing(false)
    setProfilePicturePreview(null)
    // Here you would typically save to backend
    console.log('Saving profile:', editedProfile)
  }

  const handleInputChange = (field: keyof AdminProfile, value: string) => {
    setEditedProfile(prev => ({ ...prev, [field]: value }))
  }

  const handlePasswordChange = (field: keyof typeof passwordData, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }))
  }

  const handlePasswordSubmit = async () => {
    if (!passwordData.oldPassword) {
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

    // Get current user data
    const userData = getUserData()
    if (!userData || !userData.id) {
      toast.error('User data not found. Please login again.')
      return
    }

    const loadingToast = toast.loading('Changing password...')
    
    try {
      await apiClient.changePassword(
        userData.id,
        passwordData.oldPassword,
        passwordData.newPassword
      )
      
      toast.dismiss(loadingToast)
      toast.success('Password changed successfully!', {
        description: 'For security, you will be logged out in 30 seconds.',
      })
      
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' })
      
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

  const handleProfilePictureUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setProfilePicturePreview(result)
        setEditedProfile(prev => ({ ...prev, profilePicture: result }))
      }
      reader.readAsDataURL(file)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: '2-digit',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Admin Profile</h1>
          <p className="text-muted-foreground">Manage your personal information and account settings</p>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancel}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave} className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </>
          ) : (
            <Button onClick={handleEdit} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="basic-info" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic-info">Basic Information</TabsTrigger>
          <TabsTrigger value="security">Security Settings</TabsTrigger>
          <TabsTrigger value="profile-picture">Profile Picture</TabsTrigger>
        </TabsList>

        <TabsContent value="basic-info" className="space-y-6">
          {/* Profile Overview Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={profile.profilePicture} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {profile.fullName.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-semibold">{profile.fullName}</h3>
                    <p className="text-muted-foreground">{profile.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={`${profile.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {profile.status.charAt(0).toUpperCase() + profile.status.slice(1)}
                      </Badge>
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                        {profile.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <p>Joined: {formatDate(profile.joinDate)}</p>
                  <p>Last Login: {formatDateTime(profile.lastLogin)}</p>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  {isEditing ? (
                    <Input
                      id="fullName"
                      value={editedProfile.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      placeholder="Enter your full name"
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span>{profile.fullName}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  {isEditing ? (
                    <Input
                      id="email"
                      type="email"
                      value={editedProfile.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="Enter your email"
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span>{profile.email}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  {isEditing ? (
                    <Input
                      id="phone"
                      value={editedProfile.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="Enter your phone number"
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{profile.phone}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  {isEditing ? (
                    <Input
                      id="city"
                      value={editedProfile.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="Enter your city"
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>{profile.city}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  {isEditing ? (
                    <Input
                      id="state"
                      value={editedProfile.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      placeholder="Enter your state"
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>{profile.state}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  {isEditing ? (
                    <Input
                      id="address"
                      value={editedProfile.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="Enter your address"
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>{profile.address}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          {/* Change Password */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Change Password
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="oldPassword">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="oldPassword"
                      type={showOldPassword ? 'text' : 'password'}
                      value={passwordData.oldPassword}
                      onChange={(e) => handlePasswordChange('oldPassword', e.target.value)}
                      placeholder="Enter your current password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                    >
                      {showOldPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
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
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                      placeholder="Confirm new password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={handlePasswordSubmit}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={!passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                >
                  Update Password
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Security Information */}
          <Card>
            <CardHeader>
              <CardTitle>Security Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                  </div>
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                    Not Enabled
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Login Notifications</p>
                    <p className="text-sm text-muted-foreground">Get notified of new logins</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    Enabled
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile-picture" className="space-y-6">
          {/* Profile Picture Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-primary" />
                Profile Picture
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="w-32 h-32">
                  <AvatarImage src={profilePicturePreview || profile.profilePicture} />
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                    {profile.fullName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium">Upload New Picture</h4>
                    <p className="text-sm text-muted-foreground">
                      Choose a photo that represents you well. It will be visible to other users.
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" asChild>
                      <label htmlFor="profile-picture-upload" className="cursor-pointer">
                        <Camera className="w-4 h-4 mr-2" />
                        Upload New Picture
                      </label>
                    </Button>
                    <input
                      id="profile-picture-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleProfilePictureUpload}
                    />
                    {profilePicturePreview && (
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setProfilePicturePreview(null)
                          setEditedProfile(prev => ({ ...prev, profilePicture: profile.profilePicture }))
                        }}
                      >
                        Remove Preview
                      </Button>
                    )}
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    <p>• Recommended size: 400x400 pixels</p>
                    <p>• Supported formats: JPG, PNG, GIF</p>
                    <p>• Maximum file size: 5MB</p>
                  </div>
                </div>
              </div>
              
              {profilePicturePreview && (
                <div className="flex justify-end">
                  <Button onClick={handleSave} className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <Save className="w-4 h-4 mr-2" />
                    Save Picture
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}