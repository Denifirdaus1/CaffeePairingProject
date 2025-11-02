# 🚀 Project Update: Implementasi Alur Pelanggan Proaktif (Sesuai Brief Klien)

Dokumen ini merangkum perubahan yang diperlukan pada alur pengguna (customer flow) berdasarkan brief klien terbaru. Tujuannya adalah untuk mengubah aplikasi dari alat *reaktif* (in-store) menjadi *asisten perencanaan* (proaktif) yang berfokus pada sugesti.

## 1. Ringkasan Permintaan Klien

Klien ingin pengalaman pengguna dimulai *sebelum* pelanggan mengantri di kasir.

* **Fokus Lama:** Pelanggan *harus* ada di kafe untuk `Scan QR`, baru bisa memulai pairing.
* **Fokus Baru:** Aplikasi harus proaktif memberi sugesti pairing. Pelanggan bisa memulai dari rumah, perjalanan, atau *saat tiba* di kafe (menggunakan deteksi lokasi/geofence).

## 2. Alur Pelanggan Baru (Yang Harus Diimplementasi)

Berikut adalah alur baru yang telah kita rancang, yang berfokus pada deteksi lokasi sebagai pemicu masuk utama.

### Fase 1: Pemicu Masuk (Entry Trigger & Location)

1.  **Buka Web App:** Pengguna membuka aplikasi web (customer-facing).
2.  **Minta Izin Lokasi:** Sistem secara proaktif meminta izin Geolocation (`navigator.geolocation`) kepada pengguna.
3.  **Hitung Jarak:**
    * Jika izin **diberikan**: Dapatkan `currentUserPosition`. Lanjutkan ke **Fase 2** dengan data lokasi.
    * Jika izin **ditolak**: Lanjutkan ke **Fase 1-B (Fallback)**.

### Fase 1-B: Fallback (Jika Lokasi Ditolak)

Jika pengguna menolak izin lokasi, jangan blokir alur. Tampilkan halaman yang memungkinkan input manual:
1.  **Search Bar:** Tampilkan search bar untuk "Cari kota atau area" (Misal: "Munich"). (Lihat spesifikasi teknis di bawah untuk integrasi **Places Autocomplete API**).
2.  **Link Direktori:** Tampilkan tombol/link "Lihat Semua Kafe Partner" (yang mengarah ke halaman "Discover" yang sudah ada).

### Fase 2: Pilihan Kafe (Café Selection)

* **Tindakan Sistem:**
    1. Dapatkan lokasi pengguna (dari Fase 1) atau lokasi area (dari Fase 1-B).
    2. Ambil **daftar kafe partner kita** dari database (yang sudah memiliki data lat/long).
    3. Hitung jarak dari pengguna ke setiap kafe partner (Lihat spesifikasi teknis di bawah untuk **Geometry Library**).
* **UI:** Tampilkan "Daftar Kafe Terdekat" (UI Kustom, **BUKAN** Places UI Kit). Daftar ini diurutkan berdasarkan jarak (misal: "Sweet Spot Kaffee - 50m", "Man vs Machine - 200m").
* **Tindakan Pengguna:** Pengguna menekan tombol "Kunjungi Halaman Kafe" (`Use this Café` / `Visit Shop`) pada kafe yang mereka pilih.

### Fase 3: Eksplorasi & Keputusan (Pairing)

1.  **Routing:** Pengguna **langsung diarahkan** ke halaman slug kafe tersebut (Contoh: `/s/kopienak-75253938`). Halaman ini *sudah merupakan* halaman pairing interaktifnya.
2.  **Proses Pairing:** Pengguna berinteraksi dengan halaman tersebut (memilih kopi atau pastry) dan sistem langsung memberikan sugesti pasangan, lengkap dengan "Tips" (sesuai brief klien: "...*with tips if they complement...*").
3.  **Buat Seleksi:** Pengguna mengkonfirmasi pilihan mereka (misal: 1 Espresso, 1 Banana Bread).

### Fase 4: Eksekusi (Order Execution - MVP "Test")

