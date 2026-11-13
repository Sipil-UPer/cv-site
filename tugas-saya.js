// "Tugas saya" di Ruang kerja (pemilik 2026-11-12): hal yang menunggu tindakan dosen yang
// sedang masuk, dari data yang sudah boleh ia baca (RLS). Aturan tenggat sama dengan halaman
// Pengingat: rapat.js, hibah.js, temuan-ami.js, pengingat-dosen.js.
import { kurangProfil } from './pengingat-dosen.js?v=2026-11-13-5ae96e';
import { tindakTerbuka, tglID } from './rapat.js?v=2026-11-13-5ae96e';
import { tenggatBerikut, teksHari, HARI_LEWAT } from './hibah.js?v=2026-11-13-5ae96e';
import { hariKeTenggat, labelStatus, HARI_DEKAT } from './temuan-ami.js?v=2026-11-13-5ae96e';
import { tugasEvaluasi } from './evaluasi-pembelajaran.js?v=2026-11-13-5ae96e';

const SELESAI_AMI = new Set(['selesai', 'ditutup']);
const tingkat = h => h == null ? 'biasa' : h < 0 ? 'lewat' : h <= HARI_DEKAT ? 'dekat' : 'biasa';
const URUT = { lewat: 0, dekat: 1, biasa: 2 };
const tgl10 = s => String(s || '').slice(0, 10);

/**
 * Daftar tugas satu pengguna. d = {
 *   saya: baris dosen (pengguna().saya),
 *   karya: karya yang terbaca (draf milik sendiri ikut), dengan karya_penulis [{dosen_id}],
 *   berBukti: Set id karya yang punya karya_bukti,
 *   bkd: baris lkps_bkd milik sendiri, tindak: rapat_tindak dengan rapat {judul, tanggal},
 *   hibah: hibah_ajuan dengan hibah_tim [{dosen_id, peran}], temuan: ami_temuan,
 *   kelasCpl: cpl_kelas milik sendiri, berkasCpl: cpl_berkas [{kelas_id}],
 *   target: baris target-kinerja.js barisDosen tahun berjalan, tahunTarget }
 * Hasil [{ jenis, judul, rinci, href, hari, tingkat }], lewat tenggat dulu.
 * Asesor tidak punya tugas.
 */
