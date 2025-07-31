import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define public routes that don't require authentication
const publicRoutes = [
  '/',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/verify-otp',
]

// Define private routes that require authentication
const privateRoutes = [
  '/dashboard',
  '/analytics',
  '/products',
  '/orders',
  '/invoices',
  '/customers',
  '/jobs',
  '/tracking',
  '/contractors',
  '/staff',
  '/notifications',
  '/profile',
  '/profiles',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('auth-token')?.value

  // Check if the current path is a public route
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  )

  // Check if the current path is a private route
  const isPrivateRoute = privateRoutes.some(route => 
    pathname.startsWith(route)
  )

  // If accessing a private route without authentication
  if (isPrivateRoute && !token) {
    const response = NextResponse.redirect(new URL('/', request.url))
    response.cookies.set('redirect-url', pathname, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10, // 10 minutes
    })
    return response
  }

  // If accessing a public route while authenticated, redirect to dashboard
  if (isPublicRoute && token && pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Add security headers to all responses
  const response = NextResponse.next()
  
  // Security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin')
  response.headers.set('X-DNS-Prefetch-Control', 'on')
  
  // Performance headers
  if (pathname.startsWith('/api/')) {
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
  } else if (pathname.startsWith('/_next/static/')) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api routes that don't need middleware
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    '/((?!_next/static|_next/image|favicon.ico|public|assets).*)',
  ],
}