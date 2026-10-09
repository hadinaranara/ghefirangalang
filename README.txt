UNDANGAN PERNIKAHAN DIGITAL - GHEFIRA & GALANG
=========================================
Cara pakai: jalankan halaman melalui web server lokal atau hosting statis.
Integrasi RSVP dan ucapan membutuhkan koneksi internet dan konfigurasi Supabase.

Struktur:
  index.html   - struktur halaman
  style.css    - tampilan & animasi
  script.js    - logika (tanggal acara di CONFIG bagian atas)
  supabase-config.js - URL project dan anon key Supabase
  supabase-setup.sql - skema tabel dan kebijakan keamanan Supabase
  assets/
    images/    - aset opening & background (gunungan, joglo, bunga, kupu-kupu, bg)
                 + foto placeholder (hero, bride, groom, story-1..3, gallery-1..3 .jpg)
    audio/     - taruh wedding.mp3
    video/     - taruh prewedding.mp4

Yang perlu Anda ganti:
  1. Buat project di https://supabase.com/
  2. Buka SQL Editor di dashboard Supabase, tempel seluruh isi
     supabase-setup.sql, lalu jalankan.
  3. Buka Project Settings > API. Salin Project URL dan anon/public key
     ke properti url dan anonKey di supabase-config.js.
     Jangan pernah memasukkan service_role key ke file frontend.
  4. Jalankan/deploy halaman melalui web server (bukan file://), kemudian
     uji RSVP dan ucapan.

Keamanan:
  - Row Level Security aktif pada tabel rsvps.
  - Pengunjung dapat mengirim RSVP, tetapi jumlah tamu dan kehadiran tidak dapat dibaca publik.
  - Hanya nama, ucapan, dan tanggal RSVP dengan pesan yang ditampilkan publik.
  - Batasi penggunaan API di pengaturan Supabase dan tinjau ucapan berkala.

Pengaturan undangan:
  - Nama, foto, keluarga, lokasi, dan jadwal acara: index.html
  - Tanggal hitung mundur: CONFIG.weddingDate di script.js
  - Foto dan musik: folder assets/
