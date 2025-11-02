# Fix: Environment Variables Tidak Terdeteksi

## Masalah
Error: "Supabase URL and anonymous key must be provided" padahal `.env.local` sudah lengkap.

## Solusi

### 1. **RESTART Dev Server** (PENTING!)
Setelah edit `.env.local`, **WAJIB restart dev server**:

```bash
# Stop server (Ctrl+C)
# Lalu jalankan lagi:
npm run dev
```

**Kenapa?** Vite hanya membaca `.env.local` saat server START, tidak saat runtime.

### 2. Pastikan Format File `.env.local` Benar

File harus berada di **root project** (sama level dengan `package.json`), format:
```
VITE_GEMINI_API_KEY=your_key_here
VITE_SUPABASE_URL=your_url_here
VITE_SUPABASE_ANON_KEY=your_key_here
VITE_GOOGLE_MAPS_API_KEY=your_key_here
```

**Rules:**
- ✅ Tidak ada spasi sebelum/sesudah `=`
- ✅ Tidak ada quotes (`"` atau `'`)
- ✅ Harus prefix `VITE_` untuk semua variables
- ✅ Tidak ada empty lines di antara variables
- ✅ File harus di root (bukan di folder lain)

### 3. Verifikasi File Terbaca

Setelah restart, cek console terminal:
```
Environment variables loaded: {
  VITE_GEMINI_API_KEY: 'SET',
  VITE_SUPABASE_URL: 'SET',
  VITE_SUPABASE_ANON_KEY: 'SET',
  VITE_GOOGLE_MAPS_API_KEY: 'SET',
  source: 'from file'
}
```

Jika masih "NOT SET", berarti file tidak terbaca.

### 4. Troubleshooting Lanjutan

#### Jika masih tidak terbaca:

**A. Cek file benar-benar di root:**
```powershell
# Di PowerShell
Get-Location  # Harus di C:\KaffeeProjectGemini
Test-Path .env.local  # Harus return True
```

**B. Cek encoding file:**
```powershell
# File harus UTF-8, tidak ada BOM
[System.IO.File]::ReadAllText(".env.local", [System.Text.Encoding]::UTF8)
```

**C. Recreate file jika perlu:**
```powershell
# Hapus file lama
Remove-Item .env.local

# Buat file baru dengan PowerShell
@"
VITE_GEMINI_API_KEY=AIzaSyBqEXLaxl6AqUZcY5qLxFPDaX77Wt8swyc
VITE_SUPABASE_URL=https://jjbvliewmcadmxmmcckl.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqYnZsaWV3bWNhZG14bW1jY2tsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyODI1NDMsImV4cCI6MjA3Njg1ODU0M30._5DeurOWNpd08Iq-5hEqh4j2Nsout2AzpRpea8hcaQY
VITE_GOOGLE_MAPS_API_KEY=AIzaSyDhWjBeyoQnwgFe6IwmqIUk_Fw3K9Yfr_8
"@ | Out-File -FilePath .env.local -Encoding utf8
```

**D. Clear Vite cache:**
```bash
# Hapus cache Vite
Remove-Item -Recurse -Force node_modules/.vite
npm run dev
```

### 5. Untuk Build Production

Untuk `npm run build`, pastikan environment variables juga ter-set di:
- **Local build**: `.env.local` atau `.env.production.local`
- **Vercel**: Environment variables di Vercel dashboard

### 6. Icon Block di VS Code (Normal!)

Icon block/grayed di VS Code adalah **NORMAL** - itu berarti file di-ignore oleh Git (ada di `.gitignore`). Ini **TIDAK MEMPENGARUHI** Vite membaca file tersebut.

---

## Checklist Quick Fix

- [ ] Stop dev server (Ctrl+C)
- [ ] Edit `.env.local` pastikan format benar
- [ ] Start dev server lagi: `npm run dev`
- [ ] Cek console terminal - harus muncul "SET" untuk semua variables
- [ ] Refresh browser
- [ ] Error harus hilang

Jika masih error setelah semua langkah di atas, coba clear cache Vite dan restart.

