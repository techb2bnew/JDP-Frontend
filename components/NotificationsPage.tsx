'use client'
import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Separator } from './ui/separator'
import { 
  Bell,
  BellRing,
  Search,
  Filter,
  MoreVertical,
  Clock,
  User,
  FileText,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Briefcase,
  Package,
  Calendar,
  Trash2,
  Check,
  X,
  Eye,
  EyeOff
} from 'lucide-react'

interface Notification {
  id: string
  type: 'booking' | 'overtime' | 'invoice' | 'material' | 'bluesheet' | 'job-status' | 'contact' | 'assignment' | 'milestone' | 'approval'
  title: string
  message: string
  timestamp: string
  isRead: boolean
  priority: 'low' | 'medium' | 'high'
  relatedId?: string
  userRole: 'admin' | 'staff' | 'lead-labor' | 'labor'
  category: 'job-management' | 'invoicing' | 'materials' | 'timesheets' | 'system'
}

export function NotificationsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [activeTab, setActiveTab] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const [notifications, setNotifications] = useState<Notification[]>([
    // Admin Notifications
    {
      id: '1',
      type: 'booking',
      title: 'New Booking Received',
      message: 'New Booking Received: JOB-2025-005, ABC Corporation. Customer requested electrical panel upgrade for their office building.',
      timestamp: '2025-01-22T14:30:00Z',
      isRead: false,
      priority: 'high',
      relatedId: 'JOB-2025-005',
      userRole: 'admin',
      category: 'job-management'
    },
    {
      id: '2',
      type: 'overtime',
      title: 'Overtime Request from Lead Labor',
      message: 'Overtime Request from John Smith for Job JOB-2025-001. Requested 4 additional hours to complete electrical panel installation. Please review and approve.',
      timestamp: '2025-01-22T13:15:00Z',
      isRead: false,
      priority: 'medium',
      relatedId: 'JOB-2025-001',
      userRole: 'admin',
      category: 'timesheets'
    },
    {
      id: '3',
      type: 'invoice',
      title: 'Invoice Overdue Alert',
      message: 'Invoice INV-2025-003 for Job JOB-2025-002 is 5 days overdue. Amount: $3,200. Please follow up with customer XYZ Office Complex.',
      timestamp: '2025-01-22T12:00:00Z',
      isRead: false,
      priority: 'high',
      relatedId: 'INV-2025-003',
      userRole: 'admin',
      category: 'invoicing'
    },
    {
      id: '4',
      type: 'material',
      title: 'Material Request Approval Needed',
      message: 'Material Request from Lead Labor David Wilson for Job JOB-2025-001. Requesting additional circuit breakers and copper wire. Estimated cost: $450.',
      timestamp: '2025-01-22T11:45:00Z',
      isRead: true,
      priority: 'medium',
      relatedId: 'JOB-2025-001',
      userRole: 'admin',
      category: 'materials'
    },
    {
      id: '5',
      type: 'bluesheet',
      title: 'Bluesheet Submitted for Review',
      message: 'Bluesheet submitted for Job JOB-2025-004 by David Wilson. Emergency Generator Setup - material list and labor hours documented. Please review and approve.',
      timestamp: '2025-01-22T10:30:00Z',
      isRead: true,
      priority: 'medium',
      relatedId: 'JOB-2025-004',
      userRole: 'admin',
      category: 'job-management'
    },
    {
      id: '6',
      type: 'job-status',
      title: 'Job Status Updated',
      message: 'Job JOB-2025-003 Emergency Generator Setup status updated to Completed by Mike Rodriguez. Ready for final invoicing.',
      timestamp: '2025-01-22T09:15:00Z',
      isRead: true,
      priority: 'low',
      relatedId: 'JOB-2025-003',
      userRole: 'admin',
      category: 'job-management'
    },
    {
      id: '7',
      type: 'contact',
      title: 'New Contact Form Submission',
      message: 'New contact form submission from Sarah Johnson regarding project inquiry. Subject: Office Building Electrical Upgrade. Requires follow-up.',
      timestamp: '2025-01-22T08:00:00Z',
      isRead: true,
      priority: 'low',
      userRole: 'admin',
      category: 'system'
    },
    {
      id: '8',
      type: 'milestone',
      title: 'Job Milestone Completed',
      message: 'Milestone "Phase 1 - Installation" completed for Job JOB-2025-002 Office Lighting Maintenance. Contract-based job ready for next phase approval.',
      timestamp: '2025-01-21T16:45:00Z',
      isRead: true,
      priority: 'medium',
      relatedId: 'JOB-2025-002',
      userRole: 'admin',
      category: 'job-management'
    },
    {
      id: '9',
      type: 'approval',
      title: 'Discrepancy in Invoice Comparison',
      message: 'Discrepancy found between Bluesheet and Supplier Invoice for Job JOB-2025-001. Price variance of $85 detected in circuit breaker costs. Please investigate.',
      timestamp: '2025-01-21T15:20:00Z',
      isRead: false,
      priority: 'high',
      relatedId: 'JOB-2025-001',
      userRole: 'admin',
      category: 'invoicing'
    },
    {
      id: '10',
      type: 'assignment',
      title: 'Job Assignment Confirmation',
      message: 'Job JOB-2025-006 HVAC System Repair assigned to Climate Control Pro contractor. Labor: Lisa Chen, estimated start date: January 25, 2025.',
      timestamp: '2025-01-21T14:10:00Z',
      isRead: true,
      priority: 'low',
      relatedId: 'JOB-2025-006',
      userRole: 'admin',
      category: 'job-management'
    },
    // Staff Notifications
    {
      id: '11',
      type: 'assignment',
      title: 'New Job Assigned to You',
      message: 'New job assigned to you: Job JOB-2025-007, Office Security System Installation. Please review the job details and timeline.',
      timestamp: '2025-01-21T13:30:00Z',
      isRead: false,
      priority: 'medium',
      relatedId: 'JOB-2025-007',
      userRole: 'staff',
      category: 'job-management'
    },
    {
      id: '12',
      type: 'material',
      title: 'Material Low Stock Alert',
      message: 'Material Copper Wire 12 AWG is running low (15 units remaining). Replenish stock to avoid delays in upcoming jobs.',
      timestamp: '2025-01-21T12:15:00Z',
      isRead: true,
      priority: 'medium',
      userRole: 'staff',
      category: 'materials'
    }
  ])

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking':
        return <Calendar className="h-5 w-5 text-blue-600" />
      case 'overtime':
        return <Clock className="h-5 w-5 text-orange-600" />
      case 'invoice':
        return <DollarSign className="h-5 w-5 text-green-600" />
      case 'material':
        return <Package className="h-5 w-5 text-purple-600" />
      case 'bluesheet':
        return <FileText className="h-5 w-5 text-blue-600" />
      case 'job-status':
        return <Briefcase className="h-5 w-5 text-gray-600" />
      case 'contact':
        return <User className="h-5 w-5 text-indigo-600" />
      case 'assignment':
        return <User className="h-5 w-5 text-green-600" />
      case 'milestone':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'approval':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      default:
        return <Bell className="h-5 w-5 text-gray-600" />
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return (
          <Badge className="bg-red-50 text-red-600 border-red-200 hover:bg-red-50">
            <AlertTriangle className="w-3 h-3 mr-1" />
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

  const getCategoryBadge = (category: string) => {
    const categoryMap = {
      'job-management': { label: 'Job Management', color: 'bg-blue-50 text-blue-600 border-blue-200' },
      'invoicing': { label: 'Invoicing', color: 'bg-green-50 text-green-600 border-green-200' },
      'materials': { label: 'Materials', color: 'bg-purple-50 text-purple-600 border-purple-200' },
      'timesheets': { label: 'Timesheets', color: 'bg-orange-50 text-orange-600 border-orange-200' },
      'system': { label: 'System', color: 'bg-gray-50 text-gray-600 border-gray-200' }
    }
    
    const categoryInfo = categoryMap[category as keyof typeof categoryMap] || categoryMap.system
    
    return (
      <Badge className={`${categoryInfo.color} hover:${categoryInfo.color}`}>
        {categoryInfo.label}
      </Badge>
    )
  }

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp)
      const now = new Date()
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
      
      if (diffInMinutes < 1) return 'Just now'
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`
      
      const diffInHours = Math.floor(diffInMinutes / 60)
      if (diffInHours < 24) return `${diffInHours}h ago`
      
      const diffInDays = Math.floor(diffInHours / 24)
      if (diffInDays === 1) return 'Yesterday'
      if (diffInDays < 7) return `${diffInDays} days ago`
      
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      })
    } catch {
      return timestamp
    }
  }

  const handleMarkAsRead = (notificationId: string) => {
    setNotifications(notifications.map(notification => 
      notification.id === notificationId 
        ? { ...notification, isRead: true }
        : notification
    ))
  }

  const handleMarkAsUnread = (notificationId: string) => {
    setNotifications(notifications.map(notification => 
      notification.id === notificationId 
        ? { ...notification, isRead: false }
        : notification
    ))
  }

  const handleDeleteNotification = (notificationId: string) => {
    setNotifications(notifications.filter(notification => notification.id !== notificationId))
  }

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map(notification => ({
      ...notification,
      isRead: true
    })))
  }

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = filterType === 'all' || notification.type === filterType
    const matchesPriority = filterPriority === 'all' || notification.priority === filterPriority
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'read' && notification.isRead) ||
                         (filterStatus === 'unread' && !notification.isRead)
    
    const matchesTab = activeTab === 'all' || notification.category === activeTab
    
    return matchesSearch && matchesType && matchesPriority && matchesStatus && matchesTab
  })

  const paginatedNotifications = filteredNotifications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage)

  const unreadCount = notifications.filter(n => !n.isRead).length
  const totalCount = notifications.length

  const categoryCount = {
    'job-management': notifications.filter(n => n.category === 'job-management').length,
    'invoicing': notifications.filter(n => n.category === 'invoicing').length,
    'materials': notifications.filter(n => n.category === 'materials').length,
    'timesheets': notifications.filter(n => n.category === 'timesheets').length,
    'system': notifications.filter(n => n.category === 'system').length
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-[#2b2b2b]">Notifications</h1>
          <p className="text-sm text-[#2b2b2b]/60 mt-1">
            Manage your notifications and stay updated on important activities
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge className="bg-[#E6F6FF] text-[#00A1FF] border-[#00A1FF]/20 hover:bg-[#E6F6FF]">
            {unreadCount} unread
          </Badge>
          <Button 
            onClick={handleMarkAllAsRead}
            variant="outline" 
            className="gap-2"
            disabled={unreadCount === 0}
          >
            <Check className="h-4 w-4" />
            Mark All Read
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white shadow-sm border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Notifications</p>
                <p className="text-2xl font-medium text-[#2b2b2b]">{totalCount}</p>
              </div>
              <div className="w-12 h-12 bg-[#E6F6FF] rounded-lg flex items-center justify-center">
                <Bell className="h-6 w-6 text-[#00A1FF]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unread</p>
                <p className="text-2xl font-medium text-orange-600">{unreadCount}</p>
              </div>
              <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                <BellRing className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">High Priority</p>
                <p className="text-2xl font-medium text-red-600">
                  {notifications.filter(n => n.priority === 'high').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Job Management</p>
                <p className="text-2xl font-medium text-blue-600">{categoryCount['job-management']}</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <Briefcase className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-white shadow-sm border-0">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="booking">Booking</SelectItem>
                <SelectItem value="overtime">Overtime</SelectItem>
                <SelectItem value="invoice">Invoice</SelectItem>
                <SelectItem value="material">Material</SelectItem>
                <SelectItem value="bluesheet">Bluesheet</SelectItem>
                <SelectItem value="job-status">Job Status</SelectItem>
                <SelectItem value="contact">Contact</SelectItem>
                <SelectItem value="assignment">Assignment</SelectItem>
                <SelectItem value="milestone">Milestone</SelectItem>
                <SelectItem value="approval">Approval</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="high">High Priority</SelectItem>
                <SelectItem value="medium">Medium Priority</SelectItem>
                <SelectItem value="low">Low Priority</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="read">Read</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Filter className="h-4 w-4" />
              <span>{filteredNotifications.length} notifications</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Tabs */}
      <Card className="bg-white shadow-sm border-0">
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-auto p-0">
              <TabsTrigger 
                value="all" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#00A1FF] data-[state=active]:bg-transparent"
              >
                All ({totalCount})
              </TabsTrigger>
              <TabsTrigger 
                value="job-management"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#00A1FF] data-[state=active]:bg-transparent"
              >
                Job Management ({categoryCount['job-management']})
              </TabsTrigger>
              <TabsTrigger 
                value="invoicing"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#00A1FF] data-[state=active]:bg-transparent"
              >
                Invoicing ({categoryCount.invoicing})
              </TabsTrigger>
              <TabsTrigger 
                value="materials"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#00A1FF] data-[state=active]:bg-transparent"
              >
                Materials ({categoryCount.materials})
              </TabsTrigger>
              <TabsTrigger 
                value="timesheets"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#00A1FF] data-[state=active]:bg-transparent"
              >
                Timesheets ({categoryCount.timesheets})
              </TabsTrigger>
              <TabsTrigger 
                value="system"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#00A1FF] data-[state=active]:bg-transparent"
              >
                System ({categoryCount.system})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card className="bg-white shadow-sm border-0">
        <CardContent className="p-0">
          {paginatedNotifications.length === 0 ? (
            <div className="p-12 text-center">
              <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-[#2b2b2b] mb-2">No notifications found</h3>
              <p className="text-gray-600">
                {searchTerm || filterType !== 'all' || filterPriority !== 'all' || filterStatus !== 'all'
                  ? 'Try adjusting your search criteria or filters'
                  : 'You\'re all caught up! No notifications to display.'
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {paginatedNotifications.map((notification) => (
                <div 
                  key={notification.id}
                  className={`
                    p-6 hover:bg-gray-50 transition-colors
                    ${!notification.isRead ? 'bg-blue-50 border-l-4 border-[#00A1FF]' : ''}
                  `}
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className={`font-medium ${
                            !notification.isRead ? 'text-[#2b2b2b]' : 'text-gray-900'
                          }`}>
                            {notification.title}
                          </h3>
                          
                          <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center gap-3 mt-3">
                            {getPriorityBadge(notification.priority)}
                            {getCategoryBadge(notification.category)}
                            
                            {notification.relatedId && (
                              <Badge variant="outline" className="text-xs">
                                {notification.relatedId}
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="text-sm text-gray-500">
                            {formatTimestamp(notification.timestamp)}
                          </span>
                          
                          <div className="flex items-center gap-1">
                            {notification.isRead ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMarkAsUnread(notification.id)}
                                className="p-1 h-auto"
                              >
                                <EyeOff className="h-4 w-4 text-gray-400" />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMarkAsRead(notification.id)}
                                className="p-1 h-auto"
                              >
                                <Eye className="h-4 w-4 text-gray-400" />
                              </Button>
                            )}
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteNotification(notification.id)}
                              className="p-1 h-auto text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          {!notification.isRead && (
                            <div className="w-3 h-3 bg-[#00A1FF] rounded-full"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              onClick={() => setCurrentPage(page)}
              className={currentPage === page ? "bg-[#00A1FF] hover:bg-[#0090e6]" : ""}
            >
              {page}
            </Button>
          ))}
          
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}