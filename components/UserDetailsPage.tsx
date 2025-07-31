import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { ArrowLeft, Download, Edit, FileText, Shield, CheckCircle, XCircle } from 'lucide-react'

interface UserDetailsPageProps {
  userId: string
  onBack: () => void
}

export function UserDetailsPage({ userId, onBack }: UserDetailsPageProps) {
  // Mock data for user details
  const userData = {
    id: '#2122',
    name: 'Sarah Mitchell',
    email: 'sarah.mitchell@jdp.com',
    phone: '+61 2222 021 207',
    username: 'sarah.mitchell',
    role: 'Admin',
    status: 'Active',
    lastLogin: '2025-01-22 10:30 AM',
    accountCreated: '15-01-2024',
    department: 'IT Administration',
    permissions: {
      userManagement: true,
      systemSettings: true,
      dataExport: true,
      reporting: false,
      billing: true,
      auditLogs: true
    },
    securitySettings: {
      twoFactorAuth: true,
      passwordLastChanged: '10-01-2025',
      failedLoginAttempts: 0,
      accountLocked: false
    }
  }

  const getPermissionIcon = (hasPermission: boolean) => {
    return hasPermission ? (
      <CheckCircle className="h-5 w-5 text-green-600" />
    ) : (
      <XCircle className="h-5 w-5 text-red-600" />
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return (
          <Badge className="bg-green-50 text-green-600 border-green-200 hover:bg-green-50">
            Active
          </Badge>
        )
      case 'inactive':
        return (
          <Badge className="bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-50">
            Inactive
          </Badge>
        )
      case 'suspended':
        return (
          <Badge className="bg-red-50 text-red-600 border-red-200 hover:bg-red-50">
            Suspended
          </Badge>
        )
      default:
        return (
          <Badge className="bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-50">
            {status}
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-[#2b2b2b]">User Details</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button className="bg-[#00A1FF] hover:bg-[#0090e6] gap-2">
            <Edit className="h-4 w-4" />
            Edit Details
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Card className="bg-white shadow-sm border-0">
        <CardContent className="p-8 space-y-8">
          {/* Personal Details Section */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-base font-semibold text-[#2b2b2b]">Personal Details</h2>
              <Badge className="bg-[#E6F6FF] text-[#00A1FF] border-[#00A1FF]/20">
                {userData.id}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-16 gap-y-6">
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-[#2b2b2b]/70 mb-1">Full Name</p>
                  <p className="text-sm text-[#2b2b2b]">{userData.name}</p>
                </div>
                <div>
                  <p className="text-sm text-[#2b2b2b]/70 mb-1">Phone Number</p>
                  <p className="text-sm text-[#2b2b2b]">{userData.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-[#2b2b2b]/70 mb-1">Department</p>
                  <p className="text-sm text-[#2b2b2b]">{userData.department}</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-[#2b2b2b]/70 mb-1">Email</p>
                  <p className="text-sm text-[#2b2b2b]">{userData.email}</p>
                </div>
                <div>
                  <p className="text-sm text-[#2b2b2b]/70 mb-1">Username</p>
                  <p className="text-sm text-[#2b2b2b]">{userData.username}</p>
                </div>
                <div>
                  <p className="text-sm text-[#2b2b2b]/70 mb-1">Role</p>
                  <p className="text-sm text-[#2b2b2b]">{userData.role}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="text-sm text-[#2b2b2b]/70 mb-1">Status</p>
                  {getStatusBadge(userData.status)}
                </div>
                <div>
                  <p className="text-sm text-[#2b2b2b]/70 mb-1">Account Created</p>
                  <p className="text-sm text-[#2b2b2b]">{userData.accountCreated}</p>
                </div>
                <div>
                  <p className="text-sm text-[#2b2b2b]/70 mb-1">Last Login</p>
                  <p className="text-sm text-[#2b2b2b]">{userData.lastLogin}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-[#d9d9d9]"></div>

          {/* Permissions Section */}
          <div>
            <h2 className="text-base font-semibold text-[#2b2b2b] mb-6">Permissions</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(userData.permissions).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  {getPermissionIcon(value)}
                  <span className="text-sm text-[#2b2b2b]">
                    {key === 'userManagement' && 'User Management'}
                    {key === 'systemSettings' && 'System Settings'}
                    {key === 'dataExport' && 'Data Export'}
                    {key === 'reporting' && 'Reporting'}
                    {key === 'billing' && 'Billing'}
                    {key === 'auditLogs' && 'Audit Logs'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-[#d9d9d9]"></div>

          {/* Security Settings Section */}
          <div>
            <h2 className="text-base font-semibold text-[#2b2b2b] mb-6">Security Settings</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6">
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-[#2b2b2b]/70 mb-1">Two-Factor Authentication</p>
                  <div className="flex items-center gap-2">
                    {userData.securitySettings.twoFactorAuth ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-600">Enabled</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span className="text-sm text-red-600">Disabled</span>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-[#2b2b2b]/70 mb-1">Password Last Changed</p>
                  <p className="text-sm text-[#2b2b2b]">{userData.securitySettings.passwordLastChanged}</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-[#2b2b2b]/70 mb-1">Failed Login Attempts</p>
                  <p className="text-sm text-[#2b2b2b]">{userData.securitySettings.failedLoginAttempts}</p>
                </div>
                <div>
                  <p className="text-sm text-[#2b2b2b]/70 mb-1">Account Locked</p>
                  <div className="flex items-center gap-2">
                    {userData.securitySettings.accountLocked ? (
                      <>
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span className="text-sm text-red-600">Yes</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-600">No</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}