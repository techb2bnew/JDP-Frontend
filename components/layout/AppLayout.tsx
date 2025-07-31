'use client'

import { ReactNode } from 'react'
import { useAppSelector } from '../../redux/hooks'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const { sidebarCollapsed } = useAppSelector((state) => state.app)

  return (
    <div className="flex h-screen bg-muted">
      <Sidebar currentPath={''} onLogout={function (): void {
        throw new Error('Function not implemented.')
      } } />
      <div className="flex-1 flex flex-col">
        <Header currentPath={''} onLogout={function (): void {
          throw new Error('Function not implemented.')
        } } onNotificationViewAll={function (): void {
          throw new Error('Function not implemented.')
        } } onProfileClick={function (): void {
          throw new Error('Function not implemented.')
        } } />
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}