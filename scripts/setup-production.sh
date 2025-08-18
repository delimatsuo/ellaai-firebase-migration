#!/bin/bash

set -e

echo "🚀 Setting up EllaAI Firebase Migration - Production Deployment"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check required environment variables
check_env_var() {
    if [ -z "${!1}" ]; then
        print_error "Environment variable $1 is not set"
        exit 1
    fi
}

print_status "Checking required environment variables..."

# You can uncomment and add your required environment variables here
# check_env_var "FIREBASE_PROJECT_ID"
# check_env_var "FIREBASE_CLIENT_EMAIL"
# check_env_var "FIREBASE_PRIVATE_KEY"

# Check if Firebase CLI is installed and user is logged in
if ! command -v firebase &> /dev/null; then
    print_error "Firebase CLI is not installed. Please install it first: npm install -g firebase-tools"
    exit 1
fi

if ! firebase projects:list &> /dev/null; then
    print_error "Not logged into Firebase. Please run 'firebase login' first."
    exit 1
fi

# Set the Firebase project
if [ -n "$FIREBASE_PROJECT_ID" ]; then
    print_status "Setting Firebase project to: $FIREBASE_PROJECT_ID"
    firebase use "$FIREBASE_PROJECT_ID"
else
    print_warning "FIREBASE_PROJECT_ID not set. Using default project from .firebaserc"
fi

# Install dependencies
print_status "Installing production dependencies..."
npm ci
cd frontend && npm ci && cd ..
cd functions && npm ci && cd ..

# Run tests
print_status "Running tests..."
npm run test || {
    print_error "Tests failed. Aborting deployment."
    exit 1
}

# Run linting
print_status "Running linting..."
npm run lint || {
    print_error "Linting failed. Please fix issues before deploying."
    exit 1
}

# Build the application
print_status "Building application..."
npm run build || {
    print_error "Build failed. Please fix build issues before deploying."
    exit 1
}

# Deploy Firestore rules and indexes first
print_status "Deploying Firestore rules and indexes..."
firebase deploy --only firestore || {
    print_error "Firestore deployment failed."
    exit 1
}

# Deploy functions
print_status "Deploying Cloud Functions..."
firebase deploy --only functions || {
    print_error "Functions deployment failed."
    exit 1
}

# Deploy hosting
print_status "Deploying frontend to Firebase Hosting..."
firebase deploy --only hosting || {
    print_error "Hosting deployment failed."
    exit 1
}

print_status "Production deployment completed successfully! 🎉"

# Get the hosting URL
HOSTING_URL=$(firebase hosting:channel:list | grep "live" | awk '{print $4}')
if [ -n "$HOSTING_URL" ]; then
    print_status "Your application is live at: $HOSTING_URL"
fi

print_status "Deployment summary:"
print_status "✅ Firestore rules and indexes"
print_status "✅ Cloud Functions"
print_status "✅ Frontend hosting"
print_status ""
print_warning "Post-deployment checklist:"
print_warning "1. Test authentication flow"
print_warning "2. Test critical user journeys"
print_warning "3. Monitor Cloud Functions logs"
print_warning "4. Check error rates and performance metrics"