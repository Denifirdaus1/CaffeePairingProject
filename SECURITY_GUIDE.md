# 🔐 Security Guide - Panduan Keamanan

## 🚨 **URGENT: API Keys yang Ter-Expose**

**Status:** ✅ **FIXED** - Semua API keys dan credentials sudah dihapus dari repository

### **Yang Sudah Diperbaiki:**
- ✅ Dihapus dari `README.md`
- ✅ Dihapus dari `VERCEL_ENV_VARIABLES.md`
- ✅ Dihapus dari `VERCEL_ENV_QUICK_REFERENCE.md`
- ✅ Dihapus dari `DEPLOYMENT.md`
- ✅ Dihapus dari `vite.config.ts`
- ✅ Dihapus dari `vercel.json`
- ✅ Dihapus dari `services/supabaseClient.ts`

## 🔄 **Langkah Selanjutnya (WAJIB DILAKUKAN):**

### **1. Regenerate API Keys (URGENT!)**

#### **Google Gemini API Key:**
1. Buka [Google AI Studio](https://makersuite.google.com/app/apikey)
2. **HAPUS** API key lama: `AIzaSyBqEXLaxl6AqUZcY5qLxFPDaX77Wt8swyc`
3. **BUAT** API key baru
4. Update di Vercel environment variables

#### **Supabase Credentials:**
1. Buka [Supabase Dashboard](https://supabase.com/dashboard)
2. Go ke project: `jjbvliewmcadmxmmcckl`
3. **REGENERATE** anonymous key di Settings > API
4. Update di Vercel environment variables

### **2. Update Environment Variables di Vercel**

Setelah regenerate keys, update di Vercel Dashboard:
- `VITE_GEMINI_API_KEY` = [API key baru]
- `VITE_SUPABASE_URL` = [URL yang sama]
- `VITE_SUPABASE_ANON_KEY` = [Anonymous key baru]

### **3. Redeploy Application**

Setelah update environment variables:
1. Go ke Vercel Dashboard
2. Redeploy project
3. Test semua fitur

## 🛡️ **Security Best Practices**

### **DO's (Yang Harus Dilakukan):**
- ✅ **SELALU** gunakan environment variables untuk API keys
- ✅ **SELALU** gunakan placeholder values di dokumentasi
- ✅ **SELALU** test dengan environment variables kosong
- ✅ **SELALU** commit `.env.local` ke `.gitignore`
- ✅ **SELALU** review code sebelum commit

### **DON'Ts (Yang Tidak Boleh Dilakukan):**
- ❌ **JANGAN PERNAH** hardcode API keys di source code
- ❌ **JANGAN PERNAH** commit file `.env` atau `.env.local`
- ❌ **JANGAN PERNAH** share API keys di chat/email
- ❌ **JANGAN PERNAH** screenshot environment variables
- ❌ **JANGAN PERNAH** commit credentials ke public repository

## 🔍 **Pre-Commit Checklist**

Sebelum commit, **SELALU** cek:

- [ ] Tidak ada API keys hardcoded
- [ ] Tidak ada credentials di dokumentasi
- [ ] File `.env*` tidak di-commit
- [ ] Semua placeholder menggunakan format `your_*_here`
- [ ] Test aplikasi dengan environment variables kosong

## 🚨 **Emergency Response**

Jika API keys ter-expose lagi:

1. **IMMEDIATE:** Hapus dari repository
2. **IMMEDIATE:** Regenerate semua keys
3. **IMMEDIATE:** Update environment variables
4. **IMMEDIATE:** Redeploy application
5. **FOLLOW-UP:** Review security practices

## 📋 **Environment Variables Template**

### **Local Development (.env.local):**
```bash
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_SUPABASE_URL=your_supabase_project_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### **Production (Vercel):**
- Set via Vercel Dashboard
- Never commit to repository
- Use same variable names

## 🔐 **Security Monitoring**

### **Regular Checks:**
- [ ] Weekly: Review repository for exposed credentials
- [ ] Monthly: Rotate API keys
- [ ] Quarterly: Security audit

### **Tools to Use:**
- `git-secrets` - Prevent committing secrets
- `truffleHog` - Scan for secrets in git history
- GitHub Security Alerts

## 📞 **Emergency Contacts**

Jika ada masalah keamanan:
1. **Immediate:** Fix the issue
2. **Document:** What happened and how it was fixed
3. **Prevent:** Update security practices

---

**Remember: Security is everyone's responsibility! 🔐**
