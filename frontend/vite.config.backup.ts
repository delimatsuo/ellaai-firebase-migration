import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
// import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Enable React Fast Refresh
      fastRefresh: true,
    }),
    // Bundle analyzer plugin
    // visualizer({
    //   filename: 'dist/bundle-analyzer.html',
    //   open: false,
    //   gzipSize: true,
    //   brotliSize: true,
    // }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      // Ensure consistent React scheduler resolution
      'scheduler/tracing': 'scheduler/tracing-profiling',
    },
    // Force single versions of React ecosystem
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
    sourcemap: process.env.NODE_ENV === 'development',
    minify: 'esbuild',
    target: 'es2020',
    cssCodeSplit: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          // CRITICAL FIX: Unified React bundle to prevent scheduler initialization issues
          // Keep ALL React-related dependencies together to avoid cross-chunk scheduler access
          if (id.includes('node_modules/react') || 
              id.includes('node_modules/scheduler') ||
              id.includes('node_modules/react-dom') ||
              id.includes('node_modules/react-router') ||
              id.includes('node_modules/react-hook-form') ||
              id.includes('node_modules/react-hot-toast') ||
              id.includes('node_modules/react-query') ||
              id.includes('node_modules/react-dropzone') ||
              id.includes('node_modules/react-beautiful-dnd') ||
              id.includes('node_modules/react-quill')) {
            return 'react-unified';
          }
          
          // Firebase chunk
          if (id.includes('firebase')) {
            return 'firebase-vendor';
          }
          
          // MUI and styling libs
          if (id.includes('@mui') || 
              id.includes('@emotion') ||
              id.includes('node_modules/@floating-ui') ||
              id.includes('node_modules/react-transition-group')) {
            return 'mui-vendor';
          }
          
          // Monaco Editor chunk (large)
          if (id.includes('monaco-editor') || id.includes('@monaco-editor')) {
            return 'monaco-vendor';
          }
          
          // Charts and visualization
          if (id.includes('recharts') || id.includes('d3-') || id.includes('node_modules/react-smooth')) {
            return 'charts-vendor';
          }
          
          // Form validation
          if (id.includes('@hookform') || id.includes('zod')) {
            return 'forms-vendor';
          }
          
          // State management
          if (id.includes('zustand')) {
            return 'state-vendor';
          }
          
          // Other utilities
          if (id.includes('node_modules/axios') ||
              id.includes('node_modules/date-fns') ||
              id.includes('node_modules/papaparse')) {
            return 'utils-vendor';
          }
          
          // Remaining node_modules
          if (id.includes('node_modules')) {
            return 'other-vendor';
          }
        },
        // Optimize chunk sizes
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split('/').pop()
            : 'chunk';
          return `assets/js/[name]-[hash].js`;
        },
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
      },
      // Critical: Ensure proper module resolution order
      external: (id) => {
        // Never externalize React core modules in browser builds
        return false;
      },
    },
    // Performance optimizations
    chunkSizeWarningLimit: 1000, // 1MB warning
  },
  define: {
    'process.env': {},
    // Ensure NODE_ENV is properly defined for scheduler
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
  },
  // Optimize dependencies - critical for React scheduler
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'react/jsx-runtime',
      'scheduler',
      'scheduler/tracing',
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
    exclude: [
      '@monaco-editor/react', // Lazy load Monaco
    ],
    // Force single instance of React ecosystem
    dedupe: ['react', 'react-dom', 'scheduler'],
    // Force pre-bundling of scheduler to prevent runtime issues
    force: true,
    // Ensure consistent variable naming in production
    esbuildOptions: {
      keepNames: true,
      minifyIdentifiers: false
    }
  },
});