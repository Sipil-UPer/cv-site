// Butir 20, 22, 24 dari bukti per unsur di Data prodi (pemilik 2026-11-10;
// 43-patch-unsur-bukti.sql). Matriks APS-AV 2025 Sarjana menilai empat unsur
// berurutan: 4 = unsur (1)-(4), 3 = (1)-(3), 2 = (1) dan (2), 1 = hanya (1),
// 0 = tidak ada. Unsur dianggap terpenuhi bila buktinya diunggah.
//   butir 20: MK aktif bercentang capstone (ref_mata_kuliah)
//   butir 22: dokumen peta jalan penelitian (lkps_peta_jalan, jenis penelitian)
//   butir 24: dokumen peta jalan PkM        (lkps_peta_jalan, jenis pkm)

export const UNSUR = {
  capstone: ['Panduan pelaksanaan',
    'Rumusan capaian pembelajaran mata kuliah (CPMK)',
    'Standar keteknikan dan batasan realistis dari pengetahuan dan keterampilan kuliah sebelumnya',
    'Bukti sahih pelaksanaan'],
  peta_jalan: ['Peta jalan mendukung VMTS UPPS dan visi keilmuan prodi',
    'Peta jalan memayungi tema dosen dan mahasiswa (pengembangan kapasitas)',
    'Evaluasi berkala untuk keselarasan dengan visi',
    'Dampak positif bagi masyarakat'],
};

// Banyaknya unsur berurutan mulai unsur 1 yang ada buktinya (0-4).
export function skorUnsur(ada){
  let n = 0;
  while (n < 4 && ada.has(n + 1)) n++;
  return n;
}

// ---------------------------------------------------------------------
// Semua butir kualitatif dinilai dari bukti per unsur di kartu butir (tabel
// butir_bukti, kolom unsur; pemilik 2026-11-10), kecuali 20/22/24 (Data prodi).
// Unsur bernomor berlanjut antarkomponen. Label = bukti spesifik yang
// dibutuhkan. Aturan dari matriks APS-AV 2025 Sarjana; tingkatan dalam kalimat
// matriks dipecah menjadi unsur yang bisa dibuktikan. Tanpa bukti = 0.
// ---------------------------------------------------------------------
const urut = (ada, dari, n) => { let k = 0; while (k < n && ada.has(dari + k)) k++; return k; };
const jumlah = (ada, nomor) => nomor.filter(u => ada.has(u)).length;

