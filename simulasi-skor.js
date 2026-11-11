// Simulasi data "bagaimana jika" (pemilik 2026-11-11). Skenario ditambahkan ke
// SALINAN ringkasan data.json (dan dana/kategori dosen dari Supabase) pada tahun
// TS terpilih, lalu skor.html menjalankan fungsi butir yang sama pada salinan itu.
// Kunci mengikuti bentuk yang dibaca rumus di skor.html dan dibuat bangun.py:
//   dtps.{jumlah, doktor, jabatan{tanpa_jabatan,asisten_ahli,lektor,lektor_kepala,guru_besar}, karya_utama_rinci[{slug,tahun}]}
//   akreditasi.publikasi_dtps[{tahun, na1..na4, nb1..nb3}]      butir 33
//   akreditasi.luaran_dtps[{tahun, paten, ttg, bc, hki, lainnya}] butir 34
//   akreditasi.sumber_dana[{tahun, kategori, luar_negeri, dalam_negeri, pt_mandiri, tanpa_sumber}] butir 31, 32
//   akreditasi.kegiatan_mhs[{tahun, kategori, total, dengan_mahasiswa}] butir 23, 25
//   akreditasi.rekognisi_dtps[{slug, tahun}]                     butir 37
//   DANA[{tahun, bulan, kategori, besaran_dana}]                 butir 10, 11
//   DOSEN_KAT[{kategori, aktif, peran}]                          butir 26

export const JABATAN = { tanpa_jabatan: 'Tanpa jabatan', asisten_ahli: 'Asisten Ahli', lektor: 'Lektor',
  lektor_kepala: 'Lektor Kepala', guru_besar: 'Guru Besar' };
export const NAIK = [['tanpa_jabatan', 'asisten_ahli'], ['asisten_ahli', 'lektor'], ['lektor', 'lektor_kepala'],
  ['lektor_kepala', 'guru_besar']];
export const PUBLIKASI = { na4: 'Jurnal internasional bereputasi (Scopus/WoS)', na3: 'Jurnal internasional',
  na2: 'Jurnal nasional terakreditasi (SINTA)', na1: 'Jurnal nasional', nb3: 'Prosiding terindeks (Scopus/WoS)',
  nb2: 'Prosiding internasional', nb1: 'Prosiding nasional/wilayah' };
export const LUARAN = { paten: 'Paten', ttg: 'Teknologi tepat guna', bc: 'Buku ber-ISBN / book chapter', hki: 'HKI pencatatan ciptaan' };
export const SUMBER = { luar_negeri: 'Luar negeri', dalam_negeri: 'Dalam negeri (di luar PT)', pt_mandiri: 'Perguruan tinggi / mandiri' };

const bulat = v => { const x = Math.floor(+v || 0); return x > 0 ? x : 0; };

/** Skenario kosong: semua angka 0. */
export function skenarioKosong(){
  return { naik: Object.fromEntries(NAIK.map(([a, b]) => [`${a}>${b}`, 0])), doktor: 0,
    baru: { n: 0, jabatan: 'asisten_ahli', doktor: false },
    publikasi: Object.fromEntries(Object.keys(PUBLIKASI).map(k => [k, 0])), karya_utama: 0,
    luaran: Object.fromEntries(Object.keys(LUARAN).map(k => [k, 0])),
    kegiatan: Object.fromEntries(['penelitian', 'pkm'].map(k => [k, { ...Object.fromEntries(Object.keys(SUMBER).map(s => [s, 0])),
      dana: 0, mahasiswa: 0 }])),
    rekognisi: 0 };
}

const jumlahKegiatan = g => Object.keys(SUMBER).reduce((a, s) => a + bulat(g[s]), 0);

