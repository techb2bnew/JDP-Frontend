'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Badge } from '../ui/badge'
import { Switch } from '../ui/switch'
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
  Briefcase,
  FileText,
  Upload,
  Download,
  CheckCircle,
  Clock,
  Building
} from 'lucide-react'
import { LabourLeadProfile } from '../../types/profiles'

// Mock data
const labourLeadData: LabourLeadProfile = {
  id: 'LEAD-001',
  // Personal Info
  fullName: 'Michael Rodriguez',
  email: 'michael.rodriguez@jdpcorp.com',
  phone: '+1 (555) 345-6789',
  dateOfBirth: '1985-08-22',
  address: '789 Lead Street, Unit 5',
  city: 'Brooklyn',
  state: 'NY',
  zipCode: '11201',
  
  // Job Details
  department: 'Construction',
  position: 'Lead Labor Supervisor',
  dateOfJoining: '2023-03-10',
  status: 'active',
  supervisor: 'Sarah Johnson',
  employeeId: 'EMP-LEAD-001',
  
  // Documents
  documents: {
    idProof: {
      fileName: 'michael_drivers_license.pdf',
      uploadDate: '2023-03-10',
      fileUrl: '/documents/michael_id.pdf'
    },
    drivingLicense: {
      fileName: 'commercial_license.pdf',
      uploadDate: '2023-03-10',
      fileUrl: '/documents/michael_cdl.pdf',
      licenseNumber: 'CDL-NY-1234567',
      expiryDate: '2027-08-22'
    },
    resume: {
      fileName: 'michael_resume_2023.pdf',
      uploadDate: '2023-03-08',
      fileUrl: '/documents/michael_resume.pdf'
    }
  },
  
  // Permissions
  permissions: {
    createJob: true,
    viewInventoryPrice: true,
    invoiceSending: false,
    updateBluesheet: true,
    manageSubordinates: true,
    approveTimesheets: true
  },
  
  profilePicture: ''
}

