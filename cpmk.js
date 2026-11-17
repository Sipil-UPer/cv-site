// CPMK dan RPS per mata kuliah (102-patch-cpmk-rps.sql, pemilik 2026-11-17, OBE tahap O2): logika halaman cpmk.html.
// Tanpa impor dan tanpa DOM, supaya bisa dites di Node (tests/js/cpmk.test.mjs).
//
// Indikator CPL sebuah MK:
//   K26: ref_cpl.indikator berisi daftar bernomor ("1. ... 2. ..."), ref_mk_cpl.indikator kosong -> semua indikator CPL itu;
//   K21: ref_cpl.indikator kosong, ref_mk_cpl.indikator berisi kode ("a-1, a-2") -> indikator itu saja (teks bila ada);
//   keduanya kosong -> satu indikator per CPL bernomor 1 dengan teks rumusan CPL.
// Kode indikator di templat: <kode CPL><nomor>, mis. A1, A2, a5 (kolom B templat = CPL induk).

export const VERSI = '2026-11-17-796e64';
export const strukturKosong = () => ({ versi: VERSI, cpmk: [], sub: [], asesmen: [], bobot: {} });

/** "1. Menunjukkan ... 2. Menentukan ..." -> ['Menunjukkan ...', 'Menentukan ...']; teks tanpa nomor -> [teks]. */
export function uraiIndikator(teks){
  const s = String(teks || '').trim();
  if (!s) return [];
  const bagian = s.split(/(?:^|\s)(\d{1,2})[.)]\s+/).slice(1);
  if (!bagian.length) return [s];
  const out = [];
  for (let i = 0; i < bagian.length; i += 2) out[+bagian[i] - 1] = String(bagian[i + 1] || '').trim();
  return out;
}

/** "a-1, a-2,c 5" -> [1, 2, 5] untuk CPL a (kode lain diabaikan). */
const nomorIndikator = (teks, cpl) => [...String(teks || '').matchAll(/([A-Za-z0-9]+)\s*[-._ ]?\s*(\d{1,2})/g)]
  .filter(m => m[1].toLowerCase() === String(cpl).toLowerCase()).map(m => +m[2]);

/**
 * CPL dan indikator untuk satu MK. refCpl: baris ref_cpl {kurikulum, kode, rumusan, indikator, urutan};
 * refMkCpl: baris ref_mk_cpl {kurikulum, kode_mk, cpl, indikator}. Hasil { cpl: [{kode, rumusan}], indikator: [{kode, cpl, teks}] }.
 */
export function cplMK(refCpl, refMkCpl, kurikulum, kodeMk){
  const peta = (refMkCpl || []).filter(x => x.kurikulum === kurikulum && x.kode_mk === kodeMk);
  const cpl = (refCpl || []).filter(c => c.kurikulum === kurikulum && peta.some(p => p.cpl === c.kode))
    .sort((a, b) => (a.urutan ?? 100) - (b.urutan ?? 100) || String(a.kode).localeCompare(String(b.kode)));
  const indikator = [];
  for (const c of cpl) {
    const teks = uraiIndikator(c.indikator), dipilih = nomorIndikator(peta.find(p => p.cpl === c.kode)?.indikator, c.kode);
    const nomor = dipilih.length ? [...new Set(dipilih)].sort((a, b) => a - b) : teks.length ? teks.map((_, i) => i + 1).filter(i => teks[i - 1]) : [1];
    for (const n of nomor) indikator.push({ kode: `${c.kode}${n}`, cpl: c.kode, teks: teks[n - 1] || (teks.length || dipilih.length ? '' : c.rumusan) });
  }
  return { cpl: cpl.map(c => ({ kode: c.kode, rumusan: c.rumusan })), indikator };
}

const nomorBaru = (kode, awalan) => Math.max(0, ...kode.map(k => +(String(k).match(new RegExp(`^${awalan}(\\d+)`))?.[1] || 0))) + 1;

