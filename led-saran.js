/* =====================================================================
   led-saran.js — saran kalimat untuk tiap isian Narasi LED (pemilik
   2026-11-05). Hanya kerangka: bagian [..] wajib diganti fakta prodi, jadi
   tidak ada fakta yang dikarang. Isian yang masih memuat [..] tidak dihitung
   selesai dan tampil merah di draf LED.

   Urutan pencarian (saranIsian): lingkup|label, kalimat|label|urutan,
   kalimat|label, lalu label.
   ===================================================================== */

const TOPIK = {
  C1: 'VMTS dan kekhasan prodi', C2: 'tata pamong, kerja sama, dan keuangan',
  C3: 'kurikulum, pembelajaran, penelitian, dan PkM', C4: 'dosen dan tenaga kependidikan',
  C5: 'sarana, prasarana, dan K3L', C6: 'mahasiswa dan lulusan', C7: 'penjaminan mutu',
};

const LABEL = {
  // Bagian awal dan penutup
  'kata pengantar dari pimpinan UPPS atau ketua program studi, termasuk ucapan terima kasih kepada tim penyusun dan pemangku kepentingan':
    'Puji syukur kami panjatkan atas selesainya Laporan Evaluasi Diri Program Studi [nama prodi]. Laporan ini disusun sebagai bahan refleksi dan peningkatan mutu berkelanjutan. Kami menyampaikan terima kasih kepada tim penyusun, dosen, tenaga kependidikan, mahasiswa, alumni, dan mitra yang telah mendukung penyusunan laporan ini.',
  'ringkasan proses penyusunan': 'Penyusunan dilakukan oleh tim yang ditetapkan dengan [nomor SK] selama [bulan-bulan], melalui pengumpulan data, verifikasi, analisis capaian, dan lokakarya bersama pemangku kepentingan.',
  'capaian utama program studi pada TS ini, dikaitkan dengan VMTS dan target renstra': 'Pada TS ini prodi mencapai [capaian 1] dan [capaian 2], yang mendukung visi keilmuan pada [bidang] dan sasaran Renstra [nomor sasaran].',
  'dasar penyusunan LED, tujuan, ruang lingkup, dan sistematika laporan': 'dasar penyusunan LED, yaitu instrumen APS-AV 2025 LAM Teknik; tujuannya mengevaluasi capaian dan menetapkan rencana pengembangan; ruang lingkupnya tujuh kriteria; dan sistematikanya terdiri atas pendahuluan, kriteria, analisis, serta penutup',
  'nomor dan tanggal SK tim': 'SK [pejabat] Nomor [nomor] tanggal [tanggal]',
  'nama anggota tim': '[nama ketua] selaku ketua, [nama anggota], dan [nama anggota]',
  'unit dan pemangku kepentingan internal dan eksternal': 'pimpinan UPPS, unit penjaminan mutu, dosen, tenaga kependidikan, mahasiswa, alumni, dan mitra [nama mitra]',
  'sumber data': 'sistem data prodi, PDDikti, SISTER, laporan tracer study, dan unit [nama unit]',
  'penanggung jawab': 'ketua tim penyusun dan unit penjaminan mutu',
  'tahapan dan tanggal': 'persiapan [tanggal], pengumpulan data [tanggal], analisis [tanggal], lokakarya [tanggal], dan finalisasi [tanggal]',
  'kesimpulan akhir: temuan utama, kekuatan, kelemahan yang perlu diperbaiki, serta peluang dan ancaman yang harus dikelola':
    'Evaluasi diri menunjukkan kekuatan utama pada [kekuatan] dan kelemahan yang perlu diperbaiki pada [kelemahan]. Peluang [peluang] akan dimanfaatkan dan ancaman [ancaman] dikelola melalui program pengembangan yang dipantau dalam siklus PPEPP.',
  // Kriteria
  'tujuan kriteria bagi UPPS dan prodi': 'memastikan [aspek kriteria] berjalan sesuai sasaran strategis UPPS dan mendukung capaian prodi',
  'latar belakang dan rasional, dikaitkan dengan VMTS UPPS dan visi keilmuan Program Studi X': '',
  'daftar nomor, judul, dan tahun dokumen': '[Nama dokumen] No. [nomor] Tahun [tahun]; [nama dokumen] No. [nomor] Tahun [tahun]',
  'dokumen lain yang belum ada di pustaka, bila ada': '[Nama dokumen] No. [nomor] Tahun [tahun]',
  'capaian yang menonjol dan yang belum optimal': 'Capaian yang menonjol adalah [butir dan angkanya], sedangkan yang belum optimal adalah [butir dan angkanya].',
  'hasil analisis akar masalah, misalnya diagram tulang ikan': 'Dari analisis tulang ikan, penyebab utamanya adalah [penyebab pada manusia], [penyebab pada metode], dan [penyebab pada sumber daya].',
  // Tiap butir
  'uraian capaian dan maknanya bagi prodi': 'Capaian ini menunjukkan [naik/turun/stabil] dibanding tahun sebelumnya karena [penyebab], dan berarti [dampak bagi mutu prodi].',
  'angka per tahun': '[angka TS-2], [angka TS-1], dan [angka TS]',
  'target Renstra atau IKU': '[angka target] pada [tahun] menurut Renstra [nomor sasaran]',
  'faktor pendukung dan akar masalah bila target belum tercapai': 'target [tercapai/belum tercapai]; faktor pendukungnya [faktor], dan akar masalahnya [penyebab]',
  'kegiatan, penanggung jawab, tenggat, indikator keberhasilan': '[kegiatan] oleh [penanggung jawab] sampai [tenggat], dengan indikator [ukuran keberhasilan]',
  // C.1
  'rumusan visi keilmuan prodi': '[rumusan visi keilmuan sesuai SK]', 'visi PT': '[rumusan visi perguruan tinggi]',
  'nama UPPS dan visinya': '[nama UPPS]: [rumusan visi UPPS]',
  'bidang kekhasan dan keunggulan kompetitif prodi': '[bidang keilmuan], didukung [laboratorium/kerja sama/kompetensi dosen]',
  'Renstra: nomor dan periode': 'Renstra [nama unit] No. [nomor] periode [tahun]–[tahun]',
  'CPL atau mata kuliah yang mencerminkan kekhasan': 'CPL [nomor] dan mata kuliah [nama mata kuliah]',
  'tahun dan forum peninjauan': '[tahun] dalam [lokakarya/rapat tinjauan manajemen]',
  'tahapan penyusunan, misalnya lokakarya, rapat, survei': 'analisis kebutuhan, survei pemangku kepentingan, lokakarya pada [tanggal], dan penetapan oleh [pejabat]',
  'notulen, daftar hadir, SK tim, dan tahun pelaksanaan': 'notulen dan daftar hadir [kegiatan] tahun [tahun], serta SK tim Nomor [nomor]',
  'sasaran sosialisasi': 'dosen, tenaga kependidikan, mahasiswa, alumni, dan mitra',
  'media dan kegiatan sosialisasi': 'situs prodi, media sosial, papan informasi, kuliah perdana, dan rapat [berkala]',
  'metode, misalnya survei pemahaman VMTS': 'survei pemahaman VMTS kepada [jumlah] responden',
  'persentase responden yang memahami': '[persentase]% responden memahami VMTS',
  'daftar capaian konkret beserta tahunnya': '[capaian 1] ([tahun]) dan [capaian 2] ([tahun])',
  // C.2
  'nomor SK atau peraturan': 'Peraturan [pejabat] No. [nomor] Tahun [tahun]',
  'statuta dan nomornya': 'Statuta [nama PT] No. [nomor] Tahun [tahun]',
  'dokumen organisasi dan tata kerja atau SOP': 'Peraturan Organisasi dan Tata Kerja No. [nomor] dan SOP [nama SOP]',
  'bukti kredibilitas, transparansi, akuntabilitas, tanggung jawab, dan keadilan, misalnya laporan kinerja, rapat terbuka, mekanisme pengaduan':
    'laporan kinerja tahunan yang dipublikasikan, rapat terbuka [berkala], audit [jenis audit], dan kanal pengaduan [nama kanal]',
  'kebijakan atau program terkait visi dan tujuan strategis': 'program [nama program] yang mendukung sasaran Renstra [nomor sasaran]',
  'dokumen kode etik': 'Kode Etik No. [nomor] Tahun [tahun]',
  'program studi lanjut, pelatihan, sertifikasi': 'studi lanjut [jumlah] dosen, pelatihan [nama pelatihan], dan sertifikasi [nama sertifikasi]',
  'contoh pengambilan keputusan dan penyelesaian konflik beserta dampaknya bagi organisasi': 'pada [tahun], pimpinan memutuskan [keputusan] untuk mengatasi [masalah], dengan dampak [hasil]',
  'contoh manfaat konkret': '[jumlah] mahasiswa magang di [mitra] dan [jumlah] topik tugas akhir dari mitra',
  'instrumen survei kepuasan mitra': 'kuesioner kepuasan mitra tahun [tahun] dengan [jumlah] responden',
  'ringkasan hasil': '[persentase]% mitra menyatakan puas; aspek terendah [aspek]',
  'peraturan keuangan PT': 'Peraturan Keuangan [nama PT] No. [nomor] Tahun [tahun]',
  'mekanisme perencanaan anggaran': 'usulan RKA prodi kepada UPPS setiap [bulan], dibahas dalam [forum]',
  'auditor internal atau eksternal dan tahun audit': '[nama auditor] pada tahun [tahun]',
  'mekanisme': 'register risiko keuangan yang ditinjau [berkala] oleh [unit]',
  // C.3
  'nomor SK kurikulum': 'SK [pejabat] No. [nomor] Tahun [tahun]',
  'pemangku kepentingan internal dan eksternal yang terlibat': 'dosen, mahasiswa, alumni, pengguna lulusan, dan asosiasi [nama asosiasi]',
  'nama dan instansi pakar': '[nama pakar] dari [instansi]',
  'daftar profil lulusan': '[profil 1], [profil 2], dan [profil 3]',
  'jumlah CPL': '[jumlah]',
  'mekanisme pengukuran CPL, misalnya laporan capaian CPL per semester': 'laporan capaian CPL tiap semester dari nilai asesmen mata kuliah',
  'nomor CPL untuk tiap aspek': 'CPL [nomor] (konsep rekayasa), CPL [nomor] (teknis), CPL [nomor] (komunikasi dan kerja tim), CPL [nomor] (etika)',
  'forum tinjauan': 'rapat kurikulum prodi', 'pemangku kepentingan internal dan eksternal': 'dosen, mahasiswa, alumni, dan pengguna lulusan',
  'ringkasan': 'penyesuaian CPL [nomor] dan mata kuliah [nama mata kuliah] pada [tahun]',
  'sistem atau tautan': 'LMS [nama LMS] dan situs prodi',
  'frekuensi dan mekanisme': 'setiap [tahun/semester] melalui rapat kelompok keahlian',
  'semester dan tahun': 'semester [ganjil/genap] [tahun]',
  'metode, misalnya PBL atau studi kasus': 'pembelajaran berbasis proyek, studi kasus, dan praktikum',
  'LMS, laboratorium': 'LMS [nama LMS], laboratorium [nama laboratorium], dan perangkat lunak [nama]',
  'bentuk': 'diskusi, bimbingan, dan umpan balik tugas',
  'instrumen, misalnya monitoring kesesuaian materi dengan RPS dan EDOM': 'monitoring kesesuaian materi dengan RPS dan EDOM',
  'contoh tindakan perbaikan': 'pendampingan dosen pada mata kuliah [nama] setelah EDOM [semester]',
  'contoh mata kuliah dan topik': '[nama mata kuliah] dengan topik [topik penelitian]',
  'uraian singkat': 'hasil [judul penelitian] memperbarui materi [topik] dan dipakai sebagai studi kasus',
  'daftar mata kuliah atau kegiatan': '[nama mata kuliah praktikum] dan kerja lapangan [nama kegiatan]',
  'nama mata kuliah dan SKS': '[nama mata kuliah] ([jumlah] SKS)', 'daftar mata kuliah': '[mata kuliah penunjang]',
  'panduan capstone': 'Panduan Capstone Design No. [nomor] Tahun [tahun]',
  'rumusan CPMK': 'mahasiswa mampu merancang [sistem/komponen] dengan batasan realistis',
  'standar yang dipakai, misalnya SNI': 'SNI [nomor] dan [standar lain]', 'laporan, poster, atau dokumen': 'laporan akhir, poster, dan dokumen rancangan',
  'seminar, kuliah tamu, kelompok studi': 'seminar [berkala], kuliah tamu, dan kelompok studi [nama]',
  'ruang diskusi, laboratorium': 'ruang diskusi, laboratorium, dan perpustakaan',
  'contoh kegiatan dan jadwalnya': '[nama kegiatan] setiap [jadwal]',
  'tema utama': '[tema 1] dan [tema 2]', 'periode': '[tahun]–[tahun]', 'contoh dampak': '[hasil kegiatan] yang dimanfaatkan [masyarakat/mitra]',
  // C.4
  'jumlah laboran, teknisi, dan administrator': '[jumlah] laboran, [jumlah] teknisi, dan [jumlah] tenaga administrasi',
  'pendidikan dan sertifikat kompetensi': 'pendidikan [jenjang] dan sertifikat [nama sertifikat]',
  'jumlah laboratorium dan beban layanan': '[jumlah] laboratorium dan [jumlah] mahasiswa praktikum per semester',
  'analisis sebaran beban pendidikan, penelitian, PkM, dan tugas tambahan': 'Beban terbesar ada pada [kegiatan]; rerata [angka] SKS berada [di dalam/di luar] rentang ideal, sehingga [tindak lanjut].',
  // C.5
  'ruang kelas, laboratorium sesuai panduan asosiasi, perpustakaan, media pembelajaran, perangkat lunak': 'ruang kelas, laboratorium [nama laboratorium], perpustakaan, dan perangkat lunak [nama]',
  'uraian, kelayakan, dan kemudahan akses': 'seluruh layanan tersedia di [lokasi] dan dapat diakses [cara akses]',
  'APAR, jalur evakuasi, P3K, APD laboratorium': 'APAR, jalur evakuasi, kotak P3K, dan APD laboratorium',
  'inspeksi, pelatihan, simulasi': 'inspeksi [berkala], pelatihan K3, dan simulasi evakuasi tahun [tahun]',
  // C.6
  'unit tingkat PT': '[nama unit karier/alumni]', 'persentase': '[persentase]%', 'sasaran': 'dosen, mahasiswa, dan pimpinan',
  'contoh perbaikan kurikulum dan pembelajaran': 'penambahan materi [topik] pada mata kuliah [nama mata kuliah]',
  'instrumen dan jumlah responden': 'kuesioner kepuasan pengguna kepada [jumlah] responden',
  'aspek terkuat, aspek terlemah, dan tindak lanjutnya': 'Aspek terkuat adalah [aspek] dan terlemah [aspek]; tindak lanjutnya [kegiatan].',
  // C.7
  'nomor SK': 'SK [pejabat] No. [nomor] Tahun [tahun]', 'dasar': 'karena auditor berasal dari [unit di luar prodi] dan tersertifikasi [lembaga]',
  'tahun atau siklus': 'setiap tahun; terakhir [tahun]', 'tanggal RTM': 'pada [tanggal]', 'nomor dokumen': 'No. [nomor]',
  'akreditasi, sertifikasi, atau audit eksternal': 'akreditasi [peringkat] dari [lembaga] sampai [tanggal]',
  'daftar IKT beserta target': '[nama IKT] dengan target [angka] pada [tahun]', 'capaian': '[angka capaian]',
  'satu siklus lengkap dari penetapan sampai peningkatan standar': 'standar [nama] ditetapkan [tahun], dilaksanakan, dievaluasi lewat AMI [tahun], dikendalikan lewat RTM, dan ditingkatkan menjadi [standar baru]',
  'temuan AMI dan tindak lanjutnya': 'temuan AMI [tahun] tentang [temuan] telah ditindaklanjuti dengan [tindakan]',
  'metode': 'pengukuran IKU dan IKT setiap [berkala]', 'forum': 'rapat tinjauan manajemen', 'media': 'situs prodi dan rapat dosen',
  'ringkasan per kelompok': 'mahasiswa [nilai], dosen [nilai], tenaga kependidikan [nilai], lulusan [nilai], pengguna [nilai], mitra [nilai]',
  'instrumen dan periode': 'survei kepuasan tahun [tahun]',
  'uraian': '[uraian singkat dengan data pendukung]',
  // Bab III
  'kebijakan nasional, perkembangan iptek bidang teknik sipil, isu strategis': 'kebijakan [nama kebijakan], perkembangan [teknologi di bidang prodi], dan isu [isu strategis]',
  'pesaing, pengguna lulusan, kebutuhan dunia usaha dan industri': 'prodi sejenis di [wilayah], kebutuhan pengguna lulusan akan [kompetensi], dan tren industri [sektor]',
  'kuadran dan alasannya': 'kuadran [nomor], karena kekuatan [kekuatan] dan peluang [peluang] lebih besar daripada [kelemahan]',
  'daftar tujuan strategis': '[tujuan 1], [tujuan 2], dan [tujuan 3]',
  'program, target, indikator, dan tahun': '[program] dengan target [angka], indikator [ukuran], pada [tahun]',
};

