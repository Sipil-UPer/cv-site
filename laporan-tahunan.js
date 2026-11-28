// Laporan kinerja tahunan program studi, pemilik 2026-11-11; diperluas 2026-11-27 (mahasiswa dan lulusan, prestasi,
// kepuasan, kesenjangan CPL, kegiatan prodi, tindak lanjut) dan versi publik.
// Satu model isi (daftar blok) dirender ke Word (.docx, disusun sendiri tanpa templat) dan ke HTML (laporan-tahunan.html).
// Sumber: data.json publik, rekap survei yang sudah diterbitkan (survei_rekap), dan, khusus admin, capaian IKU/IKT,
// perkiraan status akreditasi, serta Temuan AMI. Versi publik (publik: true) tidak memuat bagian khusus admin.
import { hitungSumber } from './iku-otomatis.js?v=2026-11-28-2346ab';
import { SDGS } from './form-karya.js?v=2026-11-28-2346ab';
import { run, para, judul, teks, tabel, buatDocx } from './docx-dasar.js?v=2026-11-28-2346ab';
import { rekapSurvei, aspekTindakLanjut, kesenjanganCPL, labelKelompok, labelAspek, lengkapiCPL } from './survei-kepuasan.js?v=2026-11-28-2346ab';
import { rekapMasukan, perKategori, kategoriSumber, TOPIK_MASUKAN, KATEGORI_PEMANGKU } from './pemangku.js?v=2026-11-28-2346ab';
import { rekapLab } from './lab.js?v=2026-11-28-2346ab';
import { rekapSdm, JENIS_SDM } from './sdm.js?v=2026-11-28-2346ab';

const angka = v => v == null || v === '' ? '—' : (Math.round(+v * 100) / 100).toLocaleString('id-ID');
const diTS = (xs, ts) => (xs || []).filter(x => +x.tahun_ts === +ts);
const ta = ts => `${ts - 1}/${ts}`;
const rapi = s => String(s || '').replace(/_/g, ' ');
const kapital = s => { const t = rapi(s); return t.charAt(0).toUpperCase() + t.slice(1); };
const BULAN = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
/** TS 1 September s.d. 31 Agustus (sama dengan bangun.py): bulan >= 9 masuk TS tahun berikutnya. */
export const tsDari = (tahun, bulan) => (+bulan >= 9 ? +tahun + 1 : +tahun);
const tsTanggal = s => { const m = /^(\d{4})-(\d{2})/.exec(String(s || '')); return m ? tsDari(m[1], m[2]) : null; };
const tglPendek = s => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s || '')); return m ? `${+m[3]} ${BULAN[+m[2]]} ${m[1]}` : ''; };
const persen = (a, b) => b ? `${angka(a / b * 100)}%` : '—';

// Status satu indikator (sama dengan ringkasan di Data prodi).
function statusIKU(tg, cp, arah){
  if (tg == null || cp == null) return ['—', 'capaian belum ada'];
  const maks = arah === 'maksimal', ok = maks ? cp <= tg : cp >= tg;
  const p = maks ? (cp > 0 ? tg / cp * 100 : 100) : (tg > 0 ? cp / tg * 100 : 100);
  return [`${Math.round(p)}%`, ok ? 'tercapai' : p >= 80 ? 'hampir' : 'belum'];
}

/**
 * Model isi laporan. C = { D (data.json), ts, survei (baris survei_rekap) | undefined, iku (lkps_target_kinerja) | null,
 * NA, status, langkah: [{no, n, label, pihak, naik}], temuan (ami_temuan) | null }.
 * opsi.publik: tanpa IKU/IKT, kesiapan akreditasi, dan tindak lanjut internal.
 * Hasil: [{sampul: [baris]}, {h: 1|2, t}, {p, i}, {tabel: [[kepala], ...baris]}].
 */
