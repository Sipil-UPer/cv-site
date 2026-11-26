// Pengajuan mahasiswa KP dan laporan lomba (90-patch-pengajuan-mahasiswa.sql, pemilik 2026-11-17).
// Dipakai pengajuan.html (mahasiswa, tanpa masuk akun) dan pengajuan-mahasiswa.html (pembimbing/admin).
// Daftar jenis berkas sama dengan MHS_BERKAS di apps-script/Code.gs dan pengajuan_berkas_jenis_check (patch 90).

export const JENIS = {
  kp: { label: 'Kerja Praktik (KP)', singkat: 'KP', wajib: 'surat_permohonan',
        berkas: ['surat_permohonan', 'surat_balasan', 'laporan_kp', 'surat_selesai', 'logbook', 'foto', 'lainnya'] },
  lomba: { label: 'Laporan lomba', singkat: 'Lomba', wajib: 'laporan_lomba',
           berkas: ['laporan_lomba', 'sertifikat', 'surat_tugas', 'foto', 'lainnya'] },
  // Surat ditandatangani Kaprodi (93-patch-pengajuan-surat.sql): tanpa pembimbing, tanpa berkas wajib.
  surat: { label: 'Permohonan surat', singkat: 'Surat', wajib: null, tanpaPembimbing: true, berkas: ['lainnya'] },
  // Seminar/sidang TA (94-patch-jadwal-ta.sql): pembimbing 1 memeriksa kesiapan, admin menjadwalkan.
  ta: { label: 'Seminar/sidang TA', singkat: 'TA', wajib: 'naskah_ta', berkas: ['naskah_ta', 'lainnya'] },
  // Publikasi/luaran mahasiswa (96-patch-luaran-mahasiswa.sql): mandiri -> tabel LKPS 6.e.1 / 6.e.3.
  luaran: { label: 'Publikasi/luaran', singkat: 'Luaran', wajib: 'bukti_luaran', berkas: ['bukti_luaran', 'lainnya'] },
  // Berkas yudisium (122-patch-yudisium.sql, pemilik 2026-11-19/20): admin prodi saja, tanpa pembimbing. Jenis berkas
  // = kode yud_* dari yudisium_berkas_daftar() (admin bisa mengubah daftarnya); berkas besar boleh tautan Google Drive.
  yudisium: { label: 'Berkas yudisium', singkat: 'Yudisium', wajib: null, tanpaPembimbing: true, berkas: [] },
  // Kabar kegiatan dari mahasiswa (144-patch-kabar-mahasiswa.sql, pemilik 2026-11-21): dosen pendamping opsional; satu
  // persetujuan (pendamping, pembina kemahasiswaan, atau admin) lalu terbit di kabar.html dan beranda. Foto maks. 6 tampil.
  kabar: { label: 'Kabar kegiatan', singkat: 'Kabar', wajib: 'foto', pembimbingOpsional: true, berkas: ['foto', 'lainnya'] },
};

// Jenis kegiatan kabar = kabar_kegiatan_jenis_check (patch 81), tanpa 'penelitian' (khusus kabar dosen, patch 92).
export const JENIS_KEGIATAN = [['kuliah_tamu', 'Kuliah tamu'], ['kunjungan_lapangan', 'Kunjungan lapangan'], ['seminar', 'Seminar'],
  ['pengabdian', 'Pengabdian kepada masyarakat'], ['kerja_praktik', 'Kerja praktik'], ['kompetisi', 'Kompetisi'],
  ['kerja_sama', 'Kerja sama'], ['lainnya', 'Lainnya']];
export const NAMA_TAHAP_KABAR = ['Isi kabar dan unggah foto', 'Diperiksa dosen pendamping atau pembina kemahasiswaan',
                                 'Disahkan (satu persetujuan)', 'Terbit di situs prodi'];

// Daftar bawaan = isi awal tabel yudisium_berkas (patch 122); dipakai bila RPC belum ada (situs coba, contoh).
export const BERKAS_YUDISIUM_BAWAAN = [
  ['yud_form_pendaftaran', 'Form pendaftaran yudisium'], ['yud_laporan_ta', 'Laporan Tugas Akhir'], ['yud_transkrip', 'Transkrip'],
  ['yud_pem', 'PEM'], ['yud_toefl', 'TOEFL'], ['yud_bebas_pustaka', 'SKET bebas pustaka'], ['yud_repository', 'SKET repository'],
  ['yud_bebas_alat_lab', 'Bebas pinjam alat laboratorium'], ['yud_foto_warna', 'Foto warna'], ['yud_foto_bw', 'Foto BW'],
  ['yud_bebas_fasilitas', 'Bebas pinjam fasilitas universitas'], ['yud_bebas_plagiasi', 'Bebas plagiasi'],
  ['yud_form_fpi', 'Form FPI pengumpulan draft publikasi'], ['yud_artikel', 'Artikel ilmiah'],
].map(([kode, label]) => ({ kode, label, keterangan: '', wajib: true })).concat([{ kode: 'yud_bukti_tambahan', label: 'Bukti tambahan', keterangan: '', wajib: false }]);
export const NAMA_TAHAP_YUDISIUM = ['Unggah berkas yudisium', 'Dikirim ke admin prodi', 'Diperiksa admin prodi', 'Berkas lengkap (disahkan)'];

/** Kelengkapan berkas yudisium: tiap butir daftar dengan berkasnya; kurang = label butir wajib yang belum ada. */
export function kelengkapanYudisium(daftar = BERKAS_YUDISIUM_BAWAAN, berkas = []){
  const butir = daftar.map(d => ({ ...d, berkas: berkas.filter(b => b.jenis === d.kode) }));
  const wajib = butir.filter(b => b.wajib);
  return { butir, wajib: wajib.length, ada: wajib.filter(b => b.berkas.length).length,
           kurang: wajib.filter(b => !b.berkas.length).map(b => b.label) };
}
/** Label jenis berkas; kode yud_ dan ta_ dari daftar yudisium atau berkas TA. */
export const labelBerkas = (kode, daftar = BERKAS_YUDISIUM_BAWAAN) => LABEL_BERKAS[kode] || daftar.find(d => d.kode === kode)?.label || kode;

