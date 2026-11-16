// Modul yang bisa dimatikan per situs (pemilik 2026-11-12: templat khusus akreditasi).
// Daftar yang mati ada di config.js (window.FITUR_MATI), ditulis install.py dari pilihan
// paket. Skema database tetap lengkap; modul yang mati hanya disembunyikan dari menu,
// tautan, Monitoring, dan Panduan, dan halamannya menampilkan "tidak diaktifkan".
// Dipakai menu.js, ruang-kerja.html, index.html, dosen.html, monitoring.html, panduan.html.

export const MODUL_OPSIONAL = {
  rapat: 'Rapat dan notulen', hibah: 'Pengajuan hibah', kalender: 'Kalender kegiatan',
  pengingat: 'Pengingat email', kepakaran: 'Kepakaran dosen', sdgs: 'Rekap SDGs',
};
// Paket yang ditawarkan install.py (keputusan pemilik 2026-11-12). Samakan dengan
// PAKET di tools/install.py (diuji tests/test_install.py).
export const PAKET = {
  lengkap: [],
  akreditasi: ['rapat', 'hibah', 'kalender', 'pengingat', 'kepakaran', 'sdgs'],
};
const HALAMAN = {
  'rapat.html': 'rapat', 'hadir.html': 'rapat', 'hibah.html': 'hibah', 'kalender.html': 'kalender',
  'pengingat.html': 'pengingat', 'keahlian.html': 'kepakaran', 'sdgs.html': 'sdgs',
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
