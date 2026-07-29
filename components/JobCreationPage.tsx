import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Textarea } from './ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog'
import { Checkbox } from './ui/checkbox'
import { Badge } from './ui/badge'
import { toast } from 'sonner'
import { AutoScrollSelect } from './ui/AutoScrollSelect'
import { AutoScrollMultiSelect } from './ui/AutoScrollMultiSelect'
import { apiClient } from '../utils/api'
import { globalApiCall } from '../utils/globalApiHandler'
import { usePermissions } from '../contexts/PermissionContext'
import PhoneInput, { isValidPhoneNumber, parsePhoneNumber } from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import Autocomplete from 'react-google-autocomplete'
import {
  ADDRESS_AUTOCOMPLETE_OPTIONS,
  ADDRESS_SEARCH_PLACEHOLDER,
  GOOGLE_MAPS_API_KEY,
  parsePlaceToAddressFields,
  resolveFormattedPlaceAddress,
} from '@/lib/googleAddressAutocomplete'

// Extend Window interface for Google Maps
declare global {
  interface Window {
    google?: {
      maps?: {
        places?: any
        geocoder?: any
      }
    }
  }
}

import { 
  ArrowLeft, 
  ArrowRight,
  Check,
  FileText,
  User,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  Package,
  Clock,
  UserCheck,
  Building,
  Phone,
  Mail
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
  // Enhanced location fields
  address: string
  cityZip: string
  phone: string
  email: string
  billToAddress: string
  billToCityZip: string
  billToPhone: string
  billToEmail: string
  sameAsAddress: boolean
  priority: 'low' | 'medium' | 'high'
  billingStatus?: 'pending' | 'invoiced' | 'paid'
}

interface JobCreationPageProps {
  onBack: () => void
  onJobCreated: (job: Job) => void
}

// Removed hardcoded arrays - now using API

// Removed hardcoded contractors - now using API


