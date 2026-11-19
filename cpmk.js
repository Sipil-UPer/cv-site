// CPMK dan RPS per mata kuliah (102-patch-cpmk-rps.sql, pemilik 2026-11-17, OBE tahap O2): logika halaman cpmk.html.
// Tanpa impor dan tanpa DOM, supaya bisa dites di Node (tests/js/cpmk.test.mjs).
//
// Indikator CPL sebuah MK:
//   K26: ref_cpl.indikator berisi daftar bernomor ("1. ... 2. ..."), ref_mk_cpl.indikator kosong -> semua indikator CPL itu;
//   K21: ref_cpl.indikator kosong, ref_mk_cpl.indikator berisi kode ("a-1, a-2") -> indikator itu saja (teks bila ada);
//   keduanya kosong -> satu indikator per CPL bernomor 1 dengan teks rumusan CPL.
// Kode indikator di templat: <kode CPL><nomor>, mis. A1, A2, a5 (kolom B templat = CPL induk).

// Versi bentuk data mk_struktur.data; constraint 102 mewajibkan '1'. Sengaja BUKAN bernama VERSI: stamp_versions.py
// menimpa konstanta bernama VERSI dengan cap versi situs, sehingga simpan ditolak database (galat 2026-11-17 s.d. 11-18).
export const VERSI_DATA = '1';
export const strukturKosong = () => ({ versi: VERSI_DATA, cpmk: [], sub: [], asesmen: [], bobot: {} });

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
export function hapusSub(d, kode){ d.sub = d.sub.filter(s => s.kode !== kode); delete d.bobot[kode];
  if (d.hitung) { delete d.hitung.sub?.[kode]; delete d.hitung.sel?.[kode]; } }
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
  if (d.hitung) { delete d.hitung.asesmen?.[nama]; for (const k in d.hitung.sel || {}) d.hitung.sel[k] = d.hitung.sel[k].filter(n => n !== nama); }
}
export function gantiNamaAsesmen(d, lama, baru){
  baru = String(baru || '').trim().replace(/\s+/g, ' ');
  if (!baru || baru === lama) return;
  if (d.asesmen.some(a => a.nama.toLowerCase() === baru.toLowerCase())) throw new Error(`Butir "${baru}" sudah ada.`);
  d.asesmen.find(a => a.nama === lama).nama = baru;
  for (const b of Object.values(d.bobot)) if (lama in b) { b[baru] = b[lama]; delete b[lama]; }
  if (d.hitung) {   // target dan centang hitung otomatis ikut nama baru
    if (d.hitung.asesmen && lama in d.hitung.asesmen) { d.hitung.asesmen[baru] = d.hitung.asesmen[lama]; delete d.hitung.asesmen[lama]; }
    for (const k in d.hitung.sel || {}) d.hitung.sel[k] = d.hitung.sel[k].map(n => (n === lama ? baru : n));
  }
}
/** Atur bobot; '' atau 0 = hapus. */
export function aturBobot(obj, kunci, nilai){
  const v = String(nilai ?? '').trim().replace(',', '.');
  if (v === '' || +v === 0) { delete obj[kunci]; return; }
  if (!Number.isFinite(+v) || +v < 0) throw new Error('Bobot harus angka ≥ 0.');
  obj[kunci] = +v;
}

