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
  getJobs: async () => {
    return authenticatedFetch('/jobs')
  },

  createJob: async (jobData: any) => {
    return authenticatedFetch('/jobs', {
      method: 'POST',
      body: JSON.stringify(jobData),
    })
  },

  updateJob: async (jobId: string, jobData: any) => {
    return authenticatedFetch(`/jobs/${jobId}`, {
      method: 'PUT',
      body: JSON.stringify(jobData),
    })
  },

  deleteJob: async (jobId: string) => {
    return authenticatedFetch(`/jobs/${jobId}`, {
      method: 'DELETE',
    })
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
    const response = await globalApiCall(`${apiBaseUrl}/auth/profile?userId=${userId}`, {
      method: 'GET',
    })
    return response.json()
  },

  // Update User Profile
  updateUserProfile: async (userId: string, profileData: {
    full_name: string,
    email: string,
    phone: string,
    job_title: string,
    department: string,
    address: string,
    bio: string,
    emergency_contact: string,
    date_of_birth: string,
    employee_id: string,
    system_role: string
  }) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL
    const token = getAuthToken()
    
    if (!token) {
      throw new Error('No authentication token found')
    }

    const response = await fetch(`${apiBaseUrl}/auth/profile/${userId}`, {
      method: 'PUT',
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