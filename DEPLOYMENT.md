# Environment Variables untuk Vercel Deployment

## Setup di Vercel Dashboard:

1. Login ke [Vercel Dashboard](https://vercel.com/dashboard)
2. Pilih project Anda
3. Go ke Settings > Environment Variables
4. Tambahkan variables berikut:

### Production Environment:
- **VITE_GEMINI_API_KEY**: `AIzaSyBqEXLaxl6AqUZcY5qLxFPDaX77Wt8swyc`
- **VITE_SUPABASE_URL**: `https://jjbvliewmcadmxmmcckl.supabase.co`
- **VITE_SUPABASE_ANON_KEY**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqYnZsaWV3bWNhZG14bW1jY2tsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyODI1NDMsImV4cCI6MjA3Njg1ODU0M30._5DeurOWNpd08Iq-5hEqh4j2Nsout2AzpRpea8hcaQY`

### Preview Environment (optional):
- Copy same values untuk preview deployments

## Deployment Steps:

1. **Push ke GitHub:**
   ```bash
   git add .
   git commit -m "Setup environment variables and deployment config"
   git push origin main
   ```

2. **Connect ke Vercel:**
   - Import project dari GitHub repository
   - Vercel akan auto-detect Vite framework
   - Deploy akan otomatis trigger

3. **Verify Deployment:**
   - Check build logs di Vercel dashboard
   - Test aplikasi di production URL

## Troubleshooting:

- **Build Error**: Pastikan semua environment variables sudah di-set
- **Runtime Error**: Check browser console untuk API connection issues
- **CORS Error**: Supabase sudah configured untuk allow Vercel domains
