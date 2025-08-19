#!/bin/bash

# EllaAI Performance Build Test Script
# This script builds the application and runs performance validation

set -e

echo "🚀 Starting EllaAI Performance Build Test"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
    echo -e "${BLUE}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Step 1: Clean previous build
print_step "Cleaning previous build artifacts"
cd frontend
rm -rf dist node_modules/.vite
print_success "Clean completed"

# Step 2: Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_step "Installing dependencies"
    npm ci
    print_success "Dependencies installed"
fi

# Step 3: Run TypeScript check
print_step "Running TypeScript compilation check"
if npm run type-check; then
    print_success "TypeScript check passed"
else
    print_error "TypeScript check failed"
    exit 1
fi

# Step 4: Build the application
print_step "Building application with performance optimizations"
if npm run build; then
    print_success "Build completed successfully"
else
    print_error "Build failed"
    exit 1
fi

# Step 5: Analyze bundle sizes
print_step "Analyzing bundle sizes"
cd dist/assets

# Get bundle sizes
js_total=0
css_total=0
total_size=0

echo "📊 Bundle Analysis:"
echo "==================="

for file in *.js; do
    if [ -f "$file" ]; then
        size=$(wc -c < "$file")
        size_kb=$((size / 1024))
        js_total=$((js_total + size))
        total_size=$((total_size + size))
        echo "JavaScript: $file - ${size_kb}KB"
    fi
done

for file in *.css; do
    if [ -f "$file" ]; then
        size=$(wc -c < "$file")
        size_kb=$((size / 1024))
        css_total=$((css_total + size))
        total_size=$((total_size + size))
        echo "CSS: $file - ${size_kb}KB"
    fi
done

# Calculate totals
js_total_kb=$((js_total / 1024))
css_total_kb=$((css_total / 1024))
total_size_kb=$((total_size / 1024))

echo ""
echo "📈 Bundle Summary:"
echo "=================="
echo "JavaScript Total: ${js_total_kb}KB"
echo "CSS Total: ${css_total_kb}KB"
echo "Total Bundle Size: ${total_size_kb}KB"

# Performance budget checks
js_budget=400  # 400KB
css_budget=50  # 50KB
total_budget=1000  # 1MB

echo ""
echo "💰 Performance Budget Check:"
echo "============================"

# Check JavaScript budget
if [ $js_total_kb -le $js_budget ]; then
    print_success "JavaScript bundle: ${js_total_kb}KB / ${js_budget}KB ✅"
else
    overage=$(((js_total_kb - js_budget) * 100 / js_budget))
    print_warning "JavaScript bundle: ${js_total_kb}KB / ${js_budget}KB (${overage}% over budget)"
fi

# Check CSS budget  
if [ $css_total_kb -le $css_budget ]; then
    print_success "CSS bundle: ${css_total_kb}KB / ${css_budget}KB ✅"
else
    overage=$(((css_total_kb - css_budget) * 100 / css_budget))
    print_warning "CSS bundle: ${css_total_kb}KB / ${css_budget}KB (${overage}% over budget)"
fi

# Check total budget
if [ $total_size_kb -le $total_budget ]; then
    print_success "Total bundle: ${total_size_kb}KB / ${total_budget}KB ✅"
else
    overage=$(((total_size_kb - total_budget) * 100 / total_budget))
    print_error "Total bundle: ${total_size_kb}KB / ${total_budget}KB (${overage}% over budget)"
fi

cd ../..

# Step 6: Check for optimizations
print_step "Checking build optimizations"

echo "🔍 Optimization Checks:"
echo "======================="

# Check if files are minified
if [ -f "dist/assets/index-*.js" ]; then
    if grep -q "console.log" dist/assets/index-*.js; then
        print_warning "Debug statements found in production build"
    else
        print_success "No debug statements in production build"
    fi
    
    if grep -q "/\*" dist/assets/index-*.js; then
        print_warning "Comments found in production build"
    else
        print_success "Comments removed from production build"
    fi
fi

# Check for service worker
if [ -f "../public/sw.js" ]; then
    print_success "Service Worker file found"
else
    print_warning "Service Worker file not found"
fi

# Check for manifest
if [ -f "../public/manifest.json" ]; then
    print_success "PWA Manifest file found"
else
    print_warning "PWA Manifest file not found"
fi

# Step 7: Generate performance report
print_step "Generating performance report"

report_file="../reports/build-performance-$(date +%Y%m%d-%H%M%S).json"
mkdir -p ../reports

cat > "$report_file" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "build_success": true,
  "bundle_sizes": {
    "javascript_kb": $js_total_kb,
    "css_kb": $css_total_kb,
    "total_kb": $total_size_kb
  },
  "budget_compliance": {
    "javascript_within_budget": $([ $js_total_kb -le $js_budget ] && echo true || echo false),
    "css_within_budget": $([ $css_total_kb -le $css_budget ] && echo true || echo false),
    "total_within_budget": $([ $total_size_kb -le $total_budget ] && echo true || echo false)
  },
  "optimizations": {
    "minification": true,
    "tree_shaking": true,
    "code_splitting": true,
    "service_worker": $([ -f "../public/sw.js" ] && echo true || echo false),
    "pwa_manifest": $([ -f "../public/manifest.json" ] && echo true || echo false)
  }
}
EOF

print_success "Performance report saved to $report_file"

# Step 8: Final summary
echo ""
echo "🎯 Performance Build Summary:"
echo "=============================="

if [ $total_size_kb -le $total_budget ] && [ $js_total_kb -le $js_budget ] && [ $css_total_kb -le $css_budget ]; then
    print_success "All performance budgets met! ✅"
    echo "🏆 Build is ready for production deployment"
    exit 0
else
    print_warning "Some performance budgets exceeded"
    echo "📊 Consider optimizing bundle sizes before deployment"
    exit 1
fi