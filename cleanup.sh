#!/bin/bash

# JDP Admin Dashboard - Cleanup Script
# This script removes all legacy Vite files and duplicate Next.js files

echo "🧹 Starting cleanup of legacy files..."

# Remove Vite-specific files
echo "📁 Removing Vite files..."
rm -f App.tsx
rm -f main.tsx
rm -f index.html
rm -f vite.config.ts
rm -f tsconfig.node.json
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

# Move globals.css if it's still in styles directory
if [ -f "styles/globals.css" ]; then
    echo "📁 Moving globals.css to app directory..."
    mv styles/globals.css app/globals.css
    rmdir styles 2>/dev/null || true
fi

# Create .npmrc to ensure npm is used
echo "📝 Creating .npmrc..."
echo "engine-strict=true" > .npmrc

echo "✅ Cleanup completed!"
echo ""
echo "Next steps:"
echo "1. Run: npm install"
echo "2. Run: npm run dev"
echo "3. Test the application"
echo ""
echo "🚀 Your Next.js app is ready!"