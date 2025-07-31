import { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Badge } from './ui/badge'
import { ArrowLeft, CheckSquare, X, Clock, FileText, User } from 'lucide-react'

interface Job {
  id: string
  title: string
  type: 'service-based' | 'contract-based'
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled'
  assignedLabor: string[]
  contractor?: string
  customer: string
  description: string
  createdDate: string
  dueDate: string
  estimatedHours?: number
  actualHours?: number
  estimatedCost?: number
  actualCost?: number
  materials?: string[]
  location: string
  priority: 'low' | 'medium' | 'high'
  billingStatus?: 'pending' | 'invoiced' | 'paid'
}

interface ApprovalItem {
  id: string
  type: 'bluesheet' | 'timesheet' | 'invoice' | 'job-completion'
  jobId: string
  jobTitle: string
  submittedBy: string
  submittedDate: string
  status: 'pending' | 'approved' | 'rejected'
  description: string
  amount?: number
}

interface JobApprovalsProps {
  onBack: () => void
  jobs: Job[]
}

export function JobApprovals({ onBack }: JobApprovalsProps) {
  const [approvals, setApprovals] = useState<ApprovalItem[]>([
    {
      id: '1',
      type: 'bluesheet',
      jobId: 'JOB-2025-001',
      jobTitle: 'Electrical Panel Installation',
      submittedBy: 'John Smith',
      submittedDate: '2025-01-20',
      status: 'pending',
      description: 'Material list and quantities for electrical panel installation',
      amount: 1910
    },
    {
      id: '2',
      type: 'timesheet',
      jobId: 'JOB-2025-001',
      jobTitle: 'Electrical Panel Installation',
      submittedBy: 'David Wilson',
      submittedDate: '2025-01-21',
      status: 'pending',
      description: '32 hours worked over 5 days',
      amount: 1280
    },
    {
      id: '3',
      type: 'job-completion',
      jobId: 'JOB-2025-003',
      jobTitle: 'Emergency Generator Setup',
      submittedBy: 'Mike Rodriguez',
      submittedDate: '2025-01-19',
      status: 'approved',
      description: 'Job completed successfully with all requirements met'
    },
    {
      id: '4',
      type: 'invoice',
      jobId: 'JOB-2025-002',
      jobTitle: 'Office Lighting Maintenance',
      submittedBy: 'Sarah Johnson',
      submittedDate: '2025-01-18',
      status: 'rejected',
      description: 'Monthly lighting maintenance invoice',
      amount: 1200
    }
  ])

  const handleApprove = (id: string) => {
    setApprovals(approvals.map(approval => 
      approval.id === id ? { ...approval, status: 'approved' as const } : approval
    ))
  }

  const handleReject = (id: string) => {
    setApprovals(approvals.map(approval => 
      approval.id === id ? { ...approval, status: 'rejected' as const } : approval
    ))
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'bluesheet':
        return (
          <Badge className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-50">
            <FileText className="w-3 h-3 mr-1" />
            Bluesheet
          </Badge>
        )
      case 'timesheet':
        return (
          <Badge className="bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-50">
            <Clock className="w-3 h-3 mr-1" />
            Timesheet
          </Badge>
        )
      case 'invoice':
        return (
          <Badge className="bg-green-50 text-green-600 border-green-200 hover:bg-green-50">
            <FileText className="w-3 h-3 mr-1" />
            Invoice
          </Badge>
        )
      case 'job-completion':
        return (
          <Badge className="bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-50">
            <CheckSquare className="w-3 h-3 mr-1" />
            Job Completion
          </Badge>
        )
      default:
        return (
          <Badge className="bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-50">
            {type}
          </Badge>
        )
    }
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
      case 'approved':
        return (
          <Badge className="bg-green-50 text-green-600 border-green-200 hover:bg-green-50">
            <CheckSquare className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        )
      case 'rejected':
        return (
          <Badge className="bg-red-50 text-red-600 border-red-200 hover:bg-red-50">
            <X className="w-3 h-3 mr-1" />
            Rejected
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

  const pendingCount = approvals.filter(a => a.status === 'pending').length
  const approvedCount = approvals.filter(a => a.status === 'approved').length
  const rejectedCount = approvals.filter(a => a.status === 'rejected').length

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Jobs
        </Button>
        <div>
          <h1 className="text-2xl font-medium text-[#2b2b2b]">Job Approvals</h1>
          <p className="text-sm text-[#2b2b2b]/60 mt-1">Review and approve pending submissions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white shadow-sm border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Submissions</p>
                <p className="text-2xl font-medium text-[#2b2b2b]">{approvals.length}</p>
              </div>
              <div className="w-12 h-12 bg-[#E6F6FF] rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-[#00A1FF]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Approval</p>
                <p className="text-2xl font-medium text-yellow-600">{pendingCount}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-medium text-green-600">{approvedCount}</p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <CheckSquare className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rejected</p>
                <p className="text-2xl font-medium text-red-600">{rejectedCount}</p>
              </div>
              <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
                <X className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white shadow-sm border-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#162f3d] hover:bg-[#162f3d]">
                <TableHead className="text-white font-medium">Type</TableHead>
                <TableHead className="text-white font-medium">Job</TableHead>
                <TableHead className="text-white font-medium">Submitted By</TableHead>
                <TableHead className="text-white font-medium">Date</TableHead>
                <TableHead className="text-white font-medium">Description</TableHead>
                <TableHead className="text-white font-medium">Amount</TableHead>
                <TableHead className="text-white font-medium">Status</TableHead>
                <TableHead className="text-white font-medium">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {approvals.map((approval, index) => (
                <TableRow key={approval.id} className={index % 2 === 1 ? "bg-[#eff4fa]" : ""}>
                  <TableCell>{getTypeBadge(approval.type)}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium text-sm">{approval.jobTitle}</div>
                      <div className="text-xs text-gray-500">{approval.jobId}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{approval.submittedBy}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{formatDate(approval.submittedDate)}</TableCell>
                  <TableCell className="text-sm max-w-xs truncate">{approval.description}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(approval.amount)}</TableCell>
                  <TableCell>{getStatusBadge(approval.status)}</TableCell>
                  <TableCell>
                    {approval.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleApprove(approval.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckSquare className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleReject(approval.id)}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}