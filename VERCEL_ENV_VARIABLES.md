# 🔐 Environment Variables untuk Vercel Deployment

## 📋 Environment Variables yang Perlu Ditambahkan ke Vercel

### 🎯 **Environment Variables Wajib:**

| Variable Name | Value | Description |
|---------------|-------|-------------|
| `VITE_GEMINI_API_KEY` | `your_gemini_api_key_here` | Google Gemini API Key |
| `VITE_SUPABASE_URL` | `your_supabase_project_url_here` | Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | `your_supabase_anon_key_here` | Supabase Anonymous Key |

## 🚀 **Cara Menambahkan Environment Variables di Vercel:**

### **Step 1: Login ke Vercel Dashboard**
1. Buka [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. Login dengan akun GitHub Anda

### **Step 2: Pilih Project**
1. Klik pada project "CaffeePairingProject"
2. Atau jika belum ada, import project dari GitHub terlebih dahulu

### **Step 3: Tambahkan Environment Variables**
1. Klik tab **"Settings"**
2. Scroll ke bawah dan klik **"Environment Variables"**
3. Klik **"Add New"**

### **Step 4: Tambahkan Setiap Variable**

#### **Variable 1: Gemini API Key**
- **Name:** `VITE_GEMINI_API_KEY`
- **Value:** `your_gemini_api_key_here`
- **Environment:** Pilih semua (Production, Preview, Development)
- **Klik "Save"**

#### **Variable 2: Supabase URL**
- **Name:** `VITE_SUPABASE_URL`
- **Value:** `your_supabase_project_url_here`
- **Environment:** Pilih semua (Production, Preview, Development)
- **Klik "Save"**

#### **Variable 3: Supabase Anonymous Key**
- **Name:** `VITE_SUPABASE_ANON_KEY`
- **Value:** `your_supabase_anon_key_here`
- **Environment:** Pilih semua (Production, Preview, Development)
- **Klik "Save"**

## ⚠️ **Penting untuk Diingat:**

### **Environment Selection:**
- ✅ **Production** - untuk deployment utama
- ✅ **Preview** - untuk preview deployments (pull requests)
- ✅ **Development** - untuk development deployments

### **Security Notes:**
- 🔒 Environment variables di Vercel aman dan tidak ter-expose ke client
- 🔒 Hanya variables yang dimulai dengan `VITE_` yang bisa diakses di browser
- 🔒 Variables ini akan menggantikan hardcoded values di production

## 🔄 **Setelah Menambahkan Environment Variables:**

1. **Redeploy Project:**
   - Go ke tab **"Deployments"**
   - Klik **"Redeploy"** pada deployment terbaru
   - Atau push commit baru ke GitHub untuk trigger automatic deployment

2. **Verify Deployment:**
   - Tunggu proses build selesai
   - Buka production URL
   - Test semua fitur untuk memastikan environment variables bekerja

## 🎯 **Hasil Setelah Setup:**

- ✅ **Gemini AI** akan menggunakan API key yang benar
- ✅ **Supabase** akan terhubung ke database yang benar
- ✅ **Aplikasi** akan berfungsi penuh di production
- ✅ **Environment variables** akan aman dan tidak ter-expose

## 🚨 **Troubleshooting:**

### **Jika Build Error:**
- Pastikan semua 3 environment variables sudah ditambahkan
- Pastikan nama variable tepat (case-sensitive)
- Pastikan value tidak ada spasi di awal/akhir

### **Jika Runtime Error:**
- Check browser console untuk error messages
- Pastikan environment variables sudah di-set untuk Production environment
- Redeploy project setelah menambahkan variables

---

**Setelah menambahkan environment variables ini, aplikasi Anda akan berfungsi sempurna di Vercel! 🎉**
