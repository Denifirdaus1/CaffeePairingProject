import path from 'path';
import { existsSync } from 'fs';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // Load environment variables from file
    // Third parameter 'VITE_' filters only variables that start with VITE_
    // This is important: loadEnv with prefix filter ensures only Vite variables are loaded
    const envFromFile = loadEnv(mode || 'development', process.cwd(), 'VITE_');
    
    // Log for debugging
    console.log('\n=== Environment Variables Debug ===');
    console.log('Mode:', mode || 'development');
    console.log('CWD:', process.cwd());
    console.log('File .env.local exists:', existsSync('.env.local'));
    console.log('Loaded env keys:', Object.keys(envFromFile).filter(k => k.startsWith('VITE_')));
    
    // Extract env variables with fallback
    const env = {
        VITE_GEMINI_API_KEY: envFromFile.VITE_GEMINI_API_KEY || '',
        VITE_SUPABASE_URL: envFromFile.VITE_SUPABASE_URL || '',
        VITE_SUPABASE_ANON_KEY: envFromFile.VITE_SUPABASE_ANON_KEY || '',
        VITE_GOOGLE_MAPS_API_KEY: envFromFile.VITE_GOOGLE_MAPS_API_KEY || ''
    };
    
    console.log('\nEnvironment variables status:', {
        VITE_GEMINI_API_KEY: env.VITE_GEMINI_API_KEY ? 'SET' : 'NOT SET',
        VITE_SUPABASE_URL: env.VITE_SUPABASE_URL ? 'SET' : 'NOT SET',
        VITE_SUPABASE_ANON_KEY: env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET',
        VITE_GOOGLE_MAPS_API_KEY: env.VITE_GOOGLE_MAPS_API_KEY ? 'SET' : 'NOT SET',
        source: envFromFile.VITE_GEMINI_API_KEY ? 'from file' : 'hardcoded fallback'
    });
    console.log('=====================================\n');
    
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        historyApiFallback: true
      },
      plugins: [react()],
      build: {
        target: 'es2015',
        minify: 'esbuild',
        rollupOptions: {
          output: {
            manualChunks: (id) => {
              if (id.includes('node_modules')) {
                if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
                  return 'react-vendor';
                }
                if (id.includes('@supabase')) {
                  return 'supabase';
                }
                if (id.includes('@google/genai')) {
                  return 'ai';
                }
                if (id.includes('jspdf') || id.includes('html2canvas')) {
                  return 'pdf-utils';
                }
                return 'vendor';
              }
            },
            chunkFileNames: 'assets/[name]-[hash].js',
            entryFileNames: 'assets/[name]-[hash].js',
            assetFileNames: 'assets/[name]-[hash].[ext]',
          }
        },
        chunkSizeWarningLimit: 600,
        cssCodeSplit: true,
        sourcemap: false,
        reportCompressedSize: false,
        assetsInlineLimit: 4096,
      },
      define: {
        'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
        'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
        'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
        'process.env.VITE_GOOGLE_MAPS_API_KEY': JSON.stringify(env.VITE_GOOGLE_MAPS_API_KEY),
        'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
        'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
        'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
        'import.meta.env.VITE_GOOGLE_MAPS_API_KEY': JSON.stringify(env.VITE_GOOGLE_MAPS_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