export function LabourLeadDetailsPage() {
  const [profile, setProfile] = useState<LabourLeadProfile>(labourLeadData)
  const [isEditing, setIsEditing] = useState(false)
  const [editedProfile, setEditedProfile] = useState<LabourLeadProfile>(profile)

  const handleEdit = () => {
    setEditedProfile(profile)
    setIsEditing(true)
  }

  const handleCancel = () => {
    setEditedProfile(profile)
    setIsEditing(false)
  }

  const handleSave = () => {
    setProfile(editedProfile)
    setIsEditing(false)
    console.log('Saving labour lead profile:', editedProfile)
  }

  const handleInputChange = (field: keyof LabourLeadProfile, value: any) => {
    setEditedProfile(prev => ({ ...prev, [field]: value }))
  }

  const handlePermissionChange = (permission: keyof LabourLeadProfile['permissions'], value: boolean) => {
    setEditedProfile(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permission]: value
      }
    }))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleFileUpload = (docType: keyof LabourLeadProfile['documents'], file: File) => {
    // Simulate file upload
    const newDoc = {
      fileName: file.name,
      uploadDate: new Date().toISOString().split('T')[0],
      fileUrl: `/documents/${file.name}`,
      ...(docType === 'drivingLicense' && {
        licenseNumber: editedProfile.documents.drivingLicense?.licenseNumber || '',
        expiryDate: editedProfile.documents.drivingLicense?.expiryDate || ''
      })
    }
    
    setEditedProfile(prev => ({
      ...prev,
      documents: {
        ...prev.documents,
        [docType]: newDoc
      }
    }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Labour Lead Profile</h1>
          <p className="text-muted-foreground">Lead labour management and permissions</p>
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="job">Job Details</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
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
                    <p className="text-muted-foreground">{profile.position}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={`${profile.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {profile.status.charAt(0).toUpperCase() + profile.status.slice(1)}
                      </Badge>
                      <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">
                        Lead Labour
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <p>ID: {profile.employeeId}</p>
                  <p>Joined: {formatDate(profile.dateOfJoining)}</p>
                  <p>Department: {profile.department}</p>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  {isEditing ? (
                    <Input
                      value={editedProfile.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span>{profile.fullName}</span>
                    </div>
                  )}
                </div>

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
                  <Label>Phone</Label>
                  {isEditing ? (
                    <Input
                      value={editedProfile.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{profile.phone}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={editedProfile.dateOfBirth}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>{formatDate(profile.dateOfBirth)}</span>
                    </div>
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="job" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary" />
                Job Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Employee ID</Label>
                  <div className="p-3 bg-muted/50 rounded-lg font-mono">{profile.employeeId}</div>
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
                  <Label>Position</Label>
                  {isEditing ? (
                    <Input
                      value={editedProfile.position}
                      onChange={(e) => handleInputChange('position', e.target.value)}
                    />
                  ) : (
                    <div className="p-3 bg-muted/50 rounded-lg">{profile.position}</div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Date of Joining</Label>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={editedProfile.dateOfJoining}
                      onChange={(e) => handleInputChange('dateOfJoining', e.target.value)}
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>{formatDate(profile.dateOfJoining)}</span>
                    </div>
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
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span>{profile.supervisor}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <Badge className={`${profile.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {profile.status.charAt(0).toUpperCase() + profile.status.slice(1)}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* ID Proof */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">ID Proof</h4>
                  <Badge variant="outline" className={profile.documents.idProof ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {profile.documents.idProof ? 'Uploaded' : 'Missing'}
                  </Badge>
                </div>
                
                {profile.documents.idProof ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{profile.documents.idProof.fileName}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Download className="w-3 h-3 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Uploaded on {formatDate(profile.documents.idProof.uploadDate)}
                    </p>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">No ID proof uploaded</p>
                    <Button variant="outline" size="sm" asChild>
                      <label htmlFor="id-proof-upload" className="cursor-pointer">
                        <Upload className="w-3 h-3 mr-1" />
                        Upload ID Proof
                      </label>
                    </Button>
                    <input
                      id="id-proof-upload"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload('idProof', e.target.files[0])}
                    />
                  </div>
                )}
              </div>

              {/* Driving License */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">Driving License</h4>
                  <Badge variant="outline" className={profile.documents.drivingLicense ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {profile.documents.drivingLicense ? 'Uploaded' : 'Missing'}
                  </Badge>
                </div>
                
                {profile.documents.drivingLicense ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{profile.documents.drivingLicense.fileName}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Download className="w-3 h-3 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">License Number</Label>
                        <p className="font-mono text-sm">{profile.documents.drivingLicense.licenseNumber}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Expiry Date</Label>
                        <p className="text-sm">{formatDate(profile.documents.drivingLicense.expiryDate)}</p>
                      </div>
                    </div>
                    
                    <p className="text-xs text-muted-foreground">
                      Uploaded on {formatDate(profile.documents.drivingLicense.uploadDate)}
                    </p>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">No driving license uploaded</p>
                    <Button variant="outline" size="sm" asChild>
                      <label htmlFor="license-upload" className="cursor-pointer">
                        <Upload className="w-3 h-3 mr-1" />
                        Upload License
                      </label>
                    </Button>
                    <input
                      id="license-upload"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload('drivingLicense', e.target.files[0])}
                    />
                  </div>
                )}
              </div>

              {/* Resume */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">Resume</h4>
                  <Badge variant="outline" className={profile.documents.resume ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {profile.documents.resume ? 'Uploaded' : 'Missing'}
                  </Badge>
                </div>
                
                {profile.documents.resume ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{profile.documents.resume.fileName}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Download className="w-3 h-3 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Uploaded on {formatDate(profile.documents.resume.uploadDate)}
                    </p>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">No resume uploaded</p>
                    <Button variant="outline" size="sm" asChild>
                      <label htmlFor="resume-upload" className="cursor-pointer">
                        <Upload className="w-3 h-3 mr-1" />
                        Upload Resume
                      </label>
                    </Button>
                    <input
                      id="resume-upload"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload('resume', e.target.files[0])}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Permissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <p className="text-sm text-muted-foreground">
                  Configure specific permissions for this lead labour. These permissions control what actions they can perform in the system.
                </p>
                
                <div className="grid gap-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Create Job</h4>
                        <p className="text-sm text-muted-foreground">Allow creating new jobs and work orders</p>
                      </div>
                      <Switch
                        checked={isEditing ? editedProfile.permissions.createJob : profile.permissions.createJob}
                        onCheckedChange={(checked:any) => isEditing && handlePermissionChange('createJob', checked)}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">View Inventory Price</h4>
                        <p className="text-sm text-muted-foreground">Access to inventory pricing information</p>
                      </div>
                      <Switch
                        checked={isEditing ? editedProfile.permissions.viewInventoryPrice : profile.permissions.viewInventoryPrice}
                        onCheckedChange={(checked:any) => isEditing && handlePermissionChange('viewInventoryPrice', checked)}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Invoice Sending</h4>
                        <p className="text-sm text-muted-foreground">Permission to send invoices to customers</p>
                      </div>
                      <Switch
                        checked={isEditing ? editedProfile.permissions.invoiceSending : profile.permissions.invoiceSending}
                        onCheckedChange={(checked:any) => isEditing && handlePermissionChange('invoiceSending', checked)}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Update Bluesheet</h4>
                        <p className="text-sm text-muted-foreground">Edit and update project bluesheets</p>
                      </div>
                      <Switch
                        checked={isEditing ? editedProfile.permissions.updateBluesheet : profile.permissions.updateBluesheet}
                        onCheckedChange={(checked:any) => isEditing && handlePermissionChange('updateBluesheet', checked)}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Manage Subordinates</h4>
                        <p className="text-sm text-muted-foreground">Supervise and manage team members</p>
                      </div>
                      <Switch
                        checked={isEditing ? editedProfile.permissions.manageSubordinates : profile.permissions.manageSubordinates}
                        onCheckedChange={(checked:any) => isEditing && handlePermissionChange('manageSubordinates', checked)}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Approve Timesheets</h4>
                        <p className="text-sm text-muted-foreground">Review and approve worker timesheets</p>
                      </div>
                      <Switch
                        checked={isEditing ? editedProfile.permissions.approveTimesheets : profile.permissions.approveTimesheets}
                        onCheckedChange={(checked:any) => isEditing && handlePermissionChange('approveTimesheets', checked)}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}