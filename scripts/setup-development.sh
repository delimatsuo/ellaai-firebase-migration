#!/bin/bash

set -e

echo "🚀 Setting up EllaAI Firebase Migration - Development Environment"

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

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18 or higher is required. Current version: $(node -v)"
    exit 1
fi

print_status "Node.js version check passed: $(node -v)"

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    print_warning "Firebase CLI not found. Installing globally..."
    npm install -g firebase-tools
fi

print_status "Firebase CLI version: $(firebase --version)"

# Login to Firebase (if not already logged in)
if ! firebase projects:list &> /dev/null; then
    print_status "Logging into Firebase..."
    firebase login
fi

# Install dependencies
print_status "Installing dependencies..."
npm run install:all

# Copy environment files
print_status "Setting up environment files..."

if [ ! -f "frontend/.env" ]; then
    cp frontend/.env.example frontend/.env
    print_warning "Frontend .env file created from example. Please update with your Firebase config."
fi

if [ ! -f "functions/.env" ]; then
    cp functions/.env.example functions/.env
    print_warning "Functions .env file created from example. Please update with your Firebase config."
fi

# Initialize Firebase project (if not already done)
if [ ! -f ".firebaserc" ]; then
    print_status "Initializing Firebase project..."
    firebase init --project default
else
    print_status "Firebase project already initialized"
fi

# Start emulators for development
print_status "Starting Firebase emulators..."
print_warning "The emulators will start on the following ports:"
print_warning "- Frontend: http://localhost:3000"
print_warning "- Functions: http://localhost:5001"
print_warning "- Firestore: http://localhost:8080"
print_warning "- Auth: http://localhost:9099"
print_warning "- Firebase UI: http://localhost:4000"

echo ""
print_status "Setup complete! 🎉"
print_status "To start development:"
print_status "  npm run serve:emulators    # Start Firebase emulators"
print_status "  npm run dev               # Start frontend and functions in development mode"
print_status ""
print_warning "Don't forget to update your .env files with the correct Firebase configuration!"

# Optional: Start emulators immediately
read -p "Would you like to start the Firebase emulators now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Starting Firebase emulators..."
    firebase emulators:start
fi