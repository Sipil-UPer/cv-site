// Forum pemangku kepentingan: anggota, masukan, tindak lanjut (200-patch-forum-pemangku.sql, pemilik 2026-11-27).
// Fungsi murni; dipakai forum-pemangku.html, tugas-saya.js, dan laporan-tahunan.js. Bukti butir 2, 12, dan 58.

export const KATEGORI_PEMANGKU = { industri: 'Industri', alumni: 'Alumni', pengguna_lulusan: 'Pengguna lulusan', asosiasi_profesi: 'Asosiasi profesi',
  pemerintah: 'Pemerintah', akademisi: 'Akademisi', mahasiswa: 'Mahasiswa', lainnya: 'Lainnya' };
export const SALURAN = { forum: 'Forum pemangku', rapat: 'Rapat/FGD', survei: 'Survei', kunjungan: 'Kunjungan', email: 'Surat/email', lainnya: 'Lainnya' };
export const TOPIK_MASUKAN = { vmts: 'VMTS', kurikulum: 'Kurikulum', cpl: 'CPL', pembelajaran: 'Pembelajaran', penelitian_pkm: 'Penelitian dan PkM',
  sarana: 'Sarana', kerja_sama: 'Kerja sama', lulusan: 'Lulusan', lainnya: 'Lainnya' };
export const STATUS_MASUKAN = { baru: 'Baru', dikaji: 'Dikaji', diadopsi: 'Diadopsi', tidak_diadopsi: 'Tidak diadopsi' };
export const HARI_MASUKAN = 14;   // masukan baru ditinjau dalam 14 hari; PJ diingatkan 14 hari sebelum tenggat

const tahunDari = t => +String(t || '').slice(0, 4);
const hariIni = kini => new Date(kini.getTime() + 7 * 3600e3).toISOString().slice(0, 10);
const selisih = (a, b) => Math.round((Date.parse(a) - Date.parse(b)) / 864e5);

/** Kategori sumber masukan: dari pemangku tertaut, atau sumber_kategori. */
export const kategoriSumber = (m, pemangku = []) => pemangku.find(p => p.id === m.pemangku_id)?.kategori || m.sumber_kategori || 'lainnya';

/** Rekap per tahun x topik: [{tahun, topik, masuk, dikaji, diadopsi, tidak, baru, persen}] (persen = (diadopsi + tidak) / masuk). */
export function rekapMasukan(xs = []){
  const urut = Object.keys(TOPIK_MASUKAN), m = new Map();
  for (const x of xs) {
    const k = `${tahunDari(x.tanggal)}|${x.topik}`;
    if (!m.has(k)) m.set(k, { tahun: tahunDari(x.tanggal), topik: x.topik, masuk: 0, baru: 0, dikaji: 0, diadopsi: 0, tidak: 0 });
    const r = m.get(k); r.masuk++;
    if (x.status === 'tidak_diadopsi') r.tidak++; else r[x.status]++;
  }
  return [...m.values()].map(r => ({ ...r, persen: r.masuk ? Math.round((r.diadopsi + r.tidak) / r.masuk * 100) : null }))
    .sort((a, b) => a.tahun - b.tahun || urut.indexOf(a.topik) - urut.indexOf(b.topik));
}

/** Jumlah masukan per kategori sumber pada satu tahun: {industri: n, ...}. */
export function perKategori(xs = [], pemangku = [], tahun){
  const o = {};
  for (const x of xs.filter(y => !tahun || tahunDari(y.tanggal) === tahun)) { const k = kategoriSumber(x, pemangku); o[k] = (o[k] || 0) + 1; }
  return o;
}

/** Tugas: PJ = masukan bertenggat yang belum diputuskan (<= HARI_MASUKAN hari atau lewat); pengelola = masukan baru > HARI_MASUKAN hari. */
export function tugasPemangku(xs = [], sayaId, pengelola = false, kini = new Date()){
  const t = hariIni(kini), out = [], terbuka = x => ['baru', 'dikaji'].includes(x.status);
  const pj = xs.filter(x => x.pj_dosen_id === sayaId && terbuka(x) && x.tenggat && selisih(x.tenggat, t) <= HARI_MASUKAN);
  if (pj.length) out.push({ judul: `Tindak lanjut masukan pemangku: ${pj.length}`,
    rinci: pj.map(x => `${TOPIK_MASUKAN[x.topik] || x.topik}: ${String(x.isi).slice(0, 80)} (tenggat ${x.tenggat})`).join('; '),
    hari: Math.min(...pj.map(x => selisih(x.tenggat, t))) });
  if (pengelola) {
    const lama = xs.filter(x => x.status === 'baru' && selisih(t, x.tanggal) > HARI_MASUKAN);
    if (lama.length) out.push({ judul: `Masukan pemangku belum dikaji: ${lama.length}`,
      rinci: `Tertua ${Math.max(...lama.map(x => selisih(t, x.tanggal)))} hari. Tetapkan PJ dan tenggat, lalu putuskan diadopsi atau tidak (dengan alasan).`,
      hari: HARI_MASUKAN - Math.max(...lama.map(x => selisih(t, x.tanggal))) });
  }
  return out;
}

/** CSV masukan (pemisah titik koma, BOM). sumber: baris -> nama sumber. */
export function csvMasukan(xs = [], sumber = () => '', pj = () => ''){
  const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return '﻿' + [['Tanggal', 'Sumber', 'Saluran', 'Topik', 'Masukan', 'Status', 'Tindak lanjut', 'Alasan tidak diadopsi', 'PJ', 'Tenggat', 'Bukti'],
    ...[...xs].sort((a, b) => String(a.tanggal).localeCompare(String(b.tanggal)))
      .map(x => [x.tanggal, sumber(x), SALURAN[x.saluran] || x.saluran, TOPIK_MASUKAN[x.topik] || x.topik, x.isi, STATUS_MASUKAN[x.status] || x.status,
        x.tindak_lanjut || '', x.alasan || '', pj(x), x.tenggat || '', x.bukti_url || ''])].map(r => r.map(q).join(';')).join('\r\n');
}