// Berkas pendaftaran TA per tahap (174, 176; pemilik 2026-11-25): isi tabel ta_berkas yang aktif sesudah patch 176 (bukti
// bimbingan SIUP dinonaktifkan, bukti terdaftar TA di SIUP di pengajuan pembimbing); dipakai bila ta_berkas_daftar() belum ada
// (situs coba, contoh). Kode ta_* diunggah sebagai pengajuan_berkas.jenis; naskah_ta selalu wajib (seminar/sidang).
export const BERKAS_TA_BAWAAN = [
  ['penetapan_pembimbing', 'ta_terdaftar_siup', 'Bukti terdaftar TA di SIUP', 'KRS/KHS atau tangkapan layar SIUP yang menunjukkan mata kuliah Tugas Akhir sudah diambil semester ini.'],
  ['seminar_proposal', 'naskah_ta', 'Naskah proposal TA', 'PDF naskah proposal yang akan diseminarkan.'],
  ['seminar_kemajuan', 'naskah_ta', 'Laporan kemajuan TA', 'PDF laporan kemajuan yang akan diseminarkan.'],
  ['sidang_akhir', 'naskah_ta', 'Laporan akhir TA', 'PDF laporan akhir yang akan disidangkan.'],
  ['sidang_akhir', 'ta_transkrip', 'Transkrip atau KHS', 'Transkrip atau KHS terakhir dari SIUP.'],
  ['sidang_akhir', 'ta_artikel', 'Draf artikel atau bukti publikasi', 'Draf artikel ilmiah dari TA, atau LoA/bukti terbit bila sudah dipublikasikan.'],
  ['sidang_akhir', 'ta_kemiripan', 'Laporan cek kemiripan', 'Laporan hasil cek kemiripan (mis. Turnitin) atas laporan akhir yang akan disidangkan.'],   // 185
].map(([tahap, kode, label, keterangan]) => ({ tahap, kode, label, keterangan, wajib: true }));
/** Daftar berkas satu tahap TA (urut daftar) + 'Lainnya' opsional; bentuknya sama dengan daftar yudisium (kelengkapanYudisium). */
export const berkasTahapTA = (daftar = BERKAS_TA_BAWAAN, tahap) => daftar.filter(d => d.tahap === tahap)
  .map(({ kode, label, keterangan, wajib }) => ({ kode, label, keterangan: keterangan || '', wajib: !!wajib }))
  .concat([{ kode: 'lainnya', label: 'Lainnya', keterangan: 'Berkas pendukung lain (opsional).', wajib: false }]);
export const TAHAP_TA_BERKAS = ['penetapan_pembimbing', 'seminar_proposal', 'seminar_kemajuan', 'sidang_akhir'];

export const JENIS_PUB = [['jurnal', 'Jurnal'], ['prosiding', 'Prosiding'], ['buku', 'Buku'], ['lainnya', 'Lainnya']];
export const TINGKAT_PUB = [['internasional', 'Internasional'], ['nasional', 'Nasional'], ['wilayah', 'Wilayah']];
export const INDEKSASI = [['scopus', 'Scopus'], ['wos', 'Web of Science'], ['bereputasi', 'Internasional bereputasi lain'],
                          ['sinta', 'SINTA'], ['tidak_terindeks', 'Tidak terindeks']];
export const JENIS_LUARAN = [['paten', 'Paten'], ['paten_sederhana', 'Paten sederhana'], ['hak_cipta', 'Hak cipta'],
  ['desain_industri', 'Desain industri'], ['merek', 'Merek'], ['ttg', 'Teknologi tepat guna'], ['produk', 'Produk'],
  ['buku_isbn', 'Buku ber-ISBN'], ['book_chapter', 'Book chapter']];

export const TAHAP_TA = [['seminar_proposal', 'Seminar proposal'], ['seminar_kemajuan', 'Seminar kemajuan'], ['sidang_akhir', 'Sidang akhir']];
export const NAMA_TAHAP_TA = ['Isi dan unggah naskah', 'Diperiksa pembimbing 1', 'Dijadwalkan Koordinator TA', 'Terjadwal'];   // 2026-11-26: penjadwal = Koordinator TA
// Pengajuan pembimbing TA (110, pemilik 2026-11-18): sekali di awal; koordinator TA menetapkan pembimbing menurut
// kelompok keahlian (KK) dan kuota. Pembimbing 1 harus KK sama atau berdekatan; seminar/sidang memakai penetapan ini.
export const TAHAP_PEMBIMBING_TA = 'penetapan_pembimbing';
export const TAHAP_TA_AJU = [[TAHAP_PEMBIMBING_TA, 'Pengajuan pembimbing TA'], ...TAHAP_TA];
export const NAMA_TAHAP_PEMBIMBING_TA = ['Isi KK, judul awal, dan usulan pembimbing', 'Dikirim ke koordinator TA',
                                         'Diperiksa koordinator TA; pembimbing ditetapkan', 'Pembimbing TA ditetapkan'];
export const penetapanTA = p => p?.jenis === 'ta' && p?.data?.tahap_ta === TAHAP_PEMBIMBING_TA;
// Dosen yang boleh jadi pembimbing 1 untuk KK topik TA (pembimbing_pilihan_ta(): kk_cocok = KK sendiri + berdekatan).
export const pembimbingCocok = (dosen, kk) => (dosen || []).filter(d => !!kk && (d.kk_cocok || []).includes(kk));
// Sama dengan public.ta_kk_cocok (110): KK sama, atau pasangan ta_kk_dekat {kk_a, kk_b} (dua arah).
export const kkCocok = (kkTa, kkDosen, dekat = []) => !!kkTa && !!kkDosen && (kkTa === kkDosen
  || dekat.some(k => (k.kk_a === kkTa && k.kk_b === kkDosen) || (k.kk_b === kkTa && k.kk_a === kkDosen)));