export function susunLaporan(C, { publik = false, kalender = false } = {}){
  const { D, ts } = C, out = [];
  // Periode (pemilik 2026-11-27): tahun akademik TS (1 Sep – 31 Agu) atau tahun kalender (1 Jan – 31 Des). Pada tahun
  // kalender, data yang hanya ada per TS (mahasiswa aktif, kerja sama, kepuasan pengguna, IKU/IKT, temuan) memakai TS
  // yang berakhir pada tahun itu dan diberi label TS-nya.
  const kal = !!kalender, PER = kal ? `tahun ${ts}` : `TS ${ta(ts)}`, catTS = kal ? `TS ${ta(ts)}` : '';
  const diPer = xs => (xs || []).filter(x => kal ? +x.tahun === +ts : +x.tahun_ts === +ts);
  const thTgl = s => +String(s || '').slice(0, 4);
  let no = 0;
  const h1 = t => out.push({ h: 1, t: `${++no}. ${t}` }), h2 = t => out.push({ h: 2, t });
  const p = (t, i = false) => out.push({ p: t, i }), tb = rows => out.push({ tabel: rows });
  const A = D.akreditasi || {};
  out.push({ sampul: ['LAPORAN KINERJA TAHUNAN PROGRAM STUDI',[D.prodi, D.institusi].filter(Boolean).join(' '),
    kal ? `Tahun ${ts} (1 Januari – 31 Desember)` : `Tahun akademik ${ta(ts)}`, `Disusun otomatis dari situs kinerja prodi pada ${new Date().toLocaleDateString('id-ID',
      { day: 'numeric', month: 'long', year: 'numeric' })}; data yang sudah diverifikasi prodi${publik ? ', versi publik' : ''}.`] });

  // Bahan bersama
  const pub = diPer(D.publikasi), keg = diPer(D.kegiatan), lua = diPer(D.luaran_dosen), rek = diPer(D.rekognisi);
  const prestasi = (D.prestasi || []).filter(x => kal ? +x.tahun === +ts : tsDari(x.tahun, x.bulan) === +ts)
    .sort((a, b) => (+a.tahun - +b.tahun) || (+a.bulan || 0) - (+b.bulan || 0));
  const presAgr = diPer(D.prestasi_agregat).reduce((a, x) => a + (+x.jumlah || 0), 0);
  const ks = (A.kerjasama || []).filter(x => +x.tahun === +ts)
    .reduce((a, x) => a + (+x.internasional || 0) + (+x.nasional || 0) + (+x.wilayah || 0) + (+x.tanpa_tingkat || 0), 0);
  const tr = (D.tracer || []).find(t => +t.tahun_lulus === +ts - 1);
  const taRow = (A.ta || []).find(x => +x.tahun_ts === +ts);
  const baru = (A.kohort || []).find(x => +x.tahun_masuk === (kal ? +ts : +ts - 1));
  const kabar = (D.kabar || []).filter(k => (kal ? thTgl(k.tanggal) : tsTanggal(k.tanggal)) === +ts).sort((a, b) => String(a.tanggal).localeCompare(String(b.tanggal)));
  const survei = (C.survei || []).filter(s => (kal ? thTgl(s.mulai) === +ts : +s.tahun_ts === +ts) && +s.n > 0).map(s => ({ ...s, pertanyaan: lengkapiCPL(s.pertanyaan) }));
  const dt = D.dtps || {};

  // 1. Ringkasan
  h1('Ringkasan kinerja');
  tb([['Aspek', kal ? `Tahun ${ts}` : `TS ${ta(ts)}`, 'Keterangan'],
    ['Mahasiswa aktif', angka(taRow?.mahasiswa_aktif), catTS],
    ['Mahasiswa baru', angka(baru?.masuk), baru ? `angkatan ${baru.tahun_masuk}` : 'data kohort belum ada'],
    ['Dosen tetap (DTPS)', angka(dt.jumlah), `${angka(dt.doktor)} bergelar doktor (data terkini)`],
    ['Publikasi', angka(pub.length), `${pub.filter(x => /^(scopus|wos)/.test(x.indeksasi || '')).length} terindeks Scopus/WoS`],
    ['Penelitian', angka(keg.filter(k => k.kategori === 'penelitian').length), ''],
    ['Pengabdian kepada masyarakat', angka(keg.filter(k => k.kategori === 'pkm').length), ''],
    ['Luaran/HKI dosen', angka(lua.length), ''],
    ['Rekognisi dosen', angka(rek.length), ''],
    ['Prestasi mahasiswa', angka(Math.max(presAgr, prestasi.length)), ''],
    ['Kerja sama', angka(ks), `penelitian, PkM, dan MoU yang tercatat${kal ? ` (${catTS})` : ''}`],
    ['Kegiatan prodi (kabar)', angka(kabar.length), 'kuliah tamu, kunjungan, survei lapangan, dan sejenisnya'],
    ['Survei kepuasan', angka(survei.length), survei.length ? `${angka(survei.reduce((a, s) => a + +s.n, 0))} responden (rekap terbit)` : 'belum ada rekap terbit'],
    ['Lulusan terlacak (tracer)', tr ? `${angka(tr.terlacak)} dari ${angka(tr.lulusan)}` : '—',
      tr ? `lulusan ${tr.tahun_lulus}; rata-rata waktu tunggu ${angka(tr.waktu_tunggu_bulan)} bulan` : 'belum ada tracer lulusan TS-1']]);

  // 2. Mahasiswa dan lulusan
  h1('Mahasiswa dan lulusan');
  const kohort = (A.kohort || []).filter(x => +x.tahun_masuk <= (kal ? +ts : +ts - 1)).sort((a, b) => +b.tahun_masuk - +a.tahun_masuk).slice(0, 7);
  if (kohort.length) {
    h2('Kohort mahasiswa');
    tb([['Tahun masuk', 'Mahasiswa baru', 'Lulus', 'Lulus 3,5–4,5 tahun', 'Lulus 4,5–5,5 tahun', 'Lulus > 5,5 tahun'],
      ...kohort.map(k => [String(k.tahun_masuk), angka(k.masuk), angka(k.lulus), angka(k.lulus_3_5_sd_4_5), angka(k.lulus_4_5_sd_5_5),
        angka((+k.lulus_5_5_sd_6_5 || 0) + (+k.lulus_6_5_sd_8 || 0))])]);
  } else p('Data kohort belum ada.', true);
  h2(`Tracer study lulusan ${ts - 1}`);
  if (tr) {
    const kerja = (+tr.wt_kurang_3 || 0) + (+tr.wt_3_18 || 0) + (+tr.wt_lebih_18 || 0);
    tb([['Indikator', 'Nilai'],
      ['Lulusan', angka(tr.lulusan)], ['Terlacak', `${angka(tr.terlacak)} (${persen(+tr.terlacak, +tr.lulusan)})`],
      ['Rata-rata waktu tunggu', `${angka(tr.waktu_tunggu_bulan)} bulan`],
      ['Waktu tunggu < 3 / 3–18 / > 18 bulan', `${angka(tr.wt_kurang_3)} / ${angka(tr.wt_3_18)} / ${angka(tr.wt_lebih_18)} (dari ${angka(kerja)} yang bekerja)`],
      ['Kesesuaian bidang tinggi / sedang / rendah', `${angka(tr.kesesuaian_tinggi)} / ${angka(tr.kesesuaian_sedang)} / ${angka(tr.kesesuaian_rendah)}`],
      ['Tempat kerja internasional / nasional / wilayah', `${angka(tr.kerja_internasional)} / ${angka(tr.kerja_nasional)} / ${angka(tr.kerja_wilayah)}`]]);
  } else p(`Belum ada data tracer study lulusan ${ts - 1}.`, true);

  // 3. Prestasi
  h1('Prestasi mahasiswa');
  if (prestasi.length) {
    const per = [...new Set(prestasi.map(x => x.tingkat || 'tanpa tingkat'))].map(t => [t, prestasi.filter(x => (x.tingkat || 'tanpa tingkat') === t).length]);
    p(`${prestasi.length} prestasi pada ${PER}: ${per.map(([t, n]) => `${n} tingkat ${rapi(t)}`).join(', ')}.`);
    tb([['Kegiatan', 'Tingkat', 'Capaian', 'Mahasiswa'], ...prestasi.map(x => [
      [x.kegiatan, x.penyelenggara].filter(Boolean).join(' — '), kapital(x.tingkat), x.capaian || '',
      (x.mahasiswa || []).join(', ')])]);
  } else p(presAgr ? `${presAgr} prestasi tercatat pada ${PER}.` : 'Belum ada prestasi yang tercatat.', true);

  // 4. Kepuasan
  h1('Kepuasan pemangku kepentingan');
  if (survei.length) {
    const rks = survei.map(s => [s, rekapSurvei(s.pertanyaan, s.hitung || {})]);
    tb([['Kelompok', 'Survei', 'Responden', 'Rerata (1–4)', '% puas'], ...rks.map(([s, rk]) =>
      [labelKelompok(s.kelompok), s.judul || '', angka(s.n), angka(rk.rerata), rk.puas == null ? '—' : `${angka(rk.puas)}%`])]);
    const bawah = rks.flatMap(([s, rk]) => aspekTindakLanjut(rk, s).map(a => `${labelKelompok(s.kelompok)}, ${a.label} (${a.alasan.join('; ')})`));
    p(bawah.length ? `Aspek di bawah ambang yang ditindaklanjuti: ${bawah.join('; ')}.` : 'Semua aspek berada di atas ambang (% puas ≥ 75 dan rerata ≥ 3).');
  } else p(`Belum ada rekap survei kepuasan ${PER} yang diterbitkan.`, true);
  const peng = diTS(A.kepuasan, ts);
  if (peng.length) {
    h2(`Kepuasan pengguna lulusan (Tabel 6.g.2)${kal ? `, ${catTS}` : ''}`);
    tb([['Aspek', 'Sangat baik', 'Baik', 'Cukup', 'Kurang'], ...peng.map(x => [kapital(labelAspek(x.aspek)),
      `${angka(x.sangat_baik)}%`, `${angka(x.baik)}%`, `${angka(x.cukup)}%`, `${angka(x.kurang)}%`])]);
  }

  // EDOM (pemilik 2026-11-27, butir 16): rekap prodi per semester dari rekap_evaluasi() (D._edom, hanya pengguna terdaftar;
  // tanpa angka per dosen). Tahun akademik: Ganjil + Genap TS; tahun kalender: Genap TS (Feb-Jun) + Ganjil TS+1 (Sep-Jan).
  if (!publik && Array.isArray(D._edom)) {
    h2(`Evaluasi dosen oleh mahasiswa (EDOM)${kal ? `, semester yang berjalan pada tahun ${ts}` : ''}`);
    const smt = kal ? [[ta(ts), 'Genap'], [ta(ts + 1), 'Ganjil']] : [[ta(ts), 'Ganjil'], [ta(ts), 'Genap']];
    const ed = smt.map(([t, s]) => D._edom.find(r => r.tahun_akademik === t && r.semester === s)).filter(Boolean);
    if (ed.length) tb([['Semester', 'MK-dosen dievaluasi', 'Rerata EDOM (0–4)', 'Di bawah ambang', 'Sudah ditindaklanjuti', 'Refleksi RPS terisi'],
      ...ed.map(r => [`${r.semester} ${r.tahun_akademik}`, angka(r.ber_edom), angka(r.rerata_edom), angka(r.di_bawah_ambang),
        angka(r.bawah_bertindak), `${angka(r.rps_terisi)} dari ${angka(r.jumlah)}`])]);
    else p('Belum ada rekap EDOM untuk periode ini (Evaluasi pembelajaran › tempel rekap EDOM dari kampus).', true);
  }

  // Pengembangan dosen dan tendik (198, pemilik 2026-11-27; butir 5-I, 27–29): D._sdm = baris sdm_rencana (tanpa nama), tahun
  // target = tahun laporan (TS untuk tahun akademik, tahun kalender untuk versi kalender).
  if (!publik && Array.isArray(D._sdm)) {
    const thn = ts;
    h2(`Pengembangan dosen dan tendik, target tahun ${thn}`);
    const rk = rekapSdm(D._sdm).filter(x => x.tahun === thn);
    if (rk.length) {
      tb([['Jenis', 'Target', 'Selesai', 'Berjalan', 'Batal', 'Tercapai'], ...rk.map(x => [JENIS_SDM[x.jenis] || x.jenis, angka(x.target), angka(x.selesai),
        angka(x.berjalan), angka(x.batal), x.persen == null ? '–' : `${x.persen}%`])]);
      p('Dari Rencana pengembangan (ruang kerja): rencana studi lanjut, sertifikasi, pelatihan, dan kenaikan jabatan dosen dan tendik; '
        + 'target = semua rencana kecuali yang batal.', true);
    } else p(`Belum ada rencana pengembangan bertarget tahun ${thn} (Data saya › Rencana pengembangan).`, true);
  }

  // Forum pemangku (200, pemilik 2026-11-27; butir 2, 12, 58): D._pemangku = {pemangku, masukan}; tahun = tahun laporan;
  // tanpa nama orang (sumber = kategori).
  if (!publik && D._pemangku && Array.isArray(D._pemangku.masukan)) {
    const { pemangku = [], masukan } = D._pemangku, xs = masukan.filter(m => String(m.tanggal).startsWith(String(ts)));
    h2(`Masukan pemangku kepentingan tahun ${ts}`);
    if (xs.length) {
      const rk = rekapMasukan(xs), pk = perKategori(xs, pemangku, ts);
      tb([['Topik', 'Masuk', 'Diadopsi', 'Tidak diadopsi', 'Belum diputuskan'], ...rk.map(r => [TOPIK_MASUKAN[r.topik] || r.topik, angka(r.masuk),
        angka(r.diadopsi), angka(r.tidak), angka(r.baru + r.dikaji)])]);
      p(`Sumber: ${Object.entries(pk).map(([k, n]) => `${KATEGORI_PEMANGKU[k] || k} ${n}`).join(', ')}. Anggota forum aktif: `
        + `${pemangku.filter(x => x.anggota_forum && x.aktif).length}.`, true);
      const ad = xs.filter(m => m.status === 'diadopsi');
      if (ad.length) tb([['Topik', 'Sumber', 'Masukan', 'Tindak lanjut'], ...ad.map(m => [TOPIK_MASUKAN[m.topik] || m.topik,
        KATEGORI_PEMANGKU[kategoriSumber(m, pemangku)] || '', m.isi, m.tindak_lanjut || ''])]);
    } else p(`Belum ada masukan pemangku tercatat tahun ${ts} (Mutu dan pemantauan › Forum pemangku kepentingan).`, true);
  }

  // Laboratorium (199, pemilik 2026-11-27; butir 38–39): D._lab = {lab, alat, perawatan, induksi, pinjam}; tahun = tahun laporan
  // (1 Jan–31 Des TS untuk kedua versi, sama dengan Rencana pengembangan); kondisi alat = keadaan saat laporan dibuat.
  if (!publik && D._lab && Array.isArray(D._lab.lab) && D._lab.lab.length) {
    h2(`Laboratorium: alat, perawatan, dan induksi K3 tahun ${ts}`);
    const rk = rekapLab(D._lab, { dari: `${ts}-01-01`, sampai: `${ts}-12-31` });
    tb([['Laboratorium', 'Jenis alat', 'Unit', 'Kondisi baik', 'Kalibrasi tepat waktu', 'Perawatan tercatat', 'Sesi induksi K3', 'Peserta induksi'],
      ...rk.map(r => [r.nama, angka(r.jenisAlat), angka(r.unit), r.persenBaik == null ? '–' : `${r.persenBaik}%`,
        r.perluKalibrasi ? `${angka(r.kalibrasiTepat)} dari ${angka(r.perluKalibrasi)}` : '–', angka(r.perawatan), angka(r.sesiInduksi), angka(r.pesertaInduksi)])]);
    p('Dari Inventaris dan K3 laboratorium (ruang kerja): kondisi alat per jenis, riwayat perawatan/perbaikan/kalibrasi, dan sesi induksi K3 mahasiswa.', true);
  }

  // Surat dan SK prodi (201, pemilik 2026-11-28): D._surat = {surat, jenis}; tahun = tahun kalender laporan (tanggal surat); tanpa isi.
  if (!publik && D._surat && Array.isArray(D._surat.surat)) {
    h2(`Surat dan SK program studi tahun ${ts}`);
    const nama = k => (D._surat.jenis || []).find(j => j.kode === k)?.nama || k, per = {};
    for (const s of D._surat.surat.filter(s => String(s.tanggal || '').startsWith(String(ts)) && ['disahkan', 'arsip', 'dibatalkan'].includes(s.status))) {
      const x = per[s.jenis] ||= { terbit: 0, qr: 0, batal: 0 };
      if (s.status === 'dibatalkan') x.batal += 1; else x.terbit += 1;
      if (s.status === 'disahkan') x.qr += 1;
    }
    const rows = Object.entries(per).sort(([a], [b]) => nama(a).localeCompare(nama(b), 'id'));
    if (rows.length) {
      tb([['Jenis', 'Terbit', 'Bertanda tangan elektronik (QR)', 'Dibatalkan'], ...rows.map(([k, x]) => [nama(k), angka(x.terbit), angka(x.qr), angka(x.batal)])]);
      p('Dari Surat dan SK (ruang kerja): nomor otomatis per jenis; SK prodi ditandatangani Dekan, surat lain Kaprodi, dengan kode QR verifikasi. '
        + 'Terbit = disahkan dan surat lama yang dicatat sebagai arsip.', true);
    } else p(`Belum ada surat atau SK bernomor tahun ${ts} (Pengelolaan › Surat dan SK).`, true);
  }

  // Layanan karier dan rekrutmen asisten (202, pemilik 2026-11-28): D._karier = {lowongan, rekrutmen}; lowongan menurut tanggal tayang,
  // rekrutmen menurut tanggal buka, dalam tahun kalender laporan; tanpa nama pelamar atau pengusul.
  if (!publik && D._karier && (Array.isArray(D._karier.lowongan) || Array.isArray(D._karier.rekrutmen))) {
    h2(`Layanan karier dan rekrutmen asisten tahun ${ts}`);
    const JL = { kerja: 'Kerja', magang: 'Magang', lainnya: 'Lainnya' }, JA = { praktikum: 'Asisten praktikum', mk: 'Asisten mata kuliah' };
    const low = (D._karier.lowongan || []).filter(l => l.status !== 'ditolak' && String(l.tayang_pada || '').startsWith(String(ts)));
    if (low.length) {
      const per = {};
      for (const l of low) { const x = per[l.jenis] ||= { n: 0, mitra: 0, alumni: 0, lain: 0 }; x.n += 1; x[l.sumber === 'mitra' ? 'mitra' : l.sumber === 'alumni' ? 'alumni' : 'lain'] += 1; }
      tb([['Lowongan', 'Ditayangkan', 'Dari mitra', 'Dari alumni', 'Sumber lain'], ...Object.entries(per).map(([k, x]) => [JL[k] || k, angka(x.n), angka(x.mitra), angka(x.alumni), angka(x.lain)])]);
    } else p(`Belum ada lowongan yang ditayangkan tahun ${ts}.`, true);
    const rek = (D._karier.rekrutmen || []).filter(r => r.status !== 'draf' && String(r.buka || '').startsWith(String(ts)));
    if (rek.length) {
      tb([['Rekrutmen', 'Semester', 'Kuota', 'Pelamar', 'Diterima', 'SK'], ...rek.map(r => { const ls = r.lamaran || [];
        return [`${JA[r.jenis] || r.jenis}: ${r.judul}`, `${r.semester} ${r.tahun_akademik}`, angka(r.kuota), angka(ls.length),
          angka(ls.filter(l => l.status === 'diterima').length), r.sk_surat_id ? 'ada' : 'belum']; })]);
    } else p(`Belum ada rekrutmen asisten yang dibuka tahun ${ts}.`, true);
    p('Dari Kelola karier dan asisten (ruang kerja): lowongan dari mitra, alumni, dan pemangku tayang di halaman publik setelah diperiksa prodi; '
      + 'rekrutmen asisten dibuka terbuka, pelamar dicocokkan dengan IPK data akademik, dan yang diterima ditetapkan dengan SK.', true);
  }

  // Ujian dan validasi soal (195, pemilik 2026-11-27; butir 15–16 dan 55): D._ujian = rekapUjian() (ujian.js), hanya pengguna
  // terdaftar; tanpa nama dosen. Periode sama dengan EDOM.
  if (!publik && Array.isArray(D._ujian)) {
    h2(`Ujian dan validasi soal${kal ? `, semester yang berjalan pada tahun ${ts}` : ''}`);
    const smt = kal ? [[ta(ts), 'Genap'], [ta(ts + 1), 'Ganjil']] : [[ta(ts), 'Ganjil'], [ta(ts), 'Genap']];
    const uj = smt.map(([t, s]) => D._ujian.find(r => r.tahun_akademik === t && r.semester === s)).filter(Boolean);
    if (uj.length) {
      tb([['Semester', 'MK ditawarkan', 'Soal UTS layak', 'Soal UAS layak', 'Soal pernah direvisi', 'Kelas terjadwal UTS / UAS', 'Tugas mengawas'],
        ...uj.map(r => [`${r.semester} ${r.tahun_akademik}`, angka(r.mk), `${angka(r.layak.uts)} dari ${angka(r.mk)}`, `${angka(r.layak.uas)} dari ${angka(r.mk)}`,
          angka(r.pernahRevisi), `${angka(r.terjadwal.uts)} / ${angka(r.terjadwal.uas)} dari ${angka(r.kelas)}`,
          `${angka(r.tugasAwas)} (${angka(r.pengawas)} dosen)`])]);
      p('Soal divalidasi GKM atau Kaprodi yang bukan pengampu mata kuliahnya, dengan daftar periksa enam butir (Sub-CPMK, tingkat Bloom, '
        + 'bobot, kejelasan, waktu, kunci/rubrik); soal yang belum layak direvisi lalu diajukan ulang.', true);
    } else p('Belum ada jadwal ujian atau validasi soal untuk periode ini (Pengajaran › Ujian dan validasi soal).', true);
  }

  // 5. Kesenjangan CPL
  h1('Kesenjangan capaian pembelajaran lulusan (CPL)');
  const cpl = survei.flatMap(s => kesenjanganCPL(s.pertanyaan, s.opsi || {}).filter(x => x.penting != null || x.kuasai != null)
    .map(x => ({ ...x, kelompok: labelKelompok(s.kelompok) })));
  if (cpl.length) {
    p('Rerata 1–5 tingkat kepentingan dan penguasaan tiap CPL; selisih ≥ 1 menjadi prioritas peninjauan kurikulum.');
    tb([['CPL', 'Kelompok', 'Penting', 'Dikuasai', 'Selisih', 'Prioritas'], ...cpl.map(x => [`CPL-${x.kode}`, x.kelompok,
      angka(x.penting), angka(x.kuasai), angka(x.selisih), x.selisih != null && x.selisih >= 1 ? 'ya' : ''])]);
  } else p('Belum ada survei dengan pertanyaan CPL yang rekapnya diterbitkan pada periode ini.', true);

  // 6. IKU/IKT (admin)
  if (!publik) {
    h1('Capaian IKU dan IKT');
    const iku = (C.iku || []).filter(r => +r.tahun_ts === +ts);
    if (!C.iku) p('Data IKU/IKT hanya terbaca oleh admin; unduh laporan sebagai admin untuk bagian ini.', true);
    else if (!iku.length) p(`Belum ada IKU/IKT untuk TS ${ta(ts)} di Data prodi › Target IKU/IKT.`, true);
    else for (const jenis of ['iku', 'ikt']) {
      const xs = iku.filter(r => r.jenis === jenis).sort((a, b) => (a.urutan ?? 100) - (b.urutan ?? 100));
      if (!xs.length) continue;
      h2(jenis.toUpperCase());
      const cpOf = r => { const h = r.sumber ? hitungSumber(r.sumber, D, ts) : null; return [h, h ? h.nilai : (r.capaian == null ? null : +r.capaian)]; };
      tb([['Indikator', 'Target', 'Capaian', '%', 'Status'], ...xs.map(r => {
        const [h, cp] = cpOf(r), [pc, s] = statusIKU(r.target == null ? null : +r.target, cp, r.arah);
        return [r.nama + (h ? ' (otomatis)' : ''), `${r.arah === 'maksimal' ? '≤' : '≥'} ${angka(r.target)} ${r.satuan || ''}`.trim(),
          cp == null ? '—' : `${angka(cp)} ${r.satuan || ''}`.trim(), pc, s];
      })]);
      // Analisis: IKT selalu (butir 54); IKU/IKT yang belum tercapai beserta rencana perbaikannya (butir 56, patch 67).
      xs.forEach(r => {
        const [, cp] = cpOf(r);
        const belum = statusIKU(r.target == null ? null : +r.target, cp, r.arah)[1] !== 'tercapai' && cp != null && r.target != null;
        const isi = [r.analisis, belum && r.rencana_perbaikan ? `Rencana perbaikan: ${r.rencana_perbaikan}` : ''].filter(Boolean).join(' ');
        if ((r.jenis === 'ikt' || belum) && isi) p(`${r.nama}: ${isi}`);
      });
    }
  }

  // SDGs
  h1('Kontribusi pada SDGs');
  const karya = [...pub, ...keg, ...lua];
  const sdg = SDGS.map(([n, nama]) => [n, nama, karya.filter(k => (k.sdgs || []).includes(n)).length]).filter(x => x[2]);
  p(`${karya.filter(k => (k.sdgs || []).length).length} dari ${karya.length} karya ${PER} terkait SDGs.`);
  if (sdg.length) tb([['SDG', 'Tujuan', 'Jumlah karya'], ...sdg.map(([n, nama, j]) => [String(n), nama, angka(j)])]);

  // Kegiatan prodi
  h1('Kegiatan program studi');
  if (kabar.length) tb([['Tanggal', 'Kegiatan', 'Jenis', 'Tempat'], ...kabar.map(k => [tglPendek(k.tanggal), k.judul || '', kapital(k.jenis), k.tempat || ''])]);
  else p('Belum ada kabar kegiatan yang diterbitkan pada periode ini.', true);

  // Karya
  h1('Publikasi');
  if (pub.length) tb([['Judul', 'Terbitan', 'Indeksasi/tingkat', 'Penulis'], ...pub.map(x => [x.judul, x.terbitan || '',
    rapi(x.indeksasi || x.tingkat), (x.penulis || []).map(a => a.nama).join(', ')])]);
  else p('Belum ada publikasi terverifikasi.', true);
  h1('Penelitian dan pengabdian kepada masyarakat');
  if (keg.length) tb([['Judul', 'Jenis', 'Skema', 'Tim'], ...keg.map(k => [k.judul, k.kategori === 'pkm' ? 'PkM' : 'Penelitian',
    k.skema || '', (k.penulis || []).map(a => a.nama).join(', ')])]);
  else p('Belum ada kegiatan terverifikasi.', true);

  if (!publik) {
    h1('Kesiapan akreditasi');
    if (C.NA != null) p(`Perkiraan nilai akreditasi (NA) ${angka(C.NA)}; perkiraan status: ${C.status || '—'}. ` +
      'Perkiraan dari kalkulator skor situs, bukan penilaian asesor.');
    if ((C.langkah || []).length) {
      p('Langkah tercepat menaikkan skor (bukti per unsur berikutnya):');
      tb([['Butir', 'Bukti berikutnya', 'Penanggung jawab', '+ Poin berbobot'],
        ...C.langkah.slice(0, 10).map(x => [String(x.no), `Unsur ${x.n}: ${x.label}`, x.pihak || '', angka(x.naik)])]);
    }
    h1('Catatan dan tindak lanjut');
    const tm = diTS(C.temuan, ts);
    if (tm.length) {
      const sel = tm.filter(x => x.status === 'selesai').length;
      p(`${tm.length} temuan dan peluang peningkatan TS ${ta(ts)} (Data prodi › Temuan AMI), ${sel} selesai.`);
      tb([['Uraian', 'Kategori', 'Penanggung jawab', 'Tenggat', 'Status'], ...tm.map(x => [x.uraian || '', rapi(x.kategori),
        x.pj_nama || x.pihak || '', tglPendek(x.tenggat), rapi(x.status)])]);
    }
    p('[Isi: hasil rapat tinjauan manajemen, rencana tindak lanjut, dan penanggung jawabnya.]', true);
  }
  return out;
}

