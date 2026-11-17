// Koordinator prodi (97-patch-koordinator.sql, pemilik 2026-11-17): jabatan dan wewenang per bidang di sisi tampilan.
// Aturan sebenarnya di basis data (boleh_pengajuan, boleh_tabel); di sini hanya untuk menampilkan tombol dan menu yang tepat.

export const JABATAN = [['koordinator_ta', 'Koordinator TA'], ['koordinator_kp', 'Koordinator KP/Magang'],
  ['pembina_kemahasiswaan', 'Pembina kemahasiswaan'], ['kepala_lab', 'Kepala laboratorium'], ['gkm', 'Gugus kendali mutu (GKM)'],
  // 100-patch-koordinator-capstone.sql (pemilik 2026-11-17): jabatan saja dulu, tanpa wewenang tambahan.
  ['koordinator_capstone', 'Koordinator capstone design']];
export const labelJabatan = j => (JABATAN.find(x => x[0] === j) || [, j])[1];

// Jenis pengajuan mahasiswa -> jabatan yang menggantikan admin (surat: admin saja).
const PENGAJUAN = { ta: 'koordinator_ta', kp: 'koordinator_kp', lomba: 'pembina_kemahasiswaan', luaran: 'pembina_kemahasiswaan' };
// Tab Data prodi per jabatan (boleh_tabel di basis data).
export const TAB_KOORDINATOR = { koordinator_ta: ['jadwal_ta'], pembina_kemahasiswaan: ['prestasi', 'publikasi', 'luaran'],
  // GKM (98-patch-koordinator-mutu-lab.sql): tab mutu Data prodi.
  gkm: ['dokumen', 'spmi', 'standar', 'revisi', 'temuan', 'target', 'kepuasan'] };

const hariIni = (kini = new Date()) => kini.toISOString().slice(0, 10);
// Penugasan yang berlaku pada tanggal itu (mulai <= hari ini <= selesai, selesai kosong = tanpa batas).
export const aktifPada = (rows, kini = new Date()) =>
  (rows || []).filter(k => k.mulai && k.mulai <= hariIni(kini) && (!k.selesai || k.selesai >= hariIni(kini)));

export const punya = (s, j) => (s?.koordinator || []).includes(j);
// Modul mutu dan akreditasi (98): admin atau GKM aktif.
export const bolehMutu = s => s?.peran === 'admin' || punya(s, 'gkm');
// Sebutan peran (pemilik 2026-11-17): admin dosen = Koordinator prodi; admin bukan dosen = Admin prodi.
export const labelPeran = s => s?.peran === 'admin' ? (s.dtps || s.kategori ? 'Koordinator prodi' : 'Admin prodi')
  : (s?.koordinator || []).map(labelJabatan).join(', ') || (s?.peran === 'pimpinan' ? 'Pimpinan' : s?.peran === 'asesor' ? 'Asesor' : 'Dosen');
// Jabatan aktif seorang dosen (untuk halaman yang membaca dosen sendiri, tanpa pengguna() dari menu.js).
export async function jabatanSaya(sb, dosenId){
  if (!dosenId) return [];
  const r = await sb.from('koordinator').select('jabatan,laboratorium_id,mulai,selesai').eq('dosen_id', dosenId);
  return r.error ? [] : aktifPada(r.data).map(k => k.jabatan);
}
export const bolehPengajuan = (s, jenis) => s?.peran === 'admin' || (!!PENGAJUAN[jenis] && punya(s, PENGAJUAN[jenis]));
// null = semua tab (admin); Set kosong = tidak ada tab.
export const tabBoleh = s => s?.peran === 'admin' ? null
  : new Set(Object.entries(TAB_KOORDINATOR).filter(([j]) => punya(s, j)).flatMap(([, t]) => t));