// Semester (180): Ganjil September-Februari, Genap Maret-Agustus (sama dengan semester_tanggal, 138). ts = tahun akhir
// tahun akademik. Masukan: tanggal/waktu ISO; waktu dengan jam dibaca dalam WIB.
export function semesterTA(t){
  let x = String(t || '');
  if (/T\d{2}:/.test(x) && !Number.isNaN(Date.parse(x))) x = new Date(Date.parse(x) + 7 * 3600e3).toISOString();
  const m = x.match(/^(\d{4})-(\d{2})/); if (!m) return null;
  const y = +m[1], b = +m[2];
  return b >= 9 ? { ts: y + 1, sm: 'Ganjil' } : b <= 2 ? { ts: y, sm: 'Ganjil' } : { ts: y, sm: 'Genap' };
}
export const kunciSemester = s => s ? `${s.ts} ${s.sm}` : '';
export const teksSemester = s => s ? `${s.ts - 1}/${s.ts} ${s.sm}` : '';
// Semester ke-n sesudah (n > 0) atau sebelum (n < 0) s.
export function geserSemester(s, n){
  let i = s.ts * 2 + (s.sm === 'Genap' ? 1 : 0) + n;
  return { ts: Math.floor(i / 2), sm: i % 2 ? 'Genap' : 'Ganjil' };
}

// Pilihan pembimbing 1 untuk koordinator TA: baris ta_beban(ts, sm) -> cocok KK dulu, lalu abjad; teks "Nama - KK - 2/5".
// dibimbing (180) = mahasiswa semester sebelumnya yang belum lulus; hanya informasi, tidak dihitung kuota.
export function pilihanPembimbingTA(rows = [], kkTa = '', dekat = []){
  return rows.map(r => {
    const cocok = kkCocok(kkTa, r.kk, dekat), lebih = r.kuota != null && r.beban >= r.kuota;
    return { ...r, cocok, lebih, teks: `${r.nama} — ${r.kk || 'KK belum diisi'} — ${r.beban}${r.kuota == null ? '' : '/' + r.kuota}`
      + `${lebih ? ' (kuota penuh)' : ''}${cocok ? '' : ' (di luar KK)'}${r.dibimbing ? ` · ${r.dibimbing} masih dibimbing` : ''}` };
  }).sort((a, b) => (b.cocok - a.cocok) || String(a.nama).localeCompare(String(b.nama), 'id'));
}

export const JENIS_SURAT = [['aktif_kuliah', 'Surat keterangan aktif kuliah'], ['izin_penelitian', 'Surat izin penelitian/survei'],
                            ['rekomendasi', 'Surat rekomendasi']];
export const NAMA_TAHAP_SURAT = ['Isi permohonan', 'Dikirim ke prodi', 'Diproses admin prodi', 'Surat terbit'];

export const LABEL_BERKAS = {
  surat_permohonan: 'Surat permohonan KP', surat_balasan: 'Surat balasan instansi', laporan_kp: 'Laporan KP',
  surat_selesai: 'Surat keterangan selesai', logbook: 'Logbook', nilai_lapangan: 'Nilai pembimbing lapangan',
  laporan_lomba: 'Laporan lomba', sertifikat: 'Sertifikat/piagam', surat_tugas: 'SK/surat tugas', foto: 'Foto kegiatan',
  lainnya: 'Lainnya', surat_pengantar: 'Surat pengantar dari prodi', surat_jadi: 'Surat dari prodi (bertanda tangan)',
  naskah_ta: 'Naskah TA (proposal / laporan kemajuan / laporan akhir)',
  ta_bukti_bimbingan: 'Bukti bimbingan SIUP', ta_terdaftar_siup: 'Bukti terdaftar TA di SIUP', ta_transkrip: 'Transkrip atau KHS', ta_artikel: 'Draf artikel atau bukti publikasi',   // 174
  ta_kemiripan: 'Laporan cek kemiripan',   // 185
  bukti_luaran: 'Bukti publikasi/luaran (naskah, LoA, sertifikat HKI, halaman ISBN)',
};

export const LABEL_STATUS = {
  draf: 'Draf (belum dikirim)', pembimbing: 'Diperiksa dosen pembimbing', admin: 'Diperiksa admin prodi',
  disetujui: 'Disetujui', dikembalikan: 'Dikembalikan untuk diperbaiki', ditolak: 'Ditolak',
  dibatalkan: 'Dibatalkan',   // 161 (pemilik 2026-11-24): oleh mahasiswa (draf/dikembalikan) atau prodi atas permintaan
};
// Pengajuan yang bisa dibatalkan mahasiswa sendiri (161): masih di tangannya, tahap pengajuan.
export const bolehBatalMhs = p => (p.tahap || 'pengajuan') === 'pengajuan' && ['draf', 'dikembalikan'].includes(p.status);
// Pengajuan yang bisa dibatalkan prodi (161, pengajuan_batalkan): belum diputuskan akhir.
export const bolehBatalProdi = p => !['dibatalkan', 'ditolak'].includes(p.status)
  && !(p.status === 'disetujui' && ((p.tahap || 'pengajuan') === 'selesai' || p.jenis !== 'kp'));

export const TINGKAT = [['internasional', 'Internasional'], ['nasional', 'Nasional'], ['wilayah_lokal', 'Wilayah/lokal']];
export const BIDANG = [['akademik', 'Akademik'], ['non_akademik', 'Non-akademik']];

// Jalur proses untuk ditampilkan: empat tahap tetap; keadaan dari status sekarang dan riwayat.
// Hasil [{kunci, label, keadaan: 'selesai'|'kini'|'nanti'|'kembali'|'tolak', waktu, oleh, catatan}].
const TAHAP = [['draf', 'Isi dan unggah berkas'], ['pembimbing', 'Diperiksa dosen pembimbing'],
               ['admin', 'Diperiksa admin prodi'], ['disetujui', 'Disetujui']];
// Laporan selesai KP (91-patch-laporan-selesai-kp.sql): label tahap dan berkasnya.
export const NAMA_TAHAP_SELESAI = ['Isi laporan selesai', 'Diperiksa dosen pembimbing', 'Diperiksa koordinator KP/admin', 'KP selesai'];
// Pengajuan KP (107, pemilik 2026-11-18): langsung ke koordinator KP/admin, yang menetapkan dosen pembimbing (kuota).
export const NAMA_TAHAP_KP = ['Isi pengajuan dan unggah surat', 'Dikirim ke koordinator KP', 'Diperiksa koordinator KP; pembimbing ditetapkan',
                              'Surat pengantar terbit'];
