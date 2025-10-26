# 🔐 Panduan Lengkap: Environment Variables untuk Vercel

## 📍 **Di Mana API Keys Disimpan di Project:**

### **1. Google Gemini API Key:**
- **File:** `services/geminiService.ts` (line 5-9)
- **Usage:** `import.meta.env.VITE_GEMINI_API_KEY`
- **Purpose:** Untuk AI pairing recommendations

### **2. Supabase Credentials:**
- **File:** `services/supabaseClient.ts` (line 4-5)
- **Usage:** 
  - `import.meta.env.VITE_SUPABASE_URL`
  - `import.meta.env.VITE_SUPABASE_ANON_KEY`
- **Purpose:** Database dan storage operations

### **3. Vite Configuration:**
- **File:** `vite.config.ts` (line 11-13)
- **Purpose:** Load environment variables dan fallback handling

## 📁 **File Environment yang Sudah Dibuat:**

### **`.env.local`** - Untuk Development Lokal
- File ini untuk development di komputer kamu
- **TIDAK** akan di-commit ke GitHub (sudah di `.gitignore`)
- Ganti `your_*_here` dengan values asli

### **`.env`** - Untuk Import ke Vercel
- File ini untuk import ke Vercel Dashboard
- Format sederhana tanpa komentar
- **TIDAK** akan di-commit ke GitHub (sudah di `.gitignore`)

## 🚀 **Cara Import ke Vercel:**

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

### **Step 2: Update File .env**

Edit file `.env` dan ganti:
```
VITE_GEMINI_API_KEY=[API_KEY_BARU_DARI_GEMINI]
VITE_SUPABASE_URL=https://jjbvliewmcadmxmmcckl.supabase.co
VITE_SUPABASE_ANON_KEY=[ANONYMOUS_KEY_BARU_DARI_SUPABASE]
```

### **Step 3: Import ke Vercel**

#### **Cara 1: Import File .env**
1. Buka [Vercel Dashboard](https://vercel.com/dashboard)
2. Pilih project **CaffeePairingProject**
3. Go ke **Settings** → **Environment Variables**
4. Klik **"Import .env"**
5. Upload file `.env`
6. Klik **"Save"**

#### **Cara 2: Copy-Paste Manual**
1. Buka file `.env`
2. Copy semua content
3. Di Vercel Dashboard → Settings → Environment Variables
4. Paste content di kolom input
5. Klik **"Save"**

### **Step 4: Redeploy**

1. Go ke tab **"Deployments"**
2. Klik **"Redeploy"** pada deployment terbaru
3. Tunggu proses build selesai
4. Test aplikasi di production URL

## ✅ **Checklist:**

- [ ] Regenerate Google Gemini API key
- [ ] Regenerate Supabase anonymous key
- [ ] Update file `.env` dengan keys baru
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

**File `.env` sudah siap untuk di-import ke Vercel! 🎯**
