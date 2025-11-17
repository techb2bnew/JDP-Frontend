'use client'
import { useCallback, useEffect, useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Separator } from './ui/separator'
import { Textarea } from './ui/textarea'
import { Checkbox } from './ui/checkbox'
import { toast } from 'sonner'
import { apiClient } from '../utils/api'
import { usePermissions } from '../contexts/PermissionContext'
import { initFirebaseMessaging, onForegroundMessage } from '../lib/firebase'
import { 
  Bell,
  BellRing,
  Search,
  Filter,
  MoreVertical,
  Clock,
  User,
  Users,
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
  EyeOff,
  Send
} from 'lucide-react'

interface Notification {
  id: string
  type: 'booking' | 'overtime' | 'invoice' | 'material' | 'bluesheet' | 'job-status' | 'contact' | 'assignment' | 'milestone' | 'approval' | 'system'
  title: string
  message: string
  timestamp: string
  isRead: boolean
  priority: 'low' | 'medium' | 'high'
  relatedId?: string
  userRole: 'admin' | 'staff' | 'lead-labor' | 'labor' | 'contractor'
  category: 'job-management' | 'invoicing' | 'materials' | 'timesheets' | 'system'
}

interface Role {
  id: string
  roleName: string
  description?: string
  permissions: string[]
  createdAt?: string
  updatedAt?: string
}

const availableRoles = [
  { value: 'admin', label: 'Admin' },
  { value: 'staff', label: 'Staff' },
  { value: 'lead-labor', label: 'Lead Labor' },
  { value: 'labor', label: 'Labor' }
]

export function NotificationsPage() {
  const { hasPermission } = usePermissions()
  const notificationsApiClient = apiClient as typeof apiClient & {
    sendNotification: (payload: {
      notification_title: string
      message: string
      custom_link?: string
      send_to_all: boolean
      recipient_roles: string[]
    }) => Promise<any>
  }
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [mainTab, setMainTab] = useState<'create' | 'list'>('create')
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    message: '',
    link: '',
    recipientType: 'all' as 'all' | 'roles',
    selectedRoles: [] as string[]
  })
  const [isSending, setIsSending] = useState(false)
  const [formErrors, setFormErrors] = useState<{ title?: string; message?: string; roles?: string }>({})
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [roles, setRoles] = useState<Role[]>([])
  const [isLoadingRoles, setIsLoadingRoles] = useState(false)
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || ''

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


const fetchRoles = useCallback(async () => {
    setIsLoadingRoles(true)
    try {
      const token = localStorage.getItem('jdp_auth')
        ? JSON.parse(localStorage.getItem('jdp_auth')!).token
        : null
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const response = await fetch(`${apiBaseUrl}/permissions/roles-with-permissions`, {
        method: 'GET',
        headers
      })

      if (response.ok) {
        const responseData = await response.json()
        if (responseData.success && responseData.data) {
          const transformedRoles = responseData.data.map((apiRole: any) => ({
            id: apiRole.id.toString(),
            roleName: apiRole.role_name || '',
            description: apiRole.description || '',
            permissions: apiRole.permissions || [],
            createdAt: apiRole.created_at ? apiRole.created_at.split('T')[0] : '',
            updatedAt: apiRole.updated_at ? apiRole.updated_at.split('T')[0] : ''
          }))
          setRoles(transformedRoles)
        } else {
          setRoles([])
        }
      } else {
        setRoles([])
      }
    } catch (error) {
      setRoles([])
    } finally {
      setIsLoadingRoles(false)
    }
  }, [apiBaseUrl])

  useEffect(() => {
    fetchRoles()
  }, [fetchRoles])


  useEffect(() => {
  if (typeof window === 'undefined') return;
  initFirebaseMessaging();
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/firebase-messaging-sw.js')
      .then(reg => {
        console.log('Service Worker registered for FCM:', reg.scope);
      })
      .catch(err => {
        console.warn('SW registration failed:', err);
      });
  }
  const unsubscribe = onForegroundMessage((payload: any) => {
    console.log('FCM foreground message payload:', payload);
    const title = payload.notification?.title || payload.data?.title || 'New Notification';
    const body = payload.notification?.body || payload.data?.message || payload.data?.body || '';
    try {
      if ('Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification(title, { body });
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission().then((perm) => {
            if (perm === 'granted') {
              new Notification(title, { body });
            }
          });
        }
      }
    } catch (e) {
      console.warn('Failed to display native notification', e);
    }

    const data = payload.data || {};
    const incoming: Notification = {
      id: data.id ? data.id.toString() : Date.now().toString(),
      type: (data.type as any) || 'system',
      title: title,
      message: body,
      timestamp: new Date().toISOString(),
      isRead: false,
      priority: (data.priority as any) || 'medium',
      relatedId: data.relatedId || data.link || undefined,
      userRole: (data.userRole as any) || 'admin',
      category: (data.category as any) || 'system'
    };

    setNotifications(prev => [incoming, ...prev]);

    // Show toast with notification details
    try {
      toast.success(title, {
        description: body,
        duration: 5000,
      });
    } catch (e) {
      console.warn('Failed to show toast notification', e);
    }
  });

  return () => {
    try { unsubscribe && unsubscribe() } catch (e) {}
  };
}, []);

  // const handleToggleRecipientRole = (roleId: string) => {
  //   setNotificationForm(prev => {
  //     const exists = prev.selectedRoles.includes(roleId)
  //     const updatedRoles = exists
  //       ? prev.selectedRoles.filter(r => r !== roleId)
  //       : [...prev.selectedRoles, roleId]

  //     setFormErrors(prevErrors => ({
  //       ...prevErrors,
  //       roles: prev.recipientType === 'roles' && updatedRoles.length === 0
  //         ? 'Select at least one role'
  //         : undefined
  //     }))

  //     return {
  //       ...prev,
  //       selectedRoles: updatedRoles
  //     }
  //   })
  // }


