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
import { Plus, Edit, Trash2 } from 'lucide-react'
import { getUserData } from '@/utils/auth'

interface StaffTimesheet {
  id: number
  title: string
  staff_id: number
  date: string
  start_time: string
  end_time: string
  total_hours: number
}

export function StaffTimelinePage() {
  const [isLoading, setIsLoading] = useState(true)
  const [timesheets, setTimesheets] = useState<StaffTimesheet[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingTimesheet, setEditingTimesheet] = useState<StaffTimesheet | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    start_time: '',
    end_time: ''
  })
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({})
  const calendarRef = useRef<FullCalendar>(null)
  const [staffId, setStaffId] = useState<number | null>(null)

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
        setTimesheets(timesheetList)
      }
    } catch (error: any) {
      console.error('Error fetching timesheets:', error)
      toast.error(error.message || 'Failed to fetch timesheets')
    } finally {
      setIsLoading(false)
    }
  }

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
    
    if (!formData.title.trim()) {
      errors.title = 'Title is required'
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
      const payload = {
        title: formData.title,
        staff_id: staffId,
        date: formData.date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        total_hours: roundedTotalHours
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
      setFormData({ title: '', date: '', start_time: '', end_time: '' })
      setFormErrors({})
      fetchTimesheets()
    } catch (error: any) {
      console.error('Error saving timesheet:', error)
      toast.error(error.message || 'Failed to save timesheet')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (timesheet: StaffTimesheet) => {
    setEditingTimesheet(timesheet)
    setFormData({
      title: timesheet.title,
      date: timesheet.date,
      start_time: timesheet.start_time,
      end_time: timesheet.end_time
    })
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
    setEditingTimesheet(null)
    setFormData({
      title: '',
      date: arg.dateStr,
      start_time: '',
      end_time: ''
    })
    setFormErrors({})
    setShowModal(true)
  }

  // Transform timesheets to calendar events
  const calendarEvents = timesheets.map(timesheet => {
    const startDateTime = `${timesheet.date}T${timesheet.start_time}`
    const endDateTime = `${timesheet.date}T${timesheet.end_time}`
    
    return {
      id: timesheet.id.toString(),
      title: `${timesheet.title} (${formatHoursAndMinutes(timesheet.total_hours)})`,
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
    return (
      <div className="fc-event-main-frame p-1">
        <div className="fc-event-time text-xs font-semibold">{timesheet.start_time} - {timesheet.end_time}</div>
        <div className="fc-event-title-container">
          <div className="fc-event-title font-medium">{timesheet.title}</div>
        </div>
        <div className="fc-event-time text-xs">{formatHoursAndMinutes(timesheet.total_hours)}</div>
      </div>
    )
  }

  const handleEventClick = (clickInfo: any) => {
    const timesheet = clickInfo.event.extendedProps.timesheet
    handleEdit(timesheet)
  }

  if (isLoading && timesheets.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner />
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
        <Button onClick={() => {
          setEditingTimesheet(null)
          setFormData({ title: '', date: '', start_time: '', end_time: '' })
          setFormErrors({})
          setShowModal(true)
        }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Timeline
        </Button>
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
          setFormData({ title: '', date: '', start_time: '', end_time: '' })
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
              <Label htmlFor="title">Title <span className="text-red-500">*</span></Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, title: e.target.value }))
                  if (formErrors.title) {
                    setFormErrors(prev => ({ ...prev, title: '' }))
                  }
                }}
                placeholder="e.g., Office Work"
              />
              {formErrors.title && (
                <p className="text-sm text-red-500">{formErrors.title}</p>
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
            {editingTimesheet && (
              <Button
                variant="destructive"
                onClick={async () => {
                  if (confirm('Are you sure you want to delete this timesheet?')) {
                    await handleDelete(editingTimesheet.id)
                    setShowModal(false)
                    setEditingTimesheet(null)
                    setFormData({ title: '', date: '', start_time: '', end_time: '' })
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
                setFormData({ title: '', date: '', start_time: '', end_time: '' })
                setFormErrors({})
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? 'Saving...' : editingTimesheet ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

