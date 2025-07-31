'use client'

import { Provider } from 'react-redux'
import { store } from '@/redux/store'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { useState, useEffect } from 'react'

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return <div className="min-h-screen bg-background" />
  }

  return (
    <Provider store={store}>
      <NextThemesProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        disableTransitionOnChange={false}
      >
        {children}
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'hsl(var(--card))',
              color: 'hsl(var(--card-foreground))',
              border: '1px solid hsl(var(--border))',
            },
          }}
        />
      </NextThemesProvider>
    </Provider>
  )
}