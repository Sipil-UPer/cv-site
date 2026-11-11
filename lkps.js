/* =====================================================================
   LKPS — Laporan Kinerja Program Studi (LAM Teknik, APS Akademik/Vokasi,
   "pasca akreditasi pertama dan unggul"), templat resmi lkps-template.xlsx.
   ---------------------------------------------------------------------
   Dipanggil dari tombol "Unduh LKPS (.xlsx)" di skor.html, khusus admin
   (pemilik 2026-11-04). Berkas disusun di browser admin, jadi data yang
   tidak publik tidak pernah masuk data.json.

   Templat TIDAK diubah lewat pustaka spreadsheet (openpyxl membuang daftar
   pilihan berformat x14): nilai ditulis langsung ke XML sel, gaya sel
   dipertahankan, sel berumus tidak pernah ditimpa, dan Excel diminta
   menghitung ulang rumus saat berkas dibuka.

   Tahap 1 mengisi Menu, 3b, 3c, 4d, 6a, 6b, 6e1, 6f1, 6f2, 6g1, 6g2 dari
   angka yang sama dengan halaman skor. Lembar lain dibiarkan untuk diisi
   prodi; kolom yang tidak disimpan situs (mis. pita waktu tunggu) kosong.
   ===================================================================== */
import { versiUntukTS, daftarProdi, STATUS_PS, tglTeks } from './pustaka-dokumen.js?v=2026-11-11-539976';
import { teksPendidikan } from './profil-dosen.js?v=2026-11-11-539976';
import { barisKerjaSama } from './kerjasama-karya.js?v=2026-11-11-539976';
import { karya4i } from './sitasi.js?v=2026-11-11-539976';

const TEMPLATE = 'lkps-template.xlsx';
export const JSZIP = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm';

// Urutan baris 6.g.2 di templat (B7..B13), kunci = ASPEK_KEPUASAN.
const BARIS_KEPUASAN = ['etika', 'keahlian_bidang_ilmu', 'bahasa_asing', 'teknologi_informasi',
                        'komunikasi', 'kerja_sama_tim', 'pengembangan_diri'];
const KOLOM_TS = ['C', 'D', 'E'];                 // TS-2, TS-1, TS pada 3b, 3c, 4d, 6e1
const NA = ['na1', 'na2', 'na3', 'na4', 'nb1', 'nb2', 'nb3'];

// Tanggal Excel (serial, sistem 1900) untuk 31 Agustus tahun TS.
export function serialTS(ts){
  return Math.round((Date.UTC(ts, 7, 31) - Date.UTC(1899, 11, 30)) / 86400000);
}

/* ---------------------------------------------------------------------
   Peta isian: { namaLembar: { 'C9': nilai, ... } }. Murni, tanpa DOM.
   C = { D (data.json), ts, prodi, institusi, rencanaKepuasan: {aspek: teks} }
   --------------------------------------------------------------------- */
export function petaLKPS(C){
  const { D, ts } = C;
  const A = (D && D.akreditasi) || {};
  const peta = {};
  const set = (lembar, ref, v) => {
    if (v == null || v === '' || (typeof v === 'number' && !Number.isFinite(v))) return;
    (peta[lembar] ||= {})[ref] = v;
  };
  const tsKe = [ts - 2, ts - 1, ts];

  // Menu: identitas dan TS (acuan semua rumus TS-2/TS-1/TS)
  set('Menu', 'H7', C.institusi);
  set('Menu', 'H11', 'Sarjana');
  set('Menu', 'H23', C.prodi);
  set('Menu', 'S73', { tanggal: serialTS(ts) });

  // 3.b / 3.c: jumlah judul per sumber pembiayaan (baris PT+mandiri, DN, LN)
  for (const [lembar, kategori, baris0] of [['3b', 'penelitian', 9], ['3c', 'pkm', 10]]){
    const rows = (A.sumber_dana || []).filter(r => r.kategori === kategori);
    tsKe.forEach((t, i) => {
      const r = rows.find(x => x.tahun === t) || {};
      set(lembar, `${KOLOM_TS[i]}${baris0}`, r.pt_mandiri || 0);
      set(lembar, `${KOLOM_TS[i]}${baris0 + 1}`, r.dalam_negeri || 0);
      set(lembar, `${KOLOM_TS[i]}${baris0 + 2}`, r.luar_negeri || 0);
    });
  }

  // 4.d / 6.e.1: publikasi per jenis NA1..NB3 (baris 7..13)
  for (const [lembar, kunci] of [['4d', 'publikasi_dtps'], ['6e1', 'publikasi_mhs']]){
    const rows = A[kunci] || [];
    tsKe.forEach((t, i) => {
      const r = rows.find(x => x.tahun === t) || {};
      NA.forEach((k, j) => set(lembar, `${KOLOM_TS[i]}${7 + j}`, r[k] || 0));
    });
  }

  // 6.a: satu baris prodi yang diakreditasi; asing dicatat penuh waktu
  // (situs tidak membedakan penuh/paruh waktu).
  const ta = A.ta || [];
  set('6a', 'B7', C.prodi);
  set('6a', 'C7', 'V');
  tsKe.forEach((t, i) => {
    const r = ta.find(x => x.tahun_ts === t);
    if (!r) return;
    set('6a', `${'DEF'[i]}7`, r.mahasiswa_aktif);
    set('6a', `${'GHI'[i]}7`, r.mahasiswa_asing);
  });

  // 6.b: lulusan dan rerata IPK per TS (min/maks tidak disimpan situs)
  tsKe.forEach((t, i) => {
    const r = ta.find(x => x.tahun_ts === t);
    if (!r || !r.lulusan) return;
    set('6b', `C${6 + i}`, r.lulusan);
    set('6b', `E${6 + i}`, r.rerata_ipk);
  });

  // 6.f.1 (bagian Sarjana, baris 31-32), 6.f.2, 6.g.1: tahun lulus TS-2, TS-1
  const tracer = D.tracer || [];
  [ts - 2, ts - 1].forEach((t, i) => {
    const r = tracer.find(x => x.tahun_lulus === t);
    if (!r) return;
    set('6f1', `B${31 + i}`, r.lulusan);
    set('6f1', `C${31 + i}`, r.terlacak);
    set('6f2', `B${7 + i}`, r.lulusan);
    set('6f2', `C${7 + i}`, r.terlacak);
    set('6g1', `B${7 + i}`, r.lulusan);
    set('6g1', `D${7 + i}`, r.terlacak);
    set('6g1', `E${7 + i}`, r.kerja_wilayah);
    set('6g1', `F${7 + i}`, r.kerja_nasional);
    set('6g1', `G${7 + i}`, r.kerja_internasional);
  });

  // 6.g.2: tujuh aspek untuk TS, beserta rencana tindak lanjut
  const kp = (A.kepuasan || []).filter(r => r.tahun_ts === ts);
  BARIS_KEPUASAN.forEach((a, j) => {
    const r = kp.find(x => x.aspek === a);
    if (!r) return;
    const b = 7 + j;
    set('6g2', `C${b}`, r.sangat_baik);
    set('6g2', `D${b}`, r.baik);
    set('6g2', `E${b}`, r.cukup);
    set('6g2', `F${b}`, r.kurang);
    set('6g2', `G${b}`, (C.rencanaKepuasan || {})[a]);
  });
  if (C.daftar) Object.entries(petaDaftar(C)).forEach(([l, sel]) =>
    Object.entries(sel).forEach(([ref, v]) => set(l, ref, v)));
  return peta;
}

