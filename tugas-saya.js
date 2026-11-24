// "Tugas saya" di Ruang kerja (pemilik 2026-11-12): hal yang menunggu tindakan dosen yang
// sedang masuk, dari data yang sudah boleh ia baca (RLS). Aturan tenggat sama dengan halaman
// Pengingat: rapat.js, hibah.js, temuan-ami.js, pengingat-dosen.js.
import { kurangProfil } from './pengingat-dosen.js?v=2026-11-24-1bc7f7';
import { tindakTerbuka, tglID } from './rapat.js?v=2026-11-24-1bc7f7';
import { tenggatBerikut, teksHari, HARI_LEWAT } from './hibah.js?v=2026-11-24-1bc7f7';
import { hariKeTenggat, labelStatus, HARI_DEKAT } from './temuan-ami.js?v=2026-11-24-1bc7f7';
import { tugasEvaluasi } from './evaluasi-pembelajaran.js?v=2026-11-24-1bc7f7';
import { bolehPengajuan } from './koordinator.js?v=2026-11-24-1bc7f7';
import { tenggatReview, hariKe, teksHari as teksHariRv, tugasTenggatRps, tugasTetapDekan, tanggalPanjang as tglRv } from './pengingat-rps.js?v=2026-11-24-1bc7f7';
import { tugasInsentif } from './insentif.js?v=2026-11-24-1bc7f7';
import { tugasMK } from './tugas-mk.js?v=2026-11-24-1bc7f7';
import { halamanAktif } from './fitur.js?v=2026-11-24-1bc7f7';
import { masaBerlaku, tanggalPanjang as tglSrt } from './profil-dosen.js?v=2026-11-24-1bc7f7';

// Sertifikat dengan masa berlaku (pemilik 2026-11-24): diingatkan sejak 90 hari sebelum habis, dan terus setelah lewat.
export const HARI_SERTIFIKAT = 90;

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
 *   target: baris target-kinerja.js barisDosen tahun berjalan, tahunTarget,
 *   pengajuanMhs: pengajuan_mahasiswa yang terbaca [{nama, jenis, status, pembimbing_id, diperbarui}],
 *   revisiTa: jadwal_ta lulus_revisi belum selesai [{nama_mahasiswa, judul, pembimbing, hasil, batas_revisi, revisi_selesai}],
 *   dataMK: data koordinator MK/pengampu untuk tugas-mk.js (null bila bukan keduanya),
 *   reviewSaya: baris mk_rps_review milik sendiri [{kurikulum, kode_mk, ditunjuk_pada, kirim_pada}] (118),
 *   rekapReview: rps_review_rekap [{kurikulum, kode_mk, terkirim, ditanggapi}], bolehRps: rps_boleh_saya [{kurikulum, kode_mk}] (119),
 *   mkNama: Map 'kur|kode' -> nama MK, sertifikat: dosen.sertifikat milik sendiri [{bidang, lembaga, berlaku_sampai}],
 *   hariReview: tenggat review (hari sejak ditunjuk), tenggatRps: {Ganjil, Genap} ISO, mkRef: ref_mata_kuliah, rpsStatus: Map 'kur|kode' -> {status, smt} (120) }
 * Hasil [{ jenis, judul, rinci, href, hari, tingkat }], lewat tenggat dulu.
 * Asesor tidak punya tugas.
 */