export const UNSUR_BUTIR = {
  // ---- I. Diferensiasi misi (pemilik 2026-11-10: semua butir kualitatif dari bukti)
  '1': { unsur: {
      1: 'Dokumen yang menunjukkan visi PT diturunkan ke VMTS UPPS (statuta, SK VMTS)',
      2: 'Renstra UPPS yang sesuai dengan VMTS UPPS',
      3: 'Dokumen kurikulum yang menunjukkan kesesuaian visi keilmuan prodi',
      4: 'Notulen/berita acara tinjau ulang VMTS secara periodik' },
    komponen: [{ kunci: 'b1', nomor: [1, 2, 3, 4], aturan: 'Unsur 1–4 berurutan (4 = semua), terendah 2',
      f: ada => Math.max(2, urut(ada, 1, 4)) }] },
  '2': { unsur: {
      1: 'Bukti keterlibatan dosen, mahasiswa, dan tendik dalam penyusunan VMTS (undangan, daftar hadir, notulen)',
      2: 'Bukti keterlibatan lulusan',
      3: 'Bukti keterlibatan pengguna lulusan',
      4: 'Bukti keterlibatan pakar' },
    komponen: [{ kunci: 'b2', nomor: [1, 2, 3, 4], aturan: 'Internal, lalu lulusan, pengguna, pakar berurutan (4 = semua), terendah 1',
      f: ada => Math.max(1, urut(ada, 1, 4)) }] },
  '3': { unsur: {
      1: 'Bukti sosialisasi VMTS ke seluruh pemangku kepentingan',
      2: 'Laporan survei tingkat pemahaman VMTS (internal dan eksternal)',
      3: 'Laporan pencapaian konkret jangka pendek dan menengah VMTS',
      4: 'Bukti VMTS berdampak, berkelanjutan, dan berorientasi masa depan' },
    komponen: [{ kunci: 'b3', nomor: [1, 2, 3, 4], aturan: 'Unsur 1–4 berurutan (4 = semua), terendah 1',
      f: ada => Math.max(1, urut(ada, 1, 4)) }] },
  // ---- II. Akuntabilitas
  '4': { unsur: {
      1: 'Statuta PT yang mengatur struktur organisasi dan kebijakan operasional',
      2: 'SK uraian kewenangan dan tugas yang dijalankan efektif',
      3: 'Bukti sahih pelaksanaan struktur organisasi dan kebijakan operasional',
      4: 'Bukti aras kewenangan organ pokok dijalankan efektif untuk jangka panjang',
      5: 'Bukti tata kelola efektif, transparan, dan akuntabel mendukung kualitas akademik',
      6: 'Bukti lingkungan yang kondusif',
      7: 'Bukti dampak positif bagi pemangku kepentingan internal',
      8: 'Bukti dampak positif bagi pemangku kepentingan eksternal' },
    komponen: [
      { kunci: 'b4_i', nomor: [1, 2, 3, 4], aturan: 'I: unsur 1–4 berurutan, terendah 1', f: ada => Math.max(1, urut(ada, 1, 4)) },
      { kunci: 'b4_ii', nomor: [5, 6, 7, 8], aturan: 'II: unsur 5–8 berurutan, terendah 1', f: ada => Math.max(1, urut(ada, 5, 4)) }] },
  '5': { unsur: {
      1: 'Bukti komitmen pimpinan pada visi dan tujuan organisasi',
      2: 'Bukti komitmen pimpinan pada integritas dan transparansi',
      3: 'Bukti komitmen pimpinan pada pengembangan sumber daya',
      4: 'Bukti kemampuan kepemimpinan',
      5: 'Bukti kemampuan pengambilan keputusan',
      6: 'Bukti kemampuan manajemen konflik',
      7: 'Bukti dampak positif yang signifikan bagi organisasi' },
    komponen: [
      { kunci: 'b5_i', nomor: [1, 2, 3], aturan: 'I: (1)+(2)+(3) → 4; (1) + salah satu → 3; hanya (1) → 2; terendah 1',
        f: ada => !ada.has(1) ? 1 : 2 + jumlah(ada, [2, 3]) },
      { kunci: 'b5_ii', nomor: [4, 5, 6, 7], aturan: 'II: kepemimpinan, keputusan, konflik + dampak → 4; tanpa dampak → 3; dua pertama → 2; satu → 1',
        f: ada => { const k = urut(ada, 4, 3); return k === 3 ? (ada.has(7) ? 4 : 3) : k; } }] },
  '7': { unsur: {
      1: 'Bukti manfaat kerja sama bagi pembelajaran, penelitian, PkM',
      2: 'Bukti peningkatan kinerja tridharma dan fasilitas pendukung',
      3: 'Bukti kepuasan mitra (survei kepuasan mitra)' },
    komponen: [{ kunci: 'b7', nomor: [1, 2, 3], aturan: 'Tiga aspek → 4, dua → 3, satu → 2, tidak ada → 1',
      f: ada => 1 + jumlah(ada, [1, 2, 3]) }] },
  '8': { unsur: {
      1: 'Bukti transparansi pengelolaan keuangan',
      2: 'Bukti kepatuhan terhadap regulasi keuangan',
      3: 'Bukti efisiensi dan efektivitas pengelolaan keuangan',
      4: 'Bukti pengelolaan risiko dan audit internal keuangan',
      5: 'Laporan audit eksternal keuangan' },
    komponen: [{ kunci: 'b8', nomor: [1, 2, 3, 4, 5], aturan: 'Transparansi + kepatuhan wajib (1); lalu 3, 4, 5 berurutan → 2, 3, 4',
      f: ada => !(ada.has(1) && ada.has(2)) ? 0 : 1 + urut(ada, 3, 3) }] },
  // ---- III. Pendidikan
  '12': { unsur: {
      1: 'Dokumen evaluasi dan pemutakhiran kurikulum berkala tiap 4–5 tahun',
      2: 'Bukti keterlibatan pemangku kepentingan internal',
      3: 'Bukti keterlibatan pemangku kepentingan eksternal',
      4: 'Bukti review oleh pakar bidang ilmu',
      5: 'Bukti kesesuaian dengan perkembangan iptek dan kebutuhan pengguna' },
    komponen: [{ kunci: 'b12', nomor: [1, 2, 3, 4, 5], aturan: 'Tanpa unsur 1 → 0; unsur 2–5 berurutan (internal → 1 … iptek → 4)',
      f: ada => !ada.has(1) ? 0 : urut(ada, 2, 4) }] },
  '13': { unsur: {
      1: 'Dokumen profil lulusan yang mempertimbangkan visi UPPS dan visi keilmuan',
      2: 'Bukti mempertimbangkan kebutuhan pengguna (survei/FGD pengguna)',
      3: 'Bukti mempertimbangkan sumber daya yang dimiliki',
      4: 'Bukti mempertimbangkan kepentingan lokal atau nasional',
      5: 'Bukti mempertimbangkan kepentingan global',
      6: 'CPL sesuai kebutuhan pengguna',
      7: 'CPL mengikuti perkembangan iptek dan industri',
      8: 'CPL memuat kompetensi menghadapi persaingan global',
      9: 'Bukti pengukuran dan tinjauan rutin CPL' },
    komponen: [
      { kunci: 'b13_i', nomor: [1, 2, 3, 4, 5], aturan: 'I: unsur 1–5 berurutan: semua → 4, 1–4 → 3, 1–3 → 2, 1–2 → 1',
        f: ada => Math.max(0, urut(ada, 1, 5) - 1) },
      { kunci: 'b13_ii', nomor: [6, 7, 8, 9], aturan: 'II: banyaknya cakupan 6–9 (4 → 4 … 1 → 1), terendah 1',
        f: ada => Math.max(1, jumlah(ada, [6, 7, 8, 9])) }] },
  '14': { unsur: {
      1: 'CPL mencakup konsep rekayasa terapan sesuai disiplin',
      2: 'CPL mencakup kemampuan teknis dan adaptasi standar keteknikan serta teknologi baru',
      3: 'CPL mencakup komunikasi dan kerja tim',
      4: 'CPL mencakup kepatuhan etika profesi',
      5: 'Prosedur dan bukti tinjauan rutin pencapaian CPL',
      6: 'Bukti tinjauan CPL melibatkan pemangku internal',
      7: 'Bukti tinjauan CPL melibatkan pemangku eksternal' },
    komponen: [
      { kunci: 'b14_i', nomor: [1, 2, 3, 4], aturan: 'I: banyaknya cakupan 1–4', f: ada => jumlah(ada, [1, 2, 3, 4]) },
      { kunci: 'b14_ii', nomor: [5, 6, 7], aturan: 'II: prosedur + internal + eksternal → 4; + internal → 3; prosedur saja → 2; terendah 1',
        f: ada => !ada.has(5) ? 1 : ada.has(6) ? (ada.has(7) ? 4 : 3) : 2 }] },
  '15': { unsur: {
      1: 'Dokumen RPS seluruh MK memuat 9 komponen',
      2: 'Bukti RPS dapat diakses mahasiswa (laman/LMS)',
      3: 'Bukti RPS dilaksanakan konsisten (berita acara perkuliahan)',
      4: 'Dokumen RPS ada tetapi belum lengkap',
      5: 'Tinjauan RPS: analisis CPL',
      6: 'Tinjauan RPS: evaluasi kesesuaian materi dan metode',
      7: 'Tinjauan RPS: peninjauan metode penilaian',
      8: 'Tinjauan RPS: penyesuaian kurikulum dan pembaruan materi' },
    komponen: [
      { kunci: 'b15_i', nomor: [1, 2, 3, 4], aturan: 'I: 9 komponen + akses + konsisten → 4; + akses → 3; 9 komponen → 2; belum lengkap → 1',
        f: ada => ada.has(1) ? 2 + urut(ada, 2, 2) : ada.has(4) ? 1 : 0 },
      { kunci: 'b15_ii', nomor: [5, 6, 7, 8], aturan: 'II: unsur 5–8 berurutan (4 = semua)', f: ada => urut(ada, 5, 4) }] },
  '16': { unsur: {
      1: 'Bukti metode pembelajaran yang efektif mencapai CPL',
      2: 'Bukti media dan sumber belajar',
      3: 'Bukti interaksi dosen dan mahasiswa',
      4: 'Bukti peningkatan daya analisis kritis',
      5: 'Pemantauan: peninjauan kesesuaian dengan RPS',
      6: 'Pemantauan: evaluasi metode pembelajaran',
      7: 'Pemantauan: identifikasi peluang perbaikan',
      8: 'Pemantauan: tindakan perbaikan' },
    komponen: [
      { kunci: 'b16_i', nomor: [1, 2, 3, 4], aturan: 'I: unsur 1–4 berurutan, terendah 1', f: ada => Math.max(1, urut(ada, 1, 4)) },
      { kunci: 'b16_ii', nomor: [5, 6, 7, 8], aturan: 'II: unsur 5–8 berurutan (4 = semua)', f: ada => urut(ada, 5, 4) }] },
  '17': { unsur: {
      1: 'Daftar hasil penelitian/PkM yang menjadi bahan ajar di minimal 10% MK inti (Tabel 3.a.3)',
      2: 'Bukti relevansi dengan CPL',
      3: 'Bukti mendukung keunggulan kompetitif UPPS dan prodi',
      4: 'Bukti mengandung kebaruan ilmiah',
      5: 'Bukti mengandung dampak sosial yang positif' },
    komponen: [{ kunci: 'b17', nomor: [1, 2, 3, 4, 5], aturan: 'Tanpa unsur 1 (≥ 10% MK inti) → 0; cakupan 2–5 berurutan, terendah 1',
      f: ada => !ada.has(1) ? 0 : Math.max(1, urut(ada, 2, 4)) }] },
  '21': { unsur: {
      1: 'Kebijakan suasana akademik',
      2: 'Program suasana akademik',
      3: 'Fasilitas pendukung suasana akademik',
      4: 'Laporan evaluasi berkala suasana akademik',
      5: 'Jadwal kegiatan kebebasan/mimbar akademik (lebih dari 6 bulan sekali)',
      6: 'Jadwal kegiatan terjadwal tiap 5–6 bulan',
      7: 'Jadwal kegiatan terjadwal tiap 3–4 bulan',
      8: 'Jadwal kegiatan terjadwal tiap 1–2 bulan' },
    komponen: [
      { kunci: 'b21_i', nomor: [1, 2, 3, 4], aturan: 'I: unsur 1–4 berurutan, terendah 1', f: ada => Math.max(1, urut(ada, 1, 4)) },
      { kunci: 'b21_ii', nomor: [5, 6, 7, 8], aturan: 'II: tiap 1–2 bulan → 4, 3–4 → 3, 5–6 → 2, lebih jarang → 1',
        f: ada => ada.has(8) ? 4 : ada.has(7) ? 3 : ada.has(6) ? 2 : 1 }] },
  // ---- IV. SDM
  '29': { unsur: {
      1: 'Bukti laboran/teknisi/administrator cukup terhadap jumlah laboratorium prodi',
      2: 'Bukti kualifikasi sesuai laboratorium tanggung jawabnya',
      3: 'Sertifikat kompetensi: 10–39% tendik bersertifikat',
      4: 'Sertifikat kompetensi: 40–70% tendik bersertifikat',
      5: 'Sertifikat kompetensi: lebih dari 70% tendik bersertifikat' },
    komponen: [{ kunci: 'b29', nomor: [1, 2, 3, 4, 5],
      aturan: 'Tanpa unsur 1 → 0; cukup saja → 1; cukup + kualifikasi + sertifikat > 70% → 4, 40–70% → 3, 10–39% → 2',
      f: ada => !ada.has(1) ? 0 : !ada.has(2) ? 1 : ada.has(5) ? 4 : ada.has(4) ? 3 : ada.has(3) ? 2 : 1 }] },
  '38': { unsur: {
      1: 'Daftar media pembelajaran, perangkat elektronik, dan alat praktik laboratorium',
      2: 'Daftar ruang kelas, laboratorium sesuai panduan asosiasi, dan perpustakaan',
      3: 'Bukti kelayakan sarpras akademik (pemeliharaan, kalibrasi, inspeksi)',
      4: 'Bukti kemudahan akses sarpras akademik (jadwal, SOP peminjaman, sistem daring)',
      5: 'Bukti pusat kesehatan, layanan konseling, layanan karier, dan fasilitas ibadah',
      6: 'Bukti kelayakan sarpras non-akademik',
      7: 'Bukti kemudahan akses sarpras non-akademik' },
    komponen: [
      { kunci: 'b38_i', nomor: [1, 2, 3, 4], aturan: 'I: unsur 1–4 berurutan (4 = semua), terendah 1',
        f: ada => Math.max(1, urut(ada, 1, 4)) },
      { kunci: 'b38_ii', nomor: [5, 6, 7], aturan: 'II: tiga unsur → 4, dua → 3, hanya satu → 2, terendah 2',
        f: ada => { const n = jumlah(ada, [5, 6, 7]); return n >= 3 ? 4 : n === 2 ? 3 : 2; } }] },
  '39': { unsur: {
      1: 'Kebijakan dan tata kelola K3L, termasuk komitmen memenuhi peraturan K3L',
      2: 'Daftar dan foto fasilitas K3L (APAR, P3K, jalur evakuasi, rambu)',
      3: 'Bukti pelaksanaan K3L (pelatihan, simulasi, inspeksi, catatan insiden)',
      4: 'Laporan tinjauan berkala K3L dan pelaksanaannya' },
    komponen: [{ kunci: 'b39', nomor: [1, 2, 3, 4], aturan: 'Unsur 1–4 berurutan (4 = semua), terendah 1',
      f: ada => Math.max(1, urut(ada, 1, 4)) }] },
  '48': { unsur: {
      1: 'Bukti tracer study terkoordinasi tingkat PT (SK/pedoman pusat karier)',
      2: 'Laporan tracer study tiap tahun (reguler dan terdokumentasi)',
      3: 'Kuesioner yang memuat seluruh pertanyaan inti tracer study DIKTI',
      4: 'Bukti sasaran seluruh lulusan TS-2 s.d. TS-1 (daftar populasi, undangan)',
      5: 'Bukti sosialisasi hasil dan pemakaiannya untuk kurikulum dan pembelajaran' },
    komponen: [{ kunci: 'b48', nomor: [1, 2, 3, 4, 5], aturan: '5 aspek → 4, 4 → 3, 3 → 2, 2 → 1, terendah 1',
      f: ada => Math.max(1, jumlah(ada, [1, 2, 3, 4, 5]) - 1) }] },
  '53': { unsur: {
      1: 'SK pembentukan unit pelaksana penjaminan mutu',
      2: 'SK atau dokumen legal yang menyatakan auditor independen',
      3: 'Laporan audit mutu internal (AMI)',
      4: 'Notulen Rapat Tinjauan Manajemen (RTM)',
      5: 'Kebijakan SPMI',
      6: 'Pedoman penerapan siklus PPEPP',
      7: 'Standar SPMI (kriteria, norma, acuan mutu)',
      8: 'Tata cara pendokumentasian implementasi SPMI',
      9: 'Bukti pengembangan perangkat SPMI secara berkelanjutan (revisi bertanggal)',
      10: 'Pengakuan mutu nasional (akreditasi/sertifikasi nasional)',
      11: 'Pengakuan mutu internasional (akreditasi/sertifikasi internasional)' },
    komponen: [
      { kunci: 'b53_i', nomor: [1, 2, 3, 4], aturan: 'I: dokumen 1–4 berurutan (4 = semua)',
        f: ada => urut(ada, 1, 4) },
      { kunci: 'b53_ii', nomor: [5, 6, 7, 8, 9, 10, 11],
        aturan: 'II: perangkat 5–8 lengkap + berkelanjutan + pengakuan internasional → 4; + pengakuan nasional → 3; '
          + 'lengkap + pengakuan nasional → 2; selain itu 1',
        f: ada => {
          if (jumlah(ada, [5, 6, 7, 8]) < 4) return 1;
          if (ada.has(9) && ada.has(11)) return 4;
          if (ada.has(9) && ada.has(10)) return 3;
          return ada.has(10) || ada.has(11) ? 2 : 1;
        } }] },
  '54': { unsur: {
      1: 'Dokumen IKT yang selaras dengan tujuan strategis organisasi',
      2: 'Bukti IKT berdampak positif dan terukur',
      3: 'Bukti IKT menunjukkan daya saing internasional',
      4: 'Laporan pengukuran dan analisis IKT untuk perbaikan UPPS dan prodi' },
    komponen: [{ kunci: 'b54', nomor: [1, 2, 3, 4], aturan: 'Unsur 1–4 berurutan (4 = semua), terendah 1',
      f: ada => Math.max(1, urut(ada, 1, 4)) }] },
  '55': { unsur: {
      1: 'Dokumen IKU dan IKT pendidikan, penelitian, dan PkM',
      2: 'Bukti siklus PPEPP terlaksana',
      3: 'Bukti efektivitas pelaksanaan penjaminan mutu (hasil dan tindak lanjut AMI)',
      4: 'Bukti peningkatan standar' },
    komponen: [{ kunci: 'b55', nomor: [1, 2, 3, 4], aturan: 'Aspek 1–4 berurutan (4 = semua), terendah 1',
      f: ada => Math.max(1, urut(ada, 1, 4)) }] },
  '56': { unsur: {
      1: 'Metode pengukuran kinerja yang tepat (instrumen/panduan)',
      2: 'Analisis akar masalah indikator yang tidak tercapai dan faktor pendukung',
      3: 'Notulen tinjauan rutin hasil pengukuran kinerja',
      4: 'Bukti penyebarluasan hasil pengukuran kepada pemangku kepentingan' },
    komponen: [{ kunci: 'b56', nomor: [1, 2, 3, 4], aturan: 'Aspek 1–4 berurutan (4 = semua), terendah 1',
      f: ada => Math.max(1, urut(ada, 1, 4)) }] },
  '57': { unsur: {
      1: 'Bukti pengukuran mencakup seluruh pemangku (mahasiswa, dosen, tendik, lulusan, pengguna, mitra)',
      2: 'Instrumen kepuasan yang sahih, andal, dan mudah digunakan',
      3: 'Bukti pelaksanaan berkala dan data terekam lengkap',
      4: 'Laporan analisis kepuasan untuk pengambilan keputusan',
      5: 'Bukti tindak lanjut umpan balik untuk perbaikan',
      6: 'Review pelaksanaan pengukuran kepuasan dosen dan mahasiswa',
      7: 'Publikasi hasil yang mudah diakses dosen dan mahasiswa' },
    komponen: [{ kunci: 'b57', nomor: [1, 2, 3, 4, 5, 6, 7],
      aturan: 'Aspek (1)–(4) [unsur 2–5] wajib. Seluruh pemangku + aspek (5) dan (6) → 4; + salah satu → 3; '
        + 'seluruh pemangku → 2; sebagian pemangku → 1',
      f: ada => {
        if (jumlah(ada, [2, 3, 4, 5]) < 4) return 0;
        if (!ada.has(1)) return 1;
        return ada.has(6) && ada.has(7) ? 4 : ada.has(6) || ada.has(7) ? 3 : 2;
      } }] },
  '58': { unsur: {
      1: 'Analisis kondisi eksternal makro dan mikro tingkat nasional dan internasional',
      2: 'Analisis makro (kebijakan, iptek) dan mikro (pesaing, kebutuhan industri)',
      3: 'Analisis aspek makro dan mikro yang relevan bagi pengembangan prodi',
      4: 'Identifikasi program pengembangan alternatif dari analisis lingkungan',
      5: 'Identifikasi kekuatan, kelemahan, peluang, dan ancaman (SWOT)',
      6: 'Keterkaitan SWOT dengan hasil analisis capaian kinerja',
      7: 'Rumusan strategi pengembangan UPPS',
      8: 'Program pengembangan alternatif dari SWOT' },
    komponen: [
      { kunci: 'b58_i', nomor: [1, 2, 3, 4], aturan: 'I: unsur 1–4 berurutan (4 = semua)', f: ada => urut(ada, 1, 4) },
      { kunci: 'b58_ii', nomor: [5, 6, 7, 8], aturan: 'II: unsur 5–8 berurutan (4 = semua)', f: ada => urut(ada, 5, 4) }] },
  '59': { unsur: {
      1: 'Dokumen penetapan tujuan strategis berdasarkan analisis SWOT',
      2: 'Rencana aksi pimpinan dan kemampuan sumber daya UPPS',
      3: 'Kebutuhan jangka pendek dan jangka menengah UPPS',
      4: 'Kesesuaian dengan tujuan dan renstra UPPS yang berlaku',
      5: 'Aspirasi pemangku kepentingan internal dan eksternal',
      6: 'Program yang menjamin keberlanjutan' },
    komponen: [{ kunci: 'b59', nomor: [1, 2, 3, 4, 5, 6],
      aturan: 'Tanpa unsur 1 → 0. Pertimbangan 2–6 berurutan: semua → 4, 2–5 → 3, 2–4 → 2, kurang → 1',
      f: ada => { if (!ada.has(1)) return 0; const k = urut(ada, 2, 5); return k >= 5 ? 4 : k === 4 ? 3 : k === 3 ? 2 : 1; } }] },
  '60': { unsur: {
      1: 'Kebijakan dan upaya menjamin keberlanjutan program',
      2: 'Bukti alokasi sumber daya',
      3: 'Bukti kemampuan melaksanakan program pengembangan',
      4: 'Rencana penjaminan mutu yang berkelanjutan',
      5: 'Bukti dukungan pemangku kepentingan eksternal',
      6: 'Peraturan turunan yang menjamin keberlanjutan program' },
    komponen: [{ kunci: 'b60', nomor: [1, 2, 3, 4, 5, 6],
      aturan: 'Tanpa unsur 1 → 0. Cakupan 2–5 semua + peraturan turunan → 4; 2–4 + peraturan → 3; 2–3 → 2; kurang → 1',
      f: ada => {
        if (!ada.has(1)) return 0;
        const k = urut(ada, 2, 4);
        return k >= 4 && ada.has(6) ? 4 : k >= 3 && ada.has(6) ? 3 : k >= 2 ? 2 : 1;
      } }] },
};

