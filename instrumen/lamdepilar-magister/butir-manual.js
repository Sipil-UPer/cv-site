/* ====================================================================
   ELEMEN (BUTIR MANUAL) — IAPS DEPILAR 1.0
   IAPS DEPILAR 1.0 (Peraturan LAMDEPILAR No. 10/2026), Program Magister
   akademik, instrumen Perolehan Status Terakreditasi. Dibangkitkan
   2026-11-24 dari dokumen resmi (lamdepilar.or.id); lihat instrumen.json.
   Id butir 101-130 = elemen D.1 ... R.6 (pemilik 2026-11-24): nomor butir
   LAM Teknik (1-60) tertulis langsung di modul umum, jadi id ini sengaja
   tidak bertabrakan dengan nomor itu.

   Semua elemen dinilai dari bukti per unsur di kartu butir (unsur-butir.js);
   tidak ada butir yang dihitung dari data (rumus-butir.js kosong).
   ket = pengantar Indikator Kualitatif, Buku 2 Kriteria Akreditasi.
   ==================================================================== */

export const BUTIR_MANUAL = [
  // ---- D. Diferensiasi Misi -------------------------------------------
  {no:'101', kode:'D.1', judul:'D.1 Legalitas Program dan Tata Pamong', seksi:'D',
   ket:'Institusi, UPPS, dan program studi memiliki dokumen legalitas yang valid, tidak meragukan, serta menunjukkan perwujudan Good University Governance (GUG). Penilaian berfokus pada:'},
  {no:'102', kode:'D.2', judul:'D.2 Visi, Misi, Tujuan, dan Strategi', seksi:'D',
   ket:'Diferensiasi misi dalam visi, misi, dan rencana strategis menunjukkan bahwa Institusi, unit pengelola program studi (UPPS), dan program studi (PS) menunjukkan:'},
  {no:'103', kode:'D.3', judul:'D.3 Kesesuaian Visi Keilmuan', seksi:'D',
   ket:'Visi dan misi yang dimiliki oleh Institusi, UPPS, dan program studi selaras dan koheren dan efektif menjadi acuan pengembangan. Visi keilmuan program studi memenuhi aspek:'},
  // ---- E. Edukasi, Sistem Evaluasi, dan Capaian Pembelajaran ----------
  {no:'104', kode:'E.1', judul:'E.1 Kurikulum', seksi:'E',
   ket:'Program studi dapat menunjukkan kualitas kepeloporan dalam desain kurikulum yang ditandai dengan adanya:'},
  {no:'105', kode:'E.2', judul:'E.2 Admisi Mahasiswa', seksi:'E',
   ket:'Institusi, unit pengelola program studi (UPPS), atau program studi telah menjalankan proses admisi yang memastikan efektivitas dan keberlanjutan masukan, proses, dan luaran yang ditandai:'},
  {no:'106', kode:'E.3', judul:'E.3 Proses dan Siklus Pembelajaran', seksi:'E',
   ket:'Program studi menunjukkan adanya kebijakan, pelaksanaan, dan evaluasi siklus pendidikan yang efektif yang ditandai:'},
  {no:'107', kode:'E.4', judul:'E.4 Penilaian dan Evaluasi', seksi:'E',
   ket:'Program studi dapat menunjukkan sistem penilaian dan evaluasi yang berbasis capaian secara efektif yang ditandai:'},
  {no:'108', kode:'E.5', judul:'E.5 Kompetensi Lulusan dan Capaian Pembelajaran', seksi:'E',
   ket:'Program studi dapat menunjukkan:'},
  // ---- P. Pengembangan Sumber Daya Manusia ----------------------------
  {no:'109', kode:'P.1', judul:'P.1 Dosen dan Tenaga Kependidikan', seksi:'P',
   ket:'Unit pengelola program studi (UPPS) perlu memastikan ketersediaan sumber daya manusia yang ditandai dengan:'},
  {no:'110', kode:'P.2', judul:'P.2 Sarana dan Prasarana Kerja', seksi:'P',
   ket:'Unit pengelola program studi perlu memastikan ketersediaan sarana dan prasarana yang ditandai dengan:'},
  {no:'111', kode:'P.3', judul:'P.3 Pengembangan Kapasitas', seksi:'P',
   ket:'UUPS menunjukkan kebijakan, proses, dan evaluasi pengembangan kapasitas institusi yang ditandai dengan:'},
  {no:'112', kode:'P.4', judul:'P.4 Kesejahteraan Kerja', seksi:'P',
   ket:'UUPS menunjukkan kebijakan, proses, dan evaluasi terkait kesejahteraan dosen, tenaga kependidikan, yang ditandai dengan:'},
  // ---- I. Internalisasi Penjaminan Mutu -------------------------------
  {no:'113', kode:'I.1', judul:'I.1 Sistem Penjaminan Mutu Internal', seksi:'I',
   ket:'UPPS dapat menunjukkan sistem penjaminan mutu internal tidak hanya dijalankan secara teknis, tetapi mendorong internalisasi budaya mutu yang berkelanjutan yang ditunjukkan sebagai berikut:'},
  {no:'114', kode:'I.2', judul:'I.2 Implementasi Perbaikan Berkelanjutan', seksi:'I',
   ket:'Keterlaksanaan Sistem Penjaminan Mutu Internal (SPMI) yang memenuhi aspek berikut:'},
  {no:'115', kode:'I.3', judul:'I.3 Keterlibatan Pemangku Kepentingan dan Penjaminan Mutu Eksternal', seksi:'I',
   ket:'UPPS dan program studi dapat menunjukkan adanya keterlibatan pemangku kepentingan eksternal dalam penjaminan mutu untuk memastikan relevansi yang ditunjukkan dengan:'},
  // ---- L. Lingkungan dan Sumber Belajar serta Pendukung Mahasiswa -----
  {no:'116', kode:'L.1', judul:'L.1 Sarana dan Prasarana Belajar', seksi:'L',
   ket:'Ketersediaan sarana dan prasarana belajar bagi mahasiswa yang ditandai dengan:'},
  {no:'117', kode:'L.2', judul:'L.2 Sumber Pengetahuan', seksi:'L',
   ket:'Ketersediaan sumber belajar bagi mahasiswa yang ditandai dengan:'},
  {no:'118', kode:'L.3', judul:'L.3 Kepuasan Mahasiswa dan Alumni', seksi:'L',
   ket:'UPPS dan program studi perlu menunjukkan sistem umpan balik yang efektif dalam rangka memastikan proses belajar efektif yang ditandai dengan:'},
  {no:'119', kode:'L.4', judul:'L.4 Lulusan, Kajian Telusur, dan Kepuasan Pengguna', seksi:'L',
   ket:'Ketersediaan sistem umpan balik yang efektif dalam rangka memastikan proses belajar efektif yang ditandai dengan:'},
  // ---- A. Akuntabilitas dan Tata Kelola -------------------------------
  {no:'120', kode:'A.1', judul:'A.1 Organisasi dan Tata Kelola', seksi:'A', led:'A.1',
   ket:'Akuntabilitas publik ditandai dengan:'},
  {no:'121', kode:'A.2', judul:'A.2 Kerja Sama dan Kemitraan', seksi:'A', led:'A.1',
   ket:'Kerjasama dan kemitraan efektif yang ditunjukkan:'},
  {no:'122', kode:'A.3', judul:'A.3 Sistem dan Manajemen Informasi', seksi:'A', led:'A.2',
   ket:'Efektivitas dan keandalan sistem yang ditunjukkan:'},
  {no:'123', kode:'A.4', judul:'A.4 Keselamatan dan Kesehatan Kerja serta Kelestarian Lingkungan', seksi:'A', led:'A.3',
   ket:'Efektivitas dan keandalan pengelolaan keamanan dan keselamatan kerja dan kelestarian lingkungan yang ditunjukkan:'},
  {no:'124', kode:'A.5', judul:'A.5 Keuangan, Keberlanjutan, dan Mitigasi Risiko', seksi:'A', led:'A.4',
   ket:'Penilaian pembiayaan termasuk pembiayaan difokuskan:'},
  // ---- R. Riset, Pengabdian kepada Masyarakat, dan Suasana Ilmiah -----
  {no:'125', kode:'R.1', judul:'R.1 Kebijakan Penelitian', seksi:'R',
   ket:'Relevansi kebijakan penelitian yang ditunjukkan:'},
  {no:'126', kode:'R.2', judul:'R.2 Proses Penelitian', seksi:'R',
   ket:'Efektivitas proses penelitian yang ditunjukkan dengan:'},
  {no:'127', kode:'R.3', judul:'R.3 Luaran dan Dampak Penelitian', seksi:'R',
   ket:'Dampak atas luaran yang diukur melalui:'},
  {no:'128', kode:'R.4', judul:'R.4 Kebijakan Pengabdian kepada Masyarakat', seksi:'R',
   ket:'Relevansi kebijakan program pengabdian kepada masyarakat (PkM) yang ditunjukkan:'},
  {no:'129', kode:'R.5', judul:'R.5 Proses Pengabdian kepada Masyarakat', seksi:'R',
   ket:'Efektivitas proses pengabdian kepada masyarakat (PkM) yang ditunjukkan dengan:'},
  {no:'130', kode:'R.6', judul:'R.6 Luaran dan Dampak Pengabdian kepada Masyarakat', seksi:'R',
   ket:'Dampak atas luaran pengabdian kepada masyarakat (PkM) yang diukur melalui:'},
];

