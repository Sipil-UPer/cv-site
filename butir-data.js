/* =====================================================================
   BUTIR BERUMUS — APS-AV 2025 1.0, Program Sarjana (LAM Teknik)
   ---------------------------------------------------------------------
   28 butir yang skornya dihitung dari data (skor.html). Daftar ini hanya
   untuk BUKTI: tiap butir boleh punya satu tautan bukti di tabel
   `pengaturan` dengan kunci bukti_b<NN>, sama seperti butir manual
   (butir-manual.js). Isinya dokumen pendukung angka butir itu, mis. SK
   dosen (27, 28), laporan tracer (49–51), rekap PDDikti (40, 41).

   Judul sama dengan judul kartu di skor.html. Butir 18, 30, 52 berumus
   tetapi diisi lewat butir-manual.js (`hitung`), jadi tidak ada di sini.
   ===================================================================== */

export const BUTIR_DATA = [
  {no: '6',  judul: 'Kerja sama (Tabel 2.a LKPS)'},
  {no: '9',  judul: 'Biaya operasional pendidikan (Tabel 2.b LKPS)'},
  {no: '10', judul: 'Dana penelitian DTPS (Tabel 2.b LKPS)'},
  {no: '11', judul: 'Dana PkM DTPS (Tabel 2.b LKPS)'},
  {no: '19', judul: 'Mata kuliah basic sciences dan matematika (Tabel 3.a.4 LKPS)'},
  {no: '23', judul: 'Penelitian DTPS melibatkan mahasiswa (Tabel 6.h.1 LKPS)'},
  {no: '25', judul: 'PkM DTPS melibatkan mahasiswa (Tabel 6.i LKPS)'},
  {no: '26', judul: 'Kecukupan jumlah DTPS (Tabel 4.a LKPS)'},
  {no: '27', judul: 'Kualifikasi akademik DTPS (Tabel 4.a LKPS)'},
  {no: '28', judul: 'Jabatan akademik DTPS (Tabel 4.a LKPS)'},
  {no: '31', judul: 'Penelitian DTPS per sumber dana (Tabel 3.b LKPS)'},
  {no: '32', judul: 'PkM DTPS per sumber dana (Tabel 3.c LKPS)'},
  {no: '33', judul: 'Publikasi ilmiah DTPS'},
  {no: '34', judul: 'Luaran penelitian dan PkM DTPS'},
  {no: '35', judul: 'DTPS dengan karya utama internasional'},
  {no: '36', judul: 'Karya ilmiah bereputasi yang disitasi (Tabel 4.i LKPS)'},
  {no: '37', judul: 'Rekognisi DTPS (Tabel 4.j LKPS)'},
  {no: '40', judul: 'Rasio mahasiswa terhadap DTPS (Tabel 6.a LKPS)'},
  {no: '41', judul: 'Mahasiswa asing (Tabel 6.a LKPS)'},
  {no: '42', judul: 'IPK lulusan'},
  {no: '43', judul: 'Prestasi akademik dan non-akademik mahasiswa'},
  {no: '44', judul: 'Masa studi (Tabel 6.d LKPS)'},
  {no: '45', judul: 'Kelulusan tepat waktu (Tabel 6.d LKPS)'},
  {no: '46', judul: 'Publikasi ilmiah mahasiswa'},
  {no: '47', judul: 'Luaran penelitian dan PkM mahasiswa'},
  {no: '49', judul: 'Waktu tunggu (Tabel 6.f.1 LKPS)'},
  {no: '50', judul: 'Kesesuaian bidang kerja (Tabel 6.f.2 LKPS)'},
  {no: '51', judul: 'Tingkat tempat kerja lulusan (Tabel 6.g.1 LKPS)'},
];

export const kunciBuktiData = no => `bukti_b${no}`;
