# EllaAI Platform

**Enterprise-grade AI-powered assessment platform for technical talent evaluation**

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/ellaai/firebase-migration)
[![Security](https://img.shields.io/badge/security-enterprise-blue.svg)](docs/SECURITY.md)
[![License](https://img.shields.io/badge/license-proprietary-red.svg)]()

## Overview

EllaAI is a comprehensive technical assessment platform that enables companies to evaluate candidates through AI-powered coding assessments, behavioral analysis, and skill verification. The platform provides secure, scalable, and intelligent assessment capabilities with real-time proctoring and advanced analytics.

## Key Features

- 🧠 **AI-Powered Assessments** - Intelligent question generation and evaluation
- 🔒 **Enterprise Security** - Multi-layered security with audit logging
- 📊 **Real-time Analytics** - Comprehensive performance metrics and insights
- 🎯 **Adaptive Testing** - Dynamic difficulty adjustment based on performance
- 👁️ **Live Proctoring** - Real-time monitoring with fraud detection
- 🏢 **Multi-tenant Architecture** - Secure company data isolation
- ⚡ **High Performance** - Optimized for scale with caching and CDN
- 🔧 **Admin Tools** - Comprehensive management dashboard

## Architecture

### Technology Stack

**Frontend:**
- React 18 with TypeScript
- Material-UI (MUI) for components
- Vite for build tooling
- React Query for state management
- Monaco Editor for code assessments

**Backend:**
- Firebase Cloud Functions (Node.js 18)
- Express.js API framework
- Firebase Authentication & Firestore
- Redis for caching and rate limiting
- Winston for structured logging

**Infrastructure:**
- Firebase Hosting for static assets
- Google Cloud Platform services
- CDN for global content delivery
- Automated CI/CD with GitHub Actions

### System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│   Frontend      │    │   API Gateway    │    │   Cloud Functions   │
│   (React/TS)    │◄──►│   (Firebase)     │◄──►│   (Node.js/Express) │
└─────────────────┘    └──────────────────┘    └─────────────────────┘
                                │                          │
                                ▼                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          Firebase Services                          │
├─────────────────┬─────────────────┬─────────────────┬──────────────┤
│   Firestore     │   Authentication│   Cloud Storage │   Hosting    │
│   (Database)    │   (Identity)    │   (Files)       │   (Static)   │
└─────────────────┴─────────────────┴─────────────────┴──────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       External Services                            │
├─────────────────┬─────────────────┬─────────────────┬──────────────┤
│   Redis Cache   │   Email Service │   Monitoring    │   CDN        │
│   (Performance) │   (Notifications)│  (Observability)│   (Global)   │
└─────────────────┴─────────────────┴─────────────────┴──────────────┘
```

## Quick Start

### Prerequisites

- Node.js 18+ LTS
- npm 9+ or yarn 1.22+
- Firebase CLI 12+
- Git 2.34+

### Installation

```bash
# Clone the repository
git clone https://github.com/ellaai/firebase-migration.git
cd firebase-migration

# Install all dependencies
npm run install:all

# Set up environment variables
cp config/environment.example .env.local

# Configure Firebase credentials
# Edit .env.local with your Firebase project credentials

# Start development environment
npm run dev
```

### Development Environment

The development environment includes:
- Hot-reload frontend on `http://localhost:5173`
- Firebase Functions emulator on `http://localhost:5001`
- Firestore emulator on `http://localhost:8080`
- Authentication emulator on `http://localhost:9099`
- Firebase UI on `http://localhost:4000`

```bash
# Start all services
npm run dev

# Start specific services
npm run dev:frontend    # Frontend only
npm run dev:functions   # Functions only
npm run serve:emulators # Firebase emulators only
```

## Configuration

### Environment Variables

Copy `config/environment.example` to `.env.local` and configure:

```bash
# Required Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Security Configuration
NEXTAUTH_SECRET=your-super-secret-32-character-key
CSRF_SECRET_KEY=your-csrf-secret-32-characters
SECURITY_SALT=your-security-salt-for-hashing

# Optional Services
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=sk-your-openai-api-key
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project
```

### Firebase Configuration

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Authentication, Firestore, Cloud Functions, and Hosting
3. Generate a service account key
4. Configure authentication providers (Email/Password, Google, etc.)
5. Set up Firestore security rules

## Development Workflow

### Project Structure

```
firebase-migration/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Route components
│   │   ├── services/        # API integration
│   │   ├── contexts/        # React contexts
│   │   └── utils/           # Helper functions
│   ├── public/              # Static assets
│   └── dist/                # Build output
├── functions/               # Firebase Cloud Functions
│   ├── src/
│   │   ├── routes/          # API route handlers
│   │   ├── middleware/      # Express middleware
│   │   ├── services/        # Business logic
│   │   └── utils/           # Helper functions
│   └── lib/                 # Compiled output
├── lib/                     # Shared utilities
│   ├── config/              # Configuration files
│   └── middleware/          # Shared middleware
├── config/                  # Environment configurations
├── scripts/                 # Build and deployment scripts
├── tests/                   # Test suites
└── docs/                    # Documentation
```

### Development Scripts

```bash
# Development
npm run dev                  # Start all services
npm run dev:frontend        # Frontend development server
npm run dev:functions       # Functions with hot-reload

# Building
npm run build               # Build all components
npm run build:frontend      # Build frontend only
npm run build:functions     # Build functions only

# Testing
npm run test                # Run all tests
npm run lint                # Run linting
npm run typecheck          # TypeScript type checking

# Deployment
npm run deploy              # Deploy everything
npm run deploy:hosting      # Deploy frontend only
npm run deploy:functions    # Deploy functions only
```

## Security Features

- **Multi-layered Authentication** - Firebase Auth + custom claims
- **RBAC (Role-Based Access Control)** - Granular permission system
- **CSRF Protection** - Request validation with tokens
- **Rate Limiting** - API protection against abuse
- **SQL Injection Prevention** - Parameterized queries
- **XSS Protection** - Content Security Policy headers
- **Audit Logging** - Complete action tracking
- **Data Encryption** - At-rest and in-transit encryption

## API Documentation

The EllaAI platform provides RESTful APIs for all core functionality:

### Authentication Endpoints
- `POST /api/auth/login` - User authentication
- `POST /api/auth/logout` - Session termination
- `POST /api/auth/refresh` - Token refresh

### Assessment Endpoints
- `GET /api/assessments` - List assessments
- `POST /api/assessments` - Create assessment
- `PUT /api/assessments/:id` - Update assessment
- `DELETE /api/assessments/:id` - Delete assessment
- `POST /api/assessments/:id/start` - Start assessment attempt
- `POST /api/assessments/:id/submit` - Submit assessment

### Admin Endpoints
- `GET /api/admin/users` - User management
- `GET /api/admin/companies` - Company management
- `GET /api/admin/audit` - Audit logs
- `GET /api/admin/metrics` - System metrics

For complete API documentation, see [docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md).

## Deployment

### Production Deployment

See [docs/PRODUCTION_DEPLOYMENT.md](docs/PRODUCTION_DEPLOYMENT.md) for detailed deployment instructions.

Quick deployment checklist:
1. Configure production environment variables
2. Set up Firebase project with production settings
3. Configure custom domain and SSL
4. Set up monitoring and alerting
5. Deploy with `npm run deploy`

### Staging Environment

```bash
# Deploy to staging
firebase use staging
npm run deploy

# Promote staging to production
firebase use production
npm run deploy
```

## Monitoring and Observability

### Health Checks
- `GET /api/health` - Application health status
- `GET /api/health/detailed` - Detailed system status

### Metrics and Monitoring
- Application Performance Monitoring (APM)
- Real-time error tracking with Sentry
- Custom business metrics dashboard
- Log aggregation and analysis

### Alerts
- Error rate thresholds
- Performance degradation
- Security incidents
- Resource utilization

## Testing

### Test Suites
- **Unit Tests** - Component and function testing
- **Integration Tests** - API and database testing
- **End-to-End Tests** - Full user workflow testing
- **Security Tests** - Vulnerability scanning

```bash
# Run all tests
npm run test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:security

# Test coverage
npm run test:coverage
```

## Contributing

### Development Guidelines
1. Follow TypeScript strict mode
2. Use ESLint and Prettier for code formatting
3. Write tests for new features
4. Update documentation for API changes
5. Follow semantic versioning

### Code Review Process
1. Create feature branch from `main`
2. Make changes with comprehensive tests
3. Submit pull request with detailed description
4. Ensure all checks pass
5. Obtain approval from code owners

## Support and Documentation

### Documentation
- [Architecture Guide](docs/ARCHITECTURE.md) - System design and components
- [API Documentation](docs/API_DOCUMENTATION.md) - Complete API reference
- [Security Guide](docs/SECURITY.md) - Security implementation details
- [Deployment Guide](docs/PRODUCTION_DEPLOYMENT.md) - Production deployment
- [Monitoring Guide](docs/MONITORING.md) - Observability setup
- [Troubleshooting](docs/TROUBLESHOOTING.md) - Common issues and solutions
- [Runbook](docs/RUNBOOK.md) - Operations manual

### Support Channels
- **Technical Issues**: Create GitHub issue
- **Security Issues**: security@ellaai.com
- **General Questions**: support@ellaai.com

## License

Copyright © 2024 EllaAI. All rights reserved.

This software is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.

---

**Built with ❤️ by the EllaAI Team**