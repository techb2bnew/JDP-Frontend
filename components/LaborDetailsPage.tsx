import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { ArrowLeft, Download, Edit, FileText } from 'lucide-react'

interface LaborDetailsPageProps {
  laborId: string
  onBack: () => void
}

export function LaborDetailsPage({ laborId, onBack }: LaborDetailsPageProps) {
  // Mock data for labor details
  const laborData = {
    id: '#2122',
    name: 'David Smith',
    email: 'david@gmail.com',
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
            <h1 className="text-xl font-semibold text-[#2b2b2b]">Labor Details</h1>
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
          {/* Personal Detail Section */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-base font-semibold text-[#2b2b2b]">Personal Detail</h2>
              <Badge className="bg-[#E6F6FF] text-[#00A1FF] border-[#00A1FF]/20">
                {laborData.id}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-16 gap-y-6">
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-[#2b2b2b]/70 mb-1">Full Name</p>
                  <p className="text-sm text-[#2b2b2b]">{laborData.name}</p>
                </div>
                <div>
                  <p className="text-sm text-[#2b2b2b]/70 mb-1">Phone number</p>
                  <p className="text-sm text-[#2b2b2b]">{laborData.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-[#2b2b2b]/70 mb-1">Address</p>
                  <p className="text-sm text-[#2b2b2b]">{laborData.address}</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-[#2b2b2b]/70 mb-1">Email</p>
                  <p className="text-sm text-[#2b2b2b]">{laborData.email}</p>
                </div>
                <div>
                  <p className="text-sm text-[#2b2b2b]/70 mb-1">DOB</p>
                  <p className="text-sm text-[#2b2b2b]">{laborData.dob}</p>
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
                <p className="text-sm text-[#2b2b2b]">{laborData.department}</p>
              </div>
              <div>
                <p className="text-sm text-[#2b2b2b]/70 mb-1">Position</p>
                <p className="text-sm text-[#2b2b2b]">{laborData.position}</p>
              </div>
              <div>
                <p className="text-sm text-[#2b2b2b]/70 mb-1">Date of Joining</p>
                <p className="text-sm text-[#2b2b2b]">{laborData.dateOfJoining}</p>
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
                  <p className="text-sm text-[#2b2b2b]">{laborData.documents.idProof}</p>
                </div>
                <div>
                  <p className="text-sm text-[#2b2b2b]/70 mb-1">Resume Id Proof</p>
                  <p className="text-sm text-[#00a1ff]">{laborData.documents.resumeIdProof}</p>
                </div>
                <div>
                  <p className="text-sm text-[#2b2b2b]/70 mb-1">Upload ID Proof</p>
                  <p className="text-sm text-[#00a1ff]">{laborData.documents.uploadIdProof}</p>
                </div>
              </div>

              <div className="flex justify-center md:col-span-2">
                <div className="w-[187px] h-[187px] rounded-[13px] bg-gray-100 flex items-center justify-center">
                  <FileText className="h-16 w-16 text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}