# 🚀 Panduan Deployment ke Vercel

## ✅ GitHub Repository Sudah Siap!
Project Anda sudah berhasil di-push ke GitHub: [https://github.com/Denifirdaus1/CaffeePairingProject.git](https://github.com/Denifirdaus1/CaffeePairingProject.git)

## 🌐 Deployment ke Vercel

### Cara 1: Melalui Vercel Dashboard (Recommended)

1. **Login ke Vercel:**
   - Buka [https://vercel.com](https://vercel.com)
   - Login dengan akun GitHub Anda

2. **Import Project:**
   - Klik "New Project"
   - Pilih repository "CaffeePairingProject" dari GitHub
   - Vercel akan otomatis detect sebagai Vite project

3. **Configure Project:**
   - **Framework Preset:** Vite
   - **Root Directory:** `./` (default)
   - **Build Command:** `npm run build` (auto-detected)
   - **Output Directory:** `dist` (auto-detected)
   - **Install Command:** `npm install` (auto-detected)

4. **Environment Variables (Optional):**
   - Project sudah dikonfigurasi dengan API keys yang sudah di-set
   - Jika ingin menggunakan environment variables sendiri:
     - Go ke Project Settings > Environment Variables
     - Tambahkan:
       - `VITE_GEMINI_API_KEY`: `your_gemini_api_key_here`
       - `VITE_SUPABASE_URL`: `your_supabase_project_url_here`
       - `VITE_SUPABASE_ANON_KEY`: `your_supabase_anon_key_here`

5. **Deploy:**
   - Klik "Deploy"
   - Tunggu proses build selesai
   - Aplikasi akan live di URL yang diberikan Vercel

### Cara 2: Melalui Vercel CLI

1. **Login ke Vercel CLI:**
   ```bash
   vercel login
   ```

2. **Deploy:**
   ```bash
   vercel --prod
   ```

## 🎯 Hasil Deployment

Setelah deployment selesai, Anda akan mendapatkan:
- ✅ **Production URL** dari Vercel (contoh: `https://caffee-pairing-project.vercel.app`)
- ✅ **Automatic HTTPS** 
- ✅ **Global CDN**
- ✅ **Automatic deployments** setiap kali ada push ke main branch

## 🔧 Post-Deployment

1. **Test Aplikasi:**
   - Buka URL production
   - Test semua fitur (add coffee/pastry, generate pairings)
   - Pastikan Gemini AI dan Supabase berfungsi

2. **Custom Domain (Optional):**
   - Di Vercel dashboard, go ke Project Settings > Domains
   - Tambahkan custom domain jika diinginkan

## 📊 Monitoring

- **Analytics:** Vercel Analytics otomatis aktif
- **Logs:** Bisa dilihat di Vercel dashboard
- **Performance:** Real-time performance metrics

## 🚨 Troubleshooting

- **Build Error:** Check build logs di Vercel dashboard
- **Runtime Error:** Check function logs
- **Environment Variables:** Pastikan sudah di-set dengan benar

---

**Project Anda siap untuk production! 🎉**