// ---------- Hitung bobot otomatis (pemilik 2026-11-19) ----------
// Cara hitung "Simulator Pemetaan Sub-CPMK" Universitas Pertamina (Pedoman Perencanaan Pembelajaran, Lampiran I dan III):
// target komposisi asesmen (kolom, primer) dan target Sub-CPMK (baris, sekunder) berupa rasio yang dinormalkan ke 100%;
// sel yang dicentang diseimbangkan bertahap (IPF/RAS) sampai sisi prioritas tepat, lalu dibulatkan terkendali
// (sisa terbesar; sisi prioritas tetap tepat). Disimpan di data.hitung:
//   { mode: 'otomatis'|'manual', prioritas: 'asesmen'|'sub', bulat: 1|0.5|0.1, asesmen: {butir: rasio}, sub: {kode: rasio},
//     sel: {kode Sub-CPMK: [butir]} }
export const MODE_HITUNG = [['otomatis', 'Otomatis'], ['manual', 'Manual']];
export const PRIORITAS = [['asesmen', 'Komposisi asesmen (primer)'], ['sub', 'Komposisi Sub-CPMK (sekunder)']];
export const PEMBULATAN = [[1, '1%'], [0.5, '0,5%'], [0.1, '0,1%']];
const nil = v => { const x = +String(v ?? '').replace(',', '.'); return Number.isFinite(x) && x > 0 ? x : 0; };

/** Rasio -> persen berjumlah 100 (semua nol: dibagi rata). */
export function normalisasi(xs){
  const t = xs.reduce((a, b) => a + nil(b), 0);
  return t > 0 ? xs.map(v => nil(v) / t * 100) : xs.map(() => (xs.length ? 100 / xs.length : 0));
}

/** Penyeimbangan bertahap baris/kolom pada sel yang dicentang; sisi prioritas diselesaikan terakhir (tepat). */
export function seimbangkan(rowT, colT, mask, prioritas = 'asesmen'){
  const n = rowT.length, m = colT.length;
  const X = rowT.map((r, i) => colT.map((c, j) => (mask[i][j] && r > 0 && c > 0 ? r * c / 100 : 0)));
  const baris = () => { for (let i = 0; i < n; i++) { const s = X[i].reduce((a, b) => a + b, 0); if (s > 0) for (let j = 0; j < m; j++) X[i][j] *= rowT[i] / s; } };
  const kolom = () => { for (let j = 0; j < m; j++) { let s = 0; for (let i = 0; i < n; i++) s += X[i][j]; if (s > 0) for (let i = 0; i < n; i++) X[i][j] *= colT[j] / s; } };
  for (let it = 0; it < 3000; it++) {
    if (prioritas === 'sub') { kolom(); baris(); } else { baris(); kolom(); }
    let err = 0;
    if (prioritas === 'sub') for (let j = 0; j < m; j++) { let s = 0; for (let i = 0; i < n; i++) s += X[i][j]; if (s > 0) err = Math.max(err, Math.abs(s - colT[j])); }
    else for (let i = 0; i < n; i++) { const s = X[i].reduce((a, b) => a + b, 0); if (s > 0) err = Math.max(err, Math.abs(s - rowT[i])); }
    if (err < 1e-9) break;
  }
  const tot = X.flat().reduce((a, b) => a + b, 0);
  if (tot > 0) for (const r of X) for (let j = 0; j < m; j++) r[j] *= 100 / tot;
  return X;
}

/** Pembulatan sisa terbesar: vals dibulatkan ke kelipatan step dengan jumlah tepat total. */
export function bulatSisa(vals, total, step){
  const units = Math.round(total / step); let dasar = 0;
  const o = vals.map((v, k) => { const b = Math.floor(v / step + 1e-9); dasar += b; return { k, b, f: v / step - b, v }; });
  let sisa = units - dasar;
  for (const x of o.filter(x => x.v > 0).sort((a, b) => b.f - a.f)) { if (sisa <= 0) break; x.b++; sisa--; }
  return o.map(x => +(x.b * step).toFixed(4));
}