// Laporan lomba (108, pemilik 2026-11-18): satu persetujuan, dari dosen pembimbing, pembina kemahasiswaan, atau admin.
export const NAMA_TAHAP_LOMBA = ['Isi laporan dan unggah bukti', 'Diperiksa dosen pembimbing atau pembina kemahasiswaan',
                                 'Disahkan (satu persetujuan)', 'Tercatat sebagai prestasi'];
// nilai_lapangan tidak di sini: diunggah dosen pembimbing, koordinator KP, atau admin (99-patch-kp-magang.sql).
export const BERKAS_SELESAI = ['laporan_kp', 'surat_selesai', 'logbook', 'surat_balasan', 'foto', 'lainnya'];

// Program pengajuan KP (99-patch-kp-magang.sql, pemilik 2026-11-17): kosong = Kerja Praktik.
export const PROGRAM_KP = [['kp', 'Kerja Praktik (KP)'], ['magang', 'Magang (MBKM)']];
export const labelProgram = v => (PROGRAM_KP.find(x => x[0] === (v || 'kp')) || PROGRAM_KP[0])[1];

// Status untuk dibaca manusia, dengan tahap KP.
export function labelStatus(p){
  if (p.jenis === 'surat') return { admin: 'Diproses admin prodi', disetujui: 'Surat terbit' }[p.status] || LABEL_STATUS[p.status] || p.status;
  if (p.jenis === 'yudisium') return { admin: 'Diperiksa admin prodi', disetujui: 'Berkas lengkap; disahkan admin prodi' }[p.status]
    || LABEL_STATUS[p.status] || p.status;
  if (penetapanTA(p)) return { pembimbing: 'Diperiksa koordinator TA', admin: 'Diperiksa koordinator TA',
    disetujui: 'Pembimbing TA ditetapkan' }[p.status] || LABEL_STATUS[p.status] || p.status;
  if (p.jenis === 'ta') return { pembimbing: 'Diperiksa pembimbing 1', admin: 'Menunggu jadwal dari Koordinator TA', disetujui: 'Terjadwal' }[p.status]
    || LABEL_STATUS[p.status] || p.status;
  if (p.jenis === 'lomba') return { pembimbing: 'Diperiksa dosen pembimbing atau pembina kemahasiswaan', admin: 'Diperiksa pembina kemahasiswaan/admin',
    disetujui: 'Disahkan; tercatat sebagai prestasi' }[p.status] || LABEL_STATUS[p.status] || p.status;
  if (p.jenis === 'kabar') return { pembimbing: p.pembimbing_id ? 'Diperiksa dosen pendamping atau pembina kemahasiswaan'
    : 'Diperiksa pembina kemahasiswaan/admin', admin: 'Diperiksa pembina kemahasiswaan/admin',
    disetujui: 'Disahkan; terbit di situs prodi' }[p.status] || LABEL_STATUS[p.status] || p.status;
  if (p.jenis === 'kp' && p.tahap === 'selesai') return { pembimbing: 'Laporan selesai: diperiksa dosen pembimbing',
    admin: 'Laporan selesai: diperiksa koordinator KP/admin', disetujui: 'KP selesai', dikembalikan: 'Laporan selesai dikembalikan untuk diperbaiki',
    ditolak: 'Laporan selesai ditolak' }[p.status] || p.status;
  // Jawaban instansi atas surat pengantar (107): data.jawaban_instansi 'diterima' | 'ditolak'.
  if (p.jenis === 'kp' && p.status === 'ditolak' && p.data?.jawaban_instansi === 'ditolak') return 'Ditolak instansi; pengajuan ditutup';
  if (p.jenis === 'kp' && p.status === 'disetujui') return p.data?.jawaban_instansi === 'diterima'
    ? 'Diterima instansi; KP dilaksanakan (pelaporan selesai belum dikirim)' : 'Surat pengantar terbit; menunggu jawaban instansi';
  if (p.jenis === 'kp' && p.status === 'admin') return 'Diperiksa koordinator KP/admin';
  return LABEL_STATUS[p.status] || p.status;
}

// Jalur satu tahap KP (atau lomba): status dan riwayat tahap itu saja. Riwayat tanpa tahap = pengajuan (patch 90).
export function jalurTahap(p, tahap = 'pengajuan'){
  const r = (p.riwayat || p.pengajuan_riwayat || []).filter(x => (x.tahap || 'pengajuan') === tahap);
  if (tahap === 'pengajuan') return jalur(p.tahap === 'selesai' ? 'disetujui' : p.status, r, p.jenis === 'surat' ? NAMA_TAHAP_SURAT : p.jenis === 'ta' ? (penetapanTA(p) ? NAMA_TAHAP_PEMBIMBING_TA : NAMA_TAHAP_TA) : p.jenis === 'kp' ? NAMA_TAHAP_KP : p.jenis === 'lomba' ? NAMA_TAHAP_LOMBA : p.jenis === 'yudisium' ? NAMA_TAHAP_YUDISIUM : p.jenis === 'kabar' ? NAMA_TAHAP_KABAR : null);
  return jalur(p.tahap === 'selesai' ? p.status : 'draf', r, NAMA_TAHAP_SELESAI);
}

export function periksaSelesai(d = {}){
  const g = [];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(d.tanggal_mulai || ''))) g.push('Isi tanggal mulai KP.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(d.tanggal_selesai || ''))) g.push('Isi tanggal selesai KP.');
  if (d.tanggal_mulai && d.tanggal_selesai && d.tanggal_selesai < d.tanggal_mulai) g.push('Tanggal selesai tidak boleh sebelum tanggal mulai.');
  if (!String(d.pembimbing_lapangan || '').trim()) g.push('Isi nama pembimbing lapangan.');
  if (String(d.ringkasan || '').trim().length < 30) g.push('Tulis ringkasan kegiatan (minimal 30 huruf).');
  return g;
}

