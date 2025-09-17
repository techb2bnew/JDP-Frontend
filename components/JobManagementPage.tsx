'use client'
import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { ActionButtonsPopup } from './ActionButtonsPopup'
import { JobDetailsPage } from './JobDetailsPage'
import { JobCreationPage } from './JobCreationPage'
import { TimesheetManagement } from './TimesheetManagement'
import { InvoiceComparison } from './InvoiceComparison'
import { JobApprovals } from './JobApprovals'
import { LoadingSpinner } from './common/LoadingSpinner'
import { toast } from 'sonner'
import { usePermissions } from '../contexts/PermissionContext'
import { apiClient } from '../utils/api'
import { 
  Plus, 
  Search, 
  Filter,
  Calendar,
  User,
  MapPin,
  Clock,
  DollarSign,
  FileText,
  Users,
  CheckSquare
} from 'lucide-react'

interface Job {
  id: string
  title: string
  type: 'service-based' | 'contract-based'
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled'
  assignedLeadLabor: string[]
  assignedLabor: string[]
  contractor?: string
  customer?: string
  description: string
  createdDate: string
  dueDate: string
  estimatedHours?: number
  actualHours?: number
  estimatedCost?: number
  actualCost?: number
  materials?: string[]
  address: string
  cityZip: string
  phone?: string
  email?: string
  billToAddress?: string
  billToCityZip?: string
  billToPhone?: string
  billToEmail?: string
  sameAsAddress: boolean
  priority: 'low' | 'medium' | 'high' | 'urgent'
  billingStatus?: 'pending' | 'invoiced' | 'paid'
  // Additional fields from API
  customerName?: string
  contractorName?: string
  createdBy?: string
  assignedLeadLaborDetails?: any[]
  assignedLaborDetails?: any[]
  assignedMaterialsDetails?: any[]
}

