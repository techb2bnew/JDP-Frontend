'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { ArrowLeft, User, Mail, Phone, MapPin, Calendar, Star, Briefcase, CheckCircle, TrendingUp, DollarSign } from 'lucide-react'
import { globalApiCall } from '../utils/globalApiHandler'

interface ContractorDetails {
  id: number
  contractor_name: string
  company_name: string
  email: string
  phone: string
  address: string
  status: string
  created_at: string
  total_jobs?: number
  completed_jobs?: number
  ongoing_jobs?: number
  total_revenue?: number
}

interface ContractorDetailsPageProps {
  contractorId: string
  onBack: () => void
}

export function ContractorDetailsPage({ contractorId, onBack }: ContractorDetailsPageProps) {
  const router = useRouter()
  const [contractor, setContractor] = useState<ContractorDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL

  // Fetch contractor details
  const fetchContractorDetails = async () => {
    try {
      setIsLoading(true)
      
      const response = await globalApiCall(`${apiBaseUrl}/contractor/getContractorById/${contractorId}?include_jobs=true`, {
        method: 'GET'
      })

      const responseData = await response.json()
      console.log('Contractor Details API Response:', responseData)

      if (responseData.success && responseData.data) {
        const contractorData = responseData.data
        setContractor({
          id: contractorData.id,
          contractor_name: contractorData.contractor_name || 'N/A',
          company_name: contractorData.company_name || 'N/A',
          email: contractorData.email || 'N/A',
          phone: contractorData.phone || 'N/A',
          address: contractorData.address || 'N/A',
          status: contractorData.status || 'inactive',
          created_at: contractorData.created_at || new Date().toISOString(),
          total_jobs: contractorData.statistics.total_jobs || 0,
          completed_jobs: contractorData.completed_jobs || 0,
          ongoing_jobs: contractorData.ongoing_jobs || 0,
          total_revenue: contractorData.statistics.total_estimated_cost || 0
        })
      } else {
        console.error('Invalid contractor details API response:', responseData)
      }
    } catch (error) {
      console.error('Error fetching contractor details:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (contractorId) {
      fetchContractorDetails()
    }
  }, [contractorId])

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    } catch {
      return 'N/A'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="bg-white p-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (!contractor) {
    return (
      <div className="bg-white p-8 max-w-4xl mx-auto">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Contractor Not Found</h2>
          <p className="text-gray-600 mb-4">The contractor you're looking for doesn't exist.</p>
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Contractors
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button onClick={onBack} variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{contractor.contractor_name}</h1>
            <p className="text-lg text-gray-600">Contractor Details</p>
          </div>
        </div>
        <Badge 
          variant={contractor.status === 'active' ? 'default' : 'secondary'}
          className={`px-3 py-1 ${
            contractor.status === 'active' 
              ? 'bg-green-100 text-green-800 border-green-200' 
              : 'bg-gray-100 text-gray-800 border-gray-200'
          }`}
        >
          {contractor.status === 'active' ? 'Active' : 'Inactive'}
        </Badge>
      </div>

      {/* Main Information Card */}
      <Card className="mb-8">
        <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
              </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column - Contact Information */}
            <div>
             
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <div>
                    <span className="text-sm text-gray-600">Email</span>
                    <p className="text-gray-900">{contractor.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <div>
                    <span className="text-sm text-gray-600">Address</span>
                    <p className="text-gray-900">{contractor.address}</p>
                  </div>
                </div>
              
              </div>
            </div>

            {/* Right Column */}
            <div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <div>
                    <span className="text-sm text-gray-600">Phone</span>
                    <p className="text-gray-900">{contractor.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <span className="text-sm text-gray-600">Join Date</span>
                    <p className="text-gray-900">{formatDate(contractor.created_at)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Total Jobs */}
        <Card>
          <CardContent className="p-6 text-center">
            <Briefcase className="w-8 h-8 text-primary mx-auto mb-3" />
            <div className="text-2xl font-bold text-gray-900 mb-1">{contractor.total_jobs}</div>
            <div className="text-sm text-gray-600">Total Jobs</div>
          </CardContent>
        </Card>

        {/* Completed */}
        <Card>
          <CardContent className="p-6 text-center">
            <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-3" />
            <div className="text-2xl font-bold text-gray-900 mb-1">{contractor.completed_jobs}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </CardContent>
        </Card>

        {/* Ongoing */}
        <Card>
          <CardContent className="p-6 text-center">
            <TrendingUp className="w-8 h-8 text-blue-500 mx-auto mb-3" />
            <div className="text-2xl font-bold text-gray-900 mb-1">{contractor.ongoing_jobs}</div>
            <div className="text-sm text-gray-600">Ongoing</div>
          </CardContent>
        </Card>

        {/* Total Revenue */}
        <Card>
          <CardContent className="p-6 text-center">
            <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-3" />
            <div className="text-2xl font-bold text-gray-900 mb-1">{formatCurrency(contractor.total_revenue || 0)}</div>
            <div className="text-sm text-gray-600">Total Revenue</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
