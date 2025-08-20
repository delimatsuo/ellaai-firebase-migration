import React from 'react';
import ReactDOM from 'react-dom/client';
import { initializeReactScheduler, preloadScheduler, isSchedulerReady } from './scheduler-init';
import './index.css';

// Import App directly to avoid lazy loading issues in production
import App from './App';


// Preload scheduler for optimal React 18 performance
preloadScheduler();

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

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Failed to find the root element');
}

// Enhanced React initialization with optimized scheduler handling
async function initializeReact() {
  try {
    // Step 1: Ensure scheduler is properly initialized
    console.log('🚀 Initializing React scheduler...');
    await initializeReactScheduler();
    
    // Step 2: Verify React and ReactDOM are properly loaded
    if (typeof React === 'undefined' || typeof ReactDOM === 'undefined') {
      throw new Error('React or ReactDOM not properly loaded');
    }

    // Step 3: Verify React 18 createRoot is available
    if (typeof ReactDOM.createRoot === 'undefined') {
      throw new Error('ReactDOM.createRoot not available - React 18 not properly loaded');
    }

    // Step 4: Verify scheduler readiness
    if (!isSchedulerReady()) {
      console.warn('⚠️ Scheduler not ready, but proceeding with React initialization');
    } else {
      console.log('✅ Scheduler ready for React initialization');
    }

    // Step 5: Create root and render app directly
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    
    // Clear any previous error flags
    sessionStorage.removeItem('scheduler-error-reload');
    sessionStorage.removeItem('init-error-reload');
    
    console.log('✅ React application initialized successfully');
    
  } catch (error) {
    console.error('❌ Failed to initialize React:', error);
    
    // Enhanced fallback with better error handling
    rootElement.innerHTML = `
      <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: Roboto, sans-serif;">
        <div style="text-align: center;">
          <h1>EllaAI Platform</h1>
          <p>Initializing application...</p>
          <div style="margin: 20px 0;">
            <div style="width: 200px; height: 4px; background: #e0e0e0; border-radius: 2px; margin: 0 auto; overflow: hidden;">
              <div style="width: 100%; height: 100%; background: linear-gradient(90deg, #1976d2, #42a5f5); animation: loading 2s infinite ease-in-out;"></div>
            </div>
          </div>
          <p style="color: #666; font-size: 14px;">If this takes too long, please refresh the page.</p>
          <style>
            @keyframes loading {
              0% { transform: translateX(-100%); }
              50% { transform: translateX(0%); }
              100% { transform: translateX(100%); }
            }
          </style>
        </div>
      </div>
    `;
    
    // Progressive retry strategy
    const retryCount = parseInt(sessionStorage.getItem('init-retry-count') || '0');
    if (retryCount < 3) {
      sessionStorage.setItem('init-retry-count', (retryCount + 1).toString());
      console.log(`🔄 Retrying initialization (attempt ${retryCount + 1}/3)...`);
      setTimeout(() => {
        initializeReact();
      }, 1000 * (retryCount + 1)); // Progressive delay
    } else {
      console.error('❌ Maximum retry attempts reached');
      // Final fallback: hard reload
      if (!sessionStorage.getItem('final-reload-attempted')) {
        sessionStorage.setItem('final-reload-attempted', 'true');
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      }
    }
  }
}

// Initialize React app with async scheduler setup
initializeReact().catch(error => {
  console.error('❌ Critical initialization error:', error);
  // Last resort error handling
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: Roboto, sans-serif; color: #d32f2f;">
        <div style="text-align: center;">
          <h1>EllaAI Platform</h1>
          <p>Unable to start application</p>
          <p style="font-size: 14px; margin-top: 20px;">
            <button onclick="window.location.reload()" style="padding: 10px 20px; background: #1976d2; color: white; border: none; border-radius: 4px; cursor: pointer;">
              Reload Page
            </button>
          </p>
        </div>
      </div>
    `;
  }
});