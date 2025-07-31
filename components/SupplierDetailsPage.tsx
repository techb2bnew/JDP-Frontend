import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { ArrowLeft, Download, Edit, FileText } from 'lucide-react'

interface SupplierDetailsPageProps {
  supplierId: string
  onBack: () => void
}

export function SupplierDetailsPage({ supplierId, onBack }: SupplierDetailsPageProps) {
  // Mock data for supplier details
  const supplierData = {
    id: '#2122',
    companyName: 'ElectroTech Supplies Pty Ltd',
    contactPerson: 'David Smith',
    email: 'david@electrotech.com.au',
    phone: '+61 2222 021 203',
    gender: 'Male',
    address: '47 W 13th St, New York, NY 10011, USA',
    businessType: 'N/A',
    position: 'Supplier',
    gstNumber: 'DE303972433',
    website: 'www.abc.com',
    businessContact: '+61 2222 021 204',
    documents: {
      idProof: 'Driving License',
      otherDetails: 'Over the years JDP quickly realized that their success is based on providing'
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
            <h1 className="text-xl font-semibold text-[#2b2b2b]">Supplier Details</h1>
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
          {/* Business Details Section */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-base font-semibold text-[#2b2b2b]">Business details</h2>
              <Badge className="bg-[#E6F6FF] text-[#00A1FF] border-[#00A1FF]/20">
                {supplierData.id}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-16 gap-y-6">
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-[#2b2b2b]/70 mb-1">Full Name</p>
                  <p className="text-sm text-[#2b2b2b]">{supplierData.contactPerson}</p>
                </div>
                <div>
                  <p className="text-sm text-[#2b2b2b]/70 mb-1">Phone number</p>
                  <p className="text-sm text-[#2b2b2b]">{supplierData.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-[#2b2b2b]/70 mb-1">Address</p>
                  <p className="text-sm text-[#2b2b2b]">{supplierData.address}</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-[#2b2b2b]/70 mb-1">Email</p>
                  <p className="text-sm text-[#2b2b2b]">{supplierData.email}</p>
                </div>
                <div>
                  <p className="text-sm text-[#2b2b2b]/70 mb-1">Gender</p>
                  <p className="text-sm text-[#2b2b2b]">{supplierData.gender}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-[#d9d9d9]"></div>

          {/* More Details Section */}
          <div>
            <h2 className="text-base font-semibold text-[#2b2b2b] mb-6">More Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-16 gap-y-6">
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-[#2b2b2b]/70 mb-1">Company/Business</p>
                  <p className="text-sm text-[#2b2b2b]">{supplierData.businessType}</p>
                </div>
                <div>
                  <p className="text-sm text-[#2b2b2b]/70 mb-1">GST/VAT Number</p>
                  <p className="text-sm text-[#2b2b2b]">{supplierData.gstNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-[#2b2b2b]/70 mb-1">Business Contact Number</p>
                  <p className="text-sm text-[#2b2b2b]">{supplierData.businessContact}</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-[#2b2b2b]/70 mb-1">Position</p>
                  <p className="text-sm text-[#2b2b2b]">{supplierData.position}</p>
                </div>
                <div>
                  <p className="text-sm text-[#2b2b2b]/70 mb-1">Website</p>
                  <p className="text-sm text-[#2b2b2b]">{supplierData.website}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-[#d9d9d9]"></div>

          {/* Document Upload Section */}
          <div>
            <h2 className="text-base font-semibold text-[#2b2b2b] mb-6">Document Upload</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-16 gap-y-6">
              <div>
                <p className="text-sm text-[#2b2b2b]/70 mb-1">ID Proof</p>
                <p className="text-sm text-[#2b2b2b]">{supplierData.documents.idProof}</p>
              </div>
              
              <div>
                <p className="text-sm text-[#2b2b2b]/70 mb-1">Other Detail</p>
                <p className="text-sm text-[#2b2b2b] max-w-[233px]">
                  {supplierData.documents.otherDetails}
                </p>
              </div>

              <div className="flex justify-center">
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