/* ---------------------------------------------------------------------
   Tahap 2: lembar daftar dari tabel Supabase (admin), pemilik 2026-11-04.
   C.daftar = { dosen, karya, kerjasama, bkd, prestasi, luaranMhs }
     dosen:     [{nama, nidn, pendidikan, jabatan, dtps, aktif, peran}]
     karya:     terverifikasi, dengan karya_penulis(peran, dosen(nama)),
                karya_mitra(institusi, tingkat), karya_mahasiswa(nama)
   Tanggal yang hanya diketahui bulan-tahunnya ditulis tanggal 1 bulan itu
   (keputusan pemilik 2026-11-04); tanpa bulan, tanggal dikosongkan.
   Kolom yang tidak disimpan situs (tanggal kerja sama, TKT, nomor HKI
   mahasiswa, jenis kegiatan 6.h.1, dst.) dibiarkan kosong.
   --------------------------------------------------------------------- */
const JABATAN = { tenaga_pengajar: 'Tenaga Pengajar', asisten_ahli: 'Asisten Ahli', lektor: 'Lektor',
                  lektor_kepala: 'Lektor Kepala', guru_besar: 'Guru Besar' };
// Daftar pilihan templat (supabase/25-patch-isian-karya.sql): 3a3 J6:J9, 6h1 D4:D7.
const BUKTI_INTEGRASI = { naskah_hibah: 'Naskah Hibah', laporan_akhir: 'Laporan Akhir', publikasi: 'Publikasi',
  lainnya: 'Bukti Sahih Lainnya' };
const KETERLIBATAN = { tugas_akhir: 'Tugas Akhir', perancangan: 'Perancangan',
  pengembangan_produk: 'Pengembangan Produk/Jasa', lainnya: 'Kegiatan Lain yang Relevan' };
// Daftar pilihan Bukti Kerjasama, lembar 2a1 L4:L7 (dipakai juga 2a2, 2a3).
const BUKTI_KS = { surat_penugasan: 'Surat Penugasan', spk: 'Surat Perjanjian Kerjasama (SPK)',
  bukti_pelaksanaan: 'Bukti-bukti Pelaksanaan (Laporan, Hasil Kerjasama, Luaran Kerjasama)',
  lainnya: 'Bukti lain yang relevan' };
// Daftar pilihan Kategori Dosen di lembar 4a (L6:L8).
const KATEGORI_LKPS = { tetap: 'Dosen Tetap', tidak_tetap: 'Dosen Tidak Tetap', industri: 'Dosen Industri' };
const INTEGRASI = { bahan_kajian: 'Tambahan Materi Perkuliahan', studi_kasus: 'Studi Kasus',
                    bab_buku_ajar: 'Bab/ Subbab dalam buku ajar', modul_praktikum: 'Bahan Ajar',
                    tugas_proyek: 'Bentuk Lain yang Relevan', lainnya: 'Bentuk Lain yang Relevan' };
const REKOGNISI = { visiting: 'visiting lecturer atau visiting scholar',
                    invited_speaker: 'keynote speaker/invited speaker',
                    editor: 'editor atau mitra bestari', mitra_bestari: 'editor atau mitra bestari',
                    narasumber: 'staf ahli/narasumber ', juri: 'staf ahli/narasumber ',   // spasi di ujung = templat
                    penghargaan: 'penghargaan atas prestasi dan kinerja' };
// kolom "V" tingkat: [lokal/wilayah, nasional, internasional]
const tingkatKe = t => /^internasional/.test(t || '') ? 2 : /^nasional/.test(t || '') ? 1 : /^wilayah/.test(t || '') ? 0 : -1;

export function serialTanggal(tahun, bulan){
  if (!tahun || !bulan) return null;
  return { tanggal: Math.round((Date.UTC(+tahun, +bulan - 1, 1) - Date.UTC(1899, 11, 30)) / 86400000) };
}
// Tanggal ISO "YYYY-MM-DD" (kolom date Supabase) -> serial tanggal Excel.
export function serialISO(iso){
  const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  return { tanggal: Math.round((Date.UTC(+m[1], +m[2] - 1, +m[3]) - Date.UTC(1899, 11, 30)) / 86400000) };
}
const tsKarya = k => (+k.bulan >= 9 ? +k.tahun + 1 : +k.tahun);

