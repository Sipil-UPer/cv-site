// Koordinator dan tim MK (158-patch-koordinator-tim-mk.sql, pemilik 2026-11-23): logika murni untuk koordinator-mk.html
// dan mk-saya.html, diuji di Node (tests/js/koordinator_mk.test.mjs).
//   * ref_mata_kuliah.koordinator_nidn = satu koordinator MK; ref_mata_kuliah.pengampu = seluruh tim TERMASUK koordinator;
//   * status dokumen per MK: silabus (mk_silabus.status), CPMK (mk_struktur ada), RPS (mk_rps.status, ditetapkan bila
//     tetap_pada terisi);
//   * MK universitas/fakultas (unit_penyelenggara, pemilik 2026-11-24): tanpa koordinator dan tim prodi; koordinator_nidn
//     dipakai sebagai satu koordinator prodi (boleh kosong, lalu admin). Pemilik 2026-11-26: koordinator prodi meminta silabus
//     dan RPS resmi dari universitas/fakultas dan melengkapi portofolio tingkat MK (sebelumnya "PIC prodi", hanya RPS).
//     Dosen prodi yang mengajar kelasnya dicatat di Penyusunan kelas (nilai CPL dan portofolio kelas dari sana).
import { kelompokDosen } from './dosen-hitung.js?v=2026-11-28-e24bbe';

export const LABEL_STATUS = { draf: 'draf', diajukan: 'diajukan', dikembalikan: 'dikembalikan', disahkan: 'disahkan',
  ditetapkan: 'ditetapkan', ada: 'ada', belum: 'belum' };

const kunci = (kur, kode) => `${kur || ''}|${kode || ''}`;

/** MK diselenggarakan universitas atau fakultas (MKU, MKPT, Kalkulus, Fisika Dasar, ...): PIC prodi, bukan koordinator dan tim. */
export const luarProdi = m => ['universitas', 'fakultas'].includes(m?.unit_penyelenggara);

/** Dosen yang boleh jadi koordinator/tim: punya NIDN, aktif, bukan staf/asesor. Urut nama. */
export function dosenPilihan(dosen = []){
  return dosen.filter(d => d.nidn && d.aktif !== false && !['staf', 'asesor'].includes(kelompokDosen(d)))
    .sort((a, b) => String(a.nama).localeCompare(String(b.nama)));
}

/** Pilihan koordinator MK dan koordinator prodi MKU (pemilik 2026-11-26): hanya DTPS aktif, bukan dosen tidak tetap,
 *  industri, atau yang sedang tugas belajar. Tim MK tetap memakai dosenPilihan. */
export function dosenKoordinator(dosen = []){
  return dosenPilihan(dosen).filter(d => kelompokDosen(d) === 'dtps');
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

/** Peran nidn pada MK m: 'koordinator' | 'tim' | 'pic' (MK universitas/fakultas) | null. Pada MK luar prodi hanya PIC yang
 *  berperan; sisa daftar pengampu lama (sebelum 2026-11-24) tidak dihitung dan terhapus saat disimpan ulang. */
export function peranDi(m, nidn){
  if (!nidn) return null;
  if (luarProdi(m)) return m.koordinator_nidn === nidn ? 'pic' : null;
  if (m.koordinator_nidn === nidn) return 'koordinator';
  return (m.pengampu || []).includes(nidn) ? 'tim' : null;
}

/** Ringkasan satu daftar MK aktif: MK prodi (dengan koordinator) dan MK universitas/fakultas (dengan PIC). */
export function ringkasKoordinasi(mk = []){
  const aktif = mk.filter(m => m.aktif !== false), prodi = aktif.filter(m => !luarProdi(m)), luar = aktif.filter(luarProdi);
  return { prodi: prodi.length, adaKoordinator: prodi.filter(m => m.koordinator_nidn).length,
    luar: luar.length, adaPic: luar.filter(m => m.koordinator_nidn).length };
}

/** Beban per dosen untuk MK aktif satu kurikulum: Map nidn -> { koordinator, tim, pic }. */
export function bebanDosen(mk = []){
  const out = new Map();
  for (const m of mk.filter(x => x.aktif !== false)) {
    for (const n of new Set([...(m.pengampu || []), m.koordinator_nidn].filter(Boolean))) {
      const peran = peranDi(m, n);
      if (!peran) continue;
      if (!out.has(n)) out.set(n, { koordinator: 0, tim: 0, pic: 0 });
      out.get(n)[peran] += 1;
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
  for (const m of mk.filter(x => x.kurikulum === kurBaru && x.aktif !== false && !x.koordinator_nidn && !luarProdi(x))) {
    const asal = padanan.filter(p => p.kurikulum_baru === kurBaru && p.kode_baru === m.kode)
      .map(p => lama.get(kunci(p.kurikulum_lama, p.kode_lama))).filter(Boolean);
    const koordinator = asal.find(a => a.koordinator_nidn)?.koordinator_nidn;
    if (!koordinator) continue;
    const tim = [...new Set(asal.flatMap(a => a.pengampu || []))].filter(n => n !== koordinator);
    out.push({ kode: m.kode, nama: m.nama, koordinator, tim, dari: asal.map(a => a.kode) });
  }
  return out;
}

/** MK milik satu dosen (koordinator dulu, lalu tim, lalu PIC MK universitas/fakultas), dari semua kurikulum, hanya MK aktif. */
export function mkSaya(mk = [], nidn){
  const urut = { koordinator: 0, tim: 1, pic: 2 };
  return mk.filter(m => m.aktif !== false).map(m => ({ ...m, peran: peranDi(m, nidn) })).filter(m => m.peran)
    .sort((a, b) => urut[a.peran] - urut[b.peran] || String(b.kurikulum).localeCompare(String(a.kurikulum))
      || (a.semester ?? 99) - (b.semester ?? 99) || String(a.kode).localeCompare(String(b.kode)));
}
