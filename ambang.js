/* =====================================================================
   AMBANG SYARAT PERLU PERINGKAT — dibaca oleh monitoring.html
   -------------------------------------------------------------------
   Sumber: Pedoman Penilaian Instrumen LAM Teknik 2025, Tabel 4.3.1
   (hlm. 25–26), "Syarat Perlu Terakreditasi Unggul dan Terakreditasi
   Program Sarjana / PJJ Sarjana". Diverifikasi dari PDF 2026-10-12;
   lihat docs/analisis-instrumen-lam-teknik-2025.md §2.2. Nomor `no`
   mengikuti tabel itu (1–9). Jangan pakai berkas ini untuk jenjang lain.

   Tiga sasaran:
     t  = syarat perlu Terakreditasi                   (tanda *  )
     u3 = Terakreditasi Unggul, masa berlaku 3 tahun   (tanda ** )
     u5 = Terakreditasi Unggul, masa berlaku 5 tahun   (tanda ***)
   Ambang yang tidak ditulis untuk satu sasaran = tidak disyaratkan
   (tanda x di tabel). Semua syarat harus terpenuhi; satu syarat gagal
   menggugurkan sasaran tersebut. Gagal satu syarat Terakreditasi berarti
   Tidak Terakreditasi, berapa pun nilai akreditasinya (Tabel 3).

   Daftar ini LENGKAP untuk Sarjana (9 syarat). Penomoran lama (1–15)
   berasal dari tabel lintas jenjang; nomor 9–11 di sana adalah syarat
   publikasi mahasiswa yang hanya berlaku untuk Magister/Doktor.

   Status akreditasi lengkap (nilai akreditasi + syarat) dihitung di
   halaman skor (skor.html, aturan di syarat-unggul.js). Tiga syarat
   rerata (1, 2, 9) juga dihitung di sana dari skor butir manual.

   -------------------------------------------------------------------
   Setiap butir:
     no        nomor butir pada instrumen
     id        kunci yang dikenali monitoring.html (JANGAN diubah)
     label     nama tampilan
     ambang    {u3, u5} — angka batas untuk tiap sasaran
     satuan    '%' | 'bulan' | 'sks' | 'skor'
     arah      'min' = capaian harus >= ambang
               'max' = capaian harus <= ambang
     jendela   pembatas tahun sesuai bunyi instrumen (lihat tiap butir)
     manual    true bila tidak dapat dihitung dari data.json; isi
               `capaian` dengan angka, atau biarkan null bila belum ada
   ===================================================================== */