export const SEKSI_MANUAL = {
  D: 'Diferensiasi Misi',
  E: 'Edukasi, Sistem Evaluasi, dan Capaian Pembelajaran',
  P: 'Pengembangan Sumber Daya Manusia',
  I: 'Internalisasi Penjaminan Mutu',
  L: 'Lingkungan dan Sumber Belajar serta Pendukung Mahasiswa',
  A: 'Akuntabilitas dan Tata Kelola',
  R: 'Riset, Pengabdian kepada Masyarakat, dan Suasana Ilmiah',
};

// Bagian kartu di halaman Skor (urutan tampil): satu bagian per kriteria; tidak ada butir berumus.
export const SEKSI_KARTU = [
  { id: 'D', judul: 'D. Diferensiasi Misi', rumus: [] },
  { id: 'E', judul: 'E. Edukasi, Sistem Evaluasi, dan Capaian Pembelajaran', rumus: [] },
  { id: 'P', judul: 'P. Pengembangan Sumber Daya Manusia', rumus: [] },
  { id: 'I', judul: 'I. Internalisasi Penjaminan Mutu', rumus: [] },
  { id: 'L', judul: 'L. Lingkungan dan Sumber Belajar serta Pendukung Mahasiswa', rumus: [] },
  { id: 'A', judul: 'A. Akuntabilitas dan Tata Kelola', rumus: [] },
  { id: 'R', judul: 'R. Riset, Pengabdian kepada Masyarakat, dan Suasana Ilmiah', rumus: [] },
];