export function JobManagementPage() {
  const { hasPermission } = usePermissions()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [currentView, setCurrentView] = useState<'list' | 'details' | 'create' | 'timesheets' | 'invoices' | 'approvals'>('list')
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterLabor, setFilterLabor] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalJobs, setTotalJobs] = useState(0)
  const itemsPerPage = 5

  // Fetch jobs from API
  const fetchJobs = async (page: number = 1) => {
    try {
      setLoading(true)
      const response = await apiClient.getJobs(page, itemsPerPage)
      setJobs(response.data)
      setTotalPages(response.totalPages)
      setTotalJobs(response.total)
      setCurrentPage(page)
    } catch (error) {
      console.error('Error fetching jobs:', error)
      toast.error('Failed to fetch jobs')
    } finally {
      setLoading(false)
    }
  }

  // Load jobs on component mount
  useEffect(() => {
    fetchJobs(1)
  }, [])

  // Handle page change
  const handlePageChange = (page: number) => {
    fetchJobs(page)
  }

  // Client-side filtering for search and other filters
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.contractorName?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = filterType === 'all' || job.type === filterType
    const matchesStatus = filterStatus === 'all' || job.status === filterStatus
    const matchesLabor = filterLabor === 'all' || job.assignedLabor.includes(filterLabor)
    const matchesPriority = filterPriority === 'all' || job.priority === filterPriority
    
    return matchesSearch && matchesType && matchesStatus && matchesLabor && matchesPriority
  })

  const uniqueLabor = Array.from(new Set(jobs.flatMap(job => job.assignedLaborDetails?.map(l => l.user?.full_name) || [])))

  const handleViewDetails = (jobId: string) => {
    setSelectedJobId(jobId)
    setCurrentView('details')
  }

  const handleCreateJob = () => {
    setCurrentView('create')
  }

  const handleJobCreated = (newJob: Job) => {
    // Refresh the jobs list
    fetchJobs(currentPage)
    setCurrentView('list')
    toast.success('Job created successfully!')
  }

  const handleEditJob = (job: Job) => {
    setSelectedJobId(job.id)
    setCurrentView('details')
    toast.success(`Editing job: ${job.title}`)
  }

  const handleDeleteJob = (jobId: string) => {
    setJobs(jobs.filter(job => job.id !== jobId))
    toast.success('Job deleted successfully')
  }

  const handleBackToList = () => {
    setCurrentView('list')
    setSelectedJobId(null)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge className="bg-yellow-50 text-yellow-600 border-yellow-200 hover:bg-yellow-50">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        )
      case 'in-progress':
        return (
          <Badge className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-50">
            <Clock className="w-3 h-3 mr-1" />
            In Progress
          </Badge>
        )
      case 'completed':
        return (
          <Badge className="bg-green-50 text-green-600 border-green-200 hover:bg-green-50">
            <CheckSquare className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        )
      case 'cancelled':
        return (
          <Badge className="bg-red-50 text-red-600 border-red-200 hover:bg-red-50">
            Cancelled
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

  const getTypeBadge = (type: string) => {
    return (
      <Badge className="bg-[#E6F6FF] text-[#00A1FF] border-[#00A1FF]/20 hover:bg-[#E6F6FF]">
        {type === 'service-based' ? 'Service-Based' : 'Contract-Based'}
      </Badge>
    )
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return (
          <Badge className="bg-red-100 text-red-700 border-red-300 hover:bg-red-100">
            Urgent
          </Badge>
        )
      case 'high':
        return (
          <Badge className="bg-red-50 text-red-600 border-red-200 hover:bg-red-50">
            High
          </Badge>
        )
      case 'medium':
        return (
          <Badge className="bg-yellow-50 text-yellow-600 border-yellow-200 hover:bg-yellow-50">
            Medium
          </Badge>
        )
      case 'low':
        return (
          <Badge className="bg-green-50 text-green-600 border-green-200 hover:bg-green-50">
            Low
          </Badge>
        )
      default:
        return (
          <Badge className="bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-50">
            {priority}
          </Badge>
        )
    }
  }

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'N/A'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  // Handle different views
  if (currentView === 'details' && selectedJobId) {
    return (
      <JobDetailsPage 
        jobId={selectedJobId} 
        onBack={handleBackToList}
        jobs={jobs}
        setJobs={setJobs}
      />
    )
  }

  if (currentView === 'create') {
    return (
      <JobCreationPage 
        onBack={handleBackToList}
        onJobCreated={handleJobCreated}
      />
    )
  }

  // Transform jobs for other components that expect different interface
  const transformedJobs = jobs.map(job => ({
    ...job,
    location: `${job.address}, ${job.cityZip}`,
    customer: job.customerName || job.customer || 'Unknown Customer',
    priority: job.priority === 'urgent' ? 'high' : job.priority,
    assignedLabor: job.assignedLaborDetails?.map(l => l.user?.full_name || l.labor_code) || []
  }))

  if (currentView === 'timesheets') {
    return (
      <TimesheetManagement 
        onBack={handleBackToList}
        jobs={transformedJobs}
      />
    )
  }

  if (currentView === 'invoices') {
    return (
      <InvoiceComparison 
        onBack={handleBackToList}
        jobs={transformedJobs}
      />
    )
  }

  if (currentView === 'approvals') {
    return (
      <JobApprovals 
        onBack={handleBackToList}
        jobs={transformedJobs}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-[#2b2b2b]">Job Management</h1>
          <p className="text-sm text-[#2b2b2b]/60 mt-1">
            Manage jobs, track progress, and handle invoicing
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => setCurrentView('timesheets')}
            className="gap-2"
          >
            <Clock className="h-4 w-4" />
            Timesheets
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setCurrentView('invoices')}
            className="gap-2"
          >
            <FileText className="h-4 w-4" />
            Invoices
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setCurrentView('approvals')}
            className="gap-2"
          >
            <CheckSquare className="h-4 w-4" />
            Approvals
          </Button>
          {hasPermission('jobs', 'create') && (
            <Button 
              onClick={handleCreateJob}
              className="bg-primary text-primary-foreground hover:bg-[#0090e6] gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Job
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white shadow-md border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Jobs</p>
                <p className="text-2xl font-medium text-[#2b2b2b]">{jobs.length}</p>
              </div>
              <div className="w-12 h-12 bg-[#E6F6FF] rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-[#00A1FF]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-medium text-[#2b2b2b]">
                  {jobs.filter(job => job.status === 'in-progress').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-medium text-[#2b2b2b]">
                  {jobs.filter(job => job.status === 'completed').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <CheckSquare className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-medium text-[#2b2b2b]">
                  {formatCurrency(jobs.reduce((sum, job) => sum + (job.actualCost || job.estimatedCost || 0), 0))}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-white shadow-md border-0">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search jobs by title, ID, customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Job Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="service-based">Service-Based</SelectItem>
                <SelectItem value="contract-based">Contract-Based</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterLabor} onValueChange={setFilterLabor}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Assigned Labor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Labor</SelectItem>
                {uniqueLabor.map((labor) => (
                  <SelectItem key={labor} value={labor}>{labor}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem> 
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Filter className="h-4 w-4" />
              <span>{filteredJobs.length} jobs</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Jobs Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredJobs.map((job) => (
          <Card key={job.id} className="bg-white shadow-md border-0 hover:shadow-md transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-[#2b2b2b]">{job.title}</h3>
                    {getPriorityBadge(job.priority)}
                  </div>
                  <p className="text-sm text-gray-600">#{job.id}</p>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(job.status)}
                    {getTypeBadge(job.type)}
                  </div>
                </div>
                <ActionButtonsPopup
                  onView={() => handleViewDetails(job.id)}
                  onEdit={() => handleEditJob(job)}
                  onDelete={() => handleDeleteJob(job.id)}
                  itemName={job.title}
                  itemType="Job"
                  showView={hasPermission('jobs', 'view')}
                  showEdit={hasPermission('jobs', 'edit')}
                  showDelete={hasPermission('jobs', 'delete')}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-700">{job.description}</p>
              
              <div className="space-y-3">
                {job.customerName && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">Customer:</span>
                    <span className="font-medium text-[#2b2b2b]">{job.customerName}</span>
                  </div>
                )}
                
                {job.contractorName && (
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">Contractor:</span>
                    <span className="font-medium text-[#2b2b2b]">{job.contractorName}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">Location:</span>
                  <span className="font-medium text-[#2b2b2b]">{job.address}, {job.cityZip}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">Due:</span>
                  <span className="font-medium text-[#2b2b2b]">{formatDate(job.dueDate)}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">Cost:</span>
                  <span className="font-medium text-[#2b2b2b]">
                    {formatCurrency(job.actualCost || job.estimatedCost)}
                  </span>
                </div>
              </div>

              {job.assignedLaborDetails && job.assignedLaborDetails.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Assigned Labor:</p>
                  <div className="flex flex-wrap gap-1">
                    {job.assignedLaborDetails.map((labor, index) => (
                      <Badge key={index} className="bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-50">
                        {labor.user?.full_name || labor.labor_code}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {job.assignedLeadLaborDetails && job.assignedLeadLaborDetails.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Lead Labor:</p>
                  <div className="flex flex-wrap gap-1">
                    {job.assignedLeadLaborDetails.map((leadLabor, index) => (
                      <Badge key={index} className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50">
                        {leadLabor.user?.full_name || leadLabor.labor_code}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {filteredJobs.length === 0 && (
        <Card className="bg-white shadow-md border-0">
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[#2b2b2b] mb-2">No jobs found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filterType !== 'all' || filterStatus !== 'all' || filterLabor !== 'all' || filterPriority !== 'all'
                ? 'Try adjusting your search criteria or filters'
                : 'Create your first job to get started'
              }
            </p>
            {(!searchTerm && filterType === 'all' && filterStatus === 'all' && filterLabor === 'all' && filterPriority === 'all') && hasPermission('jobs', 'create') && (
              <Button onClick={handleCreateJob} className="bg-primary text-white hover:bg-[#0090e6] gap-2">
                <Plus className="h-4 w-4" />
                Create First Job
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading}
          >
            Previous
          </Button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              onClick={() => handlePageChange(page)}
              disabled={loading}
              className={currentPage === page ? "bg-primary text-white hover:bg-[#0090e6]" : ""}
            >
              {page}
            </Button>
          ))}
          
          <Button
            variant="outline"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || loading}
          >
            Next
          </Button>
        </div>
      )}

      {/* Results Info */}
      <div className="text-center text-sm text-gray-600">
        Showing {jobs.length} of {totalJobs} jobs
      </div>
    </div>
  )
}