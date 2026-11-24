/* ====================================================================
   UNSUR PER ELEMEN — IAPS DEPILAR 1.0, perolehan status
   IAPS DEPILAR 1.0 (Peraturan LAMDEPILAR No. 10/2026), Program Magister
   akademik, instrumen Perolehan Status Terakreditasi. Dibangkitkan
   2026-11-24 dari dokumen resmi (lamdepilar.or.id); lihat instrumen.json.
   Id butir 101-130 = elemen D.1 ... R.6 (pemilik 2026-11-24): nomor butir
   LAM Teknik (1-60) tertulis langsung di modul umum, jadi id ini sengaja
   tidak bertabrakan dengan nomor itu.

   Unsur 1-4 = empat aspek Indikator Kualitatif (Buku 2). Unsur 5 = dokumen
   pendukung valid, lengkap, transparan, mudah diverifikasi, dan dikelola
   dengan baik. Unsur 6 (hanya elemen berindikator kuantitatif di Lampiran 3)
   = data kuantitatif valid dan memenuhi target sesuai bunyi Lampiran 3.
   Aturan skor Lampiran 3 (rubrik perolehan status):
     0 = tidak ada aspek;  1 = sebagian aspek (Lampiran 3: "1 atau 2 saja";
     tiga aspek tidak diatur, dinilai 1 = belum semua, usulan Claude
     2026-11-24);  2 = empat aspek;  3 = empat aspek + unsur 5 (+ unsur 6).
   Penanggung jawab per unsur (PJ_*) belum ditetapkan prodi: kosong.
   ==================================================================== */

// Daftar unsur Data prodi untuk butir 20/22/24 LAM Teknik; tidak dipakai instrumen ini.
export const UNSUR = { capstone: [], peta_jalan: [] };

const jumlah = (ada, nomor) => nomor.filter(u => ada.has(u)).length;
// Skor Lampiran 3. kuan = elemen ini punya unsur 6 (syarat kuantitatif).
const skorElemen = (ada, kuan) => {
  const n = jumlah(ada, [1, 2, 3, 4]);
  if (n === 0) return 0;
  if (n < 4) return 1;
  return ada.has(5) && (!kuan || ada.has(6)) ? 3 : 2;
};
const DOKUMEN = 'Dokumen pendukung aspek 1-4 valid, lengkap, transparan, mudah diverifikasi, dan dikelola dengan baik';