export function jalur(status, riwayat = [], nama = null){
  // Hanya perpindahan status; catatan tanpa perpindahan (mis. "Mengunggah surat pengantar") dilewati.
  const urut = [...riwayat].sort((a, b) => String(a.waktu).localeCompare(String(b.waktu)));
  const pindah = urut.filter((r, i) => i === 0 || r.status !== urut[i - 1].status);
  const terakhir = k => [...pindah].reverse().find(r => r.status === k);
  // 161: dibatalkan = satu langkah penutup.
  if (status === 'dibatalkan') return [{ kunci: 'dibatalkan', label: 'Dibatalkan', keadaan: 'batal', ...info(terakhir('dibatalkan')) }];
  const posisi ={ draf: 0, dikembalikan: 0, pembimbing: 1, admin: 2, disetujui: 3, ditolak: 3 }[status] ?? 0;
  return TAHAP.map(([kunci, label0], i) => {
    const label = nama ? nama[i] : label0;
    let keadaan = i < posisi ? 'selesai' : i === posisi ? 'kini' : 'nanti';
    if (status === 'disetujui' && i === 3) keadaan = 'selesai';
    if (status === 'ditolak' && i === 3) return { kunci: 'ditolak', label: 'Ditolak', keadaan: 'tolak', ...info(terakhir('ditolak')) };
    if (status === 'dikembalikan' && i === 0) return { kunci, label: 'Perbaiki lalu kirim lagi', keadaan: 'kembali', ...info(terakhir('dikembalikan')) };
    return { kunci, label, keadaan, ...(keadaan === 'selesai' ? info(terakhir(TAHAP[i + 1]?.[0] ?? kunci)) : {}) };
  });
}
const info = r => r ? { waktu: r.waktu, oleh: r.oleh, catatan: r.catatan || '' } : {};

// Status yang masih boleh diubah mahasiswa.
export const bolehUbah = s => s === 'draf' || s === 'dikembalikan';

// Anggota tim lomba dari teks, satu orang per baris: "104123011 - Nama", "104123011 Nama", atau "Nama".
export function bacaAnggota(teks){
  return String(teks || '').split(/\r?\n/).map(s => s.trim()).filter(Boolean).slice(0, 10).map(s => {
    const m = s.match(/^(\d{6,15})\s*[-–:,]?\s*(.*)$/);
    return m ? { nim: m[1], nama: m[2].trim() } : { nim: '', nama: s };
  }).filter(a => a.nama);
}
export const teksAnggota = xs => (xs || []).map(a => a.nim ? `${a.nim} - ${a.nama}` : a.nama).join('\n');

