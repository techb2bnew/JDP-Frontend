import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { ArrowLeft, Download, Edit, FileText } from 'lucide-react'

interface SupplierDetailsPageProps {
  supplierId: string
  onBack: () => void
  supplierData?: any
}

export function SupplierDetailsPage({ supplierId, onBack, supplierData }: SupplierDetailsPageProps) {
  // Use provided supplier data from API
  const data = supplierData || {}
  const userData = data.users || {}

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

        {/* <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button className="bg-primary text-white hover:bg-[#0090e6] gap-2">
            <Edit className="h-4 w-4" />
            Edit Details
          </Button>
        </div> */}
      </div>

      {/* Main Content */}
      <Card className="bg-white shadow-md border-0">
        <CardContent className="p-8 space-y-8">
          {/* Business Details Section */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-base font-semibold text-[#2b2b2b]">Business details</h2>
              <Badge className="bg-[#E6F6FF] text-[#00A1FF] border-[#00A1FF]/20">
                {data.supplier_code || data.id || supplierId}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-16 gap-y-6">
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-[#2b2b2b]/70 mb-1">Full Name</p>
                  <p className="text-sm text-[#2b2b2b]">{userData.full_name || data.contact_person || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-[#2b2b2b]/70 mb-1">Phone number</p>
                  <p className="text-sm text-[#2b2b2b]">{userData.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-[#2b2b2b]/70 mb-1">Address</p>
                  <p className="text-sm text-[#2b2b2b]">{data.address || 'N/A'}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="text-sm text-[#2b2b2b]/70 mb-1">Email</p>
                  <p className="text-sm text-[#2b2b2b]">{userData.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-[#2b2b2b]/70 mb-1">Status</p>
                  <p className="text-sm text-[#2b2b2b]">{userData.status || 'N/A'}</p>
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
                  <p className="text-sm text-[#2b2b2b]">{data.company_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-[#2b2b2b]/70 mb-1">Contract Start</p>
                  <p className="text-sm text-[#2b2b2b]">{data.contract_start || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-[#2b2b2b]/70 mb-1">Contact Person</p>
                  <p className="text-sm text-[#2b2b2b]">{data.contact_person || 'N/A'}</p>
                </div>
                
                <div>
                  <p className="text-sm text-[#2b2b2b]/70 mb-1">Notes</p>
                  <p className="text-sm text-[#2b2b2b] max-w-[233px]">
                    {data.notes || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="text-sm text-[#2b2b2b]/70 mb-1">Role</p>
                  <p className="text-sm text-[#2b2b2b]">{userData.role || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-[#2b2b2b]/70 mb-1">Contract End</p>
                  <p className="text-sm text-[#2b2b2b]">{data.contract_end || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-[#2b2b2b]/70 mb-1">Supplier Code</p>
                  <p className="text-sm text-[#2b2b2b]">{data.supplier_code || 'N/A'}</p>
                </div> 
                
              </div>
            </div>
          </div>


        </CardContent>
      </Card>
    </div>
  )
}