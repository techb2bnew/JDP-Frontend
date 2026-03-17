/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'recharts',
      'framer-motion',
      '@reduxjs/toolkit',
      'react-redux'
    ],
  },

  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'jdp-backend.s3.us-east-2.amazonaws.com',
      },
    ],
    formats: ['image/webp', 'image/avif'],
  },

  // API Proxy for development
  async rewrites() {
    return [
      {
        source: '/api/proxy/:path*',
        destination: 'http://localhost:8000/:path*',
      },
    ]
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/dashboard',
        permanent: true,
      },
      {
        source: '/login',
        destination: '/',
        permanent: false,
      },
    ]
  },

  // Headers for security and performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ]
  },

  // Performance optimizations
  poweredByHeader: false,
  compress: true,

  // Output configuration for better deployment
  output: 'standalone',

  // Trailing slash configuration
  trailingSlash: false,

  // TypeScript — ignore errors during build (saves memory)
  typescript: {
    ignoreBuildErrors: true,
  },

  // ESLint — skip during build (saves memory)
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig