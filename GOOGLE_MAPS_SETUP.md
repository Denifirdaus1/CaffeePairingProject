# Setup Google Maps API - Panduan Lengkap

## Langkah 1: Dapatkan Google Maps API Key

### 1.1. Akses Google Cloud Console
1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Login dengan akun Google Anda
3. Buat project baru atau pilih project yang sudah ada

### 1.2. Enable Required APIs
Anda perlu enable 2 API berikut:

**Maps JavaScript API:**
1. Di Google Cloud Console, buka [API Library](https://console.cloud.google.com/apis/library)
2. Search "Maps JavaScript API"
3. Klik dan tekan tombol "Enable"

**Places API:**
1. Di API Library yang sama, search "Places API"
2. Klik dan tekan tombol "Enable"

### 1.3. Buat API Key
1. Buka [Credentials page](https://console.cloud.google.com/apis/credentials)
2. Klik "Create Credentials" → "API Key"
3. Copy API key yang dihasilkan

### 1.4. Restrict API Key (PENTING untuk Security)
1. Klik pada API key yang baru dibuat
2. Di bagian "Application restrictions", pilih "HTTP referrers (web sites)"
3. Tambahkan referrer berikut:
   ```
   http://localhost:3000/*
   http://localhost:5173/*
   https://yourdomain.com/*
   https://*.vercel.app/*
   ```
   (Ganti `yourdomain.com` dengan domain production Anda)

4. Di bagian "API restrictions", pilih "Restrict key"
5. Pilih hanya:
   - Maps JavaScript API
   - Places API

6. Klik "Save"

## Langkah 2: Setup API Key di Project

### 2.1. Buat file `.env.local`
Buat file `.env.local` di root project (sama level dengan `package.json`):

```bash
# File: .env.local
VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
```

**PENTING:**
- Ganti `your_api_key_here` dengan API key yang Anda dapatkan dari Google Cloud Console
- File `.env.local` sudah otomatis di-ignore oleh git (tidak akan ter-commit)

### 2.2. Verifikasi Environment Variable
Jalankan aplikasi dan cek console browser untuk memastikan:
```
Environment variables loaded: {
  VITE_GOOGLE_MAPS_API_KEY: 'SET',
  ...
}
```

## Langkah 3: Testing

### 3.1. Test Register Page (B2B)
1. Buka aplikasi → klik "Get Started" atau akses `/register`
2. Isi form registration
3. Di bagian "Café Location", ketik nama kota atau alamat
4. Pilih dari autocomplete suggestions
5. Pastikan map preview muncul dengan marker
6. Submit form

### 3.2. Test Customer Home Page
1. Buka aplikasi di root URL `/`
2. Test permission request:
   - Klik "Allow Location Access"
   - Izinkan browser untuk akses lokasi
   - Harus muncul daftar kafe terdekat

3. Test fallback search:
   - Klik "Search by City or Area Instead"
   - Ketik nama kota (e.g., "Munich")
   - Pilih dari suggestions
   - Harus muncul daftar kafe di area tersebut

## Troubleshooting

### Error: "VITE_GOOGLE_MAPS_API_KEY environment variable is not set"
**Solusi:**
- Pastikan file `.env.local` ada di root project
- Pastikan format: `VITE_GOOGLE_MAPS_API_KEY=your_key_here` (tanpa spasi, tanpa quotes)
- Restart development server setelah membuat/update `.env.local`

### Error: "This API project is not authorized to use this API"
**Solusi:**
- Pastikan Maps JavaScript API dan Places API sudah di-enable
- Tunggu beberapa menit setelah enable (ada delay propagation)

### Error: "RefererNotAllowedMapError"
**Solusi:**
- Pastikan domain Anda sudah ditambahkan di API Key restrictions
- Untuk localhost, pastikan sudah tambahkan `http://localhost:3000/*` atau port yang digunakan

### Location picker tidak muncul suggestions
**Solusi:**
- Cek console browser untuk error
- Pastikan Places API sudah di-enable
- Pastikan API key tidak restricted untuk Places API

### Distance calculation tidak bekerja
**Solusi:**
- Pastikan Maps JavaScript API sudah di-enable
- Pastikan geometry library ter-load (sudah include di loader)

## Biaya Google Maps API

**Gratis:**
- Maps JavaScript API: $200 credit per bulan (setara ~28,000 map loads)
- Places API (Autocomplete): $200 credit per bulan (setara ~17,000 autocomplete sessions)

**Catatan:**
- Untuk development dan testing kecil-kecilan, biasanya masih dalam free tier
- Monitor usage di [Google Cloud Console Billing](https://console.cloud.google.com/billing)
- Setup billing alert untuk menghindari surprise charges

## Next Steps Setelah Setup

1. ✅ Test register dengan location picker
2. ✅ Test customer home page dengan geolocation
3. ✅ Test customer home page dengan fallback search
4. ✅ Verifikasi data latitude/longitude tersimpan di database
5. ✅ Test mencari kafe terdekat dan redirect ke shop page