// Label sama dengan isi berbeda menurut butir.
const LINGKUP = {
  'b3|tahun': '[tahun]', 'b12|tahun': '[tahun]', 'b54|tahun': '[tahun]',
  'b7|contoh': '[jumlah] publikasi bersama dan pemanfaatan fasilitas [nama mitra]',
  'b16|contoh': 'bimbingan dan umpan balik pada tugas [nama tugas]',
  'b56|contoh': 'indikator [nama] tidak tercapai karena [penyebab]',
  'b14|frekuensi': 'setiap [tahun/semester]', 'b16|frekuensi': 'setiap semester', 'b39|frekuensi': 'setiap [bulan/tahun]',
  'b21|dokumen': 'Peraturan Akademik No. [nomor] Tahun [tahun]', 'b39|dokumen': 'Kebijakan K3L No. [nomor] Tahun [tahun]', 'b55|dokumen': 'Dokumen IKU dan IKT Tahun [tahun]',
  'b21|mekanisme evaluasi': 'survei suasana akademik setiap [tahun]', 'b22|mekanisme evaluasi': 'tinjauan tahunan oleh kelompok keahlian', 'b24|mekanisme evaluasi': 'tinjauan tahunan oleh kelompok keahlian',
  'b48|periode': '[bulan] setiap tahun', 'b15|jumlah': '[jumlah]', 'b17|jumlah': '[jumlah]',
  'b38|uraian': 'seluruh ruang dalam kondisi [kondisi] dan dapat diakses [jam layanan]',
  'b58|uraian': '[alternatif pengembangan], karena [alasan]',
};
const KALIMAT = {
  'ringkasan2|uraian|1': '[kekuatan 1] dan [kekuatan 2]', 'ringkasan2|uraian|2': '[tantangan 1] dan [tantangan 2]', 'ringkasan2|uraian|3': '[program prioritas]',
  'analisis1|uraian': '[faktor kepemimpinan], [faktor sumber daya], dan [faktor kerja sama]',
};
const SWOT = [
  t => `Kekuatan dalam ${t} adalah [kekuatan], dibuktikan dengan [data].`,
  t => `Kelemahan dalam ${t} adalah [kelemahan], terlihat dari [data].`,
  t => `Peluang bagi ${t} adalah [peluang dari luar prodi].`,
  t => `Ancaman bagi ${t} adalah [ancaman dari luar prodi].`,
  t => `SO: [gunakan kekuatan untuk peluang]; WO: [perbaiki kelemahan lewat peluang]; ST: [gunakan kekuatan menghadapi ancaman]; WT: [kurangi kelemahan dan ancaman].`,
];

// Saran untuk satu kunci isian (lingkup|kalimat|label|urutan), atau ''.
export function saranIsian(kunci){
  const [lingkup, id, label, n] = String(kunci).split('|');
  const swot = /^swot(\d)$/.exec(id);
  if (swot && TOPIK[lingkup]) return SWOT[+swot[1]](TOPIK[lingkup]);
  if (/^latar belakang dan rasional/.test(label || ''))
    return `Kriteria ini penting karena ${TOPIK[lingkup] || 'kriteria ini'} menentukan tercapainya visi keilmuan prodi pada [bidang]. Latar belakangnya [kondisi prodi saat ini].`;
  return LINGKUP[`${lingkup}|${label}`] || KALIMAT[`${id}|${label}|${n}`] || KALIMAT[`${id}|${label}`] || LABEL[label] || '';
}

// Isian yang masih memuat [..] belum selesai.
export const masihKerangka = t => /\[[^\]]+\]/.test(String(t || ''));