1.  **Tampilkan Layar Seleksi:** Aplikasi menampilkan ringkasan "Seleksi Pesanan Anda".
2.  **Tunjukkan ke Barista:** Sesuai brief ("*users show their pairing selection to the barista*"), alur MVP selesai saat pengguna menunjukkan layar ini ke barista untuk memesan dan membayar secara manual di kasir.

## 4. Rangkuman Aksi Teknis & Spesifikasi Integrasi

### 4.1. Aksi Logika Aplikasi & Routing

* **Buat View "Home" Baru:** Buat view/halaman masuk utama (`/` atau `/app`) untuk pelanggan. Halaman ini akan menangani logika Fase 1 (Izin Lokasi) dan Fase 2 (Daftar Kafe Terdekat).
* **Implementasikan Fallback:** Buat logika Fase 1-B (Search bar + Link direktori) jika `geolocation` ditolak.
* **Perbarui Routing:** Pastikan tombol "Kunjungi Halaman Kafe" (Fase 2) mengarahkan pengguna dengan benar ke halaman slug kafe yang sesuai (Contoh: `/s/kopienak-75253938`).
* **Verifikasi Alur QR (Legacy):** Pastikan alur "Scan QR" yang lama tetap berfungsi sebagai *jalur masuk alternatif* yang langsung mengarahkan pengguna ke halaman slug kafe yang benar (Fase 3).
* **Pisahkan Alur B2B:** Pastikan landing page B2B (untuk pemilik kafe) benar-benar terpisah dari alur pelanggan baru ini.

### 4.2. Spesifikasi Integrasi Google Maps Platform (Web)

Ini adalah rincian layanan spesifik yang akan digunakan dari Google Cloud Console:

1.  **Mendapatkan Lokasi Pengguna (Browser API)**
    * **Layanan:** `navigator.geolocation.getCurrentPosition()` (API Bawaan Browser, gratis).
    * **Tujuan:** Mendapatkan `{ lat, lng }` dari pengguna.

2.  **Menghitung Jarak (Rekomendasi MVP)**
    * **Peringatan:** JANGAN gunakan Places API (Nearby Search), karena itu akan menampilkan kafe kompetitor. Kita hanya ingin menampilkan *kafe partner* kita.
    * **Layanan:** **Maps JavaScript API** dengan library tambahan.
    * **Implementasi:** Muat skrip JS API dengan `&libraries=geometry`.
    * **Fungsi:** Gunakan `google.maps.geometry.spherical.computeDistanceBetween(from, to)`.
    * **Logika:**
        1.  Dapatkan `currentUserPosition` (Langkah 1).
        2.  Ambil daftar `kafePartner` (beserta lat/long-nya) dari database Anda.
        3.  Looping: Hitung jarak antara `currentUserPosition` dan setiap `kafePartner`.
        4.  Simpan jarak ini bersama data kafe.
    * **Alternatif (Premium):** Untuk fase selanjutnya, pertimbangkan **Distance Matrix API** untuk mendapatkan jarak rute jalan kaki/berkendara yang sebenarnya, bukan hanya garis lurus.

3.  **Menampilkan Daftar Kafe (UI Kustom)**
    * **Layanan:** UI frontend Anda sendiri (React, Vue, HTML/CSS).
    * **Peringatan:** JANGAN gunakan "Places UI Kit". UI ini harus kustom.
    * **Tujuan:** Render daftar kafe partner (dari database) yang sudah diurutkan berdasarkan jarak (dari Langkah 2).

4.  **Integrasi Skenario Fallback (Fase 1-B)**
    * **Layanan:** **Places API (Web Service)**.
    * **Fungsi:** Gunakan **Autocomplete** pada `search bar` (Fase 1-B).
    * **Tujuan:** Saat pengguna mengetik "Munich", Autocomplete akan menyarankan "Munich, Germany" dan memberikan `lat/long` untuk area tersebut. Gunakan `lat/long` ini untuk menjalankan Logika Perhitungan Jarak (Langkah 2).

5.  **(Opsional) Menampilkan Peta Visual**
    * **Layanan:** **Maps JavaScript API (Core)**.
    * **Tujuan:** Di samping daftar kafe terdekat (Fase 2), tampilkan peta visual kecil (`new google.maps.Map(...)`) dengan pin (`google.maps.Marker`) untuk lokasi pengguna dan kafe-kafe partner terdekat.