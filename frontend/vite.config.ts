import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Enable React Fast Refresh with scheduler compatibility
      fastRefresh: true,
      // Use automatic JSX runtime for React 18
      jsxRuntime: 'automatic',
      // Ensure proper JSX transformation
      jsxImportSource: 'react'
    }),
    // Bundle analyzer plugin for development
    process.env.ANALYZE && visualizer({
      filename: 'dist/bundle-analyzer.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
      template: 'treemap',
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      // Critical: Ensure consistent React scheduler resolution
      'scheduler/tracing': 'scheduler/tracing-profiling',
      // Resolve scheduler directly to prevent module resolution issues
      'scheduler': 'scheduler',
    },
    // Force single versions of React ecosystem to prevent scheduler conflicts
    dedupe: ['react', 'react-dom', 'scheduler'],
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/ellaai-455922/us-central1/api'),
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    target: 'es2020',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    cssCodeSplit: true,
    // Critical: Enable module preload for better performance
    modulePreload: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      // Critical: Prevent external dependencies in browser builds
      external: [],
      
      output: {
        // Optimized manual chunking for React scheduler compatibility
        manualChunks: {
          // Core React bundle - keep together for scheduler compatibility
          'react-core': [
            'react',
            'react-dom',
            'react-dom/client',
            'react/jsx-runtime',
            'scheduler'
          ],
          
          // React ecosystem
          'react-libs': [
            'react-router-dom',
            'react-hook-form',
            '@hookform/resolvers',
            'react-hot-toast',
            'react-query',
            'react-dropzone',
            'react-beautiful-dnd',
            'react-quill'
          ],
          
          // Firebase bundle
          'firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          
          // MUI and styling
          'mui': [
            '@mui/material',
            '@mui/icons-material',
            '@mui/lab',
            '@mui/x-data-grid',
            '@mui/x-date-pickers',
            '@emotion/react',
            '@emotion/styled'
          ],
          
          // Charts and visualization
          'charts': ['recharts', 'framer-motion'],
          
          // Form validation and utilities
          'utils': [
            'zod',
            'axios',
            'date-fns',
            'papaparse',
            'zustand'
          ],
          
          // Monaco Editor (large, load separately)
          'monaco': ['monaco-editor', '@monaco-editor/react']
        },
        
        // Optimize chunk file names for caching
        chunkFileNames: (chunkInfo) => {
          return `assets/js/[name]-[hash].js`;
        },
        
        // Optimize asset file names
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/\.(png|jpe?g|gif|svg|webp|avif)$/i.test(assetInfo.name)) {
            return 'assets/images/[name]-[hash][extname]';
          }
          if (/\.(css)$/i.test(assetInfo.name)) {
            return 'assets/css/[name]-[hash][extname]';
          }
          if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name)) {
            return 'assets/fonts/[name]-[hash][extname]';
          }
          return `assets/[ext]/[name]-[hash][extname]`;
        },
        
        // Entry file naming
        entryFileNames: 'assets/js/[name]-[hash].js',
      },
    },
    // Performance optimization settings
    chunkSizeWarningLimit: 500, // Reduced from 1000KB to 500KB
    reportCompressedSize: true,
  },
  
  define: {
    'process.env': {},
    // Critical: Ensure NODE_ENV is properly defined for React scheduler
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
    // Global flag for scheduler polyfill
    __SCHEDULER_POLYFILL_ENABLED__: JSON.stringify(true),
    // Ensure jsxDEV is available in production
    'import.meta.env.DEV': JSON.stringify(false),
    'import.meta.env.PROD': JSON.stringify(true),
  },
  
  // Critical optimization for React scheduler compatibility
  optimizeDeps: {
    // Include React core modules for proper pre-bundling
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'react/jsx-runtime',
      'scheduler',
      'react-router-dom',
      '@mui/material',
      '@mui/icons-material',
      '@emotion/react',
      '@emotion/styled',
      'firebase/app',
      'firebase/auth',
      'firebase/firestore',
      'react-hot-toast',
    ],
    
    // Exclude large modules for lazy loading
    exclude: [
      '@monaco-editor/react',
      'monaco-editor',
    ],
    
    // Force single instance of React ecosystem
    dedupe: ['react', 'react-dom', 'scheduler'],
    
    // Force pre-bundling to prevent runtime module resolution issues
    force: true,
    
    // Optimizer options for better scheduler handling
    esbuildOptions: {
      // Preserve React scheduler exports
      keepNames: true,
      // Target modern browsers for better performance
      target: 'es2020',
    },
  },
  
  // Enhanced SSR handling for better compatibility
  ssr: {
    // Externalize scheduler for SSR
    external: process.env.NODE_ENV === 'production' ? [] : ['scheduler'],
    
    // No external dependencies for browser builds
    noExternal: process.env.NODE_ENV === 'production' ? true : false,
  },
});