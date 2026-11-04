/* =====================================================================
   BUTIR MANUAL — APS-AV 2025 1.0, Program Sarjana (LAM Teknik)
   ---------------------------------------------------------------------
   Butir yang TIDAK dapat dihitung dari data.json. Nilainya diisi admin di
   input-butir.html dan disimpan di tabel `pengaturan` Supabase (sejak
   2026-11-03 tidak lagi lewat data-prodi.xlsx).

   Tiap butir punya satu atau dua komponen. Butir berkomponen dua memakai
   rumus gabungan yang tertulis di matriks; rumusnya disalin apa adanya di
   field `gabung` dan ditampilkan di kartu supaya bisa dihitung ulang.

   KUNCI PENGATURAN
     b<NN>          nilai butir berkomponen satu           (0..4)
     b<NN>_i        komponen I butir berkomponen dua       (0..4)
     b<NN>_ii       komponen II                            (0..4)
     bukti_b<NN>    URL bukti untuk butir itu (satu tautan)

   Angka yang diisi adalah SKOR 0–4 hasil penilaian matriks, bukan data
   mentah. Pengecualian ada tiga (butir 18, 30, 52) yang memakai data
   mentah dan rumusnya dihitung di sini — ditandai `hitung`.

   PERINGATAN: nilai di sini adalah penilaian sendiri, bukan penilaian
   asesor. Kartu menandainya sebagai "diisi manual" supaya tidak tertukar
   dengan butir yang terhitung dari data.
   ===================================================================== */

