import { clearAuthData } from './auth'

// Global token revocation handler
export const handleTokenRevocation = async () => {
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

// Helper function to get auth token
export const getAuthToken = (): string | null => {
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

// Global API call function with automatic token handling
export const globalApiCall = async (url: string, options: RequestInit = {}) => {
  const token = getAuthToken()
  
  // Add authorization header if token exists
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
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

// Hook for making API calls with automatic token handling
export const useApiCall = () => {
  const makeApiCall = async (url: string, options: RequestInit = {}) => {
    try {
      const response = await globalApiCall(url, options)
      return await response.json()
    } catch (error) {
      // Error is already handled by globalApiCall
      throw error
    }
  }

  return { makeApiCall }
}

// Utility function to check if error is token revocation
export const isTokenRevocationError = (error: any): boolean => {
  if (error?.message) {
    return (
      error.message.includes('Token has been revoked') ||
      error.message.includes('Token expired') ||
      error.message.includes('Invalid token') ||
      error.message.includes('Please login again') ||
      error.message.includes('Session expired')
    )
  }
  return false
}
