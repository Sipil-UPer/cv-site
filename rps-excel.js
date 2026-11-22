// Templat Excel pengisian RPS (pemilik 2026-11-19): unduh templat berisi data MK dan isian yang ada, isi di Excel, lalu impor di
// halaman RPS. Fungsi di sini murni (tanpa SheetJS): lembarRps -> [[nama lembar, baris (array of array)]]; bacaRpsExcel membaca
// {nama lembar: baris} kembali menjadi RPS (bagian A, C, D, E) dan struktur (bagian B: CPMK, Sub-CPMK, asesmen, bobot).
// Tidak lewat Excel: rubrik, Peta Analisis, pilihan karya integrasi penelitian/PkM, dosen pengembang (diisi di halaman).
// Isi lembar menggantikan isian bagian itu (templat sudah memuat isian lama); lembar yang dihapus = bagian itu tidak diubah.
import { BENTUK, SCL, JENIS_MK, DIREKTORI, JENIS_ASESMEN, KELOMPOK_ASESMEN } from './rps.js?v=2026-11-22-866c27';

export const VERSI_TEMPLAT = 'RPS-XLSX-1';
export const LEMBAR = {
  petunjuk: 'Petunjuk', a: 'A Identitas', bCpmk: 'B CPMK', bAsesmen: 'B Asesmen', bBobot: 'B Bobot',
  c: 'C Deskripsi', cPustaka: 'C Pustaka', d: 'D Pekan', e: 'E Evaluasi',
};
const teks = v => String(v ?? '').trim();
const daftar = xs => xs.map(([k]) => k).join(', ');
const kolom = n => { let s = ''; for (n += 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s; return s; };
const KEPALA_PEKAN = ['Pekan', 'Jenis', 'Sub-CPMK', 'Materi pembelajaran', 'Pustaka', 'Indikator', 'Bentuk dan kriteria asesmen', 'Luring', 'Daring',
  'Bentuk pembelajaran', 'Metode SCL', 'Penugasan', 'Asesmen sumatif'];
const ADA = v => (v === true ? 'Ada' : v === false ? 'Tidak ada' : '');

/**
 * Lembar templat. m = baris ref_mata_kuliah; R = RPS (rapikanRps); S = mk_struktur.data atau null; cpl = [{kode, rumusan}] MK ini.
 * Hasil [[nama, baris]]; sel bisa berupa {f: 'SUM(...)'} (rumus Excel).
 */
export function lembarRps(m, R, S, { cpl = [], kini = new Date() } = {}){
  const I = R.identitas || {}, St = S || { cpmk: [], sub: [], asesmen: [], bobot: {} };
  const kv = rs => [['Kunci', 'Isian', 'Keterangan'], ...rs];
  const petunjuk = [
    ['Templat impor RPS'], ['Versi templat', VERSI_TEMPLAT], ['Kurikulum', m.kurikulum], ['Kode MK', m.kode], ['Nama MK', m.nama], ['sks', m.sks ?? ''],
    ['Diunduh', kini.toISOString().slice(0, 10)], [],
    ['Cara mengisi'],
    ['1. Isi lembar A sampai E. Jangan mengubah nama lembar, judul kolom, kolom "Kunci", dan sel Kurikulum/Kode MK di atas.'],
    ['2. Isi tiap lembar menggantikan isian bagian itu di situs (templat sudah memuat isian yang ada). Lembar yang dihapus = bagian itu tidak diubah.'],
    ['3. Teks panjang boleh beberapa baris dalam satu sel (Alt+Enter). Daftar (Sub-CPMK, bentuk pembelajaran, metode SCL, asesmen) dipisah koma.'],
    ['4. Di halaman RPS klik "Impor dari Excel", periksa ringkasan, klik Terapkan, periksa daftar periksa, lalu Simpan.'],
    ['5. Bagian B (CPMK, Sub-CPMK, asesmen, bobot) disimpan ke halaman CPMK hanya bila dicentang saat impor; RPS yang sudah disahkan kembali menjadi draf.'],
    ['6. Tidak lewat Excel: rubrik penilaian, Peta Analisis, pilihan karya integrasi penelitian/PkM, dosen pengembang. Isi di halaman RPS.'],
    [], ['CPL yang dibebankan pada MK ini (untuk kolom CPL di lembar B CPMK)'], ...cpl.map(c => [c.kode, c.rumusan]),
  ];
  const a = kv([
    ['jenis_mk', I.jenis_mk || '', `Jenis MK: ${daftar(JENIS_MK)}`],
    ['sks_t', I.sks?.t ?? '', 'sks kuliah/responsi/tutorial (T)'], ['sks_p', I.sks?.p ?? '', 'sks praktikum (P)'],
    ['sks_pl', I.sks?.pl ?? '', 'sks praktik lapangan (PL)'], ['sks_s', I.sks?.s ?? '', 'sks simulasi (S)'],
    ['semester', I.semester || '', 'Angka 1-8; MK pilihan boleh Ganjil atau Genap'],
    ['penyelenggara', I.penyelenggara || '', 'mis. Program Studi Teknik Sipil'],
    ['prasyarat', R.syarat?.prasyarat || '', 'MK prasyarat (kosong bila tidak ada)'], ['bersamaan', R.syarat?.bersamaan || '', 'MK yang diambil bersamaan'],
    ['pengampu', R.pengampu || '', 'Dosen pengampu, satu nama per baris'],
  ]);
  const bCpmk = [['Jenis', 'Kode', 'CPMK induk', 'CPL', 'Rumusan (akhiri dengan kode Bloom, mis. (C3) atau (C4, A2))'],
    ...St.cpmk.map(c => ['CPMK', c.kode, '', '', c.rumusan || '']),
    ...St.sub.map(x => ['Sub-CPMK', x.kode, x.cpmk || '', x.cpl || '', x.rumusan || ''])];
  const bAs = [['Butir asesmen', 'Jenis', 'Kelompok', 'Keterangan'],
    ...St.asesmen.map((x, i) => [x.nama, x.jenis || '', x.kelompok || '', i ? '' : `Jenis: ${daftar(JENIS_ASESMEN)} (kosong = ditebak dari nama). Kelompok: ${daftar(KELOMPOK_ASESMEN)} (kosong = bawaan).`])];
  if (St.asesmen.length === 0) bAs.push(['', '', '', `Jenis: ${daftar(JENIS_ASESMEN)}. Kelompok: ${daftar(KELOMPOK_ASESMEN)}.`]);
  // Sel rumus {f, v}: v = nilai awal (SheetJS 0.18.5 tidak menulis sel rumus tanpa nilai; Excel menghitung ulang saat dibuka).
  const nA = St.asesmen.length, akhir = kolom(nA);   // kolom A = Sub-CPMK, B.. = asesmen
  const w = (k, n) => +(St.bobot?.[k]?.[n] || 0), bul = x => Math.round(x * 1e6) / 1e6;
  const totBaris = k => bul(St.asesmen.reduce((t, as) => t + w(k, as.nama), 0)), totKolom = n => bul(St.sub.reduce((t, x) => t + w(x.kode, n), 0));
  const bBobot = [['Sub-CPMK', ...St.asesmen.map(x => x.nama), 'Jumlah (%)'],
    ...St.sub.map((x, i) => [x.kode, ...St.asesmen.map(as => St.bobot?.[x.kode]?.[as.nama] ?? ''),
      nA ? { f: `SUM(B${i + 2}:${akhir}${i + 2})`, v: totBaris(x.kode) } : '']),
    ['Jumlah (%)', ...St.asesmen.map((as, j) => ({ f: `SUM(${kolom(j + 1)}2:${kolom(j + 1)}${St.sub.length + 1})`, v: totKolom(as.nama) })),
      nA ? { f: `SUM(B${St.sub.length + 2}:${akhir}${St.sub.length + 2})`, v: bul(St.sub.reduce((t, x) => t + totBaris(x.kode), 0)) } : '']];
  const c = kv([
    ['tujuan', R.tujuan || '', 'Tujuan MK (3-5 poin)'], ['deskripsi', R.deskripsi || '', 'Deskripsi dan bahan kajian'],
    ['kriteria', R.kriteria || '', 'Kriteria ketercapaian CPMK'],
    ['scl_ada', ADA(R.scl?.ada), 'Ada atau Tidak ada'], ['scl_teks', R.scl?.teks || '', 'Uraian metode SCL, mis. Case Method pekan 9-10'],
    ['integrasi_ada', ADA(R.integrasi?.ada), 'Ada atau Tidak ada; penelitian/PkM yang diintegrasikan dipilih di halaman RPS'],
    ['integrasi_teks', R.integrasi?.teks || '', 'Uraian integrasi penelitian/PkM'],
    ['direktori_status', R.direktori?.status || '', `Direktori Kompetensi Teknis Pertamina: ${daftar(DIREKTORI)}`],
    ['direktori_teks', R.direktori?.teks || '', 'Uraian kompetensi terkait'],
  ]);
  const cPus = [['Kode', 'Pustaka'], ...(R.pustaka || []).map(p => [p.kode || '', p.teks || ''])];
  const label = (xs, ks) => (ks || []).map(k => xs.find(x => x[0] === k)?.[1] || k).join(', ');
  const d = [KEPALA_PEKAN, ...(R.pekan || []).map(p => [p.pekan, p.jenis, (p.sub || []).join(', '), p.materi || '', p.pustaka || '', p.indikator || '',
    p.bentuk || '', p.luring || '', p.daring || '', label(BENTUK, p.bentuk_pb), label(SCL, p.scl), p.penugasan || '', (p.asesmen || []).join(', ')]),
    [], ['Jenis: kuliah, uts, uas. Bentuk pembelajaran: ' + BENTUK.map(x => x[1]).join(', ') + '.'],
    ['Metode SCL: ' + SCL.map(x => x[1]).join(', ') + '. Sub-CPMK dan asesmen sumatif memakai kode/nama di lembar B.']];
  const E = R.evaluasi || {};
  const e = kv([
    ['baru', E.baru ? 'Ya' : 'Tidak', 'Ya = MK belum pernah diselenggarakan (isian di bawah boleh kosong)'],
    ['mk', E.mk || '', 'MK yang dievaluasi (bila berbeda/kurikulum lama)'], ['kode', E.kode || '', 'Kode MK yang dievaluasi'],
    ['semester', E.semester || '', 'mis. Ganjil 2025/2026'], ['jumlah', E.jumlah || '', 'mis. 38 dari 40 lulus (95%)'],
    ['rerata', E.rerata || '', 'mis. 74,5 (B+)'], ['rekomendasi', E.rekomendasi || '', 'Rekomendasi/tindak lanjut dari portofolio sebelumnya'],
  ]);
  return [[LEMBAR.petunjuk, petunjuk], [LEMBAR.a, a], [LEMBAR.bCpmk, bCpmk], [LEMBAR.bAsesmen, bAs], [LEMBAR.bBobot, bBobot],
    [LEMBAR.c, c], [LEMBAR.cPustaka, cPus], [LEMBAR.d, d], [LEMBAR.e, e]];
}

/** Lebar kolom (karakter) per lembar untuk SheetJS ws['!cols']. */
export const LEBAR_KOLOM = {
  [LEMBAR.petunjuk]: [16, 110], [LEMBAR.a]: [18, 60, 50], [LEMBAR.bCpmk]: [10, 16, 12, 8, 90], [LEMBAR.bAsesmen]: [24, 10, 12, 70],
  [LEMBAR.bBobot]: [16], [LEMBAR.c]: [18, 90, 50], [LEMBAR.cPustaka]: [14, 100], [LEMBAR.d]: [8, 8, 18, 40, 14, 30, 30, 24, 24, 26, 26, 24, 22],
  [LEMBAR.e]: [14, 60, 50],
};

// ---------- impor ----------
const kunciNilai = rows => { const o = {}; for (const r of (rows || []).slice(1)) { const k = teks(r?.[0]); if (k) o[k] = r?.[1] ?? ''; } return o; };
const isiBaris = rows => (rows || []).slice(1).filter(r => (r || []).some(v => teks(v)));
const pisah = v => teks(v).split(/[,;\n]+/).map(teks).filter(Boolean);
const angkaSks = (v, lbl, galat) => { const t = teks(v).replace(',', '.'); if (t === '') return 0; if (!Number.isFinite(+t) || +t < 0) galat.push(`${lbl}: "${teks(v)}" bukan angka sks.`); return +t || 0; };
const bacaAda = (v, lbl, galat) => { const t = teks(v).toLowerCase(); if (!t) return null; if (t === 'ada' || t === 'ya') return true;
  if (['tidak ada', 'tidak', 'tdk'].includes(t)) return false; galat.push(`${lbl}: tulis "Ada" atau "Tidak ada" (sekarang "${teks(v)}").`); return null; };
const cocokKode = (xs, v) => { const t = teks(v).toLowerCase(); return (xs.find(([k, l]) => k.toLowerCase() === t || l.toLowerCase() === t) || [])[0]; };

/**
 * Baca buku Excel. buku = {nama lembar: baris} (SheetJS sheet_to_json header:1). m = MK terbuka; R = RPS sekarang (rapikanRps);
 * S = struktur sekarang (atau null). Hasil { R, S, ubahB, bagian: [nama bagian yang terbaca], galat: [], catatan: [] };
 * bila galat tidak kosong, hasil tidak boleh diterapkan.
 */
export function bacaRpsExcel(buku, m, R, S){
  const galat = [], catatan = [], bagian = [];
  const L = n => buku?.[n];
  const P = Object.fromEntries((L(LEMBAR.petunjuk) || []).map(r => [teks(r?.[0]), teks(r?.[1])]));
  if (!L(LEMBAR.petunjuk)) galat.push(`Lembar "${LEMBAR.petunjuk}" tidak ada; pakai templat dari tombol "Unduh templat Excel".`);
  else {
    if (P['Versi templat'] !== VERSI_TEMPLAT) galat.push(`Versi templat "${P['Versi templat'] || '?'}" tidak dikenal (harus ${VERSI_TEMPLAT}); unduh templat baru.`);
    if (P['Kode MK'] !== m.kode || P.Kurikulum !== m.kurikulum)
      galat.push(`Berkas ini untuk ${P.Kurikulum || '?'} ${P['Kode MK'] || '?'}, bukan ${m.kurikulum} ${m.kode}.`);
  }
  const N = JSON.parse(JSON.stringify(R));
  // A
  if (L(LEMBAR.a)) {
    bagian.push('A Identitas');
    const A = kunciNilai(L(LEMBAR.a)), lb = k => `${LEMBAR.a} ${k}`;
    const jenis = teks(A.jenis_mk).toUpperCase();
    if (jenis && !JENIS_MK.some(([k]) => k === jenis)) galat.push(`${lb('jenis_mk')}: "${teks(A.jenis_mk)}" bukan ${daftar(JENIS_MK)}.`);
    const sem = teks(A.semester);
    if (sem && !/^([1-8]|ganjil|genap)$/i.test(sem)) galat.push(`${lb('semester')}: "${sem}" bukan angka 1-8, Ganjil, atau Genap.`);
    N.identitas = { ...N.identitas, jenis_mk: jenis, semester: /^(ganjil|genap)$/i.test(sem) ? sem[0].toUpperCase() + sem.slice(1).toLowerCase() : sem,
      penyelenggara: teks(A.penyelenggara),
      sks: { t: angkaSks(A.sks_t, lb('sks_t'), galat), p: angkaSks(A.sks_p, lb('sks_p'), galat), pl: angkaSks(A.sks_pl, lb('sks_pl'), galat), s: angkaSks(A.sks_s, lb('sks_s'), galat) } };
    N.syarat = { prasyarat: teks(A.prasyarat), bersamaan: teks(A.bersamaan) };
    N.pengampu = teks(A.pengampu);
  }
  // B
  let S2 = S ? JSON.parse(JSON.stringify(S)) : null, ubahB = false;
  if (L(LEMBAR.bCpmk) || L(LEMBAR.bAsesmen) || L(LEMBAR.bBobot)) {
    if (!(L(LEMBAR.bCpmk) && L(LEMBAR.bAsesmen) && L(LEMBAR.bBobot))) galat.push('Bagian B perlu ketiga lembar: B CPMK, B Asesmen, B Bobot (atau hapus ketiganya).');
    else {
      bagian.push('B CPMK, asesmen, bobot');
      const lama = S || { cpmk: [], sub: [], asesmen: [], bobot: {} };
      const cpmk = [], sub = [], kode = new Set();
      isiBaris(L(LEMBAR.bCpmk)).forEach((r, i) => {
        const jn = teks(r[0]).toLowerCase(), k = teks(r[1]), baris = `${LEMBAR.bCpmk} baris ${i + 2}`;
        if (!k) return galat.push(`${baris}: kode kosong.`);
        if (kode.has(k)) return galat.push(`${baris}: kode ${k} ganda.`);
        kode.add(k);
        if (jn === 'cpmk') cpmk.push({ kode: k, rumusan: teks(r[4]), indikator: lama.cpmk.find(c => c.kode === k)?.indikator || {} });
        else if (jn === 'sub-cpmk' || jn === 'sub cpmk') sub.push({ kode: k, cpmk: teks(r[2]), rumusan: teks(r[4]), ...(teks(r[3]) ? { cpl: teks(r[3]) } : {}), _b: baris });
        else galat.push(`${baris}: Jenis "${teks(r[0])}" harus CPMK atau Sub-CPMK.`);
      });
      for (const x of sub) { if (!cpmk.some(c => c.kode === x.cpmk)) galat.push(`${x._b}: CPMK induk "${x.cpmk}" tidak ada di lembar ini.`); delete x._b; }
      const asesmen = [], namaAs = new Set();
      isiBaris(L(LEMBAR.bAsesmen)).forEach((r, i) => {
        const n = teks(r[0]).replace(/\s+/g, ' '), baris = `${LEMBAR.bAsesmen} baris ${i + 2}`;
        if (!n) { if (teks(r[1]) || teks(r[2])) galat.push(`${baris}: nama butir kosong.`); return; }
        if (namaAs.has(n.toLowerCase())) return galat.push(`${baris}: butir "${n}" ganda.`);
        namaAs.add(n.toLowerCase());
        const j = teks(r[1]).toLowerCase(), kl = teks(r[2]).toLowerCase(), x = { nama: n };
        if (j) { if (JENIS_ASESMEN.some(([k]) => k === j)) x.jenis = j; else galat.push(`${baris}: Jenis "${teks(r[1])}" bukan ${daftar(JENIS_ASESMEN)}.`); }
        if (kl) { if (KELOMPOK_ASESMEN.some(([k]) => k === kl)) x.kelompok = kl; else galat.push(`${baris}: Kelompok "${teks(r[2])}" bukan ${daftar(KELOMPOK_ASESMEN)}.`); }
        asesmen.push(x);
      });
      const B = L(LEMBAR.bBobot), kep = (B[0] || []).map(teks), bobot = {};
      const kolomAs = kep.slice(1).map((n, j) => [n, j + 1]).filter(([n]) => n && !/^jumlah/i.test(n));
      for (const [n] of kolomAs) if (!asesmen.some(a => a.nama.toLowerCase() === n.toLowerCase())) galat.push(`${LEMBAR.bBobot}: kolom "${n}" tidak ada di lembar ${LEMBAR.bAsesmen}.`);
      B.slice(1).forEach((r, i) => {
        const k = teks(r?.[0]);
        if (!k || /^jumlah/i.test(k)) return;
        if (!sub.some(x => x.kode === k)) return galat.push(`${LEMBAR.bBobot} baris ${i + 2}: Sub-CPMK "${k}" tidak ada di lembar ${LEMBAR.bCpmk}.`);
        for (const [n, j] of kolomAs) {
          const t = teks(r[j]).replace('%', '').replace(',', '.');
          if (!t || +t === 0) continue;
          if (!Number.isFinite(+t) || +t < 0) { galat.push(`${LEMBAR.bBobot} ${k} / ${n}: "${teks(r[j])}" bukan angka.`); continue; }
          const nm = asesmen.find(a => a.nama.toLowerCase() === n.toLowerCase())?.nama || n;
          (bobot[k] ||= {})[nm] = +t;
        }
      });
      const baru = { ...(S || {}), versi: (S && S.versi) || '1', cpmk, sub, asesmen, bobot };
      const sama = (x, y) => JSON.stringify(x) === JSON.stringify(y);
      ubahB = !sama(lama.cpmk.map(({ kode: k, rumusan }) => [k, rumusan]), cpmk.map(({ kode: k, rumusan }) => [k, rumusan]))
        || !sama(lama.sub, sub) || !sama(lama.asesmen, asesmen) || !sama(lama.bobot || {}, bobot);
      if (ubahB && baru.hitung?.mode === 'otomatis') { baru.hitung = { ...baru.hitung, mode: 'manual' };
        catatan.push('Bobot dari Excel dipakai apa adanya: mode hitung bobot di halaman CPMK diubah menjadi Manual.'); }
      if (ubahB && baru.hitung) {   // centang/target hitung otomatis untuk kode dan butir yang tidak ada lagi dibuang
        const ks = new Set(sub.map(x => x.kode)), ns = new Set(asesmen.map(a => a.nama));
        const H = baru.hitung;
        if (H.sub) H.sub = Object.fromEntries(Object.entries(H.sub).filter(([k]) => ks.has(k)));
        if (H.asesmen) H.asesmen = Object.fromEntries(Object.entries(H.asesmen).filter(([k]) => ns.has(k)));
        if (H.sel) H.sel = Object.fromEntries(Object.entries(H.sel).filter(([k]) => ks.has(k)).map(([k, v]) => [k, v.filter(n => ns.has(n))]));
      }
      S2 = baru;
    }
  }
  const kodeSub = new Set((S2 || S || { sub: [] }).sub.map(x => x.kode)), namaSumatif = new Set((S2 || S || { asesmen: [] }).asesmen.map(a => a.nama));
  // C
  if (L(LEMBAR.c)) {
    bagian.push('C Deskripsi');
    const C = kunciNilai(L(LEMBAR.c)), lb = k => `${LEMBAR.c} ${k}`;
    N.tujuan = teks(C.tujuan); N.deskripsi = teks(C.deskripsi); N.kriteria = teks(C.kriteria);
    N.scl = { ...N.scl, ada: bacaAda(C.scl_ada, lb('scl_ada'), galat), teks: teks(C.scl_teks) };
    N.integrasi = { ...N.integrasi, ada: bacaAda(C.integrasi_ada, lb('integrasi_ada'), galat), teks: teks(C.integrasi_teks) };
    const ds = teks(C.direktori_status), dk = ds ? cocokKode(DIREKTORI, ds) : '';
    if (ds && !dk) galat.push(`${lb('direktori_status')}: "${ds}" bukan ${daftar(DIREKTORI)}.`);
    N.direktori = { status: dk || '', teks: teks(C.direktori_teks) };
  }
  if (L(LEMBAR.cPustaka)) {
    bagian.push('C Pustaka');
    N.pustaka = isiBaris(L(LEMBAR.cPustaka)).map(r => ({ kode: teks(r[0]), teks: teks(r[1]) }));
  }
  // D
  if (L(LEMBAR.d)) {
    bagian.push('D Pekan');
    const kep = (L(LEMBAR.d)[0] || []).map(teks);
    if (kep.join('|') !== KEPALA_PEKAN.join('|')) galat.push(`${LEMBAR.d}: judul kolom berubah; pakai templat dari tombol "Unduh templat Excel".`);
    else {
      const rows = (L(LEMBAR.d) || []).slice(1);
      const akhir = rows.findIndex(r => !(r || []).some(v => teks(v)));   // berhenti di baris kosong pertama (di bawahnya keterangan)
      N.pekan = (akhir < 0 ? rows : rows.slice(0, akhir)).map((r, i) => {
        const baris = `${LEMBAR.d} baris ${i + 2}`, jn = teks(r[1]).toLowerCase() || 'kuliah';
        if (!['kuliah', 'uts', 'uas'].includes(jn)) galat.push(`${baris}: Jenis "${teks(r[1])}" harus kuliah, uts, atau uas.`);
        const sub = pisah(r[2]), as = pisah(r[12]);
        for (const k of sub) if (!kodeSub.has(k)) galat.push(`${baris}: Sub-CPMK "${k}" tidak ada di bagian B.`);
        for (const n of as) if (!namaSumatif.has(n)) galat.push(`${baris}: asesmen "${n}" tidak ada di bagian B.`);
        const kodeDari = (xs, v, lbl) => pisah(v).map(t => { const k = cocokKode(xs, t); if (!k) catatan.push(`${baris}: ${lbl} "${t}" tidak dikenal, diabaikan.`); return k; }).filter(Boolean);
        return { pekan: teks(r[0]), jenis: jn, sub, materi: teks(r[3]), pustaka: teks(r[4]), indikator: teks(r[5]), bentuk: teks(r[6]),
          luring: teks(r[7]), daring: teks(r[8]), bentuk_pb: kodeDari(BENTUK, r[9], 'bentuk pembelajaran'), scl: kodeDari(SCL, r[10], 'metode SCL'),
          penugasan: teks(r[11]), asesmen: as };
      });
    }
  }
  // E
  if (L(LEMBAR.e)) {
    bagian.push('E Evaluasi');
    const E = kunciNilai(L(LEMBAR.e)), b = teks(E.baru).toLowerCase();
    if (b && !['ya', 'tidak'].includes(b)) galat.push(`${LEMBAR.e} baru: tulis Ya atau Tidak (sekarang "${teks(E.baru)}").`);
    N.evaluasi = { ...N.evaluasi, baru: b === 'ya', mk: teks(E.mk), kode: teks(E.kode), semester: teks(E.semester), jumlah: teks(E.jumlah),
      rerata: teks(E.rerata), rekomendasi: teks(E.rekomendasi) };
  }
  return { R: N, S: S2, ubahB, bagian, galat, catatan };
}

/** Bagian RPS yang berubah (untuk ringkasan sebelum diterapkan). */
export function bagianBerubah(lama, baru){
  // Urutan kunci tidak dianggap perubahan (baris pekan hasil impor bisa berbeda urutan kunci dari isian halaman).
  const urut = x => (Array.isArray(x) ? x.map(urut) : x && typeof x === 'object'
    ? Object.fromEntries(Object.keys(x).sort().map(k => [k, urut(x[k])])) : x);
  const s = x => JSON.stringify(urut(x ?? null));
  const cek = [['A Identitas', r => [r.identitas?.jenis_mk, r.identitas?.sks, r.identitas?.semester, r.identitas?.penyelenggara, r.syarat, r.pengampu]],
    ['C Tujuan, deskripsi, kriteria', r => [r.tujuan, r.deskripsi, r.kriteria]], ['C SCL, integrasi, direktori', r => [r.scl, r.integrasi?.ada, r.integrasi?.teks, r.direktori]],
    ['C Pustaka', r => r.pustaka], ['D Rencana pekanan', r => r.pekan], ['E Evaluasi', r => r.evaluasi]];
  return cek.filter(([, f]) => s(f(lama)) !== s(f(baru))).map(([n]) => n);
}
