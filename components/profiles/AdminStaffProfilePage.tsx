'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Badge } from '../ui/badge'
import { Switch } from '../ui/switch'
import { Textarea } from '../ui/textarea'
import { toast } from 'sonner'
import { apiClient } from '../../utils/api'
import { getUserData, logout } from '../../utils/auth'
import { getMaxAllowedDobLocalDateString, validateDobValue } from '../../utils/dobValidation'
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
  EyeOff,
  Briefcase,
  Building,
  DollarSign,
  FileText,
  Users
} from 'lucide-react'
import { AdminStaffProfile } from '../../types/profiles'

// Mock data
const staffProfileData: AdminStaffProfile = {
  id: 'STAFF-001',
  // Personal Details
  legalName: 'Sarah Michelle Johnson',
  fullName: 'Sarah Johnson',
  printOnCheckAs: 'Sarah M. Johnson',
  socialSecurityNo: '***-**-1234',
  mediaNo: 'MED-2024-001',
  dateOfBirth: '1990-05-15',
  gender: 'female',
  maritalStatus: 'married',
  usStatus: 'online',
  disabilityDescription: '',
  dateOfJoining: '2024-01-15',
  status: 'active',
  
  // Contact Details
  email: 'sarah.johnson@jdpcorp.com',
  mainPhone: '+1 (555) 123-4567',
  altPhone: '+1 (555) 987-6543',
  mobilePhone: '+1 (555) 456-7890',
  faxNumber: '+1 (555) 234-5678',
  ccMail: 'sarah.cc@jdpcorp.com',
  address: '456 Staff Avenue, Apt 2B',
  city: 'New York',
  state: 'NY',
  zipCode: '10001',
  website: 'https://sarah-portfolio.com',
  otherInfo: 'Preferred contact time: 9 AM - 5 PM EST',
  
  // Employment Details
  hireDate: '2024-01-15',
  originalHireDate: '2024-01-15',
  adjustedServiceDate: '2024-01-15',
  employmentType: 'full_time',
  jobTitle: 'Senior Project Manager',
  supervisor: 'John Administrator',
  department: 'Operations',
  targetBonus: 15000,
  description: 'Responsible for managing multiple construction projects and coordinating with teams.',
  
  // Permissions & Access
  permissions: {
    dashboard: { view: true, edit: true, update: true },
    products: { view: true, edit: false, update: false },
    orders: { view: true, edit: true, update: true },
    customers: { view: true, edit: true, update: false },
    analytics: { view: true, edit: false, update: false },
    invoices: { view: true, edit: true, update: true },
    staff: { view: true, edit: false, update: false },
    jobs: { view: true, edit: true, update: true }
  },
  
  profilePicture: ''
}