export function petaDaftar(C){
  const { ts } = C;
  const X = C.daftar || {};
  const out = {};
  const set = (l, ref, v) => { if (v != null && v !== '') (out[l] ||= {})[ref] = v; };
  const dalam = (t, n = 3) => t >= ts - n + 1 && t <= ts;
  const urut = (a, b) => (a.tahun - b.tahun) || String(a.judul).localeCompare(String(b.judul));

  // 4.a profil dosen: semua yang berkategori (Dosen Tetap / Tidak Tetap /
  // Industri; DTPS tanpa kategori = Dosen Tetap). Nama di sini = daftar
  // ValidDosen di lembar lain. Kolom E-P, R, S dari profil-dosen.js
  // (supabase/22-patch-profil-dosen.sql); "V" hanya bila admin menilai.
  const dtps = (X.dosen || []).filter(d => d.dtps && d.peran !== 'asesor')
    .sort((a, b) => a.nama.localeCompare(b.nama));
  // Yang tidak aktif tidak dihitung (pemilik 2026-11-10), sama dengan butir 26.
  const profil = (X.dosen || []).filter(d => d.aktif !== false && d.peran !== 'asesor' && (d.kategori || d.dtps))
    .sort((a, b) => a.nama.localeCompare(b.nama));
  const mk = (X.mk || []).filter(m => m.aktif !== false)
    .sort((a, b) => ((a.semester ?? 99) - (b.semester ?? 99)) || ((a.urutan ?? 100) - (b.urutan ?? 100))
      || String(a.kode).localeCompare(String(b.kode)));
  profil.forEach((d, i) => {
    const r = 14 + i;
    const rw = d.riwayat_pendidikan || [];
    const pend = (kelompok, ada, ket) => teksPendidikan(rw, kelompok) ||
      (ada ? `[isi: prodi ${ket} dan bidang ilmu]` : '');
    const srt = (d.sertifikat || []);
    set('4a', `B${r}`, d.nama); set('4a', `C${r}`, d.nidn);
    set('4a', `D${r}`, KATEGORI_LKPS[d.kategori || 'tetap']);
    set('4a', `E${r}`, pend('sarjana', !rw.length, 'S1'));
    set('4a', `F${r}`, pend('magister', !rw.length && ['S2', 'S3'].includes(d.pendidikan), 'S2'));
    set('4a', `G${r}`, pend('doktor', !rw.length && d.pendidikan === 'S3', 'S3'));
    set('4a', `H${r}`, d.bidang_keahlian); set('4a', `I${r}`, d.perusahaan);
    if (d.sesuai_kompetensi_inti === true) set('4a', `J${r}`, 'V');
    set('4a', `K${r}`, JABATAN[d.jabatan]);
    set('4a', `L${r}`, d.nomor_serdos);
    set('4a', `M${r}`, srt.map(s => s.bidang).filter(Boolean).join('; '));
    set('4a', `N${r}`, srt.map(s => s.lembaga).filter(Boolean).join('; '));
    set('4a', `O${r}`, d.skip); set('4a', `P${r}`, d.stri);
    set('4a', `Q${r}`, mk.filter(m => (m.pengampu || []).includes(d.nidn)).map(m => m.nama).join('; '));
    if (d.sesuai_keahlian_mk === true) set('4a', `R${r}`, 'V');
    set('4a', `S${r}`, d.mk_ps_lain);
  });

  // 3.a.1 / 3.a.4 / 3.a.5 dari mata kuliah aktif (supabase/23-patch-kurikulum.sql),
  // urut semester. Belum dipecah -> total sks di kolom kuliah.
  const UNIT = { universitas: 'Universitas', fakultas: 'Fakultas', prodi: 'Prodi' };
  mk.forEach((m, i) => {
    const r = 10 + i, pecah = [m.sks_kuliah, m.sks_seminar, m.sks_praktikum].some(v => v != null);
    set('3a1', `B${r}`, m.semester); set('3a1', `C${r}`, m.kode); set('3a1', `D${r}`, m.nama);
    if (m.inti === true) set('3a1', `E${r}`, 'V');
    set('3a1', `F${r}`, pecah ? m.sks_kuliah : m.sks);
    if (pecah) { set('3a1', `G${r}`, m.sks_seminar); set('3a1', `H${r}`, m.sks_praktikum); }
    if (m.rps_ada != null) set('3a1', `J${r}`, m.rps_ada ? 'Ada' : 'Tidak Ada');
    set('3a1', `K${r}`, UNIT[m.unit_penyelenggara]);
  });
  mk.filter(m => m.basic_science).forEach((m, i) => {
    set('3a4', `B${10 + i}`, m.nama); set('3a4', `C${10 + i}`, m.semester); set('3a4', `D${10 + i}`, m.sks);
  });
  const perKode = new Map((X.mk || []).map(m => [m.kode, m]));
  let r35 = 10;
  mk.filter(m => m.capstone).forEach(c => {
    const pendukung = (c.capstone_pendukung || []).map(k => perKode.get(k) || { nama: k });
    (pendukung.length ? pendukung : [null]).forEach(p => {
      if (p) { set('3a5', `B${r35}`, p.nama); set('3a5', `C${r35}`, p.sks); }
      set('3a5', `D${r35}`, c.nama); set('3a5', `E${r35}`, c.sks);
      set('3a5', `F${r35}`, c.semester); set('3a5', `G${r35}`, c.capstone_cakupan);
      r35++;
    });
  });

  // 4.c beban kerja dosen tetap yang ditugaskan di PS pada TS (jumlah kedua
  // semester); tanda V hanya DTPS. Dosen lain tampil bila BKD-nya diisi admin.
  // Memakai SKS BKD; SKS Lebih tidak masuk (pemilik 2026-11-06).
  const bkd = (X.bkd || []).filter(b => b.tahun_akademik === `${ts - 1}/${ts}`);
  const dosenLain = (X.dosen || []).filter(d => !dtps.includes(d) && d.peran !== 'asesor' && bkd.some(b => b.nidn === d.nidn));
  [...dtps, ...dosenLain].forEach((d, i) => {
    const rows = bkd.filter(b => b.nidn === d.nidn);
    if (!rows.length) return;
    const s = k => rows.reduce((a, b) => a + (+b[k] || 0), 0);
    const r = 11 + i;
    set('4c', `B${r}`, d.nama); if (dtps.includes(d)) set('4c', `C${r}`, 'V');
    set('4c', `D${r}`, s('sks_pendidikan')); set('4c', `G${r}`, s('sks_penelitian'));
    if (s('sks_ps_lain_dalam')) set('4c', `E${r}`, s('sks_ps_lain_dalam'));
    if (s('sks_ps_lain_luar')) set('4c', `F${r}`, s('sks_ps_lain_luar'));
    set('4c', `H${r}`, s('sks_pkm')); set('4c', `I${r}`, s('sks_penunjang'));
  });

  const karya = (X.karya || []).filter(k => k.status === 'terverifikasi' && dalam(tsKarya(k)));
  const ketua = k => {
    const p = k.karya_penulis || [];
    const u = p.find(x => x.peran === 'ketua' || x.peran === 'penulis_pertama') || p[0];
    return u && u.dosen ? u.dosen.nama : '';
  };

  // 2.a kerja sama (supabase/24-patch-kerjasama-induk.sql):
  //  - karya penelitian/PkM yang menunjuk kerja sama induk -> tabel menurut
  //    kategorinya, dengan mitra/tingkat/tanggal/manfaat/bukti induknya;
  //    mitra karya yang sama dengan mitra induk tidak diulang;
  //  - induk aktif (selesai >= TS-2 atau tanpa akhir) tanpa karya terkait
  //    di jendela TS -> barisnya sendiri;
  //  - mitra pada karya: aturan payung di kerjasama-karya.js (pemilik
  //    2026-11-10), sama dengan skor butir 6 di bangun.py.
  // Durasi (J) dan status (K) adalah rumus templat dari tanggal H dan I.
  const kerjaSama = { pendidikan: [], penelitian: [], pkm: [] };
  const semuaKS = new Map((X.kerjasama || []).filter(k => k.id != null).map(k => [k.id, k]));
  const barisKarya = barisKerjaSama((X.karya || []).filter(k => k.status === 'terverifikasi'), semuaKS)
    .filter(b => dalam(b.ts));
  const dipakai = new Set(barisKarya.filter(b => b.dariInduk).map(b => b.karya.kerjasama_id));
  (X.kerjasama || []).filter(k => !k.tahun_selesai || +k.tahun_selesai >= ts - 2)
    .filter(k => !dipakai.has(k.id))
    .forEach(k => kerjaSama[k.jenis]?.push({ mitra: k.mitra, tingkat: k.tingkat, judul: k.kegiatan, ks: k }));
  barisKarya.forEach(b => kerjaSama[b.kategori].push(b));
  [['2a1', 'pendidikan', 13], ['2a2', 'penelitian', 12], ['2a3', 'pkm', 12]].forEach(([l, j, r0]) =>
    kerjaSama[j].forEach((k, i) => {
      const r = r0 + i;
      set(l, `B${r}`, k.mitra); set(l, `F${r}`, k.judul);
      const t = tingkatKe(k.tingkat);
      if (t >= 0) set(l, `${'EDC'[t]}${r}`, 'V');          // C internasional, D nasional, E lokal
      if (!k.ks) return;
      set(l, `G${r}`, k.ks.manfaat);
      set(l, `H${r}`, serialISO(k.ks.tanggal_mulai)); set(l, `I${r}`, serialISO(k.ks.tanggal_selesai));
      set(l, `L${r}`, BUKTI_KS[k.ks.jenis_bukti]);
    }));

  // 3.a.3 integrasi penelitian/PkM dalam pembelajaran
  const perId = new Map((X.karya || []).map(k => [k.id, k]));
  karya.filter(k => k.kategori === 'integrasi').sort(urut).forEach((k, i) => {
    const r = 13 + i;
    set('3a3', `B${r}`, ketua(k)); set('3a3', `C${r}`, k.judul); set('3a3', `D${r}`, k.mata_kuliah);
    set('3a3', `E${r}`, INTEGRASI[k.sub_jenis]);
    set('3a3', `${'FGH'[tsKarya(k) - (ts - 2)]}${r}`, 'V');
    // Kesesuaian peta jalan dari tema penelitian/PkM induknya (patch 25).
    if (perId.get(k.induk_id)?.tema_id) set('3a3', `I${r}`, 'Sesuai');
    set('3a3', `J${r}`, BUKTI_INTEGRASI[k.bukti_integrasi]);
    if (k.sesuai_rps === true) set('3a3', `K${r}`, 'V');
  });

  // 4.f luaran DTPS per jenis
  const luaran = karya.filter(k => k.kategori === 'luaran').sort(urut);
  const isiLuaran = (l, r0, jenis, kolomNo) => luaran.filter(k => jenis.includes(k.sub_jenis)).forEach((k, i) => {
    const r = r0 + i;
    set(l, `B${r}`, k.judul); set(l, `C${r}`, serialTanggal(k.tahun, k.bulan));
    set(l, `${kolomNo}${r}`, k.nama_terbitan);
  });
  isiLuaran('4f-1', 7, ['paten', 'paten_sederhana'], 'D');
  isiLuaran('4f-2', 7, ['hak_cipta', 'desain_industri', 'merek'], 'D');
  // 4.f.3: NTTG hanya menghitung baris dengan B, C, D (TKT) dan E (nomor sertifikat TKT).
  luaran.filter(k => ['ttg', 'produk'].includes(k.sub_jenis)).forEach((k, i) => {
    const r = 16 + i;
    set('4f-3', `B${r}`, k.judul); set('4f-3', `C${r}`, serialTanggal(k.tahun, k.bulan));
    if (k.tkt) set('4f-3', `D${r}`, `TKT ${k.tkt}`);
    set('4f-3', `E${r}`, k.nomor_tkt);
  });
  isiLuaran('4f-4', 7, ['buku_isbn', 'book_chapter'], 'D');

  // 4.j rekognisi DTPS
  karya.filter(k => k.kategori === 'rekognisi').sort(urut).forEach((k, i) => {
    const r = 12 + i;
    set('4j', `B${r}`, ketua(k)); set('4j', `D${r}`, REKOGNISI[k.sub_jenis]);
    set('4j', `C${r}`, (X.dosen || []).find(d => d.nama === ketua(k))?.bidang_keahlian);
    // Bukti Pendukung: teks bebas, jadi tautan bukti ikut ditulis.
    const u = (X.buktiKarya || []).find(b => b.karya_id === k.id)?.url;
    set('4j', `E${r}`, u ? `${k.judul} (${u})` : k.judul);
    const t = tingkatKe(k.tingkat);
    if (t >= 0) set('4j', `${'FGH'[t]}${r}`, 'V');         // F wilayah, G nasional, H internasional
    set('4j', `I${r}`, +k.tahun);
  });

  // 6.c prestasi mahasiswa (5 TS, sama dengan butir 43)
  const tsBaris = p => (+p.bulan >= 9 ? +p.tahun + 1 : +p.tahun);
  const pres = (X.prestasi || []).filter(p => dalam(tsBaris(p), 5)).sort(urut);
  [['6c1', 'akademik', 10], ['6c2', 'non_akademik', 11]].forEach(([l, b, r0]) =>
    pres.filter(p => (p.bidang || '').startsWith(b === 'akademik' ? 'akademik' : 'non')).forEach((p, i) => {
      const r = r0 + i;
      set(l, `B${r}`, p.nama_kegiatan); set(l, `C${r}`, serialTanggal(p.tahun, p.bulan));
      const t = tingkatKe(p.tingkat);
      if (t >= 0) set(l, `${'DEF'[t]}${r}`, 'V');          // D lokal, E nasional, F internasional
      set(l, `G${r}`, p.capaian);
    }));

  // 6.d masa studi, bagian Sarjana: baris TS-k = 41 - k, tahun masuk TS-1-k
  const kohort = (C.D && C.D.akreditasi && C.D.akreditasi.kohort) || [];
  for (let kk = 0; kk <= 7; kk++){
    const k = kohort.find(x => x.tahun_masuk === ts - 1 - kk);
    if (!k) continue;
    const r = 41 - kk;
    set('6d', `B${r}`, k.masuk);
    // Kolom masa studi berbentuk tangga (rentang isian templat: B34:F35, B36:E36,
    // B37:D37, B38:C38, B39:B41): angkatan muda belum bisa lulus di kolom panjang.
    ['lulus_3_5_sd_4_5', 'lulus_4_5_sd_5_5', 'lulus_5_5_sd_6_5', 'lulus_6_5_sd_8']
      .slice(0, Math.max(0, Math.min(4, kk - 2)))
      .forEach((p, j) => set('6d', `${'CDEF'[j]}${r}`, +k[p] || 0));
  }

  // 6.e.3 luaran mahasiswa (judul dan tanggal; nomor/status diisi prodi)
  const lm = (X.luaranMhs || []).filter(x => dalam(tsBaris(x))).sort(urut);
  // Kolom status/nomor/TKT dari 26-patch-mahasiswa-lulusan.sql; rumus jumlah
  // 6.e.3 hanya menghitung baris bertanggal dan bernomor.
  const STATUS_HKI = { registered: 'Registered', granted: 'Granted', komersial: 'Komersial' };
  const isiLm = (l, r0, jenis, isi) => lm.filter(x => jenis.includes(x.jenis)).forEach((x, i) => {
    const r = r0 + i;
    set(l, `B${r}`, x.judul); set(l, `C${r}`, serialTanggal(x.tahun, x.bulan));
    isi(r, x);
  });
  isiLm('6e3-1', 12, ['paten', 'paten_sederhana'], (r, x) => {
    set('6e3-1', `D${r}`, STATUS_HKI[x.status_hki]); set('6e3-1', `E${r}`, x.nomor); });
  isiLm('6e3-2', 8, ['hak_cipta', 'desain_industri', 'merek'], (r, x) => set('6e3-2', `D${r}`, x.nomor));
  isiLm('6e3-3', 18, ['ttg', 'produk'], (r, x) => {
    if (x.tkt) set('6e3-3', `D${r}`, `TKT ${x.tkt}`); set('6e3-3', `E${r}`, x.nomor); });
  isiLm('6e3-4', 8, ['buku_isbn', 'book_chapter'], (r, x) => set('6e3-4', `D${r}`, x.nomor));

  // 7.a dokumen SPMI dari pustaka (versi terbaru tahun <= TS) dan 7.b tautan PPEPP
  // ke dokumen pustaka (30-patch-spmi.sql). Baris templat tetap.
  [['kebijakan_spmi', 5], ['manual_spmi', 6], ['standar_spmi', 7], ['tata_cara_dokumentasi_spmi', 8]].forEach(([j, r]) => {
    const d = versiUntukTS(X.dokumen, j, ts);
    if (!d) return;
    set('7a', `C${r}`, d.nomor || d.judul || d.url);
    set('7a', `D${r}`, serialISO(d.tanggal));
  });
  const urlDok = id => (X.dokumen || []).find(d => d.id === id)?.url;
  const BARIS_PPEPP = { penetapan: 5, pelaksanaan: 6, evaluasi: 7, pengendalian: 8, peningkatan: 9 };
  (X.ppepp || []).forEach(x => {
    const r = BARIS_PPEPP[x.tahap];
    if (!r) return;
    set('7b', `C${r}`, urlDok(x.dokumen_id)); set('7b', `D${r}`, urlDok(x.audit_dokumen_id));
    set('7b', `E${r}`, urlDok(x.rtm_dokumen_id)); set('7b', `F${r}`, urlDok(x.peningkatan_dokumen_id));
  });

  // 5.a / 5.b / 5.c sarana, prasarana, K3L (28-patch-sarana-k3l.sql); tanda V di kolom
  // kepemilikan (G Sendiri, H Sewa) dan kondisi (5a I/J, 5c E/F).
  const urutLain = k => (a, b) => ((a.urutan ?? 100) - (b.urutan ?? 100)) || String(a[k]).localeCompare(String(b[k]));
  (X.prasarana || []).slice().sort((a, b) => urutLain('prasarana')(a, b) || String(a.alat).localeCompare(String(b.alat)))
    .forEach((x, i) => {
      const r = 10 + i;
      set('5a', `B${r}`, x.prasarana); set('5a', `C${r}`, x.jumlah_prasarana); set('5a', `D${r}`, x.alat);
      set('5a', `E${r}`, x.jumlah_standar); set('5a', `F${r}`, x.jumlah_dimiliki);
      if (x.kepemilikan) set('5a', `${x.kepemilikan === 'sewa' ? 'H' : 'G'}${r}`, 'V');
      if (x.kondisi) set('5a', `${x.kondisi === 'tidak_terawat' ? 'J' : 'I'}${r}`, 'V');
    });
  (X.dokK3l || []).slice().sort(urutLain('jenis_dokumen')).forEach((x, i) => {
    const r = 17 + i;
    set('5b', `B${r}`, x.jenis_dokumen); set('5b', `C${r}`, x.jumlah); set('5b', `D${r}`, x.riwayat_pengesahan);
  });
  (X.fasK3l || []).slice().sort(urutLain('nama_sarana')).forEach((x, i) => {
    const r = 17 + i;
    set('5c', `B${r}`, x.nama_sarana); set('5c', `C${r}`, x.fungsi); set('5c', `D${r}`, x.jumlah_unit);
    if (x.kondisi) set('5c', `${x.kondisi === 'tidak_terawat' ? 'F' : 'E'}${r}`, 'V');
  });

  // PS / Tabel 1 / 2.b / 4.b / 6.a baris prodi lain (27-patch-institusi-upps.sql).
  const prodi = daftarProdi(X, C.prodi, ts);
  prodi.forEach((x, i) => {
    const r = 17 + i;
    set('PS', `B${r}`, x.jenis_program); set('PS', `C${r}`, x.nama_prodi);
    set('PS', `D${r}`, STATUS_PS[x.status_akreditasi]);
    set('PS', `E${r}`, [x.nomor_sk, tglTeks(x.tanggal_sk)].filter(Boolean).join(', '));
    set('PS', `F${r}`, serialISO(x.tanggal_kedaluwarsa));
    set('PS', `G${r}`, x.mahasiswa);
  });
  prodi.filter(x => !x.diakreditasi).forEach((x, i) => {
    const r = 8 + i;                                   // baris 7 = prodi yang diakreditasi
    set('6a', `B${r}`, x.nama_prodi);
    set('6a', `D${r}`, x.mahasiswa_ts2); set('6a', `E${r}`, x.mahasiswa_ts1); set('6a', `F${r}`, x.mahasiswa_ts);
  });

  const BARIS_VMTS = { pt: 7, upps: 9, ps: 11 };
  (X.vmts || []).forEach(v => {
    const r = BARIS_VMTS[v.jenis];
    if (!r) return;
    set('1', `C${r}`, [['Visi', v.visi], ['Misi', v.misi], ['Tujuan', v.tujuan], ['Strategi', v.strategi]]
      .filter(([, s]) => s).map(([l, s]) => `${l}: ${String(s).trim()}`).join('; '));
    set('1', `D${r}`, v.nomor_sk);
    const bk = (X.buktiVmts || []).find(b => b.baris_id === v.id);
    set('1', `E${r}`, v.tautan || bk?.url || bk?.dokumen?.url);   // tautan luar atau dokumen pustaka
  });

  const BARIS_DANA = { biaya_dosen: 7, biaya_tendik: 8, operasional_pembelajaran: 9, operasional_tidak_langsung: 10,
    operasional_luar_pt: 11, investasi: 12, kemahasiswaan: 13, penelitian: 15, pkm: 16 };
  (X.dana || []).forEach(d => {
    const r = BARIS_DANA[d.jenis], j = +String(d.tahun_akademik || '').slice(5) - (ts - 2);
    if (!r || j < 0 || j > 2) return;
    set('2b', `${'CDE'[j]}${r}`, d.dana_upps); set('2b', `${'GHI'[j]}${r}`, d.dana_ps);
  });

  const KOLOM_PEND = { s3: 'C', s2: 'D', s1: 'E', d4: 'F', d3: 'G', d2: 'H', d1: 'I', sma_smk: 'J' };
  const UNIT_TENDIK = { upps: 'UPPS', prodi: 'Program Studi', institusi: 'Institusi' };
  (X.tendik || []).filter(x => x.aktif !== false)
    .sort((a, b) => String(a.nama).localeCompare(String(b.nama))).slice(0, 20)   // templat: baris 11-30
    .forEach((x, i) => {
      const r = 11 + i;
      set('4b', `B${r}`, x.nama);
      if (KOLOM_PEND[x.pendidikan]) set('4b', `${KOLOM_PEND[x.pendidikan]}${r}`, 'V');
      set('4b', `K${r}`, x.sertifikat); set('4b', `L${r}`, UNIT_TENDIK[x.unit_kerja]);
    });

  // 6.a / 6.b / 6.f.1 (Sarjana) / 6.f.2: kolom baru dari Data prodi (patch 26);
  // kolom lama diisi petaLKPS dari data.json.
  const tsDari = ta => +String(ta || '').slice(5);
  [ts - 2, ts - 1, ts].forEach((t, i) => {
    const m = (X.mhs || []).find(x => tsDari(x.tahun_akademik) === t);
    if (!m) return;
    // Langsung dari Data prodi (lebih baru dari data.json bila situs belum dibangun ulang).
    set('6a', `${'DEF'[i]}7`, m.jumlah_mahasiswa_aktif);
    if (m.jumlah_mahasiswa_asing_penuh != null) set('6a', `${'GHI'[i]}7`, m.jumlah_mahasiswa_asing_penuh);
    set('6a', `${'JKL'[i]}7`, m.jumlah_mahasiswa_asing_paruh);
    if (m.jumlah_lulusan) {
      set('6b', `C${6 + i}`, m.jumlah_lulusan); set('6b', `E${6 + i}`, m.rerata_ipk_lulusan);
      set('6b', `D${6 + i}`, m.ipk_min); set('6b', `F${6 + i}`, m.ipk_maks);
    }
  });
  [ts - 2, ts - 1].forEach((t, i) => {
    const r = (X.tracer || []).find(x => +x.tahun_lulus === t);
    if (!r) return;
    set('6f1', `D${31 + i}`, r.wt_kurang_3); set('6f1', `E${31 + i}`, r.wt_3_18); set('6f1', `F${31 + i}`, r.wt_lebih_18);
    set('6f2', `D${7 + i}`, r.kesesuaian_rendah); set('6f2', `E${7 + i}`, r.kesesuaian_sedang);
    set('6f2', `F${7 + i}`, r.kesesuaian_tinggi);
    set('6g1', `C${7 + i}`, r.pengguna_tanggapan);
  });

  // 6.h.1 / 6.i penelitian / PkM DTPS yang melibatkan mahasiswa
  const namaTema = new Map((X.tema || []).map(t => [t.id, t.nama]));
  [['6h1', 'penelitian', 11, null], ['6i', 'pkm', 6, 'E']].forEach(([l, kat, r0, kolJudul]) =>
    karya.filter(k => k.kategori === kat && (k.karya_mahasiswa || []).length).sort(urut).forEach((k, i) => {
      const r = r0 + i;
      set(l, `B${r}`, ketua(k));
      set(l, `C${r}`, namaTema.get(k.tema_id));                  // tema sesuai peta jalan
      if (kolJudul) set(l, `${kolJudul}${r}`, k.judul);
      else set(l, `E${r}`, KETERLIBATAN[k.keterlibatan_mhs]);   // 6.h.1 kolom 5 = bentuk kegiatan
      set(l, `D${r}`, k.karya_mahasiswa.map(m => m.nama).filter(Boolean).join(', '));
      set(l, `F${r}`, +k.tahun);
    }));

  // 4.i karya ilmiah DTPS yang disitasi (Panduan LKPS IAPS_AVP_2025 hlm. 16): artikel
  // jurnal bereputasi / prosiding internasional terindeks (Scopus/WoS di form karya),
  // relevan dengan bidang prodi (tidak ditandai di luar visi), dengan sitasi yang
  // DITERIMA dalam 3 tahun terakhir > 0; tahun terbit bebas (pemilik 2026-11-04).
  // Nama DTPS = penulis prodi utama, harus ada di 4.a.
  const namaDTPS = new Set(profil.map(d => d.nama));
  const penulisDTPS = k => {
    const p = (k.karya_penulis || []).filter(x => x.dosen && namaDTPS.has(x.dosen.nama));
    const u = p.find(x => x.peran === 'penulis_pertama' || x.peran === 'ketua') || p.find(x => x.korespondensi) || p[0];
    return u ? u.dosen.nama : '';
  };
  // Sitasi untuk TS ini dari sitasi per tahun (sitasi.js, pemilik 2026-11-10).
  karya4i((X.karya || []).filter(k => k.status === 'terverifikasi'), ts)
    .forEach(({ k, n }, i) => {
      const r = 6 + i;
      set('4i', `B${r}`, penulisDTPS(k));
      set('4i', `C${r}`, [k.judul, k.nama_terbitan, k.tahun].filter(Boolean).join(', ') + (k.doi ? `. DOI: ${k.doi}` : ''));
      set('4i', `D${r}`, n);
    });

  // 4.h kinerja DTPS: jurnal/prosiding internasional terindeks Scopus/WoS dan paten,
  // per DTPS per TS, terpisah sebagai Penulis Pertama atau Korespondensi (kolom 6).
  const unggul = k => (k.kategori === 'publikasi' && ['jurnal', 'prosiding'].includes(k.jenis)
      && /^(scopus|wos)/.test(k.indeksasi || '')) || (k.kategori === 'luaran' && k.sub_jenis === 'paten');
  const hitung4h = new Map();
  karya.filter(unggul).forEach(k => (k.karya_penulis || []).forEach(p => {
    if (!p.dosen || !dtps.some(d => d.nama === p.dosen.nama)) return;
    const ket = ['penulis_pertama', 'ketua'].includes(p.peran) ? 'Penulis Pertama' : p.korespondensi ? 'Korespondensi' : null;
    if (!ket) return;
    const kunci = `${p.dosen.nama}|${ket}`;
    if (!hitung4h.has(kunci)) hitung4h.set(kunci, [0, 0, 0]);
    hitung4h.get(kunci)[tsKarya(k) - (ts - 2)]++;
  }));
  [...hitung4h.entries()].sort(([a], [b]) => a.localeCompare(b)).forEach(([kunci, n], i) => {
    const [nama, ket] = kunci.split('|'), r = 16 + i;
    set('4h', `B${r}`, nama); set('4h', `F${r}`, ket);
    n.forEach((x, j) => set('4h', `${'CDE'[j]}${r}`, x));
  });
  return out;
}