/** Ringkasan skenario dalam kalimat; [] bila kosong. */
export function uraiSkenario(sk){
  const out = [];
  NAIK.forEach(([a, b]) => { const n = bulat(sk.naik[`${a}>${b}`]); if (n) out.push(`${n} dosen ${JABATAN[a]} → ${JABATAN[b]}`); });
  if (bulat(sk.doktor)) out.push(`${bulat(sk.doktor)} DTPS lulus S3`);
  if (bulat(sk.baru.n)) out.push(`${bulat(sk.baru.n)} DTPS baru (${JABATAN[sk.baru.jabatan]}${sk.baru.doktor ? ', S3' : ''})`);
  Object.entries(PUBLIKASI).forEach(([k, l]) => { if (bulat(sk.publikasi[k])) out.push(`${bulat(sk.publikasi[k])} ${l}`); });
  if (bulat(sk.karya_utama)) out.push(`${bulat(sk.karya_utama)} DTPS lagi punya karya utama internasional`);
  Object.entries(LUARAN).forEach(([k, l]) => { if (bulat(sk.luaran[k])) out.push(`${bulat(sk.luaran[k])} ${l}`); });
  ['penelitian', 'pkm'].forEach(kat => { const g = sk.kegiatan[kat], n = jumlahKegiatan(g);
    if (n) out.push(`${n} ${kat === 'pkm' ? 'PkM' : 'penelitian'} baru${+g.dana > 0 ? ` (dana Rp${(+g.dana).toLocaleString('id-ID')})` : ''}${bulat(g.mahasiswa) ? `, ${Math.min(bulat(g.mahasiswa), n)} melibatkan mahasiswa` : ''}`); });
  if (bulat(sk.rekognisi)) out.push(`${bulat(sk.rekognisi)} DTPS lagi mendapat rekognisi`);
  return out;
}

const barisTahun = (xs, tahun, isi) => {
  let r = xs.find(x => x.tahun === tahun && Object.keys(isi).every(k => x[k] === isi[k]));
  if (!r) { r = { tahun, ...isi }; xs.push(r); }
  return r;
};

/**
 * Terapkan skenario pada salinan. S = { D, DANA, DOSEN_KAT } (tidak diubah).
 * Hasil { D, DANA, DOSEN_KAT } atau { galat } bila skenario tidak mungkin.
 */
