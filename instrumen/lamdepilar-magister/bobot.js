/* ====================================================================
   BOBOT ELEMEN — Buku 4 Tabel 3, kolom Akademik Magister
   IAPS DEPILAR 1.0 (Peraturan LAMDEPILAR No. 10/2026), Program Magister
   akademik, instrumen Perolehan Status Terakreditasi. Dibangkitkan
   2026-11-24 dari dokumen resmi (lamdepilar.or.id); lihat instrumen.json.
   Id butir 101-130 = elemen D.1 ... R.6 (pemilik 2026-11-24): nomor butir
   LAM Teknik (1-60) tertulis langsung di modul umum, jadi id ini sengaja
   tidak bertabrakan dengan nomor itu.

   Bobot tiap elemen (jumlah 100). NA = Σ(bobot × skor). Skor elemen pada
   instrumen perolehan status: 0-3 (Lampiran 3 tidak memuat kolom
   "Melampaui"), jadi NA paling tinggi 300.
   ==================================================================== */

export const BOBOT = {
  // D Diferensiasi Misi (10)
  '101': 1, '102': 4, '103': 5,   // D.1, D.2, D.3
  // E Edukasi, Sistem Evaluasi, dan Capaian Pembelajaran (10)
  '104': 2, '105': 2, '106': 2, '107': 2, '108': 2,   // E.1, E.2, E.3, E.4, E.5
  // P Pengembangan Sumber Daya Manusia (15)
  '109': 5, '110': 3, '111': 5, '112': 2,   // P.1, P.2, P.3, P.4
  // I Internalisasi Penjaminan Mutu (10)
  '113': 2, '114': 3, '115': 5,   // I.1, I.2, I.3
  // L Lingkungan dan Sumber Belajar serta Pendukung Mahasiswa (15)
  '116': 5, '117': 4, '118': 3, '119': 3,   // L.1, L.2, L.3, L.4
  // A Akuntabilitas dan Tata Kelola (10)
  '120': 2, '121': 2, '122': 2, '123': 2, '124': 2,   // A.1, A.2, A.3, A.4, A.5
  // R Riset, Pengabdian kepada Masyarakat, dan Suasana Ilmiah (30)
  '125': 3, '126': 6, '127': 10, '128': 2, '129': 3, '130': 6,   // R.1, R.2, R.3, R.4, R.5, R.6
};

export const BOBOT_TOTAL =
  Object.values(BOBOT).reduce((a, b) => a + b, 0);

export const bobotButir = no => BOBOT[String(no)] ?? 0;

// Skor tertinggi satu elemen: Lampiran 3 (perolehan status) berhenti di 3 =
// Memenuhi; skor 4 (Melampaui Standar) hanya ada di Lampiran 1 untuk Unggul.
export const SKOR_MAKS = 3;

// Teks rujukan di halaman Skor: label kartu dan kaki halaman.
export const NAMA_INSTRUMEN = 'IAPS DEPILAR 1.0';
// 2026-11-25: nomor butir 1-60 di modul umum milik LAM Teknik: halaman menyembunyikan bagian itu (elemen ini 101-130).
export const BUTIR_LAM_TEKNIK = false;
export const SUMBER_RUMUS = 'rubrik Lampiran 3 Buku 4 IAPS DEPILAR 1.0 (perolehan status), bobot Tabel 3 ' +
  'kolom Akademik Magister';