// Pemeriksaan isian di peramban (basis data memeriksa lagi). Hasil: daftar pesan; kosong = lengkap.
export function periksaIsian(jenis, { nim, nama, pembimbing, data = {} }){
  const g = [];
  if (nim !== undefined && !/^\d{6,15}$/.test(String(nim).trim())) g.push('NIM harus angka 6–15 digit.');
  if (String(nama || '').trim().length < 2) g.push('Isi nama lengkap.');
  if (!pembimbing && !JENIS[jenis]?.tanpaPembimbing && !JENIS[jenis]?.pembimbingOpsional) g.push('Pilih dosen pembimbing.');
  if (jenis === 'kp' && !String(data.instansi || '').trim()) g.push('Isi nama instansi tujuan KP.');
  if (jenis === 'lomba') {
    if (!String(data.nama_kegiatan || '').trim()) g.push('Isi nama kegiatan/lomba.');
    if (!data.tingkat) g.push('Pilih tingkat lomba.');
    if (!data.bidang) g.push('Pilih bidang lomba.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(data.tanggal || ''))) g.push('Isi tanggal lomba.');
  }
  if (jenis === 'luaran') {
    if (!data.kategori) g.push('Pilih kategori: publikasi atau luaran.');
    if (String(data.judul || '').trim().length < 3) g.push('Tulis judul.');
    if (!/^\d{4}$/.test(String(data.tahun || ''))) g.push('Isi tahun terbit/terdaftar.');
    if (data.kategori === 'publikasi' && !data.jenis_pub) g.push('Pilih jenis publikasi.');
    if (data.kategori === 'luaran' && !data.jenis_luaran) g.push('Pilih jenis luaran.');
    if (data.doi_url && !/^https?:\/\/\S+$/i.test(data.doi_url)) g.push('DOI/URL harus diawali https://');
  }
  if (jenis === 'ta') {
    if (!data.tahap_ta) g.push('Pilih tahap TA.');
    if (data.tahap_ta === TAHAP_PEMBIMBING_TA && !data.kk_ta) g.push('Pilih kelompok keahlian topik TA.');
    if (String(data.judul || '').trim().length < 3) g.push(data.tahap_ta === TAHAP_PEMBIMBING_TA ? 'Tulis judul awal TA.' : 'Tulis judul TA.');
    if (data.pembimbing_2 && data.pembimbing_2 === pembimbing) g.push('Pembimbing 2 harus berbeda dari pembimbing 1.');
    // 185: persen kemiripan laporan akhir (sama dengan mhs_rapikan); batasnya diperiksa saat dikirim.
    if (data.tahap_ta === 'sidang_akhir' && String(data.kemiripan_persen ?? '').trim() !== '' && persenKemiripan(data.kemiripan_persen) == null)
      g.push('Persen kemiripan harus angka 0 sampai 100.');
  }
  if (jenis === 'kabar') {   // 144: batas kabar_kegiatan (judul 3-200, ringkasan 20-1200)
    if (String(data.judul || '').trim().length < 3) g.push('Tulis judul kegiatan.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(data.tanggal || ''))) g.push('Isi tanggal kegiatan.');
    const n = String(data.ringkasan || '').trim().length;
    if (n < 20 || n > 1200) g.push('Tulis ringkasan kegiatan (20–1200 huruf).');
    if (data.tautan && !/^https?:\/\/\S+$/i.test(data.tautan)) g.push('Tautan harus diawali https://');
  }
  if (jenis === 'surat') {
    if (!data.jenis_surat) g.push('Pilih jenis surat.');
    if (String(data.keperluan || '').trim().length < 5) g.push('Tulis keperluan surat.');
    if (['izin_penelitian', 'rekomendasi'].includes(data.jenis_surat) && !String(data.tujuan_surat || '').trim()) g.push('Tulis tujuan surat (kepada siapa).');
    if (data.jenis_surat === 'izin_penelitian' && !String(data.judul_penelitian || '').trim()) g.push('Tulis judul penelitian.');
  }
  return g;
}

export const judulPengajuan = p => p.jenis === 'kp' ? (p.data?.instansi || 'KP') : p.jenis === 'ta' ? (p.data?.judul || 'Tugas Akhir')
  : p.jenis === 'luaran' ? (p.data?.judul || 'Publikasi/luaran') : p.jenis === 'yudisium' ? 'Berkas yudisium'
  : p.jenis === 'kabar' ? (p.data?.judul || 'Kabar kegiatan')
  : p.jenis === 'surat' ? ((JENIS_SURAT.find(x => x[0] === p.data?.jenis_surat) || [, 'Surat'])[1]) : (p.data?.nama_kegiatan || 'Lomba');

export const keB64 = f => new Promise((ok, gagal) => {
  const r = new FileReader();
  r.onload = () => ok(String(r.result).split(',')[1] || '');
  r.onerror = () => gagal(r.error);
  r.readAsDataURL(f);
});

// Hasil isiBerkas_ Apps Script ({name, mime, data base64}) dibuka di tab baru.
export function bukaIsi(out){
  const b = Uint8Array.from(atob(out.data), c => c.charCodeAt(0));
  const u = URL.createObjectURL(new Blob([b], { type: out.mime || 'application/octet-stream' }));
  const a = document.createElement('a');
  a.href = u; a.target = '_blank'; a.rel = 'noopener';
  if (!/^(application\/pdf|image\/)/.test(out.mime || '')) a.download = out.name || 'berkas';
  a.click();
  setTimeout(() => URL.revokeObjectURL(u), 60000);
}

// Panggil Apps Script (UPLOAD_URL di config.js).
export async function appsScript(isi){
  const res = await fetch(window.UPLOAD_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                                               body: JSON.stringify(isi) });
  const out = await res.json();
  if (!out.ok) throw new Error(out.error || 'Gagal.');
  return out;
}

// ---------- Rekap dan unduhan per periode (pemilik 2026-11-17) ----------
// Waktu satu pengajuan untuk saringan TS/tahun (sdgs-unduh.js cocokPeriode memakai {tahun, bulan}):
// KP = tanggal mulai di laporan selesai, lalu tanggal mulai dari jawaban instansi (107), lalu rencana mulai, lalu tanggal dibuat; lomba = tanggal lomba, lalu dibuat.
export function waktuPengajuan(p){
  const d = p.data || {}, s = p.data_selesai || {};
  const t = String((p.jenis === 'kp' ? s.tanggal_mulai || d.tanggal_mulai || d.rencana_mulai : d.tanggal) || p.dibuat || '');
  const m = t.match(/^(\d{4})-(\d{2})/);
  return m ? { tahun: +m[1], bulan: +m[2] } : { tahun: 0, bulan: 0 };
}

// Keadaan KP untuk rekap: 'selesai' (laporan selesai disahkan), 'berjalan' (ditampilkan "dilaksanakan": pengajuan
// disetujui atau laporan selesai sedang diperiksa), 'proses' (pengajuan belum disetujui), 'ditolak' (prodi atau instansi), 'draf'.
export function keadaanKP(p){
  if (p.status === 'draf') return 'draf';
  if (p.status === 'ditolak') return 'ditolak';
  if (p.status === 'dibatalkan') return 'dibatalkan';   // 161: tidak ikut rekap
  if (p.tahap === 'selesai') return p.status === 'disetujui' ? 'selesai' : 'berjalan';
  return p.status === 'disetujui' ? 'berjalan' : 'proses';
}

// Ringkasan: angka KP dan lomba, serta KP per instansi (nama instansi disatukan tanpa beda huruf besar/spasi).
export function rekapPengajuan(xs){
  const masuk = p => !['draf', 'dibatalkan'].includes(p.status);   // 161: dibatalkan tidak dihitung
  const kp = xs.filter(p => p.jenis === 'kp' && masuk(p)), lomba = xs.filter(p => p.jenis === 'lomba' && masuk(p));
  const hit = (ys, f) => ys.filter(f).length;
  const per = new Map();
  for (const p of kp) {
    const nama = String(p.data?.instansi || '').trim().replace(/\s+/g, ' ');
    if (!nama) continue;
    const k = nama.toLowerCase(), x = per.get(k) || { instansi: nama, mahasiswa: 0, selesai: 0, berjalan: 0 };
    x.mahasiswa++; const e = keadaanKP(p);
    if (e === 'selesai') x.selesai++; else if (e === 'berjalan') x.berjalan++;
    per.set(k, x);
  }
  return {
    kp: { semua: kp.length, selesai: hit(kp, p => keadaanKP(p) === 'selesai'), berjalan: hit(kp, p => keadaanKP(p) === 'berjalan'),
          proses: hit(kp, p => keadaanKP(p) === 'proses') },
    lomba: { semua: lomba.length, disetujui: hit(lomba, p => p.status === 'disetujui'),
             tingkat: Object.fromEntries(TINGKAT.map(([k]) => [k, hit(lomba, p => p.status === 'disetujui' && p.data?.tingkat === k)])) },
    instansi: [...per.values()].sort((a, b) => b.mahasiswa - a.mahasiswa || a.instansi.localeCompare(b.instansi)),
    // 122: berkas yudisium per status (draf tidak ikut, sama dengan jenis lain).
    yudisium: (ys => ({ semua: ys.length, diperiksa: hit(ys, p => p.status === 'admin'), disahkan: hit(ys, p => p.status === 'disetujui'),
                        dikembalikan: hit(ys, p => p.status === 'dikembalikan') }))(xs.filter(p => p.jenis === 'yudisium' && masuk(p))),
  };
}

// Isi lembar Excel (untuk admin; memuat NIM). Sel tautan berbentuk {t, l}.
const LABEL_KEADAAN = { selesai: 'KP selesai', berjalan: 'KP dilaksanakan', proses: 'Pengajuan diperiksa', ditolak: 'Ditolak', draf: 'Draf' };
export function lembarPengajuan(xs, tsTeks = () => '', daftarYud = BERKAS_YUDISIUM_BAWAAN){
  const masuk = p => !['draf', 'dibatalkan'].includes(p.status);   // 161: dibatalkan tidak dihitung
  const kp = xs.filter(p => p.jenis === 'kp' && masuk(p)), lomba = xs.filter(p => p.jenis === 'lomba' && masuk(p));
  const yud = xs.filter(p => p.jenis === 'yudisium' && masuk(p));
  const pemb = p => p.dosen?.nama || p.pembimbing || '';
  const L = {
    KP: [['No', 'NIM', 'Nama', 'Program', 'Instansi', 'Pembimbing', 'Mulai', 'Selesai', 'Pembimbing lapangan', 'TS', 'Keadaan', 'Berkas']],
    Lomba: [['No', 'NIM', 'Nama', 'Kegiatan', 'Penyelenggara', 'Tingkat', 'Bidang', 'Capaian', 'Tanggal', 'Anggota lain', 'Pembimbing', 'TS', 'Status']],
    'Instansi KP': [['Instansi', 'Mahasiswa', 'KP selesai', 'KP dilaksanakan']],
    Yudisium: [['No', 'NIM', 'Nama', 'Judul TA', 'Berkas wajib', 'Belum ada', 'Status', 'Diperbarui']],
    Berkas: [['NIM', 'Nama', 'Jenis pengajuan', 'Jenis berkas', 'Nama berkas', 'Tautan']],
  };
  yud.forEach((p, i) => {
    const k = kelengkapanYudisium(daftarYud, p.pengajuan_berkas || []);
    L.Yudisium.push([i + 1, p.nim, p.nama, p.data?.judul || '', `${k.ada}/${k.wajib}`, k.kurang.join('; '), labelStatus(p),
      String(p.diperbarui || '').slice(0, 10)]);
  });
  kp.forEach((p, i) => {
    const s = p.data_selesai || {};
    L.KP.push([i + 1, p.nim, p.nama, labelProgram(p.data?.program), p.data?.instansi || '', pemb(p), s.tanggal_mulai || p.data?.rencana_mulai || '',
      s.tanggal_selesai || p.data?.rencana_selesai || '', [s.pembimbing_lapangan, s.jabatan_lapangan].filter(Boolean).join(', '),
      tsTeks(p), LABEL_KEADAAN[keadaanKP(p)], (p.pengajuan_berkas || []).length]);
  });
  lomba.forEach((p, i) => {
    const d = p.data || {};
    L.Lomba.push([i + 1, p.nim, p.nama, d.nama_kegiatan || '', d.penyelenggara || '', (TINGKAT.find(t => t[0] === d.tingkat) || [, ''])[1],
      (BIDANG.find(t => t[0] === d.bidang) || [, ''])[1], d.capaian || '', d.tanggal || '', teksAnggota(d.anggota).replace(/\n/g, '; '),
      pemb(p), tsTeks(p), labelStatus(p)]);
  });
  rekapPengajuan(xs).instansi.forEach(x => L['Instansi KP'].push([x.instansi, x.mahasiswa, x.selesai, x.berjalan]));
  [...kp, ...lomba, ...yud].forEach(p => (p.pengajuan_berkas || []).forEach(b => L.Berkas.push([p.nim, p.nama, JENIS[p.jenis]?.singkat || p.jenis,
    labelBerkas(b.jenis, daftarYud), b.nama || '', b.url ? { t: b.url, l: b.url } : ''])));
  return L;
}

// ---------- Kemajuan TA (182, pemilik 2026-11-26) ----------
// Langkah TA satu mahasiswa dari mhs_kemajuan_ta(token) = { pengajuan, jadwal, syarat }. Hasil [{kode, label, keadaan, ket, id}]
// dengan keadaan seperti htmlJalur: selesai | kini (langkah pertama yang belum selesai) | kembali (kini, pengajuannya
// dikembalikan) | nanti. id = pengajuan yang bisa dibuka dari langkah itu (atau null).
export const HASIL_TA = { lulus: 'Lulus', lulus_revisi: 'Lulus dengan revisi', mengulang: 'Mengulang' };
const LULUS_TA = h => h === 'lulus' || h === 'lulus_revisi';
export const tglIndo = s => s ? new Date(String(s).slice(0, 10) + 'T00:00:00Z')
  .toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : '';

export function kemajuanTA(k){
  if (!k) return [];
  const ta = (k.pengajuan || []).filter(x => x.jenis === 'ta' && x.status !== 'dibatalkan');
  // 185: pembimbing 1 atau judul diganti (ganti_pada) = seminar diulang; seminar dan pendaftaran sebelum tanggal itu diabaikan.
  const ganti = k.ganti_pada || '', baru = (x, t) => !ganti || x.tahap_ta === TAHAP_PEMBIMBING_TA || String(t || '').slice(0, 10) >= ganti;
  const terbaru = t => ta.filter(x => x.tahap_ta === t && baru(x, x.dibuat)).sort((a, b) => String(b.dibuat).localeCompare(String(a.dibuat)))[0] || null;
  const jadwal = t => (k.jadwal || []).filter(j => j.tahap === t && baru(j, j.tanggal)).slice(-1)[0] || null;   // urut tanggal: terakhir
  const syarat = t => (k.syarat || []).find(s => s?.tahap === t) || null;
  const label = x => labelStatus({ ...x, data: { tahap_ta: x.tahap_ta } });
  const L = [];

  const pen = terbaru(TAHAP_PEMBIMBING_TA);
  const adaSeminar = TAHAP_TA.some(([t]) => terbaru(t) || jadwal(t));
  L.push({ kode: 'pembimbing', label: 'Pembimbing ditetapkan', id: pen?.id ?? null, kembali: pen?.status === 'dikembalikan',
    selesai: pen?.status === 'disetujui' || (!pen && adaSeminar),
    ket: pen ? (pen.status !== 'disetujui' ? label(pen) : ganti ? `Diganti ${tglIndo(ganti)}; seminar proposal diulang` : tglIndo(pen.diperbarui))
      : adaSeminar ? 'tidak tercatat di situs' : 'Ajukan pembimbing TA' });

  const seminar = TAHAP_TA.map(([t, nama]) => {
    const j = jadwal(t), a = terbaru(t);
    const lulus = j?.status === 'selesai' && LULUS_TA(j.hasil);
    let ket;
    if (lulus) ket = `${HASIL_TA[j.hasil]} · ${tglIndo(j.tanggal)}`;
    else if (j?.status === 'selesai' && j.hasil === 'mengulang')
      ket = a && String(a.dibuat).slice(0, 10) > String(j.tanggal) ? label(a) : `Mengulang (${tglIndo(j.tanggal)}): daftar lagi`;
    else if (j?.status === 'terjadwal') ket = `Dijadwalkan ${tglIndo(j.tanggal)}`;
    else if (j?.status === 'ditunda') ket = 'Ditunda; tunggu jadwal baru';
    else if (j?.status === 'selesai') ket = 'Menunggu hasil';
    else if (a && a.status !== 'ditolak') ket = label(a);
    else ket = 'Belum mendaftar';
    return { kode: t, label: nama, id: a?.id ?? j?.pengajuan_id ?? null, selesai: lulus, kembali: !j && a?.status === 'dikembalikan', ket,
      ada: !!j || (!!a && a.status !== 'ditolak'), dikirim: !!j || ['pembimbing', 'admin', 'disetujui'].includes(a?.status) };
  });
  // Tahap tanpa catatan di situs (mis. seminar sebelum situs dipakai) padahal tahap sesudahnya sudah berjalan: dianggap selesai.
  for (let i = seminar.length - 2; i >= 0; i--)
    if ((seminar[i + 1].selesai || seminar[i + 1].ada) && !seminar[i].selesai && !seminar[i].ada)
      Object.assign(seminar[i], { selesai: true, ket: 'tidak tercatat di situs' });

  // Bimbingan: syarat jumlah untuk tahap seminar/sidang yang sedang dituju, diletakkan tepat sebelum tahap itu.
  const sasaran = seminar.find(s => !s.selesai), sy = sasaran && syarat(sasaran.kode);
  const bimb = { kode: 'bimbingan', label: sasaran ? `Bimbingan untuk ${sasaran.label.toLowerCase()}` : 'Bimbingan', id: null, kembali: false,
    selesai: !sasaran || !sy || !sy.minimal || !!sy.cukup || sasaran.dikirim,   // dikirim: syarat sudah diperiksa saat mendaftar
    ket: !sasaran ? 'Semua tahap selesai' : !sy ? '' : !sy.minimal ? 'Tanpa syarat jumlah'
      : `${sy.terhitung} dari ${sy.minimal} terkonfirmasi${sy.sejak ? ' sejak ' + tglIndo(sy.sejak) : ''}` };
  const ke = sasaran ? seminar.indexOf(sasaran) : seminar.length;
  L.push(...seminar.slice(0, ke), bimb, ...seminar.slice(ke));

  const js = jadwal('sidang_akhir'), lulusAkhir = js?.status === 'selesai' && LULUS_TA(js.hasil);
  L.push({ kode: 'revisi', label: 'Revisi sidang akhir', id: null, kembali: false,
    selesai: lulusAkhir && (js.hasil === 'lulus' || !!js.revisi_selesai),
    ket: !lulusAkhir ? '' : js.hasil === 'lulus' ? 'Tanpa revisi' : js.revisi_selesai ? `Selesai ${tglIndo(js.revisi_selesai)}`
      : `Batas ${js.batas_revisi ? tglIndo(js.batas_revisi) : '(belum ditetapkan)'}` });
  L.push({ kode: 'siup', label: 'Nilai di SIUP', id: null, kembali: false, selesai: !!js?.siup_diunggah,
    ket: js?.siup_diunggah ? tglIndo(js.siup_diunggah) : lulusAkhir ? 'Menunggu nilai diunggah ke SIUP' : '' });

  let kini = false;
  return L.map(({ selesai, kembali, ada, dikirim, ...x }) => {
    const keadaan = selesai ? 'selesai' : kini ? 'nanti' : (kini = true, kembali ? 'kembali' : 'kini');
    return { ...x, keadaan };
  });
}

// ---------- Cek kemiripan sebelum sidang akhir (185, pemilik 2026-11-26) ----------
export const BATAS_KEMIRIPAN = 25;   // bawaan; nilai berlaku dari ta_kemiripan_batas()
/** '12,5' -> 12.5; bukan angka 0-100 (maks. 2 desimal) -> null. Sama dengan mhs_rapikan (185). */
export function persenKemiripan(v){
  const s = String(v ?? '').trim().replace(',', '.');
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(s)) return null;
  const n = Number(s);
  return n <= 100 ? n : null;
}
/** Sidang akhir yang sedang diperiksa dan belum dicatat pemeriksaan kemiripannya (pembimbing 1, koordinator TA, admin). */
export const perluCekKemiripan = p => p?.jenis === 'ta' && p?.data?.tahap_ta === 'sidang_akhir'
  && ['pembimbing', 'admin'].includes(p?.status) && !p?.data?.kemiripan_cek;
