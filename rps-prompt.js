// Prompt AI untuk membantu dosen mengisi templat Excel RPS (pemilik 2026-11-27): inti = mengisi templat impor
// (RPS-XLSX-1); materi, bahan, pustaka, tugas, dan asesmen per pekan diberikan dosen, AI tidak mengarang. Data MK, CPL
// yang dibebankan, dan silabus diisikan otomatis dari situs. Aturan sama dengan periksaRps (rps.js). Fungsi murni.
import { jenisKuliah, JENIS_MK } from './rps.js?v=2026-11-28-9a8021';

const t = v => String(v ?? '').trim();
const LABEL_KULIAH = { reguler: 'reguler', praktikum: 'praktikum', kulminasi: 'kulminasi (KP, TA, capstone)' };

/**
 * Teks prompt. mk = baris ref_mata_kuliah; R = RPS (rapikanRps); S = mk_struktur.data | null; cpl = [{kode, rumusan}];
 * silabus = isi silabus {tujuan, deskripsi, prasyarat, bersamaan, pustaka} | null.
 */
export function promptRps({ mk = {}, R = {}, S = null, cpl = [], silabus = null } = {}){
  const I = R.identitas || {}, sks = I.sks || {}, Si = silabus || {};
  const jenis = I.jenis_mk ? (JENIS_MK.find(x => x[0] === I.jenis_mk)?.[1] || I.jenis_mk) : '[MKPT / MKU / MKPS / MKP]';
  // Isian yang ada dipakai bila minimal satu pekan kuliah sudah bermateri (RPS kosong sudah berisi baris UTS/UAS bawaan).
  const pekan = (R.pekan || []).filter(p => t(p.materi) || p.jenis !== 'kuliah');
  const rencana = pekan.some(p => p.jenis === 'kuliah')
    ? pekan.map(p => p.jenis === 'uts' ? `Pekan ${t(p.pekan)}: UTS` : p.jenis === 'uas' ? `Pekan ${t(p.pekan)}: UAS`
      : `Pekan ${t(p.pekan)}: ${t(p.materi)}${t(p.pustaka) ? `; pustaka ${t(p.pustaka)}` : ''}; tugas: ${t(p.penugasan) || '[tugas pekan ini, atau —]'}`).join('\n')
    : Array.from({ length: 16 }, (_, i) => i + 1).map(n => n === 8 ? 'Pekan 8: UTS' : n === 16 ? 'Pekan 16: UAS'
      : `Pekan ${n}: [materi/bahan; pustaka; tugas]`).join('\n');
  const asesmen = S?.asesmen?.length ? S.asesmen.map(a => a.nama).join('; ') + ' [lengkapi pekan dan bobot]'
    : '[mis. Kuis 1 pekan 6 10%; Tugas Besar pekan 9-15 25%; UTS 30%; UAS 30%; Kuis 2 pekan 14 5%]';
  const pustaka = t(Si.pustaka) || (R.pustaka || []).map(p => `${t(p.kode)} ${t(p.teks)}`.trim()).filter(Boolean).join('\n');
  return `Tugas Anda: MENGISI templat impor RPS (Excel, 8 lembar) untuk mata kuliah di bawah. Materi, bahan, pustaka, tugas,
dan asesmen per pekan SUDAH DITENTUKAN DOSEN di bagian DARI DOSEN; gunakan apa adanya, jangan mengganti atau menambah
materi, pustaka, maupun tugas. Bagian Anda: menata isian dosen ke format templat, merumuskan CPMK dan Sub-CPMK, indikator,
kriteria, dan bobot sesuai aturan, lalu memeriksa kelengkapannya. Bila isian dosen untuk suatu sel tidak ada, tulis
"[diisi dosen]"; jangan mengarang. Bahasa Indonesia baku.

DATA MK (dari situs prodi)
- ${t(mk.kurikulum)} ${t(mk.kode)} ${t(mk.nama)}; ${t(mk.sks)} sks (T ${sks.t ?? t(mk.sks_kuliah) ?? ''}, P ${sks.p ?? t(mk.sks_praktikum) ?? ''}, PL ${sks.pl ?? 0}, S ${sks.s ?? 0}); semester ${t(I.semester) || t(mk.semester) || '[ ]'}
- Jenis MK: ${jenis}; jenis perkuliahan: ${LABEL_KULIAH[jenisKuliah(mk)]}
- Prasyarat: ${t(R.syarat?.prasyarat) || t(Si.prasyarat) || '-'}; diambil bersamaan: ${t(R.syarat?.bersamaan) || t(Si.bersamaan) || '-'}
- Dosen pengampu: ${t(R.pengampu).replace(/\n+/g, '; ') || '[ ]'}
- CPL yang dibebankan (Sub-CPMK hanya boleh memakai kode ini):
${cpl.length ? cpl.map(c => `  CPL-${t(c.kode)}: ${t(c.rumusan)}`).join('\n') : '  [belum dipetakan di situs; tulis kode dan rumusan CPL]'}
- Tujuan MK (silabus): ${t(Si.tujuan) || t(R.tujuan) || '[ ]'}
- Deskripsi dan bahan kajian (silabus): ${t(Si.deskripsi) || t(R.deskripsi) || '[ ]'}

DARI DOSEN (lengkapi bagian bertanda [ ])
1. Rencana pekanan (materi/bahan, pustaka, tugas):
${rencana}
2. Rencana asesmen dan bobot: ${asesmen}
3. Pustaka (kode dan rujukan):
${pustaka || '[P1 ...; P2 ...; PD1 ...]'}
4. Metode pembelajaran/SCL dan pekannya: ${t(R.scl?.teks) || '[mis. Case Method pekan 9-11; Project Based Learning tugas besar]'}
5. Integrasi penelitian/PkM dan Direktori Kompetensi Teknis Pertamina: ${t(R.integrasi?.teks) || t(R.direktori?.teks) || '[bila ada]'}
6. Evaluasi penyelenggaraan sebelumnya: ${R.evaluasi?.baru ? 'MK baru' : t(R.evaluasi?.semester) ? `${t(R.evaluasi.semester)}; ${t(R.evaluasi.jumlah)}; rerata ${t(R.evaluasi.rerata)}; ${t(R.evaluasi.rekomendasi)}` : '[MK baru: Ya/Tidak; bila Tidak: semester, jumlah lulus, rerata, rekomendasi dari SIAKAD]'}

ATURAN (sama dengan daftar periksa RPS di situs)
1. CPMK paling banyak 2 (lebih hanya untuk MK kulminasi), kode CPMK-1, CPMK-2, menurunkan CPL di atas.
2. Sub-CPMK dirumuskan dari materi dosen; tiap Sub-CPMK mendukung tepat 1 CPMK dan 1 CPL; setiap Sub-CPMK muncul di minimal satu pekan.
3. Rumusan CPMK/Sub-CPMK: satu kalimat, kata kerja operasional, diakhiri kode Bloom, mis. (C3), (C4, A2).
   Porsi HOTS (C4-C6) yang disarankan: tahun 1 = 0%, tahun 2 = 10%, tahun 3 = 30%, tahun 4 = 50%.
4. Asesmen memakai nama dan bobot dari dosen. Jenis: kuis, tugas, uts, uas, lainnya; kelompok: ujian atau penugasan. Bobot dibagi
   ke Sub-CPMK yang dinilai; tiap Sub-CPMK > 0; total TEPAT 100. Reguler: UTS dan UAS berbobot, penugasan >= 20%. Praktikum: butir
   "Laporan Akhir" berbobot. Bila rencana dosen melanggar aturan, jangan ubah diam-diam: tulis usulan di Daftar periksa.
5. Pekan 1-16 tercakup tanpa ganda (rentang boleh, mis. "5-7"); UTS pekan 8, UAS pekan 16; asesmen dijadwalkan di pekan yang
   memuat Sub-CPMK yang dinilainya.
6. Indikator tiap pekan terukur dengan ambang angka (mis. ">= 70% mahasiswa menghitung ... dengan benar").
7. Luring/Daring: metode dan alokasi per sks (PB 50' + PT 60' + KM 60' per sks per pekan).
8. Bentuk pembelajaran: Kuliah, Responsi, Tutorial, Seminar, Praktikum, Praktik lapangan, Praktik studio/bengkel, Simulasi,
   Penugasan (tugas besar/proyek). Metode SCL: Small Group Discussion, Role-Play & Simulation, Discovery Learning,
   Self-Directed Learning, Cooperative Learning, Collaborative Learning, Contextual Learning, Project Based Learning,
   Problem Based Learning, Case Method (minimal satu dalam semester).
9. Kriteria ketercapaian menyebut ambang nilai. SCL dan integrasi: "Ada" atau "Tidak ada"; direktori: Ada, Pendukung tidak
   langsung, atau Tidak tersedia.

FORMAT KELUARAN (untuk ditempel ke sel kuning templat Excel; sel lain terkunci)
Delapan blok kode terpisah, berurutan, TANPA baris judul, kolom dipisah TAB, TIDAK ADA baris baru di dalam satu sel
(pisahkan poin dengan "; "). Isi tiap blok:
1. A Identitas: SATU kolom nilai, 10 baris berurutan: jenis_mk, sks_t, sks_p, sks_pl, sks_s, semester, penyelenggara,
   prasyarat, bersamaan, pengampu (baris kosong bila tidak ada)
2. B CPMK: Jenis, Kode, CPMK induk, CPL, Rumusan (Jenis = CPMK atau Sub-CPMK; CPMK induk dan CPL hanya untuk Sub-CPMK;
   CPL tanpa awalan, mis. ${t(cpl[0]?.kode) || 'A'}). CPMK ditulis lebih dulu.
3. B Asesmen: Butir asesmen, Jenis, Kelompok
4. B Bobot: Sub-CPMK, lalu bobot (angka persen) per butir asesmen dengan URUTAN SAMA seperti blok 3; tanpa kolom jumlah
5. C Deskripsi: SATU kolom nilai, 9 baris berurutan: tujuan, deskripsi, kriteria, scl_ada, scl_teks, integrasi_ada,
   integrasi_teks, direktori_status, direktori_teks
6. C Pustaka: Kode, Pustaka
7. D Pekan: Pekan, Jenis, Sub-CPMK, Materi pembelajaran, Pustaka, Indikator, Bentuk dan kriteria asesmen, Luring, Daring,
   Bentuk pembelajaran, Metode SCL, Penugasan, Asesmen sumatif (Jenis = kuliah, uts, uas)
8. E Evaluasi: SATU kolom nilai, 7 baris berurutan: baru (Ya/Tidak), mk, kode, semester, jumlah, rerata, rekomendasi
Terakhir "Daftar periksa": total bobot; bobot UTS/UAS/penugasan; porsi HOTS; pekan yang tercakup; sel bertanda [diisi dosen];
usulan penyesuaian bila rencana dosen melanggar aturan.

CARA MENEMPEL (untuk dosen): salin tiap blok ke sel kuning pertama lembar bernama sama (lembar A, C, E: sel B2; lembar lain:
sel A2). Judul kolom B Bobot terisi otomatis dari lembar B Asesmen. Lalu simpan dan impor di halaman RPS.`;
}
