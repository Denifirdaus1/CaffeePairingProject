# 🚀 Panduan Import Environment Variables ke Vercel

## 📋 **File Template yang Sudah Dibuat:**
- `env-template.txt` - Template untuk copy-paste ke Vercel

## 🔄 **Langkah-langkah Import ke Vercel:**

### **Step 1: Regenerate API Keys (WAJIB!)**

#### **🔄 Google Gemini API Key:**
1. Buka [Google AI Studio](https://makersuite.google.com/app/apikey)
2. **HAPUS** API key lama: `AIzaSyBqEXLaxl6AqUZcY5qLxFPDaX77Wt8swyc`
3. **BUAT** API key baru
4. Copy API key baru

#### **🔄 Supabase Anonymous Key:**
1. Buka [Supabase Dashboard](https://supabase.com/dashboard)
2. Pilih project: `jjbvliewmcadmxmmcckl`
3. Go ke **Settings** → **API**
4. **REGENERATE** anonymous key
5. Copy key baru

### **Step 2: Update Template File**

Edit file `env-template.txt` dan ganti:
- `your_gemini_api_key_here` → dengan API key baru dari Gemini
- `your_supabase_anon_key_here` → dengan anonymous key baru dari Supabase

### **Step 3: Import ke Vercel**

#### **Cara 1: Import File .env**
1. Rename `env-template.txt` menjadi `.env`
2. Di Vercel Dashboard → Settings → Environment Variables
3. Klik **"Import .env"**
4. Upload file `.env`
5. Klik **"Save"**

#### **Cara 2: Copy-Paste Manual**
1. Buka file `env-template.txt`
2. Copy semua content
3. Di Vercel Dashboard → Settings → Environment Variables
4. Paste content di kolom input
5. Klik **"Save"**

#### **Cara 3: Add Satu-satu**
1. Di Vercel Dashboard → Settings → Environment Variables
2. Klik **"Add Another"** untuk setiap variable:

**Variable 1:**
- **Key:** `VITE_GEMINI_API_KEY`
- **Value:** `[API_KEY_BARU_DARI_GEMINI]`
- **Environment:** ✅ Production ✅ Preview ✅ Development

**Variable 2:**
- **Key:** `VITE_SUPABASE_URL`
- **Value:** `https://jjbvliewmcadmxmmcckl.supabase.co`
- **Environment:** ✅ Production ✅ Preview ✅ Development

**Variable 3:**
- **Key:** `VITE_SUPABASE_ANON_KEY`
- **Value:** `[ANONYMOUS_KEY_BARU_DARI_SUPABASE]`
- **Environment:** ✅ Production ✅ Preview ✅ Development

### **Step 4: Redeploy**

1. Go ke tab **"Deployments"**
2. Klik **"Redeploy"** pada deployment terbaru
3. Tunggu proses build selesai
4. Test aplikasi di production URL

## ✅ **Checklist:**

- [ ] Regenerate Google Gemini API key
- [ ] Regenerate Supabase anonymous key
- [ ] Update `env-template.txt` dengan keys baru
- [ ] Import ke Vercel Dashboard
- [ ] Pilih semua environment (Production, Preview, Development)
- [ ] Redeploy application
- [ ] Test aplikasi di production

## 🚨 **Penting:**

- **JANGAN** commit file `.env` atau `.env.local` ke Git
- **SELALU** regenerate API keys yang sudah ter-expose
- **PASTIKAN** semua environment variables sudah di-set
- **TEST** aplikasi setelah deployment

## 📞 **Jika Ada Masalah:**

1. **Build Error:** Pastikan semua 3 environment variables sudah ditambahkan
2. **Runtime Error:** Check browser console untuk error messages
3. **API Error:** Pastikan API keys sudah di-regenerate dan benar

---

**Setelah ini, aplikasi akan berfungsi sempurna di Vercel! 🎉**