export function tambahCpmk(d){
  if (d.cpmk.length >= 10) throw new Error('Paling banyak 10 CPMK di templat.');
  const kode = `CPMK-${nomorBaru(d.cpmk.map(c => c.kode), 'CPMK-')}`;
  d.cpmk.push({ kode, rumusan: '', indikator: {} });
  return kode;
}
export function hapusCpmk(d, kode){
  for (const s of d.sub.filter(s => s.cpmk === kode)) delete d.bobot[s.kode];
  d.sub = d.sub.filter(s => s.cpmk !== kode);
  d.cpmk = d.cpmk.filter(c => c.kode !== kode);
}
export function tambahSub(d, cpmk){
  if (d.sub.length >= 50) throw new Error('Paling banyak 50 Sub-CPMK di templat.');
  const n = cpmk.replace(/^CPMK-/, '');
  const kode = `Sub-CPMK-${n}-${nomorBaru(d.sub.filter(s => s.cpmk === cpmk).map(s => s.kode), `Sub-CPMK-${n}-`)}`;
  // Urut menurut CPMK induk supaya templat mudah dibaca.
  const i = d.sub.map(s => s.cpmk).lastIndexOf(cpmk);
  d.sub.splice(i < 0 ? d.sub.length : i + 1, 0, { kode, cpmk, rumusan: '' });
  return kode;
}
export function hapusSub(d, kode){ d.sub = d.sub.filter(s => s.kode !== kode); delete d.bobot[kode]; }
export function tambahAsesmen(d, nama){
  nama = String(nama || '').trim().replace(/\s+/g, ' ');
  if (!nama) throw new Error('Isi nama butir asesmen (mis. Tugas 1, Kuis 1, UTS).');
  if (d.asesmen.length >= 50) throw new Error('Paling banyak 50 butir asesmen di templat.');
  if (d.asesmen.some(a => a.nama.toLowerCase() === nama.toLowerCase())) throw new Error(`Butir "${nama}" sudah ada.`);
  d.asesmen.push({ nama });
}
export function hapusAsesmen(d, nama){
  d.asesmen = d.asesmen.filter(a => a.nama !== nama);
  for (const b of Object.values(d.bobot)) delete b[nama];
}
export function gantiNamaAsesmen(d, lama, baru){
  baru = String(baru || '').trim().replace(/\s+/g, ' ');
  if (!baru || baru === lama) return;
  if (d.asesmen.some(a => a.nama.toLowerCase() === baru.toLowerCase())) throw new Error(`Butir "${baru}" sudah ada.`);
  d.asesmen.find(a => a.nama === lama).nama = baru;
  for (const b of Object.values(d.bobot)) if (lama in b) { b[baru] = b[lama]; delete b[lama]; }
}
/** Atur bobot; '' atau 0 = hapus. */
export function aturBobot(obj, kunci, nilai){
  const v = String(nilai ?? '').trim().replace(',', '.');
  if (v === '' || +v === 0) { delete obj[kunci]; return; }
  if (!Number.isFinite(+v) || +v < 0) throw new Error('Bobot harus angka ≥ 0.');
  obj[kunci] = +v;
}

/** Jumlah bobot per butir asesmen (kolom) dan total; untuk ditampilkan di bawah matriks. */
export function jumlahBobot(d){
  const kolom = Object.fromEntries(d.asesmen.map(a => [a.nama, 0]));
  for (const s of d.sub) for (const [a, v] of Object.entries(d.bobot[s.kode] || {})) if (a in kolom) kolom[a] += +v;
  return { kolom, total: Object.values(kolom).reduce((x, y) => x + y, 0) };
}

/** Struktur untuk templat-cpl.js isiTemplat: CPL dan indikator MK + struktur tersimpan (hanya indikator MK itu). */
export function dataTemplat(d, cplInd){
  const ind = new Set(cplInd.indikator.map(i => i.kode));
  return { ...cplInd, cpmk: d.cpmk.map(c => ({ ...c, indikator: Object.fromEntries(Object.entries(c.indikator || {}).filter(([k]) => ind.has(k))) })),
           sub: d.sub, asesmen: d.asesmen, bobot: d.bobot };
}

/** Status untuk daftar: 'kosong' | 'belum' (ada galat) | 'lengkap'. galat dari templat-cpl.js periksaStruktur. */
export function statusStruktur(d, galat){
  if (!d || !d.cpmk?.length) return 'kosong';
  if (d.cpmk.some(c => !String(c.rumusan || '').trim()) || d.sub.some(s => !String(s.rumusan || '').trim())) return 'belum';
  return galat.length ? 'belum' : 'lengkap';
}
