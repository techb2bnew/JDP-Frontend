import { clearAuthData } from './auth'

// API utility functions with authentication

const API_BASE_URL = 'https://techrepairtracker.base2brand.com/api'

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

// Helper function to make authenticated API calls
const authenticatedFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken()
  
  if (!token) {
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
    if (response.status === 401) {
      // Token expired or invalid, clear auth data
      await clearAuthData()
      window.location.href = '/login'
      throw new Error('Authentication expired. Please login again.')
    }
    
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || `API request failed: ${response.status}`)
  }

  return response.json()
}

export const apiClient = {
  // Auth
  login: async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/login`, {
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

  updateUserProfile: async (userData: any) => {
    return authenticatedFetch('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    })
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