// Dasbor operasional koordinator prodi (pemilik 2026-11-17, tahap 3 koordinator): per bidang, siapa penanggung jawabnya
// (koordinator aktif) dan antrean/keterlambatan, dengan tautan ke halaman kerjanya. Dipakai dasbor.html.
import { aktifPada, labelJabatan } from './koordinator.js?v=2026-11-18-1ccfe5';

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
      { label: 'Menunggu pembimbing', ...antre(tunggu('ta', 'pembimbing'), 'pengajuan-mahasiswa.html') },
      { label: 'Menunggu jadwal', ...antre(tunggu('ta', 'admin'), 'pengajuan-mahasiswa.html') },
      { label: 'Seminar/sidang 14 hari ke depan', n: J.filter(j => j.status === 'terjadwal' && j.tanggal >= hari && j.tanggal <= tambahHari(kini, 14)).length,
        lewat: 0, href: 'rekap-ta.html' },
      { label: 'Revisi belum selesai', n: revisi.length, lewat: revisi.filter(j => j.batas_revisi && j.batas_revisi < hari).length,
        href: 'rekap-ta.html#revisi' }] },
    { bidang: 'Kerja Praktik/Magang', jabatan: 'koordinator_kp', item: [
      { label: 'Pengajuan menunggu koordinator', ...antre(tunggu('kp', 'admin'), 'pengajuan-mahasiswa.html') },
      { label: 'Menunggu pembimbing', ...antre(tunggu('kp', 'pembimbing'), 'pengajuan-mahasiswa.html') },
      { label: 'KP berjalan (laporan selesai belum masuk)', n: P.filter(p => p.jenis === 'kp' && p.status === 'disetujui' && (p.tahap || 'pengajuan') === 'pengajuan').length,
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
      { label: 'Tindak lanjut evaluasi pembelajaran terbuka', n: (d.tindakEval || []).filter(t => t.status !== 'selesai').length,
        lewat: (d.tindakEval || []).filter(t => t.status !== 'selesai' && t.tenggat && t.tenggat < hari).length,
        href: 'evaluasi-pembelajaran.html' }] },
    { bidang: 'Laboratorium', jabatan: 'kepala_lab', item: [] },
    { bidang: 'Administrasi prodi', jabatan: null, item: [
      { label: 'Permohonan surat mahasiswa', ...antre(tunggu('surat', 'admin'), 'pengajuan-mahasiswa.html') },
      { label: 'Karya dosen menunggu verifikasi', n: (d.karya || []).filter(k => k.status === 'diajukan').length, lewat: 0, href: 'verifikasi.html' },
      { label: 'Kabar kegiatan menunggu terbit', n: (d.kabar || []).filter(k => k.status === 'diajukan').length, lewat: 0, href: 'kabar-kegiatan.html' },
      { label: 'Tindak lanjut rapat terbuka', n: (d.tindak || []).filter(t => ['terbuka', 'proses'].includes(t.status)).length,
        lewat: (d.tindak || []).filter(t => ['terbuka', 'proses'].includes(t.status) && t.tenggat && t.tenggat < hari).length, href: 'rapat.html' }] },
  ];
  return bidang.map(b => ({ ...b, pj: b.jabatan ? penanggungJawab(d.koordinator, b.jabatan, kini) : { nama: [], peringatan: [] } }));
}
