# 🚀 Panduan Simple: Setup Environment Variables

## 🏠 **Untuk Development Lokal:**

### **File `.env.local` (sudah dibuat):**
```
VITE_GEMINI_API_KEY=AIzaSyBqEXLaxl6AqUZcY5qLxFPDaX77Wt8swyc
VITE_SUPABASE_URL=https://jjbvliewmcadmxmmcckl.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

- ✅ File ini **TIDAK** akan di-commit ke GitHub (sudah di `.gitignore`)
- ✅ Bisa pakai untuk development lokal
- ✅ Aman karena tidak ter-expose di public repository

## 🚀 **Untuk Production (Vercel):**

### **Cara Simple - Add Environment Variables di Vercel Dashboard:**

1. **Buka Vercel Dashboard:**
   - Login ke [vercel.com/dashboard](https://vercel.com/dashboard)
   - Pilih project **CaffeePairingProject**

2. **Add Environment Variables:**
   - Go ke **Settings** → **Environment Variables**
   - Klik **"Add New"**

3. **Add 3 Variables:**

   **Variable 1:**
   - **Name:** `VITE_GEMINI_API_KEY`
   - **Value:** `AIzaSyBqEXLaxl6AqUZcY5qLxFPDaX77Wt8swyc`
   - **Environment:** ✅ Production ✅ Preview ✅ Development

   **Variable 2:**
   - **Name:** `VITE_SUPABASE_URL`
   - **Value:** `https://jjbvliewmcadmxmmcckl.supabase.co`
   - **Environment:** ✅ Production ✅ Preview ✅ Development

   **Variable 3:**
   - **Name:** `VITE_SUPABASE_ANON_KEY`
   - **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqYnZsaWV3bWNhZG14bW1jY2tsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyODI1NDMsImV4cCI6MjA3Njg1ODU0M30._5DeurOWNpd08Iq-5hEqh4j2Nsout2AzpRpea8hcaQY`
   - **Environment:** ✅ Production ✅ Preview ✅ Development

4. **Redeploy:**
   - Go ke tab **"Deployments"**
   - Klik **"Redeploy"**
   - Test aplikasi

## ✅ **Keuntungan Cara Ini:**

- 🏠 **Development:** Pakai `.env.local` untuk lokal
- 🚀 **Production:** Add variables langsung di Vercel
- 🔒 **Aman:** Tidak ada credentials di GitHub repository
- ⚡ **Simple:** Tidak perlu regenerate keys atau import file
- 🎯 **Praktis:** Langsung bisa deploy

## 📋 **Checklist:**

- [ ] File `.env.local` sudah ada untuk development
- [ ] Add `VITE_GEMINI_API_KEY` ke Vercel
- [ ] Add `VITE_SUPABASE_URL` ke Vercel
- [ ] Add `VITE_SUPABASE_ANON_KEY` ke Vercel
- [ ] Pilih semua environment (Production, Preview, Development)
- [ ] Redeploy project
- [ ] Test aplikasi

## 🚨 **Penting:**

- **JANGAN** commit file `.env*` ke GitHub
- **PASTIKAN** semua environment variables sudah di-set di Vercel
- **TEST** aplikasi setelah deployment

---

**Cara ini jauh lebih simple dan praktis! 🎉**