export function tugasSaya(d, kini = new Date()){
  const s = d.saya;
  if (!s || s.peran === 'asesor') return [];
  const out = [];
  // Modul yang dimatikan (fitur.js, templat akreditasi): tugasnya tidak ditampilkan.
  const tambah = (jenis, judul, rinci, href, hari = null) => { if (!href || halamanAktif(href)) out.push({ jenis, judul, rinci, href, hari, tingkat: tingkat(hari) }); };

  // Profil (staf non-DTPS tidak diingatkan, sama dengan pengingat-dosen.js).
  if (s.dtps !== false) {
    const k = kurangProfil(s);
    if (k.length) tambah('profil', 'Lengkapi profil', k.join(', '), 'profil.html');
  }
  const habis = (d.sertifikat || []).map(x => ({ x, b: masaBerlaku(x, kini) })).filter(({ b }) => b && b.hari <= HARI_SERTIFIKAT)
    .sort((a, b) => a.b.hari - b.b.hari);
  if (habis.length) {
    const nLewat = habis.filter(h => h.b.lewat).length;
    tambah('profil', nLewat ? `Sertifikat: ${nLewat} sudah kedaluwarsa${habis.length > nLewat ? `, ${habis.length - nLewat} segera habis` : ''}`
      : `Sertifikat: ${habis.length} segera habis masa berlakunya`,
      habis.map(({ x, b }) => `${[x.bidang || 'Sertifikat', x.lembaga].filter(Boolean).join(', ')}: ${b.lewat ? 'kedaluwarsa sejak' : 'berlaku sampai'} ${tglSrt(b.sampai)}`
        + (b.lewat ? '' : ` (${b.hari} hari lagi)`)).join('; ') + '. Perbarui sertifikat dan masa berlakunya di Profil saya.',
      'profil.html', habis[0].b.hari);
  }

  // Karya.
  const milik = (d.karya || []).filter(k => (k.karya_penulis || []).some(p => p.dosen_id === s.id) || k.dilaporkan_oleh === s.id);
  const draf = milik.filter(k => k.status === 'draf');
  if (draf.length) tambah('karya', `${draf.length} draf karya belum diajukan`,
    draf.slice(0, 3).map(k => k.judul).join('; ') + (draf.length > 3 ? '; …' : ''), 'karya.html#saya');
  for (const k of milik.filter(k => k.status === 'ditolak'))
    tambah('karya', 'Karya dikembalikan untuk diperbaiki', k.judul + (k.catatan ? ` (catatan admin: ${k.catatan})` : ''), 'karya.html#saya');
  const tanpa = milik.filter(k => k.status === 'terverifikasi' && !k.bukti_url && !(d.berBukti || new Set()).has(k.id));
  if (tanpa.length) tambah('karya', `${tanpa.length} karya terverifikasi belum ada buktinya`,
    tanpa.slice(0, 3).map(k => k.judul).join('; ') + (tanpa.length > 3 ? '; …' : ''), 'karya.html#saya');

  // BKD yang dikembalikan admin (39-patch-bkd-dosen.sql).
  for (const b of (d.bkd || []).filter(b => b.verifikasi === 'ditolak'))
    tambah('bkd', `BKD ${b.tahun_akademik} ${b.semester} dikembalikan`, b.catatan ? `Catatan admin: ${b.catatan}` : 'Perbaiki lalu ajukan lagi.', 'karya.html#bkd');

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
  for (const x of tugasEvaluasi({ saya: s, evaluasi: d.evaluasi, tindakEval: d.tindakEval, perluTL: d.perluTL, tanpaBaris: d.tanpaBaris }, kini))
    tambah(x.jenis, x.judul, x.rinci, x.href, x.hari);

  // Koordinator MK dan pengampu (pemilik 2026-11-17; tugas-mk.js): CPMK/RPS dan portofolio semester terbaru.
  if (d.dataMK) for (const x of tugasMK({ saya: s, ...d.dataMK })) tambah(x.jenis, x.judul, x.rinci, x.href);
  // Insentif publikasi (163, pemilik 2026-11-24): klaim dikembalikan / berkas kurang (pengklaim); menunggu pemeriksaan (admin/Kaprodi).
  if (d.insentif) for (const x of tugasInsentif({ saya: s, ...d.insentif })) tambah(x.jenis, x.judul, x.rinci, x.href);

  // Review sejawat RPS (118/119, pemilik 2026-11-19): reviewer yang ditunjuk dan belum mengirim; penyusun RPS yang reviewnya
  // belum ditanggapi (admin tidak menanggapi atas nama penyusun). Tanpa tenggat resmi: tidak ditandai lewat.
  for (const x of tugasReview(d, kini)) tambah(x.jenis, x.judul, x.rinci, x.href, x.hari);
  // Tenggat RPS per semester (120): RPS yang boleh saya susun belum diajukan ke Kaprodi.
  for (const x of tugasTenggatRps({ mk: d.mkRef || [], rps: d.rpsStatus || new Map(), bolehRps: d.bolehRps || [], tenggat: d.tenggatRps || {}, kini }))
    tambah(x.jenis, x.judul, x.rinci, x.href, x.hari);
  // Dekan aktif (Penugasan koordinator): RPS disahkan Kaprodi yang menunggu penetapan.
  if ((s.koordinator || []).includes('dekan')) for (const x of tugasTetapDekan({ rps: d.rpsStatus || new Map(), mkNama: d.mkNama || new Map() }))
    tambah(x.jenis, x.judul, x.rinci, x.href);

  // Target kinerja tahun berjalan (66-patch-target-dosen.sql): satu butir ringkas bila ada yang belum tercapai.
  const kurang = (d.target || []).filter(b => b.status !== 'tercapai');
  if (kurang.length) tambah('target', `Target kinerja ${d.tahunTarget || kini.getFullYear()}: ${kurang.length} indikator belum tercapai`,
    kurang.map(b => `${b.label} ${b.sah} dari ${String(+b.target).replace('.', ',')}${b.menunggu ? ` (+${b.menunggu} menunggu verifikasi)` : ''}`).join('; '),
    'target.html');

  // Pengajuan mahasiswa KP/lomba (90-patch-pengajuan-mahasiswa.sql): tahap pembimbing untuk pembimbingnya, tahap admin untuk admin.
  // Umur dihitung sejak pengajuan terakhir berubah; lebih dari 7 hari = lewat (tidak ada tenggat resmi).
  // 144: kabar kegiatan tanpa dosen pendamping menunggu pembina kemahasiswaan/admin sejak tahap pertama.
  const mhs = (d.pengajuanMhs || []).filter(p => (p.status === 'pembimbing' && p.pembimbing_id === s.id)
    || (p.status === 'pembimbing' && p.jenis === 'kabar' && !p.pembimbing_id && bolehPengajuan(s, p.jenis))
    || (p.status === 'admin' && bolehPengajuan(s, p.jenis)));   // koordinator bidangnya (97)
  if (mhs.length) {
    const tertua = Math.min(...mhs.map(p => +new Date(p.diperbarui)));
    tambah('pengajuan_mhs', `Periksa ${mhs.length} pengajuan mahasiswa (KP/lomba)`,
      mhs.slice(0, 3).map(p => `${p.nama} (${p.jenis === 'kp' ? 'KP' : p.jenis === 'kabar' ? 'kabar kegiatan' : 'lomba'})`).join(', ') + (mhs.length > 3 ? ', …' : ''),
      'pengajuan-mahasiswa.html', 7 - Math.floor((+kini - tertua) / 864e5));
  }

  // Revisi setelah seminar/sidang TA (95-patch-revisi-ta.sql): untuk pembimbing mahasiswa itu; tenggat = batas revisi.
  for (const r of d.revisiTa || []) {
    if (!s.nidn || !(r.pembimbing || []).includes(s.nidn) || r.revisi_selesai || r.hasil !== 'lulus_revisi') continue;
    const hari = r.batas_revisi ? Math.round((Date.parse(r.batas_revisi + 'T00:00:00Z') - Date.parse(kini.toISOString().slice(0, 10) + 'T00:00:00Z')) / 864e5) : null;
    tambah('revisi_ta', `Revisi TA ${r.nama_mahasiswa}`, `${r.judul}${r.batas_revisi ? `; batas ${r.batas_revisi}` : '; batas belum diisi'}`, 'rekap-ta.html#revisi', hari);
  }

  return out.map((x, i) => [x, i]).sort(([a, i], [b, j]) => URUT[a.tingkat] - URUT[b.tingkat]
    || (a.hari ?? 1e9) - (b.hari ?? 1e9) || i - j).map(([x]) => x);
}

