# EllaAI ATS - System Architecture Diagrams & Technical Specifications

## Table of Contents
1. [High-Level System Architecture](#1-high-level-system-architecture)
2. [User Authentication & Authorization Flow](#2-user-authentication--authorization-flow)
3. [Multi-Tenant Data Architecture](#3-multi-tenant-data-architecture)
4. [Ella Recruiter "Acting As" Mode Architecture](#4-ella-recruiter-acting-as-mode-architecture)
5. [Assessment Engine Architecture](#5-assessment-engine-architecture)
6. [Data Flow Diagrams](#6-data-flow-diagrams)
7. [Component Interaction Diagrams](#7-component-interaction-diagrams)

---

## 1. High-Level System Architecture

### C4 Model - System Context

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                EllaAI ATS Platform                               │
│                              [Software System]                                   │
└─────────────────────────────────────────────────────────────────────────────────┘
           ▲                    ▲                    ▲                    ▲
           │                    │                    │                    │
    ┌──────────┐         ┌──────────┐         ┌──────────┐         ┌──────────┐
    │ System   │         │   Ella   │         │ Company  │         │Candidate │
    │  Admin   │         │Recruiter │         │Personnel │         │ (Public) │
    │[Person]  │         │[Person]  │         │[Person]  │         │[Person]  │
    └──────────┘         └──────────┘         └──────────┘         └──────────┘

           ▼                    ▼                    ▼                    ▼
    ┌──────────┐         ┌──────────┐         ┌──────────┐         ┌──────────┐
    │Email     │         │Calendar  │         │Payment   │         │Analytics │
    │System    │         │Systems   │         │Gateway   │         │Platform  │
    │[External]│         │[External]│         │[External]│         │[External]│
    └──────────┘         └──────────┘         └──────────┘         └──────────┘
```

### C4 Model - Container Diagram

```
                    ┌─────────────────────────────────────────────────────────┐
                    │                   EllaAI ATS Platform                    │
                    │                  [Software System]                      │
                    │                                                         │
                    │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐ │
                    │  │   Web App   │    │  Admin API  │    │ Public API  │ │
                    │  │[Container]  │    │[Container]  │    │[Container]  │ │
                    │  │React/TS     │    │Node.js/TS   │    │Node.js/TS   │ │
                    │  └─────────────┘    └─────────────┘    └─────────────┘ │
                    │         │                   │                   │       │
                    │         └───────────────────┼───────────────────┘       │
                    │                             │                           │
                    │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐ │
                    │  │   Auth      │    │Business     │    │ Background  │ │
                    │  │  Service    │    │Logic API    │    │   Workers   │ │
                    │  │[Container]  │    │[Container]  │    │[Container]  │ │
                    │  │Firebase     │    │Node.js/TS   │    │Node.js      │ │
                    │  └─────────────┘    └─────────────┘    └─────────────┘ │
                    │         │                   │                   │       │
                    │         └───────────────────┼───────────────────┘       │
                    │                             │                           │
                    │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐ │
                    │  │  Database   │    │   Cache     │    │  File       │ │
                    │  │ (Firestore) │    │  (Redis)    │    │ Storage     │ │
                    │  │[Container]  │    │[Container]  │    │[Container]  │ │
                    │  │NoSQL        │    │In-memory    │    │Cloud Storage│ │
                    │  └─────────────┘    └─────────────┘    └─────────────┘ │
                    └─────────────────────────────────────────────────────────┘
```

---

## 2. User Authentication & Authorization Flow

### Role-Based Access Control (RBAC) Matrix

```
┌─────────────────┬─────────────┬─────────────┬─────────────┬─────────────┬─────────────┐
│   Resource      │System Admin │Ella Recruit │Company Admin│Company Rec. │Hiring Mgr   │
├─────────────────┼─────────────┼─────────────┼─────────────┼─────────────┼─────────────┤
│Company Create   │     ✓       │     ✗       │     ✗       │     ✗       │     ✗       │
│Company Delete   │     ✓       │     ✗       │     ✗       │     ✗       │     ✗       │
│Acting As Mode   │     ✓       │     ✓       │     ✗       │     ✗       │     ✗       │
│User Management  │     ✓       │     ✗       │   ✓(own)    │     ✗       │     ✗       │
│Job Creation     │     ✗       │   ✓(act)    │     ✗       │     ✓       │     ✗       │
│Assessment Build │     ✗       │   ✓(act)    │     ✗       │     ✓       │     ✗       │
│Candidate Review │     ✗       │   ✓(act)    │     ✗       │     ✓       │     ✓       │
│Hiring Decisions │     ✗       │     ✗       │     ✗       │     ✗       │     ✓       │
└─────────────────┴─────────────┴─────────────┴─────────────┴─────────────┴─────────────┘
```

### Authentication Flow Diagram

```
┌────────────┐     ┌────────────┐     ┌────────────┐     ┌────────────┐
│   User     │────▶│  Frontend  │────▶│   Auth     │────▶│ Database   │
│            │     │   App      │     │  Service   │     │ (Firebase) │
└────────────┘     └────────────┘     └────────────┘     └────────────┘
       │                  │                  │                  │
       │                  │                  │                  │
    1. Login           2. Auth          3. Verify         4. User Data
    Request            Request          Credentials       Retrieval
       │                  │                  │                  │
       │                  │                  │                  │
       ▼                  ▼                  ▼                  ▼
┌────────────┐     ┌────────────┐     ┌────────────┐     ┌────────────┐
│   JWT      │◀────│  Session   │◀────│Role-Based  │◀────│Multi-Tenant│
│  Token     │     │Management  │     │Permissions │     │Context     │
└────────────┘     └────────────┘     └────────────┘     └────────────┘
```

---

## 3. Multi-Tenant Data Architecture

### Tenant Isolation Strategy

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            Firestore Database                                    │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         Platform Collection                              │   │
│  │                                                                         │   │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐│   │
│  │  │   users     │    │ companies   │    │audit_logs   │    │   billing   ││   │
│  │  │(platform)   │    │(tenants)    │    │(platform)   │    │(platform)   ││   │
│  │  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘│   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                       │                                         │
│                                       ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    Company-Specific Collections                          │   │
│  │                                                                         │   │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐│   │
│  │  │company_123  │    │company_456  │    │company_789  │    │    ...      ││   │
│  │  │             │    │             │    │             │    │             ││   │
│  │  │  ├users     │    │  ├users     │    │  ├users     │    │  ├users     ││   │
│  │  │  ├jobs      │    │  ├jobs      │    │  ├jobs      │    │  ├jobs      ││   │
│  │  │  ├candidates│    │  ├candidates│    │  ├candidates│    │  ├candidates││   │
│  │  │  ├assessmnt │    │  ├assessmnt │    │  ├assessmnt │    │  ├assessmnt ││   │
│  │  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘│   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Data Access Layer

```typescript
// Pseudo-code for multi-tenant data access
interface TenantContext {
  companyId: string;
  userId: string;
  role: UserRole;
  permissions: Permission[];
}

class DataAccessLayer {
  constructor(private tenantContext: TenantContext) {}
  
  async getCollection(collectionName: string): Promise<Collection> {
    // Automatic tenant isolation
    const path = `companies/${this.tenantContext.companyId}/${collectionName}`;
    return firestore.collection(path);
  }
  
  async validateAccess(resource: string, operation: string): Promise<boolean> {
    return this.permissionService.hasAccess(
      this.tenantContext.permissions,
      resource,
      operation
    );
  }
}
```

---

## 4. Ella Recruiter "Acting As" Mode Architecture

### Session Management Flow

```
┌────────────┐     ┌────────────┐     ┌────────────┐     ┌────────────┐
│   Ella     │────▶│   Auth     │────▶│  Session   │────▶│  Customer  │
│ Recruiter  │     │  Service   │     │  Manager   │     │  Company   │
└────────────┘     └────────────┘     └────────────┘     └────────────┘
       │                  │                  │                  │
    1. Request         2. Verify          3. Create         4. Impersonate
    Acting As          Permissions        Session           User Context
       │                  │                  │                  │
       ▼                  ▼                  ▼                  ▼
┌────────────┐     ┌────────────┐     ┌────────────┐     ┌────────────┐
│  Audit     │     │  Session   │     │   Timer    │     │  Emergency │
│   Log      │     │  Token     │     │  Service   │     │   Exit     │
└────────────┘     └────────────┘     └────────────┘     └────────────┘
```

### Session Security Controls

```
Session Configuration:
┌─────────────────────────────────────────────────────────────────────┐
│ Maximum Duration: 4 hours                                            │
│ Idle Timeout: 30 minutes                                            │
│ MFA Required: Yes                                                    │
│ Customer Notification: Real-time                                     │
│ Audit Granularity: Every action                                     │
│ Emergency Exit: Always available                                     │
│ Session Extension: Requires re-authentication                        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 5. Assessment Engine Architecture

### Assessment Lifecycle Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Question    │────▶│ Assessment  │────▶│ Candidate   │────▶│ Results     │
│   Bank      │     │  Builder    │     │ Interface   │     │ Processing  │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
       │                  │                  │                  │
    1. Template        2. Creation       3. Execution      4. Evaluation
    Selection          & Config         & Submission      & Scoring
       │                  │                  │                  │
       ▼                  ▼                  ▼                  ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Metadata    │     │ Preview &   │     │ Auto-Save   │     │ AI-Powered  │
│ Management  │     │ Testing     │     │ Progress    │     │ Analysis    │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

### Question Bank Architecture

```
Question Hierarchy:
┌─────────────────────────────────────────────────────────────────────┐
│                           Question Bank                              │
│                                                                     │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐             │
│  │  Category   │    │  Category   │    │  Category   │             │
│  │(Frontend)   │    │ (Backend)   │    │(DevOps)     │             │
│  │             │    │             │    │             │             │
│  │ ├─React     │    │ ├─Node.js   │    │ ├─Docker    │             │
│  │ ├─Vue       │    │ ├─Python    │    │ ├─K8s       │             │
│  │ ├─Angular   │    │ ├─Java      │    │ ├─AWS       │             │
│  └─────────────┘    └─────────────┘    └─────────────┘             │
│                                                                     │
│  Question Types:                                                    │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐             │
│  │ Multiple    │    │ Code        │    │ System      │             │
│  │ Choice      │    │ Challenge   │    │ Design      │             │
│  └─────────────┘    └─────────────┘    └─────────────┘             │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 6. Data Flow Diagrams

### Candidate Assessment Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Candidate   │────▶│ Assessment  │────▶│ Submission  │────▶│ Results     │
│ Portal      │     │ Engine      │     │ Processing  │     │ Dashboard   │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
       │                  │                  │                  │
    Receive            Load Test          Process             Generate
    Invitation         Questions          Answers             Reports
       │                  │                  │                  │
       ▼                  ▼                  ▼                  ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│Email/SMS    │     │Real-time    │     │AI Scoring   │     │Hiring Team  │
│Notification │     │Progress     │     │Engine       │     │Notification │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

### Company Onboarding Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Registration│────▶│ Verification│────▶│ Provisioning│────▶│ Training    │
│ Request     │     │ Process     │     │ & Setup     │     │ & Go-Live   │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
       │                  │                  │                  │
    Form              Domain            Database            Welcome
    Submission        Verification      Creation            Package
       │                  │                  │                  │
       ▼                  ▼                  ▼                  ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│Business     │     │Identity     │     │Resource     │     │Customer     │
│Validation   │     │Verification │     │Allocation   │     │Success      │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

---

## 7. Component Interaction Diagrams

### Frontend Component Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                App Component                                      │
│                                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   Auth      │    │  Routing    │    │   Theme     │    │   Error     │     │
│  │ Provider    │    │ Provider    │    │ Provider    │    │ Boundary    │     │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘     │
│                                      │                                         │
│                                      ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                            Layout Components                             │   │
│  │                                                                         │   │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                 │   │
│  │  │   Header    │    │  Sidebar    │    │   Footer    │                 │   │
│  │  │ Component   │    │ Component   │    │ Component   │                 │   │
│  │  └─────────────┘    └─────────────┘    └─────────────┘                 │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                         │
│                                      ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                            Page Components                               │   │
│  │                                                                         │   │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                 │   │
│  │  │ Dashboard   │    │ Assessment  │    │ Candidate   │                 │   │
│  │  │    Page     │    │    Page     │    │    Page     │                 │   │
│  │  └─────────────┘    └─────────────┘    └─────────────┘                 │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                         │
│                                      ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                           Feature Components                             │   │
│  │                                                                         │   │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                 │   │
│  │  │   Data      │    │    Form     │    │   Chart     │                 │   │
│  │  │   Table     │    │ Components  │    │ Components  │                 │   │
│  │  └─────────────┘    └─────────────┘    └─────────────┘                 │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Backend Service Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              API Gateway                                         │
│                                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   Auth      │    │ Rate        │    │ Request     │    │ Response    │     │
│  │Middleware   │    │ Limiting    │    │ Validation  │    │ Transform   │     │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘     │
└─────────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                             Service Layer                                        │
│                                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   User      │    │ Company     │    │ Assessment  │    │ Candidate   │     │
│  │ Service     │    │ Service     │    │ Service     │    │ Service     │     │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘     │
└─────────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           Data Access Layer                                      │
│                                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │ Repository  │    │ Query       │    │ Transaction │    │ Cache       │     │
│  │ Pattern     │    │ Builder     │    │ Manager     │    │ Manager     │     │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘     │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Architecture Decision Records (ADRs)

### ADR-001: Multi-Tenant Architecture Strategy
**Decision**: Implement shared database with tenant isolation via document paths
**Rationale**: Cost-effective scaling while maintaining data security
**Consequences**: Simplified operations but requires careful access control implementation

### ADR-002: Authentication Provider
**Decision**: Use Firebase Authentication with custom role management
**Rationale**: Robust security features, easy integration, scalable
**Consequences**: Vendor lock-in but significantly reduced development time

### ADR-003: Frontend Framework
**Decision**: React with TypeScript and Material-UI
**Rationale**: Strong ecosystem, developer expertise, component library maturity
**Consequences**: Learning curve for team but improved development velocity

### ADR-004: Database Choice
**Decision**: Firestore for primary database with Redis for caching
**Rationale**: NoSQL flexibility, automatic scaling, real-time capabilities
**Consequences**: Different query patterns but better performance at scale

---

This architecture specification provides the technical foundation for implementing the comprehensive workflows defined in the user requirements document.