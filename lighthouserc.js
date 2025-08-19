module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:4173/',
        'http://localhost:4173/login',
        'http://localhost:4173/assessments',
        'http://localhost:4173/dashboard',
        'http://localhost:4173/results',
        'http://localhost:4173/admin',
        'http://localhost:4173/assessment/take/sample-id'
      ],
      startServerCommand: 'npm run preview',
      startServerReadyPattern: 'Local:',
      numberOfRuns: 5,
      settings: {
        preset: 'desktop',
        chromeFlags: '--no-sandbox --headless --disable-gpu --disable-dev-shm-usage',
        emulatedFormFactor: 'desktop',
        throttling: {
          rttMs: 40,
          throughputKbps: 10000,
          cpuSlowdownMultiplier: 1,
          requestLatencyMs: 0,
          downloadThroughputKbps: 0,
          uploadThroughputKbps: 0,
        },
        budgets: [
          {
            resourceType: 'script',
            budget: 400000, // 400KB
          },
          {
            resourceType: 'stylesheet',
            budget: 50000, // 50KB
          },
          {
            resourceType: 'image',
            budget: 200000, // 200KB
          },
          {
            resourceType: 'font',
            budget: 100000, // 100KB
          },
          {
            resourceType: 'document',
            budget: 50000, // 50KB
          },
          {
            resourceType: 'total',
            budget: 1000000, // 1MB total
          }
        ]
      },
    },
    assert: {
      assertions: {
        // Performance thresholds
        'categories:performance': ['error', {minScore: 0.9}],
        'categories:accessibility': ['error', {minScore: 0.95}],
        'categories:best-practices': ['error', {minScore: 0.95}],
        'categories:seo': ['error', {minScore: 0.9}],
        'categories:pwa': ['warn', {minScore: 0.9}],
        
        // Core Web Vitals
        'largest-contentful-paint': ['error', {maxNumericValue: 2500}],
        'first-input-delay': ['error', {maxNumericValue: 100}],
        'cumulative-layout-shift': ['error', {maxNumericValue: 0.1}],
        
        // Other performance metrics
        'first-contentful-paint': ['warn', {maxNumericValue: 1800}],
        'speed-index': ['warn', {maxNumericValue: 3000}],
        'time-to-interactive': ['warn', {maxNumericValue: 3800}],
        'total-blocking-time': ['error', {maxNumericValue: 300}],
        
        // Resource budgets
        'resource-summary:script:size': ['error', {maxNumericValue: 400000}],
        'resource-summary:stylesheet:size': ['error', {maxNumericValue: 50000}],
        'resource-summary:image:size': ['warn', {maxNumericValue: 200000}],
        'resource-summary:font:size': ['warn', {maxNumericValue: 100000}],
        'resource-summary:total:size': ['warn', {maxNumericValue: 1000000}],
        
        // Audit specific checks
        'unused-css-rules': ['warn', {maxLength: 0}],
        'unused-javascript': ['warn', {maxLength: 0}],
        'efficient-animated-content': ['error', {minScore: 1}],
        'offscreen-images': ['error', {maxLength: 0}],
        'render-blocking-resources': ['warn', {maxLength: 1}],
        'unminified-css': ['error', {maxLength: 0}],
        'unminified-javascript': ['error', {maxLength: 0}],
        'uses-optimized-images': ['warn', {minScore: 0.9}],
        'uses-text-compression': ['error', {minScore: 1}],
        'uses-responsive-images': ['warn', {minScore: 0.8}],
        
        // Progressive Web App
        'installable-manifest': ['error', {minScore: 1}],
        'service-worker': ['error', {minScore: 1}],
        'works-offline': ['warn', {minScore: 1}],
        'apple-touch-icon': ['warn', {minScore: 1}],
      },
    },
    upload: {
      target: 'temporary-public-storage',
      outputDir: './lighthouse-reports',
      reportFilenamePattern: '%%PATHNAME%%-%%DATETIME%%-report.%%EXTENSION%%'
    },
  },
};