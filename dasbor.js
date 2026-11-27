// Dasbor operasional koordinator prodi (pemilik 2026-11-17, tahap 3 koordinator): per bidang, siapa penanggung jawabnya
// (koordinator aktif) dan antrean/keterlambatan, dengan tautan ke halaman kerjanya. Dipakai dasbor.html.
import { statusTindak, petaRps } from './tinjauan-rps.js?v=2026-11-27-ce288b';
import { aktifPada, labelJabatan } from './koordinator.js?v=2026-11-27-ce288b';

export const HARI_ANTRE = 7;     // pengajuan yang menunggu lebih dari ini = terlambat
export const HARI_SK = 30;       // penugasan berakhir dalam sekian hari = perlu diperpanjang
const tgl = d => d.toISOString().slice(0, 10);
const umur = (iso, kini) => Math.floor((+kini - Date.parse(iso)) / 864e5);
const tambahHari = (kini, n) => tgl(new Date(+kini + n * 864e5));

// Penanggung jawab per jabatan: nama aktif, dan peringatan (kosong, tanpa SK, segera berakhir).
export function penanggungJawab(koordinator, jabatan, kini = new Date()){
  const xs = aktifPada((koordinator || []).filter(k => k.jabatan === jabatan), kini);
  const peringatan = [];
  if (!xs.length) peringatan.push(`${labelJabatan(jabatan)} belum ditetapkan`);
  for (const k of xs) {
    if (!k.nomor_sk && !k.dokumen_id) peringatan.push(`SK ${k.dosen?.nama || ''} belum dicatat`.replace('  ', ' '));
    if (k.selesai && k.selesai <= tambahHari(kini, HARI_SK)) peringatan.push(`penugasan ${k.dosen?.nama || ''} berakhir ${k.selesai}`);
  }
  return { nama: xs.map(k => k.dosen?.nama).filter(Boolean), peringatan };
}

