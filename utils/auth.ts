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
 * Clear all authentication data from localStorage, sessionStorage and cookies
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

  // Clear localStorage - remove all auth-related items
  const localStorageKeys = [
    'jdp_auth',
    'isAuthenticated', 
    'auth-token',
    'user',
    'token',
    'authData',
    'userData',
    'permissions',
    'role'
  ]
  
  localStorageKeys.forEach(key => {
    localStorage.removeItem(key)
  })

  // Clear sessionStorage - remove all auth-related items
  const sessionStorageKeys = [
    'jdp_auth',
    'isAuthenticated',
    'auth-token', 
    'user',
    'token',
    'authData',
    'userData',
    'permissions',
    'role'
  ]
  
  sessionStorageKeys.forEach(key => {
    sessionStorage.removeItem(key)
  })

  // Clear all localStorage and sessionStorage items that contain auth-related keywords
  const authKeywords = ['auth', 'token', 'user', 'login', 'session']
  
  // Clear localStorage
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i)
    if (key && authKeywords.some(keyword => key.toLowerCase().includes(keyword))) {
      localStorage.removeItem(key)
    }
  }
  
  // Clear sessionStorage
  for (let i = sessionStorage.length - 1; i >= 0; i--) {
    const key = sessionStorage.key(i)
    if (key && authKeywords.some(keyword => key.toLowerCase().includes(keyword))) {
      sessionStorage.removeItem(key)
    }
  }
  
  // Clear client-side cookies by setting them to expire in the past with all possible attributes
  const cookieNames = ['auth-token', 'jdp_auth', 'token', 'session', 'auth']
  
  cookieNames.forEach(cookieName => {
    // Clear with various path and domain combinations
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure;`
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure; samesite=strict;`
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure; samesite=lax;`
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure; samesite=none;`
  })
  
  // Clear any other auth-related cookies with various attribute combinations
  const cookies = document.cookie.split(';')
  cookies.forEach(cookie => {
    const eqPos = cookie.indexOf('=')
    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
    if (name && authKeywords.some(keyword => name.toLowerCase().includes(keyword))) {
      // Try multiple combinations to ensure cookie is cleared
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure;`
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure; samesite=strict;`
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure; samesite=lax;`
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure; samesite=none;`
    }
  })
  
  // Force clear by setting empty value with current timestamp
  const now = new Date()
  cookieNames.forEach(cookieName => {
    document.cookie = `${cookieName}=; expires=${now.toUTCString()}; path=/;`
    document.cookie = `${cookieName}=; expires=${now.toUTCString()}; path=/; domain=${window.location.hostname};`
  })
  
  console.log('Auth data cleared. Current cookies:', document.cookie)
  console.log('localStorage cleared. Remaining items:', Object.keys(localStorage))
  console.log('sessionStorage cleared. Remaining items:', Object.keys(sessionStorage))
}

/**
 * Call logout API and clear all authentication data
 */
export const logout = async (): Promise<void> => {
  await clearAuthData()
}

/**
 * Force logout and redirect to login page
 * This function can be used anywhere in the app for immediate logout
 */
export const forceLogout = async (): Promise<void> => {
  await clearAuthData()
  if (typeof window !== 'undefined') {
    window.location.href = '/login'
  }
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

/**
 * Update user permissions in localStorage (for admin panel use only)
 * Note: This does NOT notify PermissionContext to prevent affecting current user
 */
export const updateUserPermissions = (newPermissions: any[]): void => {
  if (typeof window !== 'undefined') {
    const authData = localStorage.getItem('jdp_auth')
    if (authData) {
      try {
        const parsed = JSON.parse(authData)
        if (parsed.user) {
          // Update the user's permissions
          parsed.user.permissions = newPermissions
          
          // Save back to localStorage
          localStorage.setItem('jdp_auth', JSON.stringify(parsed))
          
          // Note: We intentionally do NOT dispatch 'permissionsUpdated' event
          // to prevent admin permission changes from affecting current user's permissions
          // Permissions will only be refreshed when user actually logs in
          
          console.log('User permissions updated in localStorage (admin panel):', newPermissions)
        }
      } catch (error) {
        console.error('Error updating user permissions:', error)
      }
    }
  }
}

/**
 * Refresh user permissions from API and update localStorage
 * This can be called when permissions are updated on the server
 */
export const refreshUserPermissions = async (): Promise<void> => {
  if (typeof window === 'undefined') return
  
  try {
    const authData = localStorage.getItem('jdp_auth')
    if (!authData) return
    
    const parsed = JSON.parse(authData)
    if (!parsed.user || !parsed.token) return
    
    // Fetch updated user data from API
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${parsed.token}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (response.ok) {
      const userData = await response.json()
      if (userData.success && userData.data) {
        // Update user data in localStorage
        parsed.user = userData.data
        localStorage.setItem('jdp_auth', JSON.stringify(parsed))
        
        // Notify PermissionContext (only when refreshing from API)
        window.dispatchEvent(new CustomEvent('userLoggedIn'))
        
        console.log('User permissions refreshed from API:', userData.data.permissions)
      }
    }
  } catch (error) {
    console.error('Error refreshing user permissions:', error)
  }
}