/** Tugas review RPS (118/119): [{jenis, judul, rinci, href}]. Satu MK = tautan langsung ke RPS-nya. */
export function tugasReview({ reviewSaya = [], rekapReview = [], bolehRps = [], mkNama = new Map(), hariReview } = {}, kini = new Date()){
  const out = [], k = x => `${x.kurikulum}|${x.kode_mk}`, nm = x => `${x.kode_mk} ${mkNama.get(k(x)) || ''}`.trim();
  const tautan = xs => (xs.length === 1 ? `rps.html?kur=${encodeURIComponent(xs[0].kurikulum)}&kode=${encodeURIComponent(xs[0].kode_mk)}` : 'rps.html');
  const belum = reviewSaya.filter(x => !x.kirim_pada);
  // Tenggat review (120): N hari sejak ditunjuk; hari = tenggat terdekat.
  const tg = x => tenggatReview(x, hariReview), hari = belum.length ? Math.min(...belum.map(x => hariKe(tg(x), kini))) : null;
  if (belum.length) out.push({ jenis: 'review', judul: belum.length === 1 ? `Review RPS ${nm(belum[0])}` : `Review RPS: ${belum.length} mata kuliah menunggu penilaian Anda`,
    rinci: `Anda ditunjuk sebagai reviewer: ${belum.map(x => `${nm(x)} (tenggat ${tglRv(tg(x))}, ${teksHariRv(hariKe(tg(x), kini))})`).join('; ')}. `
      + 'Isi form review di halaman RPS (panel di samping RPS).', href: tautan(belum), hari });
  const saya = new Set(bolehRps.map(k));
  const tanggap = rekapReview.filter(x => saya.has(k(x)) && +x.terkirim > +x.ditanggapi);
  if (tanggap.length) out.push({ jenis: 'review', judul: tanggap.length === 1 ? `Tanggapi review RPS ${nm(tanggap[0])}`
      : `Tanggapi review RPS: ${tanggap.length} mata kuliah`,
    rinci: `${tanggap.map(x => `${nm(x)} (${+x.terkirim - +x.ditanggapi} review)`).join('; ')}. Tanggapi tiap catatan reviewer di kartu Review sejawat RPS.`,
    href: tautan(tanggap) });
  return out;
}