/* ---------------------------------------------------------------------
   Penulis sel pada XML worksheet (string, tanpa DOM; diuji di Node).
   --------------------------------------------------------------------- */
const escXml = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function indeksKolom(ref){
  const huruf = /^[A-Z]+/.exec(ref)[0];
  return [...huruf].reduce((n, h) => n * 26 + h.charCodeAt(0) - 64, 0);
}

function selBaru(ref, s, v){
  const gaya = s ? ` s="${s}"` : '';
  if (typeof v === 'number') return `<c r="${ref}"${gaya}><v>${v}</v></c>`;
  if (v && typeof v === 'object' && 'tanggal' in v) return `<c r="${ref}"${gaya}><v>${v.tanggal}</v></c>`;
  return `<c r="${ref}"${gaya} t="inlineStr"><is><t xml:space="preserve">${escXml(v)}</t></is></c>`;
}

export function tulisSel(xml, ref, v){
  const baris = +/\d+$/.exec(ref)[0];
  const reBaris = new RegExp(`<row r="${baris}"(?=[\\s>/])[^>]*?(?:/>|>[\\s\\S]*?</row>)`);
  const m = reBaris.exec(xml);
  if (!m){
    // baris belum ada: sisipkan menurut urutan nomor baris
    const baru = `<row r="${baris}">${selBaru(ref, null, v)}</row>`;
    const reSemua = /<row r="(\d+)"/g;
    let x, pos = -1;
    while ((x = reSemua.exec(xml))) if (+x[1] > baris){ pos = x.index; break; }
    if (pos < 0) pos = xml.indexOf('</sheetData>');
    if (pos < 0) throw new Error('sheetData tidak ditemukan');
    return xml.slice(0, pos) + baru + xml.slice(pos);
  }
  let row = m[0];
  if (row.endsWith('/>')) row = row.slice(0, -2) + '></row>';
  const reSel = new RegExp(`<c r="${ref}"(?=[\\s>/])[^>]*?(?:/>|>[\\s\\S]*?</c>)`);
  const c = reSel.exec(row);
  let rowBaru;
  if (c){
    if (/<f[\s>]/.test(c[0])) throw new Error(`${ref} berisi rumus; tidak ditimpa`);
    const s = (/\ss="(\d+)"/.exec(c[0]) || [])[1];
    rowBaru = row.slice(0, c.index) + selBaru(ref, s, v) + row.slice(c.index + c[0].length);
  } else {
    // sel belum ada: sisipkan menurut urutan kolom
    const k = indeksKolom(ref);
    const reSemua = /<c r="([A-Z]+)\d+"/g;
    let x, pos = -1;
    while ((x = reSemua.exec(row))) if (indeksKolom(x[1]) > k){ pos = x.index; break; }
    if (pos < 0) pos = row.lastIndexOf('</row>');
    rowBaru = row.slice(0, pos) + selBaru(ref, null, v) + row.slice(pos);
  }
  return xml.slice(0, m.index) + rowBaru + xml.slice(m.index + m[0].length);
}