// d = { koordinator, pengajuan, jadwal, temuan, tindak, karya, kabar, perluTL, tanpaBaris, tindakEval } (baris yang terbaca admin).
// perluTL/tanpaBaris: evaluasi_perlu_tl() dan cpl_belum_tanpa_evaluasi() (101); tindakEval: evaluasi_tindak {status, tenggat}.
// Hasil: [{ bidang, jabatan, pj, item: [{ label, n, lewat, href }] }]; lewat > 0 = perlu perhatian.
export function ringkasDasbor(d, kini = new Date()){
  const hari = tgl(kini);
  const P = d.pengajuan || [];
  const antre = (f, href) => {
    const xs = P.filter(f);
    return { n: xs.length, lewat: xs.filter(p => umur(p.diperbarui || p.dibuat, kini) > HARI_ANTRE).length, href };
  };
  const tunggu = (jenis, status) => p => p.jenis === jenis && p.status === status;
  const J = d.jadwal || [];
  const revisi = J.filter(j => j.hasil === 'lulus_revisi' && !j.revisi_selesai && j.status !== 'batal');
  const bidang = [
    { bidang: 'Tugas Akhir', jabatan: 'koordinator_ta', item: [
      // 110: pengajuan pembimbing TA (tahap_ta penetapan_pembimbing) diperiksa koordinator TA.
      { label: 'Pengajuan pembimbing TA menunggu koordinator', ...antre(p => p.jenis === 'ta' && p.tahap_ta === 'penetapan_pembimbing'
          && ['pembimbing', 'admin'].includes(p.status), 'pengajuan-mahasiswa.html') },
      { label: 'Menunggu pembimbing', ...antre(p => tunggu('ta', 'pembimbing')(p) && p.tahap_ta !== 'penetapan_pembimbing', 'pengajuan-mahasiswa.html') },
      { label: 'Menunggu jadwal', ...antre(p => tunggu('ta', 'admin')(p) && p.tahap_ta !== 'penetapan_pembimbing', 'pengajuan-mahasiswa.html') },
      { label: 'Seminar/sidang 14 hari ke depan', n: J.filter(j => j.status === 'terjadwal' && j.tanggal >= hari && j.tanggal <= tambahHari(kini, 14)).length,
        lewat: 0, href: 'rekap-ta.html' },
      { label: 'Revisi belum selesai', n: revisi.length, lewat: revisi.filter(j => j.batas_revisi && j.batas_revisi < hari).length,
        href: 'rekap-ta.html#revisi' }] },
    { bidang: 'Kerja Praktik/Magang', jabatan: 'koordinator_kp', item: [
      { label: 'Pengajuan menunggu koordinator', ...antre(tunggu('kp', 'admin'), 'pengajuan-mahasiswa.html') },
      { label: 'Menunggu pembimbing', ...antre(tunggu('kp', 'pembimbing'), 'pengajuan-mahasiswa.html') },
      { label: 'KP dilaksanakan (pelaporan selesai belum masuk)', n: P.filter(p => p.jenis === 'kp' && p.status === 'disetujui' && (p.tahap || 'pengajuan') === 'pengajuan').length,
        lewat: 0, href: 'pengajuan-mahasiswa.html' }] },
    { bidang: 'Kemahasiswaan', jabatan: 'pembina_kemahasiswaan', item: [
      { label: 'Laporan lomba menunggu', ...antre(p => p.jenis === 'lomba' && ['pembimbing', 'admin'].includes(p.status), 'pengajuan-mahasiswa.html') },
      { label: 'Publikasi/luaran menunggu', ...antre(p => p.jenis === 'luaran' && ['pembimbing', 'admin'].includes(p.status), 'pengajuan-mahasiswa.html') }] },
    { bidang: 'Mutu dan akreditasi', jabatan: 'gkm', item: [
      { label: 'Temuan AMI belum selesai', n: (d.temuan || []).filter(t => !['selesai', 'ditutup'].includes(t.status)).length,
        lewat: (d.temuan || []).filter(t => !['selesai', 'ditutup'].includes(t.status) && t.tenggat && t.tenggat < hari).length, href: 'siklus-ppepp.html' },
      // OBE O1 (pemilik 2026-11-17): evaluasi pembelajaran dipantau GKM.
      { label: 'Evaluasi pembelajaran perlu tindak lanjut (belum ditangani)', n: (d.perluTL || []).length,
        lewat: (d.perluTL || []).length, href: 'evaluasi-pembelajaran.html' },
      { label: 'MK dengan CPL belum tercapai tanpa baris evaluasi', n: (d.tanpaBaris || []).length,
        lewat: 0, href: 'evaluasi-pembelajaran.html' },
      // Tinjauan RPS (115, tahap 2): revisi RPS hasil tinjauan yang belum disahkan ulang.
      { label: 'Tindak lanjut tinjauan RPS (revisi RPS) belum selesai', ...(() => {
        const m = petaRps(d.rpsSemua), xs = (d.tinjauan || []).map(t => statusTindak(t, m).kode);
        return { n: xs.filter(k => k === 'terbuka' || k === 'lewat').length, lewat: xs.filter(k => k === 'lewat').length }; })(), href: 'tinjauan-rps.html' },
      { label: 'Tindak lanjut evaluasi pembelajaran terbuka', n: (d.tindakEval || []).filter(t => t.status !== 'selesai').length,
        lewat: (d.tindakEval || []).filter(t => t.status !== 'selesai' && t.tenggat && t.tenggat < hari).length,
        href: 'evaluasi-pembelajaran.html' }] },
    { bidang: 'Laboratorium', jabatan: 'kepala_lab', item: [] },
    { bidang: 'Administrasi prodi', jabatan: null, item: [
      { label: 'Permohonan surat mahasiswa', ...antre(tunggu('surat', 'admin'), 'pengajuan-mahasiswa.html') },
      // RPS K26 (112, pemilik 2026-11-18): diajukan dosen, menunggu pengesahan Kaprodi.
      { label: 'RPS menunggu pengesahan Kaprodi', n: (d.rps || []).filter(r => r.status === 'diajukan').length, lewat: 0, href: 'rps.html' },
      { label: 'Tinjauan RPS menunggu persetujuan Kaprodi', n: (d.tinjauan || []).filter(t => t.status === 'diajukan').length, lewat: 0, href: 'tinjauan-rps.html' },
      { label: 'Karya dosen menunggu verifikasi', n: (d.karya || []).filter(k => k.status === 'diajukan').length, lewat: 0, href: 'verifikasi.html' },
      { label: 'Kabar kegiatan menunggu terbit', n: (d.kabar || []).filter(k => k.status === 'diajukan').length, lewat: 0, href: 'kabar-kegiatan.html' },
      { label: 'Tindak lanjut rapat terbuka', n: (d.tindak || []).filter(t => ['terbuka', 'proses'].includes(t.status)).length,
        lewat: (d.tindak || []).filter(t => ['terbuka', 'proses'].includes(t.status) && t.tenggat && t.tenggat < hari).length, href: 'rapat.html' }] },
  ];
  return bidang.map(b => ({ ...b, pj: b.jabatan ? penanggungJawab(d.koordinator, b.jabatan, kini) : { nama: [], peringatan: [] } }));
}

