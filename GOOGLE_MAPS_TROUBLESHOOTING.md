# Google Maps API Troubleshooting Guide

## Error: "NoApiKeys" atau "ApiProjectMapError"

### Checklist:

1. **Pastikan API Key ada di `.env.local`**
   ```bash
   # Cek dengan:
   Get-Content .env.local | Select-String "VITE_GOOGLE_MAPS_API_KEY"
   
   # Harus output:
   VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
   ```

2. **Restart Dev Server**
   - Setelah edit `.env.local`, HARUS restart dev server
   - Stop server (Ctrl+C)
   - Start lagi: `npm run dev`

3. **Pastikan API Key Valid di Google Cloud Console**
   - Buka: https://console.cloud.google.com/apis/credentials
   - Cek API key Anda ada dan aktif
   - Pastikan restrictions (jika ada) memperbolehkan domain Anda

4. **Enable Required APIs di Google Cloud Console**
   - Maps JavaScript API: https://console.cloud.google.com/apis/library/maps-javascript-api
   - Places API: https://console.cloud.google.com/apis/library/places-api
   - Geocoding API: https://console.cloud.google.com/apis/library/geocoding-api
   - Geometry Library (otomatis dengan Maps JavaScript API)

5. **Cek Browser Console**
   - Buka DevTools (F12)
   - Tab Console
   - Cari error message
   - Jika ada "ERR_BLOCKED_BY_CLIENT":
     - Nonaktifkan ad blocker
     - Nonaktifkan browser extensions yang block requests
     - Cek uBlock Origin, Privacy Badger, dll

6. **Cek Environment Variables di Browser**
   - Di browser console, ketik:
     ```javascript
     console.log(import.meta.env.VITE_GOOGLE_MAPS_API_KEY)
     ```
   - Harus muncul API key Anda (bukan undefined atau empty string)

7. **Verifikasi Vite Config**
   - Cek `vite.config.ts` sudah expose `VITE_GOOGLE_MAPS_API_KEY`
   - Saat `npm run dev`, harus ada log:
     ```
     Environment variables status: {
       VITE_GOOGLE_MAPS_API_KEY: 'SET',
       ...
     }
     ```

## Error: "ERR_BLOCKED_BY_CLIENT"

Ini berarti browser extension (biasanya ad blocker) memblokir request ke Google Maps.

### Solusi:
1. **Nonaktifkan Ad Blocker untuk domain ini**
   - uBlock Origin: Klik icon → Pause on this site
   - AdBlock Plus: Klik icon → Disable on this page
   
2. **Whitelist Google Maps**
   - Di ad blocker settings, tambahkan ke whitelist:
     - `maps.googleapis.com`
     - `maps.google.com`
     - `*.googleapis.com`

3. **Test di Incognito/Private Mode**
   - Buka browser incognito/private
   - Extension biasanya tidak aktif di mode ini
   - Test apakah masih error

## Error: "CSP" (Content Security Policy)

Ini berarti server memblokir Google Maps karena CSP.

### Solusi:
- CSP biasanya dikonfigurasi di server
- Pastikan server mengizinkan:
  - `https://maps.googleapis.com`
  - `https://maps.google.com`
  - `https://*.googleapis.com`

## Debug Steps

1. **Cek API Key di Console**
   ```javascript
   // Di browser console:
   console.log('API Key:', import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.substring(0, 10) + '...');
   ```

2. **Cek apakah google.maps loaded**
   ```javascript
   // Di browser console:
   console.log('google.maps available:', !!window.google?.maps);
   ```

3. **Test API Key langsung**
   - Buka: https://console.cloud.google.com/apis/credentials
   - Test API key di "API Key" section
   - Pastikan status "Enabled"

4. **Check Network Tab**
   - Buka DevTools → Network tab
   - Filter: "maps.googleapis.com"
   - Cek apakah request ke Google Maps:
     - Success (200 OK) atau
     - Blocked (ERR_BLOCKED_BY_CLIENT) atau
     - Error (403, 400, etc)
   - Jika 403: API key invalid atau API tidak enabled
   - Jika ERR_BLOCKED_BY_CLIENT: Ad blocker atau extension

## Quick Fix Checklist

- [ ] `.env.local` file exists dan berisi `VITE_GOOGLE_MAPS_API_KEY=...`
- [ ] Dev server sudah di-restart setelah edit `.env.local`
- [ ] Console log menunjukkan `VITE_GOOGLE_MAPS_API_KEY: 'SET'`
- [ ] Browser console `import.meta.env.VITE_GOOGLE_MAPS_API_KEY` tidak undefined
- [ ] Google Cloud Console: API key aktif
- [ ] Google Cloud Console: Maps JavaScript API enabled
- [ ] Google Cloud Console: Places API enabled
- [ ] Google Cloud Console: Geocoding API enabled
- [ ] Ad blocker nonaktif atau whitelist Google Maps
- [ ] Test di incognito mode masih error?

## Still Not Working?

Jika semua di atas sudah dicoba tapi masih error:

1. **Cek API Key Restrictions**
   - Di Google Cloud Console → Credentials
   - Klik API key Anda
   - Pastikan:
     - "Application restrictions" = None ATAU
     - "HTTP referrers" includes your domain
   - Pastikan:
     - "API restrictions" = None ATAU
     - Includes: Maps JavaScript API, Places API, Geocoding API

2. **Create New API Key**
   - Buat API key baru di Google Cloud Console
   - Update di `.env.local`
   - Restart dev server

3. **Check Logs**
   - Buka browser console
   - Cari error messages
   - Copy error message lengkap
   - Check apakah ada error yang tidak disebutkan di atas

