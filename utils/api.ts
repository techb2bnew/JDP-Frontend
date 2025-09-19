import { clearAuthData } from './auth'

// API utility functions with authentication

const API_BASE_URL = 'http://127.0.0.1:3000/api'

// Helper function to get auth token
const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    const savedAuth = localStorage.getItem('jdp_auth')
    if (savedAuth) {
      try {
        const authData = JSON.parse(savedAuth)
        if (authData.token && authData.expires > Date.now()) {
          return authData.token
        }
      } catch (error) {
        console.error('Error parsing auth data:', error)
      }
    }
  }
  return null
}

// Global token revocation handler
const handleTokenRevocation = async () => {
  console.log('Token revoked - clearing auth data and redirecting to login')
  await clearAuthData()
  
  // Show toast notification
  if (typeof window !== 'undefined') {
    // Import toast dynamically to avoid SSR issues
    const { toast } = await import('sonner')
    toast.error('Session expired. Please login again.')
  }
  
  // Redirect to login page
  if (typeof window !== 'undefined') {
    window.location.href = '/login'
  }
}

// Helper function to make authenticated API calls with global token handling
const authenticatedFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken()
  
  if (!token) {
    await handleTokenRevocation()
    throw new Error('No authentication token found')
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  })

  if (!response.ok) {
    // Handle token revocation globally
    if (response.status === 401) {
      try {
        const errorData = await response.json().catch(() => ({}))
        
        // Check for specific token revocation message
        if (errorData.message && (
          errorData.message.includes('Token has been revoked') ||
          errorData.message.includes('Token expired') ||
          errorData.message.includes('Invalid token') ||
          errorData.message.includes('Please login again')
        )) {
          await handleTokenRevocation()
          throw new Error('Session expired. Please login again.')
        }
      } catch (parseError) {
        // If we can't parse the error, still handle as token revocation
        await handleTokenRevocation()
        throw new Error('Session expired. Please login again.')
      }
    }
    
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || `API request failed: ${response.status}`)
  }

  return response.json()
}

// Global API interceptor for manual fetch calls
export const globalApiCall = async (url: string, options: RequestInit = {}) => {
  const token = getAuthToken()
  
  // Add authorization header if token exists
  const headers = {
    'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    ...options.headers,
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  if (!response.ok) {
    // Handle token revocation globally
    if (response.status === 401) {
      try {
        const errorData = await response.json().catch(() => ({}))
        
        // Check for specific token revocation message
        if (errorData.message && (
          errorData.message.includes('Token has been revoked') ||
          errorData.message.includes('Token expired') ||
          errorData.message.includes('Invalid token') ||
          errorData.message.includes('Please login again')
        )) {
          await handleTokenRevocation()
          throw new Error('Session expired. Please login again.')
        }
      } catch (parseError) {
        // If we can't parse the error, still handle as token revocation
        await handleTokenRevocation()
        throw new Error('Session expired. Please login again.')
      }
    }
    
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || `API request failed: ${response.status}`)
  }

  return response
}

