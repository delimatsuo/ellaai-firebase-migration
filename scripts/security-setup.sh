#!/bin/bash

# EllaAI Security Setup Script
# This script sets up the security infrastructure for the platform

set -e

echo "🔒 EllaAI Security Setup Script"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo -e "${RED}⚠️  This script should not be run as root${NC}"
   exit 1
fi

# Function to generate secure random string
generate_secret() {
    local length=${1:-32}
    openssl rand -hex $length
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

echo "📋 Checking prerequisites..."

# Check for required tools
required_tools=("node" "npm" "openssl" "git")
for tool in "${required_tools[@]}"; do
    if ! command_exists "$tool"; then
        echo -e "${RED}❌ $tool is not installed${NC}"
        exit 1
    else
        echo -e "${GREEN}✅ $tool is available${NC}"
    fi
done

# Check Node.js version
node_version=$(node -v | cut -d'v' -f2)
required_version="18.0.0"
if [ "$(printf '%s\n' "$required_version" "$node_version" | sort -V | head -n1)" != "$required_version" ]; then
    echo -e "${RED}❌ Node.js version $node_version is too old. Required: $required_version+${NC}"
    exit 1
else
    echo -e "${GREEN}✅ Node.js version $node_version is compatible${NC}"
fi

echo ""
echo "🔐 Setting up environment variables..."

# Create .env.local if it doesn't exist
if [[ ! -f ".env.local" ]]; then
    echo "📝 Creating .env.local from template..."
    cp config/environment.example .env.local
    
    # Generate secure secrets
    echo "🔑 Generating secure secrets..."
    
    # Generate CSRF secret
    csrf_secret=$(generate_secret 32)
    sed -i.bak "s/your-csrf-secret-key-32-chars-long/$csrf_secret/g" .env.local
    
    # Generate NextAuth secret
    nextauth_secret=$(generate_secret 32)
    sed -i.bak "s/your-super-secret-jwt-secret-key-here/$nextauth_secret/g" .env.local
    
    # Generate security salt
    security_salt=$(generate_secret 16)
    sed -i.bak "s/your-security-salt-for-hashing/$security_salt/g" .env.local
    
    # Clean up backup file
    rm .env.local.bak
    
    echo -e "${GREEN}✅ Environment file created with secure secrets${NC}"
    echo -e "${YELLOW}⚠️  Please update Firebase and other service credentials in .env.local${NC}"
else
    echo -e "${YELLOW}⚠️  .env.local already exists, skipping creation${NC}"
fi

echo ""
echo "📦 Installing security dependencies..."

# Install additional security packages
npm install --save \
    helmet \
    express-rate-limit \
    express-validator \
    csrf \
    cors \
    bcryptjs \
    jsonwebtoken \
    @types/bcryptjs \
    @types/jsonwebtoken \
    @types/cors

echo -e "${GREEN}✅ Security dependencies installed${NC}"

echo ""
echo "🛡️  Setting up file permissions..."

# Set proper file permissions
chmod 600 .env.local 2>/dev/null || echo "⚠️  Could not set .env.local permissions"
chmod 755 scripts/*.sh 2>/dev/null || echo "⚠️  Could not set script permissions"

# Create secure directories
mkdir -p logs ssl certs
chmod 750 logs ssl certs

echo -e "${GREEN}✅ File permissions configured${NC}"

echo ""
echo "🔥 Setting up Firestore security rules..."

# Backup existing rules
if [[ -f "firestore.rules" ]]; then
    cp firestore.rules firestore.rules.backup
    echo "📋 Backed up existing Firestore rules"
fi

# Deploy secure rules
if [[ -f "firestore.rules.secure" ]]; then
    cp firestore.rules.secure firestore.rules
    echo -e "${GREEN}✅ Secure Firestore rules deployed${NC}"
else
    echo -e "${YELLOW}⚠️  Secure Firestore rules file not found${NC}"
fi

echo ""
echo "🧪 Running security tests..."

# Run security validation tests
if [[ -f "tests/security/security-validation.test.ts" ]]; then
    npm test -- tests/security/security-validation.test.ts
else
    echo -e "${YELLOW}⚠️  Security tests not found${NC}"
fi

echo ""
echo "📊 Security setup summary:"
echo "========================="
echo -e "${GREEN}✅ Environment variables configured${NC}"
echo -e "${GREEN}✅ Security dependencies installed${NC}"
echo -e "${GREEN}✅ File permissions set${NC}"
echo -e "${GREEN}✅ Firestore rules updated${NC}"
echo ""
echo -e "${YELLOW}📋 Next steps:${NC}"
echo "1. Update Firebase credentials in .env.local"
echo "2. Update ALLOWED_ORIGINS with your domain"
echo "3. Configure SMTP settings for email notifications"
echo "4. Set up Redis for production rate limiting"
echo "5. Deploy Firestore rules: firebase deploy --only firestore:rules"
echo ""
echo -e "${GREEN}🔒 Security setup complete!${NC}"

exit 0