import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { ArrowLeft, Download, Edit, FileText } from 'lucide-react'
import { toast } from 'sonner'

interface LaborDetailsPageProps {
  laborId: string
  onBack: () => void
}

interface LaborDetailsData {
  id: string
  labor_code: string
  full_name: string
  email: string
  phone: string
  dob: string
  address: string
  date_of_joining: string
  status: string
  trade: string
  experience: string
  hourly_rate: number
  supervisor: string
  availability: string
  certifications: string[]
  skills: string[]
  notes: string
  role: string
}

export function LaborDetailsPage({ laborId, onBack }: LaborDetailsPageProps) {
  const [laborData, setLaborData] = useState<LaborDetailsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL

  const fetchLaborDetails = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('jdp_auth') ? JSON.parse(localStorage.getItem('jdp_auth')!).token : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${apiBaseUrl}/labor/getLaborById/${laborId}`, {
        method: 'GET',
        headers
      });

      if (response.ok) {
        const responseData = await response.json();
        
        if (responseData.success && responseData.data) {
          const item = responseData.data;
          
          // Map API response to labor details structure
          const mappedData: LaborDetailsData = {
            id: item.id?.toString() || laborId,
            labor_code: item.labor_code || '',
            full_name: item.users?.full_name || '',
            email: item.users?.email || '',
            phone: item.users?.phone || '',
            dob: item.dob || '',
            address: item.address || '',
            date_of_joining: item.date_of_joining || '',
            status: item.users?.status || 'active',
            trade: item.trade || '',
            experience: item.experience || '',
            hourly_rate: item.hourly_rate || 0,
            supervisor: item.supervisor?.full_name || '',
            availability: item.availability || 'Full-time',
            certifications: Array.isArray(item.certifications) ? item.certifications : 
                           item.certifications ? [item.certifications] : [],
            skills: Array.isArray(item.skills) ? item.skills : 
                   item.skills ? [item.skills] : [],
            notes: item.notes || '',
            role: item.users?.role || 'Labor'
          };

          setLaborData(mappedData);
        } else {
          console.error('Invalid labor details response structure:', responseData);
          toast.error('Failed to load labor details');
        }
      } else {
        console.error('Failed to fetch labor details:', response.status, response.statusText);
        toast.error('Failed to load labor details');
      }
    } catch (error) {
      console.error('Error fetching labor details:', error);
      toast.error('Failed to load labor details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (laborId) {
      fetchLaborDetails();
    }
  }, [laborId]);

  if (isLoading) {
    return (
      <div className="space-y-6">
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
        </div>
        
        <Card className="bg-white shadow-md border-0">
          <CardContent className="p-8">
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="text-gray-600">Loading labor details...</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!laborData) {
    return (
      <div className="space-y-6">
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
        </div>
        
        <Card className="bg-white shadow-md border-0">
          <CardContent className="p-8">
            <div className="flex items-center justify-center py-12">
              <div className="text-center text-gray-500">
                <div className="text-lg font-medium mb-2">No data available</div>
                <div className="text-sm">Failed to load labor details</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
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
        
        
      </div>

      {/* Main Content */}
      <Card className="bg-white shadow-md border-0">
        <CardContent className="p-8 space-y-8">
          {/* Personal Detail Section */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-base font-semibold text-[#2b2b2b]">Personal Detail</h2>
              <Badge className="bg-[#E6F6FF] text-[#00A1FF] border-[#00A1FF]/20">
                {laborData.labor_code || `#${laborData.id}`}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-16 gap-y-6">
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-[#2b2b2b]/70 mb-1">Full Name</p>
                  <p className="text-sm text-[#2b2b2b]">{laborData.full_name}</p>
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
                <div>
                  <p className="text-sm text-[#2b2b2b]/70 mb-1">Status</p>
                  <Badge className={`${laborData.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {laborData.status}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-[#d9d9d9]"></div>

          {/* Work Detail Section */}
          <div>
            <h2 className="text-base font-semibold text-[#2b2b2b] mb-6">Work Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6">
              <div>
                <p className="text-sm text-[#2b2b2b]/70 mb-1">Role</p>
                <p className="text-sm text-[#2b2b2b]">{laborData.role}</p>
              </div>
              <div>
                <p className="text-sm text-[#2b2b2b]/70 mb-1">Trade</p>
                <p className="text-sm text-[#2b2b2b]">{laborData.trade}</p>
              </div>
              <div>
                <p className="text-sm text-[#2b2b2b]/70 mb-1">Experience</p>
                <p className="text-sm text-[#2b2b2b]">{laborData.experience}</p>
              </div>
              <div>
                <p className="text-sm text-[#2b2b2b]/70 mb-1">Hourly Rate</p>
                <p className="text-sm text-[#2b2b2b]">${laborData.hourly_rate}</p>
              </div>
              <div>
                <p className="text-sm text-[#2b2b2b]/70 mb-1">Supervisor</p>
                <p className="text-sm text-[#2b2b2b]">{laborData.supervisor}</p>
              </div>
              <div>
                <p className="text-sm text-[#2b2b2b]/70 mb-1">Availability</p>
                <p className="text-sm text-[#2b2b2b]">{laborData.availability}</p>
              </div>
              <div>
                <p className="text-sm text-[#2b2b2b]/70 mb-1">Date of Joining</p>
                <p className="text-sm text-[#2b2b2b]">{laborData.date_of_joining}</p>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-[#d9d9d9]"></div>

          {/* Skills & Certifications Section */}
          <div>
            <h2 className="text-base font-semibold text-[#2b2b2b] mb-6">Skills & Certifications</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6">
              <div>
                <p className="text-sm text-[#2b2b2b]/70 mb-3">Certifications</p>
                <div className="space-y-2">
                  {laborData.certifications.length > 0 ? (
                    laborData.certifications.map((cert, index) => (
                      <Badge key={index} className="bg-blue-100 text-blue-800 mr-2 mb-2">
                        {cert}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No certifications listed</p>
                  )}
                </div>
              </div>
              
              <div>
                <p className="text-sm text-[#2b2b2b]/70 mb-3">Skills</p>
                <div className="space-y-2">
                  {laborData.skills.length > 0 ? (
                    laborData.skills.map((skill, index) => (
                      <Badge key={index} className="bg-green-100 text-green-800 mr-2 mb-2">
                        {skill}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No skills listed</p>
                  )}
                </div>
              </div>
            </div>
            
            {laborData.notes && (
              <div className="mt-6">
                <p className="text-sm text-[#2b2b2b]/70 mb-2">Notes</p>
                <p className="text-sm text-[#2b2b2b] bg-gray-50 p-3 rounded-md">
                  {laborData.notes}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}