// Beban bimbingan per dosen (109-patch-beban-bimbingan.sql, pemilik 2026-11-18): baris beban_bimbingan(ts) ->
// { baris, rata, kelompok }. Ditandai tinggi = di atas max(2, 1,5 x rata-rata), sama dengan rekap KP (rekap-kp.js).
// KP, menguji, dan lomba dibandingkan dengan semua dosen; TA dibandingkan dengan dosen se-KK (pembimbing TA harus
// sebidang atau mendekati, KP tidak harus), dosen tanpa KK dengan semua dosen.
// kk = [{kode, nama}] urutan tampil (data.json situs.kelompok_keahlian).
export const KOLOM_BEBAN = ['kp', 'ta', 'uji', 'lomba'];
const rataDari = xs => (xs.length ? xs.reduce((a, v) => a + v, 0) / xs.length : 0);
const bulat = v => Math.round(v * 10) / 10;
const tinggiDari = (v, rata) => v > Math.max(2, 1.5 * rata);
export function ringkasBeban(rows = [], kk = []){
  const xs = rows.map(r => ({ ...r, kp: +r.kp || 0, kp_selesai: +r.kp_selesai || 0, ta: +r.ta || 0, ta_lulus: +r.ta_lulus || 0,
    uji: +r.uji || 0, lomba: +r.lomba || 0, kp_kuota: r.kp_kuota == null ? null : +r.kp_kuota }));
  const rata = Object.fromEntries(KOLOM_BEBAN.map(k => [k, rataDari(xs.map(r => r[k]))]));
  const urut = new Map(kk.map((x, i) => [x.kode, i])), nama = new Map(kk.map(x => [x.kode, x.nama]));
  const kodeKK = r => (urut.has(r.kk) ? r.kk : '');
  const rataTA = new Map();
  for (const k of new Set(xs.map(kodeKK))) if (k) rataTA.set(k, rataDari(xs.filter(r => kodeKK(r) === k).map(r => r.ta)));
  const baris = xs.map(r => {
    const k = kodeKK(r), pembanding = k ? rataTA.get(k) : rata.ta;
    return { ...r, kk: k, kk_nama: nama.get(k) || '',
      tinggi: { kp: tinggiDari(r.kp, rata.kp), ta: tinggiDari(r.ta, pembanding), uji: tinggiDari(r.uji, rata.uji),
                lomba: tinggiDari(r.lomba, rata.lomba) },
      kuota: r.kp_kuota == null ? '' : r.kp > r.kp_kuota ? 'lebih' : r.kp === r.kp_kuota ? 'penuh' : '' };
  }).sort((a, b) => (a.kk ? urut.get(a.kk) : 1e9) - (b.kk ? urut.get(b.kk) : 1e9) || String(a.nama).localeCompare(String(b.nama), 'id'));
  const kelompok = [...new Set(baris.map(r => r.kk))].map(k => ({ kode: k, nama: nama.get(k) || 'Kelompok keahlian belum diisi',
    n: baris.filter(r => r.kk === k).length, rata_ta: bulat(k ? rataTA.get(k) : rata.ta) }));
  return { baris, kelompok, rata: Object.fromEntries(KOLOM_BEBAN.map(k => [k, bulat(rata[k])])) };
}

// Kesehatan sistem (125-patch-kesehatan-sistem.sql, pemilik 2026-11-20): hasil sistem_kesehatan() -> baris panel.
// Penilaian (batas waktu, kuota, Drive) ada di basis data; di sini hanya label, kelas warna, dan "x jam lalu".
export const LABEL_KESEHATAN = { baik: 'Baik', terlambat: 'Terlambat', gagal: 'Gagal', belum_ada: 'Belum pernah melapor',
  perlu_dicek: 'Perlu dicek', info: 'Info' };
export function lalu(waktu, kini = new Date()){
  if (!waktu) return '—';
  const m = Math.max(0, Math.round((kini - new Date(waktu)) / 60000));
  return m < 60 ? `${m} menit lalu` : m < 48 * 60 ? `${Math.round(m / 60)} jam lalu` : `${Math.round(m / 1440)} hari lalu`;
}
// 184 (pemilik 2026-11-26): versiRepo = VERSI_APPS_SCRIPT (site/versi-apps-script.js, dari stamp_versions.py) dibandingkan
// dengan x.apps_script_versi (KODE_VERSI yang dilaporkan Apps Script tiap jam). Beda atau belum dilaporkan pada butir yang
// "baik": jadi "perlu dicek" dengan petunjuk tempel ulang Code.gs.
export function versiAppsScript(dilapor, versiRepo){
  if (!versiRepo) return null;
  if (dilapor === versiRepo) return { cocok: true, teks: `Code.gs terbaru (versi ${versiRepo})` };
  return { cocok: false, teks: dilapor
    ? `Code.gs di Apps Script versi ${dilapor}, di repo ${versiRepo}: tempel ulang apps-script/Code.gs di editor Apps Script`
    : `Apps Script belum melaporkan versi Code.gs (repo ${versiRepo}): tempel ulang apps-script/Code.gs; laporan masuk tiap jam` };
}
export function ringkasKesehatan(x, kini = new Date(), versiRepo = null){
  const v = versiAppsScript(x?.apps_script_versi || null, versiRepo);
  let tambah = 0;
  const butir = (x?.butir || []).map(b0 => {
    let b = b0;
    if (b.kunci === 'apps_script' && v && b.status !== 'belum_ada') {
      b = { ...b, rinci: [b.rinci, v.teks].filter(Boolean).join(' · ') };
      if (!v.cocok && b.status === 'baik') { b.status = 'perlu_dicek'; tambah++; }
    }
    return { ...b, teks: LABEL_KESEHATAN[b.status] || b.status, kapan: lalu(b.waktu, kini),
      kelas: b.status === 'baik' ? 'ok' : b.status === 'info' ? 'info' : 'awas' };
  });
  return { butir, perlu: Number(x?.perlu_dicek || 0) + tambah, mb: x?.basis_data_mb ?? null, ringkasan: x?.ringkasan_terakhir || null };
}