// kriteria: label kelompok di matriks; tabel: rujukan LKPS bila ada.
export const BUTIR_MANUAL = [
  // ---- I. Diferensiasi Misi -----------------------------------------
  {no:'1', judul:'Kekhasan VMTS', tabel:'Tabel 1 LKPS', seksi:'vmts',
   ket:'Linearitas visi PT ke VMTS UPPS, kesesuaian dengan renstra dan ' +
       'kurikulum, serta tinjau ulang berkala. Tidak ada skor kurang dari 2.'},
  {no:'2', judul:'Mekanisme penyusunan VMTS', seksi:'vmts',
   ket:'Keterlibatan pemangku kepentingan internal dan eksternal. ' +
       'Tidak ada skor kurang dari 1.'},
  {no:'3', judul:'Tingkat pemahaman dan pencapaian VMTS', seksi:'vmts',
   ket:'Sosialisasi, tingkat pemahaman, pencapaian konkret, dampak. ' +
       'Tidak ada skor kurang dari 1.'},

  // ---- II. Akuntabilitas --------------------------------------------
  {no:'4', judul:'Sistem tata pamong', seksi:'kerjasama',
   komponen:['Kelengkapan struktur organisasi dan kebijakan operasional',
             'Perwujudan Good University Governance'],
   gabung:(i,ii)=>((i*2)+ii)/3, rumus:'Skor = ((I × 2) + II) / 3'},
  {no:'5', judul:'Komitmen pimpinan dan kemampuan manajerial', seksi:'kerjasama',
   komponen:['Komitmen pimpinan UPPS',
             'Kemampuan manajerial pimpinan UPPS'],
   gabung:(i,ii)=>(i+(2*ii))/3, rumus:'Skor = (I + (2 × II)) / 3'},
  {no:'7', judul:'Pelaksanaan kerja sama', seksi:'kerjasama',
   ket:'Bukti sahih kerja sama memenuhi 3 aspek: manfaat bagi prodi, ' +
       'peningkatan kinerja tridharma, kepuasan mitra.'},
  {no:'8', judul:'Pengelolaan keuangan', seksi:'kerjasama',
   ket:'Transparansi, kepatuhan regulasi, efisiensi dan efektivitas, ' +
       'pengelolaan risiko, audit internal dan eksternal.'},

  // ---- III. Relevansi Pendidikan ------------------------------------
  {no:'12', judul:'Pemutakhiran kurikulum', seksi:'pendidikan',
   ket:'Evaluasi dan pemutakhiran berkala tiap 4–5 tahun, melibatkan ' +
       'pemangku kepentingan internal dan eksternal, direview pakar.'},
  {no:'13', judul:'Profil lulusan dan CPL', tabel:'Tabel 3.a.1 LKPS', seksi:'pendidikan',
   komponen:['Profil lulusan yang ditetapkan program studi',
             'Kesesuaian profil lulusan dengan CPL'],
   gabung:(i,ii)=>(i+ii)/2, rumus:'Skor = (I + II) / 2'},
  {no:'14', judul:'Kesesuaian dan tinjauan CPL', seksi:'pendidikan',
   komponen:['Kesesuaian CPL dengan standar kompetensi lulusan',
             'Proses tinjauan rutin CPL'],
   gabung:(i,ii)=>(i+ii)/2, rumus:'Skor = (I + II) / 2'},
  {no:'15', judul:'Rencana Pembelajaran Semester (RPS)', tabel:'Tabel 3.a.1 LKPS',
   seksi:'pendidikan',
   komponen:['Ketersediaan dan kelengkapan dokumen RPS (9 komponen)',
             'Proses tinjauan rutin RPS'],
   gabung:(i,ii)=>(i+(2*ii))/3, rumus:'Skor = (I + (2 × II)) / 3'},
  {no:'16', judul:'Proses pembelajaran', seksi:'pendidikan',
   komponen:['Proses pembelajaran untuk mencapai CPL',
             'Tinjauan rutin proses pembelajaran'],
   gabung:(i,ii)=>(i+ii)/2, rumus:'Skor = (I + II) / 2'},
  {no:'17', judul:'Integrasi penelitian dan PkM dalam pembelajaran',
   tabel:'Tabel 3.a.3 LKPS', seksi:'pendidikan',
   ket:'Ambang 10% adalah SYARAT, bukan skalanya. Skor 0–4 ditentukan oleh ' +
       'sifat bahan ajarnya: relevansi CPL, keunggulan kompetitif, kebaruan ' +
       'ilmiah, dan dampak sosial — keempatnya tidak dapat dihitung dari ' +
       'data, karena itu butir ini diisi tangan.',
   // Data pendukung yang SUDAH ada di sistem. Tidak menentukan skornya,
   // tapi menjadi dasar penilaian dan memperlihatkan apakah syarat 10%
   // masuk akal untuk diklaim.
   konteks: (D, TS) => {
     const I = (D.integrasi || []).filter(r => r.tahun >= TS - 2 && r.tahun <= TS);
     const mk = new Set(I.map(r => String(r.mata_kuliah || '').trim().toLowerCase())
                         .filter(Boolean));
     if (!I.length) return 'Belum ada kegiatan integrasi terverifikasi pada ' +
       'jendela ini. Dosen mengisinya lewat tab Integrasi di input.html — ' +
       'tanpa itu, syarat 10% tidak punya bukti di sistem.';
     return `${I.length} kegiatan integrasi terverifikasi, mencakup ` +
       `${mk.size} mata kuliah. Persentase terhadap mata kuliah inti belum ` +
       `dapat dihitung: jumlah mata kuliah inti prodi tidak ada di data.json.`;
   }},
  {no:'18', judul:'Pembelajaran penugasan, praktikum, dan praktik lapangan',
   tabel:'Tabel 3.a.1 LKPS', seksi:'pendidikan',
   hitung:{kunci:['jp_jam','jb_jam'],
           label:['JP — jam penugasan/praktikum/praktik/KKN',
                  'JB — jam pembelajaran total'],
           rumus:'PJP = JP/JB · 20%–50% → 4 · <20% → 20×PJP · >50% → 8 − (8×PJP)',
           f:(jp,jb)=>{ if(!jb) return null;
             const P=jp/jb;
             return P<0.2 ? 20*P : P<=0.5 ? 4 : Math.max(0, 8-(8*P)); }}},
  {no:'20', judul:'Proyek rekayasa penciri bidang prodi (capstone design)',
   tabel:'Tabel 3.a.5 LKPS', seksi:'pendidikan',
   ket:'Panduan pelaksanaan, rumusan CPMK, penggunaan standar keteknikan ' +
       'dan batasan realistis, bukti sahih pelaksanaan.'},
  {no:'21', judul:'Suasana akademik', seksi:'pendidikan',
   komponen:['Pengelolaan suasana akademik',
             'Integritas dan kebebasan ilmiah'],
   gabung:(i,ii)=>(i+ii)/2, rumus:'Skor = (I + II) / 2'},
  {no:'22', judul:'Penelitian — peta jalan', seksi:'pendidikan',
   ket:'Peta jalan penelitian mendukung VMTS, memayungi tema dosen dan ' +
       'mahasiswa, dievaluasi berkala, berdampak bagi masyarakat.'},
  {no:'24', judul:'PkM — peta jalan', seksi:'pendidikan',
   ket:'Peta jalan PkM mendukung VMTS, memayungi tema dosen dan mahasiswa, ' +
       'dievaluasi berkala, berdampak bagi masyarakat.'},

  // ---- IV. Sumber Daya Manusia --------------------------------------
  {no:'29', judul:'Tenaga kependidikan', tabel:'Tabel 4.b LKPS', seksi:'dosen',
   ket:'Kecukupan dan kualifikasi laboran/teknisi/administrator sistem, ' +
       'serta persentase yang bersertifikat kompetensi.'},
  {no:'30', judul:'Beban kerja DTPS', tabel:'Tabel 4.c LKPS', seksi:'dosen',
   hitung:{kunci:['rbk_sks'], label:['RBK — rerata beban kerja DTPS (sks)'],
           rumus:'12–16 sks → 4 · 16–20 sks → (64 − 3×RBK)/4 · skor terendah 1',
           f:(rbk)=>{ if(!rbk) return null;
             if(rbk>=12 && rbk<=16) return 4;
             if(rbk>16 && rbk<=20) return Math.max(1,(64-(3*rbk))/4);
             return 1; }}},

  // ---- V. Sarana, Prasarana, K3L ------------------------------------
  {no:'38', judul:'Sarana dan prasarana', tabel:'Tabel 5.a LKPS', seksi:'sarana',
   komponen:['Kecukupan dan mutu sarana prasarana kegiatan akademik',
             'Kecukupan dan mutu sarana prasarana kegiatan non-akademik'],
   gabung:(i,ii)=>(i+ii)/2, rumus:'Skor = (I + II) / 2'},
  {no:'39', judul:'Keselamatan, Kesehatan Kerja, dan Lingkungan (K3L)',
   tabel:'Tabel 5.b & 5.c LKPS', seksi:'sarana',
   ket:'Kebijakan dan tata kelola K3L, fasilitas, bukti sahih pelaksanaan, ' +
       'dan tinjauan berkala.'},

  // ---- VI. Mahasiswa dan Luaran -------------------------------------
  {no:'48', judul:'Tracer study', seksi:'mahasiswa',
   ket:'Lima aspek: terkoordinasi tingkat PT, reguler dan terdokumentasi, ' +
       'kuesioner mencakup pertanyaan inti DIKTI, menyasar seluruh populasi ' +
       'TS-2 s.d. TS-1, hasil disosialisasikan dan dipakai.'},
  {no:'52', judul:'Tingkat kepuasan pengguna lulusan', tabel:'Tabel 6.g.2 LKPS',
   seksi:'mahasiswa',
   hitung:{kunci:['tk_total'],
           label:['ΣTKi — jumlah tingkat kepuasan 7 aspek'],
           rumus:'Skor = ΣTKi / 7 · TKi = (4×a) + (3×b) + (2×c) + d, dalam pecahan',
           f:(t)=>t == null ? null : Math.max(0, Math.min(4, t/7))},
   // ΣTKi diambil dari Data prodi › Kepuasan pengguna bila ketujuh aspek TS
   // itu terisi (tkKepuasan); isian tk_total hanya cadangan (pemilik 2026-11-04).
   konteks:(D, ts)=>{
     const n = new Set(barisKepuasan(D, ts).map(r => r.aspek)).size;
     const tk = tkKepuasan(D, ts);
     return tk != null
       ? `ΣTKi = ${tk.toFixed(3)} dari Data prodi › Kepuasan pengguna (TS ${ts - 1}/${ts}).`
       : `Data prodi › Kepuasan pengguna TS ${ts - 1}/${ts}: ${n} dari 7 aspek terisi`
         + (n ? ' (atau persentasenya tidak berjumlah 100)' : '')
         + '; skor memakai isian tk_total bila ada.';
   }},

  // ---- VII. Sistem Penjaminan Mutu ----------------------------------
  {no:'53', judul:'Unit penjaminan mutu dan perangkat SPMI',
   tabel:'Tabel 7.a LKPS', seksi:'mutu',
   komponen:['Keberadaan unit penjaminan mutu dan komitmen pimpinan',
             'Ketersediaan perangkat SPMI dan pengakuan mutu eksternal'],
   gabung:(i,ii)=>(i+ii)/2, rumus:'Skor = (I + II) / 2'},
  {no:'54', judul:'Indikator Kinerja Tambahan (IKT)', seksi:'mutu',
   ket:'Sesuai tujuan strategis, berdampak dan terukur, menunjukkan daya ' +
       'saing internasional, telah diukur dan dianalisis.'},
  {no:'55', judul:'Keterlaksanaan penjaminan mutu dan audit mutu internal',
   tabel:'Tabel 7.b LKPS', seksi:'mutu',
   ket:'Dokumen IKU dan IKT, siklus PPEPP, bukti efektivitas, bukti ' +
       'peningkatan standar.'},
  {no:'56', judul:'Evaluasi capaian kinerja', seksi:'mutu',
   ket:'Metode pengukuran tepat, evaluasi indikator tak tercapai, tinjauan ' +
       'rutin, hasil disebarluaskan.'},
  {no:'57', judul:'Kepuasan pemangku kepentingan', seksi:'mutu',
   ket:'Enam aspek pengukuran kepuasan layanan manajemen terhadap seluruh ' +
       'pemangku kepentingan.'},

  // ---- B. Program Pengembangan Berkelanjutan ------------------------
  {no:'58', judul:'Analisis lingkungan eksternal dan SWOT', seksi:'kembang',
   komponen:['Analisis lingkungan eksternal (makro dan mikro)',
             'Ketepatan analisis SWOT'],
   gabung:(i,ii)=>(i+ii)/2, rumus:'Skor = (I + II) / 2'},
  {no:'59', judul:'Tujuan strategis pengembangan', seksi:'kembang',
   ket:'Ditetapkan dari analisis SWOT dengan mempertimbangkan rencana aksi, ' +
       'kebutuhan jangka pendek dan menengah, renstra, aspirasi pemangku ' +
       'kepentingan, dan jaminan keberlanjutan.'},
  {no:'60', judul:'Program pengembangan berkelanjutan', seksi:'kembang',
   ket:'Kebijakan dan upaya menjamin keberlanjutan: alokasi sumber daya, ' +
       'kemampuan melaksanakan, rencana penjaminan mutu, dukungan eksternal.'},
];

