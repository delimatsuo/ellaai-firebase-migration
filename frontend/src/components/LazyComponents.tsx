import React, { Suspense } from 'react';
import { CircularProgress, Box } from '@mui/material';
import { createLazyComponent } from '@/utils/performance';

// Loading fallback component
const LoadingFallback = ({ message = 'Loading...' }: { message?: string }) => (
  <Box 
    display="flex" 
    justifyContent="center" 
    alignItems="center" 
    minHeight="200px"
    flexDirection="column"
    gap={2}
  >
    <CircularProgress />
    <span>{message}</span>
  </Box>
);

// Lazy load heavy components
export const LazyAssessmentExecution = createLazyComponent(
  () => import('@/components/assessment/AssessmentExecution')
);

export const LazyCodeEditor = createLazyComponent(
  () => import('@/components/assessment/CodeEditor')
);

export const LazyResultsDashboard = createLazyComponent(
  () => import('@/components/analytics/ResultsDashboard')
);

export const LazyPerformanceChart = createLazyComponent(
  () => import('@/components/charts/PerformanceChart')
);

export const LazyKanbanBoard = createLazyComponent(
  () => import('@/components/candidates/KanbanBoard')
);

export const LazyQueryBuilder = createLazyComponent(
  () => import('@/components/admin/QueryBuilder')
);

// Higher-order component for lazy loading with error boundary
export function withLazyLoading<T extends object>(
  Component: React.ComponentType<T>,
  fallback?: React.ReactNode
) {
  return React.forwardRef<any, any>((props, ref) => (
    <Suspense fallback={fallback || <LoadingFallback />}>
      <Component {...(props as T)} ref={ref} />
    </Suspense>
  )) as React.ComponentType<T>;
}

// Route-level lazy components
export const LazyDashboard = createLazyComponent(
  () => import('@/pages/DashboardPage')
);

export const LazyAssessments = createLazyComponent(
  () => import('@/pages/AssessmentsPage')
);

export const LazyAssessmentResults = createLazyComponent(
  () => import('@/pages/AssessmentResultsPage')
);

export const LazyAssessmentTake = createLazyComponent(
  () => import('@/pages/AssessmentTakePage')
);

export const LazyProfile = createLazyComponent(
  () => import('@/pages/ProfilePage')
);

// Admin pages
export const LazySystemAdminDashboard = createLazyComponent(
  () => import('@/pages/admin/SystemAdminDashboardPage')
);

export const LazyAccountManagement = createLazyComponent(
  () => import('@/pages/admin/AccountManagementPage')
);

export const LazyUserManagement = createLazyComponent(
  () => import('@/pages/admin/UserManagementPage')
);

export const LazyAuditLog = createLazyComponent(
  () => import('@/pages/admin/AuditLogPage')
);

export const LazyDatabaseQuery = createLazyComponent(
  () => import('@/pages/admin/DatabaseQueryPage')
);

export const LazySystemHealth = createLazyComponent(
  () => import('@/pages/admin/SystemHealthPage')
);

// Company pages
export const LazyCompanyDashboard = createLazyComponent(
  () => import('@/pages/company/CompanyDashboardPage')
);

export const LazyCandidates = createLazyComponent(
  () => import('@/pages/company/CandidatesPage')
);

export const LazyCreateAssessment = createLazyComponent(
  () => import('@/pages/company/CreateAssessmentPage')
);

// Support pages
export const LazyEllaRecruiterDashboard = createLazyComponent(
  () => import('@/pages/support/EllaRecruiterDashboard')
);