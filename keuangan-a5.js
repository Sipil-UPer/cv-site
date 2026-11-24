/* =====================================================================
   keuangan-a5.js — pos keuangan LKPS LAMDEPILAR Tabel A.5.1 (pemasukan) dan A.5.2 (pembiayaan),
   blok Program Magister (pemilik 2026-11-24: isian baru lengkap, Magister saja).
   Dipakai tab Data prodi › Keuangan A.5 (pilihan pos) dan lkps-lamdepilar.js (baris templat).
   baris = baris isian di lembar templat resmi (kolom D-F UPPS, H-J PS, TS-2..TS, IDR juta).
   Templat punya dua baris "Investasi Prasarana" (A.5.1 baris 161 dan 162); yang dipakai 161.
   ===================================================================== */
const P = (kode, lembar, baris, kelompok, label) => ({ kode, lembar, baris, kelompok, label });
const M = 'A.5.1 ', B = 'A.5.2 ';   // nama lembar templat (dengan spasi di akhir)

export const POS_A5 = [
  P('ukt_bergelar', M, 118, 'Pemasukan: UKT', 'UKT bergelar'),
  P('ukt_non_gelar', M, 119, 'Pemasukan: UKT', 'UKT non gelar'),
  P('penelitian_mhs', M, 122, 'Pemasukan: penelitian', 'Penelitian mahasiswa mandiri (tugas akhir, proyek)'),
  P('penelitian_dtps', M, 123, 'Pemasukan: penelitian', 'Penelitian DTPS mandiri'),
  P('penelitian_kolaborasi', M, 124, 'Pemasukan: penelitian', 'Penelitian kolaborasi DTPS dan mahasiswa mandiri'),
  P('penelitian_pt', M, 125, 'Pemasukan: penelitian', 'Penelitian program universitas/institut'),
  P('penelitian_internasional', M, 126, 'Pemasukan: penelitian', 'Penelitian internasional'),
  P('pkm_mhs', M, 129, 'Pemasukan: PkM', 'PkM mahasiswa mandiri'),
  P('pkm_dtps', M, 130, 'Pemasukan: PkM', 'PkM DTPS mandiri'),
  P('pkm_kolaborasi', M, 131, 'Pemasukan: PkM', 'PkM kolaborasi DTPS dan mahasiswa mandiri'),
  P('pkm_pt', M, 132, 'Pemasukan: PkM', 'PkM program universitas/institut'),
  P('pkm_internasional', M, 133, 'Pemasukan: PkM', 'PkM internasional'),
  P('ks_pendidikan_bergelar', M, 136, 'Pemasukan: kerja sama pendidikan', 'Kerja sama pendidikan bergelar'),
  P('ks_pendidikan_non_gelar', M, 137, 'Pemasukan: kerja sama pendidikan', 'Kerja sama pendidikan non gelar'),
  P('ks_penelitian_lokal', M, 140, 'Pemasukan: kerja sama penelitian', 'Kerja sama penelitian skala lokal (kab/kota)'),
  P('ks_penelitian_wilayah', M, 141, 'Pemasukan: kerja sama penelitian', 'Kerja sama penelitian skala wilayah (provinsi)'),
  P('ks_penelitian_nasional', M, 142, 'Pemasukan: kerja sama penelitian', 'Kerja sama penelitian skala nasional'),
  P('ks_penelitian_internasional', M, 143, 'Pemasukan: kerja sama penelitian', 'Kerja sama penelitian skala internasional'),
  P('ks_pkm_lokal', M, 146, 'Pemasukan: kerja sama PkM', 'Kerja sama PkM skala lokal (kab/kota)'),
  P('ks_pkm_wilayah', M, 147, 'Pemasukan: kerja sama PkM', 'Kerja sama PkM skala wilayah (provinsi)'),
  P('ks_pkm_nasional', M, 148, 'Pemasukan: kerja sama PkM', 'Kerja sama PkM skala nasional'),
  P('ks_pkm_internasional', M, 149, 'Pemasukan: kerja sama PkM', 'Kerja sama PkM skala internasional'),
  P('pemerintah_gaji_dosen', M, 152, 'Pemasukan: pemerintah dan lain-lain', 'Gaji dan/atau honor dosen'),
  P('pemerintah_gaji_tendik', M, 153, 'Pemasukan: pemerintah dan lain-lain', 'Gaji dan/atau honor tenaga kependidikan'),
  P('pemerintah_pembelajaran', M, 154, 'Pemasukan: pemerintah dan lain-lain', 'Bantuan operasional pembelajaran'),
  P('pemerintah_tidak_langsung', M, 155, 'Pemasukan: pemerintah dan lain-lain', 'Bantuan operasional tidak langsung'),
  P('pemerintah_kemahasiswaan', M, 156, 'Pemasukan: pemerintah dan lain-lain', 'Biaya operasional kemahasiswaan'),
  P('bantuan_investasi_sdm', M, 159, 'Pemasukan: bantuan/investasi', 'Investasi SDM'),
  P('bantuan_investasi_sarana', M, 160, 'Pemasukan: bantuan/investasi', 'Investasi sarana'),
  P('bantuan_investasi_prasarana', M, 161, 'Pemasukan: bantuan/investasi', 'Investasi prasarana'),
  P('biaya_bergelar_dosen', B, 66, 'Pembiayaan: pendidikan bergelar', 'Biaya dosen (gaji, honor)'),
  P('biaya_bergelar_tendik', B, 67, 'Pembiayaan: pendidikan bergelar', 'Biaya tenaga kependidikan (gaji, honor)'),
  P('biaya_bergelar_pembelajaran', B, 68, 'Pembiayaan: pendidikan bergelar', 'Biaya operasional pembelajaran'),
  P('biaya_bergelar_tidak_langsung', B, 69, 'Pembiayaan: pendidikan bergelar', 'Biaya operasional tidak langsung'),
  P('biaya_bergelar_kemahasiswaan', B, 70, 'Pembiayaan: pendidikan bergelar', 'Biaya operasional kemahasiswaan'),
  P('biaya_non_gelar_dosen', B, 73, 'Pembiayaan: pendidikan non gelar', 'Biaya dosen (gaji, honor)'),
  P('biaya_non_gelar_tendik', B, 74, 'Pembiayaan: pendidikan non gelar', 'Biaya tenaga kependidikan (gaji, honor)'),
  P('biaya_non_gelar_pembelajaran', B, 75, 'Pembiayaan: pendidikan non gelar', 'Biaya operasional pembelajaran'),
  P('biaya_non_gelar_tidak_langsung', B, 76, 'Pembiayaan: pendidikan non gelar', 'Biaya operasional tidak langsung'),
  P('biaya_non_gelar_kemahasiswaan', B, 77, 'Pembiayaan: pendidikan non gelar', 'Biaya operasional kemahasiswaan'),
  P('biaya_penelitian', B, 79, 'Pembiayaan: penelitian dan PkM', 'Biaya penelitian, perancangan, pengembangan karya'),
  P('biaya_pkm', B, 80, 'Pembiayaan: penelitian dan PkM', 'Biaya PkM'),
  P('biaya_investasi_sdm', B, 82, 'Pembiayaan: investasi', 'Biaya investasi SDM'),
  P('biaya_investasi_sarana', B, 83, 'Pembiayaan: investasi', 'Biaya investasi sarana'),
  P('biaya_investasi_prasarana', B, 84, 'Pembiayaan: investasi', 'Biaya investasi prasarana'),
];

export const labelPos = kode => { const p = POS_A5.find(x => x.kode === kode); return p ? `${p.kelompok} — ${p.label}` : kode; };
