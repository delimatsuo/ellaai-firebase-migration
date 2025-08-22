/**
 * Production Guard Utilities
 * Prevents development code from executing in production environments
 */

// Global WebSocket blocking for production
export const blockDevelopmentConnections = () => {
  if (import.meta.env.PROD || import.meta.env.VITE_ENV === 'production') {
    // Override WebSocket constructor to prevent development server connections
    const OriginalWebSocket = window.WebSocket;
    
    window.WebSocket = class extends OriginalWebSocket {
      constructor(url: string | URL, protocols?: string | string[]) {
        const urlString = typeof url === 'string' ? url : url.toString();
        
        // Block specific development patterns INCLUDING localhost
        const isDevelopmentUrl = urlString.includes('localhost') ||
                                urlString.includes('127.0.0.1') || 
                                urlString.includes('0.0.0.0') ||
                                urlString.includes('[::1]') ||
                                urlString.match(/:[8-9][0-9]{3}/) || // ports 8000-9999
                                urlString.includes(':8080') || // Firestore emulator
                                urlString.includes(':9099') || // Auth emulator
                                urlString.includes(':5001') || // Functions emulator
                                urlString.includes(':9199') || // Storage emulator
                                urlString.includes('dev') ||
                                urlString.includes('test');
        
        if (isDevelopmentUrl) {
          console.error('🚨 WebSocket connection to development server blocked in production:', urlString);
          throw new Error('Development WebSocket connections are not allowed in production');
        }
        
        super(url, protocols);
      }
    };
    
    console.log('🛡️ Production WebSocket guard activated');
  }
};

// Validate environment configuration
export const validateProductionEnvironment = () => {
  const isProduction = import.meta.env.PROD || import.meta.env.VITE_ENV === 'production';
  
  if (isProduction) {
    // Check for required production environment variables
    const requiredVars = [
      'VITE_FIREBASE_PROJECT_ID',
      'VITE_FIREBASE_AUTH_DOMAIN',
      'VITE_FIREBASE_API_KEY'
    ];
    
    const missingVars = requiredVars.filter(varName => {
      const value = import.meta.env[varName];
      return !value || value.includes('demo') || value.includes('test');
    });
    
    if (missingVars.length > 0) {
      throw new Error(`Invalid production configuration. Missing or invalid variables: ${missingVars.join(', ')}`);
    }
    
    // Validate Firebase project ID is production
    const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
    if (projectId && (projectId.includes('demo') || projectId.includes('test'))) {
      throw new Error('Demo or test project ID detected in production build');
    }
    
    console.log('✅ Production environment validated');
  }
};

// Runtime check to ensure we're using production Firebase
export const validateFirebaseProduction = () => {
  const isProduction = import.meta.env.PROD || import.meta.env.VITE_ENV === 'production';
  
  if (isProduction) {
    // Check if any Firebase service is trying to connect to development servers
    const checkFirebaseUrls = () => {
      // Monitor network requests for development connections
      const originalFetch = window.fetch;
      
      window.fetch = async (...args) => {
        const url = typeof args[0] === 'string' ? args[0] : 
                   args[0] instanceof Request ? args[0].url : 
                   args[0] instanceof URL ? args[0].toString() : 
                   String(args[0]);
        
        // Block development patterns
        const isDevelopmentUrl = url.includes('127.0.0.1') || 
                                url.match(/:[8-9][0-9]{3}/) || // ports 8000-9999
                                url.includes('dev') ||
                                url.includes('test');
        
        if (isDevelopmentUrl) {
          console.error('🚨 Blocked Firebase development server connection attempt:', url);
          throw new Error('Firebase development server connections are blocked in production');
        }
        
        return originalFetch(...args);
      };
    };
    
    // Apply the fetch override
    checkFirebaseUrls();
    
    console.log('🛡️ Firebase production guard activated');
  }
};

// Initialize all production guards
export const initializeProductionGuards = () => {
  try {
    validateProductionEnvironment();
    blockDevelopmentConnections();
    validateFirebaseProduction();
    console.log('🔒 All production guards initialized successfully');
  } catch (error) {
    console.error('❌ Production guard initialization failed:', error);
    throw error;
  }
};