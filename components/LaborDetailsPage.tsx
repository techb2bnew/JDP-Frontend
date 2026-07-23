import { useState, useEffect, useCallback } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { ArrowLeft, Edit, FileText, Briefcase, Clock, CheckCircle, Mail, Phone, MapPin, Calendar, DollarSign, User } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { toast } from 'sonner'

interface LaborDetailsPageProps {
  laborId: string
  onBack: () => void
}

type LaborDocument = {
  label: string
  fileName: string
  url?: string
}

type LaborJobHistory = {
  jobTitle: string
  client: string
  location: string
  phone?: string
  startDate: string
  endDate: string
  status: string
  hoursWorked: number
}

const transformAssignedJob = (job: any): LaborJobHistory => {
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

  const clientName = job.customer?.company_name || job.customer?.customer_name || job.contractor.contractor_name || job.client || 'N/A'
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
  total_jobs?: number
  total_hours?: number
  completed_jobs?: number
  active_jobs?: number
  jobHistory?: LaborJobHistory[]
  documents?: LaborDocument[]
}

export function LaborDetailsPage({ laborId, onBack }: LaborDetailsPageProps) {
  const [laborData, setLaborData] = useState<LaborDetailsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL

  // Pagination state for assigned jobs
  const [jobRows, setJobRows] = useState<LaborJobHistory[]>([])
  const [jobPage, setJobPage] = useState(1)
  const [jobLimit, setJobLimit] = useState(10)
  const [jobTotal, setJobTotal] = useState(0)
  const [jobTotalPages, setJobTotalPages] = useState(1)
  const [isJobLoading, setIsJobLoading] = useState(false)

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
          
          // Extract assigned_jobs for pagination
          const assignedJobsRaw = item.assigned_jobs
          let initialJobRows: LaborJobHistory[] = []
          
          if (assignedJobsRaw && Array.isArray(assignedJobsRaw.jobs)) {
            initialJobRows = assignedJobsRaw.jobs.map((job: any) => transformAssignedJob(job))
            setJobRows(initialJobRows)
            setJobPage(assignedJobsRaw.page ?? 1)
            setJobLimit(assignedJobsRaw.limit ?? 10)
            setJobTotal(assignedJobsRaw.total ?? initialJobRows.length)
            setJobTotalPages(assignedJobsRaw.totalPages ?? 1)
          } else {
            // Fallback to job_history if assigned_jobs is not available
            initialJobRows = Array.isArray(item.job_history)
              ? item.job_history.map((job: any) => ({
                  jobTitle: job.job_title || job.title || 'N/A',
                  client: job.client_name || job.client || job.customer?.name || job.contractor?.contractor_name || 'N/A',
                  location: job.location || job.job_location || 'N/A',
                  phone: job.customer?.phone || job.phone || 'N/A',
                  startDate: job.start_date || job.assigned_at || '',
                  endDate: job.end_date || job.completed_at || '',
                  status: job.status || 'N/A',
                  hoursWorked: job.hours_worked ?? job.total_hours ?? 0
                }))
              : []
            setJobRows(initialJobRows)
            setJobTotal(initialJobRows.length)
            setJobTotalPages(1)
          }
          
          // Map API response to labor details structure (legacy jobHistory for backward compatibility)
          const jobHistory: LaborJobHistory[] = initialJobRows

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
            role: item.users?.role || 'Labor',
            total_jobs: item.job_summary?.total_jobs ?? item.job_statistics?.total_jobs ?? (assignedJobsRaw?.total ?? initialJobRows.length),
            total_hours: item.hours_worked ?? item.job_statistics?.total_hours ?? item.timesheet_stats?.total_hours ?? 0,
            completed_jobs: item.job_summary?.completed_jobs ?? item.job_statistics?.completed_jobs ?? initialJobRows.filter(job => job.status?.toLowerCase() === 'completed').length,
            active_jobs: item.job_summary?.active_jobs ?? 0,
            jobHistory,
            documents: Array.isArray(item.documents)
              ? item.documents.map((doc: any) => ({
                  label: doc.label || doc.type || 'Document',
                  fileName: doc.file_name || doc.name || 'Download',
                  url: doc.url
                }))
              : []
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

  const fetchAssignedJobsPage = useCallback(async (page: number) => {
    if (!apiBaseUrl || !laborId) return
    setIsJobLoading(true)
    try {
      const token = localStorage.getItem('jdp_auth') ? JSON.parse(localStorage.getItem('jdp_auth')!).token : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${apiBaseUrl}/labor/getLaborById/${laborId}?page=${page}&limit=${jobLimit}`, {
        method: 'GET',
        headers
      });

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
  }, [apiBaseUrl, laborId, jobLimit])

  const handleJobPageChange = useCallback((direction: 'prev' | 'next') => {
    const nextPage = direction === 'prev' ? jobPage - 1 : jobPage + 1
    if (nextPage < 1 || nextPage > jobTotalPages) return
    fetchAssignedJobsPage(nextPage)
  }, [fetchAssignedJobsPage, jobPage, jobTotalPages])

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

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not provided'
    try {
      const date = new Date(dateString)
      if (Number.isNaN(date.getTime())) return dateString
      return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' })
    } catch (error) {
      return dateString
    }
  }

  const formatHours = (value?: number) => `${value ?? 0}h`

  type SummaryMetric = {
    label: string
    value: number
    icon: typeof Briefcase
    iconBg: string
    formatter?: (value: number) => string
  }

  const summaryMetrics: SummaryMetric[] = [
    {
      label: 'Total Jobs',
      value: laborData.total_jobs ?? 0,
      icon: Briefcase,
      iconBg: 'bg-blue-500'
    },
    {
      label: 'Active Jobs',
      value: laborData.active_jobs ?? 0,
      icon: Clock,
      iconBg: 'bg-emerald-500'
    },
    {
      label: 'Completed Jobs',
      value: laborData.completed_jobs ?? 0,
      icon: CheckCircle,
      iconBg: 'bg-purple-500'
    }
  ]

  const getStatusBadge = (status: string) => {
    const normalized = status?.toLowerCase()
    switch (normalized) {
      case 'active':
        return <Badge className="bg-green-50 text-green-600 border-green-200">Active</Badge>
      case 'inactive':
        return <Badge className="bg-red-50 text-red-600 border-red-200">Inactive</Badge>
      case 'on-leave':
        return <Badge className="bg-yellow-50 text-yellow-600 border-yellow-200">On Leave</Badge>
      default:
        return <Badge className="bg-gray-50 text-gray-600 border-gray-200">{status}</Badge>
    }
  }

  const renderJobStatusBadge = (status: string) => {
    const normalized = status?.toLowerCase()
    switch (normalized) {
      case 'active':
        return <Badge className="bg-green-50 text-green-600 border-green-200">Active</Badge>
      case 'completed':
        return <Badge className="bg-blue-50 text-blue-600 border-blue-200">Completed</Badge>
      case 'pending':
        return <Badge className="bg-yellow-50 text-yellow-600 border-yellow-200">Pending</Badge>
      case 'cancelled':
      case 'canceled':
        return <Badge className="bg-red-50 text-red-600 border-red-200">Cancelled</Badge>
      default:
        return <Badge className="bg-gray-50 text-gray-600 border-gray-200">{status || 'N/A'}</Badge>
    }
  }

  const contactInfoItems = [
    { label: 'Email Address', value: laborData.email || 'Not provided', icon: Mail },
    { label: 'Phone Number', value: laborData.phone || 'Not provided', icon: Phone },
    { label: 'Date of Birth', value: formatDate(laborData.dob), icon: Calendar },
    { label: 'Address', value: laborData.address || 'Not provided', icon: MapPin, },
    { label: 'Hourly Rate', value: `$ ${laborData.hourly_rate}`, icon: DollarSign, }
  ] as Array<{ label: string; value: string; icon: typeof Mail; colSpan?: number }>

  const workDetailsItems = [
    { label: 'Role', value: laborData.role || 'Not provided' },
    { label: 'Trade', value: laborData.trade || 'Not provided' },
    { label: 'Experience', value: laborData.experience || 'Not provided' },
    { label: 'Hourly Rate', value: `$${laborData.hourly_rate ?? 0}` },
    { label: 'Supervisor', value: laborData.supervisor || 'Not provided' },
    { label: 'Availability', value: laborData.availability || 'Not provided' },
    { label: 'Date of Joining', value: formatDate(laborData.date_of_joining) }
  ]

  const documents = laborData.documents ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-[#2b2b2b]">Labor Details</h1>
            <p className="text-sm text-gray-500">View and manage labor profile and job history</p>
          </div>
        </div>
        {/* <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2" onClick={() => toast.info('Export functionality coming soon')}>Export</Button>
          <Button onClick={() => toast.info('Edit functionality coming soon')} className="gap-2 bg-primary text-white hover:bg-[#0090e6]">
            <Edit className="h-4 w-4" />
            Edit Details
          </Button>
        </div> */}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {summaryMetrics.map((metric) => {
          const Icon = metric.icon
          const value = metric.formatter
            ? metric.formatter(metric.value)
            : (metric.value ?? 0).toLocaleString()
          return (
            <Card key={metric.label} className="bg-white shadow-sm border border-gray-100">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{metric.label}</p>
                  <p className="text-2xl font-semibold text-[#2b2b2b]">{value}</p>
                </div>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${metric.iconBg}`}>
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
            <p className="text-sm text-gray-500">Labor code and personal information</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-100">
              {laborData.labor_code || `#${laborData.id}`}
            </span>
            {getStatusBadge(laborData.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-[#00A1FF] rounded-full flex items-center justify-center shadow-inner">
                <span className="text-white font-medium text-xl">
                  {laborData.full_name.split(' ').map(n => n[0]).join('') || 'L'}
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-[#2b2b2b]">{laborData.full_name || 'Labor'}</h2>
                <p className="text-sm text-gray-600">{laborData.role || 'Labor'}</p>
                <p className="text-xs text-gray-500 mt-1">Joined {formatDate(laborData.date_of_joining)}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 text-right text-sm text-gray-600">
              <div>
                <p className="text-xs text-gray-500">Availability</p>
                <p className="font-medium text-[#2b2b2b]">{laborData.availability || 'Not provided'}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contactInfoItems.map((item, index) => {
              const Icon = item.icon
              return (
                <div
                  key={index}
                  className={`flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50 ${item.colSpan ? 'md:col-span-2' : ''}`}
                >
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                    <Icon className="h-4 w-4 text-[#00A1FF]" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{item.label}</p>
                    <p className="text-sm font-medium text-[#2b2b2b] break-all">{item.value}</p>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {workDetailsItems.map((item, index) => (
              <div key={index} className="p-4 rounded-xl border border-emerald-200 bg-emerald-50">
                <p className="text-xs text-gray-600">{item.label}</p>
                <p className="text-sm font-medium text-[#2b2b2b]">{item.value}</p>
              </div>
            ))}
          </div>

          {(laborData.certifications?.length ?? 0) > 0 || (laborData.skills?.length ?? 0) > 0 || laborData.notes ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-blue-100 bg-blue-50">
                <p className="text-xs text-gray-600 mb-3">Certifications</p>
                {laborData.certifications.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {laborData.certifications.map((cert, index) => (
                      <Badge key={index} className="bg-white text-blue-700 border-blue-200">
                        {cert}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No certifications listed</p>
                )}
              </div>
              <div className="p-4 rounded-xl border border-green-100 bg-green-50">
                <p className="text-xs text-gray-600 mb-3">Skills</p>
                {laborData.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {laborData.skills.map((skill, index) => (
                      <Badge key={index} className="bg-white text-green-700 border-green-200">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No skills listed</p>
                )}
              </div>
              {laborData.notes && (
                <div className="md:col-span-2 p-4 rounded-xl border border-slate-200 bg-slate-50">
                  <p className="text-xs text-gray-600 mb-2">Notes</p>
                  <p className="text-sm text-[#2b2b2b] leading-relaxed">{laborData.notes}</p>
                </div>
              )}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* <Card className="bg-white shadow-md border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-[#00A1FF]" />
            Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <p className="text-sm text-gray-500">No documents uploaded.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {documents.map((doc, index) => (
                <div key={`${doc.label}-${index}`} className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                  <p className="text-xs text-gray-600 mb-1">{doc.label}</p>
                  {doc.url ? (
                    <a href={doc.url} target="_blank" rel="noreferrer" className="text-sm font-medium text-[#00A1FF] hover:underline flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      {doc.fileName || 'Download'}
                    </a>
                  ) : (
                    <div className="text-sm text-gray-500 flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      {doc.fileName || 'Unavailable'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card> */}

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
                  <TableHead>Customer</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isJobLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-sm text-gray-500">
                      Loading assigned jobs...
                    </TableCell>
                  </TableRow>
                ) : jobRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-sm text-gray-500">
                      No job history available.
                    </TableCell>
                  </TableRow>
                ) : (
                  jobRows.map((job, index) => (
                    <TableRow key={`${job.jobTitle}-${index}`}>
                      <TableCell className="font-medium text-[#2b2b2b]">{job.jobTitle}</TableCell>
                      <TableCell>{job.client}</TableCell>
                      <TableCell>{job.location}</TableCell>
                      <TableCell>{job.phone || 'N/A'}</TableCell>
                      <TableCell>{job.startDate ? formatDate(job.startDate) : '—'}</TableCell>
                      <TableCell>{renderJobStatusBadge(job.status)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {jobTotalPages > 1 && jobRows.length > 0 && (

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
          </div>)}
        </CardContent>
      </Card>
    </div>
  )
}