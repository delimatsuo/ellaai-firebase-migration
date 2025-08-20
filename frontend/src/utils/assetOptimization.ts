import React from 'react';

// Asset optimization utilities

export class AssetOptimizer {
  private static imageCache: Map<string, string> = new Map();
  private static fontLoadPromises: Map<string, Promise<void>> = new Map();

  // Lazy load images with intersection observer
  static createLazyImage(src: string, alt: string, options: {
    className?: string;
    loading?: 'lazy' | 'eager';
    decoding?: 'async' | 'sync' | 'auto';
    sizes?: string;
    srcSet?: string;
    placeholder?: string;
  } = {}): HTMLImageElement {
    const img = document.createElement('img');
    
    // Set basic attributes
    img.alt = alt;
    img.className = options.className || '';
    img.loading = options.loading || 'lazy';
    img.decoding = options.decoding || 'async';
    
    if (options.sizes) img.sizes = options.sizes;
    if (options.srcSet) img.srcset = options.srcSet;
    
    // Use placeholder while loading
    if (options.placeholder) {
      img.src = options.placeholder;
      img.dataset.src = src;
      
      // Load actual image when in viewport
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            img.src = img.dataset.src!;
            observer.unobserve(img);
          }
        });
      });
      
      observer.observe(img);
    } else {
      img.src = src;
    }
    
    return img;
  }

  // Preload critical images
  static preloadImages(urls: string[]): Promise<void[]> {
    return Promise.all(
      urls.map(url => {
        if (this.imageCache.has(url)) {
          return Promise.resolve();
        }
        
        return new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            this.imageCache.set(url, url);
            resolve();
          };
          img.onerror = reject;
          img.src = url;
        });
      })
    );
  }

  // Generate responsive image URLs
  static generateResponsiveUrls(baseUrl: string, sizes: number[] = [320, 640, 960, 1280, 1920]): {
    srcSet: string;
    sizes: string;
  } {
    const srcSet = sizes
      .map(size => `${baseUrl}?w=${size}&q=75 ${size}w`)
      .join(', ');
    
    const sizeRules = [
      '(max-width: 320px) 320px',
      '(max-width: 640px) 640px',
      '(max-width: 960px) 960px',
      '(max-width: 1280px) 1280px',
      '1920px'
    ].join(', ');
    
    return {
      srcSet,
      sizes: sizeRules
    };
  }

  // Optimize font loading
  static preloadFont(fontFamily: string, url: string, format: string = 'woff2'): Promise<void> {
    const key = `${fontFamily}-${format}`;
    
    if (this.fontLoadPromises.has(key)) {
      return this.fontLoadPromises.get(key)!;
    }
    
    const promise = new Promise<void>((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'font';
      link.type = `font/${format}`;
      link.crossOrigin = 'anonymous';
      link.href = url;
      
      link.onload = () => resolve();
      link.onerror = () => reject(new Error(`Failed to load font: ${url}`));
      
      document.head.appendChild(link);
    });
    
    this.fontLoadPromises.set(key, promise);
    return promise;
  }

  // Critical CSS inlining
  static inlineCriticalCSS(css: string): void {
    const style = document.createElement('style');
    style.textContent = css;
    style.setAttribute('data-critical', 'true');
    document.head.appendChild(style);
  }

  // Load non-critical CSS asynchronously
  static loadNonCriticalCSS(href: string): void {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'style';
    link.href = href;
    link.onload = function() {
      this.onload = null;
      (this as HTMLLinkElement).rel = 'stylesheet';
    };
    document.head.appendChild(link);
  }

  // Resource hints
  static addResourceHints(urls: Array<{
    url: string;
    type: 'preload' | 'prefetch' | 'preconnect' | 'dns-prefetch';
    as?: string;
    crossOrigin?: boolean;
  }>): void {
    urls.forEach(({ url, type, as, crossOrigin }) => {
      const link = document.createElement('link');
      link.rel = type;
      link.href = url;
      
      if (as) link.as = as;
      if (crossOrigin) link.crossOrigin = 'anonymous';
      
      document.head.appendChild(link);
    });
  }

  // WebP image format detection and fallback
  static supportsWebP(): Promise<boolean> {
    return new Promise(resolve => {
      const webP = new Image();
      webP.onload = webP.onerror = () => {
        resolve(webP.height === 2);
      };
      webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    });
  }

  // Get optimized image URL based on device capabilities
  static async getOptimizedImageUrl(baseUrl: string, options: {
    width?: number;
    quality?: number;
    format?: 'auto' | 'webp' | 'jpeg' | 'png';
  } = {}): Promise<string> {
    const { width, quality = 75, format = 'auto' } = options;
    
    let optimizedUrl = baseUrl;
    const params = new URLSearchParams();
    
    if (width) params.set('w', width.toString());
    params.set('q', quality.toString());
    
    if (format === 'auto') {
      const supportsWebP = await this.supportsWebP();
      if (supportsWebP) {
        params.set('f', 'webp');
      }
    } else {
      params.set('f', format);
    }
    
    if (params.toString()) {
      optimizedUrl += `?${params.toString()}`;
    }
    
    return optimizedUrl;
  }

  // Measure and report asset loading performance
  static measureAssetPerformance(): {
    images: Array<{ name: string; size: number; loadTime: number }>;
    fonts: Array<{ name: string; loadTime: number }>;
    scripts: Array<{ name: string; size: number; loadTime: number }>;
    stylesheets: Array<{ name: string; size: number; loadTime: number }>;
  } {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    const categorizeResource = (entry: PerformanceResourceTiming) => {
      const url = entry.name;
      const size = entry.transferSize || 0;
      const loadTime = entry.responseEnd - entry.startTime;
      
      return {
        name: url.split('/').pop() || url,
        url,
        size,
        loadTime: Math.round(loadTime)
      };
    };
    
    return {
      images: resources
        .filter(entry => /\.(png|jpg|jpeg|gif|svg|webp|avif)(\?|$)/i.test(entry.name))
        .map(categorizeResource),
      
      fonts: resources
        .filter(entry => /\.(woff|woff2|ttf|eot)(\?|$)/i.test(entry.name))
        .map(categorizeResource),
      
      scripts: resources
        .filter(entry => /\.js(\?|$)/i.test(entry.name))
        .map(categorizeResource),
      
      stylesheets: resources
        .filter(entry => /\.css(\?|$)/i.test(entry.name))
        .map(categorizeResource)
    };
  }

  // Progressive image loading
  static createProgressiveImage(src: string, placeholder: string): HTMLElement {
    const container = document.createElement('div');
    container.style.position = 'relative';
    container.style.overflow = 'hidden';
    
    // Low-quality placeholder
    const placeholderImg = document.createElement('img');
    placeholderImg.src = placeholder;
    placeholderImg.style.width = '100%';
    placeholderImg.style.height = 'auto';
    placeholderImg.style.filter = 'blur(5px)';
    placeholderImg.style.transition = 'filter 0.3s ease';
    
    // High-quality image
    const mainImg = document.createElement('img');
    mainImg.style.position = 'absolute';
    mainImg.style.top = '0';
    mainImg.style.left = '0';
    mainImg.style.width = '100%';
    mainImg.style.height = '100%';
    mainImg.style.opacity = '0';
    mainImg.style.transition = 'opacity 0.3s ease';
    
    mainImg.onload = () => {
      mainImg.style.opacity = '1';
      placeholderImg.style.filter = 'blur(0px)';
    };
    
    mainImg.src = src;
    
    container.appendChild(placeholderImg);
    container.appendChild(mainImg);
    
    return container;
  }

  // Cleanup unused resources
  static cleanupUnusedResources(): void {
    // Remove unused preload links after they've served their purpose
    const preloadLinks = document.querySelectorAll('link[rel="preload"]');
    preloadLinks.forEach(link => {
      const href = link.getAttribute('href');
      const as = link.getAttribute('as');
      
      // Check if resource has been used
      if (as === 'image' && href) {
        const img = document.querySelector(`img[src="${href}"]`);
        if (!img) {
          link.remove();
        }
      }
      
      if (as === 'font' && href) {
        // Font cleanup logic would go here
        // Fonts are typically kept loaded
      }
    });
    
    // Clear image cache periodically
    if (this.imageCache.size > 100) {
      this.imageCache.clear();
    }
  }
}