/** "12.5 % menurut mahasiswa · diperiksa 12.5 % oleh Nama, 26-11-2026 (batas 25 %)". */
export function teksKemiripan(d = {}, batas = BATAS_KEMIRIPAN){
  const c = d.kemiripan_cek, b = c?.batas ?? batas;
  const mhs = d.kemiripan_persen != null && d.kemiripan_persen !== '' ? `${d.kemiripan_persen} % menurut mahasiswa` : 'belum diisi mahasiswa';
  return `${mhs} · ${c ? `diperiksa ${c.persen} % oleh ${c.oleh || 'prodi'}${c.waktu ? ', ' + tglIndo(c.waktu) : ''}` : 'belum diperiksa'} (batas ${b} %)`;
}

// ---------- Peringatan dini TA (183, pemilik 2026-11-26) ----------
// Baris ta_peringatan_dini(): tahap = tahap yang sedang dituju; sinyal = bimbingan_berhenti | tahap_lama | revisi_lewat.
export const TAHAP_PERINGATAN = { seminar_proposal: 'Menuju seminar proposal', seminar_kemajuan: 'Menuju seminar kemajuan',
  sidang_akhir: 'Menuju sidang akhir', revisi: 'Revisi sidang akhir' };
export function teksPeringatanTA(r){
  return (r?.sinyal || []).map(s => ({
    bimbingan_berhenti: `${r.hari_bimbingan} hari tanpa catatan bimbingan (ambang ${r.ambang_bimbingan})`,
    tahap_lama: `${r.hari_tahap} hari sejak tahap terakhir (ambang ${r.ambang_tahap})`,
    revisi_lewat: `Revisi lewat batas ${tglIndo(r.batas_revisi)}`,
  }[s] || s));
}
