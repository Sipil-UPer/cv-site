/* =====================================================================
   KONFIGURASI SITUS — satu-satunya berkas yang perlu Anda sunting
   setelah memperbarui index.html, input.html, monitoring.html,
   atau dosen.html.

   -------------------------------------------------------------------
   1. KUNCI SUPABASE
   -------------------------------------------------------------------
   Diisi dari: Supabase > Project Settings > API Keys
               tab "Publishable and secret"

   PENTING: gunakan kunci PUBLISHABLE (diawali sb_publishable_).
   JANGAN pernah menaruh kunci SECRET (sb_secret_) di berkas ini —
   berkas ini berada di repositori publik dan terbaca siapa saja.
   Kunci publishable memang dirancang untuk terlihat; keamanannya
   dijaga oleh Row Level Security di database, bukan oleh kerahasiaan
   kunci.
   ===================================================================== */

window.SB_URL = 'https://jkfgockdmnropqnfzytx.supabase.co';
window.SB_KEY = 'sb_publishable_jfOWUqB1DE5jVHdUeBh5tA_TD-s6BnK';

/* =====================================================================
   2. ALAMAT PROFIL LUAR
   -------------------------------------------------------------------
   Alamat dasar untuk menyusun tautan profil dosen. ID dosen ditempel
   di belakang nilai-nilai ini.

   Lembaga pengelola kadang mengganti domain — SINTA pernah berpindah
   dari kemdikbud ke kemdiktisaintek, dan Scopus mengubah pola
   alamatnya. Kalau suatu saat tautan tidak berfungsi, buka satu profil
   lewat peramban, salin alamatnya, lalu sesuaikan di sini. Tidak perlu
   menyentuh berkas HTML mana pun.

   Uji cepat: gabungan nilai di bawah + ID dosen harus membuka profil
   yang benar. Contoh: PROFIL_SINTA + '6688736'
   ===================================================================== */

window.PROFIL_SINTA  = 'https://sinta.kemdiktisaintek.go.id/authors/profile/';
window.PROFIL_SCOPUS = 'https://www.scopus.com/pages/authors/';
window.PROFIL_ORCID  = 'https://orcid.org/';

/* ---------------------------------------------------------------------
   UNGGAH BERKAS BUKTI ke Google Drive prodi (cv-data/apps-script).
   UPLOAD_URL     URL Web App Apps Script, berakhiran /exec.
                  Kosong = tombol unggah disembunyikan; dosen tetap bisa
                  menempel tautan seperti sebelumnya.
   UPLOAD_MAX_MB  batas ukuran satu berkas dalam MB. Samakan dengan MAX_MB
                  di Script Properties (server yang menentukan).
                  20: usulan Claude 2026-10-09, menunggu keputusan pemilik.
   UPLOAD_EXT     ekstensi yang diterima, dipisah koma. Samakan dengan
                  ALLOWED_EXT di Script Properties.
                  Usulan Claude 2026-10-09, menunggu keputusan pemilik.
   --------------------------------------------------------------------- */
window.UPLOAD_URL    = 'https://script.google.com/macros/s/AKfycbxU4uvfazqq8xutoKayfY6R7UlGBE_nDbpohZ6_DC-jO-JBPKiyInvPLKuOSUcdaLyyLQ/exec';
window.UPLOAD_MAX_MB = 20;
window.UPLOAD_EXT    = 'pdf,jpg,jpeg,png,docx,xlsx';