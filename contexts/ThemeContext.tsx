'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  THEME_STORAGE_KEY,
  applyThemeToDocument,
  resolveStoredTheme,
} from '@/lib/theme-config'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
  isLoading: boolean
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {
    console.warn('No ThemeProvider found')
  },
  setTheme: () => {
    console.warn('No ThemeProvider found')
  },
  isLoading: true
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initializeTheme = () => {
      try {
        const initialTheme = resolveStoredTheme()
        setTheme(initialTheme)
        updateTheme(initialTheme)
      } catch (error) {
        console.warn('Failed to initialize theme:', error)
        setTheme('light')
        updateTheme('light')
      } finally {
        setIsLoading(false)
      }
    }

    const timeoutId = setTimeout(initializeTheme, 100)
    return () => clearTimeout(timeoutId)
  }, [])

  const updateTheme = (newTheme: Theme) => {
    try {
      applyThemeToDocument(newTheme)
      localStorage.setItem(THEME_STORAGE_KEY, newTheme)
      window.dispatchEvent(new CustomEvent('themeChange', { detail: { theme: newTheme } }))
    } catch (error) {
      console.error('Failed to update theme:', error)
    }
  }

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    updateTheme(newTheme)
  }

  const setThemeDirectly = (newTheme: Theme) => {
    if (newTheme !== theme) {
      setTheme(newTheme)
      updateTheme(newTheme)
    }
  }

  const value = {
    theme,
    toggleTheme,
    setTheme: setThemeDirectly,
    isLoading
  }

  return (
    <ThemeContext.Provider value={value}>
      <div className={`theme-transition ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
        {children}
      </div>
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}