import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { registerServiceWorker } from './utils/serviceWorker';
import { PerformanceMonitor, preloadCriticalResources, createErrorBoundary } from './utils/performanceSimple';
import './index.css';

// Initialize performance monitoring
const performanceMonitor = PerformanceMonitor.getInstance();

// Register service worker for caching and offline support
registerServiceWorker().then(registration => {
  if (registration) {
    console.log('Service Worker registered successfully');
  }
});

// Preload critical resources
preloadCriticalResources();

// Performance monitoring for the app
const measureAppRender = performanceMonitor.measureComponentRender('App');

// Error boundary for development
if (import.meta.env.DEV) {
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
  });
  
  window.addEventListener('error', (event) => {
    console.error('Unhandled error:', event.error);
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Complete app render measurement
measureAppRender();

// Track Core Web Vitals
performanceMonitor.getCoreWebVitals().then(vitals => {
  console.log('Core Web Vitals:', vitals);
  
  // Send to analytics if available
  if ((window as any).gtag) {
    (window as any).gtag('event', 'web_vitals', {
      event_category: 'performance',
      lcp: vitals.lcp,
      fid: vitals.fid,
      cls: vitals.cls,
    });
  }
});

// Expose performance utilities globally for debugging
if (import.meta.env.DEV) {
  (window as any).performanceUtils = {
    monitor: performanceMonitor,
    getMetrics: () => performanceMonitor.exportMetrics(),
  };
}