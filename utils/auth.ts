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

export const clearAuthData = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(AUTH_STORAGE_KEY)
  }
}