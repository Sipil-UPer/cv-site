// Modul yang bisa dimatikan per situs (pemilik 2026-11-12: templat khusus akreditasi).
// Daftar yang mati ada di config.js (window.FITUR_MATI), ditulis install.py dari pilihan
// paket. Skema database tetap lengkap; modul yang mati hanya disembunyikan dari menu,
// tautan, Monitoring, dan Panduan, dan halamannya menampilkan "tidak diaktifkan".
// Dipakai menu.js, ruang-kerja.html, index.html, dosen.html, monitoring.html, panduan.html.

export const MODUL_OPSIONAL = {
  rapat: 'Rapat dan notulen', hibah: 'Pengajuan hibah', kalender: 'Kalender kegiatan',
  pengingat: 'Pengingat email', kepakaran: 'Kepakaran dosen', sdgs: 'Rekap SDGs',
  // Templat khusus akreditasi (pemilik 2026-11-23): operasional prodi dan situs publik juga bisa dimatikan.
  kemahasiswaan: 'Layanan dan pengajuan mahasiswa (KP, TA, lomba, surat)', jadwal: 'Jadwal kuliah dan jadwal berhalangan',
  kabar: 'Kabar kegiatan', profil_prodi: 'Kelola profil prodi dan laboratorium',
  publik: 'Situs publik (beranda, daftar dosen, kurikulum, kinerja, dan halaman umum lain)',
};
// Paket yang ditawarkan install.py (keputusan pemilik 2026-11-12). Samakan dengan
// PAKET di tools/install.py (diuji tests/test_install.py).
export const PAKET = {
  lengkap: [],
  // Khusus akreditasi (pemilik 2026-11-23): ruang kerja akreditasi + kurikulum/CPL/RPS saja, tanpa situs publik.
  akreditasi: ['rapat', 'hibah', 'kalender', 'pengingat', 'kepakaran', 'sdgs', 'kemahasiswaan', 'jadwal', 'kabar', 'profil_prodi', 'publik'],
};
const HALAMAN = {
  'rapat.html': 'rapat', 'hadir.html': 'rapat', 'hibah.html': 'hibah', 'kalender.html': 'kalender',
  'pengingat.html': 'pengingat', 'keahlian.html': 'kepakaran', 'sdgs.html': 'sdgs', 'sdgs-bukti.html': 'sdgs',
  'pengajuan-mahasiswa.html': 'kemahasiswaan', 'rekap-ta.html': 'kemahasiswaan', 'rekap-kp.html': 'kemahasiswaan',
  'kelola-layanan-mahasiswa.html': 'kemahasiswaan', 'kelola-mahasiswa.html': 'kemahasiswaan', 'pengajuan.html': 'kemahasiswaan',
  'berkas-mahasiswa.html': 'kemahasiswaan', 'kp.html': 'kemahasiswaan', 'kerja-praktik.html': 'kemahasiswaan',
  'layanan-mahasiswa.html': 'kemahasiswaan',
  'jadwal-kuliah.html': 'jadwal', 'jadwal-berhalangan.html': 'jadwal', 'kabar-kegiatan.html': 'kabar',
  'kelola-profil.html': 'profil_prodi', 'kelola-laboratorium.html': 'profil_prodi',
  // Situs publik. Tetap hidup walau situs publik mati: survei.html (kuesioner akreditasi), lkd.html (bukti privat untuk
  // asesor), verifikasi-rps.html (QR RPS), hasil-survei.html (ruang kerja), privasi.html, ruang-kerja.html.
  'index.html': 'publik', 'daftar.html': 'publik', 'dosen.html': 'publik', 'kinerja.html': 'publik', 'kurikulum.html': 'publik',
  'mitra.html': 'publik', 'kerja-sama.html': 'publik', 'profil-prodi.html': 'publik', 'laboratorium.html': 'publik',
  'prestasi.html': 'publik', 'kabar.html': 'publik', 'galeri.html': 'publik', 'peta-situs.html': 'publik',
  'calon-mahasiswa.html': 'publik', 'ekuivalensi-kurikulum.html': 'publik', 'alumni.html': 'publik', 'english.html': 'publik',
  'tugas-akhir.html': 'publik', 'kontak.html': 'publik', 'biaya-beasiswa.html': 'publik',
  'kunjungan-situs.html': 'publik', 'kelengkapan-situs.html': 'publik',
};

const berkas = href => String(href ?? '').split(/[?#]/)[0].split('/').pop() || 'index.html';
const mati = () => (Array.isArray(globalThis.FITUR_MATI) ? globalThis.FITUR_MATI : []);

/** true bila modul k menyala (k kosong = bukan modul opsional). */
export const fiturAktif = k => !k || !mati().includes(k);
/** Modul opsional pemilik halaman href, atau null. */
export const fiturHalaman = href => HALAMAN[berkas(href)] || null;
/** true bila halaman href boleh ditautkan (modulnya menyala atau bukan modul opsional). */
export const halamanAktif = href => fiturAktif(fiturHalaman(href));

/**
 * Halaman tanpa gerbang menu.js yang modulnya mati dialihkan (pemilik 2026-11-23): ke ruang kerja bila situs publik
 * mati, selain itu ke beranda. Hasil true = sedang dialihkan (halaman berhenti).
 */
export function alihkanBilaMati(){
  if (halamanAktif(globalThis.location?.pathname)) return false;
  globalThis.location.replace(fiturAktif('publik') ? 'index.html' : 'ruang-kerja.html');
  return true;
}

/**
 * Untuk halaman modul opsional yang tidak lewat gerbang menu.js (halaman publik):
 * bila modulnya mati, isi <main> diganti pesan dan hasilnya false (halaman berhenti).
 */
export function jagaHalaman(){
  if (halamanAktif(globalThis.location?.pathname)) return true;
  const el = document.querySelector('main') || document.body;
  el.innerHTML = `<p style="margin:24px 0;color:var(--muted)">Modul ini tidak diaktifkan di situs ini.
    <a href="index.html">Kembali ke beranda</a>.</p>`;
  return false;
}
