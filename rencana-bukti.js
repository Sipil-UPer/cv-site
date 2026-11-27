/* =====================================================================
   RENCANA BUKTI PER BUTIR — tampilan umum; isi per instrumen
   ---------------------------------------------------------------------
   Isi per butir (RENCANA_BUKTI: yang dinilai untuk skor tertinggi, bukti
   sahih yang disiapkan, tabel LKPS terkait, kerangka narasi LED, unit
   sumber) ada di site/instrumen/<id>/rencana-bukti-isi.js (2026-11-25;
   LAM Teknik dipindah verbatim, LAMDEPILAR dari Buku 2 dan Buku 6).
   Ditampilkan sebagai daftar periksa di input-butir.html dan kartu
   skor.html (permintaan pemilik 2026-11-03). Pustaka dokumen (JENIS_DOKUMEN)
   dan indeks tabel LKPS (LKPS_TABEL) di bawah masih milik LAM Teknik.
   ===================================================================== */

import { pihakBukti, UNSUR_BUTIR } from './unsur-butir.js?v=2026-11-27-e02e4a';
import { SKOR_MAKS } from './bobot.js?v=2026-11-27-e02e4a';

// Isi per butir dari instrumen terpilih (tools/pilih_instrumen.py mengganti id folder).
import { RENCANA_BUKTI } from './instrumen/lam-teknik-s1/rencana-bukti-isi.js?v=2026-11-27-e02e4a';
export { RENCANA_BUKTI };

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
// karya dosen (karya.html) supaya terhitung di skor.
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
  // Halaman publik layanan-mahasiswa.html (76-patch-berkas-mahasiswa.sql, pemilik 2026-11-16).
  { id: 'pengumuman', nama: 'Pengumuman untuk mahasiswa (jadwal sidang TA, dll.)', tunggal: false, butir: [],
    contoh: 'Jadwal Sidang Tugas Akhir Semester Ganjil 2026/2027' },
  { id: 'lainnya', nama: 'Dokumen lain', tunggal: false, butir: [], contoh: 'Judul dokumen' },
];
// Tanpa tautan publik (pemilik 2026-11-06): data pribadi atau internal. Sama
// dengan JENIS_PRIVAT di apps-script/Code.gs.
['rekap_bkd', 'laporan_keuangan', 'laporan_audit_keuangan', 'dokumen_kerjasama', 'laporan_ami', 'laporan_rtm', 'notulen',
 'berkas_pribadi', 'data_mahasiswa', 'data_survei_mentah', 'daftar_hadir', 'kontrak_hibah']
  .forEach(id => { JENIS_DOKUMEN.find(j => j.id === id).privat = true; });
// Bukti baris Data prodi yang privat.
export const TABEL_PRIVAT = ['lkps_mahasiswa_ta', 'lkps_kohort_lulusan', 'lkps_tendik', 'lkps_penggunaan_dana', 'lkps_kerjasama',
  'jadwal_ta'];   // 94: berita acara seminar/sidang (nama, nilai)
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
  // 163 (pemilik 2026-11-24): berkas klaim insentif publikasi; artikel PDF = 'naskah' di atas.
  ['indeksasi', 'Bukti indeksasi (Scopus/SINTA/WoS)'],
  ['loa', 'LoA / bukti terbit'],
  ['pernyataan', 'Surat pernyataan'],
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
    <summary>Bukti yang disiapkan untuk skor ${SKOR_MAKS} (${xs.length} tertaut, ${r.bukti.length} dianjurkan)</summary>
    <p><b>Yang dinilai:</b> ${esc(r.skor4).replace(/\n/g, '<br>')}</p>
    ${daftarDok}<p><b>Bukti yang dianjurkan:</b></p>
    <ul>${r.bukti.map((b, i) => `<li>${esc(b)}${pihakBukti(no, i) ? ` <span class="rb-ket">· ${esc(pihakBukti(no, i))}</span>` : ''}</li>`).join('')}</ul>
    ${UNSUR_BUTIR[String(no)] ? '<p class="rb-ket">Penanggung jawab tiap unsur ada di tabel unsur kartu ini.</p>' : ''}
    <p class="rb-ket">${r.lkps ? `Tabel LKPS: ${esc(r.lkps)} · ` : ''}Bagian LED: ${esc(r.bagian)}${
      r.unit ? ` · Sumber: ${esc(r.unit)}` : ''}${r.narasi ? `<br>Narasi: ${esc(r.narasi)}` : ''}${
      r.catatan ? `<br>Catatan: ${esc(r.catatan)}` : ''}</p>
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