const sendNotifications = async () => {
    console.log("Button clicked");
    if (!("Notification" in window)) {
      alert("Browser does not support notifications");
      return;
    }

    console.log("Notification API supported");
    if (Notification.permission !== "granted") {
      const permission = await Notification.requestPermission();
      console.log("Permission result:", permission);

      if (permission !== "granted") {
        alert("Please allow notification permission");
        return;
      }
    }

    console.log("Sending notification...");
    new Notification("Hello Dev 👋", {
      body: "This is your notification test!",
    });
  };

  // const requestNotificationPermission = useCallback(() => {
  //   if ('Notification' in window) {
  //     Notification.requestPermission().then((permission) => {
  //       if (permission === 'granted') {
  //         console.log('Notification granted');
  //         sendNotifications();
  //       }
  //     });
  //   }
  // }, []);

  // useEffect(() => {
  //   if ('Notification' in window) {
  //     requestNotificationPermission();
  //   }
  // }, [requestNotificationPermission]);


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

  const handleToggleRecipientRole = (role: string) => {
    setNotificationForm(prev => {
      const exists = prev.selectedRoles.includes(role)
      const updatedRoles = exists
        ? prev.selectedRoles.filter(r => r !== role)
        : [...prev.selectedRoles, role]
      setFormErrors(prevErrors => ({
        ...prevErrors,
        roles: prev.recipientType === 'roles' && updatedRoles.length === 0
          ? 'Select at least one role'
          : undefined
      }))
      return {
        ...prev,
        selectedRoles: updatedRoles
      }
    })
  }

