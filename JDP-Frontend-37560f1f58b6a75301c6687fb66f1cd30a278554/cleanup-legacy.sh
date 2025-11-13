#!/bin/bash

# JDP Admin Dashboard - Legacy File Cleanup Script
# This script removes all legacy Vite files and duplicate Next.js files

echo "🧹 Starting comprehensive cleanup of legacy files..."

# Remove main Vite entry files
echo "📁 Removing Vite entry files..."
rm -f App.tsx
rm -f main.tsx
rm -f index.html

# Remove Vite configuration
echo "📁 Removing Vite configuration files..."
rm -f vite.config.ts
rm -f tsconfig.node.json

# Remove old ESLint config
echo "📁 Removing old ESLint configuration..."
rm -f .eslintrc.cjs

# Remove duplicate page files outside (dashboard) group
echo "📁 Removing duplicate page files..."
rm -f app/analytics/page.tsx
rm -f app/customers/page.tsx
rm -f app/dashboard/page.tsx
rm -f app/invoices/page.tsx
rm -f app/jobs/page.tsx
rm -f app/notifications/page.tsx
rm -f app/products/page.tsx
rm -f app/staff/page.tsx

# Remove empty directories
echo "📁 Cleaning up empty directories..."
rmdir app/analytics 2>/dev/null || true
rmdir app/customers 2>/dev/null || true
rmdir app/dashboard 2>/dev/null || true
rmdir app/invoices 2>/dev/null || true
rmdir app/jobs 2>/dev/null || true
rmdir app/notifications 2>/dev/null || true
rmdir app/products 2>/dev/null || true
rmdir app/staff 2>/dev/null || true

# Remove the old styles directory since globals.css is already in app/
if [ -f "styles/globals.css" ]; then
    echo "📁 Removing duplicate styles/globals.css..."
    rm -f styles/globals.css
    rmdir styles 2>/dev/null || true
fi

# Remove any yarn lock files if they exist
echo "📁 Removing yarn files..."
rm -f yarn.lock
rm -f .yarnrc.yml
rm -f .yarn/
rm -rf .yarn

echo "✅ Cleanup completed!"
echo ""
echo "Files removed:"
echo "- App.tsx (Vite root component)"
echo "- main.tsx (Vite entry point)" 
echo "- index.html (Vite HTML template)"
echo "- vite.config.ts (Vite configuration)"
echo "- tsconfig.node.json (Vite TypeScript config)"
echo "- .eslintrc.cjs (old ESLint config)"
echo "- Duplicate page files outside (dashboard) group"
echo "- yarn.lock and yarn configuration files"
echo ""
echo "Next steps:"
echo "1. Run: npm install"
echo "2. Run: npm run type-check"
echo "3. Run: npm run dev"
echo "4. Test the application"
echo ""
echo "🚀 Your Next.js app is ready!"