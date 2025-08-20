// React Scheduler Polyfill for Production Builds
// Ensures unstable_scheduleCallback is available when React scheduler fails to load

declare global {
  interface Window {
    MessageChannel: typeof MessageChannel;
  }
}

// Polyfill for React's unstable_scheduleCallback
export function createSchedulerPolyfill() {
  let taskQueue: Array<{ callback: () => void; expiration: number }> = [];
  let isRunning = false;

  function flushWork() {
    if (isRunning) return;
    isRunning = true;

    try {
      const currentTime = performance.now();
      
      while (taskQueue.length > 0) {
        const task = taskQueue.shift()!;
        if (task.expiration <= currentTime + 5) { // 5ms threshold
          task.callback();
        } else {
          taskQueue.unshift(task);
          break;
        }
      }
    } finally {
      isRunning = false;
      if (taskQueue.length > 0) {
        scheduleWork();
      }
    }
  }

  function scheduleWork() {
    if (typeof MessageChannel !== 'undefined') {
      const channel = new MessageChannel();
      channel.port1.onmessage = flushWork;
      channel.port2.postMessage(null);
    } else {
      setTimeout(flushWork, 0);
    }
  }

  return {
    unstable_scheduleCallback: (priority: number, callback: () => void, options?: { delay?: number }) => {
      const delay = options?.delay || 0;
      const expiration = performance.now() + delay;
      
      taskQueue.push({ callback, expiration });
      taskQueue.sort((a, b) => a.expiration - b.expiration);
      
      if (!isRunning) {
        scheduleWork();
      }
      
      return { callback, expiration };
    },
    
    unstable_cancelCallback: (task: any) => {
      const index = taskQueue.findIndex(t => t === task);
      if (index !== -1) {
        taskQueue.splice(index, 1);
      }
    },
    
    unstable_getCurrentPriorityLevel: () => 3, // Normal priority
    
    unstable_shouldYield: () => false,
    
    unstable_now: () => performance.now(),
  };
}

// Enhanced scheduler initialization with multiple fallback strategies
export function ensureScheduler() {
  try {
    // Strategy 1: Check if React internals provide scheduler
    if (typeof window !== 'undefined' && (window as any).React) {
      const reactInternals = (window as any).React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
      if (reactInternals && reactInternals.Scheduler && reactInternals.Scheduler.unstable_scheduleCallback) {
        console.log('Using React internals scheduler');
        return reactInternals.Scheduler;
      }
    }
    
    // Strategy 2: Check if scheduler module is available globally
    if (typeof window !== 'undefined' && (window as any).Scheduler) {
      console.log('Using global scheduler');
      return (window as any).Scheduler;
    }
    
    // Strategy 3: Try to access scheduler from global React
    if (typeof globalThis !== 'undefined' && (globalThis as any).React) {
      const internals = (globalThis as any).React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
      if (internals && internals.Scheduler) {
        console.log('Using globalThis React scheduler');
        return internals.Scheduler;
      }
    }
    
    // Strategy 4: Check if scheduler was loaded in React vendor bundle
    if (typeof window !== 'undefined' && (window as any).__REACT_SCHEDULER__) {
      console.log('Using vendor bundle scheduler');
      return (window as any).__REACT_SCHEDULER__;
    }
    
    // All strategies failed, use polyfill
    throw new Error('React scheduler not found in any location');
    
  } catch (error) {
    console.warn('React scheduler not available, initializing polyfill:', error.message);
    const polyfill = createSchedulerPolyfill();
    
    // Make polyfill globally available for other modules
    if (typeof window !== 'undefined') {
      (window as any).Scheduler = polyfill;
      (window as any).__REACT_SCHEDULER__ = polyfill;
    }
    
    // Also set on globalThis for broader compatibility
    if (typeof globalThis !== 'undefined') {
      (globalThis as any).Scheduler = polyfill;
    }
    
    console.log('Scheduler polyfill initialized successfully');
    return polyfill;
  }
}