# Migration from Vite to Next.js

This document outlines the migration process from Vite to Next.js 14 App Router.

## Files Removed

The following Vite-specific files should be removed:

- `App.tsx` (root level - replaced by Next.js App Router)
- `main.tsx` (Vite entry point)
- `index.html` (Vite HTML template)
- `vite.config.ts` (Vite configuration)
- `tsconfig.node.json` (Vite TypeScript config)
- `.eslintrc.cjs` (old ESLint config)

## Files to Remove Manually

Please remove these duplicate page files outside the app directory:

```bash
rm -rf app/analytics/page.tsx
rm -rf app/customers/page.tsx  
rm -rf app/dashboard/page.tsx
rm -rf app/invoices/page.tsx
rm -rf app/jobs/page.tsx
rm -rf app/notifications/page.tsx
rm -rf app/products/page.tsx
rm -rf app/staff/page.tsx
```

## New Next.js Structure

The application now uses the following structure:

- `app/` - Next.js App Router directory
- `app/(dashboard)/` - Dashboard layout group
- `app/layout.tsx` - Root layout
- `app/page.tsx` - Home page (authentication)
- `middleware.ts` - Route protection
- `next.config.js` - Next.js configuration

## Updated Dependencies

The `package.json` has been updated with:

- Next.js 14.1.0
- React 18.2.0
- Tailwind CSS v4
- All necessary Radix UI components
- Redux Toolkit for state management

## Environment Variables

Copy `.env.example` to `.env.local` and configure your environment variables.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting
npm run lint

# Type check
npm run type-check
```

## Key Changes

1. **Routing**: Client-side routing replaced with Next.js file-based routing
2. **Authentication**: Now handles route protection via middleware
3. **Layouts**: Uses Next.js layout system with nested layouts
4. **Components**: All components work with Next.js App Router
5. **State Management**: Redux store configured for Next.js
6. **Styling**: Tailwind CSS v4 configuration updated

## Verification Steps

1. Remove the old Vite files listed above
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`
4. Test all routes work correctly
5. Verify authentication flow
6. Check dark/light mode toggle
7. Test all CRUD operations

The migration preserves all existing functionality while modernizing the tech stack.