window.AMBANG = {

  // Dinaikkan setiap kali STRUKTUR berkas ini berubah (bukan saat angkanya
  // diubah). monitoring.html menolak format lama dengan pesan yang jelas
  // daripada menampilkan tabel kosong tanpa ambang.
  format: 2,

  instrumen: {
    nama: 'Syarat perlu peringkat — LAM Teknik',
    jenjang: 'Sarjana / PJJ Sarjana',
    versi: 'APS-AV 2025 1.0 · Pedoman Penilaian Tabel 4.3.1',
    diperbarui: '2026-10-12',
    butir_lengkap: true,    // 9 syarat Sarjana lengkap (diverifikasi 2026-10-12)
  },

  // `utama: true` menandai sasaran yang sedang dikejar prodi. Sasaran
  // utama ditonjolkan di halaman monitoring; sasaran lain tetap tampil
  // sebagai pembanding. Pindahkan tandanya bila sasaran berubah.
  sasaran: [
    { id: 't',  label: 'Terakreditasi',    tanda: '*'   },
    { id: 'u3', label: 'Unggul · 3 tahun', tanda: '**'  },
    { id: 'u5', label: 'Unggul · 5 tahun', tanda: '***', utama: true },
  ],

  butir: [

    // ---- Butir bermatriks: skor dari tabel penilaian, diisi tangan ----
    {
      no: 1, id: 'tata_pamong', manual: true,
      label: 'Sistem tata pamong',
      ambang: { t: 2.00, u3: 3.00, u5: 3.50 }, satuan: 'skor', arah: 'min',
      capaian: null,
      sumber: 'Syarat 1, rerata skor matriks Tabel 5.1 (butir 4-I, 4-II, 5-I, 5-II)',
      catatan: 'Kelengkapan struktur dan kebijakan operasional, Good University ' +
               'Governance, komitmen dan kemampuan manajerial pimpinan UPPS. ' +
               'Rerata dihitung otomatis di halaman skor dari butir manual.',
    },
    {
      no: 2, id: 'kurikulum', manual: true,
      label: 'Kurikulum',
      ambang: { t: 2.00, u3: 3.00, u5: 3.50 }, satuan: 'skor', arah: 'min',
      capaian: null,
      sumber: 'Syarat 2, rerata skor matriks Tabel 5.2 (butir 12, 13-I, 13-II, 16-I, 16-II)',
      catatan: 'Keterlibatan pemangku kepentingan dalam evaluasi dan pemutakhiran, ' +
               'profil lulusan, penurunan CPL, proses pembelajaran, tinjauan rutin. ' +
               'Rerata dihitung otomatis di halaman skor dari butir manual.',
    },
    {
      no: 9, id: 'penjaminan_mutu', manual: true,
      label: 'Penjaminan mutu',
      ambang: { t: 2.00, u3: 3.00, u5: 3.50 }, satuan: 'skor', arah: 'min',
      capaian: null,
      sumber: 'Syarat 9, rerata skor matriks Tabel 5.3 (butir 53, 54, 55, 56, 57)',
      catatan: 'Unit penjaminan mutu, perangkat SPMI, IKT, keterlaksanaan AMI, ' +
               'evaluasi capaian kinerja, kepuasan pemangku kepentingan. ' +
               'Rerata dihitung otomatis di halaman skor dari butir manual.',
    },

    // ---- Butir kurikulum yang berupa jumlah SKS ----------------------
    {
      no: 3, id: 'basic_sciences', manual: true,
      label: 'Mata kuliah basic sciences dan matematika',
      ambang: { t: 15, u3: 25, u5: 25 }, satuan: 'sks', arah: 'min',
      capaian: 29,
      sumber: 'Syarat 3 (Terakreditasi tercetak "15 ≤ SKS ≤ 24", dibaca minimal 15)',
      catatan: 'Jumlah SKS mata kuliah basic sciences dan matematika yang ' +
               'disediakan program studi. Ambang sama untuk kedua sasaran. ' +
               'Isi dari struktur kurikulum yang berlaku.',
    },

    // ---- Butir yang dihitung dari data.json --------------------------
    {
      no: 4, id: 'dtps_doktor',
      label: 'DTPS berpendidikan doktor',
      ambang: { u3: 30, u5: 40 }, satuan: '%', arah: 'min',
      sumber: 'Syarat 4; tidak disyaratkan untuk Terakreditasi',
      catatan: 'Persentase DTPS berpendidikan tertinggi Doktor/Doktor Terapan. ' +
               'Dihitung dari kolom pendidikan = S3 di lembar dosen.',
    },
    {
      no: 5, id: 'dtps_lektor_keatas',
      label: 'DTPS berjabatan Lektor ke atas',
      ambang: { u3: 40, u5: 50 }, satuan: '%', arah: 'min',
      sumber: 'Syarat 5; tidak disyaratkan untuk Terakreditasi',
      catatan: 'Persentase DTPS berjabatan Guru Besar, Lektor Kepala, atau Lektor. ' +
               'Dihitung dari kolom jabatan di lembar dosen.',
    },
    {
      no: 6, id: 'karya_utama_internasional',
      label: 'Kinerja DTPS — karya utama internasional',
      ambang: { u3: 25, u5: 50 }, satuan: '%', arah: 'min',
      jendela: { tahun_terakhir: 3 },
      sumber: 'Syarat 6; tidak disyaratkan untuk Terakreditasi',
      catatan: 'Persentase DTPS dengan karya ilmiah sebagai penulis pertama ' +
               'dan/atau korespondensi di jurnal internasional bereputasi, atau ' +
               'prosiding internasional ber-ISSN/ISBN terindeks Scopus/IEEE ' +
               'Xplore/SPIE, atau paten — dalam tiga tahun terakhir.',
    },
    {
      no: 7, id: 'waktu_tunggu',
      label: 'Waktu tunggu lulusan',
      ambang: { u3: 6, u5: 6 }, satuan: 'bulan', arah: 'max',
      jendela: { tahun_terakhir: 2 },
      sumber: 'Syarat 7; tidak disyaratkan untuk Terakreditasi',
      catatan: 'Waktu tunggu mendapatkan pekerjaan/berkarya pertama, dalam dua ' +
               'tahun terakhir. Ambang sama untuk kedua sasaran. Dihitung sebagai ' +
               'rata-rata tertimbang oleh jumlah terlacak.',
    },
    {
      no: 8, id: 'sesuai_bidang',
      label: 'Kesesuaian bidang kerja lulusan',
      ambang: { u3: 50, u5: 50 }, satuan: '%', arah: 'min',
      jendela: { tahun_terakhir: 2 },
      sumber: 'Syarat 8; tidak disyaratkan untuk Terakreditasi',
      catatan: 'Kesesuaian bidang kerja lulusan saat mendapatkan pekerjaan ' +
               'pertama dalam 2 tahun (bunyi Tabel 4.3.1, sama dengan syarat 7). ' +
               'Ambang sama untuk kedua sasaran Unggul.',
    },
  ],
};
