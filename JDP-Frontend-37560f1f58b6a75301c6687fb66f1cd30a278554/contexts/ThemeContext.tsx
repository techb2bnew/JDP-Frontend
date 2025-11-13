'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

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
        const savedTheme = localStorage.getItem('jdp-theme') as Theme | null
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
        const initialTheme = savedTheme || systemTheme
        
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
      const root = document.documentElement
      root.classList.remove('dark', 'light')
      root.classList.add(newTheme)
      localStorage.setItem('jdp-theme', newTheme)
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

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('jdp-theme')) {
        const systemTheme = e.matches ? 'dark' : 'light'
        setTheme(systemTheme)
        updateTheme(systemTheme)
      }
    }

    mediaQuery.addEventListener('change', handleSystemThemeChange)
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange)
  }, [])

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