export const UNSUR_BUTIR = {
  // D.1 Legalitas Program dan Tata Pamong
  '101': { unsur: {
      1: 'Legalitas Institusi, UPPS, dan program studi yang lengkap',
      2: 'Kebijakan dan dokumentasi Struktur Organisasi dan Tata Kelola yang lengkap dan implementatif',
      3: 'Dokumen tata pamong yang dapat menjalankan fungsi secara efektif',
      4: 'Pelaporan Pangkalan Data Dikti lengkap',
      5: DOKUMEN,
    },
    komponen: [{ kunci: 'b101', nomor: [1, 2, 3, 4, 5], aturan: 'Aspek 1-4: tidak ada = 0, sebagian = 1, semua = 2; semua + dokumen valid (unsur 5) = 3',
      f: ada => skorElemen(ada, false) }] },
  // D.2 Visi, Misi, Tujuan, dan Strategi
  '102': { unsur: {
      1: 'Memiliki visi-misi yang jelas, koheren, dan inspiratif',
      2: 'Terukur dan diukur dengan metode yang sahih',
      3: 'Diimplementasikan melalui perencanaan strategis dan perencanaan pelaksanaan yang baik',
      4: 'Mencerminkan prinsip Good University Governance (GUG) dengan etika organisasi dan pembagian kewenangan yang jelas',
      5: DOKUMEN,
    },
    komponen: [{ kunci: 'b102', nomor: [1, 2, 3, 4, 5], aturan: 'Aspek 1-4: tidak ada = 0, sebagian = 1, semua = 2; semua + dokumen valid (unsur 5) = 3',
      f: ada => skorElemen(ada, false) }] },
  // D.3 Kesesuaian Visi Keilmuan
  '103': { unsur: {
      1: 'Menunjukkan diferensiasi dan fokus pengembangan keilmuan',
      2: 'Mempunyai metode pengukuran yang jelas dan relevan',
      3: 'Adanya analisis yang menunjukkan dukungan sumber daya yang memadai',
      4: 'Menunjukkan adanya strategi dan program untuk mencapai daya saing/keunggulan dalam skala regional/ nasional/ internasional sesuai fokus misi. Pelampauan Standar Terdapat bukti rekognisi eksternal yang ditandai dengan undangan atau kunjungan dari lembaga atau prodi di luar perguruan tinggi untuk berbagi pengalaman baik (sebagai responden studi tiru atau contoh baik) Rujukan Standar Peraturan Menteri Pendidikan Tinggi, Sains, dan Teknologi No 39 Tahun 2025 tentang Penjaminan Mutu Pendidikan Tinggi: Pasal Pasal 8 ayat (2) butir (a) tentang capaian pembelajaran lulusan selaras dengan visi dan misi perguruan tinggi Pasal 53 ayat (2) tentang hasil penelitian selaras dengan visi serta target dampak perguruan tinggi Pasal 59 ayat (2) tentang hasil pengabdian kepada masyarakat selaras dengan visi serta target dampak perguruan tinggi. 2.2 Edukasi, Sistem Evaluasi, dan Capaian Pembelajaran',
      5: DOKUMEN,
    },
    komponen: [{ kunci: 'b103', nomor: [1, 2, 3, 4, 5], aturan: 'Aspek 1-4: tidak ada = 0, sebagian = 1, semua = 2; semua + dokumen valid (unsur 5) = 3',
      f: ada => skorElemen(ada, false) }] },
  // E.1 Kurikulum
  '104': { unsur: {
      1: 'Dokumen kurikulum yang memuat desain yang telah mengikuti pedoman terbaru dan berbasis hasil (outcomes based education)',
      2: 'Bukti keterlibatan pihak eksternal terutama organisasi profesi, representasi dari pengguna lulusan atau industri, ahli, dan alumni',
      3: 'Bukti implementasinya secara konsisten dan berkesinambungan',
      4: 'Adanya bukti evaluasi terhadap kurikulum yang dilaksanakan secara berkesinambungan dan konsisten sesuai siklus pendidikan',
      5: DOKUMEN,
    },
    komponen: [{ kunci: 'b104', nomor: [1, 2, 3, 4, 5], aturan: 'Aspek 1-4: tidak ada = 0, sebagian = 1, semua = 2; semua + dokumen valid (unsur 5) = 3',
      f: ada => skorElemen(ada, false) }] },
  // E.2 Admisi Mahasiswa
  '105': { unsur: {
      1: 'Memiliki kebijakan rekrutasi akademik disusun lengkap dan sistematis',
      2: 'Mempunyai kebijakan afirmasi dan beasiswa yang proporsional',
      3: 'Dilaksanakan secara tertib, transparan, dan akuntabel, dan terpublikasi',
      4: 'Terdokumentasi dengan baik dan dievaluasi untuk perbaikan berkelanjutan',
      5: DOKUMEN,
      6: 'Data kuantitatif (Laporan Kinerja Program Studi) valid dan memenuhi target',
    },
    komponen: [{ kunci: 'b105', nomor: [1, 2, 3, 4, 5, 6], aturan: 'Aspek 1-4: tidak ada = 0, sebagian = 1, semua = 2; semua + dokumen valid (unsur 5) + data kuantitatif (unsur 6) = 3',
      f: ada => skorElemen(ada, true) }] },
  // E.3 Proses dan Siklus Pembelajaran
  '106': { unsur: {
      1: 'Dokumen kurikulum disusun sesuai panduan/pedoman penyusunan kurikulum perguruan tinggi dan rujukan keilmuan, diperbarui berkelanjutan, dan lengkap',
      2: 'Pelaksanakan pendidikan dan pembelajaran yang tertib dan konsisten',
      3: 'Dokumentasi siklus pembelajaran yang sistemik dan data yang terjaga integritasnya',
      4: 'Evaluasi konsisten dan adanya upaya perbaikan berkelanjutan',
      5: DOKUMEN,
      6: 'Data kuantitatif (Laporan Kinerja Program Studi) valid dan memenuhi target',
    },
    komponen: [{ kunci: 'b106', nomor: [1, 2, 3, 4, 5, 6], aturan: 'Aspek 1-4: tidak ada = 0, sebagian = 1, semua = 2; semua + dokumen valid (unsur 5) + data kuantitatif (unsur 6) = 3',
      f: ada => skorElemen(ada, true) }] },
  // E.4 Penilaian dan Evaluasi
  '107': { unsur: {
      1: 'Kebijakan penilaian dan evaluasi yang disusun berbasis pada rujukan terbaru termasuk pendidikan berbasis capaian',
      2: 'Dokumentasi proses evaluasi dan penilaian yang lengkap sebagai bukti pelaksanaan yang efektif',
      3: 'Terdapat sistem penilaian untuk menguji sesuai capaian pembelajaran dengan melibatkan organisasi profesi dalam prosesnya',
      4: 'Dilakukan evaluasi secara konsisten dan serta selalu diupayakan adanya perbaikan berkelanjutan',
      5: DOKUMEN,
    },
    komponen: [{ kunci: 'b107', nomor: [1, 2, 3, 4, 5], aturan: 'Aspek 1-4: tidak ada = 0, sebagian = 1, semua = 2; semua + dokumen valid (unsur 5) = 3',
      f: ada => skorElemen(ada, false) }] },
  // E.5 Kompetensi Lulusan dan Capaian Pembelajaran
  '108': { unsur: {
      1: 'Adanya sistem pengukuran terhadap capaian pembelajaran dan memublikasikannya secara sistematis termasuk dalam surat keterangan pendamping ijazah',
      2: 'Adanya matriks kesesuaian antara mata kuliah dan model pembelajarannya dengan capaian pembelajaran yang dituju yang jelas, koheren, dan efektif untuk mencapai tujuan pembelajaran',
      3: 'Adanya keterlibatan organisasi profesi / industri / pengguna lulusan dalam proses evaluasi',
      4: 'Adanya lembaga atau unit untuk melakukan evaluasi, perbaikan, peningkatan kompetensi secara konsisten, berkelanjutan, terstruktur, dan sistematis yang melibatkan beragam pemangku kepentingan',
      5: DOKUMEN,
    },
    komponen: [{ kunci: 'b108', nomor: [1, 2, 3, 4, 5], aturan: 'Aspek 1-4: tidak ada = 0, sebagian = 1, semua = 2; semua + dokumen valid (unsur 5) = 3',
      f: ada => skorElemen(ada, false) }] },
  // P.1 Dosen dan Tenaga Kependidikan
  '109': { unsur: {
      1: 'Ketercukupan dosen baik dari sisi cacah, kompetensi sebagai pendidik, dan kompetensi keahlian',
      2: 'Ketercukupan tenaga kependidikan yang mampu memastikan proses berjalan efektif',
      3: 'Adanya program pengembangan kompetensi pembelajaran, keahlian, riset, dan pengabdian untuk dosen',
      4: 'Adanya program pengembangan kompetensi dan profesionalitas untuk tenaga kependidikan termasuk tenaga fungsional',
      5: DOKUMEN,
      6: 'Data kuantitatif (Laporan Kinerja Program Studi) valid dan memenuhi target',
    },
    komponen: [{ kunci: 'b109', nomor: [1, 2, 3, 4, 5, 6], aturan: 'Aspek 1-4: tidak ada = 0, sebagian = 1, semua = 2; semua + dokumen valid (unsur 5) + data kuantitatif (unsur 6) = 3',
      f: ada => skorElemen(ada, true) }] },
  // P.2 Sarana dan Prasarana Kerja
  '110': { unsur: {
      1: 'Ketercukupan ruang, laboratorium, alat, dan fasilitas pendukung untuk kegiatan tridarma bagi dosen dan pendidik lainnya',
      2: 'Ketercukupan ruang, alat, dan fasilitas kerja bagi tenaga kependidikan sesuai dengan bidang kerja dan layanannya',
      3: 'Ketersediaan fasilitas umum, sosial, kesehatan, kantin, sarana diffabel, dan kegiatan informal, termasuk ruang kemahasiswaan',
      4: 'Adanya program kerja untuk pemeliharaan dan peningkatan ketercukupan sarana dan prasarana kerja berbasis survei kepuasan dan standar-standar yang berlaku',
      5: DOKUMEN,
    },
    komponen: [{ kunci: 'b110', nomor: [1, 2, 3, 4, 5], aturan: 'Aspek 1-4: tidak ada = 0, sebagian = 1, semua = 2; semua + dokumen valid (unsur 5) = 3',
      f: ada => skorElemen(ada, false) }] },
  // P.3 Pengembangan Kapasitas
  '111': { unsur: {
      1: 'Kebijakan rekrutasi dosen dan tenaga kependidikan berbasis perundangan, norma sistem prestasi (merit system), berkeadilan, dan nondiskriminatif',
      2: 'Kebijakan pengembangan kapasitas dosen dan tenaga kependidikan serta bukti implementasinya',
      3: 'Sistem penghargaan atas prestasi dan sanksi atas pelanggaran dan bukti implementasinya',
      4: 'Sistem pengembangan kapasitas manajerial untuk pengelolaan kelembagaan',
      5: DOKUMEN,
    },
    komponen: [{ kunci: 'b111', nomor: [1, 2, 3, 4, 5], aturan: 'Aspek 1-4: tidak ada = 0, sebagian = 1, semua = 2; semua + dokumen valid (unsur 5) = 3',
      f: ada => skorElemen(ada, false) }] },
  // P.4 Kesejahteraan Kerja
  '112': { unsur: {
      1: 'Kebijakan remunerasi yang layak untuk semua unsur yang terlibat dalam institusi (dosen, dosen tidak tetap, tutor, instruktur, tenaga kependidikan, tenaga kontrak, asisten dll.)',
      2: 'Kebijakan untuk menjamin kesehatan, keamanan, dan keselamatan kerja beserta bukti implementasinya',
      3: 'Kebijakan penjaminan pencegahan dan penanganan kekerasan seksual dan bukti implementasinya',
      4: 'Program peningkatan kesejahteraan berbasis pada survei kepuasan dan bukti implementasinya',
      5: DOKUMEN,
    },
    komponen: [{ kunci: 'b112', nomor: [1, 2, 3, 4, 5], aturan: 'Aspek 1-4: tidak ada = 0, sebagian = 1, semua = 2; semua + dokumen valid (unsur 5) = 3',
      f: ada => skorElemen(ada, false) }] },
  // I.1 Sistem Penjaminan Mutu Internal
  '113': { unsur: {
      1: 'Unit penjaminan mutu yang berjenjang dan efektif menjalankan fungsinya',
      2: 'Dokumen Sistem Penjaminan Mutu Internal (SPMI) yang terdiri atas kebijakan mutu, manual mutu, standar mutu, prosedur operasional standar, instrumen evaluasi dan monitoring, serta laporan monitoring dan evaluasi',
      3: 'Bukti proses penjaminan mutu yang berkelanjutan dengan melibatkan auditor yang bersifat independen, pelaksanaan audit mutu internal berkelanjutan, dan Rapat Tinjauan Manajemen (RTM) yang efektif dalam pengambilan keputusan, dan/atau cara lain yang ditetapkan perguruan tinggi',
      4: 'Kebijakan dan dokumen survei dan umpan balik dari seluruh pemangku kepentingan yang tersistem dengan baik',
      5: DOKUMEN,
    },
    komponen: [{ kunci: 'b113', nomor: [1, 2, 3, 4, 5], aturan: 'Aspek 1-4: tidak ada = 0, sebagian = 1, semua = 2; semua + dokumen valid (unsur 5) = 3',
      f: ada => skorElemen(ada, false) }] },
  // I.2 Implementasi Perbaikan Berkelanjutan
  '114': { unsur: {
      1: 'Tersedianya dokumen indikator kinerja (dapat berupa Indikator Kinerja Utama dan Indikator Kinerja Tambahan) yang paling tidak mencakup elemen pada perundangan (terutama aspek tata pamong, tata kelola, kerjasama, mahasiswa, sumber daya manusia, keuangan, sarana dan prasarana, pendidikan, penelitian, pengabdian kepada masyarakat, luaran dan capaian tridarma perguruan tinggi',
      2: 'Terlaksananya siklus penjaminan mutu (siklus PPEPP)',
      3: 'Tersedianya bukti sahih efektivitas pelaksanaan penjaminan mutu',
      4: 'Tersedianya bukti peningkatan standar',
      5: DOKUMEN,
    },
    komponen: [{ kunci: 'b114', nomor: [1, 2, 3, 4, 5], aturan: 'Aspek 1-4: tidak ada = 0, sebagian = 1, semua = 2; semua + dokumen valid (unsur 5) = 3',
      f: ada => skorElemen(ada, false) }] },
  // I.3 Keterlibatan Pemangku Kepentingan dan Penjaminan Mutu Eksternal
  '115': { unsur: {
      1: 'Adanya kajian yang melibatkan ahli eksternal, studi tiru atau banding, atau mengikutsertakan pengelola SPMI dalam pelatihan eksternal dalam rangka pengembangan SPMI',
      2: 'Adanya kajian yang melibatkan ahli eksternal, studi tiru atau banding, atau mengikutsertakan pengelola program studi atau dosen pengajar pada pelatihan eksternal dalam rangka pengembangan kualitas kurikulum dan pembelajaran',
      3: 'Adanya proses kaji ulang terhadap proses penjaminan mutu dan manajemen risiko yang hasilnya disosialisasikan pada pihak yang internal yang relevan',
      4: 'Adanya pengakuan eksternal terhadap sistem-sistem penjaminan mutu dan implementasinya yang ditunjukkan berupa pengakuan mutu dari lembaga audit eksternal, lembaga akreditasi, lembaga sertifikasi, atau lembaga pemeringkatan',
      5: DOKUMEN,
    },
    komponen: [{ kunci: 'b115', nomor: [1, 2, 3, 4, 5], aturan: 'Aspek 1-4: tidak ada = 0, sebagian = 1, semua = 2; semua + dokumen valid (unsur 5) = 3',
      f: ada => skorElemen(ada, false) }] },
  // L.1 Sarana dan Prasarana Belajar
  '116': { unsur: {
      1: 'Ketercukupan ruang dan laboratorium beserta alat pendukung untuk kegiatan belajar terstruktur dan/atau riset bagi mahasiswa',
      2: 'Ketersediaan sistem manajemen belajar (learning management system) dalam rangka mendukung akses pembelajaran',
      3: 'Ketersediaan ruang informal untuk kegiatan belajar di luar jam kelas bagi mahasiswa',
      4: 'Adanya program kerja untuk pemeliharaan dan peningkatan ketercukupan sarana dan prasarana belajar berbasis survei kepuasan dan kajian perkembangan keilmuan',
      5: DOKUMEN,
      6: 'Data kuantitatif (Laporan Kinerja Program Studi) valid dan sebagian besar memenuhi target',
    },
    komponen: [{ kunci: 'b116', nomor: [1, 2, 3, 4, 5, 6], aturan: 'Aspek 1-4: tidak ada = 0, sebagian = 1, semua = 2; semua + dokumen valid (unsur 5) + data kuantitatif (unsur 6) = 3',
      f: ada => skorElemen(ada, true) }] },
  // L.2 Sumber Pengetahuan
  '117': { unsur: {
      1: 'Ketersediaan buku referensi untuk setiap rencana pembelajaran semester yang selalu diperbarui dan dapat diakses oleh mahasiswa',
      2: 'Ketersediaan jurnal dan majalah ilmiah yang dapat diakses dengan mudah oleh mahasiswa',
      3: 'Ketersediaan aplikasi atau perangkat lunak yang dapat dipakai oleh mahasiswa untuk pengembangan kompetensi',
      4: 'Adanya program kerja untuk pemeliharaan dan peningkatan ketersediaan sumber belajar berbasis survei kepuasan dan kajian perkembangan keilmuan',
      5: DOKUMEN,
    },
    komponen: [{ kunci: 'b117', nomor: [1, 2, 3, 4, 5], aturan: 'Aspek 1-4: tidak ada = 0, sebagian = 1, semua = 2; semua + dokumen valid (unsur 5) = 3',
      f: ada => skorElemen(ada, false) }] },
  // L.3 Kepuasan Mahasiswa dan Alumni
  '118': { unsur: {
      1: 'Tersedianya instrumen pengukuran kepuasan mahasiswa terhadap proses belajar dan mengajar yang dilaksanakan secara konsisten',
      2: 'Tersedianya instrumen pengukuran kepuasan alumni terhadap proses belajar dan kesesuaian materi belajar dengan bidang kerja, masa tunggu berkarya, variasi pekerjaan atau karier yang ditempuh lulusan yang dilaksanakan secara konsisten',
      3: 'Instrumen memenuhi aspek kesahihan, validitas, konsistensi, integritas data, kedalaman dan ketajaman analisis untuk pengambilan keputusan',
      4: 'Adanya program kerja sebagai tindak lanjut temuan dalam rangka peningkatan berkelanjutan',
      5: DOKUMEN,
    },
    komponen: [{ kunci: 'b118', nomor: [1, 2, 3, 4, 5], aturan: 'Aspek 1-4: tidak ada = 0, sebagian = 1, semua = 2; semua + dokumen valid (unsur 5) = 3',
      f: ada => skorElemen(ada, false) }] },
  // L.4 Lulusan, Kajian Telusur, dan Kepuasan Pengguna
  '119': { unsur: {
      1: 'Tersedianya instrumen pengukuran kepuasan pengguna lulusan terkait sikap, pengetahuan, keterampilan, serta kompetensi pendukung lainnya dari para lulusan',
      2: 'Terlaksananya pengukuran secara konsisten untuk lulusan TS+1',
      3: 'Instrumen memenuhi aspek kesahihan, validitas, konsistensi, integritas data, kedalaman dan ketajaman analisis untuk pengambilan keputusan',
      4: 'Adanya program kerja sebagai tindak lanjut temuan dalam rangka peningkatan berkelanjutan',
      5: DOKUMEN,
    },
    komponen: [{ kunci: 'b119', nomor: [1, 2, 3, 4, 5], aturan: 'Aspek 1-4: tidak ada = 0, sebagian = 1, semua = 2; semua + dokumen valid (unsur 5) = 3',
      f: ada => skorElemen(ada, false) }] },
  // A.1 Organisasi dan Tata Kelola
  '120': { unsur: {
      1: 'Adanya susunan organisasi baik di UPPS maupun program studi yang diisi oleh dosen/tenaga kependidikan yang tersosialisasi dengan jelas peran, tugas, dan wewenangnya',
      2: 'Adanya kebijakan dan mekanisme penugasan berbasis pada prinsip kompetensi, integritas, kredibilitas, transparansi, akuntabilitas, dan berkeadilan yang diimplementasikan secara konsisten',
      3: 'Kepemimpinan manajerial efektif dan kepemimpinan publik yang kuat untuk mendorong reputasi program studi',
      4: 'Adanya prosedur eksekusi yang lengkap dan dapat dibuktikan efektivitasnya dalam seluruh proses tridarma',
      5: DOKUMEN,
      6: 'Data kuantitatif (Laporan Kinerja Program Studi) valid dan sebagian besar memenuhi target',
    },
    komponen: [{ kunci: 'b120', nomor: [1, 2, 3, 4, 5, 6], aturan: 'Aspek 1-4: tidak ada = 0, sebagian = 1, semua = 2; semua + dokumen valid (unsur 5) + data kuantitatif (unsur 6) = 3',
      f: ada => skorElemen(ada, true) }] },
  // A.2 Kerja Sama dan Kemitraan
  '121': { unsur: {
      1: 'Adanya kebijakan, sistem, mekanisme dan prosedur, serta penanggungjawab untuk membina kerjasama eksternal baik dalam hal kelembagaan, pendidikan, riset, pengabdian, dan kemahasiswaan',
      2: 'Terdapat bukti legalitas kerjasama dan implementasi kegiatan yang melibatkan sumber daya eksternal',
      3: 'Terdapat bukti implementasi kerjasama dalam beragam lingkup: kelembagaan, pendidikan, riset, pengabdian, dan kemahasiswaan',
      4: 'Terdapat bukti legalitas kemitraan setara (resiprokal) dalam bentuk gelar ganda dan sejenisnya yang berkelanjutan dan implementasinya',
      5: DOKUMEN,
      6: 'Data kuantitatif (Laporan Kinerja Program Studi) valid dan sebagian besar memenuhi target dan konsisten',
    },
    komponen: [{ kunci: 'b121', nomor: [1, 2, 3, 4, 5, 6], aturan: 'Aspek 1-4: tidak ada = 0, sebagian = 1, semua = 2; semua + dokumen valid (unsur 5) + data kuantitatif (unsur 6) = 3',
      f: ada => skorElemen(ada, true) }] },
  // A.3 Sistem dan Manajemen Informasi
  '122': { unsur: {
      1: 'Adanya sistem manajemen data dan informasi untuk merekam transaksi akademik yang telah dipakai dengan konsisten',
      2: 'Adanya sistem manajemen data dan informasi untuk beragam jenis pengelolaan yang telah dipakai dengan konsisten',
      3: 'Adanya bukti keandalan dalam pengelolaan data dan efektivitas sebagai bahan pembuatan kebijakan UPPS dan program studi',
      4: 'Adanya program kerja dalam rangka pengembangan keandalan, integrasi, efektivitas sistem secara berkelanjutan',
      5: DOKUMEN,
    },
    komponen: [{ kunci: 'b122', nomor: [1, 2, 3, 4, 5], aturan: 'Aspek 1-4: tidak ada = 0, sebagian = 1, semua = 2; semua + dokumen valid (unsur 5) = 3',
      f: ada => skorElemen(ada, false) }] },
  // A.4 Keselamatan dan Kesehatan Kerja serta Kelestarian Lingkungan
  '123': { unsur: {
      1: 'Adanya kebijakan, pengelola, sistem, dan alat untuk menjamin keselamatan, kesehatan, dan keamanan kerja yang diterapkan secara konsisten',
      2: 'Adanya kebijakan, pengelola, sistem, dan alat untuk mendukung kelestarian lingkungan dan diterapkan secara konsisten',
      3: 'Adanya bukti keandalan dan hasil yang efektif dalam pengelolaan keselamatan, kesehatan, dan keamanan kerja dan kelestarian lingkungan',
      4: 'Adanya program kerja dalam rangka peningkatan keandalan dan efektivitas secara berkelanjutan berbasis umpan balik pemangku kepentingan dan/atau standar eksternal',
      5: DOKUMEN,
    },
    komponen: [{ kunci: 'b123', nomor: [1, 2, 3, 4, 5], aturan: 'Aspek 1-4: tidak ada = 0, sebagian = 1, semua = 2; semua + dokumen valid (unsur 5) = 3',
      f: ada => skorElemen(ada, false) }] },
  // A.5 Keuangan, Keberlanjutan, dan Mitigasi Risiko
  '124': { unsur: {
      1: 'Adanya kebijakan dan sistem pengelolaan keuangan yang pruden meliputi perencanaan, pengorganisasian, pengarahan, pengendalian kegiatan, evaluasi',
      2: 'Adanya bukti kecukupan, keefektifan, efisiensi, dan akuntabilitas, serta keberlanjutan pembiayaan untuk menunjang penyelenggaraan pendidikan, penelitian, dan pengabdian kepada masyarakat',
      3: 'Adanya audit yang dilaksanakan oleh auditor independen dan/atau auditor publik',
      4: 'Adanya upaya untuk menjaga keseimbangan antara penerimaan dan pembiayaan agar terjaga keberlanjutannya termasuk di dalamnya upaya mengelola risiko dengan analisis yang sahih dan mitigasi yang adekuat',
      5: DOKUMEN,
      6: 'Data kuantitatif (Laporan Kinerja Program Studi) valid dan sebagian besar memenuhi target',
    },
    komponen: [{ kunci: 'b124', nomor: [1, 2, 3, 4, 5, 6], aturan: 'Aspek 1-4: tidak ada = 0, sebagian = 1, semua = 2; semua + dokumen valid (unsur 5) + data kuantitatif (unsur 6) = 3',
      f: ada => skorElemen(ada, true) }] },
  // R.1 Kebijakan Penelitian
  '125': { unsur: {
      1: 'Adanya peta jalan yang memayungi tema penelitian dosen dan mahasiswa serta pengembangan keilmuan program studi',
      2: 'Adanya bukti sosialisasi dan koordinasi baik antar dosen maupun dengan mahasiswa sebagai bagian dari implementasi peta jalan',
      3: 'Adanya bukti pendanaan atau upaya pencarian dana eksternal dalam rangka pelaksanaan penelitian',
      4: 'Adanya kaji ulang (review) terhadap keterlaksanaan program, hambatan, tingkat keberhasilan dan dampak',
      5: DOKUMEN,
    },
    komponen: [{ kunci: 'b125', nomor: [1, 2, 3, 4, 5], aturan: 'Aspek 1-4: tidak ada = 0, sebagian = 1, semua = 2; semua + dokumen valid (unsur 5) = 3',
      f: ada => skorElemen(ada, false) }] },
  // R.2 Proses Penelitian
  '126': { unsur: {
      1: 'Adanya dokumen proses, laporan penelitian dan/atau luaran penelitian yang dilakukan dosen yang sesuai dengan peta jalan:',
      2: 'Adanya dokumen proses, laporan penelitian, dan/atau luaran penelitian yang merupakan hasil kolaboratif dosen - mahasiswa',
      3: 'Adanya bukti manfaat penelitian bagi UPPS atau program studi, bagi dosen sebagai bagian pengembangan karier dan pembaruan materi pembelajaran dan bagi mahasiswa sebagai bagian dari proses pembelajaran',
      4: 'Adanya diseminasi atas hasil penelitian dalam rangka menciptakan iklim akademik yang berkelanjutan',
      5: DOKUMEN,
    },
    komponen: [{ kunci: 'b126', nomor: [1, 2, 3, 4, 5], aturan: 'Aspek 1-4: tidak ada = 0, sebagian = 1, semua = 2; semua + dokumen valid (unsur 5) = 3',
      f: ada => skorElemen(ada, false) }] },
  // R.3 Luaran dan Dampak Penelitian
  '127': { unsur: {
      1: 'Relevansi publikasi ilmiah atau karya inovatif dosen maupun mahasiswa terhadap peningkatan reputasi program studi dan perwujudan visi dan misi',
      2: 'Adanya pemanfaatan hasil penelitian atau karya inovasi dosen maupun mahasiswa dalam pengembangan dan pemberdayaan sosial, ekonomi, dan kesejahteraan masyarakat',
      3: 'Adanya pemanfaatan hasil penelitian atau karya inovasi dosen maupun mahasiswa yang diadopsi oleh industri',
      4: 'Adanya pemanfaatan hasil penelitian atau karya inovasi dosen maupun mahasiswa yang menjadi modal kewirausahaan mahasiswa',
      5: DOKUMEN,
      6: 'Data kuantitatif (Laporan Kinerja Program Studi) valid dan sebagian besar memenuhi target',
    },
    komponen: [{ kunci: 'b127', nomor: [1, 2, 3, 4, 5, 6], aturan: 'Aspek 1-4: tidak ada = 0, sebagian = 1, semua = 2; semua + dokumen valid (unsur 5) + data kuantitatif (unsur 6) = 3',
      f: ada => skorElemen(ada, true) }] },
  // R.4 Kebijakan Pengabdian kepada Masyarakat
  '128': { unsur: {
      1: 'Adanya peta jalan yang memayungi tema (PkM) dosen dan mahasiswa sesuai dengan visi misi program studi',
      2: 'Adanya bukti sosialisasi dan koordinasi baik antar dosen maupun dengan mahasiswa sebagai bagian dari implementasi peta jalan (PkM)',
      3: 'Adanya bukti pendanaan atau upaya pencarian dana eksternal atau kemitraan dalam rangka pelaksanaan (PkM)',
      4: 'Adanya kaji ulang (review) terhadap keterlaksanaan program, hambatan, tingkat keberhasilan dan dampak',
      5: DOKUMEN,
    },
    komponen: [{ kunci: 'b128', nomor: [1, 2, 3, 4, 5], aturan: 'Aspek 1-4: tidak ada = 0, sebagian = 1, semua = 2; semua + dokumen valid (unsur 5) = 3',
      f: ada => skorElemen(ada, false) }] },
  // R.5 Proses Pengabdian kepada Masyarakat
  '129': { unsur: {
      1: 'Adanya dokumen proses, laporan penelitian dan/atau luaran (PkM) yang dilakukan dosen yang sesuai dengan peta jalan dan visi misi:',
      2: 'Adanya dokumen proses, laporan, dan/atau luaran (PkM) yang merupakan hasil kolaboratif dosen - mahasiswa',
      3: 'Adanya bukti manfaat (PkM) bagi UPPS atau program studi, bagi dosen sebagai bagian pengembangan karier dan pembaruan materi pembelajaran dan bagi mahasiswa sebagai bagian dari proses pembelajaran',
      4: 'Adanya diseminasi atas hasil (PkM) dalam rangka menciptakan iklim akademik yang berkelanjutan',
      5: DOKUMEN,
    },
    komponen: [{ kunci: 'b129', nomor: [1, 2, 3, 4, 5], aturan: 'Aspek 1-4: tidak ada = 0, sebagian = 1, semua = 2; semua + dokumen valid (unsur 5) = 3',
      f: ada => skorElemen(ada, false) }] },
  // R.6 Luaran dan Dampak Pengabdian kepada Masyarakat
  '130': { unsur: {
      1: 'Relevansi kegiatan (PkM) dosen maupun mahasiswa terhadap peningkatan reputasi program studi dan perwujudan visi dan misi',
      2: 'Adanya bukti manfaat (PkM) dosen maupun mahasiswa dalam pengembangan dan pemberdayaan sosial, ekonomi, dan kesejahteraan masyarakat',
      3: 'Adanya program PkM yang direplikasi oleh institusi/lembaga lain',
      4: 'Adanya pemanfaatan hasil PkM dosen maupun mahasiswa yang menjadi modal wirausaha sosial mahasiswa',
      5: DOKUMEN,
      6: 'Data kuantitatif (Laporan Kinerja Program Studi) valid dan sebagian besar memenuhi target',
    },
    komponen: [{ kunci: 'b130', nomor: [1, 2, 3, 4, 5, 6], aturan: 'Aspek 1-4: tidak ada = 0, sebagian = 1, semua = 2; semua + dokumen valid (unsur 5) + data kuantitatif (unsur 6) = 3',
      f: ada => skorElemen(ada, true) }] },
};

// Penanggung jawab per unsur, per data, per bukti: ditetapkan prodi (kode pihak di site/unsur-butir.js).
export const PJ_UNSUR = {};
export const PJ_DATA = {};
export const PJ_BUKTI = {};