// React hook for optimized image loading
export function useOptimizedImage(src: string, options: {
  width?: number;
  quality?: number;
  format?: 'auto' | 'webp' | 'jpeg' | 'png';
} = {}) {
  const [optimizedSrc, setOptimizedSrc] = React.useState<string>('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  
  React.useEffect(() => {
    AssetOptimizer.getOptimizedImageUrl(src, options)
      .then(url => {
        setOptimizedSrc(url);
        setIsLoading(false);
      })
      .catch(err => {
        setError(err);
        setIsLoading(false);
        // Fallback to original source
        setOptimizedSrc(src);
      });
  }, [src, options.width, options.quality, options.format]);
  
  return { src: optimizedSrc, isLoading, error };
}

// React component for progressive image loading
export function ProgressiveImage({ 
  src, 
  placeholder, 
  alt, 
  className = '',
  ...props 
}: {
  src: string;
  placeholder: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [imageLoaded, setImageLoaded] = React.useState(false);
  const [imageSrc, setImageSrc] = React.useState(placeholder);
  
  React.useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImageSrc(src);
      setImageLoaded(true);
    };
    img.src = src;
  }, [src]);
  
  return React.createElement('img', {
    src: imageSrc,
    alt: alt,
    className: className,
    style: {
      filter: imageLoaded ? 'none' : 'blur(5px)',
      transition: 'filter 0.3s ease',
      ...props.style
    },
    ...props
  });
}

export default AssetOptimizer;