export function terapkanSkenario(S, sk, ts){
  const D = structuredClone(S.D || {}), DANA = structuredClone(S.DANA || []), DOSEN_KAT = structuredClone(S.DOSEN_KAT || []);
  const dt = D.dtps = D.dtps || {};
  const akr = D.akreditasi = D.akreditasi || {};
  dt.jumlah = dt.jumlah || 0; dt.doktor = dt.doktor || 0;
  const jab = dt.jabatan = { ...(dt.jabatan || {}) };
  // 1. Kenaikan jabatan berurutan dari bawah, jadi "AA→L lalu L→LK" untuk orang yang sama juga bisa.
  for (const [a, b] of NAIK) {
    const n = bulat(sk.naik[`${a}>${b}`]);
    if (!n) continue;
    if ((jab[a] || 0) < n) return { galat: `Hanya ada ${jab[a] || 0} DTPS ${JABATAN[a]}, tidak bisa menaikkan ${n}.` };
    jab[a] -= n; jab[b] = (jab[b] || 0) + n;
  }
  // 2. Lulus S3.
  const s3 = bulat(sk.doktor);
  if (dt.doktor + s3 > dt.jumlah) return { galat: `Hanya ${dt.jumlah - dt.doktor} DTPS yang belum S3.` };
  dt.doktor += s3;
  // 3. DTPS baru: dosen tetap.
  const nb = bulat(sk.baru.n);
  if (nb) {
    if (!JABATAN[sk.baru.jabatan]) return { galat: 'Jabatan DTPS baru tidak dikenal.' };
    dt.jumlah += nb; jab[sk.baru.jabatan] = (jab[sk.baru.jabatan] || 0) + nb;
    if (sk.baru.doktor) dt.doktor += nb;
    // Kategori dosen hanya ditambah bila sudah diisi (bila kosong, butir 26 tetap belum terhitung).
    if (DOSEN_KAT.some(d => d.kategori)) for (let i = 0; i < nb; i++) DOSEN_KAT.push({ kategori: 'tetap', aktif: true, peran: 'dosen', simulasi: true });
  }
  // 4. Publikasi DTPS pada tahun TS.
  const pub = akr.publikasi_dtps = akr.publikasi_dtps || [];
  const p = barisTahun(pub, ts, {});
  for (const k of Object.keys(PUBLIKASI)) p[k] = (p[k] || 0) + bulat(sk.publikasi[k]);
  // 5. DTPS lagi yang punya karya utama internasional (penulis pertama/korespondensi bereputasi).
  const ku = bulat(sk.karya_utama);
  if (ku) {
    const rinci = dt.karya_utama_rinci = dt.karya_utama_rinci || [];
    const sudah = new Set(rinci.filter(x => x.tahun >= ts - 2 && x.tahun <= ts).map(x => x.slug)).size;
    if (sudah + ku > dt.jumlah) return { galat: `Hanya ${dt.jumlah - sudah} DTPS yang belum punya karya utama di jendela ini.` };
    for (let i = 0; i < ku; i++) rinci.push({ slug: `simulasi-karya-utama-${i + 1}`, tahun: ts });
  }
  // 6. Luaran.
  const lu = barisTahun(akr.luaran_dtps = akr.luaran_dtps || [], ts, {});
  for (const k of ['paten', 'ttg', 'bc', 'hki', 'lainnya']) lu[k] = (lu[k] || 0) + bulat(sk.luaran[k]);
  // 7. Penelitian dan PkM: sumber dana, dana (dibagi rata per judul), keterlibatan mahasiswa.
  for (const kat of ['penelitian', 'pkm']) {
    const g = sk.kegiatan[kat], n = jumlahKegiatan(g);
    if (!n) continue;
    const sd = barisTahun(akr.sumber_dana = akr.sumber_dana || [], ts, { kategori: kat });
    for (const s of [...Object.keys(SUMBER), 'tanpa_sumber']) sd[s] = (sd[s] || 0) + bulat(g[s]);
    const km = barisTahun(akr.kegiatan_mhs = akr.kegiatan_mhs || [], ts, { kategori: kat });
    km.total = (km.total || 0) + n;
    km.dengan_mahasiswa = (km.dengan_mahasiswa || 0) + Math.min(bulat(g.mahasiswa), n);
    const dana = Math.max(0, +g.dana || 0);
    // bulan 1: tahun kalender = tahun TS (skor.html: TS = tahun + 1 bila bulan >= 9).
    for (let i = 0; i < n; i++) DANA.push({ tahun: ts, bulan: 1, kategori: kat, besaran_dana: dana / n, simulasi: true });
  }
  // 8. DTPS lagi yang mendapat rekognisi.
  const rk = bulat(sk.rekognisi);
  if (rk) {
    const rr = akr.rekognisi_dtps = akr.rekognisi_dtps || [];
    const sudah = new Set(rr.filter(x => x.tahun >= ts - 2 && x.tahun <= ts).map(x => x.slug)).size;
    if (sudah + rk > dt.jumlah) return { galat: `Hanya ${dt.jumlah - sudah} DTPS yang belum punya rekognisi di jendela ini.` };
    for (let i = 0; i < rk; i++) rr.push({ slug: `simulasi-rekognisi-${i + 1}`, tahun: ts });
  }
  return { D, DANA, DOSEN_KAT };
}

/**
 * Bandingkan dua hasil hitung { skorButir: {no: {n, ada}} } dengan bobot.
 * Hasil butir yang berubah, terbesar tambahan poin berbobotnya lebih dulu.
 */
export function bandingkan(kini, sim, bobot){
  const nilai = x => x && x.ada ? x.n : 0;
  return Object.keys(sim.skorButir).map(no => {
    const a = kini.skorButir[no], b = sim.skorButir[no];
    return { no, kini: a && a.ada ? a.n : null, sim: b && b.ada ? b.n : null, poin: (nilai(b) - nilai(a)) * bobot(no) };
  }).filter(x => Math.abs((x.sim ?? -1) - (x.kini ?? -1)) > 1e-9)
    .sort((p, q) => q.poin - p.poin || +p.no - +q.no);
}
