import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Toaster } from 'react-hot-toast';
import { lightTheme } from './theme/theme';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ActingAsProvider } from './contexts/ActingAsContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AssessmentsPage from './pages/AssessmentsPage';
import AssessmentTakePage from './pages/AssessmentTakePage';
import AssessmentResultsPage from './pages/AssessmentResultsPage';
import ProfilePage from './pages/ProfilePage';
import CompanyDashboardPage from './pages/company/CompanyDashboardPage';
import CreateAssessmentPage from './pages/company/CreateAssessmentPage';
import CandidatesPage from './pages/company/CandidatesPage';
import NotFoundPage from './pages/NotFoundPage';

// Admin Pages
import AdminLayout from './components/admin/AdminLayout';
import SystemAdminDashboardPage from './pages/admin/SystemAdminDashboardPage';
import CreateCompanyPage from './pages/admin/CreateCompanyPage';
import DatabaseQueryPage from './pages/admin/DatabaseQueryPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import AccountManagementPage from './pages/admin/AccountManagementPage';
import AuditLogPage from './pages/admin/AuditLogPage';
import SystemHealthPage from './pages/admin/SystemHealthPage';
import EllaRecruiterDashboard from './pages/support/EllaRecruiterDashboard';

// Using our enterprise theme

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        Loading...
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route 
          path="/login" 
          element={user ? <Navigate to="/" replace /> : <LoginPage />} 
        />
        <Route 
          path="/register" 
          element={user ? <Navigate to="/" replace /> : <RegisterPage />} 
        />

        {/* Protected routes */}
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<DashboardPage />} />
          <Route path="profile" element={<ProfilePage />} />
          
          {/* Candidate routes */}
          <Route path="assessments" element={<AssessmentsPage />} />
          <Route path="assessments/:id" element={<AssessmentTakePage />} />
          <Route path="assessments/:id/results" element={<AssessmentResultsPage />} />
          
          {/* Company routes */}
          <Route 
            path="company" 
            element={
              <ProtectedRoute allowedRoles={['recruiter', 'hiring_manager', 'admin']}>
                <CompanyDashboardPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="company/assessments/create" 
            element={
              <ProtectedRoute allowedRoles={['recruiter', 'hiring_manager', 'admin']}>
                <CreateAssessmentPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="company/candidates" 
            element={
              <ProtectedRoute allowedRoles={['recruiter', 'hiring_manager', 'admin']}>
                <CandidatesPage />
              </ProtectedRoute>
            } 
          />
        </Route>

        {/* Admin routes */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'system_admin']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<SystemAdminDashboardPage />} />
          <Route path="create-company" element={<CreateCompanyPage />} />
          <Route path="database" element={<DatabaseQueryPage />} />
          <Route path="users" element={<UserManagementPage />} />
          <Route path="accounts" element={<AccountManagementPage />} />
          <Route path="audit" element={<AuditLogPage />} />
          <Route path="health" element={<SystemHealthPage />} />
        </Route>

        {/* Support routes for Ella Recruiters */}
        <Route 
          path="/support" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'system_admin']}>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<EllaRecruiterDashboard />} />
        </Route>

        {/* 404 route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider theme={lightTheme}>
      <CssBaseline />
      <AuthProvider>
        <ActingAsProvider>
          <AppContent />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              color: '#1e293b',
              border: '1px solid rgba(107, 70, 193, 0.2)',
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10B981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#EF4444',
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