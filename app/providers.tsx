'use client'

import { Provider } from 'react-redux'
import { store } from '@/redux/store'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { PermissionProvider } from '@/contexts/PermissionContext'
import { EstimatePrefillProvider } from '@/contexts/EstimatePrefillContext'
import { THEME_STORAGE_KEY } from '@/lib/theme-config'

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <Provider store={store}>
      <NextThemesProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        storageKey={THEME_STORAGE_KEY}
        themes={['light', 'dark']}
        disableTransitionOnChange
      >
        <PermissionProvider>
          <EstimatePrefillProvider>
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
          </EstimatePrefillProvider>
        </PermissionProvider>
      </NextThemesProvider>
    </Provider>
  )
}