const handleSendNotification = async () => {
  const errors: { title?: string; message?: string; roles?: string } = {}

  if (!notificationForm.title.trim()) {
    errors.title = 'Notification title is required'
  }

  if (!notificationForm.message.trim()) {
    errors.message = 'Notification message is required'
  }

  if (notificationForm.recipientType === 'roles' && notificationForm.selectedRoles.length === 0) {
    errors.roles = 'Select at least one role'
  }

  setFormErrors(errors)

  if (Object.keys(errors).length > 0) return

  setIsSending(true)

  try {
    const recipientRoles = notificationForm.recipientType === 'roles'
      ? roles
          .filter(role => notificationForm.selectedRoles.includes(role.id))
          .map(role => role.roleName)
      : []

    const payload = {
      notification_title: notificationForm.title.trim(),
      message: notificationForm.message.trim(),
      custom_link: notificationForm.link.trim() || undefined,
      send_to_all: notificationForm.recipientType === 'all',
      recipient_roles: recipientRoles
    }
    await notificationsApiClient.sendNotification(payload)

    const newNotification: Notification = {
      id: Date.now().toString(),
      type: 'system',
      title: notificationForm.title.trim(),
      message: notificationForm.message.trim(),
      timestamp: new Date().toISOString(),
      isRead: false,
      priority: 'medium',
      relatedId: notificationForm.link.trim() || undefined,
      userRole: 'admin',
      category: 'system'
    }
    setNotifications(prev => [newNotification, ...prev])
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(newNotification.title, { body: newNotification.message })
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification(newNotification.title, { body: newNotification.message })
          }
        })
      }
    }

    setNotificationForm({
      title: '',
      message: '',
      link: '',
      recipientType: 'all',
      selectedRoles: []
    })
    setFormErrors({})
    setCurrentPage(1)
    setMainTab('list')
  } catch (error) {
    console.error('Failed to send notification:', error)
    toast.error('Failed to send notification')
  } finally {
    setIsSending(false)
  }
}



  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = filterType === 'all' || notification.type === filterType
    const matchesPriority = filterPriority === 'all' || notification.priority === filterPriority
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'read' && notification.isRead) ||
                         (filterStatus === 'unread' && !notification.isRead)
    
    const matchesCategory = filterCategory === 'all' || notification.category === filterCategory
    
    return matchesSearch && matchesType && matchesPriority && matchesStatus && matchesCategory
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
          {hasPermission('notification', 'edit') && (
            <Button 
              onClick={handleMarkAllAsRead}
              variant="outline" 
              className="gap-2"
              disabled={unreadCount === 0}
            >
              <Check className="h-4 w-4" />
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      <Tabs
        value={mainTab}
        onValueChange={(value) => setMainTab(value as 'create' | 'list')}
        className="space-y-6"
      >
        <Card className="bg-white shadow-md border-0">
          <CardContent className="p-0">
            <TabsList className="grid w-full grid-cols-2 rounded-none   bg-transparent p-0">
              <TabsTrigger
                value="create"
                className="rounded-none border-b-2 border-transparent px-6 py-4 text-sm font-medium text-[#2b2b2b] data-[state=active]:border-[#00A1FF] data-[state=active]:bg-white data-[state=active]:text-[#00A1FF]"
              >
                Create Notification
              </TabsTrigger>
              <TabsTrigger
                value="list"
                className="rounded-none border-b-2 border-transparent px-6 py-4 text-sm font-medium text-[#2b2b2b] data-[state=active]:border-[#00A1FF] data-[state=active]:bg-white data-[state=active]:text-[#00A1FF]"
              >
                Notification List ({totalCount})
              </TabsTrigger>
            </TabsList>
          </CardContent>
        </Card>

        <TabsContent value="create" className="focus:outline-none">
          <Card className="bg-white shadow-md border-0 w-[70%] mx-auto">
            <CardContent className="space-y-6 p-8">
              <div className="space-y-2">
                <label htmlFor="notification-title" className="text-sm font-medium text-[#2b2b2b]">
                  Notification Title <span className="text-red-500">*</span>
                </label>
                <Input
                  id="notification-title"
                  placeholder="Enter notification title"
                  value={notificationForm.title}
                  onChange={(e) => {
                    const value = e.target.value
                    setNotificationForm(prev => ({ ...prev, title: value }))
                    setFormErrors(prev => ({ ...prev, title: undefined }))
                  }}
                />
                {formErrors.title && (
                  <p className="text-sm text-red-500">{formErrors.title}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="notification-message" className="text-sm font-medium text-[#2b2b2b]">
                  Message <span className="text-red-500">*</span>
                </label>
                <Textarea
                  id="notification-message"
                  placeholder="Enter notification message"
                  rows={4}
                  value={notificationForm.message}
                  onChange={(e) => {
                    const value = e.target.value
                    setNotificationForm(prev => ({ ...prev, message: value }))
                    setFormErrors(prev => ({ ...prev, message: undefined }))
                  }}
                />
                {formErrors.message && (
                  <p className="text-sm text-red-500">{formErrors.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="notification-link" className="text-sm font-medium text-[#2b2b2b]">
                  Custom Link (Optional)
                </label>
                <Input
                  id="notification-link"
                  placeholder="Enter a custom URL or path (e.g., /jobs/JOB-2025-001)"
                  value={notificationForm.link}
                  onChange={(e) => setNotificationForm(prev => ({ ...prev, link: e.target.value }))}
                />
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-[#2b2b2b]">Recipients</p>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 text-sm text-[#2b2b2b]">
                    <input
                      type="radio"
                      name="recipient-type"
                      className="h-4 w-4"
                      checked={notificationForm.recipientType === 'all'}
                      onChange={() => {
                        setNotificationForm(prev => ({ ...prev, recipientType: 'all' }))
                        setFormErrors(prev => ({ ...prev, roles: undefined }))
                      }}
                    />
                    Send to all users
                  </label>
                  <label className="flex items-center gap-3 text-sm text-[#2b2b2b]">
                    <input
                      type="radio"
                      name="recipient-type"
                      className="h-4 w-4"
                      checked={notificationForm.recipientType === 'roles'}
                      onChange={() => {
                        setNotificationForm(prev => ({ ...prev, recipientType: 'roles' }))
                        setFormErrors(prev => ({
                          ...prev,
                          roles: notificationForm.selectedRoles.length === 0
                            ? 'Select at least one role'
                            : undefined
                        }))
                      }}
                    /> 
                    Send to specific roles
                  </label>
                </div>

              {notificationForm.recipientType === 'roles' && (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            {isLoadingRoles ? (
              <p>Loading roles...</p>
            ) : roles.length === 0 ? (
              <p>No roles available</p>
            ) : (
              roles.map(role => (
                <label
                  key={role.id}
                  className="flex items-center gap-3 rounded-lg border border-gray-200 bg-[#F9FAFB] p-3 text-sm text-[#2b2b2b]"
                >
                  <Checkbox
                    checked={notificationForm.selectedRoles.includes(role.id)}
                    onCheckedChange={() => handleToggleRecipientRole(role.id)}
                  />
                  {role.roleName}
                </label>
              ))
            )}
          </div>
          {formErrors.roles && (
            <p className="text-sm text-red-500">{formErrors.roles}</p>
          )}
        </div>
      )}
              </div>

              <div className="flex items-center justify-end">
                <Button
                  onClick={handleSendNotification}
                  className="gap-2 text-white"
                  disabled={isSending}
                >
                  <Send className="h-4 w-4" />
                  {isSending ? 'Sending...' : 'Send Notification'}
                </Button>
                {/* <Button
                  onClick={sendNotifications}
                  className="gap-2 text-white"
                  
                >
                  <Send className="h-4 w-4" />
                  Send 
                </Button> */}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list" className="space-y-6 focus:outline-none">
        

          <Card className="bg-white shadow-md border-0">
            <CardContent className="p-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search notifications..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Notifications" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Notifications</SelectItem>
                    <SelectItem value="job-management">Job Management</SelectItem>
                    <SelectItem value="invoicing">Invoicing</SelectItem>
                    <SelectItem value="materials">Materials</SelectItem>
                    <SelectItem value="timesheets">Timesheets</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select> */}

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="unread">Unread</SelectItem>
                    <SelectItem value="read">Read</SelectItem>
                  </SelectContent>
                </Select>

                {/* <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="high">High Priority</SelectItem>
                    <SelectItem value="medium">Medium Priority</SelectItem>
                    <SelectItem value="low">Low Priority</SelectItem>
                  </SelectContent>
                </Select> */}

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Filter className="h-4 w-4" />
                  <span>{filteredNotifications.length} notifications</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md border-0">
            <CardContent className="p-0">
              {paginatedNotifications.length === 0 ? (
                <div className="p-12 text-center">
                  <Bell className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                  <h3 className="mb-2 text-lg font-medium text-[#2b2b2b]">No notifications found</h3>
                  <p className="text-gray-600">
                    {searchTerm || filterCategory !== 'all' || filterPriority !== 'all' || filterStatus !== 'all'
                      ? 'Try adjusting your search criteria or filters'
                      : 'You\'re all caught up! No notifications to display.'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {paginatedNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-6 transition-colors hover:bg-gray-50 ${!notification.isRead ? 'bg-blue-50 border-l-4 border-[#00A1FF]' : ''}`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h3 className={`font-medium ${!notification.isRead ? 'text-[#2b2b2b]' : 'text-gray-900'}`}>
                                {notification.title}
                              </h3>
                              <p className="mt-1 text-sm text-gray-600 leading-relaxed">{notification.message}</p>
                              <div className="mt-3 flex items-center gap-3 text-xs">
                                {getPriorityBadge(notification.priority)}
                                {getCategoryBadge(notification.category)}
                                {notification.relatedId && (
                                  <Badge variant="outline" className="text-xs">
                                    {notification.relatedId}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-gray-500">{formatTimestamp(notification.timestamp)}</span>
                              <div className="flex items-center gap-1">
                                {hasPermission('notification', 'edit') && (
                                  notification.isRead ? (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleMarkAsUnread(notification.id)}
                                      className="h-auto p-1"
                                    >
                                      <EyeOff className="h-4 w-4 text-gray-400" />
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleMarkAsRead(notification.id)}
                                      className="h-auto p-1"
                                    >
                                      <Eye className="h-4 w-4 text-gray-400" />
                                    </Button>
                                  )
                                )}
                                {hasPermission('notification', 'delete') && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteNotification(notification.id)}
                                    className="h-auto p-1 text-red-500 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                              {!notification.isRead && <div className="h-3 w-3 rounded-full bg-[#00A1FF]" />}
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

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <Button
                  key={page}
                  variant={currentPage === page ? 'default' : 'outline'}
                  onClick={() => setCurrentPage(page)}
                  className={currentPage === page ? 'bg-primary text-white hover:bg-[#0090e6]' : ''}
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
        </TabsContent>
      </Tabs>
    </div>
  )
}