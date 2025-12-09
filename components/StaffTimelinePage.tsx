'use client'

import { useState, useEffect, useRef } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { apiClient } from '@/utils/api'
import { toast } from 'sonner'
import { LoadingSpinner } from './common/LoadingSpinner'
import { Plus, Edit, Trash2, Search, Briefcase, X } from 'lucide-react'
import { getUserData } from '@/utils/auth'
import { Badge } from './ui/badge'
import { usePermissions } from '../contexts/PermissionContext'

interface StaffTimesheet {
  id: number
  title?: string
  job_id?: number
  job_title?: string
  staff_id: number
  date: string
  start_time: string
  end_time: string
  total_hours: number
}

export function StaffTimelinePage() {
  const { hasPermission, isLoading: permissionsLoading } = usePermissions()
  const [isLoading, setIsLoading] = useState(true)
  const [timesheets, setTimesheets] = useState<StaffTimesheet[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingTimesheet, setEditingTimesheet] = useState<StaffTimesheet | null>(null)
  const [formData, setFormData] = useState({
    job_id: null as number | null,
    date: '',
    start_time: '',
    end_time: ''
  })
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({})
  const calendarRef = useRef<FullCalendar>(null)
  const [staffId, setStaffId] = useState<number | null>(null)
  
  // Permission checks
  const canView = hasPermission('staff_timeline', 'view')
  const canCreate = hasPermission('staff_timeline', 'create')
  const canEdit = hasPermission('staff_timeline', 'edit')
  const canDelete = hasPermission('staff_timeline', 'delete')
  
  // Job search state
  const [jobSearchTerm, setJobSearchTerm] = useState('')
  const [jobResults, setJobResults] = useState<any[]>([])
  const [selectedJob, setSelectedJob] = useState<any | null>(null)
  const [showJobDropdown, setShowJobDropdown] = useState(false)
  const [isLoadingJobs, setIsLoadingJobs] = useState(false)
  const jobDropdownRef = useRef<HTMLDivElement>(null)

  // Load FullCalendar CSS
  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://cdn.jsdelivr.net/npm/fullcalendar@6.1.19/index.global.min.css'
    document.head.appendChild(link)
    
    return () => {
      // Cleanup on unmount
      const existingLink = document.querySelector(`link[href="${link.href}"]`)
      if (existingLink) {
        document.head.removeChild(existingLink)
      }
    }
  }, [])

  useEffect(() => {
    // Get staff ID from user data
    const userData = getUserData()
    if (userData?.user?.staff?.id) {
      setStaffId(Number(userData.user.staff.id))
    }
    fetchTimesheets()
  }, [])

  const fetchTimesheets = async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.getAllStaffTimesheets(1, 100) // Get all timesheets
      if (response.success && response.data) {
        const timesheetList = Array.isArray(response.data) 
          ? response.data 
          : (response.data.timesheets || response.data.data || [])
        
        // Transform timesheets to extract job_title from nested job object
        const transformedTimesheets = timesheetList.map((ts: any) => ({
          ...ts,
          job_title: ts.job?.job_title || ts.job_title || ts.title || null,
          job_id: ts.job?.id || ts.job_id || null
        }))
        
        setTimesheets(transformedTimesheets)
      }
    } catch (error: any) {
      console.error('Error fetching timesheets:', error)
      toast.error(error.message || 'Failed to fetch timesheets')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchJobs = async (query: string = '') => {
    try {
      setIsLoadingJobs(true)
      const response = await apiClient.searchJobsByQuery(query || '', 1, 20)
      if (response.success && response.data) {
        const jobs = Array.isArray(response.data) ? response.data : (response.data.jobs || [])
        setJobResults(jobs)
      }
    } catch (error: any) {
      console.error('Error fetching jobs:', error)
      setJobResults([])
    } finally {
      setIsLoadingJobs(false)
    }
  }

  // Close job dropdown when clicking outside
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

  // Debounced job search
  useEffect(() => {
    if (!showJobDropdown) return

    const trimmed = jobSearchTerm.trim()
    const timeout = setTimeout(() => {
      fetchJobs(trimmed)
    }, 400)

    return () => clearTimeout(timeout)
  }, [jobSearchTerm, showJobDropdown])

  const calculateTotalHours = (startTime: string, endTime: string): number => {
    if (!startTime || !endTime) return 0
    const start = new Date(`2000-01-01T${startTime}`)
    const end = new Date(`2000-01-01T${endTime}`)
    const diffMs = end.getTime() - start.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)
    return Math.max(0, diffHours)
  }

  const formatHoursAndMinutes = (decimalHours: number): string => {
    const hours = Math.floor(decimalHours)
    const minutes = Math.round((decimalHours - hours) * 60)
    if (hours === 0) {
      return `${minutes}m`
    }
    if (minutes === 0) {
      return `${hours}h`
    }
    return `${hours}h ${minutes}m`
  }

  const handleTimeChange = (field: 'start_time' | 'end_time', value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value }
      // Auto-calculate total hours when both times are set
      if (updated.start_time && updated.end_time) {
        const hours = calculateTotalHours(updated.start_time, updated.end_time)
        // Update total hours in form (for display purposes)
      }
      return updated
    })
  }

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {}
    
    if (!formData.job_id) {
      errors.job_id = 'Job selection is required'
    }
    
    if (!formData.date) {
      errors.date = 'Date is required'
    }
    
    if (!formData.start_time) {
      errors.start_time = 'Start time is required'
    }
    
    if (!formData.end_time) {
      errors.end_time = 'End time is required'
    }
    
    if (formData.start_time && formData.end_time) {
      const hours = calculateTotalHours(formData.start_time, formData.end_time)
      if (hours <= 0) {
        errors.end_time = 'End time must be after start time'
      }
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    if (!staffId) {
      toast.error('Staff ID not found')
      return
    }

    const totalHours = calculateTotalHours(formData.start_time, formData.end_time)
    // Round to exactly 2 decimal places for payload (e.g., 4.83 for 4h 50m)
    const roundedTotalHours = Number(totalHours.toFixed(2))

    try {
      setIsLoading(true)
      const payload: any = {
        staff_id: staffId,
        date: formData.date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        total_hours: roundedTotalHours
      }

      // Add job_id if selected
      if (formData.job_id) {
        payload.job_id = formData.job_id
      }

      if (editingTimesheet) {
        await apiClient.updateStaffTimesheet(editingTimesheet.id, payload)
        toast.success('Timesheet updated successfully')
      } else {
        await apiClient.createStaffTimesheet(payload)
        toast.success('Timesheet created successfully')
      }

      setShowModal(false)
      setEditingTimesheet(null)
      setFormData({ job_id: null, date: '', start_time: '', end_time: '' })
      setSelectedJob(null)
      setJobSearchTerm('')
      setShowJobDropdown(false)
      setFormErrors({})
      fetchTimesheets()
    } catch (error: any) {
      console.error('Error saving timesheet:', error)
      toast.error(error.message || 'Failed to save timesheet')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = async (timesheet: StaffTimesheet) => {
    setEditingTimesheet(timesheet)
    setFormData({
      job_id: timesheet.job_id || null,
      date: timesheet.date,
      start_time: timesheet.start_time,
      end_time: timesheet.end_time
    })
    
    // Set selected job for display
    if (timesheet.job_id) {
      // If job_title is available, use it directly
      if (timesheet.job_title) {
        setSelectedJob({ id: timesheet.job_id, title: timesheet.job_title })
        setJobSearchTerm(timesheet.job_title)
      } else {
        // Fetch job details if job_title is not available
        try {
          const jobResponse = await apiClient.getJobById(timesheet.job_id.toString())
          // getJobById returns the transformed job object directly, not wrapped in {success, data}
          const jobTitle = jobResponse.title || 'Untitled Job'
          setSelectedJob({ id: timesheet.job_id, title: jobTitle })
          setJobSearchTerm(jobTitle)
        } catch (error) {
          console.error('Error fetching job details:', error)
          // Fallback: show job ID if fetch fails
          setSelectedJob({ id: timesheet.job_id, title: `Job ${timesheet.job_id}` })
          setJobSearchTerm(`Job ${timesheet.job_id}`)
        }
      }
    } else {
      setSelectedJob(null)
      setJobSearchTerm('')
    }
    setFormErrors({})
    setShowModal(true)
  }

  const handleDelete = async (timesheetId: number) => {
    if (!confirm('Are you sure you want to delete this timesheet?')) {
      return
    }

    try {
      setIsLoading(true)
      await apiClient.deleteStaffTimesheet(timesheetId)
      toast.success('Timesheet deleted successfully')
      fetchTimesheets()
    } catch (error: any) {
      console.error('Error deleting timesheet:', error)
      toast.error(error.message || 'Failed to delete timesheet')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDateClick = (arg: any) => {
    if (!canCreate) return
    setEditingTimesheet(null)
    setFormData({
      job_id: null,
      date: arg.dateStr,
      start_time: '',
      end_time: ''
    })
    setSelectedJob(null)
    setJobSearchTerm('')
    setShowJobDropdown(false)
    setFormErrors({})
    setShowModal(true)
  }

  // Transform timesheets to calendar events
  const calendarEvents = timesheets.map(timesheet => {
    const startDateTime = `${timesheet.date}T${timesheet.start_time}`
    const endDateTime = `${timesheet.date}T${timesheet.end_time}`
    
    const displayTitle = timesheet.job_title || timesheet.title || 'Untitled'
    return {
      id: timesheet.id.toString(),
      title: `${displayTitle} (${formatHoursAndMinutes(timesheet.total_hours)})`,
      start: startDateTime,
      end: endDateTime,
      backgroundColor: '#3b82f6',
      borderColor: '#2563eb',
      extendedProps: {
        timesheet: timesheet
      }
    }
  })

  // Custom event content renderer
  const renderEventContent = (eventInfo: any) => {
    const timesheet = eventInfo.event.extendedProps.timesheet
    const displayTitle = timesheet.job_title || timesheet.title || 'Untitled'
    return (
      <div className="fc-event-main-frame p-1">
        <div className="fc-event-time text-xs font-semibold">{timesheet.start_time} - {timesheet.end_time}</div>
        <div className="fc-event-title-container">
          <div className="fc-event-title font-medium">{displayTitle}</div>
        </div>
        <div className="fc-event-time text-xs">{formatHoursAndMinutes(timesheet.total_hours)}</div>
      </div>
    )
  }

  const handleEventClick = (clickInfo: any) => {
    if (!canEdit && !canView) return
    const timesheet = clickInfo.event.extendedProps.timesheet
    if (canEdit) {
      handleEdit(timesheet)
    }
  }

  if (permissionsLoading || (isLoading && timesheets.length === 0)) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  // Check view permission
  if (!canView) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to view this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Staff Timeline</h1>
          <p className="text-muted-foreground mt-1">Manage your work timeline and hours</p>
        </div>
        {canCreate && (
          <Button className='text-white' onClick={() => {
            setEditingTimesheet(null)
            setFormData({ job_id: null, date: '', start_time: '', end_time: '' })
            setSelectedJob(null)
            setJobSearchTerm('')
            setShowJobDropdown(false)
            setFormErrors({})
            setShowModal(true)
          }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Timeline
          </Button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={calendarEvents}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          eventContent={renderEventContent}
          height="auto"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,dayGridWeek'
          }}
          editable={false}
          selectable={true}
          selectMirror={true}
        />
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={showModal} onOpenChange={(open) => {
        setShowModal(open)
        if (!open) {
          setEditingTimesheet(null)
          setFormData({ job_id: null, date: '', start_time: '', end_time: '' })
          setSelectedJob(null)
          setJobSearchTerm('')
          setShowJobDropdown(false)
          setFormErrors({})
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingTimesheet ? 'Edit Timeline' : 'Add Timeline'}
            </DialogTitle>
            <DialogDescription>
              {editingTimesheet ? 'Update your timeline entry' : 'Add a new timeline entry for your work hours'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="job">Job <span className="text-red-500">*</span></Label>
              <div className="relative" ref={jobDropdownRef}>
                <Input
                  id="job"
                  placeholder="Search jobs..."
                  value={jobSearchTerm}
                  onChange={(e) => {
                    setJobSearchTerm(e.target.value)
                    setShowJobDropdown(true)
                  }}
                  onFocus={() => {
                    setShowJobDropdown(true)
                    if (jobResults.length === 0) {
                      fetchJobs('')
                    }
                  }}
                  className="pl-8"
                />
                <Search className="absolute left-2.5 top-[20px] h-4 w-4 -translate-y-1/2 text-gray-400" />

                {showJobDropdown && (
                  <div className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
                    {isLoadingJobs ? (
                      <div className="p-3 text-sm text-gray-500">Searching jobs...</div>
                    ) : jobResults.length === 0 ? (
                      <div className="p-3 text-sm text-gray-500">No jobs found</div>
                    ) : (
                      jobResults.map((job) => (
                        <button
                          key={job.id}
                          type="button"
                          onClick={() => {
                            setSelectedJob(job)
                            setJobSearchTerm(job.job_title || 'Untitled Job')
                            setFormData(prev => ({ ...prev, job_id: job.id }))
                            setShowJobDropdown(false)
                            if (formErrors.job_id) {
                              setFormErrors(prev => ({ ...prev, job_id: '' }))
                            }
                          }}
                          className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50"
                        >
                          <Briefcase className="mt-0.5 h-4 w-4 text-gray-500" />
                          <div className="flex-1">
                            <p className="font-medium text-[#2b2b2b]">
                              {job.job_title || 'Untitled Job'}
                            </p>
                            {(job.customerName || job.address) && (
                              <p className="text-xs text-gray-500">
                                {[job.customerName, job.address].filter(Boolean).join(' • ')}
                              </p>
                            )}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              {selectedJob && (
                <div className="mt-2">
                  <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                    {selectedJob.title || `Job ${selectedJob.id}`}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedJob(null)
                        setJobSearchTerm('')
                        setFormData(prev => ({ ...prev, job_id: null }))
                      }}
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                </div>
              )}
              {formErrors.job_id && (
                <p className="text-sm text-red-500">{formErrors.job_id}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date <span className="text-red-500">*</span></Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, date: e.target.value }))
                  if (formErrors.date) {
                    setFormErrors(prev => ({ ...prev, date: '' }))
                  }
                }}
              />
              {formErrors.date && (
                <p className="text-sm text-red-500">{formErrors.date}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_time">Start Time <span className="text-red-500">*</span></Label>
                <Input
                  id="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => {
                    handleTimeChange('start_time', e.target.value)
                    if (formErrors.start_time) {
                      setFormErrors(prev => ({ ...prev, start_time: '' }))
                    }
                  }}
                />
                {formErrors.start_time && (
                  <p className="text-sm text-red-500">{formErrors.start_time}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_time">End Time <span className="text-red-500">*</span></Label>
                <Input
                  id="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => {
                    handleTimeChange('end_time', e.target.value)
                    if (formErrors.end_time) {
                      setFormErrors(prev => ({ ...prev, end_time: '' }))
                    }
                  }}
                />
                {formErrors.end_time && (
                  <p className="text-sm text-red-500">{formErrors.end_time}</p>
                )}
              </div>
            </div>

            {formData.start_time && formData.end_time && (
              <div className="p-3 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-900">
                  <span className="font-medium">Total Hours: </span>
                  {formatHoursAndMinutes(calculateTotalHours(formData.start_time, formData.end_time))}
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-2">
            {editingTimesheet && canDelete && (
              <Button className='text-white'
                variant="destructive"
                onClick={async () => {
                  if (confirm('Are you sure you want to delete this timesheet?')) {
                    await handleDelete(editingTimesheet.id)
                    setShowModal(false)
                    setEditingTimesheet(null)
                    setFormData({ job_id: null, date: '', start_time: '', end_time: '' })
                    setSelectedJob(null)
                    setJobSearchTerm('')
                    setShowJobDropdown(false)
                    setFormErrors({})
                  }
                }}
                disabled={isLoading}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            )}
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowModal(false)
                    setEditingTimesheet(null)
                    setFormData({ job_id: null, date: '', start_time: '', end_time: '' })
                    setSelectedJob(null)
                    setJobSearchTerm('')
                    setShowJobDropdown(false)
                    setFormErrors({})
                  }}
                >
                  Cancel
                </Button>
            {(canCreate || (editingTimesheet && canEdit)) && (
              <Button className='text-white' onClick={handleSubmit} disabled={isLoading}>
                {isLoading ? 'Saving...' : editingTimesheet ? 'Update' : 'Create'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

