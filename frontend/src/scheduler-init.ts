/**
 * React Scheduler Initialization Strategy
 * Ensures React 18 scheduler is properly available before app initialization
 */

// Global scheduler availability flag
declare global {
  interface Window {
    __REACT_SCHEDULER_READY__: boolean;
    __SCHEDULER_POLYFILL__?: any;
  }
}

/**
 * Enhanced scheduler polyfill with React 18 compatibility
 */
function createReactSchedulerPolyfill() {
  const messageChannel = typeof MessageChannel !== 'undefined' ? new MessageChannel() : null;
  let isMessageLoopRunning = false;
  let scheduledCallback: (() => void) | null = null;
  let taskTimeoutID = -1;

  function flushWork() {
    if (scheduledCallback !== null) {
      const currentTime = performance.now();
      const callback = scheduledCallback;
      scheduledCallback = null;
      
      try {
        callback();
      } catch (error) {
        // Re-throw error but don't break the scheduler
        setTimeout(() => { throw error; }, 0);
      }
    }
    isMessageLoopRunning = false;
  }

  function requestHostCallback(callback: () => void) {
    scheduledCallback = callback;
    
    if (!isMessageLoopRunning) {
      isMessageLoopRunning = true;
      
      if (messageChannel) {
        messageChannel.port2.postMessage(null);
      } else {
        // Fallback for environments without MessageChannel
        taskTimeoutID = setTimeout(flushWork, 0) as any;
      }
    }
  }

  function cancelHostCallback() {
    scheduledCallback = null;
    isMessageLoopRunning = false;
    
    if (taskTimeoutID !== -1) {
      clearTimeout(taskTimeoutID);
      taskTimeoutID = -1;
    }
  }

  // Set up message channel if available
  if (messageChannel) {
    messageChannel.port1.onmessage = flushWork;
  }

  // React scheduler API compatible polyfill
  return {
    unstable_scheduleCallback(priorityLevel: number, callback: () => void, options?: { delay?: number }) {
      const currentTime = performance.now();
      const delay = options?.delay || 0;
      const timeout = delay + currentTime;

      const task = {
        id: Math.random(),
        callback,
        priorityLevel,
        startTime: currentTime,
        expirationTime: timeout + 5000, // 5 second timeout
        sortIndex: timeout,
      };

      if (delay > 0) {
        // Delayed task
        setTimeout(() => requestHostCallback(callback), delay);
      } else {
        // Immediate task
        requestHostCallback(callback);
      }

      return task;
    },

    unstable_cancelCallback(task: any) {
      if (task && task.callback === scheduledCallback) {
        cancelHostCallback();
      }
    },

    unstable_getCurrentPriorityLevel() {
      return 3; // Normal priority
    },

    unstable_shouldYield() {
      return false; // Never yield for simplicity
    },

    unstable_now() {
      return performance.now();
    },

    unstable_forceFrameRate() {
      // No-op for polyfill
    },

    // React 18 specific APIs
    unstable_requestPaint() {
      // No-op for polyfill
    },

    unstable_continueExecution() {
      // No-op for polyfill
    },

    unstable_pauseExecution() {
      // No-op for polyfill
    },

    unstable_getFirstCallbackNode() {
      return null;
    },
  };
}

/**
 * Initialize React scheduler with fallback strategy
 */
export async function initializeReactScheduler(): Promise<void> {
  // Skip if already initialized
  if (typeof window !== 'undefined' && window.__REACT_SCHEDULER_READY__) {
    return;
  }

  try {
    // Strategy 1: Try to access React's internal scheduler
    if (typeof globalThis !== 'undefined') {
      const react = (globalThis as any).React;
      if (react && react.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED) {
        const internals = react.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
        if (internals.Scheduler) {
          console.log('✅ React scheduler found in internals');
          if (typeof window !== 'undefined') {
            window.__REACT_SCHEDULER_READY__ = true;
          }
          return;
        }
      }
    }

    // Strategy 2: Try dynamic import of scheduler
    try {
      // @ts-ignore - scheduler module doesn't have TypeScript declarations
      const schedulerModule = await import('scheduler') as any;
      if (schedulerModule && schedulerModule.unstable_scheduleCallback) {
        console.log('✅ React scheduler loaded via dynamic import');
        if (typeof window !== 'undefined') {
          window.__REACT_SCHEDULER_READY__ = true;
        }
        return;
      }
    } catch (importError) {
      console.warn('⚠️ Could not import scheduler module:', importError);
    }

    // Strategy 3: Use polyfill
    console.warn('🔄 Using React scheduler polyfill');
    const polyfill = createReactSchedulerPolyfill();
    
    // Make polyfill globally available
    if (typeof window !== 'undefined') {
      window.__SCHEDULER_POLYFILL__ = polyfill;
      window.__REACT_SCHEDULER_READY__ = true;
    }
    
    // Also make it available on global scope for React to find
    if (typeof globalThis !== 'undefined') {
      (globalThis as any).Scheduler = polyfill;
    }

  } catch (error) {
    console.error('❌ Failed to initialize React scheduler:', error);
    
    // Last resort: basic polyfill
    const basicPolyfill = {
      unstable_scheduleCallback: (priority: number, callback: () => void) => {
        setTimeout(callback, 0);
        return { callback };
      },
      unstable_cancelCallback: () => {},
      unstable_getCurrentPriorityLevel: () => 3,
      unstable_shouldYield: () => false,
      unstable_now: () => performance.now(),
    };

    if (typeof window !== 'undefined') {
      window.__SCHEDULER_POLYFILL__ = basicPolyfill;
      window.__REACT_SCHEDULER_READY__ = true;
    }
    
    if (typeof globalThis !== 'undefined') {
      (globalThis as any).Scheduler = basicPolyfill;
    }
  }
}

/**
 * Preload React scheduler before React initialization
 */
export function preloadScheduler(): Promise<void> {
  return new Promise((resolve) => {
    // Use requestIdleCallback if available for non-blocking initialization
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(async () => {
        await initializeReactScheduler();
        resolve();
      });
    } else {
      // Fallback to setTimeout
      setTimeout(async () => {
        await initializeReactScheduler();
        resolve();
      }, 0);
    }
  });
}

/**
 * Verify scheduler is ready for React
 */
export function isSchedulerReady(): boolean {
  if (typeof window !== 'undefined' && window.__REACT_SCHEDULER_READY__) {
    return true;
  }
  
  // Check if React scheduler is available
  try {
    if (typeof globalThis !== 'undefined') {
      const react = (globalThis as any).React;
      if (react && react.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED) {
        const internals = react.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
        return !!internals.Scheduler;
      }
    }
  } catch {
    // Ignore errors
  }
  
  return false;
}