// Kepuasan pengguna lulusan: disalin utuh dari site/instrumen/lam-teknik-s1/butir-manual.js
// (2026-11-24). Ketujuh aspek adalah kunci tabel lkps_kepuasan_pengguna yang dipakai survei
// kepuasan dan Data prodi. LKPS LAMDEPILAR tidak memuat rumus ΣTKi; nilai ini tidak masuk skor
// (dipakai sebagai bukti elemen L.4).
// Tujuh aspek kepuasan pengguna lulusan (Tabel 6.g.2 LKPS). Nilai = kunci di
// tabel lkps_kepuasan_pengguna (supabase/21-patch-kepuasan-pengguna.sql);
// sama dengan ASPEK di bangun.py.
export const ASPEK_KEPUASAN = [
  ['etika', 'Etika'],
  ['keahlian_bidang_ilmu', 'Keahlian bidang ilmu (kompetensi utama)'],
  ['bahasa_asing', 'Kemampuan berbahasa asing'],
  ['teknologi_informasi', 'Penggunaan teknologi informasi'],
  ['komunikasi', 'Kemampuan berkomunikasi'],
  ['kerja_sama_tim', 'Kerja sama tim'],
  ['pengembangan_diri', 'Pengembangan diri'],
];

function barisKepuasan(D, ts){
  return (((D || {}).akreditasi || {}).kepuasan || []).filter(r => r.tahun_ts === ts);
}

// ΣTKi untuk satu TS, atau null bila belum lengkap: ketujuh aspek harus ada
// dan keempat persentase tiap aspek berjumlah 100 (±1, sama dengan patch 21).
// TKi = 4a + 3b + 2c + d dengan a..d dalam pecahan.
// ΣTKi dari isian yang ada (pemilik 2026-11-10: selalu dihitung dari isian).
// Aspek yang belum diisi, atau persentasenya tidak berjumlah 100, bernilai 0;
// null hanya bila TS itu belum punya baris sama sekali.
export function cekKepuasan(D, ts){
  const per = new Map(barisKepuasan(D, ts).map(r => [r.aspek, r]));
  let total = 0;
  const kosong = [], salah = [];
  for (const [a, nama] of ASPEK_KEPUASAN){
    const r = per.get(a);
    if (!r) { kosong.push(nama); continue; }
    const p = [r.sangat_baik, r.baik, r.cukup, r.kurang].map(Number);
    if (p.some(x => !Number.isFinite(x)) || Math.abs(p[0] + p[1] + p[2] + p[3] - 100) > 1) { salah.push(nama); continue; }
    total += (4 * p[0] + 3 * p[1] + 2 * p[2] + p[3]) / 100;
  }
  return { total: per.size ? total : null, kosong, salah, n: per.size };
}
export const tkKepuasan = (D, ts) => cekKepuasan(D, ts).total;
