import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { initializeProductionGuards } from './utils/productionGuards';

// Import App directly to avoid lazy loading issues in production
import App from './App';

// Simple loading component for any suspense boundaries
function LoadingFallback() {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontFamily: 'Roboto, sans-serif'
    }}>
      <div>
        <h1>EllaAI Platform</h1>
        <p>Loading application...</p>
      </div>
    </div>
  );
}

// Enhanced error handling for production scheduler issues
function setupErrorHandling() {
  // Global error handler for React scheduler issues
  window.addEventListener('error', (event) => {
    if (event.error && event.error.message) {
      const message = event.error.message;
      
      // Specific handling for React scheduler errors
      if (message.includes('unstable_scheduleCallback') || 
          message.includes('scheduler') ||
          message.includes('Cannot read properties of undefined')) {
        console.error('React Scheduler Error Detected:', {
          message: message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error.stack
        });
        
        // Attempt to reload the page once on scheduler errors
        if (!sessionStorage.getItem('scheduler-error-reload')) {
          sessionStorage.setItem('scheduler-error-reload', 'true');
          setTimeout(() => {
            window.location.reload();
          }, 1000);
          return;
        }
      }
    }
    
    if (import.meta.env.DEV) {
      console.error('Unhandled error:', event.error);
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    if (import.meta.env.DEV) {
      console.error('Unhandled promise rejection:', event.reason);
    }
  });
}

// Initialize error handling
setupErrorHandling();

// Initialize production guards to prevent development server connections
if (import.meta.env.PROD || import.meta.env.VITE_ENV === 'production') {
  try {
    initializeProductionGuards();
  } catch (error) {
    console.error('❌ Production guard initialization failed:', error);
    // Continue with application startup even if guards fail
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Failed to find the root element');
}

// Simple React initialization
try {
  console.log('Starting React initialization...');
  const root = ReactDOM.createRoot(rootElement);
  console.log('Root created, rendering app...');
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  
  console.log('✅ React application initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize React:', error);
  console.error('Error details:', error instanceof Error ? error.stack : error);
  
  // Simple fallback for errors
  rootElement.innerHTML = `
    <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: Roboto, sans-serif;">
      <div style="text-align: center;">
        <h1>EllaAI Platform</h1>
        <p>Error initializing application</p>
        <p style="color: #666; font-size: 14px; margin-top: 20px;">
          Error: ${error instanceof Error ? error.message : 'Unknown error'}
        </p>
        <p style="color: #666; font-size: 14px; margin-top: 20px;">
          <button onclick="window.location.reload()" style="padding: 10px 20px; background: #1976d2; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Reload Page
          </button>
        </p>
      </div>
    </div>
  `;
}