// Kunci isian (b38_i, b39, ...) -> butir dan komponennya.
export const KUNCI_UNSUR = Object.fromEntries(Object.entries(UNSUR_BUTIR)
  .flatMap(([no, d]) => d.komponen.map(k => [k.kunci, { no, k }])));

// Nomor unsur yang ada buktinya untuk satu butir dari baris unsur_bukti().
export const unsurAda = (no, bukti) => new Set((bukti || [])
  .filter(b => b.tabel === 'butir' && String(b.baris_id) === String(no)).map(b => +b.unsur));

// Skor satu kunci dari bukti per unsur. Tanpa bukti sama sekali = 0
// (pemilik 2026-11-10: tidak ada isian manual lagi). null = bukan kunci
// berunsur, atau data bukti belum terbaca.
export function skorKunci(kunci, bukti){
  const x = KUNCI_UNSUR[kunci];
  if (!x || !bukti) return null;
  const ada = unsurAda(x.no, bukti);
  return ada.size ? x.k.f(ada) : 0;
}

// Dokumen peta jalan berlaku pada TS (tahun akhir TS, mis. 2026 = 2025/2026):
// mulai paling lambat TS, selesai paling cepat TS-1 (kosong = masih berlaku).
export const berlakuTS = (r, ts) =>
  (r.tahun_mulai == null || +r.tahun_mulai <= ts) && (r.tahun_selesai == null || +r.tahun_selesai >= ts - 1);

