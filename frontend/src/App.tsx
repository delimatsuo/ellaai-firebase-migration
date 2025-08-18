import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Toaster } from 'react-hot-toast';

import { AuthProvider, useAuth } from './contexts/AuthContext';
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

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

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

        {/* 404 route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
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
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;