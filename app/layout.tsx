import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'JDP Admin Dashboard',
    template: '%s | JDP Admin Dashboard'
  },
  description: 'Comprehensive ecommerce admin dashboard with staff, job, and contractor management',
  keywords: ['admin', 'dashboard', 'ecommerce', 'management', 'staff', 'jobs', 'contractors'],
  authors: [{ name: 'JDP Team' }],
  creator: 'JDP Team',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    title: 'JDP Admin Dashboard',
    description: 'Comprehensive ecommerce admin dashboard with staff, job, and contractor management',
    siteName: 'JDP Admin Dashboard',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JDP Admin Dashboard',
    description: 'Comprehensive ecommerce admin dashboard with staff, job, and contractor management',
  },
  robots: {
    index: false,
    follow: false,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className={`${inter.className} antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}