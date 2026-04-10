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
import { Textarea } from '../ui/textarea'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building, 
  Edit, 
  Save, 
  X,
  Plus,
  Trash2,
  FileText,
  Download,
  Globe,
  CreditCard,
  Calendar
} from 'lucide-react'
import { SupplierProfile } from '../../types/profiles'

// Mock data
const supplierData: SupplierProfile = {
  id: 'SUP-001',
  // Basic Info
  fullName: 'Robert Chen',
  email: 'robert.chen@supplycorp.com',
  phoneNumber: '+1 (555) 789-0123',
  gender: 'male',
  address: '123 Supplier Boulevard, Suite 200',
  city: 'Los Angeles',
  state: 'CA',
  zipCode: '90210',
  status: 'active',
  
  // Business Details
  companyName: 'Premium Building Supply Corp',
  gstVatNo: 'GST-123456789',
  website: 'https://premiumbuildingsupply.com',
  businessContactNumber: '+1 (555) 789-0100',
  businessEmail: 'orders@premiumbuildingsupply.com',
  businessAddress: '123 Supplier Boulevard, Los Angeles, CA 90210',
  paymentTerms: 'Net 30 days',
  creditLimit: 50000,
  
  // Documents
  documents: {
    idProof: {
      fileName: 'robert_id_proof.pdf',
      uploadDate: '2024-01-15',
      fileUrl: '/documents/robert_id.pdf'
    },
    drivingLicense: {
      fileName: 'robert_license.pdf',
      uploadDate: '2024-01-15',
      fileUrl: '/documents/robert_license.pdf'
    },
    businessLicense: {
      fileName: 'business_license.pdf',
      uploadDate: '2024-01-15',
      fileUrl: '/documents/business_license.pdf'
    },
    gstCertificate: {
      fileName: 'gst_certificate.pdf',
      uploadDate: '2024-01-15',
      fileUrl: '/documents/gst_cert.pdf'
    }
  },
  
  // Branch Locations
  branches: [
    {
      id: 'BR-001',
      branchName: 'Downtown LA Branch',
      address: '456 Commerce Street',
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90015',
      phone: '+1 (555) 789-0101',
      contactPerson: 'Maria Garcia',
      email: 'maria@premiumbuildingsupply.com'
    },
    {
      id: 'BR-002',
      branchName: 'Warehouse District',
      address: '789 Industrial Way',
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90021',
      phone: '+1 (555) 789-0102',
      contactPerson: 'James Wilson',
      email: 'james@premiumbuildingsupply.com'
    }
  ],
  
  // Other Details
  notes: 'Preferred supplier for electrical components. Excellent quality and on-time delivery. Special pricing available for bulk orders.',
  contractStartDate: '2024-01-15',
  contractEndDate: '2026-01-14',
  profilePicture: ''
}