// Skor butir dari baris dan bukti per unsur.
//   no      '20' | '22' | '24'
//   mk      ref_mata_kuliah aktif (id, kode, nama, capstone)
//   peta    lkps_peta_jalan (id, jenis, judul, tahun_mulai, tahun_selesai)
//   bukti   baris unsur_bukti(): { tabel, baris_id, unsur }
// Hasil null = data belum terbaca (sebelum login / patch belum dijalankan).
// Belum ada MK capstone / dokumen peta jalan berlaku = skor 0 (pemilik 2026-11-10:
// tidak ada isian manual lagi). Lebih dari satu baris: yang terlengkap dipakai.
export function hitungUnsur(no, { mk, peta, bukti, ts }){
  const tabel = no === '20' ? 'ref_mata_kuliah' : 'lkps_peta_jalan';
  if (!bukti || (no === '20' ? !mk : !peta)) return null;
  const baris = no === '20' ? mk.filter(m => m.capstone)
    : peta.filter(r => r.jenis === (no === '22' ? 'penelitian' : 'pkm') && berlakuTS(r, ts));
  if (!baris.length) return { skor: 0, terbaik: null, rinci: [] };
  const rinci = baris.map(r => {
    const ada = new Set(bukti.filter(b => b.tabel === tabel && +b.baris_id === +r.id).map(b => +b.unsur));
    return { id: r.id, label: no === '20' ? `${r.kode || ''} ${r.nama || ''}`.trim() : r.judul || '', ada, skor: skorUnsur(ada) };
  });
  const terbaik = rinci.reduce((a, b) => (b.skor > a.skor ? b : a));
  return { skor: terbaik.skor, terbaik, rinci };
}