export function tugasSaya(d, kini = new Date()){
  const s = d.saya;
  if (!s || s.peran === 'asesor') return [];
  const out = [];
  const tambah = (jenis, judul, rinci, href, hari = null) => out.push({ jenis, judul, rinci, href, hari, tingkat: tingkat(hari) });

  // Profil (staf non-DTPS tidak diingatkan, sama dengan pengingat-dosen.js).
  if (s.dtps !== false) {
    const k = kurangProfil(s);
    if (k.length) tambah('profil', 'Lengkapi profil', k.join(', '), 'profil.html');
  }

  // Karya.
  const milik = (d.karya || []).filter(k => (k.karya_penulis || []).some(p => p.dosen_id === s.id) || k.dilaporkan_oleh === s.id);
  const draf = milik.filter(k => k.status === 'draf');
  if (draf.length) tambah('karya', `${draf.length} draf karya belum diajukan`,
    draf.slice(0, 3).map(k => k.judul).join('; ') + (draf.length > 3 ? '; …' : ''), 'input.html#saya');
  for (const k of milik.filter(k => k.status === 'ditolak'))
    tambah('karya', 'Karya dikembalikan untuk diperbaiki', k.judul + (k.catatan ? ` (catatan admin: ${k.catatan})` : ''), 'input.html#saya');
  const tanpa = milik.filter(k => k.status === 'terverifikasi' && !k.bukti_url && !(d.berBukti || new Set()).has(k.id));
  if (tanpa.length) tambah('karya', `${tanpa.length} karya terverifikasi belum ada buktinya`,
    tanpa.slice(0, 3).map(k => k.judul).join('; ') + (tanpa.length > 3 ? '; …' : ''), 'input.html#saya');

  // BKD yang dikembalikan admin (39-patch-bkd-dosen.sql).
  for (const b of (d.bkd || []).filter(b => b.verifikasi === 'ditolak'))
    tambah('bkd', `BKD ${b.tahun_akademik} ${b.semester} dikembalikan`, b.catatan ? `Catatan admin: ${b.catatan}` : 'Perbaiki lalu ajukan lagi.', 'input.html#bkd');

  // Tindak lanjut rapat ber-PJ saya.
  for (const t of tindakTerbuka((d.tindak || []).filter(t => t.pj_dosen_id === s.id), kini))
    tambah('rapat', t.keputusan, `Rapat "${t.rapat?.judul || ''}" ${tglID(tgl10(t.rapat?.tanggal))}`
      + (t.tenggat ? `; tenggat ${tglID(tgl10(t.tenggat))}, ${teksHari(t.hari)}` : '; tanpa tenggat'), `rapat.html?id=${t.rapat_id}`, t.hari);

  // Hibah: tim saya, tenggat berikut (laporan lewat > 365 hari tidak diingatkan lagi).
  for (const a of (d.hibah || []).filter(a => (a.hibah_tim || []).some(x => x.dosen_id === s.id))) {
    const t = tenggatBerikut(a, kini);
    if (!t || t.hari < -HARI_LEWAT) continue;
    tambah('hibah', `${t.label}: ${a.judul}`, `Tenggat ${tglID(t.tanggal)}, ${teksHari(t.hari)}`, 'hibah.html', t.hari);
  }

  // Temuan AMI ber-PJ email saya. Status diubah admin, jadi tugasnya melapor ke admin.
  const em = String(s.email || '').toLowerCase();
  for (const r of (d.temuan || []).filter(r => em && String(r.pj_email || '').toLowerCase() === em && !SELESAI_AMI.has(r.status))) {
    const h = hariKeTenggat(r.tenggat, kini);
    tambah('ami', `Temuan AMI ${[r.siklus, r.kode].filter(Boolean).join(' ')}`.trim(),
      `${r.uraian} (${labelStatus(r.status).toLowerCase()}${r.tenggat ? `; tenggat ${tglID(tgl10(r.tenggat))}, ${teksHari(h)}` : ''}). Laporkan perkembangannya ke admin prodi.`,
      '', h);
  }

  // Kelas CPL yang belum ada berkas nilainya.
  const sudah = new Set((d.berkasCpl || []).map(b => b.kelas_id));
  const belum = (d.kelasCpl || []).filter(k => !sudah.has(k.id))
    .sort((a, b) => `${b.tahun_akademik}${b.semester}`.localeCompare(`${a.tahun_akademik}${a.semester}`));
  for (const k of belum)
    tambah('cpl', `Unggah berkas nilai CPL ${k.kode_mk} kelas ${k.kelas}`, `${k.nama_mk || k.kode_mk}, ${k.tahun_akademik} ${k.semester}`, 'nilai-cpl.html');

  // Evaluasi pembelajaran (68-patch-evaluasi-pembelajaran.sql): refleksi semester terbaru dan tindak lanjut ber-PJ saya.
  for (const x of tugasEvaluasi({ saya: s, evaluasi: d.evaluasi, tindakEval: d.tindakEval }, kini))
    tambah(x.jenis, x.judul, x.rinci, x.href, x.hari);

  // Target kinerja tahun berjalan (66-patch-target-dosen.sql): satu butir ringkas bila ada yang belum tercapai.
  const kurang = (d.target || []).filter(b => b.status !== 'tercapai');
  if (kurang.length) tambah('target', `Target kinerja ${d.tahunTarget || kini.getFullYear()}: ${kurang.length} indikator belum tercapai`,
    kurang.map(b => `${b.label} ${b.sah} dari ${String(+b.target).replace('.', ',')}${b.menunggu ? ` (+${b.menunggu} menunggu verifikasi)` : ''}`).join('; '),
    'target.html');

  return out.map((x, i) => [x, i]).sort(([a, i], [b, j]) => URUT[a.tingkat] - URUT[b.tingkat]
    || (a.hari ?? 1e9) - (b.hari ?? 1e9) || i - j).map(([x]) => x);
}