export function SupplierDetailsPage() {
  const [profile, setProfile] = useState<SupplierProfile>(supplierData)
  const [isEditing, setIsEditing] = useState(false)
  const [editedProfile, setEditedProfile] = useState<SupplierProfile>(profile)
  const [showAddBranchForm, setShowAddBranchForm] = useState(false)
  const [newBranch, setNewBranch] = useState({
    branchName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
    contactPerson: '',
    email: ''
  })

  const handleEdit = () => {
    setEditedProfile(profile)
    setIsEditing(true)
  }

  const handleCancel = () => {
    setEditedProfile(profile)
    setIsEditing(false)
    setShowAddBranchForm(false)
  }

  const handleSave = () => {
    setProfile(editedProfile)
    setIsEditing(false)
    setShowAddBranchForm(false)
    console.log('Saving supplier profile:', editedProfile)
  }

  const handleInputChange = (field: keyof SupplierProfile, value: any) => {
    setEditedProfile(prev => ({ ...prev, [field]: value }))
  }

  const handleAddBranch = () => {
    const branch = {
      id: `BR-${Date.now()}`,
      ...newBranch
    }
    setEditedProfile(prev => ({
      ...prev,
      branches: [...prev.branches, branch]
    }))
    setNewBranch({
      branchName: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      phone: '',
      contactPerson: '',
      email: ''
    })
    setShowAddBranchForm(false)
  }

  const handleRemoveBranch = (branchId: string) => {
    setEditedProfile(prev => ({
      ...prev,
      branches: prev.branches.filter(branch => branch.id !== branchId)
    }))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Supplier Profile</h1>
          <p className="text-muted-foreground">Comprehensive supplier information and business details</p>
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

      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="branches">Branches</TabsTrigger>
          <TabsTrigger value="contract">Contract</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
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
                    <p className="text-muted-foreground">{profile.companyName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={`${profile.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {profile.status.charAt(0).toUpperCase() + profile.status.slice(1)}
                      </Badge>
                      <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                        Supplier
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <p>ID: {profile.id}</p>
                  <p>Credit Limit: {formatCurrency(profile.creditLimit || 0)}</p>
                  <p>Branches: {profile.branches.length}</p>
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
                  <Label>Phone Number</Label>
                  {isEditing ? (
                    <Input
                      value={editedProfile.phoneNumber}
                      onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{profile.phoneNumber}</span>
                    </div>
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

        <TabsContent value="business" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5 text-primary" />
                Business Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  {isEditing ? (
                    <Input
                      value={editedProfile.companyName}
                      onChange={(e) => handleInputChange('companyName', e.target.value)}
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <Building className="w-4 h-4 text-muted-foreground" />
                      <span>{profile.companyName}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>GST/VAT Number</Label>
                  {isEditing ? (
                    <Input
                      value={editedProfile.gstVatNo}
                      onChange={(e) => handleInputChange('gstVatNo', e.target.value)}
                    />
                  ) : (
                    <div className="p-3 bg-muted/50 rounded-lg font-mono">{profile.gstVatNo}</div>
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
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      <span>{profile.website || 'N/A'}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Business Contact Number</Label>
                  {isEditing ? (
                    <Input
                      value={editedProfile.businessContactNumber}
                      onChange={(e) => handleInputChange('businessContactNumber', e.target.value)}
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{profile.businessContactNumber}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Business Email</Label>
                  {isEditing ? (
                    <Input
                      type="email"
                      value={editedProfile.businessEmail || ''}
                      onChange={(e) => handleInputChange('businessEmail', e.target.value)}
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span>{profile.businessEmail || 'N/A'}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Payment Terms</Label>
                  {isEditing ? (
                    <Input
                      value={editedProfile.paymentTerms || ''}
                      onChange={(e) => handleInputChange('paymentTerms', e.target.value)}
                    />
                  ) : (
                    <div className="p-3 bg-muted/50 rounded-lg">{profile.paymentTerms || 'N/A'}</div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Credit Limit</Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editedProfile.creditLimit || ''}
                      onChange={(e) => handleInputChange('creditLimit', parseInt(e.target.value) || 0)}
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <CreditCard className="w-4 h-4 text-muted-foreground" />
                      <span>{formatCurrency(profile.creditLimit || 0)}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Business Address</Label>
                  {isEditing ? (
                    <Textarea
                      value={editedProfile.businessAddress || ''}
                      onChange={(e) => handleInputChange('businessAddress', e.target.value)}
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>{profile.businessAddress || 'N/A'}</span>
                    </div>
                  )}
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
              {Object.entries(profile.documents).map(([docType, document]) => (
                <div key={docType} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium capitalize">{docType.replace(/([A-Z])/g, ' $1').trim()}</h4>
                    <Badge variant="outline" className={document ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {document ? 'Uploaded' : 'Missing'}
                    </Badge>
                  </div>
                  
                  {document ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{document.fileName}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Download className="w-3 h-3 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Uploaded on {formatDate(document.uploadDate)}
                      </p>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground mb-2">No {docType} uploaded</p>
                      <Button variant="outline" size="sm" asChild>
                        <label htmlFor={`${docType}-upload`} className="cursor-pointer">
                          <Download className="w-3 h-3 mr-1" />
                          Upload {docType}
                        </label>
                      </Button>
                      <input
                        id={`${docType}-upload`}
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                      />
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branches" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5 text-primary" />
                  Branch Locations
                </CardTitle>
                {isEditing && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowAddBranchForm(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Branch
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {showAddBranchForm && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader>
                    <CardTitle className="text-base">Add New Branch</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Branch Name</Label>
                        <Input
                          value={newBranch.branchName}
                          onChange={(e) => setNewBranch(prev => ({ ...prev, branchName: e.target.value }))}
                          placeholder="Enter branch name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Contact Person</Label>
                        <Input
                          value={newBranch.contactPerson}
                          onChange={(e) => setNewBranch(prev => ({ ...prev, contactPerson: e.target.value }))}
                          placeholder="Enter contact person"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Address</Label>
                        <Input
                          value={newBranch.address}
                          onChange={(e) => setNewBranch(prev => ({ ...prev, address: e.target.value }))}
                          placeholder="Enter address"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>City</Label>
                        <Input
                          value={newBranch.city}
                          onChange={(e) => setNewBranch(prev => ({ ...prev, city: e.target.value }))}
                          placeholder="Enter city"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>State</Label>
                        <Input
                          value={newBranch.state}
                          onChange={(e) => setNewBranch(prev => ({ ...prev, state: e.target.value }))}
                          placeholder="Enter state"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>ZIP Code</Label>
                        <Input
                          value={newBranch.zipCode}
                          onChange={(e) => setNewBranch(prev => ({ ...prev, zipCode: e.target.value }))}
                          placeholder="Enter ZIP code"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Phone</Label>
                        <Input
                          value={newBranch.phone}
                          onChange={(e) => setNewBranch(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="Enter phone number"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input
                          type="email"
                          value={newBranch.email}
                          onChange={(e) => setNewBranch(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="Enter email"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleAddBranch} className="bg-primary text-primary-foreground hover:bg-primary/90">
                        Add Branch
                      </Button>
                      <Button variant="outline" onClick={() => setShowAddBranchForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {editedProfile.branches.map((branch, index) => (
                <Card key={branch.id} className="border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium">{branch.branchName}</h4>
                      {isEditing && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveBranch(branch.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Address:</p>
                        <p>{branch.address}, {branch.city}, {branch.state} {branch.zipCode}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Contact Person:</p>
                        <p>{branch.contactPerson}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Phone:</p>
                        <p>{branch.phone}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Email:</p>
                        <p>{branch.email || 'N/A'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {editedProfile.branches.length === 0 && (
                <div className="text-center py-8">
                  <Building className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium text-muted-foreground mb-2">No Branches Added</h3>
                  <p className="text-sm text-muted-foreground">Add branch locations to manage multiple supplier sites</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contract" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Contract Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Contract Start Date</Label>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={editedProfile.contractStartDate || ''}
                      onChange={(e) => handleInputChange('contractStartDate', e.target.value)}
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>{profile.contractStartDate ? formatDate(profile.contractStartDate) : 'N/A'}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Contract End Date</Label>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={editedProfile.contractEndDate || ''}
                      onChange={(e) => handleInputChange('contractEndDate', e.target.value)}
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>{profile.contractEndDate ? formatDate(profile.contractEndDate) : 'N/A'}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Notes</Label>
                  {isEditing ? (
                    <Textarea
                      value={editedProfile.notes || ''}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      rows={4}
                      placeholder="Enter any additional notes about this supplier"
                    />
                  ) : (
                    <div className="p-3 bg-muted/50 rounded-lg min-h-[100px]">
                      {profile.notes || 'No additional notes'}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}