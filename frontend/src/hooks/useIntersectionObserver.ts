import { useEffect, useRef, useState } from 'react';

interface UseIntersectionObserverOptions {
  threshold?: number | number[];
  rootMargin?: string;
  triggerOnce?: boolean;
}

export function useIntersectionObserver({
  threshold = 0.1,
  rootMargin = '0px',
  triggerOnce = true,
}: UseIntersectionObserverOptions = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const targetRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = targetRef.current;
    if (!element) return;

    // Don't observe if already triggered and triggerOnce is true
    if (hasTriggered && triggerOnce) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isCurrentlyIntersecting = entry.isIntersecting;
        setIsIntersecting(isCurrentlyIntersecting);

        if (isCurrentlyIntersecting && triggerOnce) {
          setHasTriggered(true);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, triggerOnce, hasTriggered]);

  return { ref: targetRef, isIntersecting, hasTriggered };
}

// Lazy loading component wrapper
export function LazyComponent({
  children,
  fallback = null,
  ...observerOptions
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
} & UseIntersectionObserverOptions) {
  const { ref, isIntersecting, hasTriggered } = useIntersectionObserver(observerOptions);
  
  const shouldRender = isIntersecting || hasTriggered;

  return React.createElement('div', { ref }, shouldRender ? children : fallback);
}