export const SEKSI_MANUAL = {
  vmts:      'Visi, misi, tujuan, dan sasaran',
  sarana:    'Sarana, prasarana, dan K3L',
  mutu:      'Sistem penjaminan mutu',
  kembang:   'Program pengembangan berkelanjutan',
};

// Kunci pengaturan untuk satu butir.
export function kunciButir(b){
  if (b.hitung) return b.hitung.kunci;
  if (b.komponen) return [`b${b.no}_i`, `b${b.no}_ii`];
  return [`b${b.no}`];
}
export function kunciBuktiButir(b){ return `bukti_b${b.no}`; }

// Menghitung skor satu butir manual dari peta pengaturan.
// Mengembalikan {skor, nilai[], lengkap} — skor null bila belum lengkap.
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
export function tkKepuasan(D, ts){
  const per = new Map(barisKepuasan(D, ts).map(r => [r.aspek, r]));
  if (!ASPEK_KEPUASAN.every(([a]) => per.has(a))) return null;
  let total = 0;
  for (const [a] of ASPEK_KEPUASAN){
    const r = per.get(a);
    const p = [r.sangat_baik, r.baik, r.cukup, r.kurang].map(Number);
    if (p.some(x => !Number.isFinite(x)) || Math.abs(p[0] + p[1] + p[2] + p[3] - 100) > 1) return null;
    total += (4 * p[0] + 3 * p[1] + 2 * p[2] + p[3]) / 100;
  }
  return total;
}

export function skorManual(b, ambil){
  const kunci = kunciButir(b);
  const nilai = kunci.map(k => ambil(k));
  const lengkap = nilai.every(v => v != null && Number.isFinite(v));
  if (!lengkap) return {skor: null, nilai, lengkap: false};
  let skor;
  if (b.hitung) skor = b.hitung.f(...nilai);
  else if (b.komponen) skor = b.gabung(nilai[0], nilai[1]);
  else skor = nilai[0];
  if (skor == null || !Number.isFinite(skor)) return {skor: null, nilai, lengkap: true};
  return {skor: Math.max(0, Math.min(4, skor)), nilai, lengkap: true};
}
