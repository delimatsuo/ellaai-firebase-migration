/**
 * Block all WebSocket connections to localhost in production
 * This prevents Firebase SDK from attempting emulator connections
 */

export function blockLocalhostConnections() {
  // Only block in production
  if (import.meta.env.PROD || import.meta.env.MODE === 'production') {
    // Override WebSocket constructor
    const OriginalWebSocket = window.WebSocket;
    
    window.WebSocket = function(url: string | URL, protocols?: string | string[]) {
      const urlString = typeof url === 'string' ? url : url.toString();
      
      // Block any localhost or local IP connections
      if (
        urlString.includes('localhost') ||
        urlString.includes('127.0.0.1') ||
        urlString.includes('0.0.0.0') ||
        urlString.includes('[::1]') ||
        urlString.includes('192.168.') ||
        urlString.includes('10.0.') ||
        urlString.includes(':8080') ||
        urlString.includes(':9099') ||
        urlString.includes(':5001') ||
        urlString.includes(':9199')
      ) {
        console.warn('Blocked WebSocket connection to local address:', urlString);
        // Return a mock WebSocket that immediately closes
        const mockWs = new OriginalWebSocket('wss://echo.websocket.org/');
        setTimeout(() => mockWs.close(), 0);
        return mockWs;
      }
      
      // Allow non-localhost connections
      return new OriginalWebSocket(url, protocols);
    } as any;
    
    // Also block XMLHttpRequest to localhost
    const OriginalXHR = window.XMLHttpRequest;
    const originalOpen = OriginalXHR.prototype.open;
    
    OriginalXHR.prototype.open = function(
      method: string,
      url: string | URL,
      async?: boolean,
      username?: string | null,
      password?: string | null
    ) {
      const urlString = typeof url === 'string' ? url : url.toString();
      
      if (
        urlString.includes('localhost') ||
        urlString.includes('127.0.0.1') ||
        urlString.includes('0.0.0.0')
      ) {
        console.warn('Blocked XHR request to local address:', urlString);
        // Change to a safe URL that will 404
        return originalOpen.call(this, method, '/api/blocked', async, username, password);
      }
      
      return originalOpen.call(this, method, url, async, username, password);
    };
    
    // Block fetch to localhost
    const originalFetch = window.fetch;
    window.fetch = function(input: RequestInfo | URL, init?: RequestInit) {
      const url = typeof input === 'string' 
        ? input 
        : input instanceof URL 
          ? input.toString() 
          : input.url;
      
      if (
        url.includes('localhost') ||
        url.includes('127.0.0.1') ||
        url.includes('0.0.0.0')
      ) {
        console.warn('Blocked fetch request to local address:', url);
        return Promise.reject(new Error('Localhost connections are blocked in production'));
      }
      
      return originalFetch(input, init);
    };
    
    console.log('✅ Localhost connection blocking enabled for production');
  }
}

// Auto-initialize on import
blockLocalhostConnections();