/** Pembulatan terkendali matriks: sisi prioritas tepat, sisi lain diperbaiki dengan memindah satu langkah dalam satu kolom/baris. */
export function bulatkanMatriks(X, step = 1, prioritas = 'asesmen'){
  const T = M => (M.length ? M[0].map((_, j) => M.map(r => r[j])) : []);
  const sub = prioritas === 'sub', A = sub ? T(X) : X;
  const n = A.length, m = n ? A[0].length : 0;
  const cs = Array.from({ length: m }, (_, j) => A.reduce((t, r) => t + r[j], 0));
  const cr = bulatSisa(cs, cs.reduce((a, b) => a + b, 0), step);
  const Y = A.map(r => r.map(() => 0));
  for (let j = 0; j < m; j++) bulatSisa(A.map(r => r[j]), cr[j], step).forEach((v, i) => { Y[i][j] = v; });
  const rs = A.map(r => r.reduce((a, b) => a + b, 0)), rt = bulatSisa(rs, rs.reduce((a, b) => a + b, 0), step);
  for (let g = 0; g < 2000; g++) {
    const d = Y.map((r, i) => Math.round((r.reduce((a, b) => a + b, 0) - rt[i]) / step));
    let best = null;
    for (let i = 0; i < n; i++) { if (d[i] <= 0) continue;
      for (let k = 0; k < n; k++) { if (d[k] >= 0) continue;
        for (let j = 0; j < m; j++) if (Y[i][j] >= step - 1e-9 && A[k][j] > 0) {
          const skor = (Y[i][j] - A[i][j]) - (Y[k][j] - A[k][j]); if (!best || skor > best.skor) best = { i, k, j, skor }; } } }
    if (!best) break;
    Y[best.i][best.j] = +(Y[best.i][best.j] - step).toFixed(4); Y[best.k][best.j] = +(Y[best.k][best.j] + step).toFixed(4);
  }
  return sub ? T(Y) : Y;
}

/** Pengaturan hitung awal dari bobot yang ada (target = jumlah baris/kolom sekarang, sel = bobot > 0), mode otomatis. */
export function hitungAwal(d){
  const j = jumlahBobot(d), sub = {}, sel = {};
  for (const s of d.sub) {
    const b = d.bobot[s.kode] || {};
    sub[s.kode] = +Object.values(b).reduce((a, v) => a + nil(v), 0).toFixed(4);
    sel[s.kode] = d.asesmen.map(a => a.nama).filter(n => nil(b[n]) > 0);
  }
  return { mode: 'otomatis', prioritas: 'asesmen', bulat: 1, asesmen: Object.fromEntries(Object.entries(j.kolom).map(([k, v]) => [k, +v.toFixed(4)])), sub, sel };
}

/**
 * Hitung bobot sel dari d.hitung (mode otomatis). Hasil { bobot, rowT, colT, rowSum, colSum, simpang, belumDiukur, tanpaSel }:
 * simpang = selisih terbesar komposisi akhir terhadap target (poin persen); belumDiukur = Sub-CPMK tanpa sel;
 * tanpaSel = butir bertarget tanpa Sub-CPMK. Tidak mengubah d.
 */
export function hitungOtomatis(d){
  const H = d.hitung || {}, A = d.asesmen.map(a => a.nama), S = d.sub.map(s => s.kode);
  const colT = normalisasi(A.map(n => H.asesmen?.[n])), rowT = normalisasi(S.map(k => H.sub?.[k]));
  const mask = S.map(k => A.map(n => (H.sel?.[k] || []).includes(n)));
  const step = [1, 0.5, 0.1].includes(+H.bulat) ? +H.bulat : 1;
  const X = S.length && A.length ? bulatkanMatriks(seimbangkan(rowT, colT, mask, H.prioritas), step, H.prioritas) : [];
  const bobot = {};
  S.forEach((k, i) => A.forEach((n, j) => { if (X[i][j] > 0) (bobot[k] ||= {})[n] = X[i][j]; }));
  const rowSum = X.map(r => r.reduce((a, b) => a + b, 0)), colSum = A.map((_, j) => X.reduce((t, r) => t + r[j], 0));
  const simpang = Math.max(0, ...rowSum.map((v, i) => Math.abs(v - rowT[i])), ...colSum.map((v, j) => Math.abs(v - colT[j])));
  return { bobot, rowT, colT, rowSum, colSum, simpang,
           belumDiukur: S.filter((k, i) => !mask[i].some(Boolean)), tanpaSel: A.filter((n, j) => colT[j] > 0 && !mask.some(r => r[j])) };
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
