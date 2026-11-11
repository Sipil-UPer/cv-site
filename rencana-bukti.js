/* =====================================================================
   RENCANA BUKTI PER BUTIR — APS-AV 2025 1.0, Program Sarjana (LAM Teknik)
   ---------------------------------------------------------------------
   Untuk tiap butir (no urut 1–60): apa yang dinilai untuk skor 4 (disarikan
   dari kolom skor 4 matriks "pasca akreditasi pertama dan unggul"), bukti
   sahih yang disiapkan, tabel LKPS terkait, kerangka narasi LED, dan unit
   sumber. Isi sama dengan docs/rencana-bukti-led-lkps.xlsx (2026-11-03);
   bila salah satu diubah, samakan yang lain. Ditampilkan sebagai daftar
   periksa di input-butir.html dan kartu skor.html (permintaan pemilik
   2026-11-03).
   ===================================================================== */

import { pihakBukti, UNSUR_BUTIR } from './unsur-butir.js?v=2026-11-11-847016';

export const RENCANA_BUKTI = {
 "1": {
  "bagian": "C.1 IKU a",
  "skor4": "(1) linearitas visi PT → VMTS UPPS; (2) VMTS UPPS sesuai renstra; (3) visi keilmuan prodi sesuai kurikulum; (4) VMTS ditinjau ulang secara periodik.",
  "bukti": [
   "Statuta UP (bagian visi-misi)",
   "Renstra UP dan Renstra fakultas/UPPS",
   "SK penetapan VMTS UPPS dan visi keilmuan prodi",
   "Dokumen kurikulum (CPL dan MK yang mencerminkan visi keilmuan)",
   "Notulen/berita acara tinjau ulang VMTS (tahun, forum, perubahan)"
  ],
  "lkps": "Tabel 1",
  "narasi": "Tabel tiga kolom visi PT → UPPS → prodi; kekhasan dan keunggulan kompetitif; peta visi keilmuan → CPL → MK; riwayat tinjau ulang beserta hasilnya.",
  "unit": "Fakultas, prodi, LPM"
 },
 "2": {
  "bagian": "C.1 IKU b",
  "skor4": "Penyusunan dan penetapan VMTS melibatkan (1) internal: dosen, mahasiswa, tendik; (2) eksternal: lulusan, pengguna lulusan, DAN pakar.",
  "bukti": [
   "SK tim penyusun VMTS",
   "Undangan, daftar hadir, notulen lokakarya/FGD (internal dan eksternal)",
   "Bukti keterlibatan pakar (surat, CV singkat, masukan tertulis)",
   "Hasil survei/masukan alumni dan pengguna",
   "SK penetapan VMTS"
  ],
  "lkps": "",
  "narasi": "Alur penyusunan (gambar); tabel pihak yang terlibat, bentuk keterlibatan, tanggal, dan masukan yang diadopsi.",
  "unit": "Fakultas, prodi"
 },
 "3": {
  "bagian": "C.1 IKU c",
  "skor4": "(1) sosialisasi ke seluruh pemangku; (2) tingkat pemahaman internal dan eksternal terukur; (3) capaian konkret jangka pendek dan menengah; (4) VMTS berdampak, berkelanjutan, berorientasi masa depan.",
  "bukti": [
   "Bukti sosialisasi (PKKMB, rapat dosen, laman web, banner, media sosial)",
   "Kuesioner dan laporan survei pemahaman VMTS (dosen, mahasiswa, tendik, alumni, mitra)",
   "Laporan capaian renstra/IKU per tahun",
   "Contoh dampak (penghargaan, kerja sama, produk)"
  ],
  "lkps": "",
  "narasi": "Hasil survei pemahaman (persentase per kelompok, tren); tabel target vs capaian sasaran jangka pendek/menengah; uraian dampak.",
  "unit": "Prodi, LPM"
 },
 "4": {
  "bagian": "C.2 IKU a.i",
  "skor4": "I: (1) statuta mengatur struktur dan kebijakan operasional; (2) kewenangan dan tugas dijalankan efektif; (3) bukti sahih pelaksanaan; (4) aras kewenangan organ pokok efektif untuk jangka panjang.\nII: UPPS dikelola efektif, transparan, akuntabel; mendukung kualitas akademik, lingkungan kondusif, dampak positif bagi seluruh pemangku.",
  "bukti": [
   "Statuta UP; peraturan OTK; SK struktur organisasi fakultas/prodi",
   "SK pengangkatan pejabat dan uraian tugas (job description)",
   "SOP utama dan bukti pelaksanaannya (notulen rapat, laporan kinerja)",
   "Laporan akuntabilitas/LAKIP fakultas; hasil audit",
   "Bukti transparansi (laman informasi, mekanisme pengaduan dan tindak lanjutnya)"
  ],
  "lkps": "",
  "narasi": "Bagan organisasi; tabel organ → kewenangan → bukti pelaksanaan; contoh keputusan dan dampaknya; prinsip GUG (kredibel, transparan, akuntabel, bertanggung jawab, adil) masing-masing dengan bukti.",
  "unit": "Fakultas, biro hukum/organisasi"
 },
 "5": {
  "bagian": "C.2 IKU a.ii",
  "skor4": "I: komitmen pada (1) visi dan tujuan organisasi; (2) integritas dan transparansi; (3) pengembangan sumber daya.\nII: kemampuan (1) kepemimpinan; (2) pengambilan keputusan; (3) manajemen konflik yang berdampak positif.",
  "bukti": [
   "Rencana kerja/program pimpinan dan laporan capaiannya",
   "Kode etik dosen/tendik/mahasiswa dan bukti penegakan",
   "Rencana pengembangan SDM dan realisasinya (studi lanjut, pelatihan, sertifikasi)",
   "Notulen rapat pimpinan berisi keputusan strategis",
   "Contoh kasus penyelesaian konflik dan hasilnya",
   "Hasil survei kepuasan terhadap kepemimpinan"
  ],
  "lkps": "",
  "narasi": "Tiga komitmen, masing-masing dengan bukti; 2–3 studi kasus keputusan/konflik (situasi → tindakan → hasil).",
  "unit": "Fakultas, SDM"
 },
 "6": {
  "bagian": "C.2 IKU b.i–ii",
  "skor4": "I: RK = (N1+N2+N3)/NDTPS ≥ 4.\nII: kerja sama internasional NI > 2 DAN nasional NN > 6 dalam 3 tahun (wilayah dihitung hingga 8).",
  "bukti": [
   "Per kerja sama: dokumen IA/MoA dengan masa berlaku",
   "BUKTI REALISASI (panduan LKPS: MoU/MoA bukan bukti realisasi): surat penugasan, SPK, laporan kegiatan, hasil/luaran, publikasi bersama",
   "Daftar kerja sama per bidang (pendidikan, penelitian, PkM) dan tingkat",
   "Catatan: Excel LKPS menghitung \"valid\" bila periode beririsan TS-4..TS, matriks memakai 3 tahun"
  ],
  "lkps": "Tabel 2.a",
  "narasi": "Rekap jumlah per bidang dan tingkat (tren 3 TS); relevansi dengan visi keilmuan; contoh kerja sama unggulan.",
  "unit": "Kantor kerja sama, prodi"
 },
 "7": {
  "bagian": "C.2 IKU b.iii",
  "skor4": "Bukti sahih kerja sama memenuhi 3 aspek: (1) manfaat bagi pembelajaran, penelitian, PkM; (2) peningkatan kinerja tridharma dan fasilitas; (3) kepuasan mitra.",
  "bukti": [
   "Laporan pelaksanaan dan monev kerja sama",
   "Bukti manfaat (MK/praktik/magang, publikasi bersama, hibah, fasilitas dari mitra)",
   "Survei kepuasan mitra dan laporan analisisnya"
  ],
  "lkps": "Tabel 2.a",
  "narasi": "Tabel kerja sama → manfaat terukur; hasil survei kepuasan mitra dan tindak lanjutnya.",
  "unit": "Kantor kerja sama, prodi"
 },
 "8": {
  "bagian": "C.2 IKU c.i",
  "skor4": "Bukti sahih pengelolaan keuangan: transparansi, kepatuhan regulasi, efisiensi dan efektivitas, pengelolaan risiko, audit internal DAN eksternal.",
  "bukti": [
   "Peraturan/pedoman keuangan UP",
   "RKAT fakultas/prodi dan laporan realisasi",
   "Laporan audit internal (SPI) dan eksternal (KAP)",
   "Register risiko keuangan",
   "Bukti keterbukaan anggaran ke unit"
  ],
  "lkps": "Tabel 2.b",
  "narasi": "Siklus anggaran (gambar); realisasi vs rencana 3 TS; temuan audit dan tindak lanjutnya.",
  "unit": "Keuangan, fakultas"
 },
 "9": {
  "bagian": "C.2 IKU c.ii",
  "skor4": "BOP ≥ Rp20 juta per mahasiswa per tahun (rata-rata 3 tahun).",
  "bukti": [
   "Laporan keuangan per prodi (biaya operasional pendidikan)",
   "Data jumlah mahasiswa per tahun",
   "Surat keterangan dari bagian keuangan"
  ],
  "lkps": "Tabel 2.b",
  "narasi": "Angka BOP per tahun dan rata-rata; komposisi biaya; analisis kecukupan.",
  "unit": "Keuangan"
 },
 "10": {
  "bagian": "C.2 IKU c.iii",
  "skor4": "Rata-rata dana penelitian per DTPS per tahun ≥ Rp10 juta.",
  "bukti": [
   "Kontrak/SK hibah penelitian (internal dan eksternal)",
   "Laporan keuangan penelitian per tahun"
  ],
  "lkps": "Tabel 2.b, 3.b",
  "narasi": "Dana per tahun dan per DTPS; sumber dana; tren.",
  "unit": "LPPM, keuangan"
 },
 "11": {
  "bagian": "C.2 IKU c.iv",
  "skor4": "Rata-rata dana PkM per DTPS per tahun ≥ Rp5 juta.",
  "bukti": [
   "Kontrak/SK hibah PkM",
   "Laporan keuangan PkM per tahun"
  ],
  "lkps": "Tabel 2.b, 3.c",
  "narasi": "Dana per tahun dan per DTPS; sumber dana; tren.",
  "unit": "LPPM, keuangan"
 },
 "12": {
  "bagian": "C.3 IKU a.i",
  "skor4": "Evaluasi dan pemutakhiran kurikulum berkala tiap 4–5 tahun, melibatkan pemangku internal dan eksternal, direviu pakar bidang ilmu, sesuai iptek dan kebutuhan pengguna.",
  "bukti": [
   "SK kurikulum berlaku dan kurikulum sebelumnya (bukti siklus 4–5 tahun)",
   "Laporan evaluasi kurikulum (tracer, survei pengguna, masukan industri/asosiasi BMPTTSSI)",
   "Notulen lokakarya kurikulum dan daftar hadir eksternal",
   "Hasil reviu pakar (surat, laporan)",
   "Matriks perubahan kurikulum lama → baru"
  ],
  "lkps": "Tabel 3.a.1",
  "narasi": "Linimasa revisi kurikulum; sumber masukan dan bagaimana diadopsi; matriks perubahan; acuan iptek (SNI, kurikulum minimum BMPTTSSI).",
  "unit": "Prodi, fakultas"
 },
 "13": {
  "bagian": "C.3 IKU a.ii–iii",
  "skor4": "I: profil lulusan mempertimbangkan visi UPPS dan keilmuan, kebutuhan pengguna, sumber daya, kepentingan lokal, nasional, DAN global.\nII: CPL diturunkan dari profil: (1) sesuai kebutuhan pengguna; (2) mengikuti iptek dan industri; (3) kompetensi bersaing global; (4) diukur dan ditinjau rutin.",
  "bukti": [
   "Dokumen kurikulum: profil lulusan, CPL, matriks profil–CPL dan CPL–MK",
   "Hasil survei kebutuhan pengguna/industri",
   "Pembanding global (mis. Washington Accord/ABET/IABEE)",
   "Laporan pengukuran capaian CPL per semester (run_cpl.py)",
   "Notulen tinjauan CPL"
  ],
  "lkps": "Tabel 3.a.1",
  "narasi": "Tabel profil → CPL; dasar penetapan; hasil pengukuran CPL (grafik per CPL, tren); tindak lanjut CPL yang rendah.",
  "unit": "Prodi"
 },
 "14": {
  "bagian": "C.3 IKU a.iii I–II",
  "skor4": "I: CPL mencakup (1) konsep rekayasa spesifik disiplin; (2) kemampuan teknis dan adaptasi standar keteknikan serta teknologi baru; (3) komunikasi dan kerja tim; (4) etika profesi.\nII: tinjauan rutin pencapaian pembelajaran berkala sesuai prosedur, melibatkan pemangku internal DAN eksternal.",
  "bukti": [
   "Matriks CPL terhadap 4 cakupan standar kompetensi",
   "SOP/prosedur tinjauan CPL",
   "Notulen rapat tinjauan CPL dengan peserta eksternal (industri, alumni, pakar)",
   "Laporan capaian CPL dan rencana perbaikan"
  ],
  "lkps": "Tabel 3.a.1",
  "narasi": "Tabel CPL × 4 cakupan; jadwal dan hasil tinjauan (siapa terlibat, keputusan, tindak lanjut).",
  "unit": "Prodi"
 },
 "15": {
  "bagian": "C.3 IKU a.iv",
  "skor4": "I: RPS memuat 9 komponen, dapat diakses mahasiswa, DAN dilaksanakan konsisten.\nII: tinjauan rutin RPS mencakup (1) analisis CPL; (2) evaluasi materi dan metode; (3) peninjauan metode penilaian; (4) penyesuaian kurikulum dan pembaruan materi.",
  "bukti": [
   "RPS seluruh MK (folder per semester), checklist 9 komponen",
   "Bukti akses mahasiswa (LMS/tautan)",
   "Bukti keterlaksanaan (berita acara perkuliahan vs RPS)",
   "Notulen tinjauan RPS per semester dan versi RPS lama → baru"
  ],
  "lkps": "Tabel 3.a.1",
  "narasi": "Rekap kelengkapan RPS (n/N MK); cara akses; siklus tinjauan RPS dengan contoh perubahan nyata.",
  "unit": "Prodi, dosen pengampu"
 },
 "16": {
  "bagian": "C.3 IKU a.v",
  "skor4": "I: pembelajaran efektif mencapai CPL dengan (1) metode; (2) media dan sumber belajar; (3) interaksi dosen–mahasiswa; (4) peningkatan daya analisis kritis.\nII: bukti sistem pemantauan berkala: (1) kesesuaian dengan RPS; (2) evaluasi metode; (3) identifikasi peluang perbaikan; (4) tindakan perbaikan.",
  "bukti": [
   "Contoh metode SCL (PBL, studi kasus, proyek) per MK",
   "LMS, modul, perangkat lunak, laboratorium",
   "Hasil EDOM/kuesioner mahasiswa",
   "Laporan monitoring perkuliahan (kehadiran, kesesuaian materi)",
   "Formulir temuan dan tindak lanjut beserta statusnya"
  ],
  "lkps": "",
  "narasi": "Pemetaan metode per MK; hasil EDOM (tren); siklus pemantauan → temuan → perbaikan dengan contoh.",
  "unit": "Prodi, LPM"
 },
 "17": {
  "bagian": "C.3 IKU a.vi",
  "skor4": "Hasil penelitian/PkM menjadi bahan ajar minimal 10% MK inti, mencakup (1) relevan CPL; (2) mendukung keunggulan kompetitif; (3) kebaruan ilmiah; (4) dampak sosial positif.",
  "bukti": [
   "Daftar MK dan judul penelitian/PkM yang diintegrasikan",
   "RPS yang mencantumkan integrasi",
   "Bahan ajar/modul/studi kasus dari penelitian",
   "Pedoman integrasi penelitian dan PkM"
  ],
  "lkps": "Tabel 3.a.3",
  "narasi": "Persentase MK inti terintegrasi; contoh per keempat aspek.",
  "unit": "Prodi, dosen"
 },
 "18": {
  "bagian": "C.3 IKU a.vii",
  "skor4": "PJP = JP/JB × 100% antara 20% dan 50%.",
  "bukti": [
   "Struktur kurikulum dengan SKS praktikum/praktik/KKN",
   "Modul praktikum, jadwal laboratorium, laporan kerja praktik"
  ],
  "lkps": "Tabel 3.a.1",
  "narasi": "Perhitungan JP dan JB; daftar MK berpraktik.",
  "unit": "Prodi"
 },
 "19": {
  "bagian": "C.3 IKU a.viii",
  "skor4": "MK basic sciences dan matematika ≥ 25 SKS.",
  "bukti": [
   "Daftar MK basic sciences dan matematika (kode, SKS, semester)",
   "RPS MK tersebut"
  ],
  "lkps": "Tabel 3.a.4",
  "narasi": "Tabel MK dan total SKS; posisi terhadap syarat perlu.",
  "unit": "Prodi"
 },
 "20": {
  "bagian": "C.3 IKU a.ix",
  "skor4": "(1) panduan pelaksanaan; (2) rumusan CPMK; (3) standar keteknikan dan batasan realistis; (4) bukti sahih pelaksanaan.",
  "bukti": [
   "Panduan capstone/tugas besar perancangan",
   "RPS dan CPMK capstone",
   "Contoh laporan dengan rujukan standar (SNI) dan batasan realistis",
   "Berita acara presentasi/penilaian, rubrik"
  ],
  "lkps": "Tabel 3.a.5",
  "narasi": "Alur capstone; MK penunjang; contoh proyek dan standar yang dipakai.",
  "unit": "Prodi"
 },
 "21": {
  "bagian": "C.3 IKU a.x",
  "skor4": "I: kebijakan, program, fasilitas, DAN evaluasi berkala suasana akademik.\nII: kebebasan akademik, mimbar akademik, otonomi keilmuan terjadwal SETIAP 1–2 BULAN.",
  "bukti": [
   "Kebijakan suasana akademik",
   "Kalender kegiatan ilmiah (seminar, kuliah tamu, diskusi KK) dengan tanggal",
   "Daftar hadir, poster, notulen per kegiatan",
   "Survei suasana akademik dan tindak lanjutnya"
  ],
  "lkps": "",
  "narasi": "Jadwal kegiatan ilmiah 12 bulan terakhir (harus ada tiap 1–2 bulan); hasil evaluasi.",
  "unit": "Prodi, HIMA"
 },
 "22": {
  "bagian": "C.3 IKU b.i",
  "skor4": "(1) peta jalan mendukung VMTS; (2) memayungi tema dosen DAN mahasiswa; (3) dievaluasi berkala; (4) berdampak bagi masyarakat.",
  "bukti": [
   "Dokumen peta jalan penelitian (SK)",
   "Pemetaan judul penelitian dosen dan TA mahasiswa ke tema peta jalan",
   "Notulen evaluasi peta jalan",
   "Bukti dampak (adopsi, kebijakan, liputan)"
  ],
  "lkps": "",
  "narasi": "Gambar peta jalan; persentase penelitian dan TA sesuai tema; hasil evaluasi.",
  "unit": "Prodi, LPPM"
 },
 "23": {
  "bagian": "C.3 IKU b.ii",
  "skor4": "PPDMhs ≥ 50% judul penelitian DTPS melibatkan mahasiswa (3 tahun).",
  "bukti": [
   "Kontrak/laporan penelitian yang mencantumkan nama mahasiswa",
   "Bukti karya per judul (tautan bukti di situs prodi)"
  ],
  "lkps": "Tabel 6.h.1",
  "narasi": "Persentase per tahun dan tren; contoh peran mahasiswa.",
  "unit": "Dosen, LPPM"
 },
 "24": {
  "bagian": "C.3 IKU c.i",
  "skor4": "Sama dengan butir 22, untuk PkM.",
  "bukti": [
   "Dokumen peta jalan PkM (SK)",
   "Pemetaan judul PkM ke tema",
   "Notulen evaluasi",
   "Bukti dampak bagi masyarakat"
  ],
  "lkps": "",
  "narasi": "Gambar peta jalan PkM; kesesuaian judul; dampak.",
  "unit": "Prodi, LPPM"
 },
 "25": {
  "bagian": "C.3 IKU c.ii",
  "skor4": "PKDMhs ≥ 50% judul PkM DTPS melibatkan mahasiswa (3 tahun). KKN dan kegiatan kurikuler tidak dihitung (panduan LKPS).",
  "bukti": [
   "Laporan PkM dengan nama mahasiswa",
   "Bukti karya per judul"
  ],
  "lkps": "Tabel 6.i",
  "narasi": "Persentase per tahun; contoh.",
  "unit": "Dosen, LPPM"
 },
 "26": {
  "bagian": "C.4 IKU a.i",
  "skor4": "NDTPS ≥ 12 DAN PDTT ≤ 10%.",
  "bukti": [
   "SK dosen tetap dan SK penugasan mengajar",
   "Ijazah (bidang sesuai kompetensi inti)",
   "Daftar dosen tidak tetap"
  ],
  "lkps": "Tabel 4.a",
  "narasi": "Jumlah DTPS, sebaran bidang, rencana rekrutmen.",
  "unit": "SDM, prodi"
 },
 "27": {
  "bagian": "C.4 IKU a.ii",
  "skor4": "DTPS bergelar doktor ≥ 50%.",
  "bukti": [
   "Ijazah S3 / surat keterangan studi",
   "Rencana studi lanjut dosen"
  ],
  "lkps": "Tabel 4.a",
  "narasi": "Persentase doktor dan proyeksi (dosen sedang S3).",
  "unit": "SDM"
 },
 "28": {
  "bagian": "C.4 IKU a.iii",
  "skor4": "DTPS GB + LK + Lektor ≥ 70%.",
  "bukti": [
   "SK jabatan fungsional",
   "Rencana kenaikan jabatan"
  ],
  "lkps": "Tabel 4.a",
  "narasi": "Sebaran jabatan; target kenaikan.",
  "unit": "SDM"
 },
 "29": {
  "bagian": "C.4 IKU b",
  "skor4": "Laboran/teknisi/administrator cukup terhadap jumlah lab, kualifikasi sesuai, DAN > 70% bersertifikat kompetensi.",
  "bukti": [
   "Daftar tendik (pendidikan, unit kerja)",
   "Sertifikat kompetensi (K3, operator alat, dsb.)",
   "Daftar laboratorium yang dipakai prodi"
  ],
  "lkps": "Tabel 4.b",
  "narasi": "Rasio tendik per lab; persentase bersertifikat; rencana sertifikasi.",
  "unit": "SDM, laboratorium"
 },
 "30": {
  "bagian": "C.4 IKU c",
  "skor4": "RBK 12–16 SKS.",
  "bukti": [
   "Rekap BKD/SISTER per dosen per semester"
  ],
  "lkps": "Tabel 4.c",
  "narasi": "Rerata dan sebaran beban; analisis bila di luar rentang.",
  "unit": "SDM, dosen"
 },
 "31": {
  "bagian": "C.4 IKU d.i",
  "skor4": "RI > 0,05 (luar negeri) DAN RN > 0,3 (dalam negeri) per DTPS per tahun.",
  "bukti": [
   "Kontrak penelitian per sumber dana",
   "Laporan akhir"
  ],
  "lkps": "Tabel 3.b",
  "narasi": "Rekap per sumber dan tahun; strategi hibah eksternal.",
  "unit": "LPPM, dosen"
 },
 "32": {
  "bagian": "C.4 IKU d.ii",
  "skor4": "Sama dengan butir 31 untuk PkM.",
  "bukti": [
   "Kontrak PkM per sumber dana",
   "Laporan akhir"
  ],
  "lkps": "Tabel 3.c",
  "narasi": "Rekap per sumber dan tahun.",
  "unit": "LPPM, dosen"
 },
 "33": {
  "bagian": "C.4 IKU d.iii",
  "skor4": "RI > 0,5 (internasional bereputasi/prosiding terindeks) DAN RN > 1 per DTPS (3 tahun).",
  "bukti": [
   "Tautan/DOI publikasi, halaman indeks (Scopus/SINTA)",
   "Bukti karya di situs prodi"
  ],
  "lkps": "Tabel 4.d",
  "narasi": "Rekap per jenis dan tahun; keterkaitan dengan visi keilmuan.",
  "unit": "Dosen"
 },
 "34": {
  "bagian": "C.4 IKU d.iv",
  "skor4": "RLP ≥ 3 (paten ×3, TTG/produk/buku ×2, HKI cipta ×1, per DTPS).",
  "bukti": [
   "Sertifikat paten/HKI",
   "Buku ber-ISBN, book chapter",
   "Bukti produk/TTG"
  ],
  "lkps": "Tabel 4.f",
  "narasi": "Rekap per jenis; contoh luaran unggulan.",
  "unit": "Dosen, LPPM"
 },
 "35": {
  "bagian": "C.4 IKU d.v",
  "skor4": "PKDTPS ≥ 50% DTPS punya karya sebagai penulis pertama/korespondensi di jurnal internasional bereputasi/prosiding terindeks atau paten (3 tahun).",
  "bukti": [
   "Daftar artikel per dosen dengan peran penulis",
   "Halaman artikel/indeks"
  ],
  "lkps": "Tabel 4.h",
  "narasi": "Daftar dosen yang memenuhi; rencana pendampingan dosen yang belum.",
  "unit": "Dosen"
 },
 "36": {
  "bagian": "C.4 IKU d.vi",
  "skor4": "PKIB = KIB/NDTPS ≥ 25%.",
  "bukti": [
   "Tangkapan sitasi Scopus/GS per artikel (tanggal diambil)"
  ],
  "lkps": "Tabel 4.i",
  "narasi": "Daftar artikel tersitasi dan jumlah sitasi.",
  "unit": "Dosen"
 },
 "37": {
  "bagian": "C.4 IKU d.vii",
  "skor4": "PRDTPS ≥ 50% DTPS berekognisi (visiting, keynote, editor/reviewer, tenaga ahli, penghargaan).",
  "bukti": [
   "Surat undangan/SK/sertifikat per rekognisi"
  ],
  "lkps": "Tabel 4.j",
  "narasi": "Daftar per dosen dan jenis; tingkat (wilayah/nasional/internasional).",
  "unit": "Dosen"
 },
 "38": {
  "bagian": "C.5 IKU a",
  "skor4": "I akademik: (1) media, perangkat elektronik, alat praktik lab; (2) ruang kelas, lab sesuai panduan asosiasi, perpustakaan; (3) kelayakan; (4) kemudahan akses.\nII nonakademik: (1) kesehatan, konseling, karier, ibadah; (2) kelayakan; (3) kemudahan akses.",
  "bukti": [
   "Daftar ruang dan lab (luas, kapasitas, kepemilikan)",
   "Inventaris alat lab dibanding panduan BMPTTSSI",
   "Data perpustakaan dan e-resources",
   "Foto dan SOP peminjaman/akses",
   "Bukti layanan kesehatan, konseling, karier, ibadah",
   "Survei kepuasan sarana"
  ],
  "lkps": "Tabel 5.a",
  "narasi": "Tabel kecukupan per jenis vs kebutuhan; hasil survei; rencana pengadaan.",
  "unit": "Sarpras, laboratorium"
 },
 "39": {
  "bagian": "C.5 IKU b",
  "skor4": "(1) kebijakan dan tata kelola K3L dengan komitmen memenuhi peraturan; (2) fasilitas K3L; (3) bukti sahih pelaksanaan; (4) tinjauan berkala.",
  "bukti": [
   "Kebijakan dan SOP K3L, SOP laboratorium",
   "Inventaris APAR, P3K, APD, jalur evakuasi",
   "Bukti pelatihan/simulasi, inspeksi, laporan insiden",
   "Notulen tinjauan K3L"
  ],
  "lkps": "Tabel 5.b, 5.c",
  "narasi": "Keempat unsur dengan bukti; temuan inspeksi dan tindak lanjut.",
  "unit": "Unit K3L, laboratorium"
 },
 "40": {
  "bagian": "C.6 IKU a",
  "skor4": "RMD 15–25 DAN NDTPS ≥ 12.",
  "bukti": [
   "Data mahasiswa aktif saat TS (PDDikti/SIAKAD)"
  ],
  "lkps": "Tabel 6.a, 4.a",
  "narasi": "Rasio dan tren; strategi penerimaan.",
  "unit": "Akademik"
 },
 "41": {
  "bagian": "C.6 IKU b",
  "skor4": "PMA ≥ 1%.",
  "bukti": [
   "Data mahasiswa asing (paspor, LoA, program pertukaran)"
  ],
  "lkps": "Tabel 6.a",
  "narasi": "Jumlah dan program; rencana internasionalisasi.",
  "unit": "Kantor internasional"
 },
 "42": {
  "bagian": "C.6 IKU c",
  "skor4": "Rata-rata IPK lulusan 3 tahun ≥ 3,25.",
  "bukti": [
   "Data IPK lulusan per tahun (SIAKAD/PDDikti)"
  ],
  "lkps": "Tabel 6.b",
  "narasi": "Rerata, minimum, maksimum per tahun.",
  "unit": "Akademik"
 },
 "43": {
  "bagian": "C.6 IKU d",
  "skor4": "Akademik (bobot 3) dan nonakademik (bobot 1), 5 tahun: prestasi internasional RI > 0,2% DAN nasional RN > 2% dari jumlah mahasiswa saat TS (wilayah dihitung hingga 4%).",
  "bukti": [
   "Sertifikat/piagam, SK pemenang, tautan berita per prestasi",
   "Data mahasiswa saat TS"
  ],
  "lkps": "Tabel 6.c.1, 6.c.2",
  "narasi": "Rekap per tingkat dan tahun; pembinaan prestasi.",
  "unit": "Kemahasiswaan, HIMA"
 },
 "44": {
  "bagian": "C.6 IKU e",
  "skor4": "MS rata-rata 3,5–4,5 tahun.",
  "bukti": [
   "Data kohort masuk dan lulus per tahun (SIAKAD)"
  ],
  "lkps": "Tabel 6.d",
  "narasi": "Masa studi per kohort; faktor penyebab keterlambatan.",
  "unit": "Akademik"
 },
 "45": {
  "bagian": "C.6 IKU f",
  "skor4": "PTW ≥ 50%.",
  "bukti": [
   "Data kohort (sama dengan butir 44)"
  ],
  "lkps": "Tabel 6.d",
  "narasi": "PTW per kohort; program percepatan (pembimbingan TA).",
  "unit": "Akademik"
 },
 "46": {
  "bagian": "C.6 IKU g",
  "skor4": "RI > 0,01 dan RN > 0,1 per mahasiswa (3 tahun).",
  "bukti": [
   "Tautan/DOI publikasi dengan mahasiswa sebagai PENULIS PERTAMA (Tabel 6.e.1 hanya menghitung itu)"
  ],
  "lkps": "Tabel 6.e.1",
  "narasi": "Rekap per jenis; dorongan publikasi TA.",
  "unit": "Dosen pembimbing"
 },
 "47": {
  "bagian": "C.6 IKU h",
  "skor4": "NLP ≥ 10 (paten ×3, TTG/produk/buku ×2, HKI cipta ×1).",
  "bukti": [
   "Sertifikat HKI, ISBN, bukti produk atas nama mahasiswa"
  ],
  "lkps": "Tabel 6.e.3",
  "narasi": "Rekap per jenis.",
  "unit": "Dosen, kemahasiswaan"
 },
 "48": {
  "bagian": "C.6 IKU i",
  "skor4": "5 aspek: (1) terkoordinasi tingkat PT; (2) reguler tiap tahun dan terdokumentasi; (3) kuesioner memuat pertanyaan inti DIKTI; (4) menyasar seluruh lulusan TS-2..TS-1; (5) hasil disosialisasikan dan dipakai untuk kurikulum dan pembelajaran.",
  "bukti": [
   "SK/pedoman tracer study PT",
   "Kuesioner",
   "Laporan tracer per tahun (tingkat respons)",
   "Notulen sosialisasi dan bukti pemanfaatan hasil"
  ],
  "lkps": "Tabel 6.f.1, 6.f.2, 6.g.1",
  "narasi": "Tingkat respons per tahun lulus; contoh perubahan kurikulum dari hasil tracer.",
  "unit": "Karier/tracer PT"
 },
 "49": {
  "bagian": "C.6 IKU j",
  "skor4": "WT ≤ 3 bulan; responden ≥ 30% lulusan.",
  "bukti": [
   "Data tracer per lulusan (TS-2..TS-1)"
  ],
  "lkps": "Tabel 6.f.1",
  "narasi": "WT per tahun lulus dan persentase responden.",
  "unit": "Karier/tracer PT"
 },
 "50": {
  "bagian": "C.6 IKU k",
  "skor4": "KBK ≥ 60%; responden ≥ 30%.",
  "bukti": [
   "Data tracer (sama dengan butir 49)"
  ],
  "lkps": "Tabel 6.f.2",
  "narasi": "KBK per tahun; bidang kerja lulusan.",
  "unit": "Karier/tracer PT"
 },
 "51": {
  "bagian": "C.6 IKU l",
  "skor4": "Multinasional/internasional > 5% DAN nasional/wirausaha berizin > 20%; responden ≥ 30%.",
  "bukti": [
   "Data tracer (tempat kerja)"
  ],
  "lkps": "Tabel 6.g.1",
  "narasi": "Sebaran tingkat tempat kerja.",
  "unit": "Karier/tracer PT"
 },
 "52": {
  "bagian": "C.6 IKU m",
  "skor4": "Skor = ΣTKi/7 pada 7 aspek (makin banyak \"sangat baik\" makin tinggi).",
  "bukti": [
   "Kuesioner pengguna dan rekap jawaban",
   "Daftar responden pengguna"
  ],
  "lkps": "Tabel 6.g.2",
  "narasi": "Hasil per aspek; tindak lanjut aspek terendah.",
  "unit": "Karier/tracer PT"
 },
 "53": {
  "bagian": "C.7 IKU a.I–II",
  "skor4": "I: (1) dokumen legal unsur pelaksana PM; (2) dokumen auditor independen; (3) dokumen pelaksanaan AMI; (4) dokumen RTM.\nII: perangkat SPMI lengkap (kebijakan, pedoman PPEPP, standar, tata cara dokumentasi), dikembangkan berkelanjutan, DAN pengakuan mutu internasional.",
  "bukti": [
   "SK gugus/unit penjaminan mutu fakultas/prodi",
   "SK auditor AMI (independen dari auditee)",
   "Laporan AMI dan RTM 3 tahun",
   "Kebijakan SPMI, manual, standar, formulir",
   "Sertifikat akreditasi/ISO/IABEE"
  ],
  "lkps": "Tabel 7.a",
  "narasi": "Struktur PM; siklus AMI → RTM; pengakuan eksternal.",
  "unit": "LPM, fakultas"
 },
 "54": {
  "bagian": "C.7 IKT",
  "skor4": "IKT (1) dari tujuan strategis; (2) berdampak dan terukur; (3) menunjukkan daya saing internasional; (4) telah diukur dan dianalisis untuk perbaikan.",
  "bukti": [
   "Dokumen penetapan IKT (SK)",
   "Laporan pengukuran IKT dan analisisnya"
  ],
  "lkps": "",
  "narasi": "Tabel IKT: target, capaian, analisis, perbaikan.",
  "unit": "Prodi, LPM"
 },
 "55": {
  "bagian": "C.7 IKU c",
  "skor4": "(1) dokumen IKU dan IKT tridharma; (2) siklus PPEPP terlaksana; (3) bukti efektivitas; (4) bukti peningkatan standar.",
  "bukti": [
   "Dokumen IKU/IKT",
   "Laporan AMI, daftar temuan, tindakan koreksi, verifikasi",
   "Bukti standar yang dinaikkan (SK revisi standar)"
  ],
  "lkps": "Tabel 7.b",
  "narasi": "Satu siklus PPEPP lengkap sebagai contoh; tabel temuan → tindakan → hasil.",
  "unit": "LPM, prodi"
 },
 "56": {
  "bagian": "C.7 IKU d",
  "skor4": "(1) metode pengukuran tepat; (2) evaluasi indikator tak tercapai dengan akar masalah dan faktor pendukung; (3) tinjauan rutin; (4) hasil disebarluaskan.",
  "bukti": [
   "Laporan kinerja tahunan prodi",
   "Analisis akar masalah (fishbone/5 why)",
   "Notulen rapat tinjauan",
   "Bukti penyebarluasan (web, rapat, surel)"
  ],
  "lkps": "",
  "narasi": "Tabel indikator: target, capaian, status, akar masalah, tindak lanjut.",
  "unit": "Prodi, LPM"
 },
 "57": {
  "bagian": "C.7 IKU e",
  "skor4": "Pengukuran kepuasan SELURUH pemangku memenuhi 6 aspek: instrumen sahih dan andal; berkala dan terekam; analisis tepat; ditindaklanjuti; reviu pengukuran kepuasan dosen dan mahasiswa; hasil dipublikasikan.",
  "bukti": [
   "Instrumen survei (uji validitas/reliabilitas)",
   "Laporan survei per kelompok per tahun",
   "Rencana tindak lanjut dan buktinya",
   "Bukti publikasi hasil"
  ],
  "lkps": "",
  "narasi": "Tabel kepuasan per kelompok dan aspek (tren); tindak lanjut.",
  "unit": "LPM, prodi"
 },
 "58": {
  "bagian": "Bab II.B dan Bab III",
  "skor4": "I: lingkungan makro dan mikro nasional DAN internasional; kebijakan, iptek, pesaing, industri; dianalisis relevansinya; menghasilkan alternatif pengembangan.\nII: SWOT (1) identifikasi tepat; (2) terkait analisis capaian kinerja; (3) strategi sesuai; (4) program alternatif.",
  "bukti": [
   "Data pembanding (prodi pesaing, kebijakan nasional, tren industri)",
   "Matriks SWOT/TOWS dan hasil analisis per kriteria"
  ],
  "lkps": "",
  "narasi": "Tabel makro/mikro → dampak → peluang/ancaman; matriks TOWS; posisi kuadran.",
  "unit": "Prodi, fakultas"
 },
 "59": {
  "bagian": "Bab III",
  "skor4": "Tujuan dari SWOT dengan mempertimbangkan (1) rencana aksi pimpinan dan sumber daya; (2) kebutuhan jangka pendek/menengah; (3) renstra; (4) aspirasi pemangku; (5) program keberlanjutan.",
  "bukti": [
   "Renstra dan rencana operasional",
   "Notulen penyusunan dengan pemangku"
  ],
  "lkps": "",
  "narasi": "Tabel tujuan strategis × lima pertimbangan.",
  "unit": "Fakultas, prodi"
 },
 "60": {
  "bagian": "Bab III",
  "skor4": "Kebijakan dan peraturan turunan yang menjamin (1) alokasi sumber daya; (2) kemampuan melaksanakan; (3) rencana PM berkelanjutan; (4) dukungan pemangku eksternal.",
  "bukti": [
   "Renop/RKAT program pengembangan",
   "Bukti dukungan eksternal (MoU, hibah)"
  ],
  "lkps": "",
  "narasi": "Tabel program: tujuan, kegiatan, anggaran, PJ, indikator, tahun.",
  "unit": "Fakultas, prodi"
 }
};

