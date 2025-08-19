import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Enable React Fast Refresh
      fastRefresh: true,
    }),
    // Bundle analyzer plugin
    visualizer({
      filename: 'dist/bundle-analyzer.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
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
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Vendor chunk for core React libs
          if (id.includes('node_modules/react') || 
              id.includes('node_modules/react-dom') || 
              id.includes('node_modules/react-router-dom')) {
            return 'vendor-react';
          }
          
          // Firebase chunk
          if (id.includes('firebase')) {
            return 'vendor-firebase';
          }
          
          // MUI chunk
          if (id.includes('@mui') || id.includes('@emotion')) {
            return 'vendor-mui';
          }
          
          // Monaco Editor chunk (large)
          if (id.includes('monaco-editor') || id.includes('@monaco-editor')) {
            return 'vendor-monaco';
          }
          
          // Charts chunk
          if (id.includes('recharts') || id.includes('d3-')) {
            return 'vendor-charts';
          }
          
          // Form handling
          if (id.includes('react-hook-form') || 
              id.includes('@hookform') || 
              id.includes('zod')) {
            return 'vendor-forms';
          }
          
          // Other large third-party libraries
          if (id.includes('node_modules')) {
            return 'vendor-misc';
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
    },
    // Performance optimizations
    chunkSizeWarningLimit: 1000, // 1MB warning
  },
  define: {
    'process.env': {},
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@mui/material',
      '@mui/icons-material',
      'firebase/app',
      'firebase/auth',
      'firebase/firestore',
    ],
    exclude: [
      '@monaco-editor/react', // Lazy load Monaco
    ],
  },
});