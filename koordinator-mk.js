// Koordinator dan tim MK (158-patch-koordinator-tim-mk.sql, pemilik 2026-11-23): logika murni untuk koordinator-mk.html
// dan mk-saya.html, diuji di Node (tests/js/koordinator_mk.test.mjs).
//   * ref_mata_kuliah.koordinator_nidn = satu koordinator MK; ref_mata_kuliah.pengampu = seluruh tim TERMASUK koordinator;
//   * status dokumen per MK: silabus (mk_silabus.status), CPMK (mk_struktur ada), RPS (mk_rps.status, ditetapkan bila
//     tetap_pada terisi).
import { kelompokDosen } from './dosen-hitung.js?v=2026-11-22-866c27';

export const LABEL_STATUS = { draf: 'draf', diajukan: 'diajukan', dikembalikan: 'dikembalikan', disahkan: 'disahkan',
  ditetapkan: 'ditetapkan', ada: 'ada', belum: 'belum' };

const kunci = (kur, kode) => `${kur || ''}|${kode || ''}`;

/** Dosen yang boleh jadi koordinator/tim: punya NIDN, aktif, bukan staf/asesor. Urut nama. */
export function dosenPilihan(dosen = []){
  return dosen.filter(d => d.nidn && d.aktif !== false && !['staf', 'asesor'].includes(kelompokDosen(d)))
    .sort((a, b) => String(a.nama).localeCompare(String(b.nama)));
}

/** Peta status dokumen per MK: Map 'kur|kode' -> { silabus, cpmk, rps } (string status, 'belum' bila tidak ada). */
export function petaStatus({ silabus = [], struktur = [], rps = [] } = {}){
  const out = new Map();
  const ambil = k => { if (!out.has(k)) out.set(k, { silabus: 'belum', cpmk: 'belum', rps: 'belum' }); return out.get(k); };
  for (const s of silabus) ambil(kunci(s.kurikulum, s.kode_mk)).silabus = s.status || 'draf';
  for (const s of struktur) ambil(kunci(s.kurikulum, s.kode_mk)).cpmk = 'ada';
  for (const r of rps) ambil(kunci(r.kurikulum, r.kode_mk)).rps = r.tetap_pada ? 'ditetapkan' : (r.status || 'draf');
  return out;
}
export const statusMK = (peta, m) => peta.get(kunci(m.kurikulum, m.kode)) || { silabus: 'belum', cpmk: 'belum', rps: 'belum' };

/** Peran nidn pada MK m: 'koordinator' | 'tim' | null. */
export function peranDi(m, nidn){
  if (!nidn) return null;
  if (m.koordinator_nidn === nidn) return 'koordinator';
  return (m.pengampu || []).includes(nidn) ? 'tim' : null;
}

/** Beban per dosen untuk MK aktif satu kurikulum: Map nidn -> { koordinator, tim }. */
export function bebanDosen(mk = []){
  const out = new Map();
  for (const m of mk.filter(x => x.aktif !== false)) {
    for (const n of new Set(m.pengampu || [])) {
      if (!out.has(n)) out.set(n, { koordinator: 0, tim: 0 });
      out.get(n)[peranDi(m, n) === 'koordinator' ? 'koordinator' : 'tim'] += 1;
    }
  }
  return out;
}

/**
 * Usulan dari kurikulum lama lewat padanan (ref_mk_padanan): untuk MK kurikulum `kurBaru` yang belum punya koordinator,
 * ambil koordinator MK lama padanannya (yang pertama punya koordinator) dan gabungan timnya.
 * -> [{ kode, nama, koordinator, tim: [nidn], dari: [kode lama] }] (hanya yang menghasilkan koordinator).
 */
export function usulanPadanan(mk = [], padanan = [], kurBaru){
  const lama = new Map(mk.map(m => [kunci(m.kurikulum, m.kode), m]));
  const out = [];
  for (const m of mk.filter(x => x.kurikulum === kurBaru && x.aktif !== false && !x.koordinator_nidn)) {
    const asal = padanan.filter(p => p.kurikulum_baru === kurBaru && p.kode_baru === m.kode)
      .map(p => lama.get(kunci(p.kurikulum_lama, p.kode_lama))).filter(Boolean);
    const koordinator = asal.find(a => a.koordinator_nidn)?.koordinator_nidn;
    if (!koordinator) continue;
    const tim = [...new Set(asal.flatMap(a => a.pengampu || []))].filter(n => n !== koordinator);
    out.push({ kode: m.kode, nama: m.nama, koordinator, tim, dari: asal.map(a => a.kode) });
  }
  return out;
}

/** MK milik satu dosen (koordinator dulu, lalu tim), dari semua kurikulum, hanya MK aktif. */
export function mkSaya(mk = [], nidn){
  const urut = { koordinator: 0, tim: 1 };
  return mk.filter(m => m.aktif !== false).map(m => ({ ...m, peran: peranDi(m, nidn) })).filter(m => m.peran)
    .sort((a, b) => urut[a.peran] - urut[b.peran] || String(b.kurikulum).localeCompare(String(a.kurikulum))
      || (a.semester ?? 99) - (b.semester ?? 99) || String(a.kode).localeCompare(String(b.kode)));
}
