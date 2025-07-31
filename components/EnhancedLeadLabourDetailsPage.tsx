import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { ArrowLeft, Download, Edit, FileText, CheckCircle, XCircle } from 'lucide-react'

interface EnhancedLeadLabourDetailsPageProps {
  leadLabourId: string
  onBack: () => void
}

export function EnhancedLeadLabourDetailsPage({ leadLabourId, onBack }: EnhancedLeadLabourDetailsPageProps) {
  // Mock data for lead labour details
  const leadLabourData = {
    id: '#203',
    name: 'John Smith',
    email: 'john@gmail.com',
    phone: '+61 2222 021 203',
    dob: '20-10-1994',
    address: '47 W 13th St, New York, NY 10011, USA',
    department: 'abc',
    position: 'Lead Labor',
    dateOfJoining: '18-10-2024',
    documents: {
      idProof: 'Driving License',
      resumeIdProof: 'abc_lead.pdf',
      uploadIdProof: 'Driving License.pdf'
    },
    permissions: {
      createJob: true,
      addClient: true,
      orderInventoryPrice: false,
      invoicePrice: true,
      invoiceGenerate: false,
      closeJob: true,
      changeLaborTime: true
    }
  }

  const getPermissionIcon = (hasPermission: boolean) => {
    return hasPermission ? (
      <CheckCircle className="h-5 w-5 text-green-600" />
    ) : (
      <XCircle className="h-5 w-5 text-red-600" />
    )
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
            <h1 className="text-xl font-semibold text-[#2b2b2b]">Lead Labor Details</h1>
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
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="timesheet">Timesheet</TabsTrigger>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
          <TabsTrigger value="total-time">Total Time</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card className="bg-white shadow-sm border-0">
            <CardContent className="p-8 space-y-8">
              {/* Personal Detail Section */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <h2 className="text-base font-semibold text-[#2b2b2b]">Personal Detail</h2>
                  <Badge className="bg-[#E6F6FF] text-[#00A1FF] border-[#00A1FF]/20">
                    {leadLabourData.id}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-16 gap-y-6">
                  <div className="space-y-6">
                    <div>
                      <p className="text-sm text-[#2b2b2b]/70 mb-1">Full Name</p>
                      <p className="text-sm text-[#2b2b2b]">{leadLabourData.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#2b2b2b]/70 mb-1">Phone number</p>
                      <p className="text-sm text-[#2b2b2b]">{leadLabourData.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#2b2b2b]/70 mb-1">Address</p>
                      <p className="text-sm text-[#2b2b2b]">{leadLabourData.address}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <p className="text-sm text-[#2b2b2b]/70 mb-1">Email</p>
                      <p className="text-sm text-[#2b2b2b]">{leadLabourData.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#2b2b2b]/70 mb-1">DOB</p>
                      <p className="text-sm text-[#2b2b2b]">{leadLabourData.dob}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-[#d9d9d9]"></div>

              {/* Personal Detail Section 2 */}
              <div>
                <h2 className="text-base font-semibold text-[#2b2b2b] mb-6">Personal Detail</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6">
                  <div>
                    <p className="text-sm text-[#2b2b2b]/70 mb-1">Department</p>
                    <p className="text-sm text-[#2b2b2b]">{leadLabourData.department}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#2b2b2b]/70 mb-1">Position</p>
                    <p className="text-sm text-[#2b2b2b]">{leadLabourData.position}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#2b2b2b]/70 mb-1">Date of Joining</p>
                    <p className="text-sm text-[#2b2b2b]">{leadLabourData.dateOfJoining}</p>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-[#d9d9d9]"></div>

              {/* Document Upload Section */}
              <div>
                <h2 className="text-base font-semibold text-[#2b2b2b] mb-6">Document Upload</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-16 gap-y-6">
                  <div className="space-y-6">
                    <div>
                      <p className="text-sm text-[#2b2b2b]/70 mb-1">ID Proof</p>
                      <p className="text-sm text-[#2b2b2b]">{leadLabourData.documents.idProof}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#2b2b2b]/70 mb-1">Resume Id Proof</p>
                      <p className="text-sm text-[#00a1ff]">{leadLabourData.documents.resumeIdProof}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#2b2b2b]/70 mb-1">Upload ID Proof</p>
                      <p className="text-sm text-[#00a1ff]">{leadLabourData.documents.uploadIdProof}</p>
                    </div>
                  </div>

                  <div className="flex justify-center md:col-span-2">
                    <div className="w-[187px] h-[187px] rounded-[13px] bg-gray-100 flex items-center justify-center">
                      <FileText className="h-16 w-16 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-[#d9d9d9]"></div>

              {/* Permission Section */}
              <div>
                <h2 className="text-base font-semibold text-[#2b2b2b] mb-6">Permission</h2>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(leadLabourData.permissions).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      {getPermissionIcon(value)}
                      <span className="text-sm text-[#2b2b2b]">
                        {key === 'createJob' && 'Create Job'}
                        {key === 'addClient' && 'Add Client/Customer'}
                        {key === 'orderInventoryPrice' && 'Order Inventory Price'}
                        {key === 'invoicePrice' && 'Invoice Price'}
                        {key === 'invoiceGenerate' && 'Invoice Generate'}
                        {key === 'closeJob' && 'Close Job'}
                        {key === 'changeLaborTime' && 'Change Labor Time'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timesheet">
          <Card className="bg-white shadow-sm border-0">
            <CardHeader>
              <CardTitle>Timesheet Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Timesheet data will be displayed here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jobs">
          <Card className="bg-white shadow-sm border-0">
            <CardHeader>
              <CardTitle>Job Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Job assignment data will be displayed here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="total-time">
          <Card className="bg-white shadow-sm border-0">
            <CardHeader>
              <CardTitle>Total Time Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Total time summary will be displayed here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}