export function JobCreationPage({ onBack, onJobCreated }: JobCreationPageProps) {
  const router = useRouter()
  const { hasPermission } = usePermissions()
  const canAssignLeadLabor =
    hasPermission('jobs', 'assign') ||
    hasPermission('jobs', 'assigned leader') ||
    hasPermission('jobs', 'assigned lead labor')
  const canAssignLabor =
    hasPermission('jobs', 'assign') ||
    hasPermission('jobs', 'assigned labor')
  const showAssignedSection = canAssignLeadLabor || canAssignLabor
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedCustomerName, setSelectedCustomerName] = useState('')
  const [selectedContractorName, setSelectedContractorName] = useState('')
  const [selectedLeadLaborItems, setSelectedLeadLaborItems] = useState<any[]>([])
  const [selectedLaborItems, setSelectedLaborItems] = useState<any[]>([])
  /** Job Review step: expand full description when longer than two lines */
  const [jobReviewDescriptionExpanded, setJobReviewDescriptionExpanded] = useState(false)
  const [jobReviewDescriptionNeedsToggle, setJobReviewDescriptionNeedsToggle] = useState(false)
  const jobReviewDescriptionBoxRef = useRef<HTMLDivElement>(null)
  const jobReviewDescriptionMeasureRef = useRef<HTMLParagraphElement>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [isCreatingJob, setIsCreatingJob] = useState(false)

  // Shared add-entity (customer/contractor) modal
  const [isAddEntityOpen, setIsAddEntityOpen] = useState(false)
  const [addEntityType, setAddEntityType] = useState<'customer' | 'contractor' | null>(null)
  const [addEntityLoading, setAddEntityLoading] = useState(false)
  const [entityForm, setEntityForm] = useState({
    name: '',
    email: '',
    phone: '',
    contactPerson: '',
    company: '',
    address: '',
    status: 'active'
  })
  const [entityErrors, setEntityErrors] = useState<{ name?: string; email?: string; phone?: string; address?: string; company?: string }>({})
  const [customerRefreshKey, setCustomerRefreshKey] = useState(0)
  const [contractorRefreshKey, setContractorRefreshKey] = useState(0)
  const JOB_ENTITY_SELECT_PAGE_SIZE = 10
  /** Last customer/contractor row from AutoScrollSelect — used to refill location when checkbox is re-enabled. */
  const selectedEntityForLocationRef = useRef<any>(null)

  const searchCustomersForJobSelect = useCallback(
    async (term: string, page: number, limit: number) => {
      const response = await apiClient.globalSearch(term, page, limit)
      const customersFromApi: any[] = response.data?.customers || []
      const pagination = response.data?.pagination || {}

      const data = customersFromApi.map((entry: any) => {
        const customer = entry.customer || entry
        return {
          id: customer.id,
          name:
            customer.customer_name ||
            customer.name ||
            customer.company_name ||
            `Customer ${customer.id}`,
          customer_name: customer.customer_name || customer.name,
          company_name: customer.company_name,
          email: customer.email,
          phone: customer.phone,
          address: customer.address,
          tag: customer.tag,
          customer_type: customer.customer_type,
          type: customer.type || customer.tag || 'customer',
        }
      })

      return {
        data,
        totalPages: pagination.totalPages || 1,
        currentPage: pagination.page || page,
      }
    },
    [],
  )

  const searchContractorsForJobSelect = useCallback(
    async (term: string, page: number, limit: number) => {
      const response = await apiClient.globalSearch(term, page, limit)
      const contractorsFromApi: any[] = response.data?.contractors || []
      const customersFromApi: any[] = response.data?.customers || []
      const pagination = response.data?.pagination || {}

      const contractorRows = contractorsFromApi.map((entry: any) => {
        const contractor = entry.contractor || entry
        return {
          id: contractor.id,
          name:
            contractor.contractor_name ||
            contractor.name ||
            contractor.company_name ||
            `Contractor ${contractor.id}`,
          contractor_name: contractor.contractor_name || contractor.name,
          company_name: contractor.company_name,
          email: contractor.email,
          phone: contractor.phone,
          address: contractor.address,
          tag: contractor.tag || 'contractor',
          customer_type: contractor.customer_type,
          type: contractor.type || contractor.tag || 'contractor',
        }
      })

      const customerRows = customersFromApi.map((entry: any) => {
        const customer = entry.customer || entry
        return {
          id: customer.id,
          name:
            customer.customer_name ||
            customer.name ||
            customer.company_name ||
            `Customer ${customer.id}`,
          contractor_name: customer.customer_name || customer.name,
          company_name: customer.company_name,
          email: customer.email,
          phone: customer.phone,
          address: customer.address,
          tag: customer.tag || 'customer',
          customer_type: customer.customer_type || 'customer',
          type: customer.type || customer.tag || 'customer',
        }
      })

      return {
        data: [...contractorRows, ...customerRows],
        totalPages: pagination.totalPages || 1,
        currentPage: pagination.page || page,
      }
    },
    [],
  )

  const [formData, setFormData] = useState({
    // Step 1: Job Type
    type: '' as 'service-based' | 'contract-based' | '',
    
    // Step 2: Basic Details
    title: '',
    customer: '', // Only for service-based jobs
    customerName: '', // Store customer name for display
    contractor: '', // For contract-based jobs in step 2, service-based in step 3
    contractorName: '', // Store contractor name for display
    selectedEntityType: '' as 'customer' | 'contractor' | '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    
    // Enhanced Location fields
    address: '',
    cityZip: '',
    phone: '',
    email: '',
    billToAddress: '',
    billToCityZip: '',
    billToPhone: '',
    billToEmail: '',
    sameAsAddress: false,
    useEntityAddressForLocation: true,

    // Step 3: Scheduling & Resources
    dueDate: '',
    estimatedHours: 0,
    estimatedCost: 0,
    assignedLeadLabor: [] as string[],
    assignedLabor: [] as string[]
  })

  const steps = [
    { id: 1, title: 'Job Type', icon: FileText },
    { id: 2, title: 'Job Details', icon: User },
    { id: 3, title: 'Review', icon: Check }
  ]

  useEffect(() => {
    if (currentStep !== 3) {
      setJobReviewDescriptionExpanded(false)
    }
  }, [currentStep])

  const updateJobReviewDescriptionNeedsToggle = useCallback(() => {
    const el = jobReviewDescriptionMeasureRef.current
    if (!el || currentStep !== 3) {
      setJobReviewDescriptionNeedsToggle(false)
      return
    }
    const text = (formData.description || '').trim()
    if (!text) {
      setJobReviewDescriptionNeedsToggle(false)
      return
    }
    const lh = parseFloat(window.getComputedStyle(el).lineHeight)
    if (!Number.isFinite(lh) || lh <= 0) {
      setJobReviewDescriptionNeedsToggle(false)
      return
    }
    setJobReviewDescriptionNeedsToggle(el.scrollHeight > lh * 2 + 1)
  }, [formData.description, currentStep])

  useLayoutEffect(() => {
    updateJobReviewDescriptionNeedsToggle()
  }, [updateJobReviewDescriptionNeedsToggle])

  useEffect(() => {
    const box = jobReviewDescriptionBoxRef.current
    if (!box) return
    const ro = new ResizeObserver(() => {
      updateJobReviewDescriptionNeedsToggle()
    })
    ro.observe(box)
    return () => ro.disconnect()
  }, [updateJobReviewDescriptionNeedsToggle])

  const generateJobId = () => {
    const date = new Date()
    const year = date.getFullYear()
    const random = Math.random().toString(36).substr(2, 3).toUpperCase()
    return `JOB-${year}-${random}`
  }

  const clearValidationError = (field: string) => {
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const normalizePhoneToE164 = (rawPhone: string) => {
    const raw = (rawPhone || '').trim()
    if (!raw) return ''
    if (raw.startsWith('+')) return raw

    const digits = raw.replace(/\D/g, '')
    if (!digits) return ''
    if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
    if (digits.length === 10) return `+1${digits}`
    return `+${digits}`
  }

  /** API payload: hyphen after country code, e.g. +1-2025550123 */
  const formatPhoneForPayload = (rawPhone: string): string => {
    const e164 = normalizePhoneToE164(rawPhone)
    if (!e164) return ''
    const digits = e164.replace(/[^\d+]/g, '')
    if (!digits.startsWith('+')) return e164

    if (digits.startsWith('+1') && digits.length > 2) {
      const rest = digits.slice(2)
      return rest ? `+1-${rest}` : '+1'
    }

    const match = digits.match(/^\+(\d{2,3})(\d*)$/)
    if (!match) return e164
    const country = match[1]
    const rest = match[2]
    return rest ? `+${country}-${rest}` : `+${country}`
  }

 const validatePhone = (phone: string): boolean => {
  if (!phone) return false
  
  // Remove country code and non-digit characters
  // phone value from PhoneInput is in E.164 format like +11234567890
  const digitsOnly = phone.replace(/\D/g, '') // remove all non-digits
  
  // E.164 format includes country code, so we need to strip it
  // Use parsePhoneNumber to extract national number
  try {
    const parsed = parsePhoneNumber(phone)
    if (!parsed) return false
    
    // Get national number (without country code)
    const nationalNumber = parsed.nationalNumber
    return nationalNumber.length === 10
  } catch {
    return false
  }
}

  const getStep2ValidationErrors = (): Record<string, string> => {
    const errors: Record<string, string> = {}

    // Required fields validation
    if (!formData.title.trim()) {
      errors.title = 'Job title is required'
    }
    if (!formData.description.trim()) {
      errors.description = 'Job description is required'
    }
    if (!formData.address.trim()) {
      errors.address = 'Address is required'
    }
    if (!formData.cityZip.trim()) {
      errors.cityZip = 'City & ZIP is required'
    }

    // Job type specific validation
    if (formData.type === 'service-based' && !formData.customer) {
      errors.customer = 'Customer selection is required for service-based jobs'
    }
    if (formData.type === 'contract-based' && !formData.contractor) {
      errors.contractor = 'Contractor selection is required for contract-based jobs'
    }

    // Email validation (required)
    // if (!formData.email || !formData.email.trim()) {
    //   errors.email = 'Email is required'
    // } else if (!validateEmail(formData.email)) {
    //   errors.email = 'Please enter a valid email address'
    // }

    // Phone validation (if provided)
    if (formData.phone && !validatePhone(formData.phone)) {
      errors.phone = 'Phone number must be exactly 10 digits'
    }

    // Bill to email validation (if provided and not same as address)
    if (!formData.sameAsAddress && formData.billToEmail && !validateEmail(formData.billToEmail)) {
      errors.billToEmail = 'Please enter a valid email address'
    }

    // Bill to phone validation (if provided and not same as address)
    if (!formData.sameAsAddress && formData.billToPhone && !validatePhone(formData.billToPhone)) {
      errors.billToPhone = 'Phone number must be exactly 10 digits'
    }

    return errors
  }

  const validateStep2 = (): boolean => {
    const errors = getStep2ValidationErrors()
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }


  const handleSameAsAddressChange = (checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        sameAsAddress: true,
        billToAddress: prev.address,
        billToCityZip: prev.cityZip,
        billToPhone: prev.phone,
        billToEmail: prev.email
      }))
      // Clear bill to validation errors when using same as address
      clearValidationError('billToEmail')
      clearValidationError('billToPhone')
    } else {
      setFormData(prev => ({
        ...prev,
        sameAsAddress: false,
        billToAddress: '',
        billToCityZip: '',
        billToPhone: '',
        billToEmail: ''
      }))
    }
  }

  const handleNext = () => {
    if (currentStep === 1 && !formData.type) {
      toast.error('Please select a job type')
      return
    }
    
    if (currentStep === 2) {
      if (!validateStep2()) {
        const step2Errors = getStep2ValidationErrors()
        const firstError = Object.values(step2Errors)[0]
        toast.error(firstError || 'Please fix the validation errors before proceeding')
        return
      }
    }
    
    setCurrentStep(prev => Math.min(prev + 1, 3))
  }

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleCreate = async () => {
    if (isCreatingJob) return

    if (!validateStep2()) {
      const step2Errors = getStep2ValidationErrors()
      const firstError = Object.values(step2Errors)[0]
      toast.error(firstError || 'Please fix the validation errors before submission')
      return
    }

    setIsCreatingJob(true)
    try {
      // Prepare the API payload
      const selectedEntityId = formData.customer || formData.contractor
      const entityType =
        formData.selectedEntityType ||
        resolveSelectedEntityType(selectedEntityForLocationRef.current)

      const jobPayload = {
        job_title: formData.title,
        job_type: formData.type === 'service-based' ? 'service_based' : 'contract_based',
        ...(entityType === 'customer' && selectedEntityId
          ? { customer_id: parseInt(selectedEntityId, 10) }
          : {}),
        ...(entityType === 'contractor' && selectedEntityId
          ? { contractor_id: parseInt(selectedEntityId, 10) }
          : {}),
        description: formData.description,
        priority: formData.priority,
        address: formData.address,
        city_zip: formData.cityZip,
        phone: formData.phone || undefined,
        // email: formData.email || undefined,
        bill_to_address: formData.billToAddress || undefined,
        bill_to_city_zip: formData.billToCityZip || undefined,
        bill_to_phone: formData.billToPhone || undefined,
        bill_to_email: formData.billToEmail || undefined,
        same_as_address: formData.sameAsAddress,
        due_date: formData.dueDate?.trim() ? formData.dueDate.trim() : null,
        estimated_hours: formData.estimatedHours || undefined,
        estimated_cost:
          formData.estimatedCost > 0 ? formData.estimatedCost : null,
        assigned_lead_labor_ids: formData.assignedLeadLabor.length > 0 ? JSON.stringify(formData.assignedLeadLabor) : undefined,
        assigned_labor_ids: formData.assignedLabor.length > 0 ? JSON.stringify(formData.assignedLabor) : undefined,
        assigned_material_ids: undefined,
        status: 'active'
      }

      console.log('Creating job with payload:', jobPayload)

      // Call the API
      const response = await apiClient.createJob(jobPayload)
      // console.log('Job created successfully:', response)

      // Create the local job object for the callback
    const newJob: Job = {
        id: response.data?.id || generateJobId(),
      title: formData.title,
      type: formData.type as 'service-based' | 'contract-based',
      status: 'pending',
      assignedLeadLabor: formData.assignedLeadLabor,
      assignedLabor: formData.assignedLabor,
      contractor: formData.contractor || undefined,
      customer: formData.type === 'service-based' ? formData.customer : undefined,
      description: formData.description,
      createdDate: new Date().toISOString().split('T')[0],
      dueDate: formData.dueDate,
      estimatedHours: formData.estimatedHours || undefined,
      estimatedCost: formData.estimatedCost || undefined,
        materials: undefined,
      address: formData.address,
      cityZip: formData.cityZip,
      phone: formData.phone,
      email: formData.billToEmail || '',
      billToAddress: formData.billToAddress,
      billToCityZip: formData.billToCityZip,
      billToPhone: formData.billToPhone,
      billToEmail: formData.billToEmail,
      sameAsAddress: formData.sameAsAddress,
      priority: formData.priority,
      billingStatus: 'pending'
    }

      toast.success('Job created successfully!')
      onJobCreated(newJob)
      
      // Navigate based on job type
      if (formData.type === 'service-based') {
        router.push('/customers')
      } else if (formData.type === 'contract-based') {
        router.push('/contractors')
      }
    } catch (error) {
      console.error('Error creating job:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create job')
    } finally {
      setIsCreatingJob(false)
    }
  }

  const openAddEntityModal = (type: 'customer' | 'contractor') => {
    setAddEntityType(type)
    setEntityForm({
      name: '',
      email: '',
      phone: '',
      contactPerson: '',
      company: '',
      address: '',
      status: 'active',
    })
    setEntityErrors({})
    setIsAddEntityOpen(true)
  }

  const handleCreateEntity = async () => {
    if (!addEntityType) return
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL
    if (!apiBaseUrl) {
      toast.error('API base URL not configured')
      return
    }

    const isCustomer = addEntityType === 'customer'
    const newErrors: typeof entityErrors = {}
    if (!entityForm.name.trim()) {
      newErrors.name = isCustomer ? 'Customer name is required' : 'Contractor name is required'
    }
    if (!entityForm.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!validateEmail(entityForm.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    if (!entityForm.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    }
    if (!entityForm.company.trim()) {
      newErrors.company = 'Company name is required'
    }
    if (isCustomer && !entityForm.address.trim()) {
      newErrors.address = 'Address is required'
    }
    setEntityErrors(newErrors)
    if (Object.keys(newErrors).length > 0) {
      return
    }

    setAddEntityLoading(true)
    try {
      // Get system IP
      const ipResponse = await fetch('https://api.ipify.org?format=json')
      const ipData = await ipResponse.json()
      const system_ip = ipData?.ip || 'unknown'

      if (addEntityType === 'customer') {
        const payload = {
          customer_name: entityForm.name,
          company_name: entityForm.company || '',
          email: entityForm.email.toLowerCase(),
          phone: formatPhoneForPayload(entityForm.phone) || '',
          contact_person: entityForm.contactPerson || '',
          address: entityForm.address || '',
          status: entityForm.status || 'active',
          system_ip
        }
        const response = await globalApiCall(`${apiBaseUrl}/customer/createCustomer`, {
          method: 'POST',
          body: JSON.stringify(payload)
        })
        const data = await response.json()
        if (!data.success) {
          throw new Error(data.message || 'Failed to create customer')
        }
        toast.success('Customer created successfully!')
        // refresh dropdown and preselect if id returned
        if (data.data?.id) {
          const newId = String(data.data.id)
          const name = payload.customer_name
          const customerEmail = entityForm.email.toLowerCase()
          const createdCustomer = {
            id: newId,
            name: payload.customer_name,
            customer_name: payload.customer_name,
            email: payload.email,
            phone: payload.phone,
            address: payload.address,
            customer_type: 'customer',
            type: 'customer',
            tag: 'customer',
          }
          selectedEntityForLocationRef.current = createdCustomer
          setFormData((prev) => {
            let next = {
              ...prev,
              customer: newId,
              customerName: name,
              email: customerEmail,
              selectedEntityType: 'customer' as const,
            }
            if (prev.useEntityAddressForLocation) {
              next = applyEntityToLocationFields(next, createdCustomer)
            } else if (prev.sameAsAddress) {
              next.billToEmail = customerEmail
            }
            return next
          })
          setSelectedCustomerName(name)
        }
        setCustomerRefreshKey(prev => prev + 1)
      } else {
        const payload = {
          contractor_name: entityForm.name,
          company_name: entityForm.company || '',
          email: entityForm.email.toLowerCase(),
          // createContractor expects plain E.164 (no hyphen after country code),
          // unlike createCustomer — matches ContractorListingPage.tsx's working payload.
          phone: normalizePhoneToE164(entityForm.phone) || '',
          address: entityForm.address || '',
          status: entityForm.status || 'active',
          system_ip
        }
        const response = await globalApiCall(`${apiBaseUrl}/contractor/createContractor`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        })
        const data = await response.json()
        if (!data.success) {
          throw new Error(data.message || 'Failed to create contractor')
        }
        toast.success('Contractor created successfully!')
        if (data.data?.id) {
          const newId = String(data.data.id)
          const name = payload.contractor_name
          const contractorEmail = entityForm.email.toLowerCase()
          const createdContractor = {
            id: newId,
            name: payload.contractor_name,
            contractor_name: payload.contractor_name,
            email: payload.email,
            phone: payload.phone,
            address: payload.address,
            customer_type: 'contractor',
            type: 'contractor',
            tag: 'contractor',
          }
          selectedEntityForLocationRef.current = createdContractor
          setFormData((prev) => {
            let next = {
              ...prev,
              contractor: newId,
              contractorName: name,
              selectedEntityType: 'contractor' as const,
            }
            if (prev.type === 'contract-based') {
              next.email = contractorEmail
            }
            if (prev.useEntityAddressForLocation) {
              next = applyEntityToLocationFields(next, createdContractor)
            } else if (
              prev.type === 'contract-based' &&
              prev.sameAsAddress
            ) {
              next.billToEmail = contractorEmail
            }
            return next
          })
          setSelectedContractorName(name)
        }
        setContractorRefreshKey(prev => prev + 1)
      }

      setIsAddEntityOpen(false)
    } catch (error) {
      console.error('Error creating entity:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create record')
    } finally {
      setAddEntityLoading(false)
    }
  }

  const laborSelectionDisplayName = (item: any, fallbackId: string) =>
    item?.name ??
    item?.full_name ??
    item?.users?.full_name ??
    item?.labor_code ??
    fallbackId

  const buildOrderedLaborItems = (selectedIds: string[], selectedItems: any[]) => {
    const byId = new Map(
      selectedItems.map(it => [String(it?.id ?? it), it])
    )
    return selectedIds.map(id => byId.get(String(id)) ?? { id, name: id })
  }

  const handleLeadLaborChange = (selectedIds: string[], selectedItems: any[]) => {
    setFormData(prev => ({ ...prev, assignedLeadLabor: selectedIds }))
    setSelectedLeadLaborItems(buildOrderedLaborItems(selectedIds, selectedItems))
  }

  const handleLaborChange = (selectedIds: string[], selectedItems: any[]) => {
    setFormData(prev => ({ ...prev, assignedLabor: selectedIds }))
    setSelectedLaborItems(buildOrderedLaborItems(selectedIds, selectedItems))
  }

  const resolveSelectedEntityType = (
    item: any,
  ): 'customer' | 'contractor' | null => {
    const raw = String(
      item?.customer_type || item?.type || item?.tag || '',
    ).toLowerCase()
    if (raw === 'customer' || raw === 'contractor') return raw
    return null
  }

  const getCustomerEmail = (customer: any): string => {
    return customer?.email || customer?.customer_email || customer?.users?.email || ''
  }

  const getContractorEmail = (contractor: any): string => {
    return contractor?.email || contractor?.contractor_email || contractor?.users?.email || ''
  }

  const getLocationFromEntity = (item: any) => {
    if (!item) {
      return { address: '', cityZip: '', phone: '', email: '' }
    }

    const email =
      getCustomerEmail(item) || getContractorEmail(item) || String(item.email || '')
    const phone = String(item.phone ?? '').trim()
    let cityZip = String(item.city_zip ?? item.cityZip ?? '').trim()
    let address = String(item.address ?? '').trim()

    if (address && !cityZip && address.includes(',')) {
      const parts = address
        .split(',')
        .map((part: string) => part.trim())
        .filter(Boolean)
      if (parts.length >= 2) {
        address = parts[0]
        cityZip = parts.slice(1).join(', ')
      }
    }

    return { address, cityZip, phone, email }
  }

  const applyEntityToLocationFields = <T extends typeof formData>(base: T, item: any): T => {
    const loc = getLocationFromEntity(item)
    const next = {
      ...base,
      address: loc.address,
      cityZip: loc.cityZip,
      phone: loc.phone,
      email: loc.email,
    } as T

    if (base.sameAsAddress) {
      return {
        ...next,
        billToAddress: loc.address,
        billToCityZip: loc.cityZip,
        billToPhone: loc.phone,
        billToEmail: loc.email,
      } as T
    }

    return next
  }

  const clearLocationFields = <T extends typeof formData>(base: T): T => {
    const next = {
      ...base,
      address: '',
      cityZip: '',
      phone: '',
      email: '',
    } as T

    if (base.sameAsAddress) {
      return {
        ...next,
        billToAddress: '',
        billToCityZip: '',
        billToPhone: '',
        billToEmail: '',
      } as T
    }

    return next
  }

  const handleUseEntityAddressForLocationChange = (checked: boolean) => {
    if (checked) {
      setFormData((prev) => {
        const item = selectedEntityForLocationRef.current
        if (!item) {
          return { ...prev, useEntityAddressForLocation: true }
        }
        return {
          ...applyEntityToLocationFields(prev, item),
          useEntityAddressForLocation: true,
        }
      })
      clearValidationError('address')
      clearValidationError('cityZip')
      clearValidationError('phone')
      clearValidationError('email')
      return
    }

    setFormData((prev) => ({
      ...clearLocationFields(prev),
      useEntityAddressForLocation: false,
    }))
    clearValidationError('address')
    clearValidationError('cityZip')
    clearValidationError('phone')
    clearValidationError('email')
  }

  // Load Google Maps script with Places API
  // react-google-autocomplete handles Google Maps script loading internally

  // Fix Google Autocomplete dropdown z-index (entity modal)
  useEffect(() => {
    if (!isAddEntityOpen) return

    const style = document.createElement('style')
    style.id = 'google-autocomplete-styles-jobcreation-entity'
    style.textContent = `
      .pac-container {
        z-index: 999999 !important;
        pointer-events: auto !important;
      }
    `

    const existingStyle = document.getElementById('google-autocomplete-styles-jobcreation-entity')
    if (existingStyle) existingStyle.remove()
    document.head.appendChild(style)

    return () => {
      const s = document.getElementById('google-autocomplete-styles-jobcreation-entity')
      if (s) s.remove()
    }
  }, [isAddEntityOpen])

  const handlePlaceSelect = (place: any) => {
    if (!place) return

    try {
      const { cityZip } = parsePlaceToAddressFields(place)
      const fullAddress = resolveFormattedPlaceAddress(place)

      const newFormData = {
        ...formData,
        address: fullAddress,
        cityZip,
      }

      if (formData.sameAsAddress) {
        newFormData.billToAddress = newFormData.address
        newFormData.billToCityZip = newFormData.cityZip
      }

      setFormData(newFormData)
      clearValidationError('address')
      clearValidationError('cityZip')
    } catch (error) {
      console.error('Error parsing address:', error)
      const fallback = resolveFormattedPlaceAddress(place)
      const newFormData = {
        ...formData,
        address: fallback,
      }
      if (formData.sameAsAddress) {
        newFormData.billToAddress = newFormData.address
      }
      setFormData(newFormData)
    }
  }

  // Effect to restore selected names from formData when component mounts or formData changes
  useEffect(() => {
    // Restore customer name from formData
    if (formData.customerName && !selectedCustomerName) {
      setSelectedCustomerName(formData.customerName)
    }

    // Restore contractor name from formData
    if (formData.contractorName && !selectedContractorName) {
      setSelectedContractorName(formData.contractorName)
    }
  }, [formData.customerName, formData.contractorName, selectedCustomerName, selectedContractorName])

  // Fallback effect to restore names from API if not in formData (for backward compatibility)
  useEffect(() => {
    const restoreSelectedNamesFromAPI = async () => {
      // Restore customer name if customer is selected but name is not in formData
      if (formData.customer && !formData.customerName && !selectedCustomerName) {
        try {
          const response = await apiClient.getCustomers(1, 100) // Get more items to find the selected one
          console.log('response', response)
          const customer = response.data.find((c: any) => String(c.id) === String(formData.customer))
          console.log('customer', customer)
          if (customer) {
            const customerName = customer.name || customer.customer_name || customer.company_name || ''
            const customerEmail = getCustomerEmail(customer)
            setFormData(prev => {
              const next = { ...prev, customerName }
              if (!prev.email || prev.customer === String(customer.id)) {
                next.email = customerEmail
                if (prev.sameAsAddress) next.billToEmail = customerEmail
              }
              return next
            })
            setSelectedCustomerName(customerName)
          }
        } catch (error) {
          console.error('Error restoring customer name from API:', error)
        }
      }

      // Restore contractor name if contractor is selected but name is not in formData
      if (formData.contractor && !formData.contractorName && !selectedContractorName) {
        try {
          const response = await apiClient.getContractors(1, 100) // Get more items to find the selected one
          console.log('response', response)
          const contractor = response.data.find((c: any) => String(c.id) === String(formData.contractor))
          if (contractor) {
            const contractorName = contractor.name || contractor.contractor_name || contractor.company_name || ''
            const contractorEmail = getContractorEmail(contractor)
            setFormData(prev => {
              const next = { ...prev, contractorName }
              if (prev.type === 'contract-based' && (!prev.email || prev.contractor === String(contractor.id))) {
                next.email = contractorEmail
                if (prev.sameAsAddress) next.billToEmail = contractorEmail
              }
              return next
            })
            setSelectedContractorName(contractorName)
          }
        } catch (error) {
          console.error('Error restoring contractor name from API:', error)
        }
      }
    }

    restoreSelectedNamesFromAPI()
  }, [formData.customer, formData.contractor, formData.customerName, formData.contractorName, selectedCustomerName, selectedContractorName])


  const renderStepIndicator = () => (
    <div className="mb-8 overflow-x-auto">
      <div className="flex min-w-max items-center justify-center px-4">
      {steps.map((step, index) => {
        const Icon = step.icon
        const isActive = currentStep === step.id
        const isCompleted = currentStep > step.id
        
        return (
          <div key={step.id} className="flex shrink-0 items-center">
            <div className={`
              flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all
              ${isActive ? 'bg-[#00A1FF] border-[#00A1FF] text-white' : 
                isCompleted ? 'bg-green-500 border-green-500 text-white' : 
                'bg-white border-gray-300 text-gray-500'}
            `}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="ml-3 text-sm">
              <p className={`font-medium ${isActive ? 'text-[#00A1FF]' : isCompleted ? 'text-green-600' : 'text-gray-500'}`}>
                {step.title}
              </p>
            </div>
            {index < steps.length - 1 && (
              <div className={`
                h-px w-12 mx-4 transition-all
                ${isCompleted ? 'bg-green-500' : 'bg-gray-300'}
              `} />
            )}
          </div>
        )
      })}
      </div>
    </div>
  )

  const renderStep1 = () => (
    <Card className="bg-white shadow-md border-0">
      <CardHeader>
        <CardTitle className="text-center">Select Job Type</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div 
            className={`
              p-6 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md
              ${formData.type === 'service-based' ? 'border-[#00A1FF] bg-[#E6F6FF]' : 'border-gray-200 hover:border-gray-300'}
            `}
            onClick={() =>
              setFormData((prev) => ({
                ...prev,
                type: 'service-based',
                customer: '',
                customerName: '',
                contractor: '',
                contractorName: '',
                selectedEntityType: '',
              }))
            }
          >
            <div className="text-center space-y-4">
              <div className={`
                w-16 h-16 mx-auto rounded-full flex items-center justify-center
                ${formData.type === 'service-based' ? 'bg-[#00A1FF]' : 'bg-gray-100'}
              `}>
                <FileText className={`h-8 w-8 ${formData.type === 'service-based' ? 'text-white' : 'text-gray-500'}`} />
              </div>
              <div>
                <h3 className="font-medium text-[#2b2b2b] mb-2">Service-Based Job</h3>
                <p className="text-sm text-gray-600">
                  One-time service jobs with specific deliverables and timeline. 
                  Suitable for installations, repairs, and maintenance tasks.
                </p>
              </div>
            </div>
          </div>

          <div 
            className={`
              p-6 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md
              ${formData.type === 'contract-based' ? 'border-[#00A1FF] bg-[#E6F6FF]' : 'border-gray-200 hover:border-gray-300'}
            `}
            onClick={() =>
              setFormData((prev) => ({
                ...prev,
                type: 'contract-based',
                customer: '',
                customerName: '',
                contractor: '',
                contractorName: '',
                selectedEntityType: '',
              }))
            }
          >
            <div className="text-center space-y-4">
              <div className={`
                w-16 h-16 mx-auto rounded-full flex items-center justify-center
                ${formData.type === 'contract-based' ? 'bg-[#00A1FF]' : 'bg-gray-100'}
              `}>
                <Users className={`h-8 w-8 ${formData.type === 'contract-based' ? 'text-white' : 'text-gray-500'}`} />
              </div>
              <div>
                <h3 className="font-medium text-[#2b2b2b] mb-2">Contract-Based Job</h3>
                <p className="text-sm text-gray-600">
                  Ongoing contract work with external contractors. 
                  Suitable for long-term projects and outsourced services.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderStep2 = () => (
    <Card className=" border-0"> 
      <CardContent className="space-y-6">
        <div className="bg-white shadow-lg p-3"> 
          <h3 className="font-bold text-[#2b2b2b] mb-4 text-lg">Job Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="title">Job Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => {
                setFormData({...formData, title: e.target.value})
                clearValidationError('title')
              }}
              placeholder="Enter job title"
              className={validationErrors.title ? 'border-red-500' : ''}
              required
            />
            {validationErrors.title && (
              <p className="text-red-500 text-sm">{validationErrors.title}</p>
            )}
          </div>

          {/* Customer field only for service-based jobs, Contractor field for contract-based */}
          {formData.type === 'service-based' ? (
            <div className="space-y-1">
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="customer">Customer *</Label>
                <button
                  type="button"
                  className="px-0 text-xs text-[#00A1FF] cursor-pointer hover:underline"
                  onClick={() => openAddEntityModal('customer')}
                >
                  + Add Customer
                </button>
              </div>
              <AutoScrollSelect
                value={formData.customer}
                onValueChange={(value, item) => {
                  selectedEntityForLocationRef.current = item ?? null
                  const customerName =
                    item?.name || item?.customer_name || item?.company_name || '' 
                  const customerEmail = getCustomerEmail(item)
                  const entityType = resolveSelectedEntityType(item) || 'customer'

                  setFormData((prev) => {
                    let next = {
                      ...prev,
                      customer: value,
                      customerName,
                      email: customerEmail,
                      selectedEntityType: entityType,
                    }
                    if (prev.useEntityAddressForLocation && item) {
                      next = applyEntityToLocationFields(next, item)
                    } else if (prev.sameAsAddress) {
                      next.billToEmail = customerEmail
                    }
                    return next
                  })
                  setSelectedCustomerName(customerName)
                  clearValidationError('customer')
                  clearValidationError('email')
                }}
                placeholder="Select customer"
                fetchData={apiClient.getCustomers}
                serverSearchFetch={searchCustomersForJobSelect}
                pageSize={JOB_ENTITY_SELECT_PAGE_SIZE}
                displayField="name"
                valueField="id"
                refreshKey={customerRefreshKey}
                className={validationErrors.customer ? 'border-red-500' : ''}
                onCreateNew={() => openAddEntityModal('customer')}   // ← ADD
                createNewLabel="+ Create Customer"  
                renderItem={(item:any) => (
                  <div className="flex items-center gap-2">
                    <span>{item.name || item.customer_name || item.company_name}</span>
                    {item.tag && (
                      <span className="px-1.5 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700 font-medium">
                        {item.tag}  {/* ya item.tag_name, item.tags[0] — API ke hisaab se */}
                      </span>
                    )}
                  </div>
                )}
              />
              {validationErrors.customer && (
                <p className="text-red-500 text-sm">{validationErrors.customer}</p>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="contractor">Contractor *</Label>
                <button
                  type="button"
                  className="px-0 text-xs text-[#00A1FF] cursor-pointer hover:underline"
                  onClick={() => openAddEntityModal('contractor')}
                >
                  + Add Contractor
                </button>
              </div>
              <AutoScrollSelect
                value={formData.contractor}
                onValueChange={(value, item) => {
                  selectedEntityForLocationRef.current = item ?? null
                  const contractorName =
                    item?.name || item?.contractor_name || item?.company_name || ''
                  const contractorEmail = getContractorEmail(item)
                  const entityType = resolveSelectedEntityType(item) || 'contractor'

                  setFormData((prev) => {
                    let next = {
                      ...prev,
                      contractor: value,
                      contractorName,
                      selectedEntityType: entityType,
                    }
                    if (prev.type === 'contract-based') {
                      next.email = contractorEmail
                    }
                    if (prev.useEntityAddressForLocation && item) {
                      next = applyEntityToLocationFields(next, item)
                    } else if (
                      prev.type === 'contract-based' &&
                      prev.sameAsAddress
                    ) {
                      next.billToEmail = contractorEmail
                    }
                    return next
                  })
                  setSelectedContractorName(contractorName)
                  clearValidationError('contractor')
                  if (formData.type === 'contract-based') {
                    clearValidationError('email')
                  }
                }}
                placeholder="Select contractor"
                fetchData={apiClient.getContractors}
                serverSearchFetch={searchContractorsForJobSelect}
                pageSize={JOB_ENTITY_SELECT_PAGE_SIZE}
                displayField="name"
                valueField="id"
                refreshKey={contractorRefreshKey}
                className={validationErrors.contractor ? 'border-red-500' : ''}
                onCreateNew={() => openAddEntityModal('contractor')}  // ← ADD
                createNewLabel="+ Create Contractor" 
                renderItem={(item:any) => (
                  <div className="flex items-center gap-2">
                    <span>{item.name || item.contractor_name || item.company_name}</span>
                    {item.tag && (
                      <span className="px-1.5 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700 font-medium">
                        {item.tag}  {/* ya item.tag_name, item.tags[0] — API ke hisaab se */}
                      </span>
                    )}
                  </div>
                )}
              />
              {validationErrors.contractor && (
                <p className="text-red-500 text-sm">{validationErrors.contractor}</p>
              )}
            </div>
          )}
        </div>

        <div className="space-y-2 mt-3">
          <Label htmlFor="description" className="font-bold">
            Description *
          </Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => {
              setFormData({...formData, description: e.target.value})
              clearValidationError('description')
            }}
            placeholder="Describe the job requirements and scope"
            rows={4}
            className={`min-h-[100px] whitespace-pre-wrap break-words ${validationErrors.description ? 'border-red-500' : ''}`}
            required
          />
          {validationErrors.description && (
            <p className="text-red-500 text-sm">{validationErrors.description}</p>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-3">
          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              min={new Date().toISOString().split('T')[0]} // Prevent selecting past dates
              onChange={(e) => {
                setFormData({...formData, dueDate: e.target.value})
              }}
            />
          </div>

          

          <div className="space-y-2">
            <Label htmlFor="estimatedCost">Estimated Cost ($)</Label>
            <Input
              id="estimatedCost"
              type="number"
              min="0"
              step="0.01"
              value={formData.estimatedCost || ''}
              onChange={(e) => {
                const rawValue = e.target.value
                const numericValue = Number(rawValue)
                setFormData({ ...formData, estimatedCost: rawValue === '' ? 0 : numericValue })

                setValidationErrors(prev => {
                  const next = { ...prev }
                  if (
                    rawValue !== '' &&
                    (!Number.isFinite(numericValue) || numericValue < 0)
                  ) {
                    next.estimatedCost = 'Estimated amount cannot be negative'
                  } else {
                    delete next.estimatedCost
                  }
                  return next
                })
              }}
              placeholder="0.00"
              className={validationErrors.estimatedCost ? 'border-red-500' : ''}
            />
            {validationErrors.estimatedCost && (
              <p className="text-red-500 text-sm">{validationErrors.estimatedCost}</p>
            )}
          </div>
        </div>
          </div> 

        {/* Enhanced Location Section */}
        <div className="space-y-4 bg-white shadow-lg p-3">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-5 w-5 text-[#00A1FF]" />
            <h3 className="font-bold text-[#2b2b2b]  text-lg">Location Information</h3>
          </div>

          <div className="flex items-center space-x-2 mb-4">
            <Checkbox
              id="useEntityAddressForLocation"
              checked={formData.useEntityAddressForLocation}
              onCheckedChange={(checked) =>
                handleUseEntityAddressForLocationChange(checked === true)
              }
            />
            <Label htmlFor="useEntityAddressForLocation" className="text-sm font-medium">
              {formData.type === 'contract-based'
                ? 'Same as contractor address'
                : 'Same as customer address'}
            </Label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="address">Address *</Label>
              <Autocomplete
                apiKey={GOOGLE_MAPS_API_KEY}
                options={ADDRESS_AUTOCOMPLETE_OPTIONS}
                onPlaceSelected={(place: any) => {
                  handlePlaceSelect(place)
                }}
                className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${validationErrors.address ? 'border-red-500' : ''}`}
                placeholder={ADDRESS_SEARCH_PLACEHOLDER}
                defaultValue={formData.address}
                onChange={(e: any) => {
                  const value = e.target.value
                  const newFormData = {...formData, address: value}
                  if (formData.sameAsAddress) {
                    newFormData.billToAddress = value
                  }
                  setFormData(newFormData)
                  clearValidationError('address')
                }}
              />
              {validationErrors.address && (
                <p className="text-red-500 text-sm">{validationErrors.address}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cityZip">City & Zip *</Label>
              <Input
                id="cityZip"
                value={formData.cityZip}
                onChange={(e) => {
                  const newFormData = {...formData, cityZip: e.target.value}
                  if (formData.sameAsAddress) {
                    newFormData.billToCityZip = e.target.value
                  }
                  setFormData(newFormData)
                  clearValidationError('cityZip')
                }}
                placeholder="City, State ZIP"
                className={validationErrors.cityZip ? 'border-red-500' : ''}
                required
              />
              {validationErrors.cityZip && (
                <p className="text-red-500 text-sm">{validationErrors.cityZip}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <PhoneInput
                id="phone"
                value={formData.phone}
                countryCallingCodeEditable={false}
                limitMaxLength
                  withCountryCallingCode
                  defaultCountry="US"
                onChange={(value) => {
                  const safeValue = value || ''
                  const newFormData = { ...formData, phone: safeValue }
                  if (formData.sameAsAddress) {
                    newFormData.billToPhone = safeValue
                  }
                  setFormData(newFormData)
                  clearValidationError('phone')
                }}
                international
                placeholder="Phone number"
                className={
                  validationErrors.phone
                    ? 'border border-red-500 rounded-md px-2 py-2'
                    : 'border border-gray-300 rounded-md px-2 py-2'
                }
              />
              
              {validationErrors.phone && (
                <p className="text-red-500 text-sm">{validationErrors.phone}</p>
              )}
            </div>

            {/* <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => {
                  const newFormData = {...formData, email: e.target.value}
                  if (formData.sameAsAddress) {
                    newFormData.billToEmail = e.target.value
                  }
                  setFormData(newFormData)
                  clearValidationError('email')
                }}
                placeholder="Email address"
                disabled={
                  (formData.type === 'service-based' && !!formData.customer) ||
                  (formData.type === 'contract-based' && !!formData.contractor)
                }
                className={validationErrors.email ? 'border-red-500' : ''}
              />
              {validationErrors.email && (
                <p className="text-red-500 text-sm">{validationErrors.email}</p>
              )}
            </div> */}
          </div>
        </div>
        {showAssignedSection && (
          <div className="space-y-4 bg-white shadow-lg p-3">
            <div className="flex items-center gap-2 mb-4">
              <UserCheck className="h-5 w-5 text-[#00A1FF]" /> 
              <h3 className="font-bold text-[#2b2b2b]  text-lg">Assigned Lead Labor & Labor</h3>
            </div>
            {canAssignLeadLabor && (
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  {/* <UserCheck className="h-4 w-4 text-[#00A1FF]" /> */}
                  Assigned Lead Labor
                </Label>

                <AutoScrollMultiSelect
                  selectedValues={formData.assignedLeadLabor}
                  selectedObjects={selectedLeadLaborItems}
                  onSelectionChange={handleLeadLaborChange}
                  placeholder="Select lead labor"
                  fetchData={apiClient.getLeadLabor}
                  displayField="name"
                  valueField="id"
                />
              </div>
            )}

            {canAssignLabor && (
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  {/* <Users className="h-4 w-4 text-[#00A1FF]" /> */}
                  Assigned Labor
                </Label>

                <AutoScrollMultiSelect
                  selectedValues={formData.assignedLabor}
                  selectedObjects={selectedLaborItems}
                  onSelectionChange={handleLaborChange}
                  placeholder="Select labor"
                  fetchData={apiClient.getLabor}
                  displayField="name"
                  valueField="id"
                />
              </div>
            )}
          </div>
        )}
        {/* Bill To Section */}
        <div className="space-y-4 bg-white shadow-lg p-3">
          <div className="flex items-center gap-2 mb-4">
            <Building className="h-5 w-5 text-[#00A1FF]" />
            <h3 className="font-bold text-[#2b2b2b] text-[14.8px]  text-lg">Bill To Information</h3>
          </div>

          <div className="flex items-center space-x-2 mb-4">
            <Checkbox
              id="sameAsAddress"
              checked={formData.sameAsAddress}
              onCheckedChange={handleSameAsAddressChange}
            />
            <Label htmlFor="sameAsAddress" className="text-sm font-medium">
              Same as Address
            </Label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="billToAddress">Bill To Address</Label>
              <Input
                id="billToAddress"
                value={formData.billToAddress}
                onChange={(e) => setFormData({...formData, billToAddress: e.target.value})}
                placeholder="Enter billing address"
                disabled={formData.sameAsAddress}
                className={formData.sameAsAddress ? 'bg-gray-50' : ''}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="billToCityZip">Bill To City & Zip</Label>
              <Input
                id="billToCityZip"
                value={formData.billToCityZip}
                onChange={(e) => setFormData({...formData, billToCityZip: e.target.value})}
                placeholder="City, State ZIP"
                disabled={formData.sameAsAddress}
                className={formData.sameAsAddress ? 'bg-gray-50' : ''}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="billToPhone">Bill To Phone</Label>
              <Input
                id="billToPhone"
                value={formData.billToPhone}
                onChange={(e) => {
                  setFormData({...formData, billToPhone: e.target.value})
                  clearValidationError('billToPhone')
                }}
                placeholder="Phone number (10 digits)"
                disabled={formData.sameAsAddress}
                className={`${formData.sameAsAddress ? 'bg-gray-50' : ''} ${validationErrors.billToPhone ? 'border-red-500' : ''}`}
              />
              {validationErrors.billToPhone && (
                <p className="text-red-500 text-sm">{validationErrors.billToPhone}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="billToEmail">Bill To Email</Label>
              <Input
                id="billToEmail"
                type="email"
                value={formData.billToEmail}
                onChange={(e) => {
                  setFormData({...formData, billToEmail: e.target.value})
                  clearValidationError('billToEmail')
                }}
                placeholder="Email address"
                disabled={formData.sameAsAddress}
                className={`${formData.sameAsAddress ? 'bg-gray-50' : ''} ${validationErrors.billToEmail ? 'border-red-500' : ''}`}
              />
              {validationErrors.billToEmail && (
                <p className="text-red-500 text-sm">{validationErrors.billToEmail}</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )



  const renderStep3 = () => (
    <Card className="bg-white shadow-md border-0">
      <CardHeader>
        <CardTitle>Review Job Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-[14.8px] text-[#2b2b2b] mb-2">Job Information</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-semibold text-[#2b2b2b]">Type:</span>
                  <Badge className="bg-[#E6F6FF] text-[#00A1FF] border-[#00A1FF]/20">
                    {formData.type === 'service-based' ? 'Service-Based' : 'Contract-Based'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-[#2b2b2b]">Title:</span>
                  <span className="text-gray-600">{formData.title}</span>
                </div>
                {formData.type === 'service-based' && formData.customer && (
                  <div className="flex justify-between">
                    <span className="font-semibold text-[#2b2b2b]">Customer:</span>
                    <span className="text-gray-600">
                      {formData.customerName || selectedCustomerName || `Customer ID: ${formData.customer}`}
                    </span>
                  </div>
                )}
                {formData.contractor && (
                  <div className="flex justify-between">
                    <span className="font-semibold text-[#2b2b2b]">Contractor:</span>
                    <span className="text-gray-600">
                      {formData.contractorName || selectedContractorName || `Contractor ID: ${formData.contractor}`}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-base text-[#2b2b2b] mb-2">Description:</h4>
              <div
                ref={jobReviewDescriptionBoxRef}
                className="relative w-full min-w-0 max-w-full"
              >
                {/* Invisible full-width copy for measuring whether content exceeds two lines */}
                <p
                  ref={jobReviewDescriptionMeasureRef}
                  className="absolute left-0 right-0 top-0 z-[-1] m-0 max-w-full min-w-0 text-sm whitespace-pre-wrap break-words opacity-0 pointer-events-none select-none"
                  aria-hidden
                >
                  {formData.description || ''}
                </p>
                <p
                  className={[
                    'm-0 text-sm text-gray-700 w-full min-w-0 max-w-full break-words',
                    jobReviewDescriptionExpanded || !jobReviewDescriptionNeedsToggle
                      ? 'whitespace-pre-wrap'
                      : 'line-clamp-2 overflow-hidden whitespace-pre-wrap',
                  ].join(' ')}
                >
                  {formData.description || ''}
                </p>
                {jobReviewDescriptionNeedsToggle && (
                  <div className="mt-1 min-h-[1.375rem]">
                    <button
                      type="button"
                      onClick={() => setJobReviewDescriptionExpanded(!jobReviewDescriptionExpanded)}
                      className="text-[#00A1FF] hover:underline text-sm font-medium"
                    >
                      {jobReviewDescriptionExpanded ? 'View Less' : 'View More'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Location Information */}
            <div>
              <h4 className="font-semibold text-[14.8px] text-[#2b2b2b] mb-2">Location Information</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-semibold text-[#2b2b2b]">Address:</span>
                  <p className="text-gray-600">{formData.address}</p>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-[#2b2b2b]">City & Zip:</span>
                  <p className="text-gray-600">{formData.cityZip}</p>
                </div>
                {formData.phone && (
                  <div className="flex justify-between">
                    <span className="font-semibold text-[#2b2b2b]">Phone:</span>
                    <span className="text-gray-600">{formData.phone}</span>
                  </div>
                )}
                {/* {formData.email && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">{formData.email}</span>
                  </div>
                )} */}
              </div>
            </div>

            {/* Bill To Information */}
            {(formData.billToAddress || formData.sameAsAddress) && (
              <div>
                <h4 className="font-semibold text-[14.8px] text-[#2b2b2b] mb-2">Bill To Information</h4>
                {formData.sameAsAddress ? (
                  <p className="text-sm text-gray-600">Same as location address</p>
                ) : (
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-semibold text-[#2b2b2b]">Bill To Address:</span>
                      <p className="text-gray-600">{formData.billToAddress}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-[#2b2b2b]">Bill To City & Zip:</span>
                      <p className="text-gray-600">{formData.billToCityZip}</p>
                    </div>
                    {formData.billToPhone && (
                      <div className="flex justify-between">
                        <span className="font-semibold text-[#2b2b2b]">Bill To Phone:</span>
                        <span className="text-gray-600">{formData.billToPhone}</span>
                      </div>
                    )}
                    {formData.billToEmail && (
                      <div className="flex justify-between">
                        <span className="font-semibold text-[#2b2b2b]">Bill To Email:</span>
                        <span className="text-gray-600">{formData.billToEmail}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-[14.8px] text-[#2b2b2b] mb-2">Scheduling & Resources</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <Label htmlFor="title">Due Date:</Label>
                  {/* <span className="font-semibold text-[#2b2b2b]">Due Date:</span> */}
                  <span className="text-gray-600">
                    {formData.dueDate
                      ? new Date(formData.dueDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' })
                      : 'Not specified'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <Label htmlFor="title">Estimated Cost:</Label>
                  {/* <span className="font-semibold text-[#2b2b2b]">Estimated Cost:</span> */}
                  <span className="text-gray-600">
                    {formData.estimatedCost ? `$${formData.estimatedCost.toLocaleString()}` : 'Not specified'}
                  </span>
                </div>
              </div>
            </div>

            {formData.assignedLeadLabor.length > 0 && (
              <div>
                
                <h4 className="flex font-semibold text-base text-[#2b2b2b] mb-2"><Label className='font-semibold' htmlFor="title">Assigned Lead Labor</Label> ({formData.assignedLeadLabor.length})</h4>
                <div className="flex flex-wrap gap-1">
                  {selectedLeadLaborItems.map((item) => (
                    <Badge key={String(item.id)} className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                      {laborSelectionDisplayName(item, String(item.id))}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {formData.assignedLabor.length > 0 && (
              <div>
                <h4 className="flex font-semibold text-base text-[#2b2b2b] mb-2"><Label className='font-semibold' htmlFor="title">Assigned Labor</Label>  ({formData.assignedLabor.length})</h4>
                <div className="flex flex-wrap gap-1">
                  {selectedLaborItems.map((item) => (
                    <Badge key={String(item.id)} className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                      {laborSelectionDisplayName(item, String(item.id))}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        {/* <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Jobs
        </Button> */}
        <div>
          <h1 className="text-2xl font-medium text-[#2b2b2b]">Create New Job</h1>
          <p className="text-sm text-[#2b2b2b]/60 mt-1">
            Follow the steps to create a new job
          </p>
        </div>
      </div>

      {/* Step Indicator */}
      {renderStepIndicator()}

      {/* Step Content */}
      <div className="max-w-4xl mx-auto">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between max-w-4xl mx-auto pt-6">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 1}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Previous
        </Button>

        {currentStep < 3 ? (
          <Button
            onClick={handleNext}
            className="bg-primary text-white hover:bg-[#0090e6] gap-2"
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleCreate}
            disabled={isCreatingJob}
            className="bg-primary text-white hover:bg-[#0090e6] gap-2"
          >
            {isCreatingJob ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Creating Job...
              </>
            ) : (
              <>
            <Check className="h-4 w-4" />
            Create Job
              </>
            )}
          </Button>
        )}
      </div>

      {/* Shared Add Customer / Contractor modal */}
      <Dialog open={isAddEntityOpen} onOpenChange={(open) => setIsAddEntityOpen(open)}>
        <DialogContent
          className="max-w-md"
          onInteractOutside={(e) => {
            const target = e.target as HTMLElement | null
            if (target?.closest?.('.pac-container')) e.preventDefault()
          }}
          onPointerDownOutside={(e) => {
            const target = e.target as HTMLElement | null
            if (target?.closest?.('.pac-container')) e.preventDefault()
          }}
          onFocusOutside={(e) => {
            const target = e.target as HTMLElement | null
            if (target?.closest?.('.pac-container')) e.preventDefault()
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {addEntityType === 'customer' ? 'Add New Customer' : 'Add New Contractor'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 md:grid-cols-2 gap-4 pt-2">
            <div>
              <Label className="mb-1 block">{addEntityType === 'customer' ? 'Customer Name' : 'Contractor Name'} *</Label>
              <Input
                value={entityForm.name}
                onChange={(e) => {
                  setEntityForm({ ...entityForm, name: e.target.value })
                  if (entityErrors.name) {
                    setEntityErrors(prev => ({ ...prev, name: undefined }))
                  }
                }}
                placeholder={addEntityType === 'customer' ? 'Enter customer name' : 'Enter contractor name'}
                className={entityErrors.name ? 'border-red-500' : ''}
              />
              {entityErrors.name && (
                <p className="mt-1 text-xs text-red-500">{entityErrors.name}</p>
              )}
            </div>
            <div>
              <Label className="mb-1 block">Email Address *</Label>
              <Input
                type="email"
                value={entityForm.email}
                onChange={(e) => {
                  setEntityForm({ ...entityForm, email: e.target.value })
                  if (entityErrors.email) {
                    setEntityErrors(prev => ({ ...prev, email: undefined }))
                  }
                }}
                placeholder="Enter email address"
                className={entityErrors.email ? 'border-red-500' : ''}
              />
              {entityErrors.email && (
                <p className="mt-1 text-xs text-red-500">{entityErrors.email}</p>
              )}
            </div>
            <div>
              <Label className="mb-1 block">Phone Number *</Label>
              <PhoneInput
                value={entityForm.phone}
                onChange={(value) => {
                  const safeValue = value || ''
                  setEntityForm({ ...entityForm, phone: safeValue })
                  if (entityErrors.phone) {
                    setEntityErrors(prev => ({ ...prev, phone: undefined }))
                  }
                }}
                international
                withCountryCallingCode
                defaultCountry="US"
                countryCallingCodeEditable={false}
                limitMaxLength
                placeholder="Phone number"
                className={
                  entityErrors.phone
                    ? 'border border-red-500 rounded-md px-2 py-1'
                    : 'border border-gray-300 rounded-md px-2 py-1'
                }
              />
              {entityErrors.phone && (
                <p className="mt-1 text-xs text-red-500">{entityErrors.phone}</p>
              )}
            </div>
            {addEntityType === 'customer' ? (
              <div>
                <Label className="mb-1 block">Contact Person</Label>
                <Input
                  value={entityForm.contactPerson}
                  onChange={(e) => setEntityForm({ ...entityForm, contactPerson: e.target.value })}
                  placeholder="Enter contact person name"
                />
              </div>
            ) : (
              <div>
                <Label className="mb-1 block">Company Name *</Label>
                <Input
                  value={entityForm.company}
                  onChange={(e) => {
                    setEntityForm({ ...entityForm, company: e.target.value })
                    if (entityErrors.company) {
                      setEntityErrors(prev => ({ ...prev, company: undefined }))
                    }
                  }}
                  placeholder="Enter company name"
                  className={entityErrors.company ? 'border-red-500' : ''}
                />
                {entityErrors.company && (
                  <p className="mt-1 text-xs text-red-500">{entityErrors.company}</p>
                )}
              </div>
            )}
            <div className="col-span-2">
              <Label className="mb-1 block">Address{addEntityType === 'customer' ? ' *' : ''}</Label>
              <Autocomplete
                apiKey={GOOGLE_MAPS_API_KEY}
                options={ADDRESS_AUTOCOMPLETE_OPTIONS}
                value={entityForm.address}
                onChange={(e: any) => {
                  setEntityForm({ ...entityForm, address: e.target.value })
                  if (entityErrors.address) {
                    setEntityErrors(prev => ({ ...prev, address: undefined }))
                  }
                }}
                onPlaceSelected={(place: any) => {
                  const address = resolveFormattedPlaceAddress(place)
                  setEntityForm({ ...entityForm, address })
                  if (entityErrors.address) {
                    setEntityErrors(prev => ({ ...prev, address: undefined }))
                  }
                }}
                placeholder={ADDRESS_SEARCH_PLACEHOLDER}
                className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                  addEntityType === 'customer' && entityErrors.address ? 'border-red-500' : 'border-input'
                }`}
              />
              {addEntityType === 'customer' && entityErrors.address && (
                <p className="mt-1 text-xs text-red-500">{entityErrors.address}</p>
              )}
            </div>
            {addEntityType === 'customer' && (
              <div className="col-span-2">
                <Label className="mb-1 block">Company Name *</Label>
                <Input
                  value={entityForm.company}
                  onChange={(e) => {
                    setEntityForm({ ...entityForm, company: e.target.value })
                    if (entityErrors.company) {
                      setEntityErrors(prev => ({ ...prev, company: undefined }))
                    }
                  }}
                  placeholder="Enter company name"
                  className={entityErrors.company ? 'border-red-500' : ''}
                />
                {entityErrors.company && (
                  <p className="mt-1 text-xs text-red-500">{entityErrors.company}</p>
                )}
              </div>
            )}
            <div className="col-span-2">
              <Label className="mb-1 block">Status{addEntityType === 'customer' ? ' *' : ''}</Label>
              <Select
                value={entityForm.status}
                onValueChange={(value) => setEntityForm({ ...entityForm, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddEntityOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreateEntity}
              disabled={addEntityLoading || !addEntityType}
              className='text-white'
            >
              {addEntityLoading
                ? addEntityType === 'customer' ? 'Saving customer...' : 'Saving contractor...'
                : addEntityType === 'customer' ? 'Save Customer' : 'Save Contractor'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}