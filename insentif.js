// Klaim insentif publikasi (163-patch-insentif-publikasi.sql, pemilik 2026-11-24). Logika murni untuk karya.html,
// insentif.html, dan Tugas saya; diuji di tests/js/insentif.test.mjs. Aturan sama dengan basis data (yang menentukan):
//   * satu klaim per publikasi, oleh salah satu penulisnya; hanya publikasi bertahun terbit = tahun berjalan (WIB);
//   * berkas wajib di bukti karya: artikel ('naskah'), bukti indeksasi, LoA/bukti terbit, surat pernyataan;
//   * status: diklaim -> (dikembalikan -> diklaim) -> siap -> diajukan -> disetujui | ditolak; disetujui -> cair.

import { urlDoi } from './tautan-publikasi.js?v=2026-11-28-2b6b3c';

export const BERKAS_INSENTIF = [['naskah', 'Artikel (PDF)'], ['indeksasi', 'Bukti indeksasi'], ['loa', 'LoA / bukti terbit'],
  ['pernyataan', 'Surat pernyataan']];
export const STATUS_INSENTIF = {
  diklaim: 'Diklaim, menunggu pemeriksaan prodi', dikembalikan: 'Dikembalikan, perlu diperbaiki', siap: 'Siap diajukan ke fakultas',
  diajukan: 'Diajukan ke fakultas', disetujui: 'Disetujui fakultas', ditolak: 'Ditolak fakultas', cair: 'Insentif cair',
};

/** Tahun berjalan menurut WIB (UTC+7), sama dengan basis data. */
export const tahunWIB = (kini = new Date()) => new Date(kini.getTime() + 7 * 3600e3).getUTCFullYear();

/** Berkas wajib yang belum ada di daftar bukti karya ([{jenis}]); urut sama dengan insentif_berkas_kurang. */
export const berkasKurang = (bukti = []) => BERKAS_INSENTIF.filter(([j]) => !bukti.some(b => b.jenis === j)).map(([j]) => j);
export const labelBerkas = j => (BERKAS_INSENTIF.find(b => b[0] === j) || [j, j])[1];

/**
 * Boleh mengklaim? karya {kategori, tahun, status}; sayaPenulis = pengguna ini penulis karya itu; klaim = baris
 * insentif_publikasi karya itu (atau null); sayaId = dosen.id pengguna. Hasil { boleh, alasan }.
 */
export function bolehKlaim(karya, { sayaPenulis, klaim = null, sayaId = null, kini = new Date() } = {}){
  if (!karya || karya.kategori !== 'publikasi') return { boleh: false, alasan: 'Insentif hanya untuk publikasi.' };
  if (+karya.tahun !== tahunWIB(kini)) return { boleh: false, alasan: `Insentif hanya untuk publikasi terbit tahun ${tahunWIB(kini)}.` };
  if (!sayaPenulis) return { boleh: false, alasan: 'Hanya penulis publikasi ini yang bisa mengklaim.' };
  if (karya.status === 'ditolak') return { boleh: false, alasan: 'Publikasi ini ditolak verifikasi; perbaiki dulu.' };
  if (klaim && klaim.pengklaim_id !== sayaId) return { boleh: false, alasan: 'Sudah diklaim penulis lain (satu klaim per publikasi).' };
  if (klaim && klaim.status !== 'dikembalikan') return { boleh: false, alasan: '' };
  return { boleh: true, alasan: '' };
}

/** Langkah berikut untuk pengklaim, satu kalimat (dipakai karya.html dan Tugas saya). */
export function langkahPengklaim(klaim, karya, bukti = []){
  if (!klaim) return '';
  const kurang = berkasKurang(bukti).map(labelBerkas);
  if (klaim.status === 'dikembalikan') return `Perbaiki sesuai catatan prodi${klaim.catatan ? ` ("${klaim.catatan}")` : ''}, lalu klik Klaim ulang.`;
  if (klaim.status === 'diklaim') return [kurang.length ? `Unggah ${kurang.join(', ')} di bukti karya.` : '',
    karya?.status !== 'terverifikasi' ? 'Menunggu verifikasi publikasi.' : '', !kurang.length && karya?.status === 'terverifikasi'
      ? 'Lengkap; menunggu pemeriksaan prodi.' : ''].filter(Boolean).join(' ');
  return '';
}

/**
 * Tugas saya. d = { saya: {id}, klaim: insentif_publikasi yang terbaca, karya: Map id -> {judul, status}, bukti: Map karya_id -> [{jenis}],
 * pengelola: boolean (admin/Kaprodi aktif) }. Hasil [{ jenis, judul, rinci, href }].
 */
export function tugasInsentif(d){
  const out = [], milik = (d.klaim || []).filter(k => k.pengklaim_id === d.saya?.id);
  const kembali = milik.filter(k => k.status === 'dikembalikan');
  if (kembali.length) out.push({ jenis: 'insentif', judul: `Insentif publikasi: ${kembali.length} klaim dikembalikan prodi`,
    rinci: kembali.map(k => `${d.karya?.get(k.karya_id)?.judul || 'Publikasi'}${k.catatan ? `: ${k.catatan}` : ''}`).join('; ') + '.', href: 'insentif.html' });
  const kurang = milik.filter(k => k.status === 'diklaim' && berkasKurang(d.bukti?.get(k.karya_id) || []).length);
  if (kurang.length) out.push({ jenis: 'insentif', judul: `Insentif publikasi: berkas ${kurang.length} klaim belum lengkap`,
    rinci: kurang.map(k => `${d.karya?.get(k.karya_id)?.judul || 'Publikasi'} (kurang: ${berkasKurang(d.bukti?.get(k.karya_id) || []).map(labelBerkas).join(', ')})`)
      .join('; ') + '.', href: 'karya.html' });
  if (d.pengelola) {
    const periksa = (d.klaim || []).filter(k => k.status === 'diklaim');
    if (periksa.length) out.push({ jenis: 'insentif', judul: `Insentif publikasi: ${periksa.length} klaim menunggu pemeriksaan`,
      rinci: 'Periksa berkas dan verifikasi publikasinya, lalu tandai siap atau kembalikan.', href: 'insentif.html' });
  }
  return out;
}

/** Rekap Excel satu pengajuan ke fakultas (format umum; format fakultas menyusul). Baris pertama = judul kolom. */
export function barisExcel(klaim = [], karya = new Map(), bukti = new Map(), dosen = new Map()){
  const url = b => b.find(x => x)?.url || '';
  const kepala = ['No', 'Pengklaim', 'NIDN', 'Judul', 'Penulis', 'Jurnal/penerbit', 'Volume/Nomor/Halaman', 'Tahun', 'Indeksasi', 'DOI/URL',
    ...BERKAS_INSENTIF.map(b => b[1]), 'Status'];
  return [kepala, ...klaim.map((k, i) => {
    const p = karya.get(k.karya_id) || {}, bs = bukti.get(k.karya_id) || [], d = dosen.get(k.pengklaim_id) || {};
    return [i + 1, d.nama || '', d.nidn || '', p.judul || '', (p.penulis || []).join(', '), p.nama_terbitan || '',
      [p.volume && 'Vol. ' + p.volume, p.nomor && 'No. ' + p.nomor, p.halaman && 'hlm. ' + p.halaman].filter(Boolean).join(' '),
      p.tahun || '', p.indeksasi || '', urlDoi(p.doi) || p.url || '',
      ...BERKAS_INSENTIF.map(([j]) => url(bs.filter(b => b.jenis === j))), STATUS_INSENTIF[k.status] || k.status];
  })];
}