// Excel menghitung ulang semua rumus saat berkas dibuka.
export function hitungUlangSaatBuka(workbookXml){
  if (/<calcPr\b/.test(workbookXml))
    return workbookXml.replace(/<calcPr\b([^>]*?)(\/?)>/, (m, a, tutup) =>
      `<calcPr${a.replace(/\sfullCalcOnLoad="[^"]*"/, '')} fullCalcOnLoad="1"${tutup}>`);
  return workbookXml.replace('</workbook>', '<calcPr fullCalcOnLoad="1"/></workbook>');
}

// nama lembar -> path XML di dalam zip
export function petaLembar(workbookXml, relsXml){
  const rels = {};
  for (const m of relsXml.matchAll(/<Relationship\b[^>]*>/g)){
    const id = /\bId="([^"]+)"/.exec(m[0])?.[1], t = /\bTarget="([^"]+)"/.exec(m[0])?.[1];
    if (id && t) rels[id] = t.startsWith('/') ? t.slice(1) : 'xl/' + t.replace(/^\.\//, '');
  }
  const out = {};
  for (const m of workbookXml.matchAll(/<sheet\b[^>]*>/g)){
    const nama = /\bname="([^"]+)"/.exec(m[0])?.[1];
    const rid = /\br:id="([^"]+)"/.exec(m[0])?.[1];
    if (nama && rels[rid]) out[nama.replace(/&amp;/g, '&')] = rels[rid];
  }
  return out;
}

