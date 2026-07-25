'use client'
import { useCallback, useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog'
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
  recipient_id?: number
  recipient_roles?: string[]
  send_to_all?: boolean
  created_at?: string
  read_at?: string | null
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
  const canCreateNotification = hasPermission('notification', 'create')
  const searchParams = useSearchParams()
  const notificationsApiClient = apiClient as typeof apiClient & {
    sendNotification: (payload: {
      notification_title: string
      message: string
      custom_link?: string
      send_to_all: boolean
      recipient_roles: string[]
      job_id?: number | string
      labor_ids?: string
      lead_labor_ids?: string
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
    recipientType: 'all' as 'all' | 'roles' | 'job',
    selectedRoles: [] as string[]
  })
  const [isSending, setIsSending] = useState(false)
  const [formErrors, setFormErrors] = useState<{ title?: string; message?: string; roles?: string }>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20) // Match API limit
  const [roles, setRoles] = useState<Role[]>([])
  const [isLoadingRoles, setIsLoadingRoles] = useState(false)

  // Job search & selection for targeted notifications
  const [jobSearchTerm, setJobSearchTerm] = useState('')
  const [jobResults, setJobResults] = useState<any[]>([])
  const [isLoadingJobs, setIsLoadingJobs] = useState(false)
  const [isLoadingMoreJobs, setIsLoadingMoreJobs] = useState(false)
  const [jobsPage, setJobsPage] = useState(1)
  const [jobsTotalPages, setJobsTotalPages] = useState(1)
  const [jobsHasMore, setJobsHasMore] = useState(false)
  const [selectedJobs, setSelectedJobs] = useState<any[]>([])
  const [showJobDropdown, setShowJobDropdown] = useState(false)
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || ''

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total_count: 0,
    total_pages: 1,
    unread_count: 0
  })
  const isInitialMount = useRef(true)
  const lastSearchTerm = useRef('')
  const lastPage = useRef(1)
  const lastFilterStatus = useRef('all')
  const jobDropdownRef = useRef<HTMLDivElement>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [notificationToDelete, setNotificationToDelete] = useState<string | null>(null)

  useEffect(() => {
    if (!canCreateNotification && mainTab === 'create') {
      setMainTab('list')
    }
  }, [canCreateNotification, mainTab])

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
      if (!timestamp) return '—'

      // Parse the UTC timestamp and convert to local time
      // If timestamp doesn't have 'Z' or timezone, treat it as UTC
      const utcTimestamp = timestamp.endsWith('Z') ? timestamp : timestamp + 'Z'
      const date = new Date(utcTimestamp)

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return timestamp
      }

      // Get current local time
      const now = new Date()

      // Calculate difference in milliseconds (both dates are in local time after parsing)
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

      if (diffInMinutes < 1) return 'Just now'
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`

      const diffInHours = Math.floor(diffInMinutes / 60)
      if (diffInHours < 24) return `${diffInHours}h ago`

      const diffInDays = Math.floor(diffInHours / 24)
      if (diffInDays === 1) return 'Yesterday'
      if (diffInDays < 7) return `${diffInDays} days ago`

      // Format as local date
      return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' })
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

  const fetchJobsForNotification = useCallback(
    async (query: string, page: number = 1, append: boolean = false) => {
      try {
        if (page === 1) {
          setIsLoadingJobs(true)
        } else {
          setIsLoadingMoreJobs(true)
        }
        const trimmedQuery = query.trim()
        // Empty query -> default job listing; non-empty -> search API
        // (search API doesn't return results for an empty "q")
        const response = trimmedQuery
          ? await apiClient.searchJobsByQuery(trimmedQuery, page, 10)
          : await apiClient.getJobs(page, 10)

        let jobs: any[] = []
        if (Array.isArray(response?.data?.jobs)) {
          jobs = response.data.jobs
        } else if (Array.isArray(response?.data)) {
          jobs = response.data
        } else if (Array.isArray(response?.data?.data)) {
          jobs = response.data.data
        } else if (Array.isArray(response?.jobs)) {
          jobs = response.jobs
        }

        const transformedJobs = jobs.map((job: any) => ({
          id: job.id?.toString() || '',
          title: job.job_title || job.title || '',
          customerName:
            job.customerName ||
            job.customer?.customer_name ||
            job.customer?.name ||
            '',
          address: job.address || job.location || '',
          assignedLeadLabor:
            job.assigned_lead_labor?.map((l: any) => ({
              id: l.id,
              name: l.user?.full_name || l.full_name || '',
            })) || [],
          assignedLabor:
            job.assigned_labor?.map((l: any) => ({
              id: l.id,
              name: l.user?.full_name || l.full_name || '',
            })) || [],
          // Preserve original IDs strings as fallback
          assigned_labor_ids: job.assigned_labor_ids,
          assigned_lead_labor_ids: job.assigned_lead_labor_ids,
        }))

        const paginationInfo = response?.data?.pagination
        const totalPages =
          Number(paginationInfo?.totalPages ?? response?.totalPages ?? 1) || 1
        const currentPage =
          Number(paginationInfo?.page ?? response?.currentPage ?? page) ||
          page

        setJobResults((prev) => {
          const merged = append ? [...prev, ...transformedJobs] : transformedJobs
          const seen = new Set<string>()
          return merged.filter((job) => {
            const id = String(job?.id ?? '')
            if (!id || seen.has(id)) return false
            seen.add(id)
            return true
          })
        })
        setJobsPage(currentPage)
        setJobsTotalPages(totalPages)
        setJobsHasMore(currentPage < totalPages)
      } catch (error) {
        console.error('Error fetching jobs for notifications:', error)
        if (!append) {
          setJobResults([])
        }
        setJobsPage(1)
        setJobsTotalPages(1)
        setJobsHasMore(false)
      } finally {
        setIsLoadingJobs(false)
        setIsLoadingMoreJobs(false)
      }
    },
    []
  )

  const handleJobsDropdownScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
      const nearBottom = scrollHeight - scrollTop - clientHeight < 50

      if (
        !nearBottom ||
        !jobsHasMore ||
        isLoadingJobs ||
        isLoadingMoreJobs ||
        jobsPage >= jobsTotalPages
      ) {
        return
      }

      void fetchJobsForNotification(jobSearchTerm, jobsPage + 1, true)
    },
    [
      jobsHasMore,
      isLoadingJobs,
      isLoadingMoreJobs,
      jobsPage,
      jobsTotalPages,
      jobSearchTerm,
      fetchJobsForNotification,
    ]
  )

  // Debounced job search
  useEffect(() => {
    if (!showJobDropdown) return

    const trimmed = jobSearchTerm.trim()
    const timeout = setTimeout(() => {
      fetchJobsForNotification(trimmed, 1, false)
    }, 400)

    return () => clearTimeout(timeout)
  }, [jobSearchTerm, showJobDropdown, fetchJobsForNotification])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (jobDropdownRef.current && !jobDropdownRef.current.contains(event.target as Node)) {
        setShowJobDropdown(false)
      }
    }

    if (showJobDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showJobDropdown])

  // Helper function to transform API response
  const transformNotifications = (items: any[]): Notification[] => {
    return items.map((apiNotification: any) => {
      // Access nested notification data if it exists
      const notificationData = apiNotification.notification || {}
      const rawRecipientRoles =
        notificationData.recipient_roles ??
        apiNotification.recipient_roles ??
        []

      let recipientRoles: string[] = []
      if (Array.isArray(rawRecipientRoles)) {
        recipientRoles = rawRecipientRoles.map((role) => String(role || '').trim()).filter(Boolean)
      } else if (typeof rawRecipientRoles === 'string') {
        try {
          const parsed = JSON.parse(rawRecipientRoles)
          recipientRoles = Array.isArray(parsed)
            ? parsed.map((role) => String(role || '').trim()).filter(Boolean)
            : rawRecipientRoles.split(',').map((role) => role.trim()).filter(Boolean)
        } catch {
          recipientRoles = rawRecipientRoles.split(',').map((role) => role.trim()).filter(Boolean)
        }
      }

      return {
        id: apiNotification.notification_id?.toString() || apiNotification.id?.toString() || Date.now().toString(),
        type: (notificationData.type || apiNotification.type || 'system') as Notification['type'],
        title: notificationData.notification_title || notificationData.title || apiNotification.notification_title || 'Notification',
        message: notificationData.message || apiNotification.message || '',
        timestamp: apiNotification.delivered_at || notificationData.created_at || apiNotification.timestamp || new Date().toISOString(),
        isRead: apiNotification.status === 'read' || apiNotification.is_read || false,
        priority: (notificationData.priority || apiNotification.priority || 'medium') as Notification['priority'],
        relatedId: notificationData.custom_link || apiNotification.custom_link || notificationData.related_id || apiNotification.relatedId || undefined,
        userRole: (notificationData.user_role || apiNotification.user_role || 'admin') as Notification['userRole'],
        category: (notificationData.category || apiNotification.category || 'system') as Notification['category'],
        recipient_id: apiNotification.recipient_id,
        recipient_roles: recipientRoles,
        send_to_all: Boolean(notificationData.send_to_all ?? apiNotification.send_to_all),
        created_at: notificationData.created_at || apiNotification.created_at,
        read_at: apiNotification.read_at
      }
    })
  }

  const normalizeRoleKey = (value: string): string => {
    return String(value || '')
      .toLowerCase()
      .replace(/[_\s-]/g, '')
      .trim()
  }

  const isVisibleForCurrentUser = (notification: Notification, userId: number, userRole: string): boolean => {
    if (notification.send_to_all) return true
    if (Number(notification.recipient_id) === Number(userId)) return true

    const normalizedCurrentRole = normalizeRoleKey(userRole)
    if (!normalizedCurrentRole) return false

    return (notification.recipient_roles || []).some(
      (role) => normalizeRoleKey(role) === normalizedCurrentRole
    )
  }

  // Fetch notifications for the logged-in user
  const fetchUserNotifications = useCallback(async (page: number) => {
    try {
      // Get user ID from localStorage
      const authData = localStorage.getItem('jdp_auth')
      if (!authData) {
        console.warn('No auth data found in localStorage')
        return
      }

      const parsedAuth = JSON.parse(authData)
      const userId = parsedAuth?.user?.id

      if (!userId) {
        console.warn('User ID not found in auth data')
        return
      }

      setIsLoadingNotifications(true)

      const token = parsedAuth?.token
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      // Add pagination parameters
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString()
      })

      const response = await fetch(`${apiBaseUrl}/notifications/user/${userId}?${queryParams}`, {
        method: 'GET',
        headers
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.statusText}`)
      }

      const responseData = await response.json()
      console.log('Notifications API response:', responseData)

      if (responseData.success && responseData.data?.items) {
        const transformedNotifications = transformNotifications(responseData.data.items)

        // Fallback merge for role-based notifications in case user endpoint omits them.
        let mergedNotifications = [...transformedNotifications]
        const userRole = String(parsedAuth?.user?.role || '')

        try {
          const roleResponse = await fetch(`${apiBaseUrl}/notifications/search?${queryParams}`, {
            method: 'GET',
            headers
          })

          if (roleResponse.ok) {
            const roleData = await roleResponse.json()
            if (roleData?.success && roleData?.data?.items) {
              const transformedRoleItems = transformNotifications(roleData.data.items)
                .filter((item) => isVisibleForCurrentUser(item, Number(userId), userRole))

              const uniqueById = new Map<string, Notification>()
              ;[...transformedNotifications, ...transformedRoleItems].forEach((item) => {
                uniqueById.set(String(item.id), item)
              })
              mergedNotifications = Array.from(uniqueById.values())
            }
          }
        } catch (mergeError) {
          console.warn('Role-notification merge fallback failed:', mergeError)
        }

        setNotifications(mergedNotifications)

        // Update pagination state
        if (responseData.data?.pagination) {
          setPagination(responseData.data.pagination)
          setCurrentPage(responseData.data.pagination.page)
        }
      } else {
        console.warn('Invalid API response structure:', responseData)
        setNotifications([])
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
      toast.error('Failed to load notifications')
      setNotifications([])
    } finally {
      setIsLoadingNotifications(false)
    }
  }, [apiBaseUrl, itemsPerPage])

  // Search notifications
  const searchNotifications = useCallback(async (searchQuery: string, page: number = 1, status?: string) => {
    try {
      const authData = localStorage.getItem('jdp_auth')
      if (!authData) {
        console.warn('No auth data found in localStorage')
        return
      }

      const parsedAuth = JSON.parse(authData)
      const token = parsedAuth?.token

      setIsLoadingNotifications(true)

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      // Add search, status, and pagination parameters
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString()
      })

      if (searchQuery.trim()) {
        queryParams.append('search', searchQuery.trim())
      }

      if (status && status !== 'all') {
        queryParams.append('status', status)
      }

      const response = await fetch(`${apiBaseUrl}/notifications/search?${queryParams}`, {
        method: 'GET',
        headers
      })

      if (!response.ok) {
        throw new Error(`Failed to search notifications: ${response.statusText}`)
      }

      const responseData = await response.json()
      console.log('Search API response:', responseData)

      if (responseData.success && responseData.data?.items) {
        const transformedNotifications = transformNotifications(responseData.data.items)
        const currentUserId = Number(parsedAuth?.user?.id || 0)
        const currentUserRole = String(parsedAuth?.user?.role || '')
        const visibleNotifications = transformedNotifications.filter((item) =>
          isVisibleForCurrentUser(item, currentUserId, currentUserRole)
        )
        setNotifications(visibleNotifications)

        // Update pagination state
        if (responseData.data?.pagination) {
          setPagination(responseData.data.pagination)
          setCurrentPage(responseData.data.pagination.page)
        }
      } else {
        console.warn('Invalid search API response structure:', responseData)
        setNotifications([])
      }
    } catch (error) {
      console.error('Error searching notifications:', error)
      toast.error('Failed to search notifications')
      setNotifications([])
    } finally {
      setIsLoadingNotifications(false)
    }
  }, [apiBaseUrl, itemsPerPage])

  // Initial fetch on mount (only once)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      fetchUserNotifications(1)
    }

    // Handle tab selection from URL search params
    const tabParam = searchParams.get('tab')
    if (tabParam === 'list' || tabParam === 'create') {
      setMainTab(tabParam as 'create' | 'list')
    }
  }, [searchParams])

  // Handle status filter changes
  useEffect(() => {
    // Skip if status hasn't changed or if it's initial mount
    if (filterStatus === lastFilterStatus.current || isInitialMount.current) {
      return
    }

    lastFilterStatus.current = filterStatus

    // If status is 'all' and no search term, use regular fetch
    if (filterStatus === 'all' && !searchTerm.trim()) {
      setCurrentPage(1)
      lastPage.current = 1
      fetchUserNotifications(1)
      return
    }

    // Otherwise use search API with status filter
    setCurrentPage(1)
    lastPage.current = 1
    const statusToUse = filterStatus !== 'all' ? filterStatus : undefined
    searchNotifications(searchTerm.trim() || '', 1, statusToUse)
  }, [filterStatus])

  // Debounce search input
  useEffect(() => {
    // Skip if search term hasn't changed
    if (searchTerm === lastSearchTerm.current) {
      return
    }

    lastSearchTerm.current = searchTerm

    if (!searchTerm.trim() && filterStatus === 'all') {
      // If search is cleared and no status filter, fetch regular notifications
      if (lastPage.current !== 1) {
        setCurrentPage(1)
        lastPage.current = 1
      }
      fetchUserNotifications(1)
      return
    }

    const debounceTimeout = setTimeout(() => {
      setCurrentPage(1) // Reset to page 1 when searching/filtering
      lastPage.current = 1
      const statusToUse = filterStatus !== 'all' ? filterStatus : undefined
      searchNotifications(searchTerm.trim() || '', 1, statusToUse)
    }, 500) // 500ms debounce

    return () => clearTimeout(debounceTimeout)
  }, [searchTerm])

  // Handle page changes (only when page actually changes, not on initial mount)
  useEffect(() => {
    // Skip initial mount (handled by initial fetch)
    if (isInitialMount.current) {
      return
    }

    // Skip if page hasn't actually changed
    if (currentPage === lastPage.current) {
      return
    }

    lastPage.current = currentPage

    if (searchTerm.trim() || filterStatus !== 'all') {
      const statusToUse = filterStatus !== 'all' ? filterStatus : undefined
      searchNotifications(searchTerm.trim() || '', currentPage, statusToUse)
    } else {
      fetchUserNotifications(currentPage)
    }
  }, [currentPage, filterStatus])


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
      console.log('🔔 FCM notification received:', payload);

      // Extract title and body
      const title = payload.notification?.title || payload.data?.title || 'New Notification';
      const body = payload.notification?.body || payload.data?.message || payload.data?.body || '';
      console.log(title,'titletitle')
      console.log(body,'bodybodybody')
      // Show native browser notification
      try {
        if ('Notification' in window && Notification.permission === 'granted') {
          const notification = new Notification(title, {
            body: body,
            icon: payload.notification?.icon || '/favicon.ico',
            badge: '/favicon.ico',
            tag: payload.messageId || Date.now().toString(),
            requireInteraction: false,
            silent: false, // Make sure notification makes sound
            data: payload.data || {}
          });

          // Auto close after 15 seconds (increased for better visibility)
          setTimeout(() => {
            notification.close();
          }, 15000);

          // Handle notification click
          notification.onclick = (event) => {
            event.preventDefault();
            window.focus();
            // If there's a custom link, open it
            if (payload.data?.custom_link || payload.fcmOptions?.link) {
              window.open(payload.data?.custom_link || payload.fcmOptions?.link, '_blank');
            }
            notification.close();
          };

          notification.onerror = (error) => {
            console.error('Notification error:', error);
          };

          notification.onshow = () => {
            console.log('✅ Browser notification displayed successfully');
          };

          notification.onclose = () => {
            console.log('Notification closed');
          };
        } else if ('Notification' in window && Notification.permission !== 'denied') {
          // Request permission if not already denied
          Notification.requestPermission().then((perm) => {
            if (perm === 'granted') {
              const notification = new Notification(title, {
                body: body,
                icon: payload.notification?.icon || '/favicon.ico',
                badge: '/favicon.ico',
                tag: payload.messageId || Date.now().toString(),
                requireInteraction: false,
                silent: false,
                data: payload.data || {}
              });

              setTimeout(() => {
                notification.close();
              }, 15000);

              notification.onclick = (event) => {
                event.preventDefault();
                window.focus();
                if (payload.data?.custom_link || payload.fcmOptions?.link) {
                  window.open(payload.data?.custom_link || payload.fcmOptions?.link, '_blank');
                }
                notification.close();
              };

              notification.onshow = () => {
                console.log('✅ Browser notification displayed after permission grant');
              };
            }
          });
        }
      } catch (e) {
        console.error('Error creating notification:', e);
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
        // toast.success(title, {
        //   description: body,
        //   duration: 5000,
        // });
      } catch (e) {
        console.warn('Failed to show toast notification', e);
      }
    });

    return () => {
      try { unsubscribe && unsubscribe() } catch (e) { }
    };
  }, []);




  const handleMarkAsRead = async (notificationId: string) => {
    try {
      // Find the notification to get recipient_id
      const notification = notifications.find(n => n.id === notificationId)

      if (!notification || !notification.recipient_id) {
        toast.error('Notification not found or recipient ID missing')
        return
      }

      const authData = localStorage.getItem('jdp_auth')
      if (!authData) {
        toast.error('User not authenticated')
        return
      }

      const parsedAuth = JSON.parse(authData)
      const token = parsedAuth?.token
      const headers: Record<string, string> = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`${apiBaseUrl}/notifications/markNotificationAsRead/${notification.recipient_id}/read`, {
        method: 'PUT',
        headers
      })

      if (!response.ok) {
        throw new Error('Failed to mark notification as read')
      }

      const responseData = await response.json()

      if (responseData.success) {
        // Update local state
        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId
              ? { ...n, isRead: true, read_at: new Date().toISOString() }
              : n
          )
        )

        // Update pagination unread count
        const nextUnreadCount = Math.max(0, pagination.unread_count - 1)
        setPagination(prev => ({
          ...prev,
          unread_count: nextUnreadCount
        }))
        window.dispatchEvent(
          new CustomEvent('notificationsUnreadCountUpdated', {
            detail: { count: nextUnreadCount }
          })
        )

        toast.success('Notification marked as read')
      } else {
        throw new Error(responseData.message || 'Failed to mark notification as read')
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
      toast.error('Failed to mark notification as read')
    }
  }

  const handleMarkAsUnread = (notificationId: string) => {
    // For now, just update local state
    // If there's an API for unread, we can add it later
    setNotifications(notifications.map(notification =>
      notification.id === notificationId
        ? { ...notification, isRead: false, read_at: null }
        : notification
    ))

    // Update pagination unread count
    setPagination(prev => ({
      ...prev,
      unread_count: prev.unread_count + 1
    }))
  }

  const handleDeleteClick = (notificationId: string) => {
    setNotificationToDelete(notificationId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteNotification = async () => {
    if (!notificationToDelete) return

    try {
      // Find the notification to get recipient_id
      const notification = notifications.find(n => n.id === notificationToDelete)

      if (!notification || !notification.recipient_id) {
        toast.error('Notification not found or recipient ID missing')
        setDeleteDialogOpen(false)
        setNotificationToDelete(null)
        return
      }

      const authData = localStorage.getItem('jdp_auth')
      if (!authData) {
        toast.error('User not authenticated')
        setDeleteDialogOpen(false)
        setNotificationToDelete(null)
        return
      }

      const parsedAuth = JSON.parse(authData)
      const token = parsedAuth?.token
      const headers: Record<string, string> = {
      }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`${apiBaseUrl}/notifications/deleteNotificationRecipient/${notification.recipient_id}`, {
        method: 'DELETE',
        headers
      })

      if (!response.ok) {
        throw new Error('Failed to delete notification')
      }

      const responseData = await response.json()

      if (responseData.success) {
        // Remove notification from local state
        setNotifications(notifications.filter(n => n.id !== notificationToDelete))

        // Update pagination total count
        setPagination(prev => ({
          ...prev,
          total_count: Math.max(0, prev.total_count - 1)
        }))

        toast.success('Notification deleted successfully')
        setDeleteDialogOpen(false)
        setNotificationToDelete(null)
      } else {
        throw new Error(responseData.message || 'Failed to delete notification')
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
      toast.error('Failed to delete notification')
      setDeleteDialogOpen(false)
      setNotificationToDelete(null)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      // Get user ID from localStorage
      const authData = localStorage.getItem('jdp_auth')
      if (!authData) {
        toast.error('User not authenticated')
        return
      }

      const parsedAuth = JSON.parse(authData)
      const userId = parsedAuth?.user?.id

      if (!userId) {
        toast.error('User ID not found')
        return
      }

      const token = parsedAuth?.token
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`${apiBaseUrl}/notifications/markAllAsRead`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          user_id: userId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read')
      }

      const responseData = await response.json()

      if (responseData.success) {
        // Update local state
        setNotifications(prev =>
          prev.map(notification => ({
            ...notification,
            isRead: true
          }))
        )

        // Update pagination unread count
        setPagination(prev => ({
          ...prev,
          unread_count: 0
        }))
        window.dispatchEvent(
          new CustomEvent('notificationsUnreadCountUpdated', {
            detail: { count: 0 }
          })
        )

        // Re-sync from API to avoid any stale counter flash
        await fetchUserNotifications(currentPage)

        toast.success('All notifications marked as read')
      } else {
        throw new Error(responseData.message || 'Failed to mark all notifications as read')
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      toast.error('Failed to mark all notifications as read')
    }
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

    if (notificationForm.recipientType === 'job' && selectedJobs.length === 0) {
      errors.roles = 'Select at least one job'
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

      // Build job-based recipient IDs (labor & lead labor) from selected jobs
      let jobId: number | string | undefined
      let laborIds: (number | string)[] = []
      let leadLaborIds: (number | string)[] = []

      if (notificationForm.recipientType === 'job' && selectedJobs.length > 0) {
        // Collect all labor and lead labor IDs from all selected jobs
        const allLaborIds = new Set<number | string>()
        const allLeadLaborIds = new Set<number | string>()
        const jobsMissingLaborInfo: any[] = []

        selectedJobs.forEach((job) => {
          // Try to get IDs from arrays first
          const labor = (job.assignedLabor || []).map((l: any) => l.id).filter(Boolean)
          const leadLabor = (job.assignedLeadLabor || []).map((l: any) => l.id).filter(Boolean)

          let laborFound = false
          let leadLaborFound = false

          // If arrays have data, use them
          if (labor.length > 0) {
            labor.forEach((id: number | string) => allLaborIds.add(id))
            laborFound = true
          } else if (job.assigned_labor_ids) {
            // Fallback: parse from string if array is empty
            try {
              const parsed = typeof job.assigned_labor_ids === 'string'
                ? JSON.parse(job.assigned_labor_ids)
                : job.assigned_labor_ids
              if (Array.isArray(parsed) && parsed.length > 0) {
                parsed.forEach((id: number | string) => allLaborIds.add(id))
                laborFound = true
              }
            } catch (e) {
              console.error('Error parsing assigned_labor_ids:', e)
            }
          }

          if (leadLabor.length > 0) {
            leadLabor.forEach((id: number | string) => allLeadLaborIds.add(id))
            leadLaborFound = true
          } else if (job.assigned_lead_labor_ids) {
            // Fallback: parse from string if array is empty
            try {
              const parsed = typeof job.assigned_lead_labor_ids === 'string'
                ? JSON.parse(job.assigned_lead_labor_ids)
                : job.assigned_lead_labor_ids
              if (Array.isArray(parsed) && parsed.length > 0) {
                parsed.forEach((id: number | string) => allLeadLaborIds.add(id))
                leadLaborFound = true
              }
            } catch (e) {
              console.error('Error parsing assigned_lead_labor_ids:', e)
            }
          }

          // Job search results don't always include assigned labor/lead labor,
          // so re-fetch full job details for jobs where nothing was found.
          if (!laborFound && !leadLaborFound) {
            jobsMissingLaborInfo.push(job)
          }
        })

        if (jobsMissingLaborInfo.length > 0) {
          const authData = localStorage.getItem('jdp_auth')
          const token = authData ? JSON.parse(authData).token : null
          const headers: Record<string, string> = { 'Content-Type': 'application/json' }
          if (token) headers['Authorization'] = `Bearer ${token}`

          await Promise.all(
            jobsMissingLaborInfo.map(async (job) => {
              try {
                const res = await fetch(`${apiBaseUrl}/job/getJobById/${job.id}`, {
                  method: 'GET',
                  headers
                })
                if (!res.ok) return
                const result = await res.json()
                const jobData = result?.data
                if (!jobData) return

                ;(jobData.assigned_labor || []).forEach((l: any) => {
                  if (l?.id) allLaborIds.add(l.id)
                })
                ;(jobData.assigned_lead_labor || []).forEach((ll: any) => {
                  if (ll?.id) allLeadLaborIds.add(ll.id)
                })
              } catch (e) {
                console.error('Error fetching job details for notification recipients:', e)
              }
            })
          )
        }

        laborIds = Array.from(allLaborIds)
        leadLaborIds = Array.from(allLeadLaborIds)

        // If only one job selected, include job_id
        if (selectedJobs.length === 1) {
          jobId = selectedJobs[0].id
        }

        if (laborIds.length === 0 && leadLaborIds.length === 0) {
          setFormErrors((prev) => ({
            ...prev,
            roles: 'Selected job(s) have no assigned labor or lead labor to notify'
          }))
          setIsSending(false)
          return
        }
      }

      const payload: any = {
        notification_title: notificationForm.title.trim(),
        message: notificationForm.message.trim(),
        custom_link: notificationForm.link.trim() || undefined,
        send_to_all: notificationForm.recipientType === 'all',
        recipient_roles: recipientRoles
      }

      if (jobId) {
        payload.job_id = jobId
      }
      if (laborIds && laborIds.length > 0) {
        payload.labor_ids = JSON.stringify(laborIds)
      }
      if (leadLaborIds && leadLaborIds.length > 0) {
        payload.lead_labor_ids = JSON.stringify(leadLaborIds)
      }
      await notificationsApiClient.sendNotification(payload)

      toast.success('Notification sent successfully')

      // Refresh notifications list from API
      await fetchUserNotifications(currentPage)

      setNotificationForm({
        title: '',
        message: '',
        link: '',
        recipientType: 'all',
        selectedRoles: []
      })
      setFormErrors({})
      setSelectedJobs([])
      setJobSearchTerm('')
      setShowJobDropdown(false)
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

  // Use API pagination - no need to slice since API handles pagination
  const paginatedNotifications = filteredNotifications

  // Use pagination from API response
  const totalPages = pagination.total_pages || 1

  const unreadCount = pagination.unread_count
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
          {hasPermission("notification", "edit") && (
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
        onValueChange={(value) => setMainTab(value as "create" | "list")}
        className="space-y-6"
      >
        <Card className="bg-white shadow-md border-0 overflow-hidden">
          <CardContent className="p-0">
            <div className="border-b border-gray-100">
              <TabsList
                className={`grid w-full ${canCreateNotification ? "grid-cols-2" : "grid-cols-1"} bg-transparent h-12 p-0 gap-0`}
              >
                {canCreateNotification && (
                  <TabsTrigger
                    value="create"
                    className="flex items-center gap-2 data-[state=active]:bg-[#00A1FF] data-[state=active]:text-white rounded-none"
                  >
                    <Send className="h-4 w-4" />
                    Create Notification
                  </TabsTrigger>
                )}
                <TabsTrigger
                  value="list"
                  className="flex items-center gap-2 data-[state=active]:bg-[#00A1FF] data-[state=active]:text-white rounded-none"
                >
                  <Bell className="h-4 w-4" />
                  Notification List (
                  {pagination.total_count || filteredNotifications.length})
                </TabsTrigger>
              </TabsList>
            </div>
          </CardContent>
        </Card>

        {canCreateNotification && (
          <TabsContent value="create" className="focus:outline-none">
            <Card className="bg-white shadow-md border-0 w-[70%] mx-auto">
              <CardContent className="space-y-6 p-8">
                <div className="space-y-2">
                  <label
                    htmlFor="notification-title"
                    className="text-sm font-medium text-[#2b2b2b]"
                  >
                    Notification Title <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="notification-title"
                    placeholder="Enter notification title"
                    value={notificationForm.title}
                    onChange={(e) => {
                      const value = e.target.value;
                      setNotificationForm((prev) => ({
                        ...prev,
                        title: value,
                      }));
                      setFormErrors((prev) => ({ ...prev, title: undefined }));
                    }}
                  />
                  {formErrors.title && (
                    <p className="text-sm text-red-500">{formErrors.title}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="notification-message"
                    className="text-sm font-medium text-[#2b2b2b]"
                  >
                    Message <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    id="notification-message"
                    placeholder="Enter notification message"
                    rows={4}
                    value={notificationForm.message}
                    onChange={(e) => {
                      const value = e.target.value;
                      setNotificationForm((prev) => ({
                        ...prev,
                        message: value,
                      }));
                      setFormErrors((prev) => ({
                        ...prev,
                        message: undefined,
                      }));
                    }}
                  />
                  {formErrors.message && (
                    <p className="text-sm text-red-500">{formErrors.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="notification-link"
                    className="text-sm font-medium text-[#2b2b2b]"
                  >
                    Custom Link (Optional)
                  </label>
                  <Input
                    id="notification-link"
                    placeholder="Enter a custom URL or path (e.g., /jobs/JOB-2025-001)"
                    value={notificationForm.link}
                    onChange={(e) =>
                      setNotificationForm((prev) => ({
                        ...prev,
                        link: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-medium text-[#2b2b2b]">
                    Recipients
                  </p>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 text-sm text-[#2b2b2b]">
                      <input
                        type="radio"
                        name="recipient-type"
                        className="h-4 w-4"
                        checked={notificationForm.recipientType === "all"}
                        onChange={() => {
                          setNotificationForm((prev) => ({
                            ...prev,
                            recipientType: "all",
                          }));
                          setFormErrors((prev) => ({
                            ...prev,
                            roles: undefined,
                          }));
                        }}
                      />
                      Send to all users
                    </label>
                    <label className="flex items-center gap-3 text-sm text-[#2b2b2b]">
                      <input
                        type="radio"
                        name="recipient-type"
                        className="h-4 w-4"
                        checked={notificationForm.recipientType === "roles"}
                        onChange={() => {
                          setNotificationForm((prev) => ({
                            ...prev,
                            recipientType: "roles",
                          }));
                          setFormErrors((prev) => ({
                            ...prev,
                            roles:
                              notificationForm.selectedRoles.length === 0
                                ? "Select at least one role"
                                : undefined,
                          }));
                          setShowJobDropdown(false);
                        }}
                      />
                      Send to specific roles
                    </label>
                    <label className="flex items-center gap-3 text-sm text-[#2b2b2b]">
                      <input
                        type="radio"
                        name="recipient-type"
                        className="h-4 w-4"
                        checked={notificationForm.recipientType === "job"}
                        onChange={() => {
                          setNotificationForm((prev) => ({
                            ...prev,
                            recipientType: "job",
                          }));
                          setFormErrors((prev) => ({
                            ...prev,
                            roles: undefined,
                          }));
                          setShowJobDropdown(true);
                          if (jobResults.length === 0) {
                            fetchJobsForNotification("");
                          }
                        }}
                      />
                      Send to specific job
                    </label>
                  </div>

                  {notificationForm.recipientType === "roles" && (
                    <div className="space-y-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        {isLoadingRoles ? (
                          <p>Loading roles...</p>
                        ) : roles.length === 0 ? (
                          <p>No roles available</p>
                        ) : (
                          roles.map((role) => (
                            <label
                              key={role.id}
                              className="flex items-center gap-3 rounded-lg border border-gray-200 bg-[#F9FAFB] p-3 text-sm text-[#2b2b2b]"
                            >
                              <Checkbox
                                checked={notificationForm.selectedRoles.includes(
                                  role.id,
                                )}
                                onCheckedChange={() =>
                                  handleToggleRecipientRole(role.id)
                                }
                              />
                              {role.roleName}
                            </label>
                          ))
                        )}
                      </div>
                      {formErrors.roles && (
                        <p className="text-sm text-red-500">
                          {formErrors.roles}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Job Selection - Show only when "Send to specific job" is selected */}
                {notificationForm.recipientType === "job" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#2b2b2b]">
                      Select Jobs
                    </label>
                    <div className="relative" ref={jobDropdownRef}>
                      <Input
                        placeholder="Search jobs..."
                        value={jobSearchTerm}
                        onChange={(e) => {
                          setJobSearchTerm(e.target.value);
                          setShowJobDropdown(true);
                        }}
                        onFocus={() => {
                          setShowJobDropdown(true);
                          if (jobResults.length === 0) {
                            fetchJobsForNotification("");
                          }
                        }}
                        className="pl-8"
                      />
                      <Search className="absolute left-2.5 top-[20px] h-4 w-4 -translate-y-1/2 text-gray-400" />

                      {showJobDropdown && (
                        <div
                          className="absolute z-20 mt-1 max-h-[180px] w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg"
                          onScroll={handleJobsDropdownScroll}
                        >
                          {isLoadingJobs ? (
                            <div className="p-3 text-sm text-gray-500">
                              Searching jobs...
                            </div>
                          ) : jobResults.length === 0 ? (
                            <div className="p-3 text-sm text-gray-500">
                              No jobs found
                            </div>
                          ) : (
                            jobResults.map((job) => {
                              const isSelected = selectedJobs.some(
                                (j) => j.id === job.id,
                              );
                              return (
                                <button
                                  key={job.id}
                                  type="button"
                                  onClick={() => {
                                    if (isSelected) {
                                      setSelectedJobs((prev) =>
                                        prev.filter((j) => j.id !== job.id),
                                      );
                                    } else {
                                      setSelectedJobs((prev) => [...prev, job]);
                                    }
                                  }}
                                  className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50"
                                >
                                  <Checkbox
                                    checked={isSelected}
                                    className="pointer-events-none"
                                    tabIndex={-1}
                                  />
                                  <Briefcase className="mt-0.5 h-4 w-4 text-gray-500" />
                                  <div className="flex-1">
                                    <p className="font-medium text-[#2b2b2b]">
                                      {job.title || "Untitled Job"}
                                    </p>
                                    {(job.customerName || job.address) && (
                                      <p className="text-xs text-gray-500">
                                        {[job.customerName, job.address]
                                          .filter(Boolean)
                                          .join(" • ")}
                                      </p>
                                    )}
                                  </div>
                                </button>
                              );
                            })
                          )}
                          {isLoadingMoreJobs && (
                            <div className="p-3 text-center text-xs text-gray-500">
                              Loading more jobs...
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {selectedJobs.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <p className="text-xs text-gray-500">
                          Selected {selectedJobs.length} job
                          {selectedJobs.length > 1 ? "s" : ""}:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {selectedJobs.map((job) => (
                            <Badge
                              key={job.id}
                              variant="secondary"
                              className="flex items-center gap-1"
                            >
                              {job.title || `Job ${job.id}`}
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedJobs((prev) =>
                                    prev.filter((j) => j.id !== job.id),
                                  );
                                }}
                                className="ml-1 hover:text-red-500"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {formErrors.roles &&
                      notificationForm.recipientType === "job" && (
                        <p className="mt-1 text-sm text-red-500">
                          {formErrors.roles}
                        </p>
                      )}
                  </div>
                )}

                <div className="flex items-center justify-end">
                  <Button
                    onClick={handleSendNotification}
                    className="gap-2 text-white"
                    disabled={isSending}
                  >
                    <Send className="h-4 w-4" />
                    {isSending ? "Sending..." : "Send Notification"}
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
        )}

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

                <Select
                  value={filterStatus}
                  onValueChange={(value) => {
                    setFilterStatus(value);
                    setCurrentPage(1); // Reset to page 1 when filter changes
                  }}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="unread">Unread</SelectItem>
                    <SelectItem value="read">Read</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Filter className="h-4 w-4" />
                  <span>
                    {pagination.total_count || filteredNotifications.length}{" "}
                    notifications
                  </span>
                  {pagination.unread_count > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {pagination.unread_count} unread
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md border-0">
            <CardContent className="p-0">
              {isLoadingNotifications ? (
                <div className="p-12 text-center">
                  <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-[#00A1FF]"></div>
                  <h3 className="mb-2 text-lg font-medium text-[#2b2b2b]">
                    Loading notifications...
                  </h3>
                  <p className="text-gray-600">
                    Please wait while we fetch your notifications
                  </p>
                </div>
              ) : paginatedNotifications.length === 0 ? (
                <div className="p-12 text-center">
                  <Bell className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                  <h3 className="mb-2 text-lg font-medium text-[#2b2b2b]">
                    No notifications found
                  </h3>
                  <p className="text-gray-600">
                    {searchTerm ||
                    filterCategory !== "all" ||
                    filterPriority !== "all" ||
                    filterStatus !== "all"
                      ? "Try adjusting your search criteria or filters"
                      : "You're all caught up! No notifications to display."}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {paginatedNotifications.map((notification) => {
                    const recipientTags =
                      notification.send_to_all ||
                      !notification.recipient_roles?.length
                        ? ["All Users"]
                        : notification.recipient_roles;
                   return (
  <div
    key={notification.id}
    className={`p-6 transition-colors hover:bg-gray-50 ${
      !notification.isRead ? "bg-blue-50 border-l-4 border-[#00A1FF]" : ""
    }`}
  >
    <div className="flex items-start gap-4">
      
      {/* ICON */}
      <div className="mt-1">
        {getNotificationIcon(notification.type)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          
          {/* LEFT CONTENT */}
          <div className="flex-1">
            
            {/* TITLE */}
            <h3
              className={`font-medium ${
                !notification.isRead ? "text-[#2b2b2b]" : "text-gray-900"
              }`}
            >
              {notification.title}
            </h3>

            {/* DESCRIPTION */}
            <p className="mt-1 text-sm text-gray-600 leading-relaxed">
              {notification.message}
            </p>

            {/* ✅ RECIPIENT TAGS (FIXED POSITION) */}
            <div className="mt-2 flex flex-wrap gap-2">
              {(notification.send_to_all ||
              !notification.recipient_roles ||
              notification.recipient_roles.length === 0
                ? ["All Users"]
                : notification.recipient_roles
              ).map((role, index) => (
                <Badge
                  key={`${role}-${index}`}
                  className="bg-gray-100 text-gray-700 border border-gray-200 text-xs"
                >
                  {role}
                </Badge>
              ))}
            </div>

            {/* RELATED ID */}
            <div className="mt-3 flex items-center gap-3 text-xs">
              {notification.relatedId && (
                <Badge variant="outline" className="text-xs">
                  {notification.relatedId}
                </Badge>
              )}
            </div>
          </div>

          {/* RIGHT SIDE (TIME + ACTIONS) */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">
              {formatTimestamp(
                notification.isRead && notification.read_at
                  ? notification.read_at
                  : notification.created_at || notification.timestamp
              )}
            </span>

            <div className="flex items-center gap-1">
              {hasPermission("notification", "edit") &&
                (notification.isRead ? (
                  <Button variant="ghost" size="sm" className="h-auto p-1">
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
                ))}

              {hasPermission("notification", "delete") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteClick(notification.id)}
                  className="h-auto p-1 text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            {!notification.isRead && (
              <div className="h-3 w-3 rounded-full bg-[#00A1FF]" />
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
);
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1 || isLoadingNotifications}
              >
                Previous
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    onClick={() => setCurrentPage(page)}
                    className={
                      currentPage === page
                        ? "bg-primary text-white hover:bg-[#0090e6]"
                        : ""
                    }
                  >
                    {page}
                  </Button>
                ),
              )}
              <Button
                variant="outline"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages || isLoadingNotifications}
              >
                Next
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Notification</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this notification? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setDeleteDialogOpen(false);
                setNotificationToDelete(null);
              }}
            >
              No
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteNotification}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Yes, Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}