// ---------------------------------------------------------------------
// Penanggung jawab (pemilik 2026-11-10): siapa menyiapkan bukti tiap unsur,
// dan siapa menyediakan data untuk butir yang dihitung dari data. Mengikuti
// bunyi matriks ("UPPS memiliki…" = UPPS, "Program Studi…" = prodi) dan pemilik
// dokumennya. Ubah di sini bila pembagian di kampus berbeda.
//   U Universitas · F UPPS (fakultas) · P Prodi · S SPM (penjaminan mutu) · D Dosen
// ---------------------------------------------------------------------
export const PIHAK = { U: 'Universitas', F: 'UPPS', P: 'Prodi', S: 'SPM', D: 'Dosen' };
// '1-3:F 4:P,S' -> {1: ['F'], 2: ['F'], 3: ['F'], 4: ['P', 'S']}
const pj = spec => Object.fromEntries(spec.trim().split(/\s+/).flatMap(bag => {
  const [rentang, kode] = bag.split(':');
  const [a, b = a] = rentang.split('-').map(Number);
  return Array.from({ length: b - a + 1 }, (_, i) => [a + i, kode.split(',')]);
}));
export const PJ_UNSUR = {
  '1': pj('1:F,U 2:F 3:P 4:F'), '2': pj('1:F,P 2-4:F'), '3': pj('1:F,P 2:S 3-4:F'),
  '4': pj('1-2:U 3-8:F'), '5': pj('1-7:F'), '7': pj('1-2:P 3:S'), '8': pj('1-2:U 3:F 4-5:U'),
  '12': pj('1-5:P'), '13': pj('1-9:P'), '14': pj('1-7:P'), '15': pj('1-8:P'), '16': pj('1-4:P 5-8:S'),
  '17': pj('1-5:P'), '20': pj('1-4:P'), '21': pj('1:U 2:P 3:U 4:F 5-8:P'), '22': pj('1:F 2:F,P 3-4:F'),
  '24': pj('1:F 2:F,P 3-4:F'), '29': pj('1:U 2:F 3-5:U'), '38': pj('1-2:P 3-7:U'), '39': pj('1:U 2-3:F 4:U'),
  '48': pj('1-4:U 5:P'), '53': pj('1:U 2-9:S 10-11:U'), '54': pj('1-3:F 4:S'), '55': pj('1:F 2-4:S'),
  '56': pj('1:S 2:F 3:S 4:F'), '57': pj('1-4:S 5:F 6-7:S'), '58': pj('1-8:F'), '59': pj('1-6:F'),
  '60': pj('1:F 2:U 3:F 4:S 5:F 6:U'),
};
// Butir yang dihitung dari data: penyedia datanya.
export const PJ_DATA = {
  '6': 'P', '9': 'U', '10': 'U', '11': 'U', '18': 'P', '19': 'P', '23': 'D,P', '25': 'D,P', '26': 'U,P',
  '27': 'U', '28': 'U', '30': 'D', '31': 'D', '32': 'D', '33': 'D', '34': 'D', '35': 'D', '36': 'D', '37': 'D',
  '40': 'U', '41': 'U', '42': 'U', '43': 'P,U', '44': 'U', '45': 'U', '46': 'D', '47': 'D',
  '49': 'U', '50': 'U', '51': 'U', '52': 'P',
};
const nama = kode => kode.map(k => PIHAK[k]).join(', ');
// Penanggung jawab satu unsur, mis. 'UPPS, Universitas'; '' bila tidak diatur.
export const pihakUnsur = (no, n) => nama(PJ_UNSUR[String(no)]?.[+n] || []);
// Semua pihak untuk satu butir (urutan PIHAK), untuk kepala kartu.
export function pihakButir(no){
  const u = PJ_UNSUR[String(no)], d = PJ_DATA[String(no)];
  const kode = new Set(u ? Object.values(u).flat() : d ? d.split(',') : []);
  return Object.keys(PIHAK).filter(k => kode.has(k)).map(k => PIHAK[k]).join(', ');
}