export const apiClient = {
  // Auth
  login: async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Login failed')
    }

    return response.json()
  },

  signup: async (email: string, role: string, otp: string) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, role, otp }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Registration failed')
    }

    return response.json()
  },

  // Jobs
  getJobById: async (jobId: string) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL
    const token = getAuthToken()

    if (!token) {
      throw new Error('No authentication token found')
    }

    const response = await fetch(`${apiBaseUrl}/job/getJobById/${jobId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Failed to fetch job details')
    }

    const result = await response.json()
    console.log('Job Details API Response:', result)

    if (!result.data) {
      console.error('Job Details API: Unexpected response structure:', result)
      throw new Error('Invalid job data received')
    }

    const job = result.data

    // Transform the API response to match our Job interface
    const transformedJob = {
      id: job.id.toString(),
      title: job.job_title,
      type: (job.job_type === 'service_based' ? 'service-based' : 'contract-based') as 'service-based' | 'contract-based',
      status: (job.status === 'active' ? 'pending' : job.status === 'in_progress' ? 'in-progress' : job.status) as 'pending' | 'in-progress' | 'completed' | 'cancelled',
      assignedLeadLabor: job.assigned_lead_labor ? job.assigned_lead_labor.map((ll: any) => ll.id.toString()) : [],
      assignedLabor: job.assigned_labor ? job.assigned_labor.map((l: any) => l.user?.full_name || l.labor_code) : [],
      contractor: job.contractor_id ? job.contractor_id.toString() : undefined,
      customer: job.customer_id ? job.customer_id.toString() : undefined,
      description: job.description,
      createdDate: job.created_at ? job.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
      dueDate: job.due_date,
      estimatedHours: job.estimated_hours,
      estimatedCost: job.estimated_cost,
      actualCost: job.estimated_cost, // Use estimated cost as actual cost for now
      materials: job.assigned_material_ids ? JSON.parse(job.assigned_material_ids) : [],
      address: job.address,
      cityZip: job.city_zip,
      location: `${job.address}, ${job.city_zip}`, // Add location field for JobDetailsPage
      phone: job.phone,
      email: job.email,
      billToAddress: job.bill_to_address,
      billToCityZip: job.bill_to_city_zip,
      billToPhone: job.bill_to_phone,
      billToEmail: job.bill_to_email,
      sameAsAddress: job.same_as_address,
      priority: job.priority as 'low' | 'medium' | 'high' | 'urgent',
      billingStatus: 'pending' as 'pending' | 'invoiced' | 'paid',
      // Additional fields from API
      customerName: job.customer?.customer_name || job.customer?.company_name,
      contractorName: job.contractor?.contractor_name || job.contractor?.company_name,
      createdBy: job.created_by_user?.full_name,
      assignedLeadLaborDetails: job.assigned_lead_labor || [],
      assignedLaborDetails: job.assigned_labor || [],
      assignedMaterialsDetails: job.assigned_materials || [],
      customLabor: job.custom_labor || []
    }

    console.log('Transformed job details:', transformedJob)
    console.log('Location field:', transformedJob.location)
    return transformedJob
  },

  getJobs: async (page: number = 1, limit: number = 5) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL
    const token = getAuthToken()

    if (!token) {
      throw new Error('No authentication token found')
    }

    const response = await fetch(`${apiBaseUrl}/job/getJobs?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Failed to fetch jobs')
    }

    const result = await response.json()
    console.log('Jobs API Response:', result)

    if (!result.data || !result.data.jobs) {
      console.error('Jobs API: Unexpected response structure:', result)
      return {
        data: [],
        totalPages: 1,
        currentPage: 1,
        total: 0
      }
    }

    // Transform the API response to match our Job interface
    const transformedData = {
      data: result.data.jobs.map((job: any) => ({
        id: job.id.toString(),
        title: job.job_title,
        type: job.job_type === 'service_based' ? 'service-based' : 'contract-based',
        status: job.status === 'active' ? 'pending' : job.status === 'in_progress' ? 'in-progress' : job.status,
        assignedLeadLabor: job.assigned_lead_labor ? job.assigned_lead_labor.map((ll: any) => ll.id.toString()) : [],
        assignedLabor: job.assigned_labor ? job.assigned_labor.map((l: any) => l.user?.full_name || l.labor_code) : [],
        contractor: job.contractor_id ? job.contractor_id.toString() : undefined,
        customer: job.customer_id ? job.customer_id.toString() : undefined,
        description: job.description,
        createdDate: job.created_at ? job.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
        dueDate: job.due_date,
        estimatedHours: job.estimated_hours,
        estimatedCost: job.estimated_cost,
        actualCost: job.estimated_cost, // Use estimated cost as actual cost for now
        materials: job.assigned_material_ids ? JSON.parse(job.assigned_material_ids) : [],
        address: job.address,
        cityZip: job.city_zip,
        location: `${job.address}, ${job.city_zip}`, // Add location field for JobDetailsPage
        phone: job.phone,
        email: job.email,
        billToAddress: job.bill_to_address,
        billToCityZip: job.bill_to_city_zip,
        billToPhone: job.bill_to_phone,
        billToEmail: job.bill_to_email,
        sameAsAddress: job.same_as_address,
        priority: job.priority,
        billingStatus: 'pending',
        // Additional fields from API
        customerName: job.customer?.customer_name || job.customer?.company_name,
        contractorName: job.contractor?.contractor_name || job.contractor?.company_name,
        createdBy: job.created_by_user?.full_name,
        assignedLeadLaborDetails: job.assigned_lead_labor || [],
        assignedLaborDetails: job.assigned_labor || [],
        assignedMaterialsDetails: job.assigned_materials || [],
        customLabor: job.custom_labor || []
      })),
      totalPages: result.data.pagination?.totalPages || 1,
      currentPage: result.data.pagination?.page || 1,
      total: result.data.pagination?.total || 0
    }

    console.log('Transformed jobs data:', transformedData)
    return transformedData
  },


  updateJob: async (jobId: string, jobData: {
    job_title: string,
    job_type: string,
    customer_id?: number,
    contractor_id?: number,
    description: string,
    priority: string,
    address: string,
    city_zip: string,
    phone?: string,
    email?: string,
    bill_to_address?: string,
    bill_to_city_zip?: string,
    bill_to_phone?: string,
    bill_to_email?: string,
    same_as_address: boolean,
    due_date: string,
    estimated_hours?: number,
    estimated_cost?: number,
    assigned_lead_labor_ids?: string,
    assigned_labor_ids?: string,
    assigned_material_ids?: string,
    status: string
  }) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL
    const token = getAuthToken()

    if (!token) {
      throw new Error('No authentication token found')
    }

    const response = await fetch(`${apiBaseUrl}/job/updateJob/${jobId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(jobData),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Failed to update job')
    }

    return response.json()
  },

  deleteJob: async (jobId: string) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL
    const token = getAuthToken()

    if (!token) {
      throw new Error('No authentication token found')
    }

    const response = await fetch(`${apiBaseUrl}/job/deleteJob/${jobId}`, {
      method: 'DELETE',
      headers: { 
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Failed to delete job')
    }

    return response.json()
  },

  getJobStats: async () => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL
    const token = getAuthToken()

    if (!token) {
      throw new Error('No authentication token found')
    }

    const response = await fetch(`${apiBaseUrl}/job/getJobStats/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Failed to fetch job statistics')
    }

    const result = await response.json()
    console.log('Job Stats API Response:', result)

    if (!result.data) {
      console.error('Job Stats API: Unexpected response structure:', result)
      return {
        total: 0,
        active: 0,
        completed: 0,
        draft: 0,
        pending: 0,
        totalRevenue: '0.00',
        activePercentage: '0.0',
        completedPercentage: '0.0',
        draftPercentage: '0.0',
        pendingPercentage: '0.0'
      }
    }

    return result.data
  },

  // Profiles
  getProfiles: async (type?: string) => {
    const endpoint = type ? `/profiles?type=${type}` : '/profiles'
    return authenticatedFetch(endpoint)
  },

  createProfile: async (profileData: any) => {
    return authenticatedFetch('/profiles', {
      method: 'POST',
      body: JSON.stringify(profileData),
    })
  },

  updateProfile: async (profileId: string, profileData: any) => {
    return authenticatedFetch(`/profiles/${profileId}`, {
      method: 'PUT',
      body: JSON.stringify(profileData),
    })
  },

  // Invoices
  getInvoices: async () => {
    return authenticatedFetch('/invoices')
  },

  createInvoice: async (invoiceData: any) => {
    return authenticatedFetch('/invoices', {
      method: 'POST',
      body: JSON.stringify(invoiceData),
    })
  },

  // Notifications
  getNotifications: async () => {
    return authenticatedFetch('/notifications')
  },

  // User management
  getCurrentUser: async () => {
    return authenticatedFetch('/user/profile')
  },

  getUserProfile: async (userId: string) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL
    const response = await globalApiCall(`${apiBaseUrl}/staff/getStaffById/${userId}`, {
      method: 'GET',
    })
    return response.json()
  },

  // Update User Profile
  updateUserProfile: async (userId: string, profileData: {
    full_name: string,
    email: string,
    phone: string,
    position: string,
    department: string,
    address: string,
    bio?: string,
    emergency_contact?: string,
    date_of_birth: string,
    employee_id: string,
    system_role: string
  }) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL
    const token = getAuthToken()
    
    if (!token) {
      throw new Error('No authentication token found')
    }

    const response = await fetch(`${apiBaseUrl}/staff/updateStaff/${userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(profileData),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Failed to update profile')
    }

    return response.json()
  },


  // Change Password
  changePassword: async (userId: string, currentPassword: string, newPassword: string) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL
    const token = getAuthToken()
    
    if (!token) {
      throw new Error('No authentication token found')
    }

    const response = await fetch(`${apiBaseUrl}/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        userId,
        currentPassword,
        newPassword
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Password change failed')
    }

    return response.json()
  },

  // Create Staff
  createStaff: async (staffData: {
    full_name: string,
    email: string,
    phone: string,
    position: string,
    department: string,
    date_of_joining: string,
    address: string,
    role: string,
    status: string
  }) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL
    const token = getAuthToken()
    
    if (!token) {
      throw new Error('No authentication token found')
    }

    // Add timeout to prevent hanging requests
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    try {
      console.log('API: Starting createStaff request to:', `${apiBaseUrl}/staff/createStaff`)
      console.log('API: Request payload:', staffData)
      
      const response = await fetch(`${apiBaseUrl}/staff/createStaff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(staffData),
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      console.log('API: Response received, status:', response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('API: Error response:', errorData)
        throw new Error(errorData.message || 'Failed to create staff')
      }

      const result = await response.json()
      console.log('API: Success response:', result)
      return result
    } catch (error) {
      clearTimeout(timeoutId)
      console.error('API: Request failed:', error)
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout - please try again')
      }
      throw error
    }
  },

  // Get All Staff
  getAllStaff: async () => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL
    const token = getAuthToken()
    
    if (!token) {
      throw new Error('No authentication token found')
    }

    const response = await fetch(`${apiBaseUrl}/staff/getAllStaff`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Failed to fetch staff')
    }

    return response.json()
  },

  // Get Staff by ID
  getStaffById: async (staffId: string) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL
    const token = getAuthToken()
    
    if (!token) {
      throw new Error('No authentication token found')
    }

    const response = await fetch(`${apiBaseUrl}/staff/getStaffById/${staffId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Failed to fetch staff details')
    }

    return response.json()
  },

  // Update Staff
  updateStaff: async (staffId: string, staffData: {
    full_name: string,
    email: string,
    phone: string,
    position: string,
    department: string,
    date_of_joining: string,
    dob: string,
    address: string,
    role: string,
    status: string
  }) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL
    const token = getAuthToken()
    
    if (!token) {
      throw new Error('No authentication token found')
    }

    // Add timeout to prevent hanging requests
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    try {
      console.log('API: Starting updateStaff request to:', `${apiBaseUrl}/staff/updateStaff/${staffId}`)
      console.log('API: Request payload:', staffData)
      
      const response = await fetch(`${apiBaseUrl}/staff/updateStaff/${staffId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(staffData),
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      console.log('API: Response received, status:', response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('API: Error response:', errorData)
        throw new Error(errorData.message || 'Failed to update staff')
      }

      const result = await response.json()
      console.log('API: Success response:', result)
      return result
    } catch (error) {
      clearTimeout(timeoutId)
      console.error('API: Request failed:', error)
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout - please try again')
      }
      throw error
    }
  },

  // Delete Staff
  deleteStaff: async (staffId: string) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL
    const token = getAuthToken()
    
    if (!token) {
      throw new Error('No authentication token found')
    }

    const response = await fetch(`${apiBaseUrl}/staff/deleteStaff/${staffId}`, {
      method: 'DELETE',
      headers: { 
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Failed to delete staff')
    }

    return response.json()
  },


  // Customers
  getCustomers: async (page: number = 1, limit: number = 10) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL
    const token = getAuthToken()
    
    if (!token) {
      throw new Error('No authentication token found')
    }

    const response = await fetch(`${apiBaseUrl}/customer/getCustomers?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Failed to fetch customers')
    }

    const result = await response.json() 
    
    // Check if the response has the expected structure
    if (!result.data || !result.data.customers) { 
      return {
        data: [],
        totalPages: 1,
        currentPage: 1
      }
    }
    
    // Transform the response to match the expected structure
    const transformedData = {
      data: result.data.customers.map((customer: any) => {
        const transformedCustomer = {
          id: customer.id,
          name: customer.customer_name || customer.name || customer.company_name || `Customer ${customer.id}`,
          company_name: customer.company_name,
          email: customer.email,
          phone: customer.phone
        } 
        return transformedCustomer
      }),
      totalPages: result.data.pagination?.totalPages || 1,
      currentPage: result.data.pagination?.page || 1
    }
     
    return transformedData
  },

  // Contractors
  getContractors: async (page: number = 1, limit: number = 10) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL
    const token = getAuthToken()
    
    if (!token) {
      throw new Error('No authentication token found')
    }

    const response = await fetch(`${apiBaseUrl}/contractor/getContractors?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Failed to fetch contractors')
    }

    const result = await response.json() 
    
    // Check if the response has the expected structure
    if (!result.data) { 
      return {
        data: [],
        totalPages: 1,
        currentPage: 1
      }
    }
    
    // Transform the response to match the expected structure
    // Handle different possible response structures
    let contractorsArray = []
    if (result.data.contractors) {
      contractorsArray = result.data.contractors
    } else if (Array.isArray(result.data)) {
      contractorsArray = result.data
    } else {
      console.error('Contractor API: No contractors array found in response')
      return {
        data: [],
        totalPages: 1,
        currentPage: 1
      }
    }
    
    const transformedData = {
      data: contractorsArray.map((contractor: any) => {
        const transformedContractor = {
          id: contractor.id,
          name: contractor.contractor_name || contractor.name || contractor.company_name || `Contractor ${contractor.id}`,
          company_name: contractor.company_name,
          email: contractor.email,
          phone: contractor.phone
        } 
        return transformedContractor
      }),
      totalPages: result.data.pagination?.totalPages || result.pagination?.totalPages || 1,
      currentPage: result.data.pagination?.page || result.pagination?.page || page
    }
     
    return transformedData
  },

  // Lead Labor
  getLeadLabor: async (page: number = 1, limit: number = 10) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL
    const token = getAuthToken()
    
    if (!token) {
      throw new Error('No authentication token found')
    }

    const response = await fetch(`${apiBaseUrl}/lead-labor/getAllLeadLabor?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Failed to fetch lead labor')
    }

    const result = await response.json()
    
    // Transform the response to match the expected structure
    // The API returns: result.data.data (array) and result.data.pagination
    return {
      data: result.data.data.map((leadLabor: any) => ({
        id: leadLabor.id,
        name: leadLabor.users.full_name,
        email: leadLabor.email,
        phone: leadLabor.phone,
        position: leadLabor.position,
        department: leadLabor.department,
        labor_code: leadLabor.labor_code,
        address: leadLabor.address,
        dob: leadLabor.dob
      })),
      totalPages: result.data.pagination.totalPages,
      currentPage: result.data.pagination.currentPage
    }
  },

  // Labor
  getLabor: async (page: number = 1, limit: number = 10) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL
    const token = getAuthToken()
    
    if (!token) {
      throw new Error('No authentication token found')
    }

    const response = await fetch(`${apiBaseUrl}/labor/getAllLabor?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Failed to fetch labor')
    }

    const result = await response.json()
    
    // Transform the response to match the expected structure
    // The API returns: result.data.data (array) and result.data.pagination
    return {
      data: result.data.data.map((labor: any) => ({
        id: labor.id,
        name: labor.users.full_name,
        email: labor.email,
        phone: labor.phone,
        position: labor.position,
        department: labor.department,
        labor_code: labor.labor_code,
        address: labor.address,
        dob: labor.dob
      })),
      totalPages: result.data.pagination.totalPages,
      currentPage: result.data.pagination.currentPage
    }
  },

  // Create Job
  createJob: async (jobData: {
    job_title: string,
    job_type: string,
    customer_id?: number,
    contractor_id?: number,
    description: string,
    priority: string,
    address: string,
    city_zip: string,
    phone?: string,
    email?: string,
    bill_to_address?: string,
    bill_to_city_zip?: string,
    bill_to_phone?: string,
    bill_to_email?: string,
    same_as_address: boolean,
    due_date: string,
    estimated_hours?: number,
    estimated_cost?: number,
    assigned_lead_labor_ids?: string,
    assigned_labor_ids?: string,
    assigned_material_ids?: string,
    status: string
  }) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL
    const token = getAuthToken()
    
    if (!token) {
      throw new Error('No authentication token found')
    }

    const response = await fetch(`${apiBaseUrl}/job/createJob`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(jobData),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Failed to create job')
    }

    return response.json()
  },

  // Roles API
  getRoles: async () => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL
    const token = getAuthToken()
    if (!token) {
      throw new Error('No authentication token found')
    }
    const response = await fetch(`${apiBaseUrl}/permissions/roles-with-permissions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Failed to fetch roles')
    }
    const result = await response.json()
    console.log('Roles API Response:', result)
    if (!result.success || !result.data) {
      console.error('Roles API: Unexpected response structure:', result)
      return []
    }
    // Transform API response to match component's expected format
    const transformedRoles = result.data.map((apiRole: any) => ({
      id: apiRole.id.toString(),
      roleName: apiRole.role_name || '',
      roleType: apiRole.role_type || '',
      permissions: apiRole.permissions || []
    }))
    return transformedRoles
  },

  // Labor Time Log APIs
  createLaborTimeLog: async (timeLogData: {
    job_id: string,
    labor_id: string,
    full_name: string,
    email: string,
    role: string,
    hours_worked: number,
    hourly_rate: number,
    notes: string,
    date_of_joining: string,
    is_custom: boolean
  }) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL
    const token = getAuthToken()
    if (!token) {
      throw new Error('No authentication token found')
    }
    const response = await fetch(`${apiBaseUrl}/labor/createLabor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(timeLogData),
    })
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Failed to create labor time log')
    }
    return response.json()
  }, 

  updateLaborTimeLog: async (timeLogId: string, timeLogData: {
    job_id: string,
    labor_id: string,
    full_name: string,
    email: string,
    role: string,
    hours_worked: number,
    hourly_rate: number,
    notes: string,
    date_of_joining: string,
    is_custom: boolean
  }) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL
    const token = getAuthToken()
    if (!token) {
      throw new Error('No authentication token found')
    }
    const response = await fetch(`${apiBaseUrl}/labor/updateLabor/${timeLogId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(timeLogData),
    })
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Failed to update labor time log')
    }
    return response.json()
  },

  deleteLaborTimeLog: async (timeLogId: string) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL
    const token = getAuthToken()
    if (!token) {
      throw new Error('No authentication token found')
    }
    const response = await fetch(`${apiBaseUrl}/labor/deleteLabor/${timeLogId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Failed to delete labor time log')
    }
    return response.json()
  },

  getLaborById: async (laborId: string) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL
    const token = getAuthToken()
    if (!token) {
      throw new Error('No authentication token found')
    }
    const response = await fetch(`${apiBaseUrl}/labor/getLaborById/${laborId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Failed to fetch labor details')
    }
    const result = await response.json()
    console.log('Labor Details API Response:', result)
    if (!result.success || !result.data) {
      console.error('Labor Details API: Unexpected response structure:', result)
      throw new Error('Invalid labor data received')
    }
    return result.data
  },

  // Logout
  logout: async () => {
    try {
      // Try to call the logout API endpoint
      await authenticatedFetch('/logout', { method: 'POST' })
    } catch (error) {
      console.error('Logout error:', error)
      // Continue with local cleanup even if API call fails
    } finally {
      // Always clear local authentication data
      await clearAuthData()
    }
  }
}