// ---------------- Render ----------------
/** XML badan dokumen Word dari model. */
export function docxDariBlok(bloks){
  return bloks.map(b => {
    if (b.sampul) return [para(run(b.sampul[0], { b: true, sz: 32 }), { jc: 'center', before: 0, after: 60 }),
      para(run(b.sampul[1], { b: true, sz: 26 }), { jc: 'center', after: 60 }), para(run(b.sampul[2], { sz: 24 }), { jc: 'center', after: 60 }),
      para(run(b.sampul[3], { i: true, sz: 18, warna: '595959' }), { jc: 'center', after: 240 })].join('');
    if (b.h) return judul(b.t, b.h);
    if (b.tabel) return tabel(b.tabel);
    return teks(b.p, b.i ? { i: true } : undefined);
  }).join('');
}

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
/** HTML dari model (halaman publik): sampul tidak ikut (judul halaman sudah ada), judul 1 = h2, judul 2 = h3. */
export function htmlDariBlok(bloks){
  return bloks.map(b => {
    if (b.sampul) return '';
    if (b.h) return b.h === 1 ? `<h2>${esc(b.t)}</h2>` : `<h3>${esc(b.t)}</h3>`;
    if (b.tabel) return `<div class="gulir"><table><thead><tr>${b.tabel[0].map(x => `<th>${esc(x)}</th>`).join('')}</tr></thead><tbody>${
      b.tabel.slice(1).map(r => `<tr>${r.map(x => `<td>${esc(x)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    return `<p${b.i ? ' class="ket"' : ''}>${esc(b.p)}</p>`;
  }).join('\n');
}

/** XML badan dokumen (laporan admin; dipakai tes). */
export const isiLaporan = (C, opsi) => docxDariBlok(susunLaporan(C, opsi));
/** Berkas .docx (Blob). */
export async function buatLaporanTahunan(C, opsi){
  return buatDocx(isiLaporan(C, opsi));
}
/** Pilihan tahun kalender: dari tahun terbaru yang punya data, mundur sampai 5 tahun; tahun ini ditandai berjalan. */
export function pilihanTahun(D, kini = new Date()){
  const now = kini.getFullYear();
  const ada = [...(D.publikasi || []), ...(D.kegiatan || [])].map(x => +x.tahun).filter(Boolean);
  const atas = Math.min(now, Math.max(now - 1, ...ada));
  return Array.from({ length: 5 }, (_, i) => atas - i).map(t => ({ ts: t, label: `${t}${t === now ? ' (berjalan)' : ''}` }));
}
/** Pilihan TS untuk halaman publik: dari TS terbaru yang punya data, mundur sampai 5 TS. */
export function pilihanTS(D, kini = new Date()){
  const berjalan = kini.getMonth() >= 8 ? kini.getFullYear() + 1 : kini.getFullYear();
  const ada = [...(D.publikasi || []), ...(D.kegiatan || []), ...((D.akreditasi || {}).ta || [])].map(x => +x.tahun_ts).filter(Boolean);
  const atas = Math.min(berjalan, Math.max(berjalan - 1, ...ada));
  return Array.from({ length: 5 }, (_, i) => atas - i).map(ts => ({ ts, label: `${ta(ts)}${ts === berjalan ? ' (berjalan)' : ''}` }));
}
