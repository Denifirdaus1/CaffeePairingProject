<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Café Owner Dashboard AI

AI-powered dashboard untuk membantu pemilik café menemukan pairing kopi dan pastry terbaik menggunakan Google Gemini AI dan Supabase.

## Features

- 🤖 AI-powered coffee and pastry pairing recommendations
- 📊 Interactive dashboard dengan inventory management
- 🖼️ Image upload dan management
- 📱 Responsive design
- 🚀 Ready untuk deployment ke Vercel

## Setup Lokal

**Prerequisites:** Node.js 18+

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Setup Environment Variables (Optional):**
   - Project sudah dikonfigurasi dengan API keys yang sudah di-set
   - Jika ingin menggunakan environment variables sendiri, copy `env.example` ke `.env.local`:
   ```bash
   cp env.example .env.local
   ```
   
   Edit `.env.local` dengan values Anda:
   ```
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   VITE_SUPABASE_URL=your_supabase_project_url_here
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
   ```
   
   **⚠️ PENTING:** Untuk fitur location-based cafe discovery, Anda **WAJIB** setup Google Maps API Key. Lihat file `GOOGLE_MAPS_SETUP.md` untuk panduan lengkap.
   
   **Note:** Jika tidak ada file `.env.local`, aplikasi akan menggunakan API keys yang sudah dikonfigurasi (jika ada).

3. **Run the app:**
   ```bash
   npm run dev
   ```

   App akan berjalan di `http://localhost:3000`

## Deployment ke Vercel

1. **Push code ke GitHub repository**

2. **Connect ke Vercel:**
   - Login ke [Vercel](https://vercel.com)
   - Import project dari GitHub
   - Vercel akan otomatis detect Vite framework

3. **Setup Environment Variables di Vercel:**
   - **WAJIB:** Tambahkan environment variables berikut di Vercel dashboard:
   
   | Variable | Value | Description |
   |----------|-------|-------------|
   | `VITE_GEMINI_API_KEY` | `your_gemini_api_key_here` | Google Gemini API Key |
   | `VITE_SUPABASE_URL` | `your_supabase_project_url_here` | Supabase Project URL |
   | `VITE_SUPABASE_ANON_KEY` | `your_supabase_anon_key_here` | Supabase Anonymous Key |
   
   **📋 Panduan Lengkap:** Lihat file `VERCEL_ENV_VARIABLES.md` untuk step-by-step setup environment variables di Vercel.

4. **Deploy:**
   - Vercel akan otomatis deploy setiap kali ada push ke main branch
   - Atau manual deploy dari Vercel dashboard

## Tech Stack

- **Frontend:** React 19 + TypeScript + Vite
- **AI:** Google Gemini 2.5 Pro
- **Database:** Supabase (PostgreSQL)
- **Storage:** Supabase Storage
- **Deployment:** Vercel

## Project Structure

```
├── components/          # React components
├── services/           # API services (Gemini, Supabase)
├── types.ts           # TypeScript type definitions
├── vite.config.ts     # Vite configuration
├── vercel.json        # Vercel deployment config
└── env.example        # Environment variables template
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_GEMINI_API_KEY` | Google Gemini API key | Yes |
| `VITE_SUPABASE_URL` | Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps API key (untuk location features) | Yes (untuk fitur baru) |

## Troubleshooting

- **API Key Error:** Pastikan `VITE_GEMINI_API_KEY` sudah di-set dengan benar
- **Supabase Connection Error:** Check `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`
- **Google Maps Error:** Pastikan `VITE_GOOGLE_MAPS_API_KEY` sudah di-set dan Maps JavaScript API + Places API sudah di-enable. Lihat `GOOGLE_MAPS_SETUP.md`
- **Build Error:** Pastikan semua dependencies terinstall dengan `npm install`
- **Location Picker tidak muncul:** Pastikan Places API sudah di-enable di Google Cloud Console
