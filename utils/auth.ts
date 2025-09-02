export interface User {
  id: string
  email: string
  name: string
  role: string
  avatar?: string
}

export const AUTH_STORAGE_KEY = 'jdp_auth'

export const saveAuthData = (user: User) => {
  if (typeof window !== 'undefined') {
    const authData = {
      user,
      expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    }
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData))
  }
}

export const getAuthData = (): { user: User; expires: number } | null => {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY)
      if (stored) {
        const authData = JSON.parse(stored)
        if (authData.expires > Date.now()) {
          return authData
        } else {
          localStorage.removeItem(AUTH_STORAGE_KEY)
        }
      }
    } catch (error) {
      localStorage.removeItem(AUTH_STORAGE_KEY)
    }
  }
  return null
}

// Authentication utility functions

/**
 * Clear all authentication data from localStorage and cookies
 */
export const clearAuthData = async (): Promise<void> => {
  if (typeof window === 'undefined') return

  try {
    // First, try to call the logout API to clear HTTP-only cookies
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include' // Important: include cookies in the request
    })
  } catch (error) {
    console.error('Error calling logout API:', error)
    // Continue with local cleanup even if API call fails
  }

  // Clear localStorage
  localStorage.removeItem('jdp_auth')
  localStorage.removeItem('isAuthenticated')
  localStorage.removeItem('auth-token')
  localStorage.removeItem('user')
  
  // Clear client-side cookies by setting them to expire in the past with all possible attributes
  // Clear auth-token cookie with all possible combinations of attributes
  document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
  document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=;'
  document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure;'
  document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure; samesite=strict;'
  document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure; samesite=lax;'
  document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure; samesite=none;'
  
  // Clear jdp_auth cookie
  document.cookie = 'jdp_auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
  document.cookie = 'jdp_auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=;'
  
  // Clear any other auth-related cookies with various attribute combinations
  const cookies = document.cookie.split(';')
  cookies.forEach(cookie => {
    const eqPos = cookie.indexOf('=')
    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
    if (name.includes('auth') || name.includes('token')) {
      // Try multiple combinations to ensure cookie is cleared
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=;`
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure;`
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure; samesite=strict;`
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure; samesite=lax;`
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure; samesite=none;`
    }
  })
  
  // Force clear by setting empty value with current timestamp
  const now = new Date()
  document.cookie = `auth-token=; expires=${now.toUTCString()}; path=/;`
  document.cookie = `jdp_auth=; expires=${now.toUTCString()}; path=/;`
  
  console.log('Auth data cleared. Current cookies:', document.cookie)
}

/**
 * Call logout API and clear all authentication data
 */
export const logout = async (): Promise<void> => {
  await clearAuthData()
}

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false
  
  const authData = localStorage.getItem('jdp_auth')
  if (!authData) return false
  
  try {
    const parsed = JSON.parse(authData)
    return parsed.token && parsed.expires > Date.now()
  } catch {
    return false
  }
}

/**
 * Get authentication token
 */
export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null
  
  const authData = localStorage.getItem('jdp_auth')
  if (!authData) return null
  
  try {
    const parsed = JSON.parse(authData)
    if (parsed.token && parsed.expires > Date.now()) {
      return parsed.token
    }
  } catch {
    // Invalid JSON
  }
  
  return null
}

/**
 * Get user data from localStorage
 */
export const getUserData = (): any => {
  if (typeof window === 'undefined') return null
  
  const authData = localStorage.getItem('jdp_auth')
  if (!authData) return null
  
  try {
    const parsed = JSON.parse(authData)
    if (parsed.user && parsed.expires > Date.now()) {
      return parsed.user
    }
  } catch {
    // Invalid JSON
  }
  
  return null
}