/* ---------------------------------------------------------------------
   Susun berkas: templat -> isi -> unduh.
   --------------------------------------------------------------------- */
export async function buatLKPS(C, opsi = {}){
  const { default: JSZip } = await import(JSZIP);
  const r = await fetch(TEMPLATE, { cache: 'no-cache' });
  if (!r.ok) throw new Error(`templat ${TEMPLATE} tidak terbaca (${r.status})`);
  const zip = await JSZip.loadAsync(await r.arrayBuffer());
  const wb = await zip.file('xl/workbook.xml').async('string');
  const lembar = petaLembar(wb, await zip.file('xl/_rels/workbook.xml.rels').async('string'));
  const peta = petaLKPS(C);
  let n = 0;
  for (const [nama, sel] of Object.entries(peta)){
    const path = lembar[nama];
    if (!path) throw new Error(`lembar ${nama} tidak ada di templat`);
    let xml = await zip.file(path).async('string');
    for (const [ref, v] of Object.entries(sel)){ xml = tulisSel(xml, ref, v); n++; }
    zip.file(path, xml);
  }
  zip.file('xl/workbook.xml', hitungUlangSaatBuka(wb));
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const nama = `LKPS-${(C.prodi || 'prodi').replace(/[^\w-]+/g, '_')}-TS${C.ts}.xlsx`;
  if (opsi.unduh !== false){
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = nama;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 10000);
  }
  return { nama, sel: n, lembar: Object.keys(peta), blob };
}
