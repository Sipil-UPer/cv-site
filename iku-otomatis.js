// Capaian IKU/IKT otomatis dari data situs (pemilik 2026-11-11; 48-patch-sumber-iku.sql).
// Tiap indikator di Data prodi › Target IKU/IKT boleh diberi `sumber`: capaiannya
// dihitung dari data.json publik untuk TS indikator itu (tahun_ts = tahun akhir TS).
// Indikator tanpa sumber tetap memakai kolom capaian yang diisi admin.
//
// Lulusan: tracer study lulusan tahun TS-1 (lulusan TS-1 dilacak pada TS).

const diTS = (xs, ts) => (xs || []).filter(x => +x.tahun_ts === +ts);
const tracerTS = (D, ts) => (D.tracer || []).find(t => +t.tahun_lulus === +ts - 1) || null;
const persen = (a, b) => (b > 0 ? (a / b) * 100 : null);
const karyaSemua = D => [...(D.publikasi || []), ...(D.kegiatan || []), ...(D.luaran_dosen || [])];

// [id, label, satuan, hitung(D, ts) -> {nilai, ket} | null]
export const SUMBER_IKU = [
  ['publikasi_jumlah', 'Jumlah publikasi dosen', 'judul', (D, ts) => {
    const n = diTS(D.publikasi, ts).length;
    return { nilai: n, ket: `${n} publikasi terverifikasi pada TS` };
  }],
  ['publikasi_per_dtps', 'Publikasi per DTPS', 'judul per dosen', (D, ts) => {
    const n = diTS(D.publikasi, ts).length, d = (D.dtps || {}).jumlah || 0;
    return d ? { nilai: n / d, ket: `${n} publikasi ÷ ${d} DTPS` } : null;
  }],
  ['penelitian_jumlah', 'Jumlah penelitian dosen', 'judul', (D, ts) => {
    const n = diTS(D.kegiatan, ts).filter(k => k.kategori === 'penelitian').length;
    return { nilai: n, ket: `${n} penelitian terverifikasi pada TS` };
  }],
  ['pkm_jumlah', 'Jumlah PkM dosen', 'kegiatan', (D, ts) => {
    const n = diTS(D.kegiatan, ts).filter(k => k.kategori === 'pkm').length;
    return { nilai: n, ket: `${n} PkM terverifikasi pada TS` };
  }],
  ['luaran_jumlah', 'Jumlah luaran/HKI dosen', 'luaran', (D, ts) => {
    const n = diTS(D.luaran_dosen, ts).length;
    return { nilai: n, ket: `${n} luaran terverifikasi pada TS` };
  }],
  ['karya_sdgs_jumlah', 'Karya terkait SDGs', 'karya', (D, ts) => {
    const xs = diTS(karyaSemua(D), ts), n = xs.filter(k => (k.sdgs || []).length).length;
    return { nilai: n, ket: `${n} dari ${xs.length} karya TS terkait SDGs` };
  }],
  ['karya_sdgs_persen', 'Persentase karya terkait SDGs', '%', (D, ts) => {
    const xs = diTS(karyaSemua(D), ts), n = xs.filter(k => (k.sdgs || []).length).length;
    return xs.length ? { nilai: persen(n, xs.length), ket: `${n} dari ${xs.length} karya TS` } : null;
  }],
  ['rekognisi_jumlah', 'Rekognisi dosen', 'rekognisi', (D, ts) => {
    const n = diTS(D.rekognisi, ts).length;
    return { nilai: n, ket: `${n} rekognisi pada TS` };
  }],
  ['prestasi_mhs_jumlah', 'Prestasi mahasiswa', 'prestasi', (D, ts) => {
    const n = diTS(D.prestasi_agregat, ts).reduce((a, x) => a + (+x.jumlah || 0), 0);
    return { nilai: n, ket: `${n} prestasi pada TS` };
  }],
  ['kerjasama_jumlah', 'Kerja sama (penelitian, PkM, MoU)', 'kerja sama', (D, ts) => {
    const k = ((D.akreditasi || {}).kerjasama || []).filter(x => +x.tahun === +ts);
    const n = k.reduce((a, x) => a + (+x.internasional || 0) + (+x.nasional || 0) + (+x.wilayah || 0) + (+x.tanpa_tingkat || 0), 0);
    return { nilai: n, ket: `${n} kerja sama tercatat pada TS` };
  }],
  ['tracer_wt_kurang_3', 'Lulusan mendapat kerja < 3 bulan', '%', (D, ts) => {
    const t = tracerTS(D, ts);
    return t && t.terlacak ? { nilai: persen(+t.wt_kurang_3 || 0, +t.terlacak), ket: `${t.wt_kurang_3} dari ${t.terlacak} lulusan ${t.tahun_lulus} terlacak` } : null;
  }],
  ['tracer_wt_rata', 'Rata-rata waktu tunggu lulusan', 'bulan', (D, ts) => {
    const t = tracerTS(D, ts);
    return t && t.waktu_tunggu_bulan != null ? { nilai: +t.waktu_tunggu_bulan, ket: `lulusan ${t.tahun_lulus}, ${t.terlacak} terlacak` } : null;
  }],
  ['tracer_sesuai_bidang', 'Lulusan bekerja sesuai bidang', '%', (D, ts) => {
    const t = tracerTS(D, ts);
    return t && t.terlacak ? { nilai: persen(+t.sesuai_bidang || 0, +t.terlacak), ket: `${t.sesuai_bidang} dari ${t.terlacak} lulusan ${t.tahun_lulus} terlacak` } : null;
  }],
  ['tracer_terlacak', 'Lulusan terlacak tracer study', '%', (D, ts) => {
    const t = tracerTS(D, ts);
    return t && t.lulusan ? { nilai: persen(+t.terlacak || 0, +t.lulusan), ket: `${t.terlacak} dari ${t.lulusan} lulusan ${t.tahun_lulus}` } : null;
  }],
  ['dtps_doktor_persen', 'DTPS bergelar doktor (saat ini)', '%', D => {
    const d = D.dtps || {};
    return d.jumlah ? { nilai: persen(+d.doktor || 0, +d.jumlah), ket: `${d.doktor} dari ${d.jumlah} DTPS (data terkini, bukan per TS)` } : null;
  }],
  // 2026-11-13 (standar SPM O.02.12): Guru Besar, Lektor Kepala, atau Lektor.
  ['dtps_lektor_persen', 'DTPS berjabatan Lektor ke atas (saat ini)', '%', D => {
    const d = D.dtps || {}, j = d.jabatan || {};
    const n = (+j.guru_besar || 0) + (+j.lektor_kepala || 0) + (+j.lektor || 0);
    return d.jumlah && d.jabatan ? { nilai: persen(n, +d.jumlah), ket: `${n} dari ${d.jumlah} DTPS (data terkini, bukan per TS)` } : null;
  }],
  // 2026-11-13 (standar SPM O.02.13): DTPS dengan karya utama (penulis pertama/korespondensi, jurnal
  // internasional bereputasi, prosiding Scopus/IEEE/SPIE, atau paten) dalam tiga TS terakhir.
  ['dtps_karya_int_persen', 'DTPS dengan karya utama internasional (3 TS terakhir)', '%', (D, ts) => {
    const d = D.dtps || {};
    if (!d.jumlah || !Array.isArray(d.karya_utama_rinci)) return null;
    const n = new Set(d.karya_utama_rinci.filter(k => +k.tahun >= ts - 2 && +k.tahun <= ts).map(k => k.slug)).size;
    return { nilai: persen(n, +d.jumlah), ket: `${n} dari ${d.jumlah} DTPS, karya TS ${ts - 3}/${ts - 2}–${ts - 1}/${ts}` };
  }],
];

export const OPSI_SUMBER = SUMBER_IKU.map(([id, label, satuan]) => [id, `${label} (${satuan})`]);

// Capaian otomatis satu indikator; null bila tanpa sumber atau datanya belum ada.
export function hitungSumber(id, D, ts){
  const s = SUMBER_IKU.find(x => x[0] === id);
  if (!s || !D) return null;
  const h = s[3](D, +ts);
  return h && Number.isFinite(h.nilai) ? { ...h, nilai: Math.round(h.nilai * 100) / 100, satuan: s[2] } : null;
}
