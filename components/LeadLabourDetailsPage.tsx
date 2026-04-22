import { useMemo, useState, useEffect, useCallback } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { ArrowLeft, Briefcase, Clock, CheckCircle, User, Mail, Phone, Calendar, MapPin, FileText, DollarSign } from 'lucide-react'
import { toast } from 'sonner'

type LeadLabourDocument = {
  label: string
  fileName: string
  url?: string
}

type LeadLabourJobHistory = {
  jobTitle: string
  client: string
  location: string
  phone?: string
  startDate: string
  endDate: string
  status: string
  hoursWorked: number
}

type LeadLabourDetails = {
  id: string
  laborCode: string
  fullName: string
  role: string
  status: string
  email: string
  phone: string
  address: string
  dateOfBirth: string
  dateOfJoining: string
  availability: string
  hourlyRate: number
  totalJobs: number
  activeJobs: number
  completedJobs: number
  documents: LeadLabourDocument[]
  jobHistory: LeadLabourJobHistory[]
  about?: string
  assignedJobs?: {
    jobs: LeadLabourJobHistory[]
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

interface LeadLabourDetailsPageProps {
  leadLabourId: string | number
  onBack: () => void
  leadLabourData?: any
  isLoading?: boolean
}

const fallbackDocuments: LeadLabourDocument[] = [
  { label: 'ID Proof', fileName: 'Driving License.pdf' },
  { label: 'Resume', fileName: 'abc_lead.pdf' }
]

const fallbackJobHistory: LeadLabourJobHistory[] = [
  {
    jobTitle: 'Office Complex Electrical Installation',
    client: 'ABC Corporation',
    location: 'Downtown Sydney',
    phone: '9876543210',
    startDate: '2025-01-15',
    endDate: '2025-02-15',
    status: 'Active',
    hoursWorked: 120
  },
  {
    jobTitle: 'Residential Solar System',
    client: 'Smith Family',
    location: 'Suburban Melbourne',
    phone: '9876543210',
    startDate: '2025-01-10',
    endDate: '2025-01-25',
    status: 'Completed',
    hoursWorked: 64
  },
  {
    jobTitle: 'Industrial Equipment Upgrade',
    client: 'Manufacturing Inc',
    location: 'Industrial Park Brisbane',
    phone: '9876543210',
    startDate: '2025-02-01',
    endDate: '2025-02-28',
    status: 'Pending',
    hoursWorked: 0
  }
]

const defaultDetails: LeadLabourDetails = {
  id: 'LL-2025-001',
  laborCode: '#2122',
  fullName: 'David Smith',
  role: 'Lead Labour',
  status: 'Active',
  email: 'david@gmail.com',
  phone: '+61 2222 021 203',
  address: '47 W 13th St, New York, NY 10011, USA',
  dateOfBirth: '1994-10-20',
  dateOfJoining: '2024-10-18',
  availability: 'Available',
  hourlyRate: 65,
  totalJobs: 3,
  activeJobs: 2,
  completedJobs: 1,
  documents: fallbackDocuments,
  jobHistory: fallbackJobHistory,
  about: 'Highly skilled lead labor with expertise in electrical installations and team supervision.'
}

const formatDate = (dateString?: string) => {
  if (!dateString) return 'Not provided'
  try {
    const date = new Date(dateString)
    if (Number.isNaN(date.getTime())) return dateString
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch {
    return dateString
  }
}

const formatHours = (value?: number) => `${value ?? 0}h`

const formatCurrency = (value?: number) => {
  if (!value) return '$0'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0
  }).format(value)
}

const renderStatusBadge = (status: string) => {
  const normalized = status?.toLowerCase()
  switch (normalized) {
    case 'active':
      return <Badge className="bg-green-50 text-green-600 border-green-200">Active</Badge>
    case 'inactive':
      return <Badge className="bg-red-50 text-red-600 border-red-200">Inactive</Badge>
    case 'on-leave':
      return <Badge className="bg-yellow-50 text-yellow-600 border-yellow-200">On Leave</Badge>
    default:
      return <Badge className="bg-blue-50 text-blue-600 border-blue-200">{status}</Badge>
  }
}

const renderJobStatusBadge = (status: string) => {
  const normalized = status?.toLowerCase()
  if (normalized.includes('active')) {
    return <Badge className="bg-green-50 text-green-600 border-green-200">{status}</Badge>
  }
  if (normalized.includes('complete')) {
    return <Badge className="bg-blue-50 text-blue-600 border-blue-200">{status}</Badge>
  }
  if (normalized.includes('pending')) {
    return <Badge className="bg-yellow-50 text-yellow-600 border-yellow-200">{status}</Badge>
  }
  if (normalized.includes('cancel')) {
    return <Badge className="bg-red-50 text-red-600 border-red-200">{status}</Badge>
  }
  return <Badge className="bg-gray-50 text-gray-600 border-gray-200">{status || 'N/A'}</Badge>
}

const transformAssignedJob = (job: any): LeadLabourJobHistory => {
  const parseHours = (value: any): number => {
    if (typeof value === 'number') return value
    if (typeof value === 'string') {
      const parts = value.split(':').map(Number)
      if (parts.length === 3 && parts.every((n) => !Number.isNaN(n))) {
        const [hours, minutes, seconds] = parts
        return hours + minutes / 60 + seconds / 3600
      }
      const numeric = Number(value)
      return Number.isNaN(numeric) ? 0 : numeric
    }
    return 0
  }

  const clientName = job.customer?.company_name || job.contractor?.contractor_name  || 'N/A'
  const location = job.address || job.location || job.job_location || 'N/A'
  const phone = job.customer?.phone || job.phone || job.contact_phone || 'N/A'

  return {
    jobTitle: job.job_title || job.title || 'N/A',
    client: clientName,
    location,
    phone,
    startDate: job.start_date || job.assigned_at || job.created_at || '',
    endDate: job.end_date || job.completed_at || job.due_date || '',
    status: job.status || 'N/A',
    hoursWorked: parseHours(job.total_work_time || job.hours_worked || 0)
  }
}

const buildDocuments = (data: any, fallbackSource?: any): LeadLabourDocument[] => {
  const source = data || fallbackSource
  if (!source) return fallbackDocuments

  if (Array.isArray(source)) {
    return source.map((doc: any) => ({
      label: doc.label || doc.type || 'Document',
      fileName: doc.file_name || doc.name || 'Download',
      url: doc.url || doc.file_url || doc.link
    }))
  }

  const items: LeadLabourDocument[] = []
  if (source.idProof || source.id_proof || source.idProofUrl || source.id_proof_url) {
    const value = source.idProof || source.id_proof || { name: 'ID Proof', url: source.idProofUrl || source.id_proof_url }
    items.push({ label: 'ID Proof', fileName: value.name || value.file_name || 'ID Proof', url: value.url || source.id_proof_url })
  }
  if (source.photo || source.photoUrl || source.photo_url) {
    const value = source.photo || { name: 'Photo', url: source.photoUrl || source.photo_url }
    items.push({ label: 'Photo', fileName: value.name || value.file_name || 'Photo', url: value.url || source.photo_url })
  }
  if (source.resume || source.resumeUrl || source.resume_url) {
    const value = source.resume || { name: 'Resume', url: source.resumeUrl || source.resume_url }
    items.push({ label: 'Resume', fileName: value.name || value.file_name || 'Resume', url: value.url || source.resume_url })
  }
  return items.length > 0 ? items : fallbackDocuments
}

const buildLeadLabourDetails = (rawData: any, fallback: LeadLabourDetails): LeadLabourDetails => {
  if (!rawData) return fallback

  // Check for documents in multiple places: documentsList, documents array, or direct URL fields
  const documents = buildDocuments(
    rawData.documentsList || rawData.documents || rawData.attachments,
    rawData // Also pass rawData as fallback to check for id_proof_url, photo_url, resume_url directly
  )

  const assignedJobsRaw = rawData.assigned_jobs
  const assignedJobEntries: LeadLabourJobHistory[] = Array.isArray(assignedJobsRaw?.jobs)
    ? assignedJobsRaw.jobs.map((job: any) => transformAssignedJob(job))
    : []

  const jobHistoryFromLegacy: LeadLabourJobHistory[] = Array.isArray(rawData.jobHistory || rawData.job_history)
    ? (rawData.jobHistory || rawData.job_history).map((job: any) => transformAssignedJob(job))
    : []

  const jobHistory = assignedJobEntries.length > 0 ? assignedJobEntries : (jobHistoryFromLegacy.length > 0 ? jobHistoryFromLegacy : fallback.jobHistory)

  const assignedJobs = assignedJobsRaw
    ? {
        jobs: assignedJobEntries,
        total: assignedJobsRaw.total ?? assignedJobEntries.length,
        page: assignedJobsRaw.page ?? 1,
        limit: assignedJobsRaw.limit ?? assignedJobEntries.length,
        totalPages: assignedJobsRaw.totalPages ?? 1
      }
    : undefined

  return {
    id: rawData.id?.toString() || fallback.id,
    laborCode: rawData.labor_code || rawData.leadLabourId || fallback.laborCode,
    fullName: rawData.full_name || rawData.name || rawData.users?.full_name || fallback.fullName,
    role: rawData.role || rawData.users?.role || fallback.role,
    status: rawData.status || rawData.users?.status || fallback.status,
    email: rawData.email || rawData.users?.email || fallback.email,
    phone: rawData.phone || rawData.users?.phone || fallback.phone,
    address: rawData.address || fallback.address,
    dateOfBirth: rawData.dob || fallback.dateOfBirth,
    dateOfJoining: rawData.date_of_joining || rawData.dateOfJoining || fallback.dateOfJoining,
    availability: rawData.availability || fallback.availability,
    hourlyRate: rawData.hourly_rate ?? rawData.hourlyRate ?? fallback.hourlyRate,
    totalJobs: rawData.total_jobs ?? rawData.job_statistics?.total_jobs ?? rawData.assigned_jobs?.total ?? jobHistory.length ?? fallback.totalJobs,
    activeJobs: rawData.assigned_jobs?.active ?? rawData.active_jobs ?? 0,
    completedJobs: rawData.assigned_jobs?.completed ?? rawData.completed_jobs ?? 0,
    documents,
    jobHistory,
    about: rawData.about || rawData.description || fallback.about,
    assignedJobs
  }
}

export function LeadLabourDetailsPage({ leadLabourId, onBack, leadLabourData, isLoading }: LeadLabourDetailsPageProps) {
  const details = useMemo(() => buildLeadLabourDetails(leadLabourData, defaultDetails), [leadLabourData])
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL

  const [jobRows, setJobRows] = useState<LeadLabourJobHistory[]>(details.assignedJobs?.jobs ?? details.jobHistory ?? [])
  const [jobPage, setJobPage] = useState(details.assignedJobs?.page ?? 1)
  const [jobLimit, setJobLimit] = useState(details.assignedJobs?.limit ?? (details.assignedJobs?.jobs.length || 10))
  const [jobTotal, setJobTotal] = useState(details.assignedJobs?.total ?? jobRows.length)
  const [jobTotalPages, setJobTotalPages] = useState(details.assignedJobs?.totalPages ?? 1)
  const [isJobLoading, setIsJobLoading] = useState(false)

  useEffect(() => {
    setJobRows(details.assignedJobs?.jobs ?? details.jobHistory ?? [])
    setJobPage(details.assignedJobs?.page ?? 1)
    setJobLimit(details.assignedJobs?.limit ?? (details.assignedJobs?.jobs.length || 10))
    setJobTotal(details.assignedJobs?.total ?? (details.assignedJobs?.jobs.length ?? details.jobHistory.length))
    setJobTotalPages(details.assignedJobs?.totalPages ?? 1)
  }, [details.assignedJobs, details.jobHistory])

  const fetchAssignedJobsPage = useCallback(async (page: number) => {
    if (!apiBaseUrl) return
    setIsJobLoading(true)
    try {
      const token = typeof window !== 'undefined' && localStorage.getItem('jdp_auth')
        ? JSON.parse(localStorage.getItem('jdp_auth')!).token
        : null
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const response = await fetch(`${apiBaseUrl}/lead-labor/getLeadLaborById/${leadLabourId}?page=${page}&limit=${jobLimit}`, {
        method: 'GET',
        headers
      })

      if (!response.ok) {
        toast.error('Failed to load assigned jobs')
        return
      }

      const result = await response.json()
      if (result.success && result.data?.assigned_jobs) {
        const payload = result.data.assigned_jobs
        const newJobs = Array.isArray(payload.jobs) ? payload.jobs.map((job: any) => transformAssignedJob(job)) : []
        setJobRows(newJobs)
        setJobPage(payload.page ?? page)
        setJobLimit(payload.limit ?? jobLimit)
        setJobTotal(payload.total ?? newJobs.length)
        setJobTotalPages(payload.totalPages ?? 1)
      } else {
        toast.error('Failed to load assigned jobs')
      }
    } catch (error) {
      console.error('Error loading assigned jobs:', error)
      toast.error('Failed to load assigned jobs')
    } finally {
      setIsJobLoading(false)
    }
  }, [apiBaseUrl, leadLabourId, jobLimit])

  const handleJobPageChange = useCallback((direction: 'prev' | 'next') => {
    const nextPage = direction === 'prev' ? jobPage - 1 : jobPage + 1
    if (nextPage < 1 || nextPage > jobTotalPages) return
    fetchAssignedJobsPage(nextPage)
  }, [fetchAssignedJobsPage, jobPage, jobTotalPages])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
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
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
            <h1 className="text-2xl font-semibold text-[#2b2b2b]">Lead Labour Details</h1>
            <p className="text-sm text-gray-500">View and manage Lead labor profile and job history</p>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[{
          label: 'Total Jobs',
          value: details.totalJobs,
          icon: Briefcase,
          color: 'bg-blue-500'
        }, {
          label: 'Active Jobs',
          value: details.activeJobs,
          icon: Clock,
          color: 'bg-emerald-500'
        }, {
          label: 'Completed Jobs',
          value: details.completedJobs,
          icon: CheckCircle,
          color: 'bg-purple-500'
        }].map((metric) => {
          const Icon = metric.icon
          return (
            <Card key={metric.label} className="bg-white shadow-sm border border-gray-100">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{metric.label}</p>
                  <p className="text-2xl font-semibold text-[#2b2b2b]">{metric.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${metric.color}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="bg-white shadow-md border-0">
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5 text-[#00A1FF]" />
              Profile Overview
            </CardTitle>
            <p className="text-sm text-gray-500">View and manage labor profile and job history</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-100">
              {details.laborCode || `#${leadLabourId}`}
            </span>
            {renderStatusBadge(details.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-[#00A1FF] rounded-full flex items-center justify-center shadow-inner">
                <span className="text-white font-medium text-xl">
                  {details.fullName.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-[#2b2b2b]">{details.fullName}</h2>
                <p className="text-sm text-gray-600">{details.role}</p>
                <p className="text-xs text-gray-500 mt-1">Joined {formatDate(details.dateOfJoining)}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 text-right text-sm text-gray-600">
              {/* <div>
                <p className="text-xs text-gray-500">Hourly Rate</p>
                <p className="font-medium text-[#2b2b2b]">{formatCurrency(details.hourlyRate)}</p>
              </div> */}
              <div>
                <p className="text-xs text-gray-500">Availability</p>
                <p className="font-medium text-[#2b2b2b]">{details.availability}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'Email Address', value: details.email, icon: Mail },
              { label: 'Phone Number', value: details.phone, icon: Phone },
              { label: 'Date of Birth', value: formatDate(details.dateOfBirth), icon: Calendar },
              { label: 'Address', value: details.address, icon: MapPin, colSpan: 2 },
              { label: 'Hourly Rate', value: `$ ${details.hourlyRate}`, icon: DollarSign, colSpan: 2 }
            ].map((item, index) => {
              const Icon = item.icon
              return (
                <div
                  key={index}
                  className={`flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50 ${item.colSpan ? 'md:col-span-1' : ''}`}
                >
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                    <Icon className="h-4 w-4 text-[#00A1FF]" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{item.label}</p>
                    <p className="text-sm font-medium text-[#2b2b2b] break-all">{item.value || 'Not provided'}</p>
                  </div>
                </div>
              )
            })}
          </div>

          {details.about && (
            <div className="p-4 rounded-xl border border-blue-100 bg-blue-50">
              <p className="text-xs text-gray-600 mb-2">About</p>
              <p className="text-sm text-[#2b2b2b] leading-relaxed">{details.about}</p>
            </div>
          )}

          <div>
            <p className="text-xs text-gray-500 mb-3">Documents</p>
            {details.documents.length === 0 ? (
              <p className="text-sm text-gray-500">No documents uploaded.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {details.documents.map((doc, index) => (
                  <div key={`${doc.label}-${index}`} className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                    <p className="text-xs text-gray-500 mb-1">{doc.label}</p>
                    {doc.url ? (
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-medium text-[#00A1FF] hover:underline flex items-center gap-1"
                      >
                        <FileText className="h-4 w-4" />
                        {doc.fileName}
                      </a>
                    ) : (
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        {doc.fileName}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-md border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Briefcase className="h-5 w-5 text-[#00A1FF]" />
            Job History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead>Job Title</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Status</TableHead> 
                </TableRow>
              </TableHeader>
              <TableBody>
                {isJobLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-sm text-gray-500">
                      Loading assigned jobs...
                    </TableCell>
                  </TableRow>
                ) : jobRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-sm text-gray-500">
                      No job history available.
                    </TableCell>
                  </TableRow>
                ) : (
                  jobRows.map((job, index) => (
                    <TableRow key={`${job.jobTitle}-${index}`}>
                      <TableCell className="font-medium text-[#2b2b2b]">{job.jobTitle}</TableCell>
                      <TableCell>{job.client}</TableCell>
                      <TableCell>{job.location}</TableCell>
                      <TableCell>{job.phone}</TableCell>
                      <TableCell>{job.startDate ? formatDate(job.startDate) : '—'}</TableCell>
                      <TableCell>{renderJobStatusBadge(job.status)}</TableCell> 
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-500">
              Showing page {jobPage} of {Math.max(jobTotalPages, 1)} (Total jobs: {jobTotal})
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleJobPageChange('prev')}
                disabled={isJobLoading || jobPage <= 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleJobPageChange('next')}
                disabled={isJobLoading || jobPage >= jobTotalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}