const esc = s => String(s ?? '').replace(/[&<>"']/g,
  c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// Jenis dokumen bukti bernama (keputusan pemilik 2026-11-03). Diunggah di
// input-butir.html bagian "Dokumen", disimpan di tabel Supabase `dokumen`
// (supabase/13-patch-dokumen.sql), berkasnya di Drive
// data-lkps/dokumen/<jenis>/<tahun>/[<judul>/].
//   tunggal: true  -> satu dokumen per tahun (statuta, kurikulum, renstra,
//                     laporan tahunan). Tahun sama = mengganti, tahun beda =
//                     versi lain. Yang dipakai: tahun terbaru <= TS.
//   tunggal: false -> banyak per tahun; judul/nomor wajib (SK, notulen, ...).
// butir: butir bawaan; saat mengunggah bisa diubah per dokumen.
// id: huruf kecil, angka, garis bawah (juga nama folder Drive).
// Publikasi, penelitian, PkM, HKI, rekognisi TIDAK di sini: tetap lewat form
// karya dosen (input.html) supaya terhitung di skor.
export const JENIS_DOKUMEN = [
  { id: 'statuta', nama: 'Statuta Universitas Pertamina', tunggal: true, butir: ['1', '4'] },
  { id: 'renstra_pt', nama: 'Renstra Universitas Pertamina', tunggal: true, butir: ['1', '59', '60'] },
  { id: 'renstra_upps', nama: 'Renstra fakultas/UPPS', tunggal: true, butir: ['1', '59', '60'] },
  { id: 'sk_vmts', nama: 'SK penetapan VMTS UPPS dan visi keilmuan prodi', tunggal: true, butir: ['1', '2'] },
  { id: 'laporan_vmts', nama: 'Laporan sosialisasi dan survei pemahaman VMTS', tunggal: true, butir: ['3'] },
  { id: 'otk', nama: 'Peraturan organisasi dan tata kerja (OTK) dan struktur organisasi', tunggal: true, butir: ['4'] },
  { id: 'kode_etik', nama: 'Kode etik dosen, tendik, dan mahasiswa', tunggal: true, butir: ['5'] },
  { id: 'pedoman_sdm', nama: 'Peraturan dan rencana pengembangan SDM', tunggal: true, butir: ['5', '26', '27', '28', '29'] },
  { id: 'pedoman_kerjasama', nama: 'Pedoman/standar kerja sama', tunggal: true, butir: ['6', '7'] },
  { id: 'survei_mitra', nama: 'Laporan survei kepuasan mitra kerja sama', tunggal: true, butir: ['7', '57'] },
  { id: 'pedoman_keuangan', nama: 'Pedoman keuangan dan penganggaran', tunggal: true, butir: ['8'] },
  { id: 'laporan_keuangan', nama: 'Laporan realisasi anggaran prodi', tunggal: true, butir: ['8', '9', '10', '11'] },
  { id: 'laporan_audit_keuangan', nama: 'Laporan audit keuangan internal dan eksternal', tunggal: true, butir: ['8'] },
  { id: 'kurikulum', nama: 'Dokumen kurikulum (profil lulusan, CPL, struktur MK)', tunggal: true, butir: ['12', '13', '14', '18', '19', '20'] },
  { id: 'sk_kurikulum', nama: 'SK penetapan kurikulum', tunggal: true, butir: ['12'] },
  { id: 'evaluasi_kurikulum', nama: 'Laporan evaluasi dan pemutakhiran kurikulum', tunggal: true, butir: ['12'] },
  { id: 'peraturan_akademik', nama: 'Peraturan akademik', tunggal: true, butir: ['15', '16', '21', '44', '45'] },
  { id: 'pedoman_integrasi', nama: 'Pedoman integrasi penelitian dan PkM dalam pembelajaran', tunggal: true, butir: ['17'] },
  { id: 'panduan_capstone', nama: 'Panduan capstone design/tugas akhir perancangan', tunggal: true, butir: ['20'] },
  { id: 'peta_jalan_penelitian', nama: 'Peta jalan penelitian', tunggal: true, butir: ['22', '23'] },
  { id: 'peta_jalan_pkm', nama: 'Peta jalan PkM', tunggal: true, butir: ['24', '25'] },
  { id: 'pedoman_sarpras', nama: 'Pedoman sarana prasarana dan daftar laboratorium/alat', tunggal: true, butir: ['38'] },
  { id: 'kebijakan_k3l', nama: 'Kebijakan dan SOP K3L', tunggal: true, butir: ['39'] },
  { id: 'pedoman_kemahasiswaan', nama: 'Pedoman kemahasiswaan dan pembinaan prestasi', tunggal: true, butir: ['43'] },
  { id: 'laporan_tracer', nama: 'Laporan tracer study', tunggal: true, butir: ['48', '49', '50', '51'] },
  { id: 'survei_pengguna', nama: 'Laporan survei kepuasan pengguna lulusan', tunggal: true, butir: ['52'] },
  { id: 'kebijakan_spmi', nama: 'Kebijakan SPMI', tunggal: true, butir: ['53'] },
  { id: 'manual_spmi', nama: 'Manual/pedoman PPEPP SPMI', tunggal: true, butir: ['53', '55'] },
  { id: 'standar_spmi', nama: 'Standar SPMI', tunggal: true, butir: ['53', '55'] },
  { id: 'sk_unit_pm', nama: 'SK unit/gugus penjaminan mutu', tunggal: true, butir: ['53'] },
  // LKPS 7.a baris 4 (30-patch-spmi.sql).
  { id: 'tata_cara_dokumentasi_spmi', nama: 'Tata cara pendokumentasian implementasi SPMI', tunggal: true, butir: ['53', '55'] },
  { id: 'laporan_ami', nama: 'Laporan audit mutu internal (AMI)', tunggal: true, butir: ['53', '55'] },
  { id: 'dokumen_iku_ikt', nama: 'Dokumen IKU dan IKT', tunggal: true, butir: ['54', '55', '56'] },
  { id: 'laporan_kinerja', nama: 'Laporan kinerja tahunan prodi', tunggal: true, butir: ['3', '56'] },
  { id: 'survei_kepuasan', nama: 'Laporan survei kepuasan pemangku kepentingan', tunggal: true, butir: ['16', '57'] },
  { id: 'analisis_swot', nama: 'Analisis lingkungan eksternal dan SWOT', tunggal: true, butir: ['58'] },
  // ---- banyak per tahun: judul/nomor wajib ------------------------------
  { id: 'laporan_cpl', nama: 'Laporan pengukuran capaian CPL', tunggal: false, butir: ['13', '14'], contoh: 'Semester Ganjil 2025/2026' },
  { id: 'rps', nama: 'RPS mata kuliah', tunggal: false, butir: ['15'], contoh: 'TS2101 Mekanika Teknik' },
  { id: 'monev_pembelajaran', nama: 'Laporan monitoring dan evaluasi pembelajaran', tunggal: false, butir: ['15', '16'], contoh: 'Semester Genap 2024/2025' },
  { id: 'kegiatan_ilmiah', nama: 'Kegiatan ilmiah (seminar, kuliah tamu, diskusi)', tunggal: false, butir: ['21'], contoh: 'Kuliah tamu BIM, 12 Mar 2026' },
  { id: 'rekap_bkd', nama: 'Rekap BKD/SISTER DTPS', tunggal: false, butir: ['30'], contoh: 'Semester Ganjil 2025/2026' },
  // Bukti baris Data prodi (29-patch-pustaka-dokumen.sql, pemilik 2026-11-04).
  { id: 'dokumen_kerjasama', nama: 'Dokumen kerja sama (IA/MoA/PKS, bukti pelaksanaan)', tunggal: false, butir: ['6', '7'], contoh: 'IA PT Contoh 2025' },
  { id: 'sk_akreditasi_prodi', nama: 'SK akreditasi program studi', tunggal: false, butir: [], contoh: 'Teknik Lingkungan' },
  { id: 'dokumen_k3l', nama: 'Dokumen K3L (SOP, rencana tanggap darurat)', tunggal: false, butir: ['39'], contoh: 'SOP evakuasi laboratorium' },
  { id: 'dokumen_peningkatan_mutu', nama: 'Dokumen peningkatan mutu (tindak lanjut AMI/RTM)', tunggal: false, butir: ['55', '56'], contoh: 'Tindak lanjut AMI 2025' },
  { id: 'sk_auditor', nama: 'SK auditor AMI', tunggal: false, butir: ['53'], contoh: 'No. 0347/UP-R/SK/HK.01/XI/2022' },
  { id: 'laporan_rtm', nama: 'Laporan Rapat Tinjauan Manajemen (RTM)', tunggal: false, butir: ['53', '55'], contoh: 'RTM Semester Ganjil' },
  { id: 'sk', nama: 'SK lainnya', tunggal: false, butir: [], contoh: 'SK Tim Kurikulum No. 012/2025' },
  { id: 'notulen', nama: 'Notulen rapat', tunggal: false, butir: [], contoh: 'Rapat tinjauan CPL, 5 Feb 2026' },
  { id: 'laporan_kegiatan', nama: 'Laporan kegiatan', tunggal: false, butir: [], contoh: 'Lokakarya kurikulum 2025' },
  { id: 'berkas_pribadi', nama: 'Berkas pribadi dosen/tendik (ijazah, SK jabatan, sertifikat pendidik)', tunggal: false, butir: [], contoh: 'Ijazah S3 Dosen A' },
  { id: 'data_mahasiswa', nama: 'Data mahasiswa (yudisium, ekspor SIAKAD/PDDikti)', tunggal: false, butir: [], contoh: 'Yudisium Agustus 2026' },
  { id: 'data_survei_mentah', nama: 'Jawaban mentah tracer dan survei', tunggal: false, butir: [], contoh: 'Rekap jawaban tracer 2026' },
  { id: 'daftar_hadir', nama: 'Daftar hadir', tunggal: false, butir: [], contoh: 'Rapat kurikulum Maret 2026' },
  { id: 'kontrak_hibah', nama: 'Kontrak atau SK hibah', tunggal: false, butir: [], contoh: 'Kontrak hibah internal 2026' },
  { id: 'sertifikat', nama: 'Sertifikat/piagam', tunggal: false, butir: [], contoh: 'Sertifikat K3 laboran A' },
  { id: 'lainnya', nama: 'Dokumen lain', tunggal: false, butir: [], contoh: 'Judul dokumen' },
];
// Tanpa tautan publik (pemilik 2026-11-06): data pribadi atau internal. Sama
// dengan JENIS_PRIVAT di apps-script/Code.gs.
['rekap_bkd', 'laporan_keuangan', 'laporan_audit_keuangan', 'dokumen_kerjasama', 'laporan_ami', 'laporan_rtm', 'notulen',
 'berkas_pribadi', 'data_mahasiswa', 'data_survei_mentah', 'daftar_hadir', 'kontrak_hibah']
  .forEach(id => { JENIS_DOKUMEN.find(j => j.id === id).privat = true; });
// Bukti baris Data prodi yang privat.
export const TABEL_PRIVAT = ['lkps_mahasiswa_ta', 'lkps_kohort_lulusan', 'lkps_tendik', 'lkps_penggunaan_dana', 'lkps_kerjasama'];
const JENIS = Object.fromEntries(JENIS_DOKUMEN.map(j => [j.id, j]));
export const infoJenis = id => JENIS[id] || { id, nama: id, tunggal: false, butir: [] };
// Butir sebuah baris dokumen: yang diisi saat unggah, atau bawaan jenisnya.
export const butirDokumen = r =>
  (r.butir && r.butir.length) ? r.butir.map(String) : infoJenis(r.jenis).butir;

// Kelompok dokumen untuk satu butir (no) atau semua (no = null), per jenis.
// Jenis tunggal: `utama` = tahun terbaru <= ts (atau terbaru bila ts kosong),
// `lain` = versi lain. Jenis banyak: `lain` = semua entri, tanpa utama.
// Jenis bawaan butir itu yang belum punya dokumen ikut dengan daftar kosong.
export function kelompokDokumen(rows, no, ts){
  const cocok = r => no == null || butirDokumen(r).includes(String(no));
  const per = new Map();
  if (no != null)
    JENIS_DOKUMEN.filter(j => j.butir.includes(String(no))).forEach(j => per.set(j.id, []));
  (rows || []).filter(cocok).forEach(r => {
    if (!per.has(r.jenis)) per.set(r.jenis, []);
    per.get(r.jenis).push(r);
  });
  const urut = id => { const i = JENIS_DOKUMEN.findIndex(j => j.id === id); return i < 0 ? 999 : i; };
  return [...per.entries()].sort((a, b) => urut(a[0]) - urut(b[0])).map(([jenis, xs]) => {
    const j = infoJenis(jenis);
    xs = xs.slice().sort((a, b) => b.tahun - a.tahun || String(a.judul).localeCompare(String(b.judul)));
    if (!j.tunggal) return { jenis, nama: j.nama, tunggal: false, utama: null, lain: xs };
    const utama = xs.find(r => !ts || r.tahun <= ts) || null;
    return { jenis, nama: j.nama, tunggal: true, utama, lain: xs.filter(r => r !== utama) };
  });
}

const aTautan = (u, t) => `<a href="${esc(u)}" target="_blank" rel="noopener nofollow">${esc(t)}</a>`;

// Jenis bukti karya (tabel karya_bukti, supabase/14-patch-bukti-jamak.sql).
export const JENIS_BUKTI_KARYA = [
  ['naskah', 'Naskah/halaman publikasi'],
  ['sk', 'SK/kontrak/surat tugas (privat)'],
  ['korespondensi', 'Bukti korespondensi'],
  ['laporan', 'Laporan'],
  ['sertifikat', 'Sertifikat/piagam'],
  ['foto', 'Foto kegiatan'],
  ['daftar_hadir', 'Daftar hadir (privat)'],
  ['lainnya', 'Lainnya'],
];
export const JENIS_KARYA_PRIVAT = ['sk', 'daftar_hadir'];
// Siapa yang bisa membuka bukti karya, untuk teks di form (pemilik 2026-11-06).
export const teksAksesBukti = jenis => JENIS_KARYA_PRIVAT.includes(jenis)
  ? 'Jenis ini privat: tidak punya tautan publik. Hanya Anda dan admin yang bisa membuka; asesor memakai kata sandi. '
    + 'Untuk laporan SISTER, buka berkasnya lalu buat tautan 2 bulan.'
  : 'Tautannya bisa dibuka siapa pun yang memegangnya (untuk asesor LKPS), tetapi folder prodi tidak bisa dijelajahi.';
export const namaJenisBukti = id => (JENIS_BUKTI_KARYA.find(j => j[0] === id) || [id, id])[1];

// Bukti satu butir dari tabel butir_bukti (keputusan pemilik 2026-11-03):
//   jenis_dokumen -> jenis tunggal di pustaka, SELALU versi berlaku (tahun
//                    terbaru <= ts), versi lain sebagai riwayat;
//   dokumen_id    -> satu entri dokumen (jenis banyak);
//   url           -> berkas/tautan yang diunggah langsung di butir.
// Hasil: [{id, sumber, label, url, lain: [{tahun, url}], ket, unsur}].
export function buktiButir(no, opsi = {}){
  const dok = opsi.dokumen || [];
  return (opsi.butirBukti || []).filter(b => String(b.butir) === String(no)).map(b => ({ ...satuBukti(b, dok, opsi),
    unsur: b.unsur || null }));
}
function satuBukti(b, dok, opsi){
  {
    if (b.jenis_dokumen) {
      const j = infoJenis(b.jenis_dokumen);
      const g = kelompokDokumen(dok.filter(d => d.jenis === b.jenis_dokumen), null, opsi.ts)[0];
      const u = g && g.utama;
      return { id: b.id, sumber: 'jenis', label: u ? `${j.nama} (${u.tahun})` : j.nama,
        url: u ? u.url : '', lain: g ? g.lain.map(x => ({ tahun: x.tahun, url: x.url })) : [],
        ket: u ? 'pustaka, versi berlaku' : 'belum ada versi dengan tahun ≤ TS di pustaka' };
    }
    if (b.dokumen_id) {
      const d = dok.find(x => x.id === b.dokumen_id);
      return { id: b.id, sumber: 'dokumen', lain: [], ket: d ? 'pustaka' : 'entri pustaka tidak ditemukan',
        label: d ? `${infoJenis(d.jenis).nama}: ${d.judul || '—'} (${d.tahun})` : 'Dokumen terhapus',
        url: d ? d.url : '' };
    }
    return { id: b.id, sumber: 'url', label: b.judul || 'Berkas bukti', url: b.url, lain: [], ket: 'diunggah di butir' };
  }
}

// Jenis pustaka yang lazim untuk butir ini (JENIS_DOKUMEN.butir) tetapi
// belum ditautkan — ditampilkan sebagai saran, bukan bukti.
export function saranDokumen(no, butirBuktiRows){
  const sudah = new Set((butirBuktiRows || []).filter(b => String(b.butir) === String(no))
    .map(b => b.jenis_dokumen).filter(Boolean));
  return JENIS_DOKUMEN.filter(j => j.tunggal && j.butir.includes(String(no)) && !sudah.has(j.id));
}

// Blok lipat "Bukti yang disiapkan" untuk satu butir; '' bila tidak ada data.
// opsi = {dokumen, butirBukti, ts}: baris tabel dokumen dan butir_bukti
// (bila ada) dan TS acuan versi.
export function htmlRencana(no, opsi = {}){
  const r = RENCANA_BUKTI[String(no)];
  if (!r) return '';
  const xs = buktiButir(no, opsi);
  const saran = saranDokumen(no, opsi.butirBukti);
  const daftarDok = (xs.length ? `<p><b>Bukti tertaut (${xs.length}):</b></p><ul>${xs.map(x =>
      `<li>${x.url ? aTautan(x.url, x.label) : `${esc(x.label)} <span class="rb-kos">· ${esc(x.ket)}</span>`}${
        x.lain.length ? ` <span class="rb-ket">· versi lain: ${x.lain.map(v => aTautan(v.url, v.tahun)).join(', ')}</span>` : ''}</li>`
    ).join('')}</ul>` : `<p class="rb-kos">Belum ada bukti tertaut.</p>`)
    + (saran.length ? `<p class="rb-ket">Saran dari pustaka dokumen: ${saran.map(j => esc(j.nama)).join('; ')}.</p>` : '');
  return `<details class="rencana-bukti">
    <summary>Bukti yang disiapkan untuk skor 4 (${xs.length} tertaut, ${r.bukti.length} dianjurkan)</summary>
    <p><b>Yang dinilai:</b> ${esc(r.skor4).replace(/\n/g, '<br>')}</p>
    ${daftarDok}<p><b>Bukti yang dianjurkan:</b></p>
    <ul>${r.bukti.map((b, i) => `<li>${esc(b)}${pihakBukti(no, i) ? ` <span class="rb-ket">· ${esc(pihakBukti(no, i))}</span>` : ''}</li>`).join('')}</ul>
    ${UNSUR_BUTIR[String(no)] ? '<p class="rb-ket">Penanggung jawab tiap unsur ada di tabel unsur kartu ini.</p>' : ''}
    <p class="rb-ket">${r.lkps ? `Tabel LKPS: ${esc(r.lkps)} · ` : ''}Bagian LED: ${esc(r.bagian)} ·
      Sumber: ${esc(r.unit)}<br>Narasi: ${esc(r.narasi)}</p>
  </details>`;
}

// Indeks tabel LKPS yang berlaku untuk Sarjana: bukti per baris menurut
// panduan LKPS ("(usulan)" = tidak disebut panduan) dan butir pemakainya.
// Sama dengan sheet "LKPS per tabel" di docs/rencana-bukti-led-lkps.xlsx.
export const LKPS_TABEL = [
 {
  "tabel": "Identitas + PS di UPPS",
  "sheet": "Menu, PS",
  "isi": "SK pendirian PT, SK pembukaan PS, akreditasi, jumlah mahasiswa aktif",
  "jendela": "saat TS (31 Agustus)",
  "bukti": "Salinan SK pendirian PT, SK pembukaan PS, SK akreditasi terbaru",
  "unit": "Rektorat/hukum, akademik",
  "butir": "—"
 },
 {
  "tabel": "1 VMTS",
  "sheet": "1",
  "isi": "Pernyataan VMTS PT, UPPS, visi keilmuan PS",
  "jendela": "yang berlaku",
  "bukti": "Nomor SK + tautan dokumen",
  "unit": "Rektorat, fakultas, prodi",
  "butir": "1"
 },
 {
  "tabel": "2.a Kerja sama",
  "sheet": "2a1, 2a2, 2a3",
  "isi": "Mitra, tingkat, judul, manfaat, tanggal awal/akhir, status, bukti",
  "jendela": "matriks 3 tahun; Excel valid bila beririsan TS-4..TS",
  "bukti": "Surat penugasan, SPK, bukti pelaksanaan (laporan, hasil, luaran), publikasi bersama. MoU/MoA BUKAN bukti realisasi",
  "unit": "Kantor kerja sama, prodi",
  "butir": "6, 7"
 },
 {
  "tabel": "2.b Penggunaan dana",
  "sheet": "2b",
  "isi": "Biaya dosen, tendik, operasional, investasi, kemahasiswaan, penelitian, PkM",
  "jendela": "TS-2..TS",
  "bukti": "(usulan) laporan realisasi anggaran per TA",
  "unit": "Keuangan",
  "butir": "9, 10, 11"
 },
 {
  "tabel": "3.a.1 Kurikulum",
  "sheet": "3a1",
  "isi": "MK, MK kompetensi, SKS kuliah/seminar/praktikum, dokumen RPS, unit penyelenggara",
  "jendela": "kurikulum berlaku saat TS",
  "bukti": "Nama dokumen RPS per MK (tautan RPS)",
  "unit": "Prodi, SIAKAD",
  "butir": "13, 15, 18"
 },
 {
  "tabel": "3.a.3 Integrasi penelitian/PkM",
  "sheet": "3a3",
  "isi": "Dosen, judul, MK, bentuk integrasi, tahun, kesesuaian peta jalan, bukti",
  "jendela": "TS-2..TS",
  "bukti": "Naskah hibah, laporan akhir, atau publikasi; judul tercatat di LPPM",
  "unit": "LPPM, prodi",
  "butir": "17"
 },
 {
  "tabel": "3.a.4 Basic sciences dan matematika",
  "sheet": "3a4",
  "isi": "MK, semester, SKS",
  "jendela": "kurikulum berlaku",
  "bukti": "(usulan) dokumen kurikulum + RPS",
  "unit": "Prodi",
  "butir": "19"
 },
 {
  "tabel": "3.a.5 Capstone design",
  "sheet": "3a5",
  "isi": "MK pendukung dan capstone, SKS, semester, cakupan",
  "jendela": "kurikulum berlaku",
  "bukti": "(usulan) RPS, panduan capstone, contoh laporan",
  "unit": "Prodi",
  "butir": "20"
 },
 {
  "tabel": "3.b Penelitian DTPS",
  "sheet": "3b",
  "isi": "Jumlah judul per sumber dana",
  "jendela": "TS-2..TS",
  "bukti": "Tercatat di LPPM; (usulan) kontrak/SK hibah, laporan akhir",
  "unit": "LPPM",
  "butir": "31"
 },
 {
  "tabel": "3.c PkM DTPS",
  "sheet": "3c",
  "isi": "Jumlah judul per sumber dana",
  "jendela": "TS-2..TS",
  "bukti": "Tercatat di LPPM; (usulan) kontrak/SK hibah, laporan akhir",
  "unit": "LPPM",
  "butir": "32"
 },
 {
  "tabel": "4.a Profil dosen",
  "sheet": "4a",
  "isi": "NIDN/NUPTK, pendidikan, keahlian, kesesuaian kompetensi inti, jabatan, serdos, MK diampu",
  "jendela": "saat TS; MK TS-2..TS",
  "bukti": "Nomor sertifikat pendidik; DTPS dibuktikan mengajar (beban kerja); (usulan) ijazah, SK jabatan",
  "unit": "SDM, PDDikti",
  "butir": "26, 27, 28, 40"
 },
 {
  "tabel": "4.b Tendik",
  "sheet": "4b",
  "isi": "Nama, pendidikan, sertifikat kompetensi, unit kerja",
  "jendela": "saat TS",
  "bukti": "(usulan) ijazah, sertifikat kompetensi",
  "unit": "SDM",
  "butir": "29"
 },
 {
  "tabel": "4.c Beban kerja DTPS",
  "sheet": "4c",
  "isi": "SKS pendidikan, penelitian, PkM, tugas tambahan",
  "jendela": "saat TS",
  "bukti": "(usulan) BKD/SISTER",
  "unit": "SDM",
  "butir": "30"
 },
 {
  "tabel": "4.d Publikasi DTPS",
  "sheet": "4d",
  "isi": "Jumlah judul per jenis",
  "jendela": "TS-2..TS",
  "bukti": "Konfirmasi sesuai SINTA",
  "unit": "SINTA, LPPM",
  "butir": "33"
 },
 {
  "tabel": "4.f Luaran DTPS",
  "sheet": "4f-1 .. 4f-4",
  "isi": "Paten, HKI, TTG/produk, buku ISBN/book chapter",
  "jendela": "TS-2..TS",
  "bukti": "Sertifikat paten (Kemenkum), sertifikat HKI, sertifikat TKT, ISBN; konfirmasi SINTA",
  "unit": "Sentra HKI, SINTA",
  "butir": "34"
 },
 {
  "tabel": "4.h Karya internasional DTPS",
  "sheet": "4h",
  "isi": "Per DTPS jumlah karya penulis pertama/korespondensi",
  "jendela": "TS-2..TS",
  "bukti": "Status penulis pertama/korespondensi; konfirmasi SINTA",
  "unit": "Scopus/SINTA",
  "butir": "35"
 },
 {
  "tabel": "4.i Sitasi",
  "sheet": "4i",
  "isi": "Artikel dan jumlah sitasi",
  "jendela": "TS-2..TS",
  "bukti": "Panduan tidak konsisten: teks = pengindeks internasional, kolom = Google Scholar. Simpan tangkapan bertanggal",
  "unit": "Scopus/GS",
  "butir": "36"
 },
 {
  "tabel": "4.j Rekognisi",
  "sheet": "4j",
  "isi": "Jenis rekognisi, bukti pendukung, tingkat, tahun",
  "jendela": "TS-2..TS",
  "bukti": "Kolom bukti pendukung (surat undangan/SK/sertifikat); satu DTPS diakui satu rekognisi",
  "unit": "Dosen, SDM",
  "butir": "37"
 },
 {
  "tabel": "5.a Prasarana dan alat",
  "sheet": "5a",
  "isi": "Prasarana, alat, kepemilikan, kondisi",
  "jendela": "saat TS",
  "bukti": "Daftar alat utama tiap laboratorium",
  "unit": "Sarpras, laboratorium",
  "butir": "38"
 },
 {
  "tabel": "5.b, 5.c K3L",
  "sheet": "5b, 5c",
  "isi": "Dokumen K3L dan riwayat pengesahan; sarana K3L, fungsi, kondisi",
  "jendela": "saat TS",
  "bukti": "(usulan) dokumen K3L bertanggal, foto dan inventaris",
  "unit": "Unit K3L, sarpras",
  "butir": "39"
 },
 {
  "tabel": "6.a Mahasiswa",
  "sheet": "6a",
  "isi": "Mahasiswa aktif, asing penuh/paruh waktu",
  "jendela": "TS-2..TS",
  "bukti": "Kolom asing wajib diisi walau nol; (usulan) data PDDikti",
  "unit": "Akademik, PDDikti",
  "butir": "40, 41"
 },
 {
  "tabel": "6.b IPK lulusan",
  "sheet": "6b",
  "isi": "Jumlah lulusan, IPK min/rata/maks",
  "jendela": "TS-2..TS",
  "bukti": "(usulan) data yudisium",
  "unit": "Akademik",
  "butir": "42"
 },
 {
  "tabel": "6.c.1, 6.c.2 Prestasi",
  "sheet": "6c1, 6c2",
  "isi": "Kegiatan, waktu, tingkat, prestasi",
  "jendela": "5 tahun (TS-4..TS)",
  "bukti": "(usulan) sertifikat/piagam, berita",
  "unit": "Kemahasiswaan",
  "butir": "43"
 },
 {
  "tabel": "6.d Masa studi",
  "sheet": "6d (blok Sarjana)",
  "isi": "Kohort masuk dan lulus per pita masa studi",
  "jendela": "kohort TS-7..TS; (a)(b) di TS-3",
  "bukti": "(usulan) ekspor SIAKAD",
  "unit": "Akademik",
  "butir": "44, 45"
 },
 {
  "tabel": "6.e.1 Publikasi mahasiswa",
  "sheet": "6e1",
  "isi": "Jumlah judul per jenis, mahasiswa penulis pertama",
  "jendela": "TS-2..TS",
  "bukti": "(usulan) DOI/URL",
  "unit": "Prodi, SINTA",
  "butir": "46"
 },
 {
  "tabel": "6.e.3 Luaran mahasiswa",
  "sheet": "6e3-1 .. 6e3-4",
  "isi": "Paten, HKI, TKT, ISBN",
  "jendela": "TS-2..TS",
  "bukti": "Surat Kemenkum, sertifikat HKI/TKT, ISBN",
  "unit": "Sentra HKI",
  "butir": "47"
 },
 {
  "tabel": "6.f.1 Waktu tunggu",
  "sheet": "6f1 (blok Sarjana)",
  "isi": "Lulusan, terlacak, WT < 3 / 3–18 / > 18 bulan",
  "jendela": "lulusan TS-2..TS-1",
  "bukti": "Laporan tracer study (responden ≥ 30%)",
  "unit": "Tracer PT",
  "butir": "48, 49"
 },
 {
  "tabel": "6.f.2 Kesesuaian bidang kerja",
  "sheet": "6f2",
  "isi": "Rendah/sedang/tinggi",
  "jendela": "TS-2..TS-1",
  "bukti": "Laporan tracer study",
  "unit": "Tracer PT",
  "butir": "50"
 },
 {
  "tabel": "6.g.1 Tempat kerja",
  "sheet": "6g1",
  "isi": "Lokal/nasional/multinasional",
  "jendela": "TS-2..TS-1",
  "bukti": "Laporan tracer study",
  "unit": "Tracer PT",
  "butir": "51"
 },
 {
  "tabel": "6.g.2 Kepuasan pengguna",
  "sheet": "6g2",
  "isi": "7 aspek (%) dan rencana tindak lanjut",
  "jendela": "TS-2..TS-1",
  "bukti": "Laporan survei pengguna",
  "unit": "Tracer PT",
  "butir": "52"
 },
 {
  "tabel": "6.h.1 Penelitian DTPS + mahasiswa",
  "sheet": "6h1",
  "isi": "Dosen, tema peta jalan, mahasiswa, judul",
  "jendela": "TS-2..TS",
  "bukti": "(usulan) SK pembimbing, laporan",
  "unit": "LPPM, prodi",
  "butir": "23"
 },
 {
  "tabel": "6.i PkM DTPS + mahasiswa",
  "sheet": "6i",
  "isi": "Dosen, tema, mahasiswa, judul",
  "jendela": "TS-2..TS",
  "bukti": "KKN dan kegiatan kurikuler tidak dihitung; (usulan) laporan PkM + daftar hadir",
  "unit": "LPPM",
  "butir": "25"
 },
 {
  "tabel": "7.a Dokumen SPMI",
  "sheet": "7a",
  "isi": "Kebijakan, pedoman PPEPP, standar, tata dokumentasi",
  "jendela": "yang berlaku",
  "bukti": "Nomor dan tanggal dokumen",
  "unit": "LPM",
  "butir": "53"
 },
 {
  "tabel": "7.b Pelaksanaan SPMI",
  "sheet": "7b",
  "isi": "Per tahap PPEPP: dokumen, laporan audit, RTM, peningkatan",
  "jendela": "TS-2..TS",
  "bukti": "Semua kolom berupa tautan dokumen",
  "unit": "LPM",
  "butir": "55"
 }
];
