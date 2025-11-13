#!/bin/bash

# JDP Admin Dashboard - Setup Verification Script
# This script verifies that the project is properly configured

echo "🔍 Verifying project setup..."

# Check if legacy files are removed
echo "📋 Checking for legacy files..."
LEGACY_FILES=("App.tsx" "main.tsx" "index.html" "vite.config.ts" "tsconfig.node.json" ".eslintrc.cjs" "yarn.lock")
LEGACY_FOUND=false

for file in "${LEGACY_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "❌ Legacy file found: $file"
        LEGACY_FOUND=true
    fi
done

if [ "$LEGACY_FOUND" = false ]; then
    echo "✅ No legacy files found"
fi

# Check if duplicate pages are removed
echo "📋 Checking for duplicate pages..."
DUPLICATE_PAGES=("app/analytics/page.tsx" "app/customers/page.tsx" "app/dashboard/page.tsx" "app/invoices/page.tsx" "app/jobs/page.tsx" "app/notifications/page.tsx" "app/products/page.tsx" "app/staff/page.tsx")
DUPLICATES_FOUND=false

for page in "${DUPLICATE_PAGES[@]}"; do
    if [ -f "$page" ]; then
        echo "❌ Duplicate page found: $page"
        DUPLICATES_FOUND=true
    fi
done

if [ "$DUPLICATES_FOUND" = false ]; then
    echo "✅ No duplicate pages found"
fi

# Check if required files exist
echo "📋 Checking for required files..."
REQUIRED_FILES=("package.json" "next.config.js" "tsconfig.json" "tailwind.config.js" "app/layout.tsx" "app/page.tsx" "middleware.ts")
REQUIRED_MISSING=false

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Required file missing: $file"
        REQUIRED_MISSING=true
    fi
done

if [ "$REQUIRED_MISSING" = false ]; then
    echo "✅ All required files present"
fi

# Check Node.js version
echo "📋 Checking Node.js version..."
NODE_VERSION=$(node --version | cut -d'v' -f2)
REQUIRED_NODE="18.17.0"
if [ "$(printf '%s\n' "$REQUIRED_NODE" "$NODE_VERSION" | sort -V | head -n1)" = "$REQUIRED_NODE" ]; then
    echo "✅ Node.js version: v$NODE_VERSION (>= v$REQUIRED_NODE)"
else
    echo "❌ Node.js version: v$NODE_VERSION (requires >= v$REQUIRED_NODE)"
fi

# Check NPM version
echo "📋 Checking NPM version..."
NPM_VERSION=$(npm --version)
REQUIRED_NPM="8.0.0"
if [ "$(printf '%s\n' "$REQUIRED_NPM" "$NPM_VERSION" | sort -V | head -n1)" = "$REQUIRED_NPM" ]; then
    echo "✅ NPM version: v$NPM_VERSION (>= v$REQUIRED_NPM)"
else
    echo "❌ NPM version: v$NPM_VERSION (requires >= v$REQUIRED_NPM)"
fi

# Check if node_modules exists
if [ -d "node_modules" ]; then
    echo "✅ Dependencies installed"
else
    echo "❌ Dependencies not installed - run 'npm install'"
fi

# Check package.json for yarn references
echo "📋 Checking for yarn references..."
if grep -q "yarn" package.json; then
    echo "❌ Yarn references found in package.json"
else
    echo "✅ No yarn references in package.json"
fi

# Check TypeScript configuration
echo "📋 Checking TypeScript configuration..."
if [ -f "tsconfig.json" ]; then
    if npx tsc --noEmit --skipLibCheck 2>/dev/null; then
        echo "✅ TypeScript configuration valid"
    else
        echo "❌ TypeScript configuration has errors"
    fi
else
    echo "❌ tsconfig.json not found"
fi

echo ""
echo "🏁 Verification complete!"
echo ""
echo "Next steps:"
echo "1. If any issues found, run: ./cleanup-legacy.sh"
echo "2. Install dependencies: npm install"
echo "3. Start development: npm run dev"
echo "4. Open: http://localhost:3000"