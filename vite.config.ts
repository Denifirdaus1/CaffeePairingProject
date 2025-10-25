import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // Try to load environment variables from file first
    const envFromFile = loadEnv(mode, '.', '');
    
    // Fallback to hardcoded values if environment variables are not loaded
    const env = {
        VITE_GEMINI_API_KEY: envFromFile.VITE_GEMINI_API_KEY || 'AIzaSyBqEXLaxl6AqUZcY5qLxFPDaX77Wt8swyc',
        VITE_SUPABASE_URL: envFromFile.VITE_SUPABASE_URL || 'https://jjbvliewmcadmxmmcckl.supabase.co',
        VITE_SUPABASE_ANON_KEY: envFromFile.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqYnZsaWV3bWNhZG14bW1jY2tsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyODI1NDMsImV4cCI6MjA3Njg1ODU0M30._5DeurOWNpd08Iq-5hEqh4j2Nsout2AzpRpea8hcaQY'
    };
    
    console.log('Environment variables loaded:', {
        VITE_GEMINI_API_KEY: env.VITE_GEMINI_API_KEY ? 'SET' : 'NOT SET',
        VITE_SUPABASE_URL: env.VITE_SUPABASE_URL ? 'SET' : 'NOT SET',
        VITE_SUPABASE_ANON_KEY: env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET',
        source: envFromFile.VITE_GEMINI_API_KEY ? 'from file' : 'hardcoded fallback'
    });
    
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        historyApiFallback: true
      },
      plugins: [react()],
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              vendor: ['react', 'react-dom'],
              supabase: ['@supabase/supabase-js'],
              gemini: ['@google/genai'],
              utils: ['jspdf', 'html2canvas']
            }
          }
        },
        chunkSizeWarningLimit: 1000
      },
      define: {
        'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
        'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
        'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
        'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
        'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
        'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
