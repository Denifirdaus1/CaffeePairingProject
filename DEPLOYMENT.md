# Environment Variables untuk Vercel Deployment

## Setup di Vercel Dashboard:

1. Login ke [Vercel Dashboard](https://vercel.com/dashboard)
2. Pilih project Anda
3. Go ke Settings > Environment Variables
4. Tambahkan variables berikut:

### Production Environment:
- **VITE_GEMINI_API_KEY**: `your_gemini_api_key_here`
- **VITE_SUPABASE_URL**: `your_supabase_project_url_here`
- **VITE_SUPABASE_ANON_KEY**: `your_supabase_anon_key_here`

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
