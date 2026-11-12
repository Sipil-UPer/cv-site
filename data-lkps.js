/* =====================================================================
   data-lkps.js — data yang dipakai LKPS, indeks bukti, draf LED, dan halaman
   narasi LED. Dibaca di browser pemakai yang login, tidak masuk data.json.
   ===================================================================== */
// Data Data prodi yang dipakai LKPS dan draf LED (hanya di browser pemakai yang login;
// tabel yang belum boleh dibaca atau belum ada cukup kosong).
export async function ambilDaftarLKPS(sb){
  // Tahap 2: lembar daftar (lkps.js petaDaftar). Tabel yang belum ada
  // (patch belum dijalankan) cukup kosong.
  const ambil = async q => { const { data, error } = await q; if (error) console.warn(error.message); return data || []; };
  // Semua kolom: kolom patch yang belum dijalankan (22, 36) cukup tidak ada.
  const ambilDosen = () => ambil(sb.from('dosen').select('*'));
  // Mata kuliah untuk 3.a.1/3.a.4/3.a.5 dan 4.a kolom 15 (23-patch-kurikulum.sql);
  // tanpa patch: kolom lama (kode, nama, sks, semester, inti).
  const MK_DASAR = 'id,kode,nama,sks,semester,inti,aktif,urutan';
  const ambilMK = async () => {
    const { data, error } = await sb.from('ref_mata_kuliah').select(MK_DASAR +
      ',sks_kuliah,sks_seminar,sks_praktikum,rps_ada,rps_url,unit_penyelenggara,basic_science,capstone,' +
      'capstone_cakupan,capstone_pendukung,pengampu');
    return error ? ambil(sb.from('ref_mata_kuliah').select(MK_DASAR)) : (data || []);
  };
  // Kerja sama induk (24-patch-kerjasama-induk.sql): kolom baru + karya.kerjasama_id;
  // tanpa patch: kolom lama.
  const KARYA_DASAR = 'id,kategori,judul,tahun,bulan,sub_jenis,jenis,tingkat,indeksasi,nama_terbitan,doi,url,bukti_url,' +
    'mata_kuliah,induk_id,status,' +
    'karya_penulis(peran,korespondensi,dosen(nama)),karya_mitra(institusi,tingkat),karya_mahasiswa(nama)';
  // Kolom isian tambahan (25-patch-isian-karya.sql): 4.f.3, 4.i, 3.a.3, 6.h.1, 6.i.
  const KARYA_25 = ',tkt,nomor_tkt,jumlah_sitasi,tema_id,keterlibatan_mhs,bukti_integrasi,sesuai_rps';
  // Isian 2.a dari dosen (32-patch-isian-kerjasama.sql).
  const KARYA_32 = ',manfaat_ks,mulai_ks,selesai_ks,jenis_bukti_ks';
  const ambilKarya = async () => {
    const q = kol => sb.from('karya').select(kol).eq('status', 'terverifikasi').limit(5000);
    // Sitasi per tahun (42-patch-sitasi-tahunan.sql); tanpa patch: tanpa tabel itu.
    const SITASI = ',karya_sitasi(tahun,jumlah,sumber)';
    // ID OpenAlex (44-patch-openalex-id.sql): tautan karya yang mengutip di 4.i.
    for (const kol of [KARYA_DASAR + ',kerjasama_id' + KARYA_25 + KARYA_32 + SITASI + ',openalex_id',
                       KARYA_DASAR + ',kerjasama_id' + KARYA_25 + KARYA_32 + SITASI,
                       KARYA_DASAR + ',kerjasama_id' + KARYA_25 + KARYA_32,
                       KARYA_DASAR + ',kerjasama_id' + KARYA_25, KARYA_DASAR + ',kerjasama_id']) {
      const { data, error } = await q(kol);
      if (!error) return data || [];
    }
    return ambil(q(KARYA_DASAR));
  };
  const KS_DASAR = 'mitra,jenis,tingkat,kegiatan,tahun_mulai,tahun_selesai';
  const ambilKS = async () => {
    const { data, error } = await sb.from('lkps_kerjasama')
      .select('id,' + KS_DASAR + ',tautan_bukti,manfaat,tanggal_mulai,tanggal_selesai,jenis_bukti');
    return error ? ambil(sb.from('lkps_kerjasama').select(KS_DASAR)) : (data || []);
  };
  const [dosen, karya, kerjasama, bkd, prestasi, luaranMhs, mk, tema, mhs, tracer,
         vmts, prodiUpps, dana, tendik, buktiVmts, prasarana, dokK3l, fasK3l, dokumen, ppepp, buktiBaris, buktiKarya, target, tim,
         standar, capaianStandar, revisiStandar, temuan, rekapEval] = await Promise.all([
    ambilDosen(),
    ambilKarya(),
    ambilKS(),
    // Isian dosen dihitung setelah diverifikasi (39-patch-bkd-dosen.sql).
    ambil(sb.from('lkps_bkd').select('*'))
      .then(xs => xs.filter(b => !b.verifikasi || b.verifikasi === 'terverifikasi')),
    // Isian dosen dihitung setelah diverifikasi (38-patch-prestasi-dosen.sql).
    ambil(sb.from('lkps_prestasi_mahasiswa').select('*'))
      .then(xs => xs.filter(p => !p.status || p.status === 'terverifikasi')),
    // select('*'): kolom patch 26 (status/nomor/TKT) ikut bila sudah ada; hanya di browser admin.
    ambil(sb.from('lkps_luaran_mahasiswa').select('*')),
    ambilMK(),
    ambil(sb.from('ref_tema_peta_jalan').select('id,nama,jenis')),
    // 6.a/6.b/6.f.1/6.f.2: kolom patch 26 dari Data prodi (Mahasiswa per TS, Tracer study).
    ambil(sb.from('lkps_mahasiswa_ta').select('*')),
    ambil(sb.from('lkps_tracer_lulusan').select('*')),
    // PS / Tabel 1 / 2.b / 4.b (27-patch-institusi-upps.sql); bukti VMTS = Link Dokumen Tabel 1.
    ambil(sb.from('lkps_vmts').select('*')),
    ambil(sb.from('lkps_prodi_upps').select('*')),
    ambil(sb.from('lkps_penggunaan_dana').select('*')),
    ambil(sb.from('lkps_tendik').select('*')),
    // Bukti VMTS: tautan luar atau dokumen pustaka (29-patch-pustaka-dokumen.sql).
    (async () => { const q = kol => sb.from('lkps_bukti').select(kol).eq('tabel', 'lkps_vmts').order('id');
      const { data, error } = await q('baris_id,url,dokumen(url)');
      return error ? ambil(q('baris_id,url')) : (data || []); })(),
    // 5.a / 5.b / 5.c (28-patch-sarana-k3l.sql).
    ambil(sb.from('lkps_prasarana').select('*')),
    ambil(sb.from('lkps_dokumen_k3l').select('*')),
    ambil(sb.from('lkps_fasilitas_k3l').select('*')),
    // 7.a dari pustaka dokumen, 7.b tahap PPEPP (30-patch-spmi.sql).
    ambil(sb.from('dokumen').select('*')),
    ambil(sb.from('lkps_spmi_ppepp').select('*')),
    // Bukti baris Data prodi untuk tabel bukti LED (29-patch-pustaka-dokumen.sql).
    (async () => { const q = kol => sb.from('lkps_bukti').select(kol).order('id');
      const { data, error } = await q('tabel,baris_id,judul,url,dokumen(jenis,tahun,judul,nomor,url)');
      return error ? ambil(q('tabel,baris_id,judul,url')) : (data || []); })(),
    ambil(sb.from('karya_bukti').select('karya_id,jenis,judul,url')),
    // Target IKU/IKT (34-patch-target-kinerja.sql).
    ambil(sb.from('lkps_target_kinerja').select('*')),
    // Susunan tim penyusun LED (37-patch-susunan-tim.sql).
    ambil(sb.from('led_tim').select('*')),
    // Standar SPMI, capaian per TS, revisi (67-patch), temuan AMI (51-patch), dan rekap evaluasi pembelajaran
    // tanpa angka per dosen (68-patch): butir 16 dan 55 draf LED (pemilik 2026-11-12).
    ambil(sb.from('spmi_standar').select('id,kode,lembar,pernyataan,dipantau,aktif')),
    ambil(sb.from('spmi_capaian').select('standar_id,tahun_ts,status,rencana').limit(20000)),
    ambil(sb.from('spmi_standar_revisi').select('standar_id,tanggal,perubahan,dasar')),
    ambil(sb.from('ami_temuan').select('tahun_ts,kategori,status')),
    ambil(sb.rpc('rekap_evaluasi')),
  ]);
  return { dosen, karya, kerjasama, bkd, prestasi, luaranMhs, mk, tema, mhs, tracer,
           vmts, prodiUpps, dana, tendik, buktiVmts, prasarana, dokK3l, fasK3l, dokumen, ppepp, buktiBaris, buktiKarya, target, tim,
           standar, capaianStandar, revisiStandar, temuan, rekapEval };
}