// Penanggung jawab tiap "bukti yang dianjurkan" (rencana-bukti.js RENCANA_BUKTI,
// urutan sama) pada butir yang dihitung dari data (pemilik 2026-11-10).
// Butir berunsur memakai PJ_UNSUR di tabel unsurnya.
export const PJ_BUKTI = {
  '6': ['U', 'P,D', 'P', 'P'], '9': ['U', 'U', 'U'], '10': ['U', 'U'], '11': ['U', 'U'],
  '18': ['P', 'P'], '19': ['P', 'D'], '23': ['D', 'D'], '25': ['D', 'D'], '26': ['U', 'U', 'P'],
  '27': ['U', 'F'], '28': ['U', 'F'], '30': ['D'], '31': ['D', 'D'], '32': ['D', 'D'], '33': ['D', 'D'],
  '34': ['D', 'D', 'D'], '35': ['D', 'D'], '36': ['D'], '37': ['D'], '40': ['U'], '41': ['U'], '42': ['U'],
  '43': ['P', 'U'], '44': ['U'], '45': ['U'], '46': ['D'], '47': ['D'], '49': ['U'], '50': ['U'], '51': ['U'],
  '52': ['P', 'P'],
};
// Penanggung jawab bukti ke-i (0-based) yang dianjurkan untuk butir `no`; '' bila tidak diatur.
export const pihakBukti = (no, i) => nama(String(PJ_BUKTI[String(no)]?.[i] || '').split(',').filter(Boolean));
