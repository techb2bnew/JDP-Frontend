# JDP Admin Dashboard - Complete Setup Guide

## Overview
This is a comprehensive Next.js 14 admin dashboard built with TypeScript, Tailwind CSS v3.4.17, and Redux Toolkit. This guide will help you properly set up the project with correct TypeScript definitions.

## Prerequisites

- **Node.js**: 18.17.0 or later
- **NPM**: 8.0.0 or later (NO YARN OR PNPM)
- **Operating System**: Windows, macOS, or Linux

## Step-by-Step Setup

### 1. Clean Up Legacy Files

First, run the cleanup script to remove all legacy Vite files:

```bash
chmod +x cleanup-legacy.sh
./cleanup-legacy.sh
```

Or manually remove these files:
```bash
rm -f App.tsx main.tsx index.html vite.config.ts tsconfig.node.json .eslintrc.cjs yarn.lock
rm -f app/analytics/page.tsx app/customers/page.tsx app/dashboard/page.tsx
rm -f app/invoices/page.tsx app/jobs/page.tsx app/notifications/page.tsx
rm -f app/products/page.tsx app/staff/page.tsx
```

### 2. Install Dependencies

**IMPORTANT**: Use only NPM for package management.

```bash
# Clear any existing node_modules and lock files
rm -rf node_modules package-lock.json yarn.lock

# Install dependencies with NPM
npm install
```

### 3. Verify TypeScript Setup

Check that TypeScript is working correctly:

```bash
# Run type checking
npm run type-check

# If you get TypeScript errors, try:
npm install --save-dev @types/react@^18.2.45 @types/react-dom@^18.2.18 @types/node@^20.10.5
```

### 4. Environment Setup

```bash
# Copy environment template
cp .env.example .env.local

# Edit with your values
nano .env.local
```

### 5. Start Development Server

```bash
npm run dev
```

The application should now be available at `http://localhost:3000`

## Project Structure

```
├── app/                          # Next.js App Router
│   ├── (dashboard)/             # Protected dashboard routes
│   │   ├── layout.tsx           # Dashboard layout with auth
│   │   ├── dashboard/page.tsx   # Main dashboard
│   │   ├── analytics/page.tsx   # Analytics page
│   │   ├── products/page.tsx    # Products management
│   │   ├── orders/page.tsx      # Orders management
│   │   ├── invoices/page.tsx    # Invoice management
│   │   ├── customers/page.tsx   # Customer management
│   │   ├── jobs/page.tsx        # Job management
│   │   ├── tracking/page.tsx    # Live tracking
│   │   ├── contractors/page.tsx # Contractor listing
│   │   ├── staff/page.tsx       # Staff management
│   │   ├── notifications/page.tsx # Notifications
│   │   ├── profile/page.tsx     # User profile
│   │   └── profiles/            # Staff profiles
│   ├── api/                     # API routes
│   │   ├── auth/                # Authentication endpoints
│   │   └── proxy/               # Proxy endpoints
│   ├── globals.css              # Global styles (Tailwind CSS)
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home/login page
│   └── providers.tsx            # App providers (Redux, Theme)
├── components/                   # React components
│   ├── ui/                      # shadcn/ui components
│   ├── auth/                    # Authentication components
│   ├── common/                  # Reusable components
│   └── layout/                  # Layout components
├── lib/                         # Utilities and helpers
├── redux/                       # Redux store and slices
├── contexts/                    # React contexts
├── types/                       # TypeScript definitions
├── middleware.ts                # Route protection
└── next.config.js               # Next.js configuration
```

## Common TypeScript Issues & Fixes

### 1. Missing Type Definitions

```bash
npm install --save-dev @types/react @types/react-dom @types/node
```

### 2. Import Path Issues

Update `tsconfig.json` paths:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@/components/*": ["./components/*"],
      "@/lib/*": ["./lib/*"]
    }
  }
}
```

### 3. Module Resolution Problems

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - TypeScript type checking
- `npm run analyze` - Analyze bundle size
- `npm run clean` - Clean build artifacts

## Key Features Implemented

✅ **NPM Package Management** (yarn references removed)
✅ **Next.js 14 with TypeScript** (App Router)
✅ **Tailwind CSS v3.4.17** (no v4 references)
✅ **Redux Toolkit** (State management)
✅ **SSR Support** (Server-side rendering)
✅ **Route Protection** (Public/private pages)
✅ **Performance Optimization** (Bundle splitting, etc.)
✅ **API Proxy** (Development proxy support)
✅ **Reusable Components** (UI component library)
✅ **No External Assets** (Programmatic designs only)

## Troubleshooting

### TypeScript Errors
```bash
# Check TypeScript version
npx tsc --version

# Reinstall TypeScript
npm install --save-dev typescript@^5.3.3

# Clear TypeScript cache
rm -rf .next/types
```

### Import Errors
```bash
# Check file paths and extensions
# Ensure all imports use .tsx for React components
# Verify path aliases in tsconfig.json
```

### Build Errors
```bash
# Clear all caches
npm run clean
rm -rf .next node_modules package-lock.json
npm install
npm run build
```

## Deployment Checklist

- [ ] All legacy Vite files removed
- [ ] TypeScript builds without errors
- [ ] All tests pass
- [ ] Environment variables configured
- [ ] Database connections tested (if applicable)
- [ ] Authentication flow works
- [ ] All routes accessible
- [ ] Dark/light mode functional
- [ ] Mobile responsiveness verified

## Support

If you encounter issues:

1. Check this setup guide first
2. Run the cleanup script
3. Verify Node.js and NPM versions
4. Clear all caches and reinstall
5. Check the project structure matches the guide

The project is now fully configured for Next.js 14 with proper TypeScript support and NPM package management.