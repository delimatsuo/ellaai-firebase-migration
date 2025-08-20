// Service Worker registration and management

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '[::1]' ||
  window.location.hostname.match(
    /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
  )
);

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            // New version available
            console.log('New version available');
            showUpdateNotification(registration);
          } else {
            // First time install
            console.log('Service Worker installed');
            showInstallNotification();
          }
        }
      });
    });

    // Check for updates every 30 minutes
    setInterval(() => {
      registration.update();
    }, 30 * 60 * 1000);

    console.log('Service Worker registered successfully');
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
}

function showUpdateNotification(registration: ServiceWorkerRegistration) {
  // Create a custom notification or use a toast library
  const updateNotification = document.createElement('div');
  updateNotification.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      background: #2196F3;
      color: white;
      padding: 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 10000;
      max-width: 300px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    ">
      <div style="margin-bottom: 8px; font-weight: 600;">
        New version available!
      </div>
      <div style="margin-bottom: 12px; font-size: 14px; opacity: 0.9;">
        Click to update and get the latest features.
      </div>
      <div>
        <button id="sw-update-btn" style="
          background: white;
          color: #2196F3;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
          margin-right: 8px;
        ">
          Update
        </button>
        <button id="sw-dismiss-btn" style="
          background: transparent;
          color: white;
          border: 1px solid rgba(255,255,255,0.5);
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
        ">
          Later
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(updateNotification);

  const updateBtn = document.getElementById('sw-update-btn');
  const dismissBtn = document.getElementById('sw-dismiss-btn');

  updateBtn?.addEventListener('click', () => {
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
    document.body.removeChild(updateNotification);
  });

  dismissBtn?.addEventListener('click', () => {
    document.body.removeChild(updateNotification);
  });

  // Auto-dismiss after 10 seconds
  setTimeout(() => {
    if (updateNotification.parentNode) {
      document.body.removeChild(updateNotification);
    }
  }, 10000);
}

function showInstallNotification() {
  console.log('EllaAI is now available offline!');
  
  // Show a subtle notification
  const installNotification = document.createElement('div');
  installNotification.innerHTML = `
    <div style="
      position: fixed;
      bottom: 20px;
      left: 20px;
      background: #4CAF50;
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
    ">
      ✓ EllaAI is now available offline
    </div>
  `;

  document.body.appendChild(installNotification);

  // Auto-dismiss after 3 seconds
  setTimeout(() => {
    if (installNotification.parentNode) {
      installNotification.style.opacity = '0';
      installNotification.style.transform = 'translateY(20px)';
      installNotification.style.transition = 'all 0.3s ease';
      setTimeout(() => {
        if (installNotification.parentNode) {
          document.body.removeChild(installNotification);
        }
      }, 300);
    }
  }, 3000);
}

export async function getCacheStats() {
  if (!navigator.serviceWorker.controller) {
    return null;
  }

  return new Promise((resolve) => {
    const messageChannel = new MessageChannel();
    
    messageChannel.port1.onmessage = (event) => {
      resolve(event.data);
    };

    navigator.serviceWorker.controller.postMessage(
      { type: 'GET_CACHE_STATS' },
      [messageChannel.port2]
    );
  });
}

export async function clearServiceWorkerCache() {
  if (!('caches' in window)) {
    return false;
  }

  try {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );
    
    console.log('All caches cleared');
    return true;
  } catch (error) {
    console.error('Failed to clear caches:', error);
    return false;
  }
}

// PWA install prompt
let deferredPrompt: any = null;

window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();
  deferredPrompt = e;
  
  // Show custom install button
  showInstallButton();
});

function showInstallButton() {
  const installButton = document.createElement('button');
  installButton.innerHTML = '📱 Install EllaAI';
  installButton.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #2196F3;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 25px;
    box-shadow: 0 4px 12px rgba(33, 150, 243, 0.4);
    cursor: pointer;
    font-weight: 600;
    font-size: 14px;
    z-index: 9999;
    transition: all 0.3s ease;
  `;

  installButton.addEventListener('mouseenter', () => {
    installButton.style.transform = 'scale(1.05)';
    installButton.style.boxShadow = '0 6px 16px rgba(33, 150, 243, 0.6)';
  });

  installButton.addEventListener('mouseleave', () => {
    installButton.style.transform = 'scale(1)';
    installButton.style.boxShadow = '0 4px 12px rgba(33, 150, 243, 0.4)';
  });

  installButton.addEventListener('click', async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
    
    deferredPrompt = null;
    document.body.removeChild(installButton);
  });

  document.body.appendChild(installButton);

  // Auto-hide after 10 seconds
  setTimeout(() => {
    if (installButton.parentNode) {
      installButton.style.opacity = '0';
      installButton.style.transform = 'scale(0.8)';
      setTimeout(() => {
        if (installButton.parentNode) {
          document.body.removeChild(installButton);
        }
      }, 300);
    }
  }, 10000);
}

// Track PWA usage
window.addEventListener('appinstalled', () => {
  console.log('EllaAI PWA was installed');
  deferredPrompt = null;
  
  // Track installation in analytics
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'pwa_install', {
      event_category: 'engagement',
      event_label: 'PWA Installation'
    });
  }
});

// Handle online/offline status
window.addEventListener('online', () => {
  console.log('Back online');
  
  // Show online notification
  const onlineNotification = document.createElement('div');
  onlineNotification.innerHTML = '🌐 Back online';
  onlineNotification.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #4CAF50;
    color: white;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 600;
    z-index: 10000;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  `;
  
  document.body.appendChild(onlineNotification);
  setTimeout(() => {
    if (onlineNotification.parentNode) {
      onlineNotification.style.opacity = '0';
      onlineNotification.style.transform = 'translateX(-50%) translateY(-20px)';
      onlineNotification.style.transition = 'all 0.3s ease';
      setTimeout(() => {
        if (onlineNotification.parentNode) {
          document.body.removeChild(onlineNotification);
        }
      }, 300);
    }
  }, 2000);
});

window.addEventListener('offline', () => {
  console.log('Gone offline');
  
  // Show offline notification
  const offlineNotification = document.createElement('div');
  offlineNotification.innerHTML = '📡 You\'re offline - some features may be limited';
  offlineNotification.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #FF9800;
    color: white;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 600;
    z-index: 10000;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  `;
  
  document.body.appendChild(offlineNotification);
  setTimeout(() => {
    if (offlineNotification.parentNode) {
      offlineNotification.style.opacity = '0';
      offlineNotification.style.transform = 'translateX(-50%) translateY(-20px)';
      offlineNotification.style.transition = 'all 0.3s ease';
      setTimeout(() => {
        if (offlineNotification.parentNode) {
          document.body.removeChild(offlineNotification);
        }
      }, 300);
    }
  }, 5000);
});