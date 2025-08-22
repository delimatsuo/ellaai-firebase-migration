import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Toaster } from 'react-hot-toast';
import { unifiedTheme } from './theme/unifiedTheme';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useEffect } from 'react';
import { ActingAsProvider } from './contexts/ActingAsContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Enhanced loading component with better UX
const LoadingSpinner: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <div style={{ 
    display: 'flex', 
    flexDirection: 'column',
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh',
    fontFamily: 'Roboto, sans-serif'
  }}>
    <div style={{
      width: '40px',
      height: '40px',
      border: '4px solid #e3f2fd',
      borderTop: '4px solid #1976d2',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      marginBottom: '16px'
    }} />
    <p style={{ color: '#666', fontSize: '14px' }}>{message}</p>
    <style>
      {`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}
    </style>
  </div>
);

// Lazy load pages for optimal code splitting
// Core pages (loaded immediately)
const LoginPage = React.lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = React.lazy(() => import('./pages/auth/RegisterPage'));
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage'));

// Dashboard pages (grouped for preloading)
const DashboardPage = React.lazy(() => 
  import('./pages/DashboardPage').then(module => ({ default: module.default }))
);

// Assessment pages (grouped together)
const AssessmentsPage = React.lazy(() => import('./pages/AssessmentsPage'));
const AssessmentTakePage = React.lazy(() => import('./pages/AssessmentTakePage'));
const AssessmentResultsPage = React.lazy(() => import('./pages/AssessmentResultsPage'));

// Profile page (separate chunk)
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));

// Company pages (grouped together)
const CompanyDashboardPage = React.lazy(() => import('./pages/company/CompanyDashboardPage'));
const CreateAssessmentPage = React.lazy(() => import('./pages/company/CreateAssessmentPage'));
const CandidatesPage = React.lazy(() => import('./pages/company/CandidatesPage'));

// Admin pages (grouped together - heavy features)
const AdminLayout = React.lazy(() => import('./components/admin/AdminLayout'));
const SystemAdminDashboardPage = React.lazy(() => import('./pages/admin/SystemAdminDashboardPage'));
const CreateCompanyPage = React.lazy(() => import('./pages/admin/CreateCompanyPage'));
const DatabaseQueryPage = React.lazy(() => import('./pages/admin/DatabaseQueryPage'));
const UserManagementPage = React.lazy(() => import('./pages/admin/UserManagementPage'));
const AccountManagementPage = React.lazy(() => import('./pages/admin/AccountManagementPage'));
const AuditLogPage = React.lazy(() => import('./pages/admin/AuditLogPage'));
const SystemHealthPage = React.lazy(() => import('./pages/admin/SystemHealthPage'));
const EllaRecruiterDashboard = React.lazy(() => import('./pages/support/EllaRecruiterDashboard'));

// Preload critical routes based on user role
const preloadRoutes = (role?: string) => {
  if (role === 'hiring_manager' || role === 'recruiter') {
    // Preload company dashboard
    import('./pages/company/CompanyDashboardPage');
    import('./pages/company/CreateAssessmentPage');
  } else if (role === 'candidate') {
    // Preload assessments page
    import('./pages/AssessmentsPage');
    import('./pages/DashboardPage');
  } else if (role === 'admin' || role === 'system_admin') {
    // Preload admin dashboard
    import('./pages/admin/SystemAdminDashboardPage');
    import('./components/admin/AdminLayout');
  }
};

const AppContent: React.FC = () => {
  const { user, userProfile, loading } = useAuth();

  // Preload routes based on user profile role
  React.useEffect(() => {
    if (userProfile) {
      preloadRoutes(userProfile.role);
    }
  }, [userProfile]);

  if (loading) {
    return <LoadingSpinner message="Authenticating..." />;
  }

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route 
          path="/login" 
          element={
            <Suspense fallback={<LoadingSpinner message="Loading login..." />}>
              <LoginPage />
            </Suspense>
          } 
        />
        <Route 
          path="/register" 
          element={
            <Suspense fallback={<LoadingSpinner message="Loading registration..." />}>
              <RegisterPage />
            </Suspense>
          } 
        />

        {/* Protected routes with lazy loading */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          {/* Dashboard */}
          <Route 
            index 
            element={
              <Suspense fallback={<LoadingSpinner message="Loading dashboard..." />}>
                <DashboardPage />
              </Suspense>
            } 
          />

          {/* Assessment routes */}
          <Route 
            path="assessments" 
            element={
              <Suspense fallback={<LoadingSpinner message="Loading assessments..." />}>
                <AssessmentsPage />
              </Suspense>
            } 
          />
          <Route 
            path="assessment/:id" 
            element={
              <Suspense fallback={<LoadingSpinner message="Loading assessment..." />}>
                <AssessmentTakePage />
              </Suspense>
            } 
          />
          <Route 
            path="assessment/:id/results" 
            element={
              <Suspense fallback={<LoadingSpinner message="Loading results..." />}>
                <AssessmentResultsPage />
              </Suspense>
            } 
          />

          {/* Profile */}
          <Route 
            path="profile" 
            element={
              <Suspense fallback={<LoadingSpinner message="Loading profile..." />}>
                <ProfilePage />
              </Suspense>
            } 
          />

          {/* Company routes */}
          <Route 
            path="company" 
            element={
              <Suspense fallback={<LoadingSpinner message="Loading company dashboard..." />}>
                <CompanyDashboardPage />
              </Suspense>
            } 
          />
          <Route 
            path="company/create-assessment" 
            element={
              <Suspense fallback={<LoadingSpinner message="Loading assessment creator..." />}>
                <CreateAssessmentPage />
              </Suspense>
            } 
          />
          <Route 
            path="company/candidates" 
            element={
              <Suspense fallback={<LoadingSpinner message="Loading candidates..." />}>
                <CandidatesPage />
              </Suspense>
            } 
          />
        </Route>

        {/* Admin routes with nested lazy loading */}
        <Route 
          path="/admin/*" 
          element={
            <ProtectedRoute allowedRoles={["admin", "system_admin"]}>
              <Suspense fallback={<LoadingSpinner message="Loading admin panel..." />}>
                <AdminLayout />
              </Suspense>
            </ProtectedRoute>
          }
        >
          <Route 
            index 
            element={
              <Suspense fallback={<LoadingSpinner message="Loading admin dashboard..." />}>
                <SystemAdminDashboardPage />
              </Suspense>
            } 
          />
          <Route 
            path="create-company" 
            element={
              <Suspense fallback={<LoadingSpinner message="Loading company creator..." />}>
                <CreateCompanyPage />
              </Suspense>
            } 
          />
          <Route 
            path="database" 
            element={
              <Suspense fallback={<LoadingSpinner message="Loading database tools..." />}>
                <DatabaseQueryPage />
              </Suspense>
            } 
          />
          <Route 
            path="users" 
            element={
              <Suspense fallback={<LoadingSpinner message="Loading user management..." />}>
                <UserManagementPage />
              </Suspense>
            } 
          />
          <Route 
            path="accounts" 
            element={
              <Suspense fallback={<LoadingSpinner message="Loading account management..." />}>
                <AccountManagementPage />
              </Suspense>
            } 
          />
          <Route 
            path="audit" 
            element={
              <Suspense fallback={<LoadingSpinner message="Loading audit logs..." />}>
                <AuditLogPage />
              </Suspense>
            } 
          />
          <Route 
            path="health" 
            element={
              <Suspense fallback={<LoadingSpinner message="Loading system health..." />}>
                <SystemHealthPage />
              </Suspense>
            } 
          />
          <Route 
            path="ella-recruiter" 
            element={
              <Suspense fallback={<LoadingSpinner message="Loading recruiter tools..." />}>
                <EllaRecruiterDashboard />
              </Suspense>
            } 
          />
        </Route>

        {/* Fallback routes */}
        <Route 
          path="*" 
          element={
            <Suspense fallback={<LoadingSpinner message="Loading..." />}>
              <NotFoundPage />
            </Suspense>
          } 
        />
      </Routes>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider theme={unifiedTheme}>
      <CssBaseline />
      <AuthProvider>
        <ActingAsProvider>
          <AppContent />
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#4caf50',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#f44336',
                  secondary: '#fff',
                },
              },
            }}
          />
        </ActingAsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;