export function AdminStaffProfilePage() {
  const [profile, setProfile] = useState<AdminStaffProfile>(staffProfileData)
  const [isEditing, setIsEditing] = useState(false)
  const [editedProfile, setEditedProfile] = useState<AdminStaffProfile>(profile)
  const [showPassword, setShowPassword] = useState(false)
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const handleEdit = () => {
    setEditedProfile(profile)
    setIsEditing(true)
  }

  const handleCancel = () => {
    setEditedProfile(profile)
    setIsEditing(false)
  }

  const handleSave = () => {
    const dobError = validateDobValue(editedProfile.dateOfBirth)
    if (dobError) {
      toast.error(dobError)
      return
    }
    setProfile(editedProfile)
    setIsEditing(false)
    console.log('Saving staff profile:', editedProfile)
  }

  const handleInputChange = (field: keyof AdminStaffProfile, value: any) => {
    setEditedProfile(prev => ({ ...prev, [field]: value }))
  }

  const handlePermissionChange = (module: string, permission: string, value: boolean) => {
    setEditedProfile(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [module]: {
          ...prev.permissions[module as keyof typeof prev.permissions],
          [permission]: value
        }
      }
    }))
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Staff Profile</h1>
          <p className="text-muted-foreground">Comprehensive staff information and access management</p>
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

      <Tabs defaultValue="personal" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
          <TabsTrigger value="employment">Employment</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="profile-pic">Photo</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-6">
          {/* Profile Overview */}
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
                    <p className="text-muted-foreground">{profile.jobTitle}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={`${profile.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {profile.status.charAt(0).toUpperCase() + profile.status.slice(1)}
                      </Badge>
                      <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                        {profile.department}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <p>Employee ID: {profile.id}</p>
                  <p>Joined: {formatDate(profile.dateOfJoining)}</p>
                  <p>Status: {profile.usStatus === 'online' ? '🟢 Online' : '🔴 Offline'}</p>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Personal Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Personal Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Legal Name</Label>
                  {isEditing ? (
                    <Input
                      value={editedProfile.legalName}
                      onChange={(e) => handleInputChange('legalName', e.target.value)}
                    />
                  ) : (
                    <div className="p-3 bg-muted/50 rounded-lg">{profile.legalName}</div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Full Name</Label>
                  {isEditing ? (
                    <Input
                      value={editedProfile.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                    />
                  ) : (
                    <div className="p-3 bg-muted/50 rounded-lg">{profile.fullName}</div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Print on Check As</Label>
                  {isEditing ? (
                    <Input
                      value={editedProfile.printOnCheckAs}
                      onChange={(e) => handleInputChange('printOnCheckAs', e.target.value)}
                    />
                  ) : (
                    <div className="p-3 bg-muted/50 rounded-lg">{profile.printOnCheckAs}</div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Social Security No</Label>
                  <div className="p-3 bg-muted/50 rounded-lg">{profile.socialSecurityNo}</div>
                </div>

                <div className="space-y-2">
                  <Label>Media No</Label>
                  {isEditing ? (
                    <Input
                      value={editedProfile.mediaNo || ''}
                      onChange={(e) => handleInputChange('mediaNo', e.target.value)}
                    />
                  ) : (
                    <div className="p-3 bg-muted/50 rounded-lg">{profile.mediaNo || 'N/A'}</div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={editedProfile.dateOfBirth}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                      max={getMaxAllowedDobLocalDateString(15)}
                    />
                  ) : (
                    <div className="p-3 bg-muted/50 rounded-lg">{formatDate(profile.dateOfBirth)}</div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Gender</Label>
                  {isEditing ? (
                    <Select
                      value={editedProfile.gender}
                      onValueChange={(value) => handleInputChange('gender', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="p-3 bg-muted/50 rounded-lg">{profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1)}</div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Marital Status</Label>
                  {isEditing ? (
                    <Select
                      value={editedProfile.maritalStatus}
                      onValueChange={(value) => handleInputChange('maritalStatus', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Single</SelectItem>
                        <SelectItem value="married">Married</SelectItem>
                        <SelectItem value="divorced">Divorced</SelectItem>
                        <SelectItem value="widowed">Widowed</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="p-3 bg-muted/50 rounded-lg">{profile.maritalStatus.charAt(0).toUpperCase() + profile.maritalStatus.slice(1)}</div>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Disability Description</Label>
                  {isEditing ? (
                    <Textarea
                      value={editedProfile.disabilityDescription || ''}
                      onChange={(e) => handleInputChange('disabilityDescription', e.target.value)}
                      placeholder="Enter any disability description if applicable"
                    />
                  ) : (
                    <div className="p-3 bg-muted/50 rounded-lg">{profile.disabilityDescription || 'None'}</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary" />
                Contact Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Email</Label>
                  {isEditing ? (
                    <Input
                      type="email"
                      value={editedProfile.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span>{profile.email}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Main Phone</Label>
                  {isEditing ? (
                    <Input
                      value={editedProfile.mainPhone}
                      onChange={(e) => handleInputChange('mainPhone', e.target.value)}
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{profile.mainPhone}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Alternative Phone</Label>
                  {isEditing ? (
                    <Input
                      value={editedProfile.altPhone || ''}
                      onChange={(e) => handleInputChange('altPhone', e.target.value)}
                    />
                  ) : (
                    <div className="p-3 bg-muted/50 rounded-lg">{profile.altPhone || 'N/A'}</div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Mobile Phone</Label>
                  {isEditing ? (
                    <Input
                      value={editedProfile.mobilePhone || ''}
                      onChange={(e) => handleInputChange('mobilePhone', e.target.value)}
                    />
                  ) : (
                    <div className="p-3 bg-muted/50 rounded-lg">{profile.mobilePhone || 'N/A'}</div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>FAX Number</Label>
                  {isEditing ? (
                    <Input
                      value={editedProfile.faxNumber || ''}
                      onChange={(e) => handleInputChange('faxNumber', e.target.value)}
                    />
                  ) : (
                    <div className="p-3 bg-muted/50 rounded-lg">{profile.faxNumber || 'N/A'}</div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>CC Mail</Label>
                  {isEditing ? (
                    <Input
                      type="email"
                      value={editedProfile.ccMail || ''}
                      onChange={(e) => handleInputChange('ccMail', e.target.value)}
                    />
                  ) : (
                    <div className="p-3 bg-muted/50 rounded-lg">{profile.ccMail || 'N/A'}</div>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Address</Label>
                  {isEditing ? (
                    <Input
                      value={editedProfile.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>{profile.address}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>City</Label>
                  {isEditing ? (
                    <Input
                      value={editedProfile.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                    />
                  ) : (
                    <div className="p-3 bg-muted/50 rounded-lg">{profile.city}</div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>State</Label>
                  {isEditing ? (
                    <Input
                      value={editedProfile.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                    />
                  ) : (
                    <div className="p-3 bg-muted/50 rounded-lg">{profile.state}</div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>ZIP Code</Label>
                  {isEditing ? (
                    <Input
                      value={editedProfile.zipCode}
                      onChange={(e) => handleInputChange('zipCode', e.target.value)}
                    />
                  ) : (
                    <div className="p-3 bg-muted/50 rounded-lg">{profile.zipCode}</div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Website</Label>
                  {isEditing ? (
                    <Input
                      value={editedProfile.website || ''}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                    />
                  ) : (
                    <div className="p-3 bg-muted/50 rounded-lg">{profile.website || 'N/A'}</div>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Other Information</Label>
                  {isEditing ? (
                    <Textarea
                      value={editedProfile.otherInfo || ''}
                      onChange={(e) => handleInputChange('otherInfo', e.target.value)}
                    />
                  ) : (
                    <div className="p-3 bg-muted/50 rounded-lg">{profile.otherInfo || 'N/A'}</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="employment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary" />
                Employment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Hire Date</Label>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={editedProfile.hireDate}
                      onChange={(e) => handleInputChange('hireDate', e.target.value)}
                    />
                  ) : (
                    <div className="p-3 bg-muted/50 rounded-lg">{formatDate(profile.hireDate)}</div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Original Hire Date</Label>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={editedProfile.originalHireDate}
                      onChange={(e) => handleInputChange('originalHireDate', e.target.value)}
                    />
                  ) : (
                    <div className="p-3 bg-muted/50 rounded-lg">{formatDate(profile.originalHireDate)}</div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Adjusted Service Date</Label>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={editedProfile.adjustedServiceDate || ''}
                      onChange={(e) => handleInputChange('adjustedServiceDate', e.target.value)}
                    />
                  ) : (
                    <div className="p-3 bg-muted/50 rounded-lg">{profile.adjustedServiceDate ? formatDate(profile.adjustedServiceDate) : 'N/A'}</div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Employment Type</Label>
                  {isEditing ? (
                    <Select
                      value={editedProfile.employmentType}
                      onValueChange={(value) => handleInputChange('employmentType', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full_time">Full Time</SelectItem>
                        <SelectItem value="part_time">Part Time</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      {profile.employmentType === 'full_time' ? 'Full Time' : 'Part Time'}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Job Title</Label>
                  {isEditing ? (
                    <Input
                      value={editedProfile.jobTitle}
                      onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                    />
                  ) : (
                    <div className="p-3 bg-muted/50 rounded-lg">{profile.jobTitle}</div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Supervisor</Label>
                  {isEditing ? (
                    <Input
                      value={editedProfile.supervisor}
                      onChange={(e) => handleInputChange('supervisor', e.target.value)}
                    />
                  ) : (
                    <div className="p-3 bg-muted/50 rounded-lg">{profile.supervisor}</div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Department</Label>
                  {isEditing ? (
                    <Input
                      value={editedProfile.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <Building className="w-4 h-4 text-muted-foreground" />
                      <span>{profile.department}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Target Bonus</Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editedProfile.targetBonus || ''}
                      onChange={(e) => handleInputChange('targetBonus', parseInt(e.target.value) || 0)}
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <span>${profile.targetBonus?.toLocaleString() || '0'}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Description</Label>
                  {isEditing ? (
                    <Textarea
                      value={editedProfile.description || ''}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                    />
                  ) : (
                    <div className="p-3 bg-muted/50 rounded-lg">{profile.description || 'N/A'}</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Permissions & Access
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <p className="text-sm text-muted-foreground">
                  Configure module-wise permissions for this staff member. Each module can have view, edit, and update permissions.
                </p>
                
                <div className="grid gap-4">
                  {Object.entries(profile.permissions).map(([module, permissions]) => (
                    <div key={module} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium capitalize">{module.replace('_', ' ')}</h4>
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                          {module.charAt(0).toUpperCase() + module.slice(1)}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={isEditing ? editedProfile.permissions[module as keyof typeof editedProfile.permissions]?.view : permissions.view}
                            onCheckedChange={(checked:any) => isEditing && handlePermissionChange(module, 'view', checked)}
                            disabled={!isEditing}
                          />
                          <Label className="text-sm">View</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={isEditing ? editedProfile.permissions[module as keyof typeof editedProfile.permissions]?.edit : permissions.edit}
                            onCheckedChange={(checked:any) => isEditing && handlePermissionChange(module, 'edit', checked)}
                            disabled={!isEditing}
                          />
                          <Label className="text-sm">Edit</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={isEditing ? editedProfile.permissions[module as keyof typeof editedProfile.permissions]?.update : permissions.update}
                            onCheckedChange={(checked:any) => isEditing && handlePermissionChange(module, 'update', checked)}
                            disabled={!isEditing}
                          />
                          <Label className="text-sm">Update</Label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Change Password
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <Label>Current Password</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={passwordData.oldPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, oldPassword: e.target.value }))}
                      placeholder="Enter current password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>New Password</Label>
                    <Input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      placeholder="Enter new password"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Confirm New Password</Label>
                    <Input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Confirm new password"
                    />
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile-pic" className="space-y-6">
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
                  <AvatarImage src={profile.profilePicture} />
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                    {profile.fullName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium">Upload New Picture</h4>
                    <p className="text-sm text-muted-foreground">
                      Professional headshot recommended. Visible to all staff members.
                    </p>
                  </div>
                  
                  <Button variant="outline" asChild>
                    <label htmlFor="staff-picture-upload" className="cursor-pointer">
                      <Camera className="w-4 h-4 mr-2" />
                      Upload Picture
                    </label>
                  </Button>
